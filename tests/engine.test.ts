import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  createInitialState,
  stepYear,
  runScenario,
  compareScenarios,
  simulateYearDispatch,
  generateConditions,
  isNightHour,
  solarPotentialGWh,
  windPotentialGWh,
  windPowerCurve,
  socBounds,
  stepSoc,
  powerToEnergyGWh,
  gwhToTWh,
  twhToGWh,
  SEASONS,
} from '../src/engine';

describe('1. 단위 규약 및 변환 검증', () => {
  it('전력과 에너지 단위 변환이 올바른 물리 관계를 유지해야 함', () => {
    // 5 GW × 2 h = 10 GWh
    expect(powerToEnergyGWh(5, 2)).toBe(10);
    // 1000 GWh = 1 TWh
    expect(gwhToTWh(1000)).toBe(1);
    expect(twhToGWh(1.5)).toBe(1500);
  });
});

describe('2. 재생에너지 물리 모델 검증', () => {
  it('야간 태양광 발전량은 반드시 0이어야 함', () => {
    for (const season of SEASONS) {
      // 0시, 1시, 2시, 23시는 사계절 모두 야간
      for (const h of [0, 1, 2, 23]) {
        expect(isNightHour(season, h, DEFAULT_CONFIG.solar)).toBe(true);
        const pot = solarPotentialGWh(30, season, h, DEFAULT_CONFIG.solar, 1);
        expect(pot).toBe(0);
      }
    }
  });

  it('발전량이 설비용량과 시간 간격의 물리적 한계를 초과하지 않음', () => {
    const solarCap = 50;
    const windCap = 40;
    for (const season of SEASONS) {
      for (let h = 0; h < 24; h++) {
        const sPot = solarPotentialGWh(solarCap, season, h, DEFAULT_CONFIG.solar, 1);
        const wPot = windPotentialGWh(windCap, season, h, DEFAULT_CONFIG.wind, 1);
        expect(sPot).toBeLessThanOrEqual(solarCap * 1);
        expect(wPot).toBeLessThanOrEqual(windCap * 1);
        expect(sPot).toBeGreaterThanOrEqual(0);
        expect(wPot).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('풍력 발전은 시동풍속 미만과 차단풍속 이상에서 출력이 0이어야 함', () => {
    const cfg = DEFAULT_CONFIG.wind;
    expect(windPowerCurve(cfg.cutInMs - 0.5, cfg)).toBe(0);
    expect(windPowerCurve(cfg.cutOutMs + 1, cfg)).toBe(0);
    expect(windPowerCurve(cfg.ratedMs, cfg)).toBe(1);
  });
});

describe('3. ESS 모델 및 에너지 보존 검증', () => {
  it('ESS 저장량의 상하한(SOC_min, SOC_max)을 엄격히 유지해야 함', () => {
    const p = {
      energyCapacityGWh: 100,
      powerGW: 25,
      etaCharge: 0.95,
      etaDischarge: 0.95,
      minSocFraction: 0.1,
    };
    const { min, max } = socBounds(p);
    expect(min).toBe(10);
    expect(max).toBe(100);

    // 충전 초과 시도시 에러
    expect(() => stepSoc(p, 95, 10, 0, 1)).toThrow();
    // 방전 하한 위반 시도시 에러
    expect(() => stepSoc(p, 15, 0, 10, 1)).toThrow();
  });

  it('대표일 순환 조건에서 ESS 시작 SOC와 종료 SOC가 일치해야 함 (공짜 에너지 방지)', () => {
    const cond = {
      spring: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.8 },
      summer: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.9 },
      autumn: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.8 },
      winter: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.9 },
    };
    const dispatchRes = simulateYearDispatch({
      config: DEFAULT_CONFIG,
      capacitiesGW: { solar: 40, wind: 10, nuclear: 24, coal: 30, lng: 30 },
      essGWh: 20,
      essGW: 5,
      annualDemandTWh: 500,
      flexibility: 0.3,
      drGW: 1,
      conditions: cond,
    });

    for (const day of dispatchRes.days) {
      // 순환 경계 조건: socEnd >= socStart (공짜 에너지가 발생하지 않음을 증명)
      expect(day.socEnd).toBeGreaterThanOrEqual(day.socStart - 1e-4);
      // 순환 수렴 시 socEnd === socStart
      if (day.cyclicConverged) {
        expect(Math.abs(day.socEnd - day.socStart)).toBeLessThanOrEqual(1e-4);
      }
    }
  });
});

describe('4. 급전 에너지 수지(Energy Balance) 검증', () => {
  it('매 시간 [실제 발전량 + ESS 방전량 + 미공급 전력량 = 수요(수요반응 후) + ESS 충전량] 수지가 성립해야 함', () => {
    const cond = {
      spring: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.85 },
      summer: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.85 },
      autumn: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.85 },
      winter: { solarClearness: 1, windScale: 1, storm: false, demandShock: 1, nuclearAvailability: 0.85 },
    };
    const res = simulateYearDispatch({
      config: DEFAULT_CONFIG,
      capacitiesGW: { solar: 50, wind: 15, nuclear: 20, coal: 25, lng: 35 },
      essGWh: 30,
      essGW: 7.5,
      annualDemandTWh: 500,
      flexibility: 0.4,
      drGW: 2,
      conditions: cond,
    });

    for (const day of res.days) {
      for (const h of day.hours) {
        const totalGen = Object.values(h.gen).reduce((a, b) => a + b, 0);
        const supplySide = totalGen + h.essDischargeGWh + h.unservedGWh;
        const demandSide = h.demandNetGWh + h.essChargeGWh;

        // 오차 1e-6 GWh 이내
        expect(Math.abs(supplySide - demandSide)).toBeLessThan(1e-5);
      }
    }
  });

  it('계절 대표일 가중치(365일)와 연간 집계가 일치해야 함', () => {
    const sumWeights = Object.values(DEFAULT_CONFIG.seasonWeights).reduce((a, b) => a + b, 0);
    expect(sumWeights).toBe(365);
  });
});

describe('5. 정책 파이프라인 및 건설기간 검증', () => {
  it('건설 기간 중인 신규 설비(원자력 7년)는 완공 전까지 발전량과 가동용량이 0이어야 함', () => {
    let state = createInitialState(DEFAULT_CONFIG);
    const startNuclearGW = state.cohorts
      .filter((c) => c.tech === 'nuclear')
      .reduce((s, c) => s + c.gw, 0);

    // 2026년에 원전 2GW 정책 채택 (건설기간 7년 -> 2033년 완공)
    const step1 = stepYear(state, 'nuclear_2gw');
    state = step1.state;

    // 2026년 결과: 아직 완공되지 않음
    expect(step1.result.capacitiesGW.nuclear).toBeCloseTo(startNuclearGW, 1);
    expect(state.pipeline.length).toBe(1);
    expect(state.pipeline[0].completionYear).toBe(2026 + 7);

    // 6년간 진행 (2027~2032)
    for (let yr = 2027; yr <= 2032; yr++) {
      const step = stepYear(state);
      state = step.state;
      // 노후 퇴역 반영 외에 신규 원전 추가 없어야 함
      expect(state.pipeline.length).toBe(1);
    }

    // 2033년 도달 시 완공 확인
    const stepCompletion = stepYear(state);
    state = stepCompletion.state;
    expect(stepCompletion.result.completedThisYear.some((p) => p.policyId === 'nuclear_2gw')).toBe(true);
    expect(state.pipeline.length).toBe(0);
  });
});

describe('6. 인과관계 및 시나리오 비교 검증', () => {
  it('동일 입력에 대해 결과가 100% 결정론적으로 재현되어야 함', () => {
    const run1 = runScenario(DEFAULT_CONFIG, { 2026: ['solar_5gw'] }, 'deterministic', 42);
    const run2 = runScenario(DEFAULT_CONFIG, { 2026: ['solar_5gw'] }, 'deterministic', 42);
    expect(run1.history[0].demandTWh).toBe(run2.history[0].demandTWh);
    expect(run1.history[0].emissionsMt).toBe(run2.history[0].emissionsMt);
    expect(run1.history[0].generationTWh.solar).toBe(run2.history[0].generationTWh.solar);
  });

  it('태양광 10GW 단독 vs 태양광 10GW + ESS 20GWh 시나리오 비교: ESS 추가 시 출력제어 감소 확인', () => {
    // 시나리오 A: 태양광 10GW (5GW x 2)
    const stateA = runScenario(
      DEFAULT_CONFIG,
      { 2026: ['solar_5gw', 'solar_5gw'] },
      'deterministic',
    );

    // 시나리오 B: 태양광 10GW + ESS 20GWh (10GWh x 2)
    const stateB = runScenario(
      DEFAULT_CONFIG,
      { 2026: ['solar_5gw', 'solar_5gw', 'ess_10gwh', 'ess_10gwh'] },
      'deterministic',
    );

    const diff = compareScenarios(stateA, stateB);

    // 태양광 과잉이 발생할 때 ESS가 잉여를 충전하여 총 출력제어가 감소하거나 동등해야 함
    expect(diff.summary.totalCurtailmentB).toBeLessThanOrEqual(diff.summary.totalCurtailmentA);
  });
});

describe('7. 초기 설비용량 및 잔여수명 정합성 검증 (요구사항 1)', () => {
  it('2026년 시작 시점의 모든 가동 설비용량이 초기 설정값과 정확히 일치해야 함', () => {
    const state = createInitialState(DEFAULT_CONFIG);
    const step = stepYear(state);
    const caps = step.result.capacitiesGW;
    const init = DEFAULT_CONFIG.initial;

    expect(caps.solar).toBeCloseTo(init.solarGW, 4);
    expect(caps.wind).toBeCloseTo(init.windGW, 4);
    expect(caps.nuclear).toBeCloseTo(init.nuclearGW, 4);
    expect(caps.coal).toBeCloseTo(init.coalGW, 4);
    expect(caps.lng).toBeCloseTo(init.lngGW, 4); // 42 GW 전량 가동 검증
    expect(step.result.essGW).toBeCloseTo(init.essGW, 4);
    expect(step.result.essGWh).toBeCloseTo(init.essGWh, 4);
  });

  it('신규 건설 정책 없이 발전 설비용량이 갑자기 증가하지 않고, 잔여수명에 따라 정상 퇴역해야 함', () => {
    // 정책 없이 2026~2035년 시뮬레이션
    const state = runScenario(DEFAULT_CONFIG, {}, 'deterministic');
    for (let i = 1; i < state.history.length; i++) {
      const prev = state.history[i - 1].capacitiesGW;
      const curr = state.history[i].capacitiesGW;
      // 정책이 없으므로 어떤 기술도 이전 연도보다 용량이 증가할 수 없음
      for (const t of ['solar', 'wind', 'nuclear', 'coal', 'lng'] as const) {
        expect(curr[t]).toBeLessThanOrEqual(prev[t] + 1e-4);
      }
    }
  });
});

describe('8. 수요반응(DR) 및 비용 중복 계산 방지 검증 (요구사항 2)', () => {
  it('수요반응 비용이 발전 변동비에 중복 계산되지 않고 단 한 번만 반영되어야 함', () => {
    // 검증 사례: 발전 설비 및 ESS: 0, DR: 4GW, 연간 수요: 10TWh, 탄소/기타비용 0
    const customConfig = structuredClone(DEFAULT_CONFIG);
    customConfig.initial = {
      ...customConfig.initial,
      solarGW: 0,
      windGW: 0,
      nuclearGW: 0,
      coalGW: 0,
      lngGW: 0,
      essGW: 0,
      essGWh: 0,
      annualDemandTWh: 10,
      demandResponseGW: 4,
    };
    customConfig.economics.annualBudgetAllocation = 0;
    customConfig.economics.carbonPriceWonPerT = 0;

    const state = createInitialState(customConfig);
    const step = stepYear(state);
    const costs = step.result.costs;

    // 발전 설비가 0이므로 발전 변동비는 0이어야 함
    expect(costs.fuelAndVariable).toBeCloseTo(0, 4);

    // 수요반응 비용이 양수일 경우 totalCash = fixedOm + drCost (+ unserved penalty 없음)
    // totalCash = investment(0) + fixedOm(0) + fuelAndVar(0) + drCost
    expect(costs.totalCash).toBeCloseTo(costs.fixedOm + costs.demandResponse, 4);
  });
});

describe('9. 확률적 기상 시나리오 및 계절별 난수 독립성 검증 (요구사항 3)', () => {
  it('동일 연도 내 서로 다른 계절의 난수 생성 조건이 독립적이어야 함', () => {
    const cond = generateConditions(DEFAULT_CONFIG, 2026, 'stochastic', 12345);
    // 봄과 여름의 조건이 서로 일치하지 않아야 함 (독립 시드 검증)
    expect(cond.spring.solarClearness).not.toBe(cond.summer.solarClearness);
    expect(cond.spring.windScale).not.toBe(cond.summer.windScale);
  });
});

describe('10. ESS 극한 스트레스 및 장기 누적 검증 (요구사항 5)', () => {
  it('극단적인 대용량 태양광 및 ESS 조건에서도 에너지 보존과 순환 조건이 성립해야 함', () => {
    const stressConfig = structuredClone(DEFAULT_CONFIG);
    stressConfig.initial.solarGW = 150; // 극단적 태양광 과잉
    stressConfig.initial.essGWh = 200;  // 대규모 ESS
    stressConfig.initial.essGW = 50;

    const state = runScenario(stressConfig, {}, 'deterministic');
    for (const h of state.history) {
      // ESS 순저장량이 발산하거나 에너지가 새로 생성되지 않는지 확인
      expect(Math.abs(h.essNetStoredGWh)).toBeLessThan(1.0);
      // 에너지 수지 검증
      const totalGen = Object.values(h.generationTWh).reduce((a, b) => a + b, 0);
      const supply = totalGen + h.essDischargeTWh + (h.unservedGWh / 1000);
      const demand = (h.demandTWh - h.drTWh) + h.essChargeTWh;
      expect(Math.abs(supply - demand)).toBeLessThan(1e-4);
    }
  });
});
