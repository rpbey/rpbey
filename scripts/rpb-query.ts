import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function main() {
  // Ensure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL is not set');
      process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'stats') {
        const users = await client.query('SELECT COUNT(*) FROM users');
        const matches = await client.query('SELECT COUNT(*) FROM tournament_matches');
        console.log(JSON.stringify({ 
            totalUsers: parseInt(users.rows[0].count),
            totalMatches: parseInt(matches.rows[0].count)
        }, null, 2));

    } else if (command === 'profile') {
        const discordId = args[1]?.replace(/[<@!>]/g, '');
        if (!discordId) {
            console.error(JSON.stringify({ error: "Missing Discord ID" }));
            process.exit(1);
        }
        
        const res = await client.query(`
            SELECT u.*, p."bladerName", p."wins", p."losses", p."rankingPoints"
            FROM users u 
            LEFT JOIN profiles p ON u.id = p."userId" 
            WHERE u."discordId" = $1
        `, [discordId]);
        
        if (res.rows.length === 0) {
            console.log(JSON.stringify({ error: "User not found" }));
        } else {
            console.log(JSON.stringify(res.rows[0], null, 2));
        }

    } else if (command === 'leaderboard') {
        // Fetch active season first
        const seasonRes = await client.query('SELECT id FROM ranking_seasons WHERE "isActive" = true LIMIT 1');
        if (seasonRes.rows.length === 0) {
             console.log(JSON.stringify({ error: "No active season" }));
             return;
        }
        const seasonId = seasonRes.rows[0].id;

        const res = await client.query(`
            SELECT se.points, se.wins, se.losses, se.rank, u.username, u."discordId", u."globalName", p."bladerName"
            FROM season_entries se
            JOIN users u ON se."userId" = u.id
            LEFT JOIN profiles p ON u.id = p."userId"
            WHERE se."seasonId" = $1
            ORDER BY se.points DESC
            LIMIT 10
        `, [seasonId]);
        console.log(JSON.stringify(res.rows, null, 2));

    } else if (command === 'tournaments') {
        const res = await client.query(`
            SELECT id, name, date, status, "maxPlayers", "challongeUrl"
            FROM tournaments 
            WHERE status IN ('UPCOMING', 'REGISTRATION_OPEN')
            ORDER BY date ASC
        `);
        console.log(JSON.stringify(res.rows, null, 2));

    } else if (command === 'admins') {
        const res = await client.query('SELECT id, name, email, role FROM users WHERE role = \'admin\'');
        console.log(JSON.stringify(res.rows, null, 2));

    } else {
        console.log('Usage: npx tsx scripts/rpb-query.ts <profile|leaderboard|tournaments|stats|admins> [args]');
    }

  } catch (err) {
      console.error(JSON.stringify({ error: String(err) }));
      process.exit(1);
  } finally {
      await client.end();
  }
}

main();