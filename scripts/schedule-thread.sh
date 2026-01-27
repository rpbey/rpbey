#!/bin/bash
export HOME="/root"
export PATH="/root/.nvm/versions/node/v24.12.0/bin:$PATH"

# Load env vars
set -a
source /root/rpb-dashboard/.env
set +a

cd /root/rpb-dashboard

npx tsx scripts/tweet-human.ts \
"🚨 OFFICIEL 🚨
La RPB passe encore un cap avec le début de la collaboration LFBX !

La République Populaire du Beyblade vous propose un nouveau type de compétition avec 4 tournois qualificatifs.
Objectif : Devenir l'un des 5 élus de la capitale. 🏛️

#BeybladeX #RPB #LFBX" \
"🏆 LE BEY-TAMASHII SERIES #2 🏆
Nous avons l'honneur d'annoncer le 1er tournoi qualificatif !

📅 Dimanche 8 février 2026
🕑 Inscriptions : 13h00 - 14h00
📍 Dernier Bar Avant la Fin du Monde, Paris 75001

#BeyTamashiiSeries" \
"🛠️ Format : 3on3 classique (Double élimination)
🔗 Inscription (64 places) : https://challonge.com/fr/B_TS2

Venez écrire l'histoire ! 3, 2, 1... Hyper Vitesse ! ⚔️" \
"Retrouvez tous nos réseaux:
- Discord : https://discord.gg/rpb
- TikTok : https://www.tiktok.com/@rpbeyblade1
- Insta : https://www.instagram.com/rp_bey/

Restez branché la suite arrive très soon.........👀"

echo "Thread execution attempted at $(date)" >> /root/rpb-dashboard/logs/thread.log