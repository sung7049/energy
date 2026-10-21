import type {
  AssetTech,
  GenTech,
  LearningTech,
  PolicyId,
  SimConfig,
  SimMode,
  YearConditions,
} from './types';
import { GEN_TECHS, SEASONS } from './types';
import type { CostBreakdown, SimulationState, YearResult } from './state';
import { makeCohort } from './economics';
import { completeProjects, investmentSpending, operationalCapacity, retireByLifetime, applyPolicy } from './policies';
import { capexMultipliers, techLevelIndex } from './economics';
import { simulateYearDispatch } from './dispatch';
import { hashSeed, mulberry32, uniform } from './random';
import { gwhToTWh } from './units';

/**
 * 초기 상태 생성 함수
 */
export function createInitialState(
  customConfig?: SimConfig,
  seed: number = 42,
  mode: SimMode = 'deterministic',
): SimulationState {
  const config = customConfig ?? ({} as SimConfig); // defaultConfig는 호출측 또는 simulator index에서 기본값 주입
  const init = config.initial;
  const startYear = config.startYear;

  const cohorts: SimulationState['cohorts'] = [];

  // 초기 설비 등록 (기술별 분할 코호트)
  const addInitialCohorts = (
    tech: AssetTech,
    totalGW: number,
    totalGWh: number,
  ) => {
    if (totalGW <= 0 && totalGWh <= 0) return;
    const n = config.initialFleet.cohorts;
    const [minL, maxL] = config.initialFleet.remainingLifeYears[tech];
    const gwPerCohort = totalGW / n;
    const gwhPerCohort = totalGWh / n;
    const lifetime = config.economics.tech[tech as GenTech]?.lifetimeYears ?? config.ess.lifetimeYears;
    // 잔여 수명이 설비 수명을 초과하지 않도록 보장
    const safeMinL = Math.max(1, Math.min(minL, lifetime));
    const safeMaxL = Math.max(safeMinL, Math.min(maxL, lifetime));

    for (let i = 0; i < n; i++) {
      const rem = safeMinL + (safeMaxL - safeMinL) * (i / Math.max(1, n - 1));
      const retireYear = Math.round(startYear + rem);
      // 이미 과거에 건설되어 현재 운영 중인 설비이므로 startYear <= config.startYear 여야 함.
      // 가동 시작 연도 = 은퇴 연도 - 설비 수명 (과거 시점)
      const cohortStartYear = retireYear - lifetime;
      const cohort = makeCohort(
        config,
        `init-${tech}-${i + 1}`,
        tech,
        gwPerCohort,
        gwhPerCohort,
        cohortStartYear,
        retireYear,
        0, // 기존 설비는 기투자된 것으로 간주(자본비 0 혹은 기설정)
      );
      cohorts.push(cohort);
    }
  };

  addInitialCohorts('solar', init.solarGW, 0);
  addInitialCohorts('wind', init.windGW, 0);
  addInitialCohorts('nuclear', init.nuclearGW, 0);
  addInitialCohorts('coal', init.coalGW, 0);
  addInitialCohorts('lng', init.lngGW, 0);
  addInitialCohorts('ess', init.essGW, init.essGWh);

  const initialBuilt: Record<LearningTech, number> = {
    solar: init.solarGW,
    wind: init.windGW,
    ess: init.essGWh,
  };

  return {
    config,
    seed,
    mode,
    year: startYear,
    cohorts,
    pipeline: [],
    completedProjects: [],
    flexibility: init.gridFlexibility,
    drGW: init.demandResponseGW,
    annualDemandTWh: init.annualDemandTWh,
    demandGrowthRate: init.demandGrowthRate,
    budget: init.budget,
    cumulativeCostEok: 0,
    cumulativeBuilt: { ...initialBuilt },
    initialBuilt,
    socialAcceptance: init.socialAcceptance,
    programOmPerYear: 0,
    policyLog: [],
    history: [],
  };
}

/**
 * 기상 및 계통 조건 생성기
 */
export function generateConditions(
  config: SimConfig,
  year: number,
  mode: SimMode,
  seed: number,
): YearConditions {
  const isStochastic = mode === 'stochastic';
  const out = {} as YearConditions;

  for (const s of SEASONS) {
    if (!isStochastic) {
      out[s] = {
        solarClearness: 1.0,
        windScale: 1.0,
        storm: false,
        demandShock: 1.0,
        nuclearAvailability:
          (1 - config.nuclear.plannedOutageBySeason[s]) * (1 - config.nuclear.forcedOutageRate),
      };
    } else {
      const seasonIndex = SEASONS.indexOf(s);
      const rng = mulberry32(hashSeed(seed, year, seasonIndex + 1));
      const solarClearness = uniform(rng, config.stochastic.solarClearnessRange);
      const windScale = uniform(rng, config.stochastic.windScaleRange);
      const storm = rng() < config.stochastic.stormProbability;
      const demandShock = uniform(rng, config.stochastic.demandShockRange);
      const nucAvail =
        (1 - config.nuclear.plannedOutageBySeason[s]) * (1 - (rng() < config.nuclear.forcedOutageRate ? 0.08 : 0));

      out[s] = {
        solarClearness,
        windScale,
        storm,
        demandShock,
        nuclearAvailability: nucAvail,
      };
    }
  }

  return out;
}

/**
 * 1년 시뮬레이션 전진 (stepYear)
 */
export function stepYear(
  currentState: SimulationState,
  policyToApply?: PolicyId,
): { state: SimulationState; result: YearResult } {
  let state = { ...currentState };
  const currentYear = state.year;
  const config = state.config;

  // 1. 새 정책 선택 시 파이프라인에 추가
  if (policyToApply) {
    state = applyPolicy(state, policyToApply);
  }

  // 2. 완공 프로젝트 반영 (설비 및 프로그램 가동 시작)
  const comp = completeProjects(state);
  state = comp.state;

  // 3. 노후 설비 퇴역 처리
  const ret = retireByLifetime(state);
  state = ret.state;

  // 4. 가동 중인 설비 용량 집계
  const capacitiesGW = {} as Record<GenTech, number>;
  for (const t of GEN_TECHS) {
    capacitiesGW[t] = operationalCapacity(state.cohorts, t, currentYear).gw;
  }
  const essCap = operationalCapacity(state.cohorts, 'ess', currentYear);

  // 5. 조건(기상, 가용률 등) 생성
  const conditions = generateConditions(config, currentYear, state.mode, state.seed);

  // 6. 시간별 전력 수급 및 급전 계산
  const dispatchRes = simulateYearDispatch({
    config,
    capacitiesGW,
    essGWh: essCap.gwh,
    essGW: essCap.gw,
    annualDemandTWh: state.annualDemandTWh,
    flexibility: state.flexibility,
    drGW: state.drGW,
    conditions,
  });

  const totals = dispatchRes.totals;

  // 7. 비용 및 경제성 계산
  const investment = investmentSpending(
    [...state.pipeline, ...state.completedProjects],
    currentYear,
  );

  let cohortFixedOm = 0;
  let annualizedCapex = 0;
  for (const c of state.cohorts) {
    if (c.startYear <= currentYear && currentYear < c.retireYear) {
      cohortFixedOm += c.fixedOmEok;
      annualizedCapex += c.annualizedCapexEok;
    }
  }
  const fixedOm = cohortFixedOm + state.programOmPerYear;
  const fuelAndVar = totals.variableCostEok;
  const carbonEok = (totals.emissionsT * config.economics.carbonPriceWonPerT) / 1e8;
  const drCost = totals.drCostEok;

  const totalCash =
    investment +
    fixedOm +
    fuelAndVar +
    drCost +
    (config.economics.includeCarbonInTotal ? carbonEok : 0);

  const systemAnnual =
    annualizedCapex +
    fixedOm +
    fuelAndVar +
    drCost +
    (config.economics.includeCarbonInTotal ? carbonEok : 0);

  const costBreakdown: CostBreakdown = {
    investment,
    fixedOm,
    fuelAndVariable: fuelAndVar,
    carbon: carbonEok,
    demandResponse: drCost,
    annualizedCapex,
    totalCash,
    systemAnnual,
  };

  const cumulativeCostEok = state.cumulativeCostEok + totalCash;
  const budget = state.budget + config.economics.annualBudgetAllocation - investment;

  // 8. 사회적 수용성 및 국민 지지율 모델링
  const servedTWh = gwhToTWh(totals.servedGWh);
  const totalDemandTWh = gwhToTWh(totals.demandGWh);
  const unservedRate = totalDemandTWh > 0 ? totals.unservedGWh / totals.demandGWh : 0;
  const avgCostWonPerKWh =
    servedTWh > 0 ? (totalCash * 1e8) / (servedTWh * 1e9) : 0;

  // 기준 대비 변화량 및 요인별 수용성 영향 산정:
  // (1) 기준선 회복 (평상시 baseline으로의 회귀 경향: 30% 속도로 점진적 회복)
  let acceptance = state.socialAcceptance + (config.acceptance.baseline - state.socialAcceptance) * config.acceptance.recoveryRate;

  // (2) 전력 공급 부족에 따른 감점 (연간 미공급 비율에 비례: 5% 부족 시 약 6~8점, 10% 부족 시 15점, 최대 30점 감점)
  const unservedPenalty = Math.min(30, unservedRate * 150);
  acceptance -= unservedPenalty;

  // (3) 전기요금/공급비용 부담 (급격한 단기 폭등 완충)
  const prevAvgCost = state.history.length > 0 ? state.history[state.history.length - 1].avgCostWonPerKWh : 150;
  const rawCostChangePct = prevAvgCost > 0 ? ((avgCostWonPerKWh - prevAvgCost) / prevAvgCost) * 100 : 0;
  const costChangePct = Math.max(-20, Math.min(20, rawCostChangePct));
  acceptance -= costChangePct * config.acceptance.costWeightPerPct;

  // (4) 탄소 배출 감소에 따른 환경적 수용성 효과 (감소 시 가점)
  const prevEmissions = state.history.length > 0 ? state.history[state.history.length - 1].emissionsMt : (totals.emissionsT / 1e6);
  const rawEmissionChangePct = prevEmissions > 0 ? ((prevEmissions - (totals.emissionsT / 1e6)) / prevEmissions) * 100 : 0;
  const emissionChangePct = Math.max(-20, Math.min(20, rawEmissionChangePct));
  acceptance += emissionChangePct * config.acceptance.emissionWeightPerPct;

  // (5) 대규모 발전소/송전망 신규 착공에 따른 지역사회 갈등 (NIMBY)
  const activeConstructionGW = state.pipeline.reduce((acc, p) => {
    if (p.effect.kind === 'addCapacity') return acc + p.effect.gw;
    return acc;
  }, 0);
  const localConflictPenalty = Math.min(8, activeConstructionGW * 0.08);
  acceptance -= localConflictPenalty;

  // 0 ~ 100 범위 엄격 유지
  acceptance = Math.min(100, Math.max(0, acceptance));

  // 9. 기술 발전 수준
  const multipliers = capexMultipliers(state, currentYear);
  const techLevel = techLevelIndex(multipliers);

  // 10. 이벤트 및 보고서 항목 구성
  const events: string[] = [];
  if (comp.completed.length > 0) {
    events.push(`완공: ${comp.completed.map((p) => p.name).join(', ')}`);
  }
  const allRetired = [...comp.retired, ...ret.retired];
  if (allRetired.length > 0) {
    events.push(
      `설비 퇴역: ${allRetired.map((r) => `${r.tech} ${r.gw.toFixed(1)}GW (${r.reason})`).join(', ')}`,
    );
  }
  if (totals.unservedGWh > 1e-4) {
    events.push(`전력 공급 부족 발생: ${totals.unservedGWh.toFixed(1)} GWh (${totals.unservedHours.toFixed(0)}시간)`);
  }
  if (totals.curtailmentGWh.solar + totals.curtailmentGWh.wind > 1e-4) {
    events.push(
      `출력제어 발생: ${(totals.curtailmentGWh.solar + totals.curtailmentGWh.wind).toFixed(1)} GWh`,
    );
  }

  const genTWh = {} as Record<GenTech, number>;
  for (const t of GEN_TECHS) {
    genTWh[t] = gwhToTWh(totals.generationGWh[t]);
  }

  const result: YearResult = {
    year: currentYear,
    mode: state.mode,
    capacitiesGW,
    essGWh: essCap.gwh,
    essGW: essCap.gw,
    flexibility: state.flexibility,
    drGW: state.drGW,
    minSyncFraction: dispatchRes.minSyncFraction,
    meritOrder: dispatchRes.meritOrder,
    underConstruction: state.pipeline.map((p) => ({
      id: p.id,
      policyId: p.policyId,
      name: p.name,
      completionYear: p.completionYear,
    })),
    completedThisYear: comp.completed.map((p) => ({
      id: p.id,
      policyId: p.policyId,
      name: p.name,
    })),
    retiredThisYear: allRetired,
    annualDemandTWh: state.annualDemandTWh,
    demandTWh: totalDemandTWh,
    drTWh: gwhToTWh(totals.drGWh),
    servedTWh,
    generationTWh: genTWh,
    potentialTWh: {
      solar: gwhToTWh(totals.potentialGWh.solar),
      wind: gwhToTWh(totals.potentialGWh.wind),
    },
    curtailmentTWh: {
      solar: gwhToTWh(totals.curtailmentGWh.solar),
      wind: gwhToTWh(totals.curtailmentGWh.wind),
    },
    essChargeTWh: gwhToTWh(totals.essChargeGWh),
    essDischargeTWh: gwhToTWh(totals.essDischargeGWh),
    essLossTWh: gwhToTWh(totals.essChargeGWh - totals.essDischargeGWh),
    essNetStoredGWh: totals.essNetStoredGWh,
    unservedGWh: totals.unservedGWh,
    unservedHours: totals.unservedHours,
    curtailedHours: totals.curtailedHours,
    inflexibleExcessGWh: totals.inflexibleExcessGWh,
    syncShortfallGWh: totals.syncShortfallGWh,
    peakDemandGW: totals.peakDemandGW,
    scarcityDischargeGWh: totals.scarcityDischargeGWh,
    emissionsMt: totals.emissionsT / 1e6,
    costs: costBreakdown,
    cumulativeCostEok,
    budget,
    avgCostWonPerKWh,
    techLevel,
    capexMultiplier: multipliers,
    socialAcceptance: acceptance,
    events,
    conditions,
    days: dispatchRes.days,
  };

  // 다음 해를 위한 상태 갱신
  const nextDemand = state.annualDemandTWh * (1 + state.demandGrowthRate);

  state = {
    ...state,
    year: currentYear + 1,
    annualDemandTWh: nextDemand,
    budget,
    cumulativeCostEok,
    socialAcceptance: acceptance,
    history: [...state.history, result],
  };

  return { state, result };
}

/**
 * 2026~2050 다년도 시뮬레이션 일괄 실행기
 */
export function runScenario(
  config: SimConfig,
  policyPlan: Record<number, PolicyId[]> = {},
  mode: SimMode = 'deterministic',
  seed: number = 42,
): SimulationState {
  let state = createInitialState(config, seed, mode);

  while (state.year <= config.endYear) {
    const policies = policyPlan[state.year] || [];
    // 연도 내 복수 정책 적용
    for (const p of policies) {
      state = applyPolicy(state, p);
    }
    const step = stepYear(state);
    state = step.state;
  }

  return state;
}

/**
 * 시나리오 A vs B 비교 분석 결과 타입 및 비교기
 */
export interface ScenarioDiff {
  years: number[];
  diffGenerationTWh: Record<GenTech, number[]>;
  diffCurtailmentTWh: number[];
  diffUnservedGWh: number[];
  diffEmissionsMt: number[];
  diffCumulativeCostEok: number[];
  summary: {
    totalCurtailmentA: number;
    totalCurtailmentB: number;
    totalUnservedA: number;
    totalUnservedB: number;
    totalEmissionsA: number;
    totalEmissionsB: number;
    finalCostA: number;
    finalCostB: number;
  };
}

export function compareScenarios(
  stateA: SimulationState,
  stateB: SimulationState,
): ScenarioDiff {
  const years = stateA.history.map((h) => h.year);
  const diffGen = {} as Record<GenTech, number[]>;
  for (const t of GEN_TECHS) {
    diffGen[t] = years.map((_, i) => {
      const hA = stateA.history[i];
      const hB = stateB.history[i];
      return (hB?.generationTWh[t] ?? 0) - (hA?.generationTWh[t] ?? 0);
    });
  }

  const diffCurt = years.map((_, i) => {
    const hA = stateA.history[i];
    const hB = stateB.history[i];
    const cA = (hA?.curtailmentTWh.solar ?? 0) + (hA?.curtailmentTWh.wind ?? 0);
    const cB = (hB?.curtailmentTWh.solar ?? 0) + (hB?.curtailmentTWh.wind ?? 0);
    return cB - cA;
  });

  const diffUnserved = years.map((_, i) => {
    const hA = stateA.history[i];
    const hB = stateB.history[i];
    return (hB?.unservedGWh ?? 0) - (hA?.unservedGWh ?? 0);
  });

  const diffEmissions = years.map((_, i) => {
    const hA = stateA.history[i];
    const hB = stateB.history[i];
    return (hB?.emissionsMt ?? 0) - (hA?.emissionsMt ?? 0);
  });

  const diffCost = years.map((_, i) => {
    const hA = stateA.history[i];
    const hB = stateB.history[i];
    return (hB?.cumulativeCostEok ?? 0) - (hA?.cumulativeCostEok ?? 0);
  });

  const sumA = stateA.history.reduce(
    (acc, h) => {
      acc.curt += h.curtailmentTWh.solar + h.curtailmentTWh.wind;
      acc.unserved += h.unservedGWh;
      acc.emissions += h.emissionsMt;
      return acc;
    },
    { curt: 0, unserved: 0, emissions: 0 },
  );

  const sumB = stateB.history.reduce(
    (acc, h) => {
      acc.curt += h.curtailmentTWh.solar + h.curtailmentTWh.wind;
      acc.unserved += h.unservedGWh;
      acc.emissions += h.emissionsMt;
      return acc;
    },
    { curt: 0, unserved: 0, emissions: 0 },
  );

  return {
    years,
    diffGenerationTWh: diffGen,
    diffCurtailmentTWh: diffCurt,
    diffUnservedGWh: diffUnserved,
    diffEmissionsMt: diffEmissions,
    diffCumulativeCostEok: diffCost,
    summary: {
      totalCurtailmentA: sumA.curt,
      totalCurtailmentB: sumB.curt,
      totalUnservedA: sumA.unserved,
      totalUnservedB: sumB.unserved,
      totalEmissionsA: sumA.emissions,
      totalEmissionsB: sumB.emissions,
      finalCostA: stateA.history[stateA.history.length - 1]?.cumulativeCostEok ?? 0,
      finalCostB: stateB.history[stateB.history.length - 1]?.cumulativeCostEok ?? 0,
    },
  };
}
