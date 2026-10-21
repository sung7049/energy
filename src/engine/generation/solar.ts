import type { Season, SimConfig } from '../types';
import { clamp } from '../units';

/**
 * 태양광 이용률 (0~1).
 * 시각 h의 구간 [h, h+1) 중앙(h+0.5)에서 일사량을 사인형 일변화로 근사.
 * 일출 전·일몰 후(야간)는 정확히 0.
 */
export function solarCapacityFactor(
  season: Season,
  hour: number,
  cfg: SimConfig['solar'],
  clearness = 1,
): number {
  const mid = hour + 0.5;
  const sr = cfg.sunriseHour[season];
  const ss = cfg.sunsetHour[season];
  if (mid <= sr || mid >= ss) return 0;
  const shape = Math.sin((Math.PI * (mid - sr)) / (ss - sr));
  return clamp(cfg.peakCapacityFactor[season] * clearness * shape, 0, 1);
}

export function isNightHour(season: Season, hour: number, cfg: SimConfig['solar']): boolean {
  const mid = hour + 0.5;
  return mid <= cfg.sunriseHour[season] || mid >= cfg.sunsetHour[season];
}

/** 태양광 잠재 발전량 (GWh) = 설비(GW) × 이용률 × 가용률 × dt(h) */
export function solarPotentialGWh(
  capacityGW: number,
  season: Season,
  hour: number,
  cfg: SimConfig['solar'],
  dtHours: number,
  clearness = 1,
): number {
  return capacityGW * solarCapacityFactor(season, hour, cfg, clearness) * cfg.availability * dtHours;
}
