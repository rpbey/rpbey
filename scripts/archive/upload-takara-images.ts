/**
 * RPB - Upload Takara Tomy Images to Google Drive
 * Reads data/takaratomy-products.json and uploads images to Drive.
 */

import fs from 'fs/promises';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { fetch } from 'undici';
import { Readable } from 'stream';

const DATA_FILE = 'data/takaratomy-products.json';
const FOLDER_ID = '1G2rl1vPVN20eL6-1CcSSJ6unys6rcxBM'; // Using same folder as upload-all-svgs.ts

interface Product {
  code: string;
  name: string;
  imageUrl: string;
}

async function main() {
  console.log('🚀 Starting Takara Image Upload...');

  // 1. Read Data
  let products: Product[] = [];
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    products = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${DATA_FILE}`, error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products.`);

  // 2. Setup Google Drive
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  const auth = new GoogleAuth({
    scopes: SCOPES,
  });
  const drive = google.drive({ version: 'v3', auth });

  // 3. Process each product
  for (const product of products) {
    if (!product.imageUrl) {
        console.warn(`⚠️ No image URL for ${product.code}`);
        continue;
    }

    const fileName = `${product.code}.png`;
    console.log(`
Processing ${product.code} (${fileName})...`);

    try {
      // Check if file already exists in Drive (simple check by name)
      // Note: Drive allows duplicate names, so this is just to avoid re-uploading if possible
      const listRes = await drive.files.list({
        q: `name = '${fileName}' and '${FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id, name)',
      });

      if (listRes.data.files && listRes.data.files.length > 0) {
        console.log(`  ✅ File already exists on Drive (ID: ${listRes.data.files[0]?.id}). Skipping.`);
        continue;
      }

      // Fetch Image
      console.log(`  ⬇️ Downloading ${product.imageUrl}...`);
      const imgRes = await fetch(product.imageUrl);
      if (!imgRes.ok) {
        console.error(`  ❌ Failed to download image: ${imgRes.statusText}`);
        continue;
      }
      
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      // Upload to Drive
      console.log(`  ⬆️ Uploading to Drive...`);
      const fileMetadata = {
        name: fileName,
        parents: [FOLDER_ID],
      };
      const media = {
        mimeType: 'image/png',
        body: Readable.from(buffer),
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      console.log(`  🎉 Uploaded! ID: ${file.data.id}`);
      // console.log(`     Link: ${file.data.webViewLink}`);

    } catch (error) {
      console.error(`  ❌ Error processing ${product.code}:`, error);
    }
  }

  console.log('\n✅ Done!');
}

main();
