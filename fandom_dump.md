# Fandom Data Scraping Strategy

## Sources
- **Map**: `scripts/map-fandom.ts` pulls category members.
- **Details**: `scripts/scrape-fandom-details.ts` fetches content & parses Infoboxes.

## Structure
We detected 4 main types of content:
1. **Characters** (`{{Character Infobox}}`): Contains JP Name, Voice Actor, Team, Beyblade.
2. **Beyblades** (`{{Beyblade Infobox}}`): Contains Parts (Blade, Ratchet, Bit), Type, User.
3. **Products** (`{{Product Infobox}}`): Contains Code, Price, Release Date.
4. **Episodes** (`{{Episode Infobox}}`): Contains Air Date, Synopsis.

## Next Steps
To fully populate the "Universe" section:
1. Run `map-fandom.ts` to get full list.
2. Run `scrape-fandom-details.ts` (batch mode) to get all JSONs.
3. Import into a new `WikiPage` model in Prisma or use a dedicated Search Index (Meilisearch/Algolia).

## Key Metadata Extracted
- **Characters**: `JPName`, `Beyblade`, `Team`, `JpVoice`
- **Products**: `ProductCode`, `ReleaseDate`