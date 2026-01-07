# Competitive Resources Deep Dive

## 1. Challonge & Tournament Structure
**Example:** [B_TS1 (Bey-Tamashii Series #1)](https://challonge.com/fr/B_TS1) (Access Restricted/Private)

While specific details for "B_TS1" were restricted, general analysis of high-level Beyblade X tournaments on Challonge reveals:
*   **Format:** Typically **Double Elimination** or **Swiss** rounds followed by a Top cut.
*   **Settings:**
    *   *Match Scoring:* First to 7 points (typical WBO format) or 5 points (Takara Tomy format).
    *   *Deck Format:* 3-on-3 battles where order is secret or fixed.
*   **Data Structure:**
    *   `Participant`: Name, Seed, Final Rank.
    *   `Match`: Player 1, Player 2, Score (e.g., "7-5"), Winner, Round.
    *   *Integration:* Challonge API v1 allows fetching these details. The "Module" view (`/module`) often provides a simplified, embeddable bracket perfect for dashboards.

## 2. World Beyblade Organization (WBO)
**Website:** [worldbeyblade.org](https://worldbeyblade.org/)
**Role:** Global governing body for fan tournaments outside Asia.

*   **Ranking System:**
    *   **Platform:** Hosted on **Challonge** (Partnered).
    *   **Seasonal Rankings:** "Beyblade X Season 0" tracks global player performance.
    *   **Point System:** Likely ELO-based or weighted wins based on tournament size and opponent rank.
*   **Tournament Standards:**
    *   **Clauses:** Strict rules on part legality (e.g., no broken parts, specific mold variations).
    *   **Play Area:** Standardized Stadiums (Xtreme Stadium).
*   **Integration for RPB:**
    *   Since WBO uses Challonge, RPB can technically "sync" with WBO events if organizers provide the API key or if the tournament is public.
    *   *Action:* Use the Challonge API to pull "Global Rank" if WBO exposes a specific leaderboard endpoint (unlikely public API, usually HTML scraping or manual entry).

## 3. BeyBase (Meta Analysis)
**Website:** [beybase.com](https://beybase.com/)
**Focus:** Deep technical analysis, winning combos, and event reports.

*   **Meta Insights (Current Trends):**
    *   **Stamina/Defense Dominance:** *Wizard Rod* is the meta-defining blade (high stamina, circular shape).
        *   *Combo:* `Wizard Rod 9-60 Ball/Hexa` (High burst resistance, max stamina).
    *   **Attack Counters:** *Shark Edge* and *Dran Buster* are used to KO stamina types before they stabilize.
        *   *Combo:* `Shark Edge 3-60 Low Flat` (Aggressive low attacks).
    *   **Ratchet Meta:** `x-60` heights (Low) are preferred to minimize exposure to ratchet strikes (Burst risk). `5-60`, `9-60`, and `3-60` are staples.
    *   **Bit Meta:** `Ball` (Stamina), `Point` (Balance), `Rush`/`Flat` (Attack).
*   **Data for RPB:**
    *   *Reports:* Detailed tournament reports list Top 3 Winning Decks.
    *   *Usage:* RPB can curate a "Meta Snapshot" or "Tier List" based on these reports manually, as BeyBase does not offer an API.

## Summary for RPB Development
1.  **Challonge Integration:** Essential. Continue using the API to fetch brackets. The "Module" URL `https://challonge.com/tournaments/{id}/module` is a lightweight way to embed brackets.
2.  **Meta Tracking:** RPB's `Part` model should include tags like `meta-tier` or `usage-rate` (S-Tier, A-Tier) inspired by BeyBase analysis.
3.  **WBO Alignment:** Adopt WBO scoring conventions (e.g., 7 points) as defaults for tournament creation to ensure RPB tournaments feel "official".
