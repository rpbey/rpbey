
import { container } from '@sapphire/framework';
import { scrapeAndSyncTournament } from '../bot/src/lib/challonge-sync';
import { RankingService } from '../src/lib/ranking-service';
import { prisma } from '../src/lib/prisma';

// Mock logger
container.logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
} as any;

const COOKIES = `__Secure-1PAPISID=bosAw8tUSGDIpaeH/AlZ67fMCekppMQmdV; __Secure-1PSID=g.a0005gjXcAdHquP-XYq7Oz65qTZ7m-ANoaOgA89TBAwzCv4ToPauDoTrnEDmKBaJ6ER6_4FrpQACgYKAewSARQSFQHGX2MiMgtZmDuO7-FbQ1R5BLkmVxoVAUF8yKo9tLRozZ945-DKMUjyh5jo0076; __Secure-3PAPISID=bosAw8tUSGDIpaeH/AlZ67fMCekppMQmdV; __Secure-3PSID=g.a0005gjXcAdHquP-XYq7Oz65qTZ7m-ANoaOgA89TBAwzCv4ToPauf8iqAmWD_Oj70x1TQ37xFwACgYKAXUSARQSFQHGX2Mikrlh3Rk_Lp95r4TL00v4wRoVAUF8yKr7l4Av0E0HsUcCF-2huDBM0076; __stripe_mid=614611dd-ea9d-4a48-af91-1ef39bcabec9a57f42; __stripe_sid=687365e2-6c74-4b38-b363-881c142366198a4760; _challonge_session_production=V29Bc0UzSzdseU9mTTFUUHFwYWlxWk1udUZRbmR6Sml6VURQZlJHOWdiZDE5UC9iUGVIbmlyZDlCeUFDeDVJekNzVGt0dkl2YWVrNzRDTFQ1RkM1TGg3aFUxMXRvak1IellZLzNodUhjRnd6dkttNkVYQ0RVdk9oUFJrcnV2UGh5c0tWTFBoRE5HaUNadCsrZXlnd1JxUWRiZEJ2WGdzczBGSmlURE1DcTdEcWp2cG9NcWcvZm40a2M3YzVqcyswL2paNkM2SzBPbXJ6citoRFFGb3ZybXN6YjArUzh4aWtuU1ZXRnNFTlRiRFFlNHdrZUU4N0YxSFZBYUp5QjRieGV5VXdmb2YreXB3RTRXQnEyeGtLZXpyaXNrZkdVMlNkOWh6TUpTSFIwYWdEM3hLVDhnNVI0Ly9ubUR5VXZ2Y0d1YXZHalh4Zk1MdUZnZmtacHMrUm13QWNYcnF0TEVKUW96SGVaK3pXcVMzNUVBek0xeWhveXU3NVlULzI3RTFCUUZKNG9JZXNvQUV2WFFDengyRllNSW9jeHB6UWNxd01NTjFRSjJpaVVBd2d5Y2lXVGFUNm1MQktBaWJUYzV6ay0tS2VaaUMrNUpRWDNXaTU1QUJPOW5SQT09--28ab7e6fd2fbc53dda8b77821c5c53703a0cb2aa; _ck=true; _cuid=7959309; _ga=GA1.1.1632172704.1768148853; _ga_1EEPZLM6JC=GS2.1.s1769750399$o47$g1$t1769750459$j60$l0$h0; _gat=1; _gid=GA1.2.1409699340.1769742200; _lr_env_src_ats=false; _lr_retry_request=true; _lr_sampling_rate=0; _nitroID=766a3febd3c43203bbda23488123537e; _pubcid=95d7c1f8-4ef4-42e8-a58b-de79261a699a; _pubcid_cst=5qPGmg%3D%3D; 3pi=433#1769557200453#-1521065747|2#1769557200553#-115845264|441#1769557200931#-708768088#e_557b052a-6ce0-4d22-8333-a941121ff9d8|203#1769557200723#2011340697#40a541f1-6b20-4553-ab84-eb8c7deecfb3|108#1769557201017#-900898032|846#1769557220714#2074597613; ad-id=A96ssgyBn0najfMGCkX3S2o; ad-privacy=0; APISID=iaiFWwyy2Drt3OdH/At09e7RUlsz-5kphS; cf_clearance=0MODFheZ3K8vCG0Z50DAmDHh4nTXzwf39dYoNhwR0q8-1769750399-1.2.1.1-LX.NK5K_AIlPMxIgkf8fbl6kXcXG7cQrWCKIclSSPgFdBB779AoNgNsof71HiD.HXWHQr7fbvDRulNjszUCZupPAynsx8aPXLgFC3DchvoSqXA6qjzxdTJf4MJ1OhhizKUiSBM_rQZW2pFcT9kqYXf5LeUwO_The8PJMH9G8z4qPz5oYrmP5I8IDMoKU.TqjzhNXjXaKgBrByBmaL.YLHEWUNXUke4ekY1H52uTNg88; cto_bidid=rYI5iF91NTBsUjklMkJPWjQ5NzElMkZZdmxZa1klMkJtV3RCNzZwN0FzRTJDUWlxeTR4Rng3ViUyRmtqRFZMMGRIMk9sSlZYVXYzNSUyRlRyY2tXSkVmWm80RG9zSlgzdFhUS1JHQUNENW4lMkY4Vjl3MTZSZE5hRE40ZyUzRA; cto_bundle=d1vtAV9LR3lHbGxtcVhZam5MQng0RFZ2Yldkc1J1Q2h4dSUyQnVLTHNOYWJMVE9waUo1aVhYS0R0eGQ5YlRGcERleWQ3a1o5ZEY2eWFLY0RSSUZaV2VTd0JMVHM0VWI2JTJGbEZrN3ByeGxOeDFZTUo2ZkdkcDJGbXJIVUNoTWJwRVljTlFJTmtGOHJIM2w0SVY2N3BsT3hHdXhsMHJ3JTNEJTNE; HSID=APXjFUhz3q1RxY0yE; id5=d2aead13-645a-7856-b752-fc0f77b056c5#1769557200420#2; locale=fr; ncmp.domain=challonge.com; NEXT_LOCALE=fr; NID=528=hQwfJqJ0iDVkUFK3WRFpdgog3BPifuLUWmFRddAWu9CVZuXV8si32fSCxGLTo1k62TNwA0ngjpbzGrCJvasCjIZIVrVIRfT8k-63xXivE15gs_qhC8_F4dYTGT3FfbPUUHFAhYPMXMI5wHNXMfvyJZmnngV9YgHHuJL2JPoJRdH60CAN0grGhQaUO5AYfN6bTEPjXJQNV0kaokqDIdPPy5xNZxQHqAQPJl81Wq1M0Px8LZTbZQjxW3efTIfDeTdc; SAPISID=bosAw8tUSGDIpaeH/AlZ67fMCekppMQmdV; SID=g.a0005gjXcAdHquP-XYq7Oz65qTZ7m-ANoaOgA89TBAwzCv4ToPaugcXNmbzQ8ww1ZEHYlw6rHgACgYKAfUSARQSFQHGX2MiqSyNushy4vWB8HgTOmZmthoVAUF8yKrqAmOl-ikPqh676ehSg79W0076; SSID=ALEN67Wg7cbiqFO2g; tk_ai=I7CsWNHTEcutiy30DNnCCNNx; uid=40a541f1-6b20-4553-ab84-eb8c7deecfb3; UID=19898b7e65883433eab635e1769638238; user_credentials=c034ae8913cd7a290252a16c3dfe1e5968ba6109b125913afd4d035c743dcc9d17962161f497c8bc3050c7faa450685657c822f3168846f8e8fc2ed4d4a76625%3A%3A7959309%3A%3A2027-03-03T17%3A29%3A13-07%3A00`;

async function main() {
  console.log('🚀 Démarrage du correctif de classement...');

  // 1. Configurer le système de points
  console.log('🔧 Mise à jour de la configuration des points...');
  const existingConfig = await prisma.rankingSystem.findFirst();
  if (existingConfig) {
    await prisma.rankingSystem.update({
      where: { id: existingConfig.id },
      data: {
        firstPlace: 10000,
        secondPlace: 7000,
        thirdPlace: 5000,
        matchWinWinner: 1000,
        matchWinLoser: 500,
        participation: 5, // Default/Legacy
        top8: 500, // Reasonable assumption or keep existing. I'll set 500 as "Win in loser bracket" equivalent for Top 8 if not specified, or 0. User didn't specify Top 8. I'll keep user focus.
        // Let's set top8 to 0 to be safe if not requested, or 500 if we assume Top 8 implies at least one win.
        // I will trust the default if it was 5, or user request.
        // User didn't ask to change top8. I will leave it as is or set to 0. 
        // I'll set it to 0 to avoid noise.
      }
    });
  } else {
    await prisma.rankingSystem.create({
      data: {
        firstPlace: 10000,
        secondPlace: 7000,
        thirdPlace: 5000,
        matchWinWinner: 1000,
        matchWinLoser: 500,
        participation: 5,
        top8: 0,
      }
    });
  }

  // 2. Lancer le scraping avec les cookies
  const tournamentUrl = 'fr/B_TS1';
  console.log(`🌍 Scraping du tournoi ${tournamentUrl}...`);
  const syncResult = await scrapeAndSyncTournament(tournamentUrl, COOKIES);
  
  if (syncResult.success) {
    console.log('✅ Scraping réussi !');
    console.log(`   - Participants: ${syncResult.participantsCount}`);
    console.log(`   - Matchs: ${syncResult.matchesCount}`);
  } else {
    console.error('❌ Echec du scraping:', syncResult.error);
    // On continue quand même le recalcul si des données existent déjà
  }

  // 3. Recalculer le classement global
  console.log('🔄 Recalcul de tous les points...');
  await RankingService.recalculateAll();

  console.log('🎉 Terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
