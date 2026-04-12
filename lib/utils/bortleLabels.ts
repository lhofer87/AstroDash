/** Short Bortle sky quality labels (aligned with common scale descriptions). */
export function bortleSkyLabel(bortleClass: number): string {
  const b = Math.min(9, Math.max(1, Math.round(bortleClass)));
  const labels: Record<number, string> = {
    1: 'Excellent Dark Sky',
    2: 'Truly Dark Sky',
    3: 'Rural Sky',
    4: 'Rural / Suburban',
    5: 'Suburban Sky',
    6: 'Bright Suburban',
    7: 'Urban / Suburban',
    8: 'City Sky',
    9: 'Inner City',
  };
  return labels[b] ?? 'Unknown';
}
