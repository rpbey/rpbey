import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

async function fetchAvatarsViaAPI() {
    const apiKey = process.env.CHALLONGE_API_KEY;
    const exportsDir = resolve(process.cwd(), 'data/exports');
    const bts3Path = resolve(exportsDir, 'B_TS3.json');
    const bts3 = JSON.parse(readFileSync(bts3Path, 'utf-8'));

    try {
        console.log(`🚀 Fetching B_TS3 participants from API...`);
        const res = await axios.get(`https://api.challonge.com/v1/tournaments/17542908.json?api_key=${apiKey}&include_participants=1`);
        
        const apiParticipants = res.data.tournament.participants;
        
        let count = 0;
        for (const p of bts3.participants) {
            // Find match in API
            const match = apiParticipants.find((ap: any) => 
                ap.participant.display_name_with_invitation_email_address === p.name ||
                ap.participant.name === p.name ||
                ap.participant.display_name === p.name
            );
            
            if (match && match.participant.attached_participatable_portrait_url) {
                const url = match.participant.attached_participatable_portrait_url;
                if (!url.includes('missing') && !url.includes('avatar-default')) {
                    p.avatarUrl = url;
                    count++;
                }
            }
        }
        
        writeFileSync(bts3Path, JSON.stringify(bts3, null, 2));
        console.log(`✅ Extracted ${count} avatars for B_TS3 via API.`);
        
    } catch (e: any) {
        console.error('❌ Error API:', e.response?.data || e.message);
    }
}

fetchAvatarsViaAPI();
