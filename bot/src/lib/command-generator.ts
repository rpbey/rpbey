import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from './prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_TEMPLATE = (
  name: string,
  description: string,
  response: string,
) => `
import { CommandInteraction } from 'discord.js';
import { Discord, Slash } from 'discordx';

@Discord()
export class ${name.replace(/[^a-zA-Z0-9]/g, '')}Command {
  @Slash({ name: '${name}', description: '${description.replace(/'/g, "\\'")}' })
  async chatInputRun(interaction: CommandInteraction) {
    const response = \`${response.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
    
    // Check if response is JSON (simple check)
    if (response.trim().startsWith('{')) {
      try {
        const json = JSON.parse(response);
        return interaction.reply(json);
      } catch {
        // Fallback to text
      }
    }
    return interaction.reply({ content: response });
  }
}
`;

export async function generateCustomCommands() {
  // In production, we don't want to generate .ts files in dist at runtime
  // because they won't be compiled and will cause syntax errors.
  // We only generate them if we are in a dev environment or if we want to
  // persist them for the next build.

  const isProd = process.env.NODE_ENV === 'production';

  // If we are in dist, __dirname is .../dist/lib
  const srcDir = path.resolve(__dirname, '../../src/commands/Custom');
  const distDir = path.resolve(__dirname, '../commands/Custom');

  console.log('Generating custom commands...');

  try {
    // We always try to update src if it exists
    const _targetDir = srcDir;

    try {
      await fs.access(srcDir);
    } catch {
      // If src doesn't exist, we might be in a strictly production build
      if (isProd) {
        console.log(
          'Production mode: skipping custom command generation (src not found).',
        );
        return;
      }
      await fs.mkdir(srcDir, { recursive: true });
    }

    // Clear existing commands in src
    const existingFiles = await fs.readdir(srcDir);
    for (const file of existingFiles) {
      if (file.endsWith('.ts')) {
        await fs.unlink(path.join(srcDir, file));
      }
    }

    const commands = await prisma.botCommand.findMany({
      where: { enabled: true },
    });

    // Get list of existing hardcoded commands to avoid duplicates
    const hardcodedDirs = [
      'Beyblade',
      'General',
      'Moderation',
      'Admin',
      'Music',
      'Voice',
    ];
    const hardcodedCommands = new Set<string>();

    for (const dir of hardcodedDirs) {
      try {
        const dirPath = path.resolve(__dirname, '../commands', dir);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = await fs.readFile(path.join(dirPath, file), 'utf8');
            const match = content.match(/name:\s*['"]([^'"]+)['"]/);
            if (match?.[1]) {
              hardcodedCommands.add(match[1].toLowerCase());
            } else {
              const filename = file.split('.')[0];
              if (filename) {
                hardcodedCommands.add(filename.toLowerCase());
              }
            }
          }
        }
      } catch {
        // Ignore errors
      }
    }

    for (const cmd of commands) {
      const sanitizedName = cmd.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (hardcodedCommands.has(sanitizedName)) {
        continue;
      }

      const filePath = path.join(srcDir, `${cmd.name}.ts`);
      await fs.writeFile(
        filePath,
        COMMAND_TEMPLATE(sanitizedName, cmd.description, cmd.response),
      );
    }

    console.log(`Generated ${commands.length} custom commands in ${srcDir}`);

    // IF WE ARE IN PRODUCTION, we might also need to clean up any accidental .ts files in dist
    try {
      const distFiles = await fs.readdir(distDir);
      for (const file of distFiles) {
        if (file.endsWith('.ts')) {
          await fs.unlink(path.join(distDir, file));
        }
      }
    } catch {
      // distDir might not exist yet
    }
  } catch (error) {
    console.error('Failed to generate custom commands:', error);
  }
}
