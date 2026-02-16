import {
  ApplicationCommandOptionType,
  type CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';

import { Colors, RPB } from '../../lib/constants.js';

interface PartnerInfo {
  Name: string;
  Invite: string;
  Challonge?: string;
  Linktree?: string;
  Website?: string;
}

@Discord()
export class PartnerCommand {
  @Slash({
    name: 'partenaire',
    description: "Affiche les informations d'un partenaire",
  })
  async partner(
    @SlashChoice(
      ...Object.entries(RPB.Partners).map(([key, p]) => ({
        name: p.Name,
        value: key,
      })),
    )
    @SlashOption({
      name: 'nom',
      description: 'Le partenaire à afficher',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    partnerKey: string,
    interaction: CommandInteraction,
  ) {
    // Check if key is valid manually since we didn't use Choices enum yet (easy to add but need to map RPB.Partners keys)
    // Actually, let's just cast for now as we did before, but better:
    if (!(partnerKey in RPB.Partners)) {
      return interaction.reply({
        content: '❌ Partenaire non trouvé.',
        ephemeral: true,
      });
    }

    const partner = RPB.Partners[
      partnerKey as keyof typeof RPB.Partners
    ] as unknown as PartnerInfo;

    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle(`🤝 Partenaire : ${partner.Name}`)
      .setColor(Colors.Secondary)
      .setFooter({ text: RPB.FullName })
      .setTimestamp();

    try {
      const invite = await interaction.client.fetchInvite(partner.Invite);
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

        const desc = guild.description
          ? `*${guild.description}*`
          : 'Serveur Partenaire Officiel';

        let description = `**${guild.name}**\n\n${desc}\n\n🔗 **[Clique ici pour rejoindre !](${partner.Invite})**`;

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
    } catch {
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
