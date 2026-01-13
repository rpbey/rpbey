import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import prisma from '../../lib/prisma.js';

export class SyncCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'sync',
      description:
        'Synchronise tous les membres du serveur avec la base de données',
      requiredUserPermissions: [PermissionFlagsBits.Administrator],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const { guild } = interaction;

    if (!guild) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que sur un serveur.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: '🔄 Synchronisation en cours... Récupération des membres...',
      ephemeral: true,
    });

    try {
      // 1. Fetch all members
      const members = await guild.members.fetch();
      const total = members.size;

      await interaction.editReply({
        content: `🔄 Traitement de ${total} membres...`,
      });

      let updated = 0;
      let errors = 0;

      // 2. Process members in chunks to avoid blocking too long
      const BATCH_SIZE = 50;
      const memberChunks = Array.from(members.values());

      for (let i = 0; i < memberChunks.length; i += BATCH_SIZE) {
        const chunk = memberChunks.slice(i, i + BATCH_SIZE);

        await Promise.all(
          chunk.map(async (member) => {
            try {
              // Find existing user by Discord ID
              const existingUser = await prisma.user.findUnique({
                where: { discordId: member.id },
              });

              if (existingUser) {
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    nickname: member.nickname,
                    joinedAt: member.joinedAt,
                    premiumSince: member.premiumSince,
                    roles: member.roles.cache.map((r) => ({
                      name: r.name,
                      color: r.hexColor,
                      id: r.id,
                    })),
                    status: member.presence?.status || 'offline',
                    activities: (member.presence?.activities || []).map(
                      (a) => ({
                        name: a.name,
                        type: a.type,
                        state: a.state,
                        details: a.details,
                        url: a.url,
                      }),
                    ),
                    serverAvatar: member.avatarURL({
                      extension: 'png',
                      size: 256,
                    }),
                    globalName: member.user.globalName,
                    discordTag: member.user.tag,
                    image: member.user.displayAvatarURL({
                      extension: 'png',
                      size: 256,
                    }),
                  },
                });
                updated++;
              }
              // Note: We do NOT create new users automatically to avoiding spamming the DB
              // with users who haven't signed up on the site.
              // Only syncing existing linked accounts.
            } catch (e) {
              console.error(`Error syncing member ${member.user.tag}:`, e);
              errors++;
            }
          }),
        );

        // Update progress every 100 members
        if ((i + BATCH_SIZE) % 100 === 0) {
          await interaction.editReply({
            content: `🔄 Traitement... ${Math.min(i + BATCH_SIZE, total)}/${total} (${updated} mis à jour)`,
          });
        }
      }

      return interaction.editReply({
        content:
          `✅ **Synchronisation terminée !**\n\n` +
          `👥 Total membres scannés : ${total}\n` +
          `📝 Profils mis à jour : ${updated}\n` +
          `⚠️ Erreurs : ${errors}\n\n` +
          `*Note : Seuls les utilisateurs ayant déjà un compte sur le site sont mis à jour.*`,
      });
    } catch (error) {
      console.error('Sync command error:', error);
      return interaction.editReply({
        content: `❌ Une erreur est survenue lors de la synchronisation : ${error}`,
      });
    }
  }
}
