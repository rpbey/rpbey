import {
  google
} from 'googleapis';
import {
  GoogleAuth
} from 'google-auth-library';
import {
  prisma
} from '../src/lib/prisma';

const FOLDER_ID = '1G2rl1vPVN20eL6-1CcSSJ6unys6rcxBM';

async function main() {
  console.log('🔄 Syncing Google Drive Images to Database...');

  // 1. Setup Google Drive
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  // 2. List all files in the folder
  console.log('📥 Fetching file list from Drive...');
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1000,
  });

  const files = res.data.files || [];
  console.log(`📊 Found ${files.length} files in Drive.`);

  let updatedProducts = 0;
  let updatedBeyblades = 0;

  for (const file of files) {
    if (!file.name || !file.id) continue;

    // Match code from filename (e.g., "BX-01.png" -> "BX-01")
    const code = file.name.replace(/\.[^/.]+$/, "");
    const imageUrl = `https://lh3.googleusercontent.com/d/${file.id}`;

    // Update Product
    const product = await prisma.product.updateMany({
      where: { code: code },
      data: { imageUrl: imageUrl }
    });
    if (product.count > 0) updatedProducts++;

    // Update Beyblade
    const bey = await prisma.beyblade.updateMany({
      where: { code: code },
      data: { imageUrl: imageUrl }
    });
    if (bey.count > 0) updatedBeyblades++;
  }

  console.log('\n✅ Sync Complete!');
  console.log(`✨ Updated ${updatedProducts} Products`);
  console.log(`✨ Updated ${updatedBeyblades} Beyblades`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
