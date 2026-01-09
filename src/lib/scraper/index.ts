import { v2 } from '@google-cloud/translate';
import {
  CheerioCrawler,
  type CheerioCrawlingContext,
  EnqueueStrategy,
  log,
  PuppeteerCrawler,
  type PuppeteerCrawlingContext,
} from 'crawlee';
import TurndownService from 'turndown';
import type { ScrapedPage, ScraperOptions } from './types.js';

/**
 * Translator service with Google Cloud support
 */
class TranslatorService {
  private client?: v2.Translate;

  constructor() {
    if (
      process.env.GOOGLE_TRANSLATE_API_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      this.client = new v2.Translate();
    }
  }

  async translate(text: string, target: string): Promise<string> {
    if (!this.client || !text || text.length < 5) return text;
    try {
      const [translation] = await this.client.translate(text, target);
      return translation;
    } catch (error) {
      log.error(`Translation failed: ${(error as Error).message}`);
      return `[TRADUCTION ECHOUEE]\n\n${text}`;
    }
  }
}

export class ScraperService {
  private options: ScraperOptions;
  private turndown: TurndownService;
  private translator: TranslatorService;

  constructor(options: ScraperOptions = {}) {
    this.options = {
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      maxRequestsPerCrawl: 20,
      ...options,
    };

    // Configure Turndown for AI-ready Markdown
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
      bulletListMarker: '-',
    });

    // Remove noise elements
    this.turndown.remove([
      'script',
      'style',
      'noscript',
      'iframe',
      'nav',
      'footer',
      'header',
      'aside',
      'svg' as unknown as keyof HTMLElementTagNameMap,
    ]);

    this.translator = new TranslatorService();
  }

  /**
   * Crawl a domain to discover all links using Katana (ProjectDiscovery).
   * robust URL discovery with JS parsing.
   */
  public async mapSite(baseUrl: string): Promise<string[]> {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);
    log.info(`Mapping site with Katana: ${baseUrl}...`);

    try {
      // Katana options:
      // -u: URL
      // -headless: Use headless browser for dynamic content
      // -system-chrome: Use our installed Google Chrome
      // -no-sandbox: Required for root user
      // -d: Depth (recursion level) - Optimized to 2
      // -silent: Output only URLs
      // -ct: Crawl timeout
      const cmd = `katana -u ${baseUrl} -headless -system-chrome -no-sandbox -d 2 -silent -ct 30s`;

      const { stdout } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large sites
      });

      // Filter and dedup
      const urls = stdout
        .split('\n')
        .map((u) => u.trim())
        .filter(
          (u) =>
            u.startsWith('http') &&
            u.includes(new URL(baseUrl).hostname) &&
            !u.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2)$/i),
        );

      return [...new Set(urls)];
    } catch (error) {
      log.error(`Katana mapping failed: ${(error as Error).message}`);
      // Fallback to Puppeteer crawler if Katana fails
      return this.fallbackMapSite(baseUrl);
    }
  }

  /**
   * Fallback crawler using Puppeteer directly if Katana fails
   */
  private async fallbackMapSite(baseUrl: string): Promise<string[]> {
    const urls = new Set<string>();
    const crawler = new PuppeteerCrawler({
      launchContext: this.getLaunchContext(),
      maxRequestsPerCrawl: 50,
      requestHandler: async ({ request, enqueueLinks }) => {
        urls.add(request.url);
        await enqueueLinks({ strategy: EnqueueStrategy.SameDomain });
      },
    });
    await crawler.run([baseUrl]);
    return Array.from(urls);
  }

  /**
   * Scrape specific URLs, extract data, and translate.
   */
  public async scrape(
    urls: string[],
    targetLang = 'fr',
  ): Promise<ScrapedPage[]> {
    const results: ScrapedPage[] = [];

    if (this.options.useCheerio) {
      log.info(`Scraping ${urls.length} URLs with Cheerio (Fast mode)...`);
      const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: this.options.maxRequestsPerCrawl,
        maxConcurrency: 10,
        requestHandler: async (context) => {
          const result = await this.handlePageCheerio(context, targetLang);
          if (result) results.push(result);
        },
      });
      await crawler.run(urls);
    } else {
      log.info(`Scraping ${urls.length} URLs with Puppeteer (JS mode)...`);
      const crawler = new PuppeteerCrawler({
        launchContext: this.getLaunchContext(),
        maxRequestsPerCrawl: this.options.maxRequestsPerCrawl,
        maxConcurrency: 5,
        requestHandler: async (context) => {
          const result = await this.handlePage(context, targetLang);
          if (result) results.push(result);
        },
        failedRequestHandler: ({ request }) => {
          log.error(`Request failed: ${request.url}`);
        },
      });
      await crawler.run(urls);
    }

    return results;
  }

  private async handlePageCheerio(
    { $, request, log }: CheerioCrawlingContext,
    targetLang: string,
  ): Promise<ScrapedPage | null> {
    log.info(`Processing (Cheerio): ${request.url}`);

    try {
      const title = $('title').text();
      const html = $('body').html() || '';
      const lang = $('html').attr('lang') || 'ja';

      const metadata: Record<string, string> = {
        description:
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          '',
        image: $('meta[property="og:image"]').attr('content') || '',
        siteName: $('meta[property="og:site_name"]').attr('content') || '',
      };

      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href?.startsWith('http')) links.push(href);
      });

      const markdown = this.turndown.turndown(html);
      let translatedMarkdown = markdown;

      if (targetLang !== lang && lang.startsWith('ja')) {
        translatedMarkdown = await this.translator.translate(
          markdown,
          targetLang,
        );
      }

      // Basic product detection
      let product: ScrapedPage['product'] | undefined;
      const productMatch = title.match(/((?:BX|UX|CX)-\d{2,3})/);
      if (productMatch) {
        const parts = title.split('|');
        product = {
          code: productMatch[1] || '',
          name: (parts[0] || 'Unknown').trim(),
          isLimited: html.includes('限定'),
          type: html.includes('スターター') ? 'STARTER' : 'BOOSTER',
        };
      }

      return {
        url: request.url,
        title,
        language: lang,
        markdown,
        translatedMarkdown,
        links: [...new Set(links)],
        product,
        metadata,
      };
    } catch (error) {
      log.error(`Error processing ${request.url}: ${(error as Error).message}`);
      return null;
    }
  }

  private getLaunchContext() {
    return {
      useChrome: true,
      launchOptions: {
        headless: true, // Defaults to 'new' in Puppeteer >= 22
        executablePath: this.options.executablePath || '/usr/bin/google-chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Critical for Docker/VPS
          '--disable-gpu', // Critical for non-GPU VPS
          '--disable-accelerated-2d-canvas',
          '--disable-gpu-sandbox',
          '--lang=ja-JP', // Emulate a Japanese browser for Takara Tomy
        ],
      },
    };
  }

  private async handlePage(
    { page, request, log }: PuppeteerCrawlingContext,
    targetLang: string,
  ): Promise<ScrapedPage | null> {
    log.info(`Processing: ${request.url}`);

    try {
      // 1. Wait for content
      await page.waitForSelector('body', { timeout: 30000 });

      // 2. Extract HTML only (Safe)
      const html = await page.content();
      const title = await page.title();
      const lang = await page.evaluate(() => document.documentElement.lang || 'ja');

      // 3. Convert to Markdown
      const markdown = this.turndown.turndown(html);

      // 4. Translate if needed
      let translatedMarkdown = markdown;
      if (targetLang !== lang && lang.startsWith('ja')) {
        translatedMarkdown = await this.translator.translate(
          markdown,
          targetLang,
        );
      }

      return {
        url: request.url,
        title,
        language: lang,
        markdown,
        translatedMarkdown,
        links: [], // Links are not needed for single page sync
        html, // Important: We return raw HTML for the parser
        metadata: {},
      };
    } catch (error) {
      log.error(`Error processing ${request.url}: ${(error as Error).message}`);
      return null;
    }
  }
}
