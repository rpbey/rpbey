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
      // We use the CLI to trigger an agent turn. This ensures we use the correct config and token.
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);

      // Clean message for shell
      const safeMessage = message.replace(/'/g, "'\\''");
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '_');

      const pnpmPath = '/root/.nvm/versions/node/v24.12.0/bin/pnpm';

      let cmd = `${pnpmPath} start agent --message '${safeMessage}' --session-id '${safeSessionId}' --json`;
      if (options.channel) cmd += ` --channel ${options.channel}`;
      if (options.to) cmd += ` --to '${options.to}'`;

      // We run from /root/clawdbot directory
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: '/root/clawdbot',
        env: {
          ...process.env,
          PATH: '/root/.nvm/versions/node/v24.12.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
          HOME: '/root', // Important for finding .clawdbot config
        },
      });

      if (stderr && !stdout) {
        container.logger.error('[Clawdbot] Error calling agent:', stderr);
        return null;
      }

      const response = JSON.parse(stdout) as ClawdbotResponse;
      return response.result.payloads.map((p) => p.text).join('\n');
    } catch (error) {
      container.logger.error('[Clawdbot] Failed to ask Ryuga:', error);
      return null;
    }
  }
}

export const clawdbotService = ClawdbotService.getInstance();
