/**
 * Test script for the RPB External API
 * Usage: pnpm tsx scripts/test-external-api.ts
 */

const API_URL = 'http://localhost:3000/api/external/v1/leaderboard';
const API_KEY = 'd642a9ec5eb5da9d4af4b2dfc5e15e33f468bc611c94d005';

async function testApi() {
  console.log('🧪 Testing External Leaderboard API...');
  console.log(`🔗 URL: ${API_URL}`);
  
  try {
    const start = Date.now();
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, data);
      return;
    }

    console.log(`✅ Success! (Status: ${response.status}, Time: ${duration}ms)`);
    console.log('\n--- DATA SUMMARY ---');
    console.log(`📅 Timestamp: ${data.timestamp}`);
    console.log(`🏆 Tournaments Found: ${data.tournaments.length}`);
    
    if (data.tournaments.length > 0) {
      console.log(`Sample Tournament: ${data.tournaments[0].name}`);
      console.log(`Participants Count: ${data.tournaments[0].participants.length}`);
      console.log(`Matches Count: ${data.tournaments[0].matches.length}`);
    }

    console.log(`👤 Players in Leaderboard: ${data.leaderboard.length}`);
    if (data.leaderboard.length > 0) {
      console.log(`Top Player: ${data.leaderboard[0].bladerName} (${data.leaderboard[0].points} pts)`);
    }

    console.log('\n--- SECURITY TEST ---');
    const unauthorizedResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'x-api-key': 'wrong-key',
      },
    });
    console.log(`🔒 Unauthorized Access Test (Expected 401): ${unauthorizedResponse.status}`);

  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
}

testApi();
