import {
  DEFAULT_CONFIG,
  runScenario,
  PolicyId,
} from '../src/engine';

// 6대 전략 정책 계획 정의
// 1. 추가 정책 없음
const p1: Record<number, PolicyId[]> = {};

// 2. 태양광 중심 투자 전략 (매년 태양광 5GW씩 적극 확충)
const p2: Record<number, PolicyId[]> = {};
for (let y = 2026; y <= 2045; y += 2) {
  p2[y] = ['solar_5gw', 'solar_5gw'];
}

// 3. 원자력 중심 투자 전략 (2026, 2030, 2034, 2038 원자력 2GW씩 확충)
const p3: Record<number, PolicyId[]> = {
  2026: ['nuclear_2gw'],
  2028: ['nuclear_2gw'],
  2030: ['nuclear_2gw'],
  2032: ['nuclear_2gw'],
};

// 4. 재생에너지 + ESS 혼합 전략 (태양광 + 풍력 + ESS 4시간형 균형 배치)
const p4: Record<number, PolicyId[]> = {};
for (let y = 2026; y <= 2045; y += 2) {
  p4[y] = ['solar_5gw', 'wind_3gw', 'ess_10gwh'];
}

// 5. 화석연료 조기 폐쇄 전략 (석탄을 매년 공격적으로 폐쇄)
const p5: Record<number, PolicyId[]> = {
  2026: ['coal_close_2gw', 'coal_close_2gw'],
  2027: ['coal_close_2gw', 'coal_close_2gw'],
  2028: ['coal_close_2gw', 'coal_close_2gw'],
  2029: ['coal_close_2gw', 'coal_close_2gw'],
  2030: ['coal_close_2gw', 'coal_close_2gw'],
};

// 6. 균형 잡힌 에너지 믹스 전략 (재생E + ESS + 효율화 + 계통 유연성 + 백업 LNG)
const p6: Record<number, PolicyId[]> = {
  2026: ['solar_5gw', 'efficiency', 'grid_flex'],
  2028: ['solar_5gw', 'wind_3gw', 'ess_10gwh'],
  2030: ['solar_5gw', 'ess_10gwh', 'efficiency'],
  2032: ['solar_5gw', 'wind_3gw', 'ess_10gwh'],
  2035: ['solar_5gw', 'lng_2gw', 'grid_flex'],
};

const strategies = [
  { name: '1. 정책 미시행', plan: p1 },
  { name: '2. 태양광 중심', plan: p2 },
  { name: '3. 원자력 중심', plan: p3 },
  { name: '4. 재생E + ESS', plan: p4 },
  { name: '5. 석탄 조기폐쇄', plan: p5 },
  { name: '6. 균형 믹스', plan: p6 },
];

console.log('=== 2026~2050 6대 전략 시뮬레이션 종합 검증 결과 ===');

for (const s of strategies) {
  const res = runScenario(DEFAULT_CONFIG, s.plan, 'deterministic', 42);
  const totalGenTWh = res.history.reduce((acc, h) => {
    return acc + Object.values(h.generationTWh).reduce((a, b) => a + b, 0);
  }, 0);
  const totalUnservedGWh = res.history.reduce((acc, h) => acc + h.unservedGWh, 0);
  const totalCurtailTWh = res.history.reduce((acc, h) => acc + (h.curtailmentTWh.solar + h.curtailmentTWh.wind), 0);
  const totalEmissionsMt = res.history.reduce((acc, h) => acc + h.emissionsMt, 0);
  const finalCostTrillionWon = (res.history[res.history.length - 1].cumulativeCostEok / 10000);
  const finalBudgetTrillionWon = (res.history[res.history.length - 1].budget / 10000);
  const finalAcceptance = res.history[res.history.length - 1].socialAcceptance;

  console.log(`\n[전략: ${s.name}]`);
  console.log(`- 25년간 누적 발전량: ${totalGenTWh.toFixed(1)} TWh`);
  console.log(`- 25년간 전력 미공급량: ${totalUnservedGWh.toFixed(1)} GWh`);
  console.log(`- 25년간 출력제어량: ${totalCurtailTWh.toFixed(2)} TWh`);
  console.log(`- 25년간 탄소 배출량: ${totalEmissionsMt.toFixed(1)} MtCO₂`);
  console.log(`- 2050년 최종 누적비용: ${finalCostTrillionWon.toFixed(1)} 조원`);
  console.log(`- 2050년 정부 예산잔액: ${finalBudgetTrillionWon.toFixed(1)} 조원`);
  console.log(`- 2050년 사회적 수용성: ${finalAcceptance.toFixed(1)} 점`);
}
