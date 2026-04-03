import crypto from 'node:crypto';
import fs from 'node:fs';
import { AttachmentBuilder, Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import WebSocket from 'ws';

dotenv.config();

const YOYO_ID = '281114294152724491';
const REMOTE_AUTH_WS = 'wss://remote-auth-gateway.discord.gg/?v=2';
const DISCORD_API = 'https://discord.com/api/v9';

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

async function main() {
  console.log('🤖 Connecting bot to Discord...');
  const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

  await bot.login(process.env.DISCORD_TOKEN);
  await new Promise<void>((r) => bot.once('ready', () => r()));
  console.log(`✅ Bot connected as ${bot.user?.tag}`);

  const user = await bot.users.fetch(YOYO_ID);
  console.log(`📨 Sending QR code to ${user.tag}...`);

  const { publicKey, privateKey } = await generateKeyPair();

  const tokenPromise = new Promise<string | null>((resolve) => {
    const ws = new WebSocket(REMOTE_AUTH_WS, {
      headers: {
        Origin: 'https://discord.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    ws.on('message', async (raw) => {
      const msg = JSON.parse(raw.toString());

      switch (msg.op) {
        case 'hello': {
          ws.send(JSON.stringify({ op: 'init', encoded_public_key: publicKey }));
          heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({ op: 'heartbeat' }));
          }, msg.heartbeat_interval);
          break;
        }

        case 'nonce_proof': {
          const nonce = decrypt(privateKey, msg.encrypted_nonce);
          const proof = crypto.createHash('sha256').update(nonce).digest('base64url');
          ws.send(JSON.stringify({ op: 'nonce_proof', proof }));
          break;
        }

        case 'pending_remote_init': {
          const qrUrl = `https://discord.com/ra/${msg.fingerprint}`;
          try {
            // Generate QR code as PNG buffer
            const qrBuffer = await QRCode.toBuffer(qrUrl, {
              width: 400,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
            });

            const qrPath = '/tmp/discord-qr.png';
            fs.writeFileSync(qrPath, qrBuffer);

            const attachment = new AttachmentBuilder(qrBuffer, { name: 'qr-code.png' });

            await user.send({
              content: [
                '🔑 **Récupération de ton token Discord**',
                '',
                '📱 **Scanne ce QR code avec Discord mobile :**',
                '1. Discord App → Paramètres (⚙️)',
                '2. **Scanner le QR code**',
                '3. Confirme la connexion',
                '',
                '⏳ Tu as 2 minutes.',
              ].join('\n'),
              files: [attachment],
            });
            console.log('✅ QR code envoyé en DM ! En attente du scan...');
          } catch (err) {
            console.error('❌ Impossible d\'envoyer le DM:', err);
          }
          break;
        }

        case 'pending_ticket': {
          const userData = decrypt(privateKey, msg.encrypted_user_payload).toString('utf-8');
          const parts = userData.split(':');
          const username = parts[3];
          console.log(`✅ Scan détecté ! Utilisateur: ${username}`);

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
              console.log(`\n🔑 Token récupéré !`);

              // Save to .env
              const fs = await import('node:fs');
              const envPath = '/root/rpb-dashboard/.env';
              const envContent = fs.readFileSync(envPath, 'utf-8');
              if (envContent.includes('DISCORD_USER_TOKEN=')) {
                const updated = envContent.replace(
                  /DISCORD_USER_TOKEN=.*/,
                  `DISCORD_USER_TOKEN="${token}"`
                );
                fs.writeFileSync(envPath, updated);
              } else {
                fs.appendFileSync(envPath, `\nDISCORD_USER_TOKEN="${token}"\n`);
              }
              console.log('✅ Token sauvegardé dans .env');

              await user.send('✅ Token récupéré et sauvegardé ! Tu peux fermer ce message.');

              if (heartbeatInterval) clearInterval(heartbeatInterval);
              ws.close();
              resolve(token);
            } else {
              console.log('❌ Réponse:', JSON.stringify(data));
              await user.send('❌ Erreur lors de la récupération du token.');
              resolve(null);
            }
          } catch (err) {
            console.error('❌ Erreur:', err);
            resolve(null);
          }
          break;
        }

        case 'cancel': {
          console.log('❌ Annulé.');
          user.send('❌ Scan annulé.').catch(() => {});
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          ws.close();
          resolve(null);
          break;
        }

        case 'heartbeat_ack':
          break;
      }
    });

    ws.on('error', (err) => {
      console.error('WS error:', err.message);
      resolve(null);
    });

    setTimeout(() => {
      console.log('⏰ Timeout.');
      user.send('⏰ Timeout — tu n\'as pas scanné à temps. Relance le script.').catch(() => {});
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      ws.close();
      resolve(null);
    }, 120000);
  });

  const token = await tokenPromise;
  bot.destroy();

  if (token) {
    console.log('\n🎉 Terminé ! Token dans .env sous DISCORD_USER_TOKEN');
  }
  process.exit(0);
}

main().catch(console.error);
