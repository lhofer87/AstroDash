export type GoNoGo = 'go' | 'maybe' | 'nogo';

export interface NightVerdict {
  dateKey: string; // YYYY-MM-DD (local night label)
  label: string;
  verdict: GoNoGo;
  avgCloudCover: number;
  bestSeeing: number | null;
  reason: string;
}
