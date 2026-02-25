export interface SynergyItem {
  name: string;
  score: number;
}

export interface PartStats {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burst: number;
}

export interface ComponentData {
  name: string;
  score: number;
  position_change: number | 'NEW';
  synergy: SynergyItem[];
  stats?: PartStats;
}

export interface CategoryData {
  category: string;
  components: ComponentData[];
}

export interface PeriodMetadata {
  dataSource: string;
  weekId: string;
  startDate: string;
  endDate: string;
  eventsScanned: number;
  partsAnalyzed: number;
}

export interface PeriodData {
  metadata: PeriodMetadata;
  categories: CategoryData[];
}

export interface BbxWeeklyData {
  scrapedAt: string;
  periods: {
    '2weeks': PeriodData;
    '4weeks': PeriodData;
  };
}

export type PeriodKey = '2weeks' | '4weeks';

export const CATEGORY_COLORS: Record<string, string> = {
  Blade: '#dc2626',
  Ratchet: '#fbbf24',
  Bit: '#22c55e',
  'Lock Chip': '#60a5fa',
  'Assist Blade': '#a855f7',
};
