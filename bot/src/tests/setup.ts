import 'reflect-metadata';
import { vi } from 'vitest';

// Mock simple components if needed
vi.mock('discord.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('discord.js')>();
  return {
    ...actual,
    // Add specific mocks if needed
  };
});
