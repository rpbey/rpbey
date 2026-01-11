import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { Colors, RPB } from '../../lib/constants.js';

interface PartnerInfo {
  Name: string;
  Invite: string;
  Challonge?: string;
  Linktree?: string;
  Website?: string;
}

export class PartnerCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "Affiche les informations d'un serveur partenaire",
    });
  }

  override registerApplicationCommands(registry: Command.Registry) {
    const partners = Object.entries(RPB.Partners).map(([key, p]) => ({
      name: p.Name,
      value: key,
    }));

    registry.registerChatInputCommand((builder) =>
      builder
        .setName('partenaire')
        .setDescription("Affiche les informations d'un partenaire")
        .addStringOption((opt) =>
          opt
            .setName('nom')
            .setDescription('Le partenaire à afficher')
            .setRequired(true)
            .addChoices(...partners),
        ),
    );
  }

  override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction,
  ) {
    const partnerKey = interaction.options.getString(
      'nom',
      true,
    ) as keyof typeof RPB.Partners;
    // Cast to unknown first then PartnerInfo to satisfy TS if RPB.Partners types are too strict/literal
    const partner = RPB.Partners[partnerKey] as unknown as PartnerInfo;

    if (!partner) {
      return interaction.reply({
        content: '❌ Partenaire non trouvé.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle(`🤝 Partenaire : ${partner.Name}`)
      .setColor(Colors.Secondary)
      .setFooter({ text: RPB.FullName })
      .setTimestamp();

    try {
      // Try to fetch invite details for rich embed
      const invite = await this.container.client.fetchInvite(partner.Invite);
      const guild = invite.guild;

      if (guild) {
        embed.setThumbnail(guild.iconURL({ size: 256 }));
        if (guild.banner) {
          embed.setImage(guild.bannerURL({ size: 512 }));
        } else if (guild.splash) {
          embed.setImage(guild.splashURL({ size: 512 }));
        }

        embed.addFields(
          {
            name: '👥 Membres',
            value: `${invite.memberCount?.toLocaleString('fr-FR') ?? 'N/A'} (🟢 ${invite.presenceCount ?? 0})`,
            inline: true,
          },
          { name: '🆔 ID', value: guild.id, inline: true },
        );

        // Use guild description if available, otherwise just the name and link
        const desc = guild.description
          ? `*${guild.description}*`
          : 'Serveur Partenaire Officiel';

        let description = `**${guild.name}**\n\n${desc}\n\n🔗 **[Clique ici pour rejoindre !](${partner.Invite})**`;

        // Add Challonge link if available
        if (partner.Challonge) {
          description += `\n🏆 **[Page Challonge](${partner.Challonge})**`;
        }

        if (partner.Linktree) {
          description += `\n🌳 **[Linktree](${partner.Linktree})**`;
        }

        if (partner.Website) {
          description += `\n🌐 **[Site Web](${partner.Website})**`;
        }

        embed.setDescription(description);
      } else {
        // Fallback if guild info missing in invite
        let description = `Serveur Partenaire : ${partner.Name}\n\n🔗 **[Rejoindre le serveur](${partner.Invite})**`;
        if (partner.Challonge) {
          description += `\n🏆 **[Page Challonge](${partner.Challonge})**`;
        }
        if (partner.Linktree) {
          description += `\n🌳 **[Linktree](${partner.Linktree})**`;
        }
        if (partner.Website) {
          description += `\n🌐 **[Site Web](${partner.Website})**`;
        }
        embed.setDescription(description);
      }
    } catch (_e) {
      // Fallback if invite fetch fails
      let description = `Serveur Partenaire : ${partner.Name}\n\n🔗 **[Rejoindre le serveur](${partner.Invite})**`;
      if (partner.Challonge) {
        description += `\n🏆 **[Page Challonge](${partner.Challonge})**`;
      }
      if (partner.Linktree) {
        description += `\n🌳 **[Linktree](${partner.Linktree})**`;
      }
      if (partner.Website) {
        description += `\n🌐 **[Site Web](${partner.Website})**`;
      }
      embed.setDescription(description);
    }

    return interaction.editReply({ embeds: [embed] });
  }
}
