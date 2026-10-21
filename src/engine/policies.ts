/**
 * 정책 적용 모듈.
 * 정책은 "상태 변수의 변화"(설비 추가/폐쇄, 계통 파라미터, 수요 증가율)만 만든다.
 * 발전량·배출·비용 등 최종 효과는 simulateYearDispatch 가 계산한다.
 */
import type { AssetTech, GenTech, PolicyId } from './types';
import type { Cohort, Project, SimulationState } from './state';
import { assetCapexEok, assetLifetime, capexMultiplier, makeCohort } from './economics';

export function operationalCapacity(
  cohorts: Cohort[],
  tech: AssetTech,
  year: number,
): { gw: number; gwh: number } {
  let gw = 0;
  let gwh = 0;
  for (const c of cohorts) {
    if (c.tech === tech && c.startYear <= year && year < c.retireYear) {
      gw += c.gw;
      gwh += c.gwh;
    }
  }
  return { gw, gwh };
}

/** 정책 1건을 선택: 건설 파이프라인에 사업을 추가한 새 상태를 반환 (순수 함수) */
export function applyPolicy(state: SimulationState, policyId: PolicyId): SimulationState {
  const def = state.config.policies[policyId];
  if (!def) throw new Error(`Unknown policy: ${policyId}`);
  const year = state.year;
  const e = def.effect;
  let capex = 0;
  switch (e.kind) {
    case 'addCapacity':
      capex = assetCapexEok(state.config, e.tech, e.gw, 0, capexMultiplier(state, e.tech, year));
      break;
    case 'addStorage':
      capex = assetCapexEok(state.config, 'ess', e.gw, e.gwh, capexMultiplier(state, 'ess', year));
      break;
    case 'retireCapacity': {
      const pendingRetire = state.pipeline
        .filter((p) => p.effect.kind === 'retireCapacity' && p.effect.tech === e.tech)
        .reduce((s, p) => s + (p.effect.kind === 'retireCapacity' ? p.effect.gw : 0), 0);
      const existing = operationalCapacity(state.cohorts, e.tech, year).gw - pendingRetire;
      capex = Math.max(0, Math.min(e.gw, existing)) * state.config.economics.decommissionCostPerGW;
      break;
    }
    case 'gridFlex':
    case 'efficiency':
      capex = def.programCapex ?? 0;
      break;
  }
  const seq = state.policyLog.length + 1;
  const project: Project = {
    id: `${year}-${policyId}-${seq}`,
    policyId,
    name: def.name,
    startYear: year,
    completionYear: year + def.constructionYears,
    capexTotalEok: capex,
    spendYears: Math.max(1, def.constructionYears),
    effect: e,
    programOmPerYear: def.programOmPerYear ?? 0,
  };
  return {
    ...state,
    pipeline: [...state.pipeline, project],
    policyLog: [...state.policyLog, { year, policyId, projectId: project.id }],
  };
}

export function applyPolicies(state: SimulationState, ids: PolicyId[]): SimulationState {
  return ids.reduce((s, id) => applyPolicy(s, id), state);
}

/** 이번 연도 사업비 지출 (억원): 공사 기간 동안 균등 분할 */
export function investmentSpending(pipelineAndDone: Project[], year: number): number {
  let sum = 0;
  for (const p of pipelineAndDone) {
    if (year >= p.startYear && year < p.startYear + p.spendYears) sum += p.capexTotalEok / p.spendYears;
  }
  return sum;
}

export interface CompletionResult {
  state: SimulationState;
  completed: Project[];
  retired: { tech: AssetTech; gw: number; gwh: number; reason: 'lifetime' | 'policy' }[];
}

/** 이 연도 초에 완공되는 사업을 반영 (완공 전에는 cohort 가 없으므로 발전량 0) */
export function completeProjects(state: SimulationState): CompletionResult {
  const year = state.year;
  const done = state.pipeline.filter((p) => p.completionYear <= year);
  const pipeline = state.pipeline.filter((p) => p.completionYear > year);
  let cohorts = [...state.cohorts];
  let { flexibility, drGW, demandGrowthRate, annualDemandTWh, programOmPerYear } = state;
  const cumulativeBuilt = { ...state.cumulativeBuilt };
  const retired: CompletionResult['retired'] = [];
  const cfg = state.config;

  for (const p of done) {
    const e = p.effect;
    programOmPerYear += p.programOmPerYear;
    switch (e.kind) {
      case 'addCapacity': {
        const life = assetLifetime(cfg, e.tech);
        cohorts.push(makeCohort(cfg, p.id, e.tech, e.gw, 0, year, year + life, p.capexTotalEok));
        if (e.tech === 'solar' || e.tech === 'wind') cumulativeBuilt[e.tech] += e.gw;
        break;
      }
      case 'addStorage': {
        const life = assetLifetime(cfg, 'ess');
        cohorts.push(makeCohort(cfg, p.id, 'ess', e.gw, e.gwh, year, year + life, p.capexTotalEok));
        cumulativeBuilt.ess += e.gwh;
        break;
      }
      case 'retireCapacity': {
        const r = retireOldest(cohorts, e.tech, e.gw, year);
        cohorts = r.cohorts;
        if (r.retiredGW > 0) retired.push({ tech: e.tech, gw: r.retiredGW, gwh: 0, reason: 'policy' });
        break;
      }
      case 'gridFlex':
        flexibility = Math.min(1, flexibility + e.flexDelta);
        drGW += e.drDeltaGW;
        break;
      case 'efficiency':
        demandGrowthRate = Math.max(cfg.demand.minGrowthRate, demandGrowthRate + e.growthDelta);
        annualDemandTWh *= 1 - e.demandCutFraction;
        break;
    }
  }
  return {
    state: {
      ...state,
      cohorts,
      pipeline,
      completedProjects: [...state.completedProjects, ...done],
      flexibility,
      drGW,
      demandGrowthRate,
      annualDemandTWh,
      programOmPerYear,
      cumulativeBuilt,
    },
    completed: done,
    retired,
  };
}

/** 가장 먼저 퇴역 예정인(노후) 설비부터 gw 만큼 폐쇄 */
function retireOldest(
  cohorts: Cohort[],
  tech: GenTech,
  gw: number,
  year: number,
): { cohorts: Cohort[]; retiredGW: number } {
  let remaining = gw;
  const active = cohorts
    .filter((c) => c.tech === tech && c.startYear <= year && year < c.retireYear)
    .sort((a, b) => a.retireYear - b.retireYear);
  const replaced = new Map<string, Cohort | null>();
  for (const c of active) {
    if (remaining <= 1e-12) break;
    const cut = Math.min(remaining, c.gw);
    remaining -= cut;
    if (cut >= c.gw - 1e-12) {
      replaced.set(c.id, null);
    } else {
      const f = (c.gw - cut) / c.gw;
      replaced.set(c.id, {
        ...c,
        gw: c.gw - cut,
        annualizedCapexEok: c.annualizedCapexEok * f,
        fixedOmEok: c.fixedOmEok * f,
      });
    }
  }
  const out: Cohort[] = [];
  for (const c of cohorts) {
    if (!replaced.has(c.id)) out.push(c);
    else {
      const r = replaced.get(c.id);
      if (r) out.push(r);
    }
  }
  return { cohorts: out, retiredGW: gw - remaining };
}

/** 수명 도달 설비 퇴역 */
export function retireByLifetime(state: SimulationState): {
  state: SimulationState;
  retired: CompletionResult['retired'];
} {
  if (!state.config.applyRetirement) return { state, retired: [] };
  const year = state.year;
  const retiredMap = new Map<AssetTech, { gw: number; gwh: number }>();
  const cohorts = state.cohorts.filter((c) => {
    if (c.retireYear <= year) {
      const r = retiredMap.get(c.tech) ?? { gw: 0, gwh: 0 };
      // 이번 해에 막 퇴역한 설비만 보고
      if (c.retireYear === year) {
        r.gw += c.gw;
        r.gwh += c.gwh;
        retiredMap.set(c.tech, r);
      }
      return false;
    }
    return true;
  });
  const retired = [...retiredMap.entries()].map(([tech, v]) => ({
    tech,
    gw: v.gw,
    gwh: v.gwh,
    reason: 'lifetime' as const,
  }));
  return { state: { ...state, cohorts }, retired };
}
