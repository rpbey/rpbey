
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

// Activation du plugin Stealth
puppeteer.use(StealthPlugin());

async function scrapeChallonge() {
  console.log('🚀 Démarrage du navigateur furtif...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();

    // Configuration avancée des en-têtes
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    const url = 'https://challonge.com/fr/B_TS2/module';
    console.log(`🌍 Navigation vers : ${url}`);
    
    // Navigation avec un délai d'attente généreux pour les challenges
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

    // On attend un peu pour laisser le challenge JS se résoudre si nécessaire
    console.log('⏳ Analyse de la page (attente 10s pour stabilisation)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const content = await page.content();
    const title = await page.title();
    
    console.log(`✅ Titre de la page détecté : "${title}"`);

    if (title.includes('Just a moment') || title.includes('Attention Required')) {
      console.log('❌ Échec : Toujours bloqué par le challenge Cloudflare.');
    } else {
      console.log('🎉 Succès probable ! Extraction du contenu...');
    }

    // Sauvegarde du résultat
    const outputPath = path.resolve(process.cwd(), 'challonge_stealth.html');
    fs.writeFileSync(outputPath, content);
    console.log(`💾 Contenu sauvegardé dans : ${outputPath}`);

    // Capture d'écran pour preuve visuelle
    await page.screenshot({ path: 'challonge_stealth.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée : challonge_stealth.png');

  } catch (error) {
    console.error('❌ Erreur lors du scraping :', error);
  } finally {
    await browser.close();
  }
}

scrapeChallonge();
