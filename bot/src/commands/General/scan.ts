import {
  ApplicationCommandOptionType,
  ChannelType,
  type CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from 'discordx';

import { OwnerOnly } from '../../guards/OwnerOnly.js';
import { Colors, RPB } from '../../lib/constants.js';

@Discord()
@SlashGroup({
  name: 'scanner',
  description: 'Scanner les IDs des salons et rôles',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
})
@SlashGroup('scanner')
@Guard(OwnerOnly)
export class ScanCommand {
  @Slash({
    name: 'salons',
    description: 'Liste tous les salons avec leurs IDs',
  })
  async scanChannels(
    @SlashChoice({ name: '📝 Tous', value: 'all' })
    @SlashChoice({ name: '💬 Textuels', value: 'text' })
    @SlashChoice({ name: '🔊 Vocaux', value: 'voice' })
    @SlashChoice({ name: '📂 Catégories', value: 'category' })
    @SlashChoice({ name: '📢 Annonces', value: 'announcement' })
    @SlashChoice({ name: '🧵 Forums', value: 'forum' })
    @SlashOption({
      name: 'type',
      description: 'Type de salon à filtrer',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    filterType: string = 'all',
    interaction: CommandInteraction,
  ) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Cette commande doit être utilisée dans un serveur.',
        ephemeral: true,
      });
    }

    const { guild } = interaction;
    await interaction.deferReply({ ephemeral: true });

    // Fetch all channels
    const channels = await guild.channels.fetch();

    // Filter by type
    const filtered = channels.filter((ch) => {
      if (!ch) return false;
      switch (filterType) {
        case 'text':
          return ch.type === ChannelType.GuildText;
        case 'voice':
          return (
            ch.type === ChannelType.GuildVoice ||
            ch.type === ChannelType.GuildStageVoice
          );
        case 'category':
          return ch.type === ChannelType.GuildCategory;
        case 'announcement':
          return ch.type === ChannelType.GuildAnnouncement;
        case 'forum':
          return ch.type === ChannelType.GuildForum;
        default:
          return true;
      }
    });

    // Group by category
    const categories = new Map<
      string,
      { name: string; channels: { name: string; id: string; type: string }[] }
    >();
    const noCategory: { name: string; id: string; type: string }[] = [];

    for (const [, channel] of filtered) {
      if (!channel) continue;

      const channelInfo = {
        name: channel.name,
        id: channel.id,
        type: this.getChannelEmoji(channel.type),
      };

      if (channel.type === ChannelType.GuildCategory) {
        if (!categories.has(channel.id)) {
          categories.set(channel.id, { name: channel.name, channels: [] });
        }
      } else if (channel.parentId) {
        if (!categories.has(channel.parentId)) {
          const parent = channels.get(channel.parentId);
          categories.set(channel.parentId, {
            name: parent?.name ?? 'Inconnu',
            channels: [],
          });
        }
        categories.get(channel.parentId)?.channels.push(channelInfo);
      } else {
        noCategory.push(channelInfo);
      }
    }

    // Build response
    let content = `# 📋 Salons du serveur ${guild.name}\n\n`;
    content += `**Total:** ${filtered.size} salon(s)\n\n`;

    // No category first
    if (noCategory.length > 0) {
      content += `## 📁 Sans catégorie\n`;
      for (const ch of noCategory) {
        content += `${ch.type} \`${ch.id}\` - ${ch.name}\n`;
      }
      content += `\n`;
    }

    // Categories
    for (const [catId, cat] of categories) {
      content += `## 📂 ${cat.name}\n`;
      content += `📂 \`${catId}\` - ${cat.name}\n`;
      for (const ch of cat.channels.sort((a, b) =>
        a.name.localeCompare(b.name),
      )) {
        content += `${ch.type} \`${ch.id}\` - ${ch.name}\n`;
      }
      content += `\n`;
    }

    // Split if too long
    if (content.length > 2000) {
      const buffer = Buffer.from(content, 'utf-8');
      return interaction.editReply({
        content: `📋 Liste des salons (${filtered.size} trouvés) :`,
        files: [{ attachment: buffer, name: `salons-${guild.id}.md` }],
      });
    }

    return interaction.editReply({ content });
  }

  @Slash({ name: 'roles', description: 'Liste tous les rôles avec leurs IDs' })
  async scanRoles(interaction: CommandInteraction) {
    if (!interaction.guild) return;
    const { guild } = interaction;
    await interaction.deferReply({ ephemeral: true });

    // Fetch all roles
    const roles = await guild.roles.fetch();

    // Sort by position (highest first)
    const sorted = [...roles.values()].sort((a, b) => b.position - a.position);

    let content = `# 🎭 Rôles du serveur ${guild.name}\n\n`;
    content += `**Total:** ${sorted.length} rôle(s)\n\n`;
    content += `| Position | Couleur | ID | Nom | Membres |\n`;
    content += `|----------|---------|----|----|----------|\n`;

    for (const role of sorted) {
      const color = role.hexColor !== '#000000' ? role.hexColor : 'Défaut';
      const memberCount = role.members.size;
      const emoji = role.unicodeEmoji ?? '';
      content += `| ${role.position} | ${color} | \`${role.id}\` | ${emoji} ${role.name} | ${memberCount} |\n`;
    }

    // Add quick copy section
    content += `\n## 📝 IDs pour copie rapide\n\n`;
    content += '```typescript\n';
    content += 'export const ROLES = {\n';
    for (const role of sorted) {
      if (role.name === '@everyone') continue;
      const safeName = role.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  ${safeName}: "${role.id}",\n`;
    }
    content += '} as const;\n';
    content += '```\n';

    // Split if too long
    if (content.length > 2000) {
      const buffer = Buffer.from(content, 'utf-8');
      return interaction.editReply({
        content: `🎭 Liste des rôles (${sorted.length} trouvés) :`,
        files: [{ attachment: buffer, name: `roles-${guild.id}.md` }],
      });
    }

    return interaction.editReply({ content });
  }

  @Slash({ name: 'tout', description: 'Exporte salons + rôles en fichier' })
  async scanAll(interaction: CommandInteraction) {
    if (!interaction.guild) return;
    const { guild } = interaction;
    await interaction.deferReply({ ephemeral: true });

    const [channels, roles] = await Promise.all([
      guild.channels.fetch(),
      guild.roles.fetch(),
    ]);

    // Build TypeScript constants file
    let content = `// Auto-généré par RPB Bot - ${new Date().toISOString()}\n`;
    content += `// Serveur: ${guild.name} (${guild.id})\n\n`;

    // Channels
    content += `export const CHANNELS = {\n`;

    const textChannels = channels.filter(
      (ch) => ch?.type === ChannelType.GuildText,
    );
    const voiceChannels = channels.filter(
      (ch) => ch?.type === ChannelType.GuildVoice,
    );
    const categories = channels.filter(
      (ch) => ch?.type === ChannelType.GuildCategory,
    );
    const announcements = channels.filter(
      (ch) => ch?.type === ChannelType.GuildAnnouncement,
    );
    const forums = channels.filter((ch) => ch?.type === ChannelType.GuildForum);

    content += `  // Catégories (${categories.size})\n`;
    for (const [, ch] of categories) {
      if (!ch) continue;
      const safeName = ch.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  CAT_${safeName}: "${ch.id}",\n`;
    }

    content += `\n  // Salons textuels (${textChannels.size})\n`;
    for (const [, ch] of textChannels) {
      if (!ch) continue;
      const safeName = ch.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  ${safeName}: "${ch.id}",\n`;
    }

    content += `\n  // Salons d'annonces (${announcements.size})\n`;
    for (const [, ch] of announcements) {
      if (!ch) continue;
      const safeName = ch.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  ANNONCE_${safeName}: "${ch.id}",\n`;
    }

    content += `\n  // Salons vocaux (${voiceChannels.size})\n`;
    for (const [, ch] of voiceChannels) {
      if (!ch) continue;
      const safeName = ch.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  VOICE_${safeName}: "${ch.id}",\n`;
    }

    content += `\n  // Forums (${forums.size})\n`;
    for (const [, ch] of forums) {
      if (!ch) continue;
      const safeName = ch.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  FORUM_${safeName}: "${ch.id}",\n`;
    }

    content += `} as const;\n\n`;

    // Roles
    const sortedRoles = [...roles.values()].sort(
      (a, b) => b.position - a.position,
    );

    content += `export const ROLES = {\n`;
    for (const role of sortedRoles) {
      if (role.name === '@everyone') continue;
      const safeName = role.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      content += `  ${safeName}: "${role.id}", // ${role.hexColor} - ${role.members.size} membres\n`;
    }
    content += `} as const;\n\n`;

    // Summary
    content += `// Résumé:\n`;
    content += `// - ${categories.size} catégories\n`;
    content += `// - ${textChannels.size} salons textuels\n`;
    content += `// - ${announcements.size} salons d'annonces\n`;
    content += `// - ${voiceChannels.size} salons vocaux\n`;
    content += `// - ${forums.size} forums\n`;
    content += `// - ${sortedRoles.length} rôles\n`;

    const buffer = Buffer.from(content, 'utf-8');

    const embed = new EmbedBuilder()
      .setTitle(`📋 Export complet - ${guild.name}`)
      .setColor(Colors.Primary)
      .addFields(
        { name: '📂 Catégories', value: `${categories.size}`, inline: true },
        { name: '💬 Textuels', value: `${textChannels.size}`, inline: true },
        { name: '📢 Annonces', value: `${announcements.size}`, inline: true },
        { name: '🔊 Vocaux', value: `${voiceChannels.size}`, inline: true },
        { name: '🧵 Forums', value: `${forums.size}`, inline: true },
        { name: '🎭 Rôles', value: `${sortedRoles.length}`, inline: true },
      )
      .setFooter({ text: RPB.FullName })
      .setTimestamp();

    return interaction.editReply({
      content: '✅ Export généré ! Colle ce fichier dans `src/lib/ids.ts`',
      embeds: [embed],
      files: [{ attachment: buffer, name: `ids-${guild.id}.ts` }],
    });
  }

  private getChannelEmoji(type: ChannelType): string {
    switch (type) {
      case ChannelType.GuildText:
        return '💬';
      case ChannelType.GuildVoice:
        return '🔊';
      case ChannelType.GuildCategory:
        return '📂';
      case ChannelType.GuildAnnouncement:
        return '📢';
      case ChannelType.GuildForum:
        return '🧵';
      case ChannelType.GuildStageVoice:
        return '🎭';
      default:
        return '📌';
    }
  }
}
