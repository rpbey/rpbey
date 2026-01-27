
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = '/root/.clawdbot/clawdbot.json';
const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAk0HK1Fg0PH046jyDDU6VgT22l95dVvuI';

try {
    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } else {
        // Default structure if missing
        config = { auth: { profiles: {} }, agents: { defaults: {} } };
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    // 1. Configure Auth Profile
    if (!config.auth) config.auth = {};
    if (!config.auth.profiles) config.auth.profiles = {};

    // We create a generic google profile
    config.auth.profiles['google-gemini-cli'] = {
        provider: 'google-gemini-cli',
        mode: 'api_key',
        apiKey: API_KEY
    };

    // 2. Configure Agent Defaults to use this profile/model
    if (!config.agents) config.agents = {};
    if (!config.agents.defaults) config.agents.defaults = {};
    
    // Force usage of Gemini 1.5 Pro or Flash with the key
    config.agents.defaults.model = {
        primary: 'google/gemini-1.5-flash-latest' 
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('✅ Clawdbot configuration updated with API Key.');

} catch (e) {
    console.error('❌ Error configuring Clawdbot:', e);
}
