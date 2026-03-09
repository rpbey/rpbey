import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EconomyCommand } from '../commands/Economy/Economy.js';
import { createMockInteraction, mockPrisma } from './mocks.js';

describe('EconomyCommand', () => {
  let economyCommand: EconomyCommand;

  beforeEach(() => {
    vi.clearAllMocks();
    economyCommand = new EconomyCommand(mockPrisma);
  });

  describe('daily', () => {
    it('should grant a reward if not claimed today', async () => {
      const interaction = createMockInteraction({
        commandName: 'quotidien',
        user: { id: 'user123', username: 'testuser', tag: 'testuser#1234' },
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'db-user-123',
        profile: {
          currency: 50,
          lastDaily: yesterday,
        },
      });

      mockPrisma.profile.update.mockResolvedValue({});
      vi.spyOn(Math, 'random').mockReturnValue(0);

      await economyCommand.daily(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('Tu as reçu **100 pièces**'),
      );
    });
  });

  describe('gamble', () => {
    it('should double the amount on win', async () => {
      const interaction = createMockInteraction({
        commandName: 'parier',
        user: { id: 'user123' },
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'db-user-123',
        profile: { currency: 100 },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.6);

      await economyCommand.gamble(50, interaction);

      const lastCall = (interaction.editReply as any).mock.calls[0][0];
      expect(lastCall.content).toContain('BRAVO ! Tu remportes **50 pièces**');
    });

    it('should lose the amount on loss', async () => {
      const interaction = createMockInteraction({
        commandName: 'parier',
        user: { id: 'user123' },
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'db-user-123',
        profile: { currency: 100 },
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.4);

      await economyCommand.gamble(50, interaction);

      const lastCall = (interaction.editReply as any).mock.calls[0][0];
      expect(lastCall.content).toContain(
        'DOMMAGE... Tu as perdu **50 pièces**',
      );
    });
  });

  describe('balance', () => {
    it('should show the correct balance', async () => {
      const interaction = createMockInteraction({
        commandName: 'solde',
        user: { id: 'user123', username: 'testuser' },
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'db-user-123',
        profile: { currency: 500 },
      });

      await economyCommand.balance(undefined, interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('500 pièces'),
      );
    });
  });
});
