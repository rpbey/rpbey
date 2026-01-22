
import puppeteer from 'puppeteer-extra';
import type { Browser, Page } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

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

  constructor() {
    puppeteer.use(StealthPlugin());
  }

  /**
   * Initialise le navigateur
   */
  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
    });
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
   * @param urlId L'URL complète ou le slug (ex: "fr/B_TS1" ou "B_TS1")
   */
  async scrape(urlId: string): Promise<ScrapedTournament> {
    if (!this.browser) await this.init();
    
    // Normalisation de l'URL
    const slug = urlId.replace('https://challonge.com/', '').replace(/^\//, '');
    const baseUrl = `https://challonge.com/${slug}`;
    const moduleUrl = `${baseUrl}/module`;
    const standingsUrl = `${baseUrl}/standings`;

    console.log(`🔍 Scraping du tournoi : ${slug}`);

    // 1. Récupération des données brutes via le Store (Page Module)
    const storeData = await this.fetchStoreData(moduleUrl);
    
    // 2. Récupération du classement officiel (Page Standings)
    // Utile car le Store contient parfois juste les matchs, pas le calcul final du rang
    let standings = [];
    try {
        standings = await this.fetchStandings(standingsUrl);
    } catch (e) {
        console.warn('⚠️ Impossible de récupérer les standings HTML, calcul basé sur le store uniquement.');
    }

    // 3. Traitement et fusion
    return this.processData(storeData, standings, baseUrl);
  }

  private async fetchStoreData(url: string): Promise<any> {
    const page = await this.browser!.newPage();
    try {
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7' });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Attente pour laisser Cloudflare/React s'hydrater
        await new Promise(r => setTimeout(r, 3000));

        // Extraction sûre via string function
        const data = await page.evaluate(`
            (function() {
                if (window._initialStoreState && window._initialStoreState['TournamentStore']) {
                    return window._initialStoreState['TournamentStore'];
                }
                return null;
            })()
        `);

        if (!data) throw new Error("Store Challonge non trouvé dans la page.");
        return data;
    } finally {
        await page.close();
    }
  }

  private async fetchStandings(url: string): Promise<any[]> {
    const page = await this.browser!.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Extraction du tableau
        const standings = await page.evaluate(`
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
        `) as any[];
        
        return standings || [];
    } catch (e) {
        return [];
    } finally {
        await page.close();
    }
  }

  private processData(storeData: any, standings: any[], url: string): ScrapedTournament {
    const t = storeData.tournament;
    
    // Mapping des participants
    // Le store ne contient pas toujours la liste "participants" à plat facilement accessible
    // On la reconstruit souvent depuis les matchs ou on cherche dans le store
    // Note: Dans B_TS1 JSON, les participants sont dans les objets Matchs.
    
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

    const participants = Array.from(participantsMap.values()).map(p => {
        // Tenter de trouver le rang dans les standings HTML
        const std = standings.find(s => s.name === p.display_name.trim().replace('✅', ''));
        return {
            id: p.id,
            name: p.display_name.trim().replace('✅', ''), // Nettoyage commun
            seed: p.seed,
            finalRank: std ? std.rank : undefined
        };
    });

    const cleanMatches = matches.map(m => ({
        id: m.id,
        identifier: m.identifier,
        round: m.round,
        player1Id: m.player1?.id || null,
        player2Id: m.player2?.id || null,
        winnerId: m.winner_id,
        loserId: m.loser_id,
        scores: m.scores ? m.scores.join('-') : '0-0',
        state: m.state
    }));

    return {
        metadata: {
            id: t.id,
            name: t.name || "Tournoi Importé",
            url: url,
            state: t.state,
            type: t.tournament_type,
            participantsCount: participants.length
        },
        participants: participants.sort((a, b) => (a.finalRank || 999) - (b.finalRank || 999)),
        matches: cleanMatches,
        standings: standings,
        raw: storeData // On garde le brut au cas où
    };
  }
}
