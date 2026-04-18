import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function generateRolePngs() {
  const publicDir = path.join(process.cwd(), 'public');
  const files = ['logo-admin.svg', 'logo-modo.svg', 'logo-rh.svg', 'logo-staff.svg'];

  console.log(`Processing ${files.length} SVG files...`);

  for (const fileName of files) {
    const filePath = path.join(publicDir, fileName);
    if (!await Bun.file(filePath).exists()) {
        console.warn(`File not found: ${filePath}`);
        continue;
    }
    
    const pngFileName = fileName.replace('.svg', '.png');
    const outputPath = path.join(publicDir, pngFileName);
    
    try {
      await sharp(filePath, { density: 300 })
        .resize(64, 64, { 
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${pngFileName}`);
    } catch (err) {
      console.error(`❌ Error converting ${fileName}:`, err);
    }
  }
}

generateRolePngs();
