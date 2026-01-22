import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// File ID from the URL: https://drive.google.com/file/d/1jgZZr9mNMHRmg_ILSyJ2HF7bTMgoZ3vy/view?usp=sharing
const FILE_ID = '1jgZZr9mNMHRmg_ILSyJ2HF7bTMgoZ3vy';
const DEST_DIR = path.join(process.cwd(), 'downloads');

async function downloadFile() {
  console.log(`🔍 Authenticating with Google...`);
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log(`📄 Fetching metadata for file ID: ${FILE_ID}...`);
    const metadata = await drive.files.get({
      fileId: FILE_ID,
      fields: 'name, mimeType',
    });

    const fileName = metadata.data.name || 'downloaded_file';
    const destPath = path.join(DEST_DIR, fileName);

    console.log(`⬇️  Downloading '${fileName}' to ${destPath}...`);

    const res = await drive.files.get(
      { fileId: FILE_ID, alt: 'media' },
      { responseType: 'stream' }
    );

    const dest = fs.createWriteStream(destPath);
    
    return new Promise((resolve, reject) => {
      res.data
        .on('end', () => {
          console.log(`✅ Download complete: ${destPath}`);
          resolve(true);
        })
        .on('error', (err: any) => {
          console.error('❌ Error downloading file:', err);
          reject(err);
        })
        .pipe(dest);
    });

  } catch (error: any) {
    console.error('❌ Failed to access file. Ensure the service account has permission or the file is public.');
    console.error('Error details:', error.message);
  }
}

downloadFile();
