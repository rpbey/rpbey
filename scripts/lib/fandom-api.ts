/**
 * Fandom Wiki API client — bypasses HTML 403 blocking by using the
 * MediaWiki API directly (api.php). Works with any Fandom wiki.
 *
 * Usage:
 *   import { FandomClient } from './lib/fandom-api.js';
 *   const client = new FandomClient('beyblade');
 *   const images = await client.getPageImages('Gingka_Hagane');
 */

const DEFAULT_HEADERS = {
  'User-Agent': 'RPBDashboard/1.0 (rpbey.fr; bot; fandom wiki client)',
  Accept: 'application/json',
};

interface ImageInfo {
  title: string;
  url: string;
  width: number;
  height: number;
  mime: string;
  size: number;
}

interface SearchResult {
  title: string;
  snippet: string;
  timestamp: string;
}

interface PageInfo {
  title: string;
  pageid: number;
  extract?: string;
  categories?: string[];
  images?: string[];
}

export class FandomClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private rateLimitMs: number;
  private lastRequest = 0;

  constructor(
    wiki: string,
    options?: { rateLimitMs?: number; userAgent?: string },
  ) {
    this.baseUrl = `https://${wiki}.fandom.com/api.php`;
    this.rateLimitMs = options?.rateLimitMs ?? 200;
    this.headers = {
      ...DEFAULT_HEADERS,
      ...(options?.userAgent ? { 'User-Agent': options.userAgent } : {}),
    };
  }

  /** Raw API call with retry and rate limiting */
  async query(params: Record<string, string>): Promise<Record<string, unknown>> {
    // Rate limiting
    const elapsed = Date.now() - this.lastRequest;
    if (elapsed < this.rateLimitMs) {
      await new Promise((r) => setTimeout(r, this.rateLimitMs - elapsed));
    }

    const url = new URL(this.baseUrl);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set('format', 'json');

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        this.lastRequest = Date.now();
        const res = await fetch(url.toString(), { headers: this.headers });
        if (res.status === 429) {
          const wait = 2000 * (attempt + 1);
          console.warn(`  ⏳ Rate limited, waiting ${wait}ms...`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        if (!res.ok) {
          console.warn(`  ⚠ API ${res.status}, retry ${attempt + 1}/3`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return (await res.json()) as Record<string, unknown>;
      } catch (e) {
        console.warn(`  ⚠ Fetch error: ${(e as Error).message}, retry ${attempt + 1}/3`);
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw new Error(`Fandom API failed after 3 attempts: ${url.toString()}`);
  }

  // ── Page queries ──────────────────────────────────────────────────

  /** Get basic page info + extract (intro text) */
  async getPage(title: string): Promise<PageInfo | null> {
    const data = await this.query({
      action: 'query',
      titles: title,
      prop: 'extracts|categories|images',
      exintro: '1',
      explaintext: '1',
      cllimit: '50',
      imlimit: '50',
    });
    const pages = (data.query as Record<string, unknown>)?.pages as
      Record<string, Record<string, unknown>> | undefined;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || (page as Record<string, unknown>).missing !== undefined) return null;

    return {
      title: page.title as string,
      pageid: page.pageid as number,
      extract: page.extract as string | undefined,
      categories: (page.categories as Array<{ title: string }> | undefined)?.map(
        (c) => c.title.replace('Category:', ''),
      ),
      images: (page.images as Array<{ title: string }> | undefined)?.map(
        (i) => i.title,
      ),
    };
  }

  /** Get all images referenced on a page */
  async getPageImages(title: string): Promise<string[]> {
    const data = await this.query({
      action: 'query',
      titles: title,
      prop: 'images',
      imlimit: '500',
    });
    const pages = (data.query as Record<string, unknown>)?.pages as
      Record<string, { images?: Array<{ title: string }> }> | undefined;
    if (!pages) return [];
    return Object.values(pages).flatMap(
      (p) => p.images?.map((i) => i.title) || [],
    );
  }

  // ── Image operations ──────────────────────────────────────────────

  /** Resolve File: titles to full CDN URLs with metadata */
  async resolveImages(fileTitles: string[]): Promise<ImageInfo[]> {
    const results: ImageInfo[] = [];
    // API supports up to 50 titles per request
    for (let i = 0; i < fileTitles.length; i += 50) {
      const batch = fileTitles.slice(i, i + 50);
      const data = await this.query({
        action: 'query',
        titles: batch.join('|'),
        prop: 'imageinfo',
        iiprop: 'url|size|mime',
      });
      const pages = (data.query as Record<string, unknown>)?.pages as
        Record<
          string,
          {
            title?: string;
            imageinfo?: Array<{
              url: string;
              width: number;
              height: number;
              mime: string;
              size: number;
            }>;
          }
        > | undefined;
      if (!pages) continue;
      for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0];
        if (page.title && info) {
          results.push({
            title: page.title,
            url: info.url,
            width: info.width,
            height: info.height,
            mime: info.mime,
            size: info.size,
          });
        }
      }
    }
    return results;
  }

  /** Search for images by keyword in the File: namespace */
  async searchImages(keyword: string, limit = 50): Promise<SearchResult[]> {
    const data = await this.query({
      action: 'query',
      list: 'search',
      srsearch: keyword,
      srnamespace: '6',
      srlimit: String(limit),
    });
    const search = (data.query as Record<string, unknown>)?.search as
      | Array<{ title: string; snippet: string; timestamp: string }>
      | undefined;
    return (
      search?.map((r) => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]+>/g, ''),
        timestamp: r.timestamp,
      })) || []
    );
  }

  /** Find character render images: searches, resolves URLs, filters by size */
  async findCharacterRenders(
    characterName: string,
    options?: { minWidth?: number; minHeight?: number },
  ): Promise<ImageInfo[]> {
    const minW = options?.minWidth ?? 150;
    const minH = options?.minHeight ?? 200;

    // Get images from both the character page and search
    const [pageImages, searchResults] = await Promise.all([
      this.getPageImages(characterName.replace(/ /g, '_')),
      this.searchImages(characterName),
    ]);

    const allTitles = [
      ...new Set([...pageImages, ...searchResults.map((r) => r.title)]),
    ];

    // Filter to likely character renders by filename
    const renderTitles = allTitles.filter((t) => {
      const name = t.toLowerCase();
      // Skip logos, icons, episode screenshots with many characters
      if (name.includes('logo') || name.includes('icon')) return false;
      if (name.includes('episode') && !name.includes(characterName.toLowerCase()))
        return false;
      return true;
    });

    const images = await this.resolveImages(renderTitles);

    // Filter by dimensions (character renders vs tiny thumbnails)
    return images.filter((img) => img.width >= minW && img.height >= minH);
  }

  // ── Search ────────────────────────────────────────────────────────

  /** Full-text search across all content pages */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const data = await this.query({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
    });
    const search = (data.query as Record<string, unknown>)?.search as
      | Array<{ title: string; snippet: string; timestamp: string }>
      | undefined;
    return (
      search?.map((r) => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]+>/g, ''),
        timestamp: r.timestamp,
      })) || []
    );
  }

  /** List pages in a category */
  async getCategoryMembers(
    category: string,
    limit = 50,
  ): Promise<string[]> {
    const data = await this.query({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category.startsWith('Category:')
        ? category
        : `Category:${category}`,
      cmlimit: String(limit),
    });
    const members = (data.query as Record<string, unknown>)
      ?.categorymembers as Array<{ title: string }> | undefined;
    return members?.map((m) => m.title) || [];
  }

  // ── Utility ───────────────────────────────────────────────────────

  /** Build a scaled CDN URL from a full Fandom image URL */
  static scaleUrl(url: string, width = 600): string {
    const base = url.replace(/\/revision\/latest.*$/, '');
    return `${base}/revision/latest/scale-to-width-down/${width}`;
  }

  /** Check if an image URL is accessible */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD', headers: this.headers });
      return res.ok;
    } catch {
      return false;
    }
  }
}
