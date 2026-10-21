/**
 * 시간별 전력 수급(급전) 계산.
 *
 * 각 시간 처리 순서 (명시적 우선순위):
 *  1. 수요 결정
 *  2. 태양광·풍력 잠재 발전량
 *  3. 필수 운전: 원자력 최소출력, 화력 램프 하한, 계통 동기발전 최소 요구량
 *  4. 잔여수요 = 수요 − 필수운전 − 잠재 VRE
 *  5a. 공급 과잉:  ① ESS 충전 → ② VRE 출력제어 → ③ (그래도 남으면) 경직성 초과 강제 감발 기록
 *  5b. 공급 부족:  ① 원자력 정격까지 증발 → ② ESS 방전 → ③ 화력(한계비용 순, 램프 상한)
 *                  → ④ 수요반응 → ⑤ 미공급 전력
 *  6. 기록: 발전원별 실제 발전, 출력제어, 충방전, SOC, 미공급, 배출, 변동비
 *
 * 에너지 수지 (매 시간):
 *   Σ 실제 발전 + ESS 방전 + 미공급 = (수요 − 수요반응) + ESS 충전
 */
import type { GenTech, Season, SeasonConditions, SimConfig, ThermalTech, YearConditions } from './types';
import { GEN_TECHS, SEASONS } from './types';
import type { EssParams } from './storage/ess';
import { maxChargeInputGWh, maxDischargeOutputGWh, socBounds, stepSoc } from './storage/ess';
import { solarPotentialGWh } from './generation/solar';
import { windPotentialGWh } from './generation/wind';
import { thermalAvailableGW, thermalMeritOrder } from './generation/thermal';
import { nuclearAvailableGW } from './generation/nuclear';
import { clamp, emissionsTonnes, twhToGWh, wonPerMWhToEokPerGWh } from './units';

const EPS = 1e-9;

export interface HourResult {
  season: Season;
  hour: number;
  /** 아래 에너지 항목은 모두 해당 시간 간격(dt)의 에너지 (GWh) */
  demandGWh: number;
  drGWh: number;
  demandNetGWh: number;
  solarPotGWh: number;
  windPotGWh: number;
  gen: Record<GenTech, number>;
  curtailSolarGWh: number;
  curtailWindGWh: number;
  essChargeGWh: number;
  essDischargeGWh: number;
  socStartGWh: number;
  socEndGWh: number;
  unservedGWh: number;
  inflexibleExcessGWh: number;
  syncShortfallGWh: number;
  /** 진단 정보 (GW) */
  nuclearAvailGW: number;
  coalAvailGW: number;
  lngAvailGW: number;
  minSyncGW: number;
  mustRunGW: number;
  /** 사전 판정: 가용 설비 전부로도 부족한 시간 */
  scarcity: boolean;
  /** 과잉 시 ESS가 더 받지 못한 이유 */
  essLimit: 'none' | 'full' | 'power' | 'noEss' | null;
  emissionsT: number;
  /** 발전원 연료비 + 변동운영비 (억원) */
  variableCostEok: number;
  /** 수요반응(DR) 보상 비용 (억원) */
  drCostEok: number;
}

export interface DayInputs {
  season: Season;
  demandGWh: number[];
  solarPotGWh: number[];
  windPotGWh: number[];
  nuclearAvailGW: number;
  coalAvailGW: number;
  lngAvailGW: number;
}

export interface DispatchParams {
  dtHours: number;
  nuclearMinLoadFraction: number;
  rampFractionPerHour: Record<ThermalTech, number>;
  minSyncFraction: number;
  drGW: number;
  drMaxHoursPerDay: number;
  ess: EssParams;
  meritOrder: ThermalTech[];
  variableCostWonPerMWh: Record<GenTech, number>;
  emissionFactor: Record<GenTech, number>;
  drCostWonPerMWh: number;
}

export interface ThermalState {
  /** 직전 시간 출력 (GW) */
  coal: number;
  lng: number;
}

export interface DayRun {
  hours: HourResult[];
  socStart: number;
  socEnd: number;
  thermalEnd: ThermalState;
}

export interface DayResult extends DayRun {
  season: Season;
  weightDays: number;
  cyclicConverged: boolean;
  cyclicIterations: number;
}

type Dispatchable = 'nuclear' | ThermalTech;

/** 대표일 1회 계산 (시작 SOC·직전 화력출력을 경계조건으로) */
export function simulateDayOnce(
  inp: DayInputs,
  p: DispatchParams,
  socStart: number,
  prev: ThermalState,
): DayRun {
  const dt = p.dtHours;
  const n = inp.demandGWh.length;
  const { min: socMin } = socBounds(p.ess);

  // 사전 판정: 모든 가용 설비 + 수요반응으로도 부족한 에너지 (ESS 방전 예약 계산용)
  const shortfall = inp.demandGWh.map((d, h) =>
    Math.max(
      0,
      d -
        (inp.solarPotGWh[h] +
          inp.windPotGWh[h] +
          (inp.nuclearAvailGW + inp.coalAvailGW + inp.lngAvailGW + p.drGW) * dt),
    ),
  );
  // reserveAfter[h]: h 이후 같은 날 부족분을 메우기 위해 남겨둘 저장 에너지 (SOC 기준)
  const reserveAfter = new Array<number>(n).fill(0);
  let acc = 0;
  for (let h = n - 1; h >= 0; h--) {
    reserveAfter[h] = acc;
    acc += shortfall[h] / p.ess.etaDischarge;
  }

  let soc = socStart;
  let prevP: Record<ThermalTech, number> = { coal: prev.coal, lng: prev.lng };
  let drLeftGWh = p.drGW * p.drMaxHoursPerDay;
  const hours: HourResult[] = [];

  for (let h = 0; h < n; h++) {
    // ---- 모든 내부 연산은 전력(GW) 단위, 기록 시 × dt 하여 에너지(GWh)로 변환 ----
    const D = inp.demandGWh[h] / dt;
    const S = inp.solarPotGWh[h] / dt;
    const W = inp.windPotGWh[h] / dt;
    const V = S + W;

    const availGW: Record<Dispatchable, number> = {
      nuclear: inp.nuclearAvailGW,
      coal: inp.coalAvailGW,
      lng: inp.lngAvailGW,
    };
    const lo: Record<Dispatchable, number> = {
      nuclear: inp.nuclearAvailGW * p.nuclearMinLoadFraction,
      coal: 0,
      lng: 0,
    };
    const hi: Record<Dispatchable, number> = { nuclear: inp.nuclearAvailGW, coal: 0, lng: 0 };
    for (const t of ['coal', 'lng'] as ThermalTech[]) {
      const r = p.rampFractionPerHour[t] * availGW[t] * dt;
      lo[t] = clamp(prevP[t] - r, 0, availGW[t]);
      hi[t] = clamp(prevP[t] + r, 0, availGW[t]);
    }
    const out: Record<Dispatchable, number> = { nuclear: lo.nuclear, coal: lo.coal, lng: lo.lng };

    // 3. 계통 동기발전 최소 요구량 (관성·전압 유지). 원자력 → 화력 순으로 충족
    const minSync = p.minSyncFraction * D;
    let syncGap = minSync - (out.nuclear + out.coal + out.lng);
    for (const t of ['nuclear', ...p.meritOrder] as Dispatchable[]) {
      if (syncGap <= EPS) break;
      const add = Math.min(syncGap, hi[t] - out[t]);
      out[t] += add;
      syncGap -= add;
    }
    const syncShortfall = Math.max(0, syncGap);
    const mustRun = out.nuclear + out.coal + out.lng;

    let charge = 0;
    let discharge = 0;
    let curtail = 0;
    let dr = 0;
    let unserved = 0;
    let inflex = 0;
    let essLimit: HourResult['essLimit'] = null;

    const net = D - mustRun - V;
    if (net < 0) {
      // 5a. 공급 과잉
      let surplus = -net;
      const cmax = maxChargeInputGWh(p.ess, soc, dt) / dt;
      charge = Math.min(surplus, cmax);
      surplus -= charge;
      if (surplus > EPS) {
        const { max } = socBounds(p.ess);
        essLimit =
          max <= 0 || p.ess.powerGW <= 0
            ? 'noEss'
            : cmax + EPS >= p.ess.powerGW
              ? 'power'
              : 'full';
      } else {
        essLimit = 'none';
      }
      curtail = Math.min(surplus, V);
      surplus -= curtail;
      if (surplus > EPS) {
        // 필수운전만으로 수요 초과: 기술적 하한을 어기고 강제 감발 (모델 경고로 기록)
        const order: Dispatchable[] = [...[...p.meritOrder].reverse(), 'nuclear'];
        for (const t of order) {
          const red = Math.min(surplus, out[t]);
          out[t] -= red;
          surplus -= red;
          inflex += red;
        }
      }
    } else {
      // 5b. 공급 부족
      let need = net;
      const addN = Math.min(need, hi.nuclear - out.nuclear);
      out.nuclear += addN;
      need -= addN;

      if (need > EPS) {
        const floor = shortfall[h] > EPS ? undefined : socMin + reserveAfter[h];
        const dmax = maxDischargeOutputGWh(p.ess, soc, dt, floor) / dt;
        discharge = Math.min(need, dmax);
        need -= discharge;
      }
      for (const t of p.meritOrder) {
        if (need <= EPS) break;
        const add = Math.min(need, hi[t] - out[t]);
        out[t] += add;
        need -= add;
      }
      if (need > EPS) {
        dr = Math.min(need, p.drGW, drLeftGWh / dt);
        drLeftGWh -= dr * dt;
        need -= dr;
      }
      unserved = Math.max(0, need);
    }

    const curtS = V > EPS ? (curtail * S) / V : 0;
    const curtW = curtail - curtS;

    const gen: Record<GenTech, number> = {
      solar: (S - curtS) * dt,
      wind: (W - curtW) * dt,
      nuclear: out.nuclear * dt,
      coal: out.coal * dt,
      lng: out.lng * dt,
    };

    const socStartH = soc;
    soc = stepSoc(p.ess, soc, charge * dt, discharge * dt, dt);
    prevP = { coal: out.coal, lng: out.lng };

    let emissionsT = 0;
    let varCost = 0;
    for (const t of GEN_TECHS) {
      emissionsT += emissionsTonnes(gen[t], p.emissionFactor[t]);
      varCost += gen[t] * wonPerMWhToEokPerGWh(p.variableCostWonPerMWh[t]);
    }
    const drCost = dr * dt * wonPerMWhToEokPerGWh(p.drCostWonPerMWh);

    hours.push({
      season: inp.season,
      hour: h,
      demandGWh: D * dt,
      drGWh: dr * dt,
      demandNetGWh: (D - dr) * dt,
      solarPotGWh: S * dt,
      windPotGWh: W * dt,
      gen,
      curtailSolarGWh: curtS * dt,
      curtailWindGWh: curtW * dt,
      essChargeGWh: charge * dt,
      essDischargeGWh: discharge * dt,
      socStartGWh: socStartH,
      socEndGWh: soc,
      unservedGWh: unserved * dt,
      inflexibleExcessGWh: inflex * dt,
      syncShortfallGWh: syncShortfall * dt,
      nuclearAvailGW: inp.nuclearAvailGW,
      coalAvailGW: inp.coalAvailGW,
      lngAvailGW: inp.lngAvailGW,
      minSyncGW: minSync,
      mustRunGW: mustRun,
      scarcity: shortfall[h] > EPS,
      essLimit,
      emissionsT,
      variableCostEok: varCost,
      drCostEok: drCost,
    });
  }

  return { hours, socStart, socEnd: soc, thermalEnd: { coal: prevP.coal, lng: prevP.lng } };
}

/**
 * 대표일 순환 경계조건 풀이.
 * SOC_start = SOC_min 에서 시작해 SOC_end → 다음 반복의 SOC_start 로 고정점 반복.
 * |SOC_end − SOC_start| ≤ tol 이면 수렴 (시작=종료, 공짜 에너지 없음).
 * 미수렴 시 SOC_start = SOC_min 으로 계산 → SOC_end ≥ SOC_start 가 보장되어 공짜 에너지 없음.
 */
export function solveCyclicDay(
  inp: DayInputs,
  p: DispatchParams,
  tol: number,
  maxIter: number,
): Omit<DayResult, 'weightDays'> {
  const { min } = socBounds(p.ess);
  let soc0 = min;
  let th: ThermalState = { coal: inp.coalAvailGW, lng: 0 };
  for (let iter = 1; iter <= maxIter; iter++) {
    const r = simulateDayOnce(inp, p, soc0, th);
    const dSoc = Math.abs(r.socEnd - soc0);
    const dTh = Math.max(Math.abs(r.thermalEnd.coal - th.coal), Math.abs(r.thermalEnd.lng - th.lng));
    if (dSoc <= tol && dTh <= 1e-6) {
      return { ...r, season: inp.season, cyclicConverged: true, cyclicIterations: iter };
    }
    soc0 = r.socEnd;
    th = r.thermalEnd;
  }
  const r = simulateDayOnce(inp, p, min, th);
  return { ...r, season: inp.season, cyclicConverged: false, cyclicIterations: maxIter };
}

// ---------------------------------------------------------------------------
// 연간 계산
// ---------------------------------------------------------------------------

export interface YearDispatchInput {
  config: SimConfig;
  capacitiesGW: Record<GenTech, number>;
  essGWh: number;
  essGW: number;
  annualDemandTWh: number;
  flexibility: number;
  drGW: number;
  conditions: YearConditions;
}

export interface DispatchTotals {
  demandGWh: number;
  drGWh: number;
  demandNetGWh: number;
  servedGWh: number;
  potentialGWh: { solar: number; wind: number };
  generationGWh: Record<GenTech, number>;
  curtailmentGWh: { solar: number; wind: number };
  essChargeGWh: number;
  essDischargeGWh: number;
  /** 연간 ESS 순저장 변화 (대표일 SOC_end − SOC_start 가중합) */
  essNetStoredGWh: number;
  unservedGWh: number;
  inflexibleExcessGWh: number;
  syncShortfallGWh: number;
  emissionsT: number;
  variableCostEok: number;
  drCostEok: number;
  unservedHours: number;
  curtailedHours: number;
  peakDemandGW: number;
  scarcityDischargeGWh: number;
}

export interface YearDispatchResult {
  days: DayResult[];
  totals: DispatchTotals;
  minSyncFraction: number;
  meritOrder: ThermalTech[];
}

export function minSyncFractionFor(config: SimConfig, flexibility: number): number {
  const f = clamp(flexibility, 0, 1);
  const g = config.grid;
  return g.minSyncFractionAtZeroFlex + (g.minSyncFractionAtFullFlex - g.minSyncFractionAtZeroFlex) * f;
}

/** 계절별 시간 수요 (GWh) — 가중합이 연간 수요(TWh)와 정확히 일치하도록 정규화 */
export function buildDemandProfiles(
  config: SimConfig,
  annualDemandTWh: number,
  conditions?: YearConditions,
): Record<Season, number[]> {
  const dt = config.dtHours;
  let denom = 0;
  for (const s of SEASONS) {
    const lvl = config.seasonDemandLevel[s];
    for (const x of config.demandShape[s]) denom += config.seasonWeights[s] * lvl * x * dt;
  }
  const k = twhToGWh(annualDemandTWh) / denom; // GW per unit shape
  const out = {} as Record<Season, number[]>;
  for (const s of SEASONS) {
    const shock = conditions ? conditions[s].demandShock : 1;
    out[s] = config.demandShape[s].map((x) => k * config.seasonDemandLevel[s] * x * dt * shock);
  }
  return out;
}

export function buildDayInputs(input: YearDispatchInput, season: Season, demand: number[]): DayInputs {
  const { config, capacitiesGW, conditions } = input;
  const c: SeasonConditions = conditions[season];
  const dt = config.dtHours;
  const windScale = c.windScale * (c.storm ? config.stochastic.stormWindScale : 1);
  const hours = demand.length;
  const solarPot: number[] = [];
  const windPot: number[] = [];
  for (let h = 0; h < hours; h++) {
    solarPot.push(solarPotentialGWh(capacitiesGW.solar, season, h, config.solar, dt, c.solarClearness));
    windPot.push(windPotentialGWh(capacitiesGW.wind, season, h, config.wind, dt, windScale));
  }
  return {
    season,
    demandGWh: demand,
    solarPotGWh: solarPot,
    windPotGWh: windPot,
    nuclearAvailGW: nuclearAvailableGW(capacitiesGW.nuclear, c.nuclearAvailability),
    coalAvailGW: thermalAvailableGW(capacitiesGW.coal, 'coal', config),
    lngAvailGW: thermalAvailableGW(capacitiesGW.lng, 'lng', config),
  };
}

export function buildDispatchParams(input: YearDispatchInput): DispatchParams {
  const { config } = input;
  const ef = {} as Record<GenTech, number>;
  const vc = {} as Record<GenTech, number>;
  for (const t of GEN_TECHS) {
    ef[t] = config.economics.tech[t].emissionFactorTPerMWh;
    vc[t] = config.economics.tech[t].variableCostWonPerMWh;
  }
  return {
    dtHours: config.dtHours,
    nuclearMinLoadFraction: config.nuclear.minLoadFraction,
    rampFractionPerHour: {
      coal: config.thermal.coal.rampFractionPerHour,
      lng: config.thermal.lng.rampFractionPerHour,
    },
    minSyncFraction: minSyncFractionFor(config, input.flexibility),
    drGW: input.drGW,
    drMaxHoursPerDay: config.grid.drMaxHoursPerDay,
    ess: {
      energyCapacityGWh: input.essGWh,
      powerGW: input.essGW,
      etaCharge: config.ess.etaCharge,
      etaDischarge: config.ess.etaDischarge,
      minSocFraction: config.ess.minSocFraction,
    },
    meritOrder: thermalMeritOrder(config),
    variableCostWonPerMWh: vc,
    emissionFactor: ef,
    drCostWonPerMWh: config.grid.drCostWonPerMWh,
  };
}

function emptyTotals(): DispatchTotals {
  return {
    demandGWh: 0,
    drGWh: 0,
    demandNetGWh: 0,
    servedGWh: 0,
    potentialGWh: { solar: 0, wind: 0 },
    generationGWh: { solar: 0, wind: 0, nuclear: 0, coal: 0, lng: 0 },
    curtailmentGWh: { solar: 0, wind: 0 },
    essChargeGWh: 0,
    essDischargeGWh: 0,
    essNetStoredGWh: 0,
    unservedGWh: 0,
    inflexibleExcessGWh: 0,
    syncShortfallGWh: 0,
    emissionsT: 0,
    variableCostEok: 0,
    drCostEok: 0,
    unservedHours: 0,
    curtailedHours: 0,
    peakDemandGW: 0,
    scarcityDischargeGWh: 0,
  };
}

/** 대표일 결과를 계절 가중치(일)로 연간 집계 */
export function aggregateDays(days: DayResult[], dtHours: number): DispatchTotals {
  const T = emptyTotals();
  for (const d of days) {
    const w = d.weightDays;
    for (const h of d.hours) {
      T.demandGWh += w * h.demandGWh;
      T.drGWh += w * h.drGWh;
      T.demandNetGWh += w * h.demandNetGWh;
      T.potentialGWh.solar += w * h.solarPotGWh;
      T.potentialGWh.wind += w * h.windPotGWh;
      for (const t of GEN_TECHS) T.generationGWh[t] += w * h.gen[t];
      T.curtailmentGWh.solar += w * h.curtailSolarGWh;
      T.curtailmentGWh.wind += w * h.curtailWindGWh;
      T.essChargeGWh += w * h.essChargeGWh;
      T.essDischargeGWh += w * h.essDischargeGWh;
      T.unservedGWh += w * h.unservedGWh;
      T.inflexibleExcessGWh += w * h.inflexibleExcessGWh;
      T.syncShortfallGWh += w * h.syncShortfallGWh;
      T.emissionsT += w * h.emissionsT;
      T.variableCostEok += w * h.variableCostEok;
      T.drCostEok += w * h.drCostEok;
      if (h.unservedGWh > 1e-6) T.unservedHours += w * dtHours;
      if (h.curtailSolarGWh + h.curtailWindGWh > 1e-6) T.curtailedHours += w * dtHours;
      T.peakDemandGW = Math.max(T.peakDemandGW, h.demandGWh / dtHours);
      if (h.scarcity) T.scarcityDischargeGWh += w * h.essDischargeGWh;
    }
    T.essNetStoredGWh += w * (d.socEnd - d.socStart);
  }
  T.servedGWh = T.demandNetGWh - T.unservedGWh;
  return T;
}

/** 1년(대표일 4개 × 24h, 가중치 365일) 전력 수급 계산 — 순수 함수 */
export function simulateYearDispatch(input: YearDispatchInput): YearDispatchResult {
  const { config } = input;
  const params = buildDispatchParams(input);
  const demand = buildDemandProfiles(config, input.annualDemandTWh, input.conditions);
  const days: DayResult[] = SEASONS.map((s) => {
    const inp = buildDayInputs(input, s, demand[s]);
    const r = solveCyclicDay(inp, params, config.ess.cyclicTolGWh, config.ess.cyclicMaxIter);
    return { ...r, weightDays: config.seasonWeights[s] };
  });
  return {
    days,
    totals: aggregateDays(days, config.dtHours),
    minSyncFraction: params.minSyncFraction,
    meritOrder: params.meritOrder,
  };
}
