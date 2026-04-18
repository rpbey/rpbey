import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../public/data_bey');
const OUTPUT_FILE = path.join(__dirname, '../public/bey-manifest.json');

interface BeyFile {
  path: string;
  name: string;
  type: 'model' | 'texture' | 'other';
  category: string;
  subcategory?: string;
}

function scanDir(dir: string, rootDir: string): BeyFile[] {
  const files = fs.readdirSync(dir);
  let results: BeyFile[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(scanDir(fullPath, rootDir));
    } else {
      const relativePath = path.relative(rootDir, fullPath);
      const ext = path.extname(file).toLowerCase();
      
      let type: BeyFile['type'] = 'other';
      if (['.obj', '.fbx', '.gltf', '.glb'].includes(ext)) type = 'model';
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) type = 'texture';

      if (type !== 'other') {
        const parts = relativePath.split(path.sep);
        // data_bey/Category/Subcategory/File
        // relativePath starts after data_bey if rootDir is data_bey
        // Actually rootDir passed to recursive calls stays same? No.
        // Let's rely on relative path from public/data_bey
        
        // parts[0] is Category (e.g. "[BX] Blades")
        // parts[1] is Subcategory or file (e.g. "DranSword" or "Texture.png")
        
        results.push({
          path: `/data_bey/${relativePath.replace(/\\/g, '/')}`,
          name: path.basename(file, ext),
          type,
          category: parts[0],
          subcategory: parts.length > 2 ? parts[1] : undefined
        });
      }
    }
  }
  return results;
}

console.log('🔍 Scanning 3D assets...');
if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Directory not found: ${DATA_DIR}`);
    process.exit(1);
}

const allFiles = scanDir(DATA_DIR, DATA_DIR);
const models = allFiles.filter(f => f.type === 'model');
const textures = allFiles.filter(f => f.type === 'texture');

const manifest = {
  stats: {
    totalFiles: allFiles.length,
    models: models.length,
    textures: textures.length
  },
  categories: [...new Set(models.map(m => m.category))],
  models,
  textures
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest generated at ${OUTPUT_FILE}`);
console.log(`   - ${models.length} Models`);
console.log(`   - ${textures.length} Textures`);
