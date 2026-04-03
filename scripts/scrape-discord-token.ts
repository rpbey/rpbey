import crypto from 'node:crypto';
import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal';
import WebSocket from 'ws';

dotenv.config();

const REMOTE_AUTH_WS = 'wss://remote-auth-gateway.discord.gg/?v=2';
const DISCORD_API = 'https://discord.com/api/v9';

// Generate RSA key pair
function generateKeyPair(): Promise<{ publicKey: string; privateKey: crypto.KeyObject }> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      },
      (err, publicKeyPem, privateKeyPem) => {
        if (err) return reject(err);
        // Extract raw public key bytes and base64 encode
        const publicKeyDer = crypto
          .createPublicKey(publicKeyPem)
          .export({ type: 'spki', format: 'der' });
        resolve({
          publicKey: publicKeyDer.toString('base64'),
          privateKey: crypto.createPrivateKey(privateKeyPem),
        });
      }
    );
  });
}

function decrypt(privateKey: crypto.KeyObject, data: string): Buffer {
  return crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(data, 'base64')
  );
}

async function getDiscordToken() {
  console.log('🔑 Discord Remote Auth — Token Scraper');
  console.log('━'.repeat(50));

  const { publicKey, privateKey } = await generateKeyPair();

  return new Promise<string | null>((resolve) => {
    const ws = new WebSocket(REMOTE_AUTH_WS, {
      headers: {
        Origin: 'https://discord.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    ws.on('open', () => {
      console.log('Connected to Discord Remote Auth gateway.');
    });

    ws.on('message', async (raw) => {
      const msg = JSON.parse(raw.toString());

      switch (msg.op) {
        case 'hello': {
          // Send init with public key
          ws.send(JSON.stringify({ op: 'init', encoded_public_key: publicKey }));

          // Start heartbeating
          heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({ op: 'heartbeat' }));
          }, msg.heartbeat_interval);
          break;
        }

        case 'nonce_proof': {
          // Decrypt nonce and send proof
          const nonce = decrypt(privateKey, msg.encrypted_nonce);
          const proof = crypto.createHash('sha256').update(nonce).digest('base64url');
          ws.send(JSON.stringify({ op: 'nonce_proof', proof }));
          break;
        }

        case 'pending_remote_init': {
          // Display QR code
          const qrUrl = `https://discord.com/ra/${msg.fingerprint}`;
          console.log('\n📱 Scanne ce QR code avec Discord mobile :');
          console.log('   Discord App → Paramètres → Scanner le QR code\n');
          qrcode.generate(qrUrl, { small: true }, (code: string) => {
            console.log(code);
          });
          console.log(`\n⏳ En attente du scan... (2 min timeout)\n`);
          break;
        }

        case 'pending_ticket': {
          // User scanned — decrypt user data
          const userData = decrypt(privateKey, msg.encrypted_user_payload).toString('utf-8');
          const [userId, discriminator, avatarHash, username] = userData.split(':');
          console.log(`✅ Scan détecté ! Utilisateur: ${username} (${userId})`);

          // Exchange ticket for token
          try {
            const res = await fetch(`${DISCORD_API}/users/@me/remote-auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              },
              body: JSON.stringify({ ticket: msg.ticket }),
            });
            const data = await res.json();

            if (data.encrypted_token) {
              const token = decrypt(privateKey, data.encrypted_token).toString('utf-8');
              console.log(`\n🔑 Token: ${token}\n`);
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              ws.close();
              resolve(token);
            } else {
              console.log('❌ Pas de token dans la réponse:', JSON.stringify(data));
              resolve(null);
            }
          } catch (err) {
            console.error('❌ Erreur échange ticket:', err);
            resolve(null);
          }
          break;
        }

        case 'pending_finish': {
          // Older protocol — send finish
          ws.send(JSON.stringify({ op: 'finish', payload: msg }));
          break;
        }

        case 'finish': {
          if (msg.encrypted_token) {
            const token = decrypt(privateKey, msg.encrypted_token).toString('utf-8');
            console.log(`\n🔑 Token: ${token}\n`);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            ws.close();
            resolve(token);
          }
          break;
        }

        case 'cancel': {
          console.log('❌ Annulé côté mobile.');
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          ws.close();
          resolve(null);
          break;
        }

        case 'heartbeat_ack':
          break;

        default:
          console.log('📨 Message:', JSON.stringify(msg));
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      resolve(null);
    });

    ws.on('close', () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      console.log('Connection closed.');
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      console.log('\n⏰ Timeout — pas de scan détecté.');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      ws.close();
      resolve(null);
    }, 120000);
  });
}

getDiscordToken().then(async (token) => {
  if (token) {
    // Save to .env
    const fs = await import('node:fs');
    const envPath = '/root/rpb-dashboard/.env';
    const envContent = fs.readFileSync(envPath, 'utf-8');

    if (envContent.includes('DISCORD_USER_TOKEN=')) {
      const updated = envContent.replace(/DISCORD_USER_TOKEN=.*/, `DISCORD_USER_TOKEN="${token}"`);
      fs.writeFileSync(envPath, updated);
    } else {
      fs.appendFileSync(envPath, `\nDISCORD_USER_TOKEN="${token}"\n`);
    }

    console.log('✅ Token sauvegardé dans .env (DISCORD_USER_TOKEN)');
  }
  process.exit(0);
});
