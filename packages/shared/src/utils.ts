/**
 * Format a date to French locale
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date in short format (e.g., "25 déc. 2024")
 */
export function formatDateShort(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Parse a stat string (e.g. "29+") to a number
 */
export function parseStat(stat: string | number | null | undefined): number {
  if (typeof stat === 'number') return stat;
  if (!stat) return 0;
  const match = String(stat).match(/^(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format currency with separator
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR');
}

/**
 * Calculate time until next daily reset (midnight UTC)
 */
export function getTimeUntilDaily(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
  };
}

/**
 * Get rarity sort order (higher = rarer)
 */
export function raritySortOrder(rarity: string): number {
  const order: Record<string, number> = {
    COMMON: 0,
    RARE: 1,
    SUPER_RARE: 2,
    LEGENDARY: 3,
    SECRET: 4,
  };
  return order[rarity] ?? 0;
}
