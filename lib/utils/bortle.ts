/**
 * Heuristic: maps one screen pixel's RGB (0–255) to a rough Bortle class.
 *
 * Important: the pixel comes from the **rendered Mapbox canvas** (basemap + semi-transparent
 * VIIRS overlay + labels), not from raw satellite science data. Thresholds are a rough guess,
 * not a World Atlas / Bortle calibration — expect often mid-scale (e.g. 4–6) on dark vector maps.
 */
export function estimateBortleFromPixel(
  r: number,
  g: number,
  b: number
): { bortleClass: number; radiance: number } {
  const intensity = (r + g + b) / 3;
  const radiance = Math.round(intensity * 10) / 10;

  let bortleClass: number;
  if (intensity <= 5) bortleClass = 1;
  else if (intensity <= 12) bortleClass = 2;
  else if (intensity <= 20) bortleClass = 3;
  else if (intensity <= 35) bortleClass = 4;
  else if (intensity <= 55) bortleClass = 5;
  else if (intensity <= 85) bortleClass = 6;
  else if (intensity <= 120) bortleClass = 7;
  else if (intensity <= 160) bortleClass = 8;
  else bortleClass = 9;

  return { bortleClass, radiance };
}
