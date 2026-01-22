import type { PrismaClient } from '@prisma/client';
import { PartType, ProductLine, ProductType } from '@prisma/client';
import { log } from 'crawlee';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export interface OfficialProduct {
  code: string;
  name: string;
  productType: string;
  price: number;
  releaseDate?: string;
  url: string;
  isLimited: boolean;
  limitedType?: string;
  bladeName?: string;
  ratchet?: string;
  bit?: string;
  imageUrl?: string;
}

export class TakaraTomyScraper {
  private prisma: PrismaClient;
  private readonly LINEUP_URL = 'https://beyblade.takaratomy.co.jp/beyblade-x/lineup/';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    puppeteer.use(StealthPlugin());
  }

  /**
   * Parse Beyblade name into components
   */
  public parseBeyName(name: string): {
    blade?: string;
    ratchet?: string;
    bit?: string;
  } {
    const cleanName = name
      .replace(/メタルコート:[^\s]+/g, '')
      .replace(/\s*(ブラックVer\.|レッドVer\.|クリアVer\.)/gi, '')
      .trim();

    const match = cleanName.match(/^(.+?)(\d-\d{2})([A-Z]{1,3})$/i);
    if (match?.[1] && match[2] && match[3]) {
      return {
        blade: match[1].trim(),
        ratchet: match[2],
        bit: match[3].toUpperCase(),
      };
    }
    return {};
  }

  /**
   * Scrape and sync the entire lineup using Puppeteer + Cheerio
   */
  public async syncLineup() {
    log.info('📥 Fetching Takara Tomy lineup via Puppeteer Stealth...');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(this.LINEUP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Wait for content to load - "mix" class seems to be the product item
      await page.waitForSelector('.mix');

      const html = await page.content();
      const products: OfficialProduct[] = this.extractProductsFromHtml(html);
      log.info(`📊 Found ${products.length} products to sync.`);

      let updated = 0;
      for (const product of products) {
        try {
          await this.syncProduct(product);
          updated++;
        } catch (error) {
          log.error(`Failed to sync ${product.code}: ${(error as Error).message}`);
        }
      }

      return { total: products.length, updated };
    } finally {
      await browser.close();
    }
  }

  private extractProductsFromHtml(html: string): OfficialProduct[] {
    const $ = cheerio.load(html);
    const products: OfficialProduct[] = [];

    $('li.mix').each((_, el) => {
      const $el = $(el);
      const $link = $el.find('a').first(); // Le lien principal
      const url = $link.attr('href') || '';
      
      // b contient "BX-01<span>Nom</span>"
      // On clone pour retirer le span et avoir juste le code
      const $b = $link.find('b').clone();
      const name = $b.find('span').text().trim();
      $b.find('span').remove();
      const code = $b.text().trim(); 
      
      const productTypeStr = $link.find('.category span').text().trim();
      
      // Price parsing
      const priceText = $link.find('i').first().text().replace(/[^\d]/g, '');
      const price = parseInt(priceText, 10) || 0;

      // Date parsing: Handle YYYY.M.D and YYYY年M月D日
      let releaseDate = undefined;
      const dateText = $link.find('.red').text().replace(/発売/g, '').trim();
      
      // Format 1: 2023.7.15
      if (dateText.includes('.')) {
        releaseDate = dateText.replace(/\./g, '-');
      } 
      // Format 2: 2025年12月12日
      else if (dateText.includes('年')) {
        const y = dateText.match(/(\d{4})年/)?.[1];
        const m = dateText.match(/(\d{1,2})月/)?.[1];
        const d = dateText.match(/(\d{1,2})日/)?.[1];
        if (y && m && d) {
            releaseDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }

      // Image
      const imageUrl = $link.find('img').attr('src');

      if (!code || !name) return;

      const isLimited = name.includes('限定') || productTypeStr.includes('限定');
      const { blade, ratchet, bit } = this.parseBeyName(name);

      products.push({
        code,
        name,
        productType: productTypeStr || 'OTHER',
        price,
        releaseDate,
        url,
        isLimited,
        limitedType: isLimited ? 'Limited' : undefined,
        bladeName: blade,
        ratchet,
        bit,
        imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://beyblade.takaratomy.co.jp${imageUrl}`) : undefined
      });
    });

    return products;
  }

  private async syncProduct(item: OfficialProduct) {
    const typeMapping: Record<string, ProductType> = {
      'スターター': ProductType.STARTER,
      'ブースター': ProductType.BOOSTER,
      'ランダムブースター': ProductType.RANDOM_BOOSTER,
      'セット': ProductType.SET,
      'カスタマイズセット': ProductType.SET,
      'ダブルスターター': ProductType.DOUBLE_STARTER,
      'ツール': ProductType.TOOL,
    };

    let line: ProductLine = ProductLine.BX;
    if (item.code.startsWith('UX')) line = ProductLine.UX;
    if (item.code.startsWith('CX')) line = ProductLine.CX;

    const isValidDate = item.releaseDate && !isNaN(new Date(item.releaseDate).getTime());

    await this.prisma.product.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        price: item.price,
        releaseDate: isValidDate ? new Date(item.releaseDate!) : undefined,
        isLimited: item.isLimited,
        limitedNote: item.limitedType,
        imageUrl: item.imageUrl,
        productUrl: item.url.startsWith('http') ? item.url : `https://beyblade.takaratomy.co.jp${item.url}`,
      },
      create: {
        code: item.code,
        name: item.name,
        productType: typeMapping[item.productType] || ProductType.BOOSTER,
        productLine: line,
        price: item.price,
        releaseDate: isValidDate ? new Date(item.releaseDate!) : undefined,
        isLimited: item.isLimited,
        limitedNote: item.limitedType,
        imageUrl: item.imageUrl,
        productUrl: item.url.startsWith('http') ? item.url : `https://beyblade.takaratomy.co.jp${item.url}`,
      },
    });
  }
}