import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://bey-library.vercel.app';
const CONCURRENCY_LIMIT = 20; // Nombre de requêtes simultanées
const OUTPUT_DIR = 'data/bey-library';
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// Assurons-nous que les dossiers existent
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

interface PartData {
  id: string;
  category: string;
  name: string;
  code: string;
  specs: Record<string, string>;
  imageUrl: string;
  localImagePath: string;
  sourceUrl: string;
}

async function downloadImage(url: string, filename: string): Promise<string | null> {
  if (!url) return null;
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const filePath = path.join(IMAGES_DIR, filename);

  if (fs.existsSync(filePath)) {
    // Déjà téléchargé
    return filePath;
  }

  try {
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    
    const fileStream = fs.createWriteStream(filePath, { flags: 'wx' });
    // @ts-ignore
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return filePath;
  } catch (err) {
    console.error(`Error downloading image ${fullUrl}:`, err);
    return null;
  }
}

async function scrapeProductPage(url: string, category: string): Promise<PartData | null> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const name = $('h1').text().trim();
    // Le code est souvent dans le paragraphe suivant le h1 avec text-2xl
    const code = $('h1').next('p.text-2xl').text().trim();
    
    // Image
    // On cherche l'image principale
    let imgUrl = $('.aspect-square img').attr('src') || '';
    
    // Specs
    const specs: Record<string, string> = {};
    $('.grid.grid-cols-2 .flex.flex-col').each((_, el) => {
      const label = $(el).find('span.text-muted-foreground').text().trim();
      const value = $(el).find('span.font-medium').text().trim();
      if (label && value) {
        specs[label] = value;
      }
    });

    const id = url.split('/').pop() || name;
    
    // Téléchargement Image
    let localImagePath = '';
    if (imgUrl) {
        const ext = path.extname(imgUrl) || '.webp';
        // Nettoyage du nom de fichier
        const safeName = `${category}-${code}-${name}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeName}${ext}`;
        await downloadImage(imgUrl, filename);
        localImagePath = `images/${filename}`;
    }

    return {
      id,
      category,
      name,
      code,
      specs,
      imageUrl: imgUrl,
      localImagePath,
      sourceUrl: url
    };

  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function getCategoryLinks(category: string): Promise<string[]> {
  const url = `${BASE_URL}/category/${category}`;
  console.log(`Scanning category: ${category}...`);
  
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const links = new Set<string>();
  $('a[href^="/product/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes(`/${category}/`)) {
      links.add(`${BASE_URL}${href}`);
    }
  });

  return Array.from(links);
}

async function main() {
  const categories = ['blade', 'ratchet', 'bit'];
  const allParts: PartData[] = [];

  for (const cat of categories) {
    const links = await getCategoryLinks(cat);
    console.log(`Found ${links.length} items in ${cat}. Starting download...`);

    // Process in chunks to limit concurrency
    for (let i = 0; i < links.length; i += CONCURRENCY_LIMIT) {
      const chunk = links.slice(i, i + CONCURRENCY_LIMIT);
      const promises = chunk.map(link => scrapeProductPage(link, cat));
      const results = await Promise.all(promises);
      
      results.forEach(p => {
        if (p) {
            allParts.push(p);
            process.stdout.write('.');
        }
      });
    }
    console.log(`
Finished ${cat}.
`);
  }

  const jsonPath = path.join(OUTPUT_DIR, 'bey-library.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allParts, null, 2));
  console.log(`
🎉 DONE! Scraped ${allParts.length} parts.`);
  console.log(`Data saved to ${jsonPath}`);
  console.log(`Images saved to ${IMAGES_DIR}`);
}

main();
