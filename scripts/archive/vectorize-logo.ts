
import fs from 'node:fs';
import path from 'node:path';

// Credentials provided by user
const API_ID = 'vkb5eyshqcvcsym';
const API_SECRET = '201ebn1j92a9rhgfk36ipuupkhp7ab960m7umhclt25sfr2rruvu';
const INPUT_FILE = path.join(process.cwd(), 'public/logo.png');
const OUTPUT_FILE = path.join(process.cwd(), 'public/logo.svg');

async function vectorize() {
  console.log('🔄 Transformation du logo en SVG via Vectorizer.ai...');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Fichier introuvable: ${INPUT_FILE}`);
    process.exit(1);
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(INPUT_FILE);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  formData.append('image', blob, 'logo.png');
  
  // Options
  formData.append('mode', 'production'); // Utilisation des crédits pour un résultat optimal
  formData.append('output.file_format', 'svg');
  formData.append('output.draw_style', 'fill_shapes'); // Force le mode "formes pleines"
  formData.append('processing.max_colors', '5'); // Limite les couleurs pour simplifier le logo (optionnel)

  try {
    const response = await fetch('https://api.vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${API_ID}:${API_SECRET}`).toString('base64')
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, response.statusText);
      console.error(errorText);
      process.exit(1);
    }

    const svgContent = await response.text();
    fs.writeFileSync(OUTPUT_FILE, svgContent);
    console.log(`✅ Logo vectorisé sauvegardé avec succès: ${OUTPUT_FILE}`);
    
    // Post-traitement optionnel pour le rendre responsive/dynamique
    // On peut lire le SVG et ajouter fill="currentColor" si c'est souhaité
    // Pour l'instant on garde l'original vectorisé
    
  } catch (error) {
    console.error('❌ Erreur lors de la requête:', error);
  }
}

vectorize();
