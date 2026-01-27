import { container } from '@sapphire/framework';

export interface ClawdbotResponse {
  runId: string;
  status: string;
  summary: string;
  result: {
    payloads: Array<{
      text: string;
      mediaUrl?: string | null;
    }>;
  };
}

export class ClawdbotService {
  private static instance: ClawdbotService;
  // Actually Clawdbot gateway is WebSocket based for 'agent' calls usually,
  // but it might have an HTTP endpoint for some tools or I can use the CLI wrapper.
  // Using the CLI wrapper is safer and easier since it's already set up.

  private constructor() {}

  public static getInstance(): ClawdbotService {
    if (!ClawdbotService.instance) {
      ClawdbotService.instance = new ClawdbotService();
    }
    return ClawdbotService.instance;
  }

  public async askRyuga(
    message: string,
    sessionId: string,
    options: { to?: string; channel?: string } = {},
  ): Promise<string | null> {
    try {
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);

      // Clean message for shell
      const safeMessage = message.replace(/'/g, "'\\''");
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '_');

      // Use local CLI installed in node_modules
      // Assuming cwd is the bot project root (bot/)
      const clawdbotBin = './node_modules/.bin/clawdbot';

      let cmd = `${clawdbotBin} agent --message '${safeMessage}' --session-id '${safeSessionId}' --json`;
      if (options.channel) cmd += ` --channel ${options.channel}`;
      if (options.to) cmd += ` --to '${options.to}'`;

      const { stdout, stderr } = await execAsync(cmd, {
        cwd: process.cwd(), // Execute from bot root
        env: {
          ...process.env,
          HOME: '/root', // Ensure it finds ~/.clawdbot config
        },
      });

      if (stderr && !stdout) {
        // Warning: Clawdbot CLI might print logs to stderr even on success
        // We only consider it an error if stdout is empty
        container.logger.warn('[Clawdbot] Stderr:', stderr);
      }

      const response = JSON.parse(stdout) as ClawdbotResponse;

      // Handle case where result might be empty
      if (!response.result?.payloads?.length) {
        return null;
      }

      return response.result.payloads.map((p) => p.text).join('\n');
    } catch (error) {
      container.logger.error('[Clawdbot] Failed to ask Ryuga:', error);
      return null;
    }
  }
}

export const clawdbotService = ClawdbotService.getInstance();
