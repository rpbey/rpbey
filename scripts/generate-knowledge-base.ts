import * as fs from 'node:fs/promises';

const CHAR_FILE = 'data/universe_characters.json';
const BEY_FILE = 'data/universe_beys.json';
const OUTPUT_FILE = 'data/knowledge_base.txt';

async function main() {
    console.log('Generating Knowledge Base...');
    
    const chars = JSON.parse(await fs.readFile(CHAR_FILE, 'utf-8'));
    const beys = JSON.parse(await fs.readFile(BEY_FILE, 'utf-8'));
    
    let content = '# Beyblade X Knowledge Base\n\n';
    
    content += '## Characters\n';
    for (const c of chars) {
        content += `### ${c.title}\n`;
        if (c.metadata.JPName) content += `- Japanese Name: ${c.metadata.JPName}\n`;
        if (c.metadata.Beyblade) content += `- Beyblade: ${c.metadata.Beyblade}\n`;
        if (c.metadata.Team) content += `- Team: ${c.metadata.Team}\n`;
        if (c.summary) content += `- Bio: ${c.summary}\n`;
        content += `\n`;
    }
    
    content += '## Beyblades\n';
    for (const b of beys) {
        content += `### ${b.title}\n`;
        if (b.metadata.Type) content += `- Type: ${b.metadata.Type}\n`;
        if (b.metadata.User) content += `- User: ${b.metadata.User}\n`;
        if (b.metadata.Blade) content += `- Blade: ${b.metadata.Blade}\n`;
        if (b.metadata.Ratchet) content += `- Ratchet: ${b.metadata.Ratchet}\n`;
        if (b.metadata.Bit) content += `- Bit: ${b.metadata.Bit}\n`;
        if (b.summary) content += `- Description: ${b.summary}\n`;
        content += `\n`;
    }
    
    await fs.writeFile(OUTPUT_FILE, content);
    console.log(`Knowledge Base generated at ${OUTPUT_FILE} (${(content.length / 1024).toFixed(2)} KB)`);
    
    // Copy to bot folder if it exists
    try {
        await fs.mkdir('bot/data', { recursive: true });
        await fs.copyFile(OUTPUT_FILE, 'bot/data/knowledge_base.txt');
        console.log('Copied to bot/data/knowledge_base.txt');
    } catch (e) {
        console.warn('Could not copy to bot folder:', e);
    }
}

main();
