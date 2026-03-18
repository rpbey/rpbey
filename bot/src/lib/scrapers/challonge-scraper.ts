/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';

import type { Browser, CookieParam } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { resolveRootPath } from '../paths.js';

// Activation du plugin Stealth
(puppeteerExtra as any).use(StealthPlugin());

// Chemin par défaut du fichier de cookies
const DEFAULT_COOKIE_PATH = resolveRootPath('challonge_cookie.json');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapedStanding {
  rank: number;
  name: string;
  challongeUsername?: string;
  challongeProfileUrl?: string;
  wins: number;
  losses: number;
  /** Ratio W/L brut ou toute stat supplémentaire */
  stats: any;
}

export interface ScrapedStation {
  stationId: number | string;
  name: string;
  /** Match en cours sur cette station */
  currentMatch?: {
    matchId: number;
    identifier: string;
    round: number;
    player1: string | null;
    player2: string | null;
    scores: string;
    state: string;
  } | null;
  status: 'idle' | 'active' | 'paused';
}

export interface ScrapedLogEntry {
  timestamp: string;
  type: string;
  message: string;
  /** Données brutes de l'entrée */
  raw?: any;
}

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
    challongeUsername?: string;
    challongeProfileUrl?: string;
    finalRank?: number;
  }>;
  matches: Array<{
    id: number;
    identifier: string;
    round: number;
    player1Id: number | null;
    player2Id: number | null;
    winnerId: number | null;
    loserId: number | null;
    scores: string;
    state: string;
  }>;
  standings: ScrapedStanding[];
  stations: ScrapedStation[];
  log: ScrapedLogEntry[];
  raw: any;
}

// ─── Scraper ─────────────────────────────────────────────────────────────────

export class ChallongeScraper {
  private browser: Browser | null = null;
  private cookies: CookieParam[] = [];

  constructor(cookiePath?: string) {
    this.cookies = this.loadCookies(cookiePath ?? DEFAULT_COOKIE_PATH);
  }

  // ── Cookie Management ────────────────────────────────────────────────────

  private loadCookies(filePath: string): CookieParam[] {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        expires: string | null;
        httpOnly: boolean;
        secure: boolean;
        sameSite: string;
      }>;

      return raw
        .filter((c) => c.domain.includes('challonge.com'))
        .map((c) => {
          const cookie: CookieParam = {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            httpOnly: c.httpOnly,
            secure: c.secure,
            sameSite: (c.sameSite === 'None'
              ? 'None'
              : c.sameSite === 'Lax'
                ? 'Lax'
                : 'Strict') as CookieParam['sameSite'],
          };
          if (c.expires && c.expires !== 'Session') {
            cookie.expires = Math.floor(new Date(c.expires).getTime() / 1000);
          }
          return cookie;
        });
    } catch (err) {
      console.warn(
        `⚠️ Impossible de charger les cookies depuis ${filePath}:`,
        err,
      );
      return [];
    }
  }

  private async injectCookies(page: any): Promise<void> {
    if (this.cookies.length === 0) return;
    await page.setCookie(...this.cookies);
  }

  // ── Browser Lifecycle ────────────────────────────────────────────────────

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

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Ouvre une page avec cookies + headers FR déjà configurés */
  private async openPage(url: string, timeout = 60000) {
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    await this.injectCookies(page);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout });
    return page;
  }

  /** Extrait le _initialStoreState d'une page Challonge */
  private async extractStore(page: any, storeKey?: string): Promise<any> {
    return page.evaluate(`
      (function() {
        try {
          var store = window._initialStoreState;
          if (!store) return null;
          ${storeKey ? `return store['${storeKey}'] || null;` : 'return store;'}
        } catch(e) { return null; }
      })()
    `);
  }

  // ── Main Scrape ──────────────────────────────────────────────────────────

  /**
   * Scrape un tournoi complet (toutes les pages)
   * @param urlId L'URL complète ou le slug (ex: "fr/B_TS2" ou "B_TS2")
   */
  async scrape(urlId: string): Promise<ScrapedTournament> {
    if (!this.browser) await this.init();

    const slug = urlId.replace('https://challonge.com/', '').replace(/^\//, '');
    const baseUrl = `https://challonge.com/${slug}`;

    console.log(`🔍 Scraping du tournoi : ${slug}`);

    // 1. Store principal (matchs + metadata) — /module
    const storeData = await this.fetchStoreData(`${baseUrl}/module`);

    // 2. Participants — /participants
    let participantsPageData: any[] = [];
    try {
      participantsPageData = await this.fetchParticipants(
        `${baseUrl}/participants`,
      );
      console.log(
        `👥 ${participantsPageData.length} participants depuis /participants`,
      );
    } catch {
      console.warn('⚠️ /participants inaccessible, fallback store.');
    }

    // 3. Standings enrichis (rang, W/L, profil Challonge) — /standings
    let standings: ScrapedStanding[] = [];
    try {
      standings = await this.fetchStandings(`${baseUrl}/standings`);
      console.log(`🏅 ${standings.length} standings récupérés`);
    } catch {
      console.warn('⚠️ /standings inaccessible.');
    }

    // 4. Stations en temps réel — /stations
    let stations: ScrapedStation[] = [];
    try {
      stations = await this.fetchStations(`${baseUrl}/stations`);
      console.log(`📡 ${stations.length} stations récupérées`);
    } catch {
      console.warn('⚠️ /stations inaccessible.');
    }

    // 5. Log d'activité — /log
    let log: ScrapedLogEntry[] = [];
    try {
      log = await this.fetchLog(`${baseUrl}/log`);
      console.log(`📜 ${log.length} entrées de log récupérées`);
    } catch {
      console.warn('⚠️ /log inaccessible.');
    }

    // 6. Fusion
    return this.processData(
      storeData,
      participantsPageData,
      standings,
      stations,
      log,
      baseUrl,
    );
  }

  // ── Page Fetchers ────────────────────────────────────────────────────────

  /** /module — Store principal (matchs, metadata, bracket) */
  private async fetchStoreData(url: string): Promise<any> {
    const page = await this.openPage(url);
    try {
      await new Promise((r) => setTimeout(r, 5000));

      const data = await this.extractStore(page, 'TournamentStore');
      if (!data)
        throw new Error(
          'Store Challonge non trouvé. Possible blocage Cloudflare.',
        );
      return data;
    } finally {
      await page.close();
    }
  }

  /**
   * /participants — Liste complète des participants
   *
   * La page Challonge monte un composant React sur #participant-management.
   * Les données du tournoi sont dans les attributs data-tournament / data-rankings.
   * La liste effective des participants est rendue côté client par le bundle React.
   *
   * Stratégie :
   *  1. Extraire data-tournament + data-rankings depuis le HTML serveur
   *  2. Intercepter les XHR/fetch que le composant React fait au chargement
   *  3. Attendre le rendu React et parser le DOM client
   *  4. Fallback : _initialStoreState si disponible
   */
  private async fetchParticipants(url: string): Promise<any[]> {
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    try {
      await this.injectCookies(page);
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      });

      // Intercepter les réponses JSON qui contiennent les participants
      const interceptedParticipants: any[] = [];
      page.on('response', async (response: any) => {
        try {
          const resUrl: string = response.url();
          if (
            response.status() === 200 &&
            (resUrl.includes('/participants') ||
              resUrl.includes('/tournament') ||
              resUrl.includes('.json')) &&
            response.headers()['content-type']?.includes('json')
          ) {
            const json = await response.json();
            // Les participants peuvent être dans différentes structures
            const arr =
              json?.participants ||
              json?.data?.participants ||
              (Array.isArray(json) ? json : null);
            if (arr?.length > 0) {
              interceptedParticipants.push(...arr);
            }
          }
        } catch {
          // Ignore les réponses non-JSON
        }
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Tentative 1 : data-tournament & data-rankings du HTML serveur
      const serverData = (await page.evaluate(`
        (function() {
          var el = document.getElementById('participant-management');
          if (!el) return null;
          var tournament = null;
          var rankings = null;
          try { tournament = JSON.parse(el.getAttribute('data-tournament') || 'null'); } catch(e) {}
          try { rankings = JSON.parse(el.getAttribute('data-rankings') || 'null'); } catch(e) {}
          return { tournament: tournament, rankings: rankings };
        })()
      `)) as { tournament: any; rankings: any[] } | null;

      if (serverData) {
        console.log(
          '📦 data-tournament trouvé:',
          serverData.tournament?.state,
          '| data-rankings:',
          serverData.rankings?.length ?? 0,
          'entrées',
        );
      }

      // Attendre le rendu React (le composant charge les participants via XHR)
      await new Promise((r) => setTimeout(r, 5000));

      // Tentative 2 : Participants interceptés via XHR
      if (interceptedParticipants.length > 0) {
        console.log(
          `📡 ${interceptedParticipants.length} participants interceptés via XHR`,
        );
        return interceptedParticipants.map((p: any) => {
          // Les réponses API Challonge wrappent souvent dans { participant: {...} }
          const data = p.participant || p;
          return {
            id: data.id,
            display_name: data.display_name || data.name || data.username || '',
            seed: data.seed ?? 0,
            username: data.username || data.challonge_username || null,
            challongeUsername: data.username || data.challonge_username || null,
            challongeProfileUrl: data.username
              ? `https://challonge.com/users/${data.username}`
              : null,
            final_rank: data.final_rank ?? null,
            checked_in: data.checked_in ?? false,
          };
        });
      }

      // Tentative 3 : DOM rendu par React (participant-management)
      const reactParticipants = (await page.evaluate(`
        (function() {
          var container = document.getElementById('participant-management');
          if (!container) return [];

          // Chercher les lignes de participants rendues par React
          // Challonge React utilise des divs/spans avec les noms des joueurs
          var rows = Array.from(container.querySelectorAll(
            'tr, [class*="participant"], [class*="Participant"], [role="row"], li'
          ));

          if (rows.length === 0) return [];

          return rows.map(function(row, i) {
            var text = row.textContent.trim();
            if (!text || text.length < 2) return null;

            // Chercher un lien profil utilisateur
            var link = row.querySelector('a[href*="/users/"]');
            var challongeProfileUrl = link ? link.href : null;
            var challongeUsername = null;
            if (challongeProfileUrl) {
              var parts = challongeProfileUrl.split('/users/');
              challongeUsername = parts.length > 1
                ? parts[1].split('/')[0].split('?')[0]
                : null;
            }

            // Extraire le nom : texte du lien ou premier texte significatif
            var name = link
              ? link.textContent.trim()
              : text.split('\\n')[0].trim();
            // Nettoyer
            name = name.replace(/✅/g, '').replace(/^\\d+\\.?\\s*/, '').trim();
            if (!name || name.length < 2) return null;

            // Chercher le seed (souvent un numéro au début)
            var seedMatch = text.match(/^(\\d+)/);
            var seed = seedMatch ? parseInt(seedMatch[1], 10) : i + 1;

            return {
              display_name: name,
              seed: seed,
              challongeUsername: challongeUsername,
              challongeProfileUrl: challongeProfileUrl
            };
          }).filter(function(x) { return x && x.display_name; });
        })()
      `)) as any[];

      if (reactParticipants?.length > 0) {
        console.log(
          `📄 ${reactParticipants.length} participants extraits depuis le DOM React`,
        );
        return reactParticipants;
      }

      // Tentative 4 : _initialStoreState (fallback classique)
      const store = await this.extractStore(page);
      if (store) {
        const ts = store.TournamentStore;
        const ps = store.ParticipantsStore;
        const candidates =
          ts?.participants ||
          ts?.tournament?.participants ||
          ps?.participants ||
          (Array.isArray(ps) ? ps : null);
        if (candidates?.length > 0) {
          console.log('📦 Participants extraits depuis _initialStoreState');
          return candidates;
        }
      }

      // Tentative 5 : utiliser data-rankings si non vide
      if (serverData?.rankings && serverData.rankings.length > 0) {
        console.log(
          `📊 ${serverData.rankings.length} participants depuis data-rankings`,
        );
        return serverData.rankings;
      }

      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * /standings — Classement enrichi avec mapping utilisateur Challonge
   * Extrait : rang, nom, W/L, lien profil Challonge, username Challonge
   */
  private async fetchStandings(url: string): Promise<ScrapedStanding[]> {
    const page = await this.openPage(url, 45000);
    try {
      await new Promise((r) => setTimeout(r, 3000));

      // Tentative 1 : Store JS (peut contenir des standings structurés)
      const store = await this.extractStore(page);
      if (store) {
        const ts = store.TournamentStore;
        const ss = store.StandingsStore;
        const storeStandings = ss?.standings || ts?.standings;
        if (storeStandings?.length > 0) {
          console.log('📦 Standings extraits depuis le Store JS');
          return storeStandings.map((s: any, i: number) => ({
            rank: s.rank ?? s.final_rank ?? i + 1,
            name: (s.display_name || s.name || '').trim().replace('✅', ''),
            challongeUsername: s.username || s.challonge_username || null,
            challongeProfileUrl: s.username
              ? `https://challonge.com/users/${s.username}`
              : null,
            wins: s.wins ?? s.match_wins ?? 0,
            losses: s.losses ?? s.match_losses ?? 0,
            stats: s,
          }));
        }
      }

      // Tentative 2 : HTML — extraction enrichie du tableau
      const standings = (await page.evaluate(`
        (function() {
          var rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map(function(row) {
            var cells = row.querySelectorAll('td');
            if (cells.length < 2) return null;

            var rank = parseInt(cells[0].innerText.trim().replace('.', ''), 10);

            // Cellule du nom : chercher un lien profil
            var nameCell = cells[1];
            var link = nameCell.querySelector('a[href*="/users/"]');
            var name = nameCell.innerText.trim().replace('✅', '');
            var challongeProfileUrl = link ? link.href : null;
            var challongeUsername = null;
            if (challongeProfileUrl) {
              var parts = challongeProfileUrl.split('/users/');
              challongeUsername = parts.length > 1 ? parts[1].split('/')[0].split('?')[0] : null;
            }

            // Colonnes W/L (positions varient selon le format du tournoi)
            var wins = 0;
            var losses = 0;
            for (var i = 2; i < cells.length; i++) {
              var txt = cells[i].innerText.trim();
              // Chercher un pattern "X - Y" (W-L)
              var wl = txt.match(/^(\\d+)\\s*[-–]\\s*(\\d+)$/);
              if (wl) {
                wins = parseInt(wl[1], 10);
                losses = parseInt(wl[2], 10);
                break;
              }
            }
            // Si pas de W-L groupé, chercher des colonnes séparées
            if (wins === 0 && losses === 0 && cells.length >= 4) {
              var w = parseInt((cells[2] || {}).innerText || '0', 10);
              var l = parseInt((cells[3] || {}).innerText || '0', 10);
              if (!isNaN(w)) wins = w;
              if (!isNaN(l)) losses = l;
            }

            return {
              rank: rank,
              name: name,
              challongeUsername: challongeUsername,
              challongeProfileUrl: challongeProfileUrl,
              wins: wins,
              losses: losses
            };
          }).filter(function(x) { return x && x.name; });
        })()
      `)) as any[];

      return (standings || []).map((s: any) => ({
        ...s,
        stats: { wins: s.wins, losses: s.losses },
      }));
    } catch {
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * /stations — Stations de jeu en temps réel
   * Montre les matchs assignés aux stations physiques pendant un tournoi
   */
  private async fetchStations(url: string): Promise<ScrapedStation[]> {
    const page = await this.openPage(url, 45000);
    try {
      await new Promise((r) => setTimeout(r, 3000));

      // Tentative 1 : Store JS
      const store = await this.extractStore(page);
      if (store) {
        const ts = store.TournamentStore;
        const ss = store.StationsStore;
        const storeStations = ss?.stations || ts?.stations;
        if (storeStations?.length > 0) {
          console.log('📦 Stations extraites depuis le Store JS');
          return storeStations.map((s: any) => ({
            stationId: s.id ?? s.station_id ?? s.number,
            name: s.name || s.label || `Station ${s.number ?? s.id}`,
            currentMatch:
              s.current_match || s.match
                ? {
                    matchId: (s.current_match || s.match)?.id,
                    identifier: (s.current_match || s.match)?.identifier || '',
                    round: (s.current_match || s.match)?.round || 0,
                    player1:
                      (s.current_match || s.match)?.player1?.display_name ||
                      null,
                    player2:
                      (s.current_match || s.match)?.player2?.display_name ||
                      null,
                    scores:
                      ((s.current_match || s.match)?.scores || []).join('-') ||
                      '0-0',
                    state: (s.current_match || s.match)?.state || 'open',
                  }
                : null,
            status:
              s.state === 'active' || s.current_match
                ? 'active'
                : s.state === 'paused'
                  ? 'paused'
                  : 'idle',
          }));
        }
      }

      // Tentative 2 : HTML
      const stations = (await page.evaluate(`
        (function() {
          // Chercher des cartes/blocs de stations
          var stationEls = Array.from(document.querySelectorAll(
            '[class*="station"], [class*="Station"], [data-station], table tbody tr'
          ));
          if (stationEls.length === 0) return [];

          return stationEls.map(function(el, i) {
            var text = el.textContent.trim();
            if (!text) return null;

            // Extraire le nom de la station
            var nameEl = el.querySelector('[class*="name"], [class*="title"], th, td:first-child');
            var name = nameEl ? nameEl.textContent.trim() : 'Station ' + (i + 1);

            // Extraire les joueurs
            var players = el.querySelectorAll('[class*="player"], [class*="participant"]');
            var p1 = players[0] ? players[0].textContent.trim() : null;
            var p2 = players[1] ? players[1].textContent.trim() : null;

            // Extraire le score
            var scoreEl = el.querySelector('[class*="score"], [class*="Score"]');
            var scores = scoreEl ? scoreEl.textContent.trim() : '0-0';

            // Statut : actif si des joueurs sont listés
            var isActive = p1 || p2;

            return {
              stationId: i + 1,
              name: name,
              currentMatch: isActive ? {
                matchId: 0,
                identifier: '',
                round: 0,
                player1: p1,
                player2: p2,
                scores: scores,
                state: 'open'
              } : null,
              status: isActive ? 'active' : 'idle'
            };
          }).filter(function(x) { return x; });
        })()
      `)) as any[];

      return stations || [];
    } catch {
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * /log — Journal d'activité du tournoi
   * Contient les résultats de matchs, check-ins, actions d'admin, etc.
   */
  private async fetchLog(url: string): Promise<ScrapedLogEntry[]> {
    const page = await this.openPage(url, 45000);
    try {
      await new Promise((r) => setTimeout(r, 3000));

      // Tentative 1 : Store JS
      const store = await this.extractStore(page);
      if (store) {
        const ts = store.TournamentStore;
        const ls = store.LogStore || store.ActivityStore;
        const storeLog = ls?.entries || ls?.log || ts?.log || ts?.activity_log;
        if (storeLog?.length > 0) {
          console.log('📦 Log extrait depuis le Store JS');
          return storeLog.map((entry: any) => ({
            timestamp: entry.created_at || entry.timestamp || entry.date || '',
            type: entry.type || entry.action || entry.event_type || 'unknown',
            message:
              entry.message ||
              entry.description ||
              entry.text ||
              JSON.stringify(entry),
            raw: entry,
          }));
        }
      }

      // Tentative 2 : HTML
      const logEntries = (await page.evaluate(`
        (function() {
          // Chercher des éléments de log (liste, tableau, feed)
          var rows = Array.from(document.querySelectorAll(
            'table tbody tr, [class*="log"] li, [class*="activity"] li, [class*="feed"] > div, [class*="Log"] li'
          ));
          if (rows.length === 0) {
            // Fallback : tout le contenu texte structuré
            rows = Array.from(document.querySelectorAll('main li, .content li, article li'));
          }

          return rows.map(function(el) {
            var text = el.textContent.trim();
            if (!text || text.length < 3) return null;

            // Chercher un timestamp
            var timeEl = el.querySelector('time, [class*="time"], [class*="date"], [class*="timestamp"], small');
            var timestamp = timeEl
              ? (timeEl.getAttribute('datetime') || timeEl.textContent.trim())
              : '';

            // Chercher un type/badge
            var badgeEl = el.querySelector('[class*="badge"], [class*="type"], [class*="label"], strong');
            var type = badgeEl ? badgeEl.textContent.trim() : 'activity';

            // Le message = tout le texte sans le timestamp
            var message = text;
            if (timestamp && !timeEl?.getAttribute('datetime')) {
              message = text.replace(timestamp, '').trim();
            }

            return {
              timestamp: timestamp,
              type: type,
              message: message
            };
          }).filter(function(x) { return x && x.message; });
        })()
      `)) as any[];

      return (logEntries || []).map((e: any) => ({ ...e, raw: null }));
    } catch {
      return [];
    } finally {
      await page.close();
    }
  }

  // ── Data Processing ──────────────────────────────────────────────────────

  private processData(
    storeData: any,
    participantsPageData: any[],
    standings: ScrapedStanding[],
    stations: ScrapedStation[],
    log: ScrapedLogEntry[],
    url: string,
  ): ScrapedTournament {
    const t = storeData.tournament;

    const participantsMap = new Map<number, any>();

    // Source 1 : /participants
    if (participantsPageData.length > 0) {
      for (const p of participantsPageData) {
        if (p.id) {
          participantsMap.set(p.id, p);
        }
      }
      console.log(
        `📋 ${participantsMap.size} participants chargés depuis /participants`,
      );
    }

    // Source 2 : matchs du store
    const matches: any[] = [];
    if (storeData.matches_by_round) {
      Object.values(storeData.matches_by_round).forEach((round: any) => {
        round.forEach((m: any) => {
          matches.push(m);
          if (m.player1 && !participantsMap.has(m.player1.id)) {
            participantsMap.set(m.player1.id, m.player1);
          }
          if (m.player2 && !participantsMap.has(m.player2.id)) {
            participantsMap.set(m.player2.id, m.player2);
          }
        });
      });
    }

    // Source 3 : /participants HTML fallback (entrées sans id)
    if (participantsPageData.length > 0 && !participantsPageData[0]?.id) {
      let syntheticId = -1;
      for (const p of participantsPageData) {
        const name = (p.display_name || p.name || '').trim().replace('✅', '');
        const exists = Array.from(participantsMap.values()).some(
          (existing) =>
            (existing.display_name || existing.name || '')
              .trim()
              .replace('✅', '') === name,
        );
        if (!exists && name) {
          participantsMap.set(syntheticId--, {
            id: syntheticId,
            display_name: name,
            seed: p.seed || 0,
            challongeUsername: p.challongeUsername || null,
            challongeProfileUrl: p.challongeProfileUrl || null,
          });
        }
      }
    }

    // Construire la map nom → standing pour enrichir les participants
    const standingsByName = new Map<string, ScrapedStanding>();
    for (const s of standings) {
      standingsByName.set(s.name, s);
    }

    const participants = Array.from(participantsMap.values()).map((p) => {
      const name = (p.display_name || p.name || '').trim().replace('✅', '');
      const std = standingsByName.get(name);
      return {
        id: p.id,
        name,
        seed: p.seed ?? 0,
        // Mapping Challonge : priorité standings > participants page > store
        challongeUsername:
          std?.challongeUsername ||
          p.challongeUsername ||
          p.username ||
          p.challonge_username ||
          undefined,
        challongeProfileUrl:
          std?.challongeProfileUrl ||
          p.challongeProfileUrl ||
          (p.username
            ? `https://challonge.com/users/${p.username}`
            : undefined),
        finalRank: std ? std.rank : (p.final_rank ?? undefined),
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
        name: t.name || 'Tournoi Importé',
        url,
        state: t.state,
        type: t.tournament_type,
        participantsCount: participants.length,
      },
      participants: participants.sort(
        (a, b) => (a.finalRank || 999) - (b.finalRank || 999),
      ),
      matches: cleanMatches,
      standings,
      stations,
      log,
      raw: storeData,
    };
  }
}
