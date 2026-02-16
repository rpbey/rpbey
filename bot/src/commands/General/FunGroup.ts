import {
  ApplicationCommandOptionType,
  AttachmentBuilder,
  type CommandInteraction,
  type User,
} from 'discord.js';
import DIG from 'discord-image-generation';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';

import { logger } from '../../lib/logger.js';

@Discord()
@SlashGroup({
  name: 'fun',
  description: "Commandes amusantes et créations d'images",
})
@SlashGroup('fun')
export class FunGroup {
  @Slash({
    name: 'recherche',
    description: "Générer une affiche de mise à prix 'WANTED'",
  })
  async wanted(
    @SlashOption({
      name: 'cible',
      description: "L'utilisateur à mettre sur l'affiche",
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();

    try {
      const avatar = target.displayAvatarURL({ extension: 'png', size: 512 });
      const image = await new DIG.Wanted().getImage(avatar, '€');
      const attachment = new AttachmentBuilder(image, {
        name: 'recherche.png',
      });
      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      logger.error(error);
      return interaction.editReply("❌ Impossible de générer l'affiche.");
    }
  }

  @Slash({
    name: 'calin',
    description: 'Générer une image de câlin affectueux',
  })
  async affect(
    @SlashOption({
      name: 'ami',
      description: "L'utilisateur à qui faire un câlin",
      required: false,
      type: ApplicationCommandOptionType.User,
    })
    targetUser: User | undefined,
    interaction: CommandInteraction,
  ) {
    const target = targetUser ?? interaction.user;
    await interaction.deferReply();

    try {
      const avatar = target.displayAvatarURL({ extension: 'png', size: 512 });
      const image = await new DIG.Affect().getImage(avatar);
      const attachment = new AttachmentBuilder(image, { name: 'calin.png' });
      return interaction.editReply({ files: [attachment] });
    } catch (error) {
      logger.error(error);
      return interaction.editReply('❌ Une erreur est survenue.');
    }
  }

  @Slash({
    name: 'agrandir',
    description: 'Afficher une émote du serveur en grand',
  })
  async emote(
    @SlashOption({
      name: 'emoji',
      description: "L'émoji à agrandir",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    emojiString: string,
    interaction: CommandInteraction,
  ) {
    const emojiRegex = /<(a?):(\w+):(\d+)>/;
    const match = emojiString.match(emojiRegex);

    if (!match) {
      return interaction.reply({
        content:
          "❌ Émoji invalide (assurez-vous d'utiliser un émoji du serveur).",
        ephemeral: true,
      });
    }

    const [, , id] = match;
    const animated = match[1] === 'a';
    const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;

    return interaction.reply({ content: url });
  }
}
