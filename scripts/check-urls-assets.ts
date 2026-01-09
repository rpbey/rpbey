import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const dataDir = 'data/fandom_details';
  const files = await fs.readdir(dataDir);
  
  const allImages = new Set<string>();
  let processedFiles = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(dataDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Extract images from Markdown using regex for ![alt](url)
      // We look for patterns starting with ![ and ending with )
      if (data.markdown) {
        // Find all image markdown references
        // We use a simpler regex that works for most standard markdown images
        const mdImages = data.markdown.match(/!\\\[.*?\\\\]\([^)]+\)/g);
        
        if (mdImages) {
          mdImages.forEach((img: string) => {
            // Extract URL from parenthesis
            const urlMatch = img.match(/\(([^)]+)\)/);
            if (urlMatch && urlMatch[1]) {
              // URL might contain title "URL title"
              const url = urlMatch[1].split(' ')[0];
              if (url && url.startsWith('http')) {
                  allImages.add(url);
              }
            }
          });
        }
      }

      // Extract images from HTML (simple regex)
      if (data.html) {
          const htmlImages = data.html.match(/<img[^>]+src="([^">]+)"/g);
          if (htmlImages) {
              htmlImages.forEach((imgTag: string) => {
                  const match = imgTag.match(/src="([^">]+)"/);
                  if (match && match[1] && match[1].startsWith('http')) {
                      allImages.add(match[1]);
                  }
              });
          }
      }
      
      processedFiles++;
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  console.log(`Processed ${processedFiles} files.`);
  console.log(`Found ${allImages.size} unique image URLs.`);
  
  // Categorize images
  const wikiaImages = Array.from(allImages).filter(url => url.includes('static.wikia.nocookie.net'));
  const otherImages = Array.from(allImages).filter(url => !url.includes('static.wikia.nocookie.net'));
  
  console.log(`\n--- Wikia Images (${wikiaImages.length}) ---`);
  console.log(wikiaImages.slice(0, 10).join('\n'));
  if (wikiaImages.length > 10) console.log(`... and ${wikiaImages.length - 10} more`);

  console.log(`\n--- Other Images (${otherImages.length}) ---`);
  console.log(otherImages.slice(0, 10).join('\n'));
  if (otherImages.length > 10) console.log(`... and ${otherImages.length - 10} more`);
  
  // Save list to file
  await fs.writeFile('data/all_image_assets.json', JSON.stringify(Array.from(allImages), null, 2));
  console.log('\nSaved all image URLs to data/all_image_assets.json');
}

main();