import type { Season, SimConfig } from '../types';

/**
 * 단순화된 풍력 출력곡선 (정격 대비 0~1).
 *  v < 시동풍속            → 0
 *  시동 ≤ v < 정격         → (v³ − v_ci³) / (v_r³ − v_ci³)
 *  정격 ≤ v < 차단풍속     → 1
 *  v ≥ 차단풍속            → 0 (안전을 위한 정지)
 */
export function windPowerCurve(speedMs: number, cfg: SimConfig['wind']): number {
  const { cutInMs, ratedMs, cutOutMs } = cfg;
  if (speedMs < cutInMs || speedMs >= cutOutMs) return 0;
  if (speedMs >= ratedMs) return 1;
  const num = speedMs ** 3 - cutInMs ** 3;
  const den = ratedMs ** 3 - cutInMs ** 3;
  return num / den;
}

/** 대표일 시각별 풍속 (m/s): 계절 평균 × (1 + 진폭·cos 일변화) × 기상 배수 */
export function windSpeedMs(
  season: Season,
  hour: number,
  cfg: SimConfig['wind'],
  scale = 1,
): number {
  const mean = cfg.meanSpeedMs[season];
  const amp = cfg.diurnalAmplitude[season];
  const mid = hour + 0.5;
  const v = mean * (1 + amp * Math.cos((2 * Math.PI * (mid - cfg.peakHour)) / 24));
  return Math.max(0, v * scale);
}

/** 풍력 잠재 발전량 (GWh) */
export function windPotentialGWh(
  capacityGW: number,
  season: Season,
  hour: number,
  cfg: SimConfig['wind'],
  dtHours: number,
  scale = 1,
): number {
  return capacityGW * windPowerCurve(windSpeedMs(season, hour, cfg, scale), cfg) * cfg.availability * dtHours;
}
