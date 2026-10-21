/** 엔진 공통 타입 정의 — React 의존성 없음 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_LABEL: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export type GenTech = 'solar' | 'wind' | 'nuclear' | 'coal' | 'lng';
export const GEN_TECHS: readonly GenTech[] = ['solar', 'wind', 'nuclear', 'coal', 'lng'];
export const TECH_LABEL: Record<GenTech | 'ess', string> = {
  solar: '태양광',
  wind: '풍력',
  nuclear: '원자력',
  coal: '석탄',
  lng: 'LNG',
  ess: 'ESS',
};

export type ThermalTech = 'coal' | 'lng';
export type AssetTech = GenTech | 'ess';
export type LearningTech = 'solar' | 'wind' | 'ess';
export const LEARNING_TECHS: readonly LearningTech[] = ['solar', 'wind', 'ess'];

/** deterministic: 기대값 기반 결정론 계산 / stochastic: 시드 기반 확률 사건(기상 변동·원전 고장) */
export type SimMode = 'deterministic' | 'stochastic';

export interface TechEconomics {
  /** 설치비 (억원/GW) */
  capexPerGW: number;
  /** 고정 운영비 (억원/GW·년) */
  fixedOmPerGWYear: number;
  /** 연료비 + 변동운영비 (원/MWh) */
  variableCostWonPerMWh: number;
  /** 배출계수 (tCO₂/MWh) */
  emissionFactorTPerMWh: number;
  /** 설비 수명 (년) */
  lifetimeYears: number;
}

export interface InitialCountry {
  solarGW: number;
  windGW: number;
  nuclearGW: number;
  coalGW: number;
  lngGW: number;
  essGWh: number;
  essGW: number;
  /** 시작 연도 연간 전력 수요 (TWh) */
  annualDemandTWh: number;
  /** 연간 수요 증가율 (0.015 = 1.5 %/년) */
  demandGrowthRate: number;
  /** 전력망 유연성 지표 0~1 */
  gridFlexibility: number;
  /** 수요반응 자원 (GW) */
  demandResponseGW: number;
  /** 정부 에너지 예산 잔액 (억원) */
  budget: number;
  /** 사회적 수용성 0~100 */
  socialAcceptance: number;
}

export type PolicyId =
  | 'solar_5gw'
  | 'wind_3gw'
  | 'nuclear_2gw'
  | 'coal_close_2gw'
  | 'lng_2gw'
  | 'ess_10gwh'
  | 'grid_flex'
  | 'efficiency';

export type PolicyEffect =
  | { kind: 'addCapacity'; tech: GenTech; gw: number }
  | { kind: 'addStorage'; gwh: number; gw: number }
  | { kind: 'retireCapacity'; tech: GenTech; gw: number }
  | { kind: 'gridFlex'; flexDelta: number; drDeltaGW: number }
  | { kind: 'efficiency'; growthDelta: number; demandCutFraction: number };

export interface PolicyDefinition {
  id: PolicyId;
  name: string;
  description: string;
  /** 건설(시행) 기간 (년). 0 = 선택한 해에 즉시 효과 */
  constructionYears: number;
  effect: PolicyEffect;
  /** 설비형이 아닌 정책(프로그램)의 총 사업비 (억원) */
  programCapex?: number;
  /** 프로그램 연간 운영비 (억원/년) */
  programOmPerYear?: number;
  /** 다른 정책과의 상호작용 설명 (결과는 시뮬레이션에서 계산됨) */
  interactions: string[];
}

export interface SimConfig {
  countryName: string;
  disclaimer: string;
  startYear: number;
  endYear: number;
  /** 시간 간격 (h) */
  dtHours: number;
  /** 계절별 대표일 가중치(일). 합계 365 */
  seasonWeights: Record<Season, number>;
  /** 계절별 24시간 상대 수요 형상 */
  demandShape: Record<Season, number[]>;
  /** 계절별 수요 수준 배수 */
  seasonDemandLevel: Record<Season, number>;
  solar: {
    sunriseHour: Record<Season, number>;
    sunsetHour: Record<Season, number>;
    /** 대표일 정오 최대 이용률 (일사량 × 시스템 효율) */
    peakCapacityFactor: Record<Season, number>;
    availability: number;
  };
  wind: {
    cutInMs: number;
    ratedMs: number;
    cutOutMs: number;
    meanSpeedMs: Record<Season, number>;
    diurnalAmplitude: Record<Season, number>;
    peakHour: number;
    availability: number;
  };
  nuclear: {
    minLoadFraction: number;
    /** 계절별 계획정비 비율 (가중평균 ≈ 연간 계획정비율) */
    plannedOutageBySeason: Record<Season, number>;
    /** 고장 정지 확률(호기·대표일 단위) */
    forcedOutageRate: number;
    unitSizeGW: number;
  };
  thermal: Record<ThermalTech, { availability: number; rampFractionPerHour: number }>;
  grid: {
    /** 유연성 0일 때 필요한 동기발전기(원자력·석탄·LNG) 최소 비율 (수요 대비) */
    minSyncFractionAtZeroFlex: number;
    /** 유연성 1일 때 최소 동기발전 비율 */
    minSyncFractionAtFullFlex: number;
    drMaxHoursPerDay: number;
    drCostWonPerMWh: number;
  };
  ess: {
    etaCharge: number;
    etaDischarge: number;
    minSocFraction: number;
    capexPerGWh: number;
    capexPerGW: number;
    fixedOmPerGWhYear: number;
    lifetimeYears: number;
    /** 대표일 순환 조건(SOC 시작=종료) 수렴 허용오차 (GWh) */
    cyclicTolGWh: number;
    cyclicMaxIter: number;
  };
  economics: {
    tech: Record<GenTech, TechEconomics>;
    carbonPriceWonPerT: number;
    includeCarbonInTotal: boolean;
    carbonInDispatch: boolean;
    discountRate: number;
    annualBudgetAllocation: number;
    decommissionCostPerGW: number;
  };
  learning: {
    exogenousDeclinePerYear: Record<LearningTech, number>;
    learningRate: Record<LearningTech, number>;
  };
  demand: {
    minGrowthRate: number;
  };
  initialFleet: {
    cohorts: number;
    remainingLifeYears: Record<AssetTech, [number, number]>;
  };
  applyRetirement: boolean;
  stochastic: {
    solarClearnessRange: [number, number];
    windScaleRange: [number, number];
    stormProbability: number;
    stormWindScale: number;
    demandShockRange: [number, number];
  };
  acceptance: {
    baseline: number;
    recoveryRate: number;
    /** 미공급 비율 1 당 감점 (0.005 → 10점 @2000) */
    unservedWeight: number;
    /** 평균 발전비용 1 % 상승 당 감점 */
    costWeightPerPct: number;
    /** 배출 1 % 감소 당 가점 */
    emissionWeightPerPct: number;
  };
  policies: Record<PolicyId, PolicyDefinition>;
  initial: InitialCountry;
}

/** 계절 대표일의 기상·가용 조건 (결정론 모드에서는 기준값) */
export interface SeasonConditions {
  solarClearness: number;
  windScale: number;
  storm: boolean;
  demandShock: number;
  /** 원자력 가용 비율 (계획정비·고장 반영) */
  nuclearAvailability: number;
}

export type YearConditions = Record<Season, SeasonConditions>;
