/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Activation du plugin Stealth
(puppeteerExtra as any).use(StealthPlugin());

// Types pour structurer le retour
export interface ScrapedTournament {
  metadata: {
    id: number;
    name: string;
    url: string;
    state: string;
    type: string;
    participantsCount: number;
  };
  participants: Array<{
    id: number;
    name: string;
    seed: number;
    finalRank?: number;
  }>;
  matches: Array<{
    id: number;
    identifier: string; // "A", "1", etc.
    round: number;
    player1Id: number | null;
    player2Id: number | null;
    winnerId: number | null;
    loserId: number | null;
    scores: string; // "3-1"
    state: string;
  }>;
  standings?: Array<{
    rank: number;
    name: string;
    stats: any;
  }>;
  raw: any; // Données brutes pour debug
}

export class ChallongeScraper {
  private browser: Browser | null = null;

  /**
   * Initialise le navigateur
   */
  async init() {
    this.browser = (await (puppeteerExtra as any).launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
    })) as unknown as Browser;
  }

  /**
   * Ferme le navigateur
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape un tournoi complet
   * @param urlId L'URL complète ou le slug (ex: "fr/B_TS2" ou "B_TS2")
   * @param cookiesString Chaîne de cookies optionnelle (format "key=value; key2=value2")
   */
  async scrape(urlId: string, cookiesString?: string): Promise<ScrapedTournament> {
    if (!this.browser) await this.init();

    // Normalisation de l'URL
    const slug = urlId.replace('https://challonge.com/', '').replace(/^\//, '');
    const baseUrl = `https://challonge.com/${slug}`;
    const moduleUrl = `${baseUrl}/module`;
    const standingsUrl = `${baseUrl}/standings`;

    console.log(`🔍 Scraping du tournoi : ${slug}`);

    // 1. Récupération des données brutes via le Store (Page Module)
    const { storeData, pageTitle } = await this.fetchStoreData(moduleUrl, cookiesString);

    // 2. Récupération du classement officiel (Page Standings)
    // Utile car le Store contient parfois juste les matchs, pas le calcul final du rang
    let standings = [];
    try {
      standings = await this.fetchStandings(standingsUrl, cookiesString);
    } catch {
      console.warn(
        '⚠️ Impossible de récupérer les standings HTML, calcul basé sur le store uniquement.',
      );
    }

    // 3. Traitement et fusion
    return this.processData(storeData, standings, baseUrl, pageTitle);
  }

  private async fetchStoreData(url: string, cookiesString?: string): Promise<{ storeData: any, pageTitle: string }> {
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    try {
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        ...(cookiesString ? { Cookie: cookiesString } : {}),
      });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Attente pour laisser Cloudflare/React s'hydrater
      await new Promise((r) => setTimeout(r, 5000));

      const pageTitle = await page.title();

      // Extraction sûre via string function
      const storeData = await page.evaluate(`
            (function() {
                if (window._initialStoreState && window._initialStoreState['TournamentStore']) {
                    return window._initialStoreState['TournamentStore'];
                }
                return null;
            })()
        `);

      if (!storeData) throw new Error('Store Challonge non trouvé dans la page. Possible blocage Cloudflare.');
      return { storeData, pageTitle };
    } finally {
      await page.close();
    }
  }

  private async fetchStandings(url: string, cookiesString?: string): Promise<any[]> {
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    try {
      if (cookiesString) {
        await page.setExtraHTTPHeaders({ Cookie: cookiesString });
      }
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

      // Extraction du tableau
      const standings = (await page.evaluate(`
            (function() {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.map(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 2) return null;
                    const rank = parseInt(cells[0].innerText.trim().replace('.', ''), 10);
                    const name = cells[1].innerText.trim().replace('✅', '');
                    return { rank, name };
                }).filter(x => x);
            })()
        `)) as any[];

      return standings || [];
    } catch {
      return [];
    } finally {
      await page.close();
    }
  }

  private processData(
    storeData: any,
    standings: any[],
    url: string,
    pageTitle: string,
  ): ScrapedTournament {
    const t = storeData.tournament;

    // Use pageTitle to extract name if missing. Title format usually "Name - Challonge"
    const fallbackName = pageTitle.replace(' - Challonge', '').trim();
    const tournamentName = t?.name || fallbackName || 'Tournoi Importé';

    if (!t) {
      console.error('Keys in storeData:', Object.keys(storeData));
      throw new Error('Tournament data missing in store');
    }

    const participantsMap = new Map<number, any>();

    // Récupération depuis les matchs pour être sûr d'avoir tout le monde
    const matches: any[] = [];
    if (storeData.matches_by_round) {
      Object.values(storeData.matches_by_round).forEach((round: any) => {
        round.forEach((m: any) => {
          matches.push(m);
          if (m.player1) participantsMap.set(m.player1.id, m.player1);
          if (m.player2) participantsMap.set(m.player2.id, m.player2);
        });
      });
    }

    const participants = Array.from(participantsMap.values()).map((p) => {
      // Tenter de trouver le rang dans les standings HTML
      const std = standings.find(
        (s) => s.name === p.display_name.trim().replace('✅', ''),
      );
      return {
        id: p.id,
        name: p.display_name.trim().replace('✅', ''), // Nettoyage commun
        seed: p.seed,
        finalRank: std ? std.rank : undefined,
      };
    });

    const cleanMatches = matches.map((m) => ({
      id: m.id,
      identifier: m.identifier,
      round: m.round,
      player1Id: m.player1?.id || null,
      player2Id: m.player2?.id || null,
      winnerId: m.winner_id,
      loserId: m.loser_id,
      scores: m.scores ? m.scores.join('-') : '0-0',
      state: m.state,
    }));

    return {
      metadata: {
        id: t.id,
        name: tournamentName,
        url: url,
        state: t.state,
        type: t.tournament_type,
        participantsCount: participants.length,
      },
      participants: participants.sort(
        (a, b) => (a.finalRank || 999) - (b.finalRank || 999),
      ),
      matches: cleanMatches,
      standings: standings,
      raw: storeData, // On garde le brut au cas où
    };
  }
}
