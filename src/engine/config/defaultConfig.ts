import type { SimConfig } from '../types';
import {
  DEMAND_SHAPE,
  SEASON_DEMAND_LEVEL,
  SEASON_WEIGHTS,
  SOLAR_PEAK_CF,
  SUNRISE,
  SUNSET,
  WIND_DIURNAL_AMPLITUDE,
  WIND_MEAN_SPEED,
} from './profiles';
import { DEFAULT_POLICIES } from './policies';

/**
 * 기본 설정 — 교육용 가상 국가 "한빛국".
 * 모든 수치는 교육 목적의 가상값이며 실제 대한민국 통계가 아닙니다.
 * 이 파일의 값을 바꾸면 엔진 계산 전체에 반영됩니다.
 */
export const DEFAULT_CONFIG: SimConfig = {
  countryName: '한빛국 (가상)',
  disclaimer:
    '이 시뮬레이션의 모든 수치는 교육용 가상 국가 "한빛국"의 가정값이며, 실제 대한민국 전력 통계와 다릅니다.',
  startYear: 2026,
  endYear: 2050,
  dtHours: 1,
  seasonWeights: SEASON_WEIGHTS,
  demandShape: DEMAND_SHAPE,
  seasonDemandLevel: SEASON_DEMAND_LEVEL,
  solar: {
    sunriseHour: SUNRISE,
    sunsetHour: SUNSET,
    peakCapacityFactor: SOLAR_PEAK_CF,
    availability: 0.98,
  },
  wind: {
    cutInMs: 3,
    ratedMs: 12,
    cutOutMs: 25,
    meanSpeedMs: WIND_MEAN_SPEED,
    diurnalAmplitude: WIND_DIURNAL_AMPLITUDE,
    peakHour: 14,
    availability: 0.97,
  },
  nuclear: {
    minLoadFraction: 0.7,
    // 계획정비는 수요가 낮은 봄·가을에 집중. 가중평균 ≈ 8 %
    plannedOutageBySeason: { spring: 0.14, summer: 0.02, autumn: 0.14, winter: 0.02 },
    forcedOutageRate: 0.03,
    unitSizeGW: 1.4,
  },
  thermal: {
    coal: { availability: 0.88, rampFractionPerHour: 0.4 },
    lng: { availability: 0.92, rampFractionPerHour: 1.0 },
  },
  grid: {
    minSyncFractionAtZeroFlex: 0.5,
    minSyncFractionAtFullFlex: 0.15,
    drMaxHoursPerDay: 4,
    drCostWonPerMWh: 300000,
  },
  ess: {
    etaCharge: 0.95,
    etaDischarge: 0.95,
    minSocFraction: 0.1,
    capexPerGWh: 2500,
    capexPerGW: 1500,
    fixedOmPerGWhYear: 40,
    lifetimeYears: 15,
    cyclicTolGWh: 1e-6,
    cyclicMaxIter: 200,
  },
  economics: {
    tech: {
      solar: { capexPerGW: 9000, fixedOmPerGWYear: 120, variableCostWonPerMWh: 3000, emissionFactorTPerMWh: 0, lifetimeYears: 25 },
      wind: { capexPerGW: 25000, fixedOmPerGWYear: 500, variableCostWonPerMWh: 5000, emissionFactorTPerMWh: 0, lifetimeYears: 25 },
      nuclear: { capexPerGW: 60000, fixedOmPerGWYear: 1500, variableCostWonPerMWh: 7000, emissionFactorTPerMWh: 0, lifetimeYears: 60 },
      coal: { capexPerGW: 20000, fixedOmPerGWYear: 600, variableCostWonPerMWh: 90000, emissionFactorTPerMWh: 0.82, lifetimeYears: 40 },
      lng: { capexPerGW: 9000, fixedOmPerGWYear: 300, variableCostWonPerMWh: 150000, emissionFactorTPerMWh: 0.37, lifetimeYears: 30 },
    },
    carbonPriceWonPerT: 30000,
    includeCarbonInTotal: true,
    carbonInDispatch: true,
    discountRate: 0.05,
    annualBudgetAllocation: 60000,
    decommissionCostPerGW: 1000,
  },
  learning: {
    exogenousDeclinePerYear: { solar: 0.02, wind: 0.01, ess: 0.03 },
    learningRate: { solar: 0.1, wind: 0.05, ess: 0.1 },
  },
  demand: {
    minGrowthRate: -0.01,
  },
  initialFleet: {
    cohorts: 5,
    remainingLifeYears: {
      solar: [15, 25],
      wind: [15, 25],
      nuclear: [20, 50],
      coal: [10, 30],
      lng: [15, 30],
      ess: [8, 15],
    },
  },
  applyRetirement: true,
  stochastic: {
    solarClearnessRange: [0.8, 1.1],
    windScaleRange: [0.75, 1.25],
    stormProbability: 0.05,
    stormWindScale: 2.4,
    demandShockRange: [0.97, 1.03],
  },
  acceptance: {
    baseline: 60,
    recoveryRate: 0.25,
    unservedWeight: 200,
    costWeightPerPct: 0.3,
    emissionWeightPerPct: 0.4,
  },
  policies: DEFAULT_POLICIES,
  initial: {
    solarGW: 30,
    windGW: 5,
    nuclearGW: 26,
    coalGW: 36,
    lngGW: 42,
    essGWh: 10,
    essGW: 2.5,
    annualDemandTWh: 500,
    demandGrowthRate: 0.008,
    gridFlexibility: 0.25,
    demandResponseGW: 2,
    budget: 200000,
    socialAcceptance: 60,
  },
};

/** 설정을 깊은 복사하여 일부 값을 덮어쓴 새 설정을 반환 */
export function makeConfig(patch: (c: SimConfig) => void = () => {}): SimConfig {
  const c = structuredClone(DEFAULT_CONFIG);
  patch(c);
  return c;
}
