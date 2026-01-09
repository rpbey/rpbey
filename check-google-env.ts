import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const vars = [
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_TRANSLATE_API_KEY'
];

console.log('--- Google Environment Check ---');
vars.forEach(v => {
  const value = process.env[v];
  if (value) {
    console.log(`${v}: PRESENT`);
    if (v === 'GOOGLE_APPLICATION_CREDENTIALS') {
      const fullPath = path.resolve(value);
      if (fs.existsSync(fullPath)) {
        console.log(`  File exists at: ${fullPath}`);
      } else {
        console.log(`  File MISSING at: ${fullPath}`);
      }
    }
  } else {
    console.log(`${v}: MISSING`);
  }
});
