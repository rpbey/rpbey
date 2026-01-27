
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = '/root/.clawdbot/clawdbot.json';
const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAk0HK1Fg0PH046jyDDU6VgT22l95dVvuI';

try {
    let config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    // Fix Auth Profile
    // We try 'google' provider which is standard
    config.auth.profiles['google-primary'] = {
        provider: 'google',
        mode: 'api_key',
        apiKey: API_KEY // Trying apiKey (camelCase)
    };
    
    // Also try snake_case just in case
    config.auth.profiles['google-fallback'] = {
        provider: 'google',
        mode: 'api_key',
        api_key: API_KEY 
    };

    // Update Default Agent to use google-primary
    config.agents.defaults.model = {
        primary: 'google/gemini-1.5-flash-latest'
    };

    // Remove the invalid one
    if (config.auth.profiles['google-gemini-cli']) {
        delete config.auth.profiles['google-gemini-cli'];
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('✅ Config fixed with standard Google provider.');

} catch (e) {
    console.error('❌ Error:', e);
}
