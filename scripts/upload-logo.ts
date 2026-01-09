import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

async function uploadLogo() {
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  
  // Use ADC
  const auth = new GoogleAuth({
    scopes: SCOPES,
  });

  const service = google.drive({ version: 'v3', auth });

  const filePath = path.join(process.cwd(), 'public', 'logo.svg');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const requestBody = {
    name: 'logo.svg',
    fields: 'id, webViewLink, webContentLink',
  };

  const media = {
    mimeType: 'image/svg+xml',
    body: fs.createReadStream(filePath),
  };

  try {
    console.log('Uploading logo.svg to Google Drive...');
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    
    console.log('File Uploaded Successfully!');
    console.log('File Id:', file.data.id);
    console.log('View Link:', file.data.webViewLink);
    console.log('Download Link:', file.data.webContentLink);

  } catch (err) {
    console.error('Error uploading file:', err);
    process.exit(1);
  }
}

uploadLogo();
