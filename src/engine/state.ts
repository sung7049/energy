import type {
  AssetTech,
  GenTech,
  LearningTech,
  PolicyEffect,
  PolicyId,
  SimConfig,
  SimMode,
  YearConditions,
} from './types';
import type { DayResult } from './dispatch';

/** 운영 중인 설비 묶음 (빈티지) */
export interface Cohort {
  id: string;
  tech: AssetTech;
  /** 발전 설비용량 또는 ESS 충·방전 출력 (GW) */
  gw: number;
  /** ESS 저장 용량 (GWh). 발전설비는 0 */
  gwh: number;
  /** 운영 시작 연도 */
  startYear: number;
  /** 이 연도부터 운영 중지 (startYear ≤ year < retireYear 동안 운영) */
  retireYear: number;
  /** 연간 자본비 (억원/년, CRF 연간화) */
  annualizedCapexEok: number;
  /** 고정 운영비 (억원/년) */
  fixedOmEok: number;
}

/** 건설·시행 중인 사업 */
export interface Project {
  id: string;
  policyId: PolicyId;
  name: string;
  startYear: number;
  /** 이 연도 초에 운영 개시 (그 전까지 발전량 0) */
  completionYear: number;
  capexTotalEok: number;
  /** 사업비 분할 지출 연수 */
  spendYears: number;
  effect: PolicyEffect;
  programOmPerYear: number;
}

export interface SimulationState {
  config: SimConfig;
  seed: number;
  mode: SimMode;
  /** 다음에 시뮬레이션할 연도 */
  year: number;
  cohorts: Cohort[];
  pipeline: Project[];
  completedProjects: Project[];
  flexibility: number;
  drGW: number;
  /** `year` 의 연간 전력 수요 (TWh) */
  annualDemandTWh: number;
  demandGrowthRate: number;
  /** 정부 에너지 예산 잔액 (억원) */
  budget: number;
  /** 누적 비용 (억원) */
  cumulativeCostEok: number;
  /** 누적 설치량 (학습곡선): 태양광·풍력 GW, ESS GWh */
  cumulativeBuilt: Record<LearningTech, number>;
  initialBuilt: Record<LearningTech, number>;
  socialAcceptance: number;
  programOmPerYear: number;
  policyLog: { year: number; policyId: PolicyId; projectId: string }[];
  history: YearResult[];
}

export interface CostBreakdown {
  /** 해당 연도 건설비 지출 (억원) */
  investment: number;
  fixedOm: number;
  /** 연료비 + 변동운영비 */
  fuelAndVariable: number;
  carbon: number;
  demandResponse: number;
  /** 운영 중 설비의 연간화 자본비 */
  annualizedCapex: number;
  /** 현금 기준 연간 총비용 = 투자 + 고정OM + 연료 + 수요반응 (+탄소) */
  totalCash: number;
  /** 연간화 시스템 비용 = 연간화 자본비 + 고정OM + 연료 + 수요반응 (+탄소) */
  systemAnnual: number;
}

export interface YearResult {
  year: number;
  mode: SimMode;
  capacitiesGW: Record<GenTech, number>;
  essGWh: number;
  essGW: number;
  flexibility: number;
  drGW: number;
  minSyncFraction: number;
  meritOrder: string[];
  underConstruction: { id: string; policyId: PolicyId; name: string; completionYear: number }[];
  completedThisYear: { id: string; policyId: PolicyId; name: string }[];
  retiredThisYear: { tech: AssetTech; gw: number; gwh: number; reason: 'lifetime' | 'policy' }[];
  /** 목표 연간 수요 (TWh) */
  annualDemandTWh: number;
  /** 시간별 합산 수요 (TWh, 확률 모드에서는 기온 충격 반영) */
  demandTWh: number;
  drTWh: number;
  /** 연간 실제 공급 전력량 = 수요(수요반응 후) − 미공급 */
  servedTWh: number;
  generationTWh: Record<GenTech, number>;
  potentialTWh: { solar: number; wind: number };
  curtailmentTWh: { solar: number; wind: number };
  essChargeTWh: number;
  essDischargeTWh: number;
  essLossTWh: number;
  essNetStoredGWh: number;
  unservedGWh: number;
  unservedHours: number;
  curtailedHours: number;
  inflexibleExcessGWh: number;
  syncShortfallGWh: number;
  peakDemandGW: number;
  scarcityDischargeGWh: number;
  emissionsMt: number;
  costs: CostBreakdown;
  cumulativeCostEok: number;
  budget: number;
  avgCostWonPerKWh: number;
  /** 기술 발전 수준 지수 (시작 연도 = 1.0, 설치비가 낮아질수록 증가) */
  techLevel: number;
  capexMultiplier: Record<LearningTech, number>;
  socialAcceptance: number;
  events: string[];
  conditions: YearConditions;
  days: DayResult[];
}
