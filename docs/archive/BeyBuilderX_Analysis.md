# BeyBuilderX Analysis

## Overview
**Repository:** [fabelavalon/BeyBuilderX](https://github.com/fabelavalon/BeyBuilderX)
**Purpose:** Beyblade X Stat Tracker & Random Build Generator.
**Tech Stack:** Pure JavaScript (Vanilla), HTML, CSS.
**Data Storage:** IndexedDB (Client-side browser storage).

## Features
1.  **Build Generator:**
    *   Randomizer: Selects random parts if none are chosen.
    *   Manual Selection: Dropdowns for Blades, Ratchets, and Bits.
2.  **Stat Tracking:**
    *   Tracks Wins/Losses/Draws for specific builds.
    *   Detailed match history (Matchup History) between two specific builds.
    *   Breakdown of win types: Over Finish, KO, Spin Finish, Burst Finish, Xtreme Finish.
3.  **Data Management:**
    *   Stores generated Beyblades in a local "Database" (IndexedDB).
    *   "Clear Database" and "Clear Records" functions.
    *   Manual edit mode for adjusting stats.

## Data Structure (`parts.js`)
The project uses static arrays in a `parts.js` file to define component data.

**Example Structure (inferred):**
```javascript
const blades = [
  {
    name: "DranSword",
    id: "blade_01",
    spin: "Right",
    system: "BX", // Basic Line
    // ... potentially other stats like weight/height if tracked
  },
  // ...
];

const ratchets = [
  { name: "3-60", id: "ratchet_01", height: 60, protrusions: 3 },
  // ...
];

const bits = [
  { name: "Flat", id: "bit_01", type: "Attack" },
  // ...
];
```

## Comparison with RPB Dashboard

| Feature | BeyBuilderX | RPB Dashboard (Current) |
| :--- | :--- | :--- |
| **Architecture** | Client-side (Vanilla JS) | Server-side (Next.js 16 + Prisma) |
| **Database** | IndexedDB (Local only) | PostgreSQL (Cloud/Shared) |
| **Auth** | None (Local device) | Better Auth (Discord/Google) |
| **Scope** | Single User Tracker | Community Management & Tournaments |
| **Data Source** | Static JS file (`parts.js`) | Database (`Part` model) |

## Key Takeaways for RPB
1.  **Stat Granularity:** BeyBuilderX tracks specific win conditions (Burst, Spin, Xtreme, Over). RPB currently tracks generic Wins/Losses. Adding these fields to `TournamentMatch` would enhance the depth of data.
2.  **Deck/Combo History:** BeyBuilderX saves specific combinations. RPB has a `Deck` model, but ensuring it captures the exact "snapshot" of a combo used in a match (as BeyBuilderX implies) is crucial for meta analysis.
3.  **Offline Capability:** BeyBuilderX works offline via IndexedDB. RPB is server-dependent.

## Integration Potential
*   **Fork/Adapt:** The logic for random generation and part validation from BeyBuilderX could be adapted into a React component for RPB's "Random Deck" feature if planned.
*   **Data Import:** If `parts.js` is up-to-date, it could be a source for seeding the RPB database, though RPB likely needs a more robust schema.
