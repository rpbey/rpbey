import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from './prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOM_COMMANDS_DIR = path.join(__dirname, '../commands/Custom');

const COMMAND_TEMPLATE = (
  name: string,
  description: string,
  response: string,
) => `
import { Command } from '@sapphire/framework';

export class CustomCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: '${name}',
      description: '${description.replace(/'/g, "'")}',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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
  console.log('Generating custom commands...');

  try {
    // Ensure directory exists
    await fs.mkdir(CUSTOM_COMMANDS_DIR, { recursive: true });

    // Clear existing commands (except if we want to keep some static ones? No, this dir is for dynamic ones)
    const existingFiles = await fs.readdir(CUSTOM_COMMANDS_DIR);
    for (const file of existingFiles) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        await fs.unlink(path.join(CUSTOM_COMMANDS_DIR, file));
      }
    }

    const commands = await prisma.botCommand.findMany({
      where: { enabled: true },
    });

    // Get list of existing hardcoded commands to avoid duplicates
    // We check other directories in src/commands/
    const hardcodedDirs = ['Beyblade', 'General', 'Moderation'];
    const hardcodedCommands = new Set<string>();

    for (const dir of hardcodedDirs) {
      try {
        const dirPath = path.join(__dirname, '../commands', dir);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = await fs.readFile(path.join(dirPath, file), 'utf8');
            // Try to find .setName('commandName') in the file content
            const match = content.match(/\.setName\(['"]([^'"]+)['"]\)/);
            if (match && match[1]) {
              hardcodedCommands.add(match[1].toLowerCase());
            } else {
              // Fallback to filename if .setName is not found
              const filename = file.split('.')[0];
              if (filename) {
                hardcodedCommands.add(filename.toLowerCase());
              }
            }
          }
        }
      } catch {
        // Directory might not exist or be inaccessible
      }
    }

    for (const cmd of commands) {
      // Sanitize name: lowercase, only alphanumeric and dashes
      const sanitizedName = cmd.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-') // replace multiple dashes with one
        .replace(/^-|-$/g, ''); // remove leading/trailing dashes

      if (hardcodedCommands.has(sanitizedName)) {
        console.log(
          `Skipping custom command "${cmd.name}" (sanitized: "${sanitizedName}") because it conflicts with a hardcoded command.`,
        );
        continue;
      }

      const filePath = path.join(CUSTOM_COMMANDS_DIR, `${cmd.name}.ts`);
      await fs.writeFile(
        filePath,
        COMMAND_TEMPLATE(sanitizedName, cmd.description, cmd.response),
      );
    }

    console.log(
      `Generated ${commands.length} custom commands in ${CUSTOM_COMMANDS_DIR}`,
    );
  } catch (error) {
    console.error('Failed to generate custom commands:', error);
  }
}
