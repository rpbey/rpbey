/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Browser, type CookieParam } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

(puppeteerExtra as any).use(StealthPlugin());
const DEFAULT_COOKIE_PATH = resolve(
  process.cwd(),
  'storage/cookies/challonge_cookie.json',
);

export interface ScrapedStanding {
  rank: number;
  name: string;
  portraitUrl?: string;
}
export interface ScrapedTournament {
  metadata: any;
  participants: any[];
  matches: any[];
  standings: ScrapedStanding[];
  raw: any;
  stations?: any[];
  log?: any[];
}

export class ChallongeScraper {
  private browser: Browser | null = null;
  private cookies: CookieParam[] = [];
  constructor(cookiePath?: string) {
    this.cookies = this.loadCookies(cookiePath ?? DEFAULT_COOKIE_PATH);
  }
  private loadCookies(filePath: string): CookieParam[] {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
      return raw
        .filter((c: any) => c.domain.includes('challonge.com'))
        .map((c: any) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite || 'Lax',
        }));
    } catch {
      return [];
    }
  }
  async init() {
    this.browser = await (puppeteerExtra as any).launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  async close() {
    if (this.browser) await this.browser.close();
    this.browser = null;
  }

  async scrape(urlId: string): Promise<ScrapedTournament> {
    if (!this.browser) await this.init();
    const slug = urlId.replace('https://challonge.com/', '').replace(/^\//, '');
    const baseUrl = `https://challonge.com/${slug}`;
    const page = await this.browser?.newPage();
    if (!page) throw new Error('Failed to create a new page');
    if (this.cookies.length > 0) await page.setCookie(...this.cookies);

    console.log(`🔍 Scraping : ${slug}`);
    await page.goto(`${baseUrl}/module`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Extraction massive de toutes les sources de données possibles dans la page
    const data = await page.evaluate(() => {
      const store = (window as any)._initialStoreState || {};
      const participantsStore = store.ParticipantsStore?.participants || [];
      const tournamentStoreParts =
        store.TournamentStore?.tournament?.participants || [];

      // On fusionne les deux sources de participants pour avoir les noms ET les rangs
      const pMap = new Map();

      // Source 1: ParticipantsStore
      if (participantsStore && Array.isArray(participantsStore)) {
        participantsStore.forEach((p) => {
          pMap.set(p.id, { ...p });
        });
      }

      // Source 2: TournamentStore (Fallback ou complétion)
      if (tournamentStoreParts && Array.isArray(tournamentStoreParts)) {
        tournamentStoreParts.forEach((p) => {
          const existing = pMap.get(p.id) || {};
          pMap.set(p.id, { ...existing, ...p });
        });
      }

      const participants = Array.from(pMap.values()).map((p) => ({
        id: p.id,
        name: p.display_name || p.name || p.username,
        portraitUrl: p.portrait_url || p.attached_participant_portrait_url,
        finalRank: p.final_rank || p.rank || null,
      }));

      const matches: any[] = [];
      const rounds = store.TournamentStore?.matches_by_round || {};
      Object.entries(rounds).forEach(
        ([roundNum, roundMatches]: [string, any]) => {
          if (Array.isArray(roundMatches)) {
            roundMatches.forEach((m: any) => {
              matches.push({
                id: m.id,
                round: m.round || parseInt(roundNum, 10),
                player1Id: m.player1_id,
                player2Id: m.player2_id,
                winnerId: m.winner_id,
                scores: (m.scores || []).join('-') || m.scores_csv,
                state: m.state,
              });
            });
          }
        },
      );

      const standings = participants
        .filter((p) => p.finalRank && p.finalRank !== 999)
        .map((p) => ({
          rank: p.finalRank,
          name: p.name,
          portraitUrl: p.portraitUrl,
        }))
        .sort((a, b) => a.rank - b.rank);

      return {
        metadata: {
          id: store.TournamentStore?.tournament?.id,
          name: document.title.split(' - ')[0],
        },
        participants,
        matches,
        standings,
      };
    });

    await page.close();
    return {
      ...data,
      raw: {},
      metadata: { ...data.metadata, url: baseUrl },
      stations: [],
      log: [],
    } as any;
  }
}
