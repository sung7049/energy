import type { AssetTech, LearningTech, SimConfig } from './types';
import { LEARNING_TECHS } from './types';
import type { Cohort, SimulationState } from './state';
import { capitalRecoveryFactor } from './units';

/**
 * 설치비 배수 = 외생적 기술진보 × 국내 학습곡선
 *   외생: (1 − d)^(year − startYear)
 *   학습: (누적설치 / 초기누적)^(−b),  b = −log2(1 − 학습률)
 */
export function capexMultiplier(
  state: Pick<SimulationState, 'config' | 'cumulativeBuilt' | 'initialBuilt'>,
  tech: AssetTech,
  year: number,
): number {
  if (!(LEARNING_TECHS as readonly string[]).includes(tech)) return 1;
  const t = tech as LearningTech;
  const L = state.config.learning;
  const exo = Math.pow(1 - L.exogenousDeclinePerYear[t], Math.max(0, year - state.config.startYear));
  const base = Math.max(1, state.initialBuilt[t]);
  const ratio = Math.max(1, state.cumulativeBuilt[t] / base);
  const b = -Math.log2(1 - L.learningRate[t]);
  return exo * Math.pow(ratio, -b);
}

export function capexMultipliers(
  state: Pick<SimulationState, 'config' | 'cumulativeBuilt' | 'initialBuilt'>,
  year: number,
): Record<LearningTech, number> {
  return {
    solar: capexMultiplier(state, 'solar', year),
    wind: capexMultiplier(state, 'wind', year),
    ess: capexMultiplier(state, 'ess', year),
  };
}

export function techLevelIndex(m: Record<LearningTech, number>): number {
  return (1 / m.solar + 1 / m.wind + 1 / m.ess) / 3;
}

/** 설비 묶음의 총 설치비 (억원) */
export function assetCapexEok(config: SimConfig, tech: AssetTech, gw: number, gwh: number, mult: number): number {
  if (tech === 'ess') return (gwh * config.ess.capexPerGWh + gw * config.ess.capexPerGW) * mult;
  return gw * config.economics.tech[tech].capexPerGW * mult;
}

export function assetLifetime(config: SimConfig, tech: AssetTech): number {
  return tech === 'ess' ? config.ess.lifetimeYears : config.economics.tech[tech].lifetimeYears;
}

export function makeCohort(
  config: SimConfig,
  id: string,
  tech: AssetTech,
  gw: number,
  gwh: number,
  startYear: number,
  retireYear: number,
  capexEok: number,
): Cohort {
  const life = assetLifetime(config, tech);
  const crf = capitalRecoveryFactor(config.economics.discountRate, life);
  const fixedOm =
    tech === 'ess' ? gwh * config.ess.fixedOmPerGWhYear : gw * config.economics.tech[tech].fixedOmPerGWYear;
  return {
    id,
    tech,
    gw,
    gwh,
    startYear,
    retireYear,
    annualizedCapexEok: capexEok * crf,
    fixedOmEok: fixedOm,
  };
}
