import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { generateBattleCard } from './canvas-utils.js';
import { Colors, RPB } from './constants.js';
import prisma from './prisma.js';
import { pickRandom } from './utils.js';

// Helper to parse stats
export const p = (val: string | number | null | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
};

const battleResults = [
  { result: 'burst', message: '💥 **BURST FINISH !**', points: 2, emoji: '💥', type: 'ATTACK' },
  { result: 'over', message: '🔄 **OVER FINISH !**', points: 1, emoji: '🔄', type: 'DEFENSE' },
  { result: 'spin', message: '🌀 **SPIN FINISH !**', points: 1, emoji: '🌀', type: 'STAMINA' },
  { result: 'xtreme', message: '⚡ **X-TREME FINISH !**', points: 3, emoji: '⚡', type: 'ATTACK' },
];

export async function getDeckStats(discordId: string) {
  const user = await prisma.user.findFirst({
    where: { discordId },
    include: {
      decks: {
        where: { isActive: true },
        include: { items: { include: { blade: true, ratchet: true, bit: true } } }
      }
    }
  });

  if (!user || user.decks.length === 0) return null;

  const deck = user.decks[0];
  let atk = 0, def = 0, sta = 0, dsh = 0;
  
  for (const item of deck.items) {
    const parts = [item.blade, item.ratchet, item.bit];
    atk += parts.reduce((acc, part) => acc + p(part?.attack), 0);
    def += parts.reduce((acc, part) => acc + p(part?.defense), 0);
    sta += parts.reduce((acc, part) => acc + p(part?.stamina), 0);
    dsh += parts.reduce((acc, part) => acc + p(part?.dash), 0);
  }
  
  return { 
    attack: atk, 
    defense: def, 
    stamina: sta, 
    dash: dsh,
    power: atk + def + sta + (dsh * 0.5) 
  };
}

export function getRandomStats() {
    const atk = 100 + Math.floor(Math.random() * 50);
    const def = 100 + Math.floor(Math.random() * 50);
    const sta = 100 + Math.floor(Math.random() * 50);
    const dsh = 50 + Math.floor(Math.random() * 30);
    return {
        attack: atk,
        defense: def,
        stamina: sta,
        dash: dsh,
        power: atk + def + sta + (dsh * 0.5)
    };
}

export async function runBattleSimulation(
    interaction: any,
    challenger: any,
    opponent: any,
    statsA: any,
    statsB: any
) {
    // Determine winner based on Power Ratio + Luck
    const luckA = 0.8 + Math.random() * 0.4;
    const luckB = 0.8 + Math.random() * 0.4;
    
    const scoreA = statsA.power * luckA;
    const scoreB = statsB.power * luckB;

    const winner = scoreA > scoreB ? challenger : opponent;
    const loser = winner.id === challenger.id ? opponent : challenger;
    const winnerStats = winner.id === challenger.id ? statsA : statsB;

    // Finish Type Logic
    const total = winnerStats.attack + winnerStats.defense + winnerStats.stamina;
    const atkRatio = winnerStats.attack / total;
    // const defRatio = winnerStats.defense / total; 
    const staRatio = winnerStats.stamina / total;
    const dashBonus = winnerStats.dash > 50 ? 0.2 : 0;

    let finishType;
    const roll = Math.random();

    if (roll < (atkRatio * 0.5 + dashBonus)) {
        finishType = battleResults.find(r => r.result === 'xtreme')!;
    } else if (roll < (atkRatio * 0.8 + dashBonus)) {
        finishType = battleResults.find(r => r.result === 'burst')!;
    } else if (roll < (atkRatio * 0.8 + staRatio)) {
        finishType = battleResults.find(r => r.result === 'spin')!;
    } else {
        finishType = battleResults.find(r => r.result === 'over')!;
    }

    // Update DB
    try {
        const dbWinner = await prisma.user.upsert({
            where: { discordId: winner.id },
            update: {},
            create: { discordId: winner.id, name: winner.displayName, email: `${winner.id}@discord.rpbey.fr` }
        });
        await prisma.profile.upsert({
            where: { userId: dbWinner.id },
            update: { wins: { increment: 1 } },
            create: { userId: dbWinner.id, wins: 1 }
        });

        const dbLoser = await prisma.user.upsert({
            where: { discordId: loser.id },
            update: {},
            create: { discordId: loser.id, name: loser.displayName, email: `${loser.id}@discord.rpbey.fr` }
        });
        await prisma.profile.upsert({
            where: { userId: dbLoser.id },
            update: { losses: { increment: 1 } },
            create: { userId: dbLoser.id, losses: 1 }
        });
    } catch (e) {
        console.error('DB Update Error:', e);
    }

    // Generate Card
    const cardBuffer = await generateBattleCard({
      winnerName: winner.displayName,
      winnerAvatarUrl: winner.displayAvatarURL({ extension: 'png', size: 512 }),
      loserName: loser.displayName,
      loserAvatarUrl: loser.displayAvatarURL({ extension: 'png', size: 512 }),
      finishType: finishType.result,
      finishMessage: finishType.message,
      finishEmoji: finishType.emoji,
    });

    const attachment = new AttachmentBuilder(cardBuffer, { name: `battle-${Date.now()}.png` });
    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Primary)
      .setImage(`attachment://battle-${Date.now()}.png`)
      .setFooter({ text: `${RPB.FullName} | GG !` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`battle-rematch-${loser.id}`)
        .setLabel('Revanche !')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄'),
    );

    // Check if message is editable (it might be deferred or replied)
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [resultEmbed], files: [attachment], components: [row] });
    } else {
        await interaction.reply({ embeds: [resultEmbed], files: [attachment], components: [row] });
    }
}
