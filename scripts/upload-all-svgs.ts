import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import sharp from 'sharp';
import { Readable } from 'stream';

async function uploadAllSvgs() {
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  const FOLDER_ID = '1G2rl1vPVN20eL6-1CcSSJ6unys6rcxBM';
  
  // Use ADC
  const auth = new GoogleAuth({
    scopes: SCOPES,
  });

  const service = google.drive({ version: 'v3', auth });
  const publicDir = path.join(process.cwd(), 'public');

  // Find all SVG files
  const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.svg'));

  if (files.length === 0) {
    console.log('No SVG files found in public directory.');
    return;
  }

  console.log(`Found ${files.length} SVG files: ${files.join(', ')}`);

  for (const fileName of files) {
    const filePath = path.join(publicDir, fileName);
    const pngFileName = fileName.replace('.svg', '.png');
    
    // Convert and compress with sharp
    // Density 300 ensures high quality rasterization from SVG before resizing
    const pngBuffer = await sharp(filePath, { density: 300 })
      .resize(256, 256, { 
        fit: 'inside',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png({ 
        quality: 90, 
        compressionLevel: 9 
      })
      .toBuffer();

    const requestBody = {
      name: pngFileName,
      parents: [FOLDER_ID],
      fields: 'id, webViewLink, webContentLink',
    };

    const media = {
      mimeType: 'image/png',
      body: Readable.from(pngBuffer),
    };

    try {
      console.log(`Uploading ${pngFileName} (converted from ${fileName})...`);
      const file = await service.files.create({
        requestBody,
        media: media,
      });
      
      console.log(`✅ ${pngFileName} Uploaded! ID: ${file.data.id}`);
    } catch (err) {
      console.error(`❌ Error uploading ${pngFileName}:`, err);
    }
  }
}

uploadAllSvgs();
