/**
 * 단위 규약 (Unit conventions)
 *
 * - 전력(power):   GW
 * - 시간 간격:      h  (기본 dt = 1 h)
 * - 시간별 에너지:  GWh = GW × h
 * - 연간 에너지:    TWh = 1000 GWh
 * - 배출계수:       tCO₂/MWh,  연간 배출: MtCO₂ = 10^6 tCO₂
 * - 변동비:         원/MWh,   금액 집계: 억원 = 10^8 원
 * - 설비비:         억원/GW, 억원/GWh
 *
 * 1 억원/GWh = 10^8 원 / 10^6 kWh = 100 원/kWh
 */

export const HOURS_PER_DAY = 24;
export const DAYS_PER_YEAR = 365;
export const HOURS_PER_YEAR = HOURS_PER_DAY * DAYS_PER_YEAR; // 8760

/** 평균 전력(GW)을 시간 간격(h) 동안의 에너지(GWh)로 변환 */
export function powerToEnergyGWh(powerGW: number, hours: number): number {
  return powerGW * hours;
}

/** 시간 간격 동안의 에너지(GWh)를 평균 전력(GW)으로 변환 */
export function energyToPowerGW(energyGWh: number, hours: number): number {
  if (hours <= 0) throw new Error('hours must be positive');
  return energyGWh / hours;
}

export const gwhToTWh = (gwh: number): number => gwh / 1000;
export const twhToGWh = (twh: number): number => twh * 1000;
export const gwhToMWh = (gwh: number): number => gwh * 1000;
export const mwhToGWh = (mwh: number): number => mwh / 1000;
export const tonnesToMt = (t: number): number => t / 1e6;

/** 발전량(GWh) × 배출계수(tCO₂/MWh) → 배출량(tCO₂) */
export function emissionsTonnes(energyGWh: number, factorTPerMWh: number): number {
  return gwhToMWh(energyGWh) * factorTPerMWh;
}

/** 원/MWh → 억원/GWh */
export function wonPerMWhToEokPerGWh(wonPerMWh: number): number {
  return (wonPerMWh * 1000) / 1e8;
}

/** 원 → 억원 */
export const wonToEok = (won: number): number => won / 1e8;

/** 억원/GWh → 원/kWh */
export function eokPerGWhToWonPerKWh(eokPerGWh: number): number {
  return eokPerGWh * 100;
}

/** 자본회수계수 (Capital Recovery Factor) */
export function capitalRecoveryFactor(rate: number, years: number): number {
  if (years <= 0) return 1;
  if (rate === 0) return 1 / years;
  return rate / (1 - Math.pow(1 + rate, -years));
}

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
