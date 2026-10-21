import type { PolicyDefinition, PolicyId } from '../types';

/**
 * 정책 정의. 카드 점수가 아니라 "상태 변수의 변화"만 정의합니다.
 * 최종 효과(발전량·배출·비용·미공급)는 시뮬레이션이 계산합니다.
 * 설치비·운영비·수명은 economics 설정에서 기술별로 가져옵니다.
 */
export const DEFAULT_POLICIES: Record<PolicyId, PolicyDefinition> = {
  solar_5gw: {
    id: 'solar_5gw',
    name: '태양광 5GW 건설',
    description: '태양광 설비 5 GW 추가. 낮 시간에만 발전하며 계절별 일사량에 따라 출력이 달라짐.',
    constructionYears: 1,
    effect: { kind: 'addCapacity', tech: 'solar', gw: 5 },
    interactions: [
      '낮 시간 잔여수요를 줄여 석탄·LNG 발전과 배출을 줄일 수 있음',
      '봄·가을 낮에 잉여가 생기면 출력제어가 늘어날 수 있음',
      'ESS·전력망 유연성이 있으면 잉여를 흡수해 출력제어가 줄어들 수 있음',
      '야간·겨울 저녁 피크에는 기여하지 못함',
    ],
  },
  wind_3gw: {
    id: 'wind_3gw',
    name: '풍력 3GW 건설',
    description: '풍력 설비 3 GW 추가. 풍속-출력곡선(시동·정격·차단 풍속)에 따라 발전.',
    constructionYears: 3,
    effect: { kind: 'addCapacity', tech: 'wind', gw: 3 },
    interactions: [
      '겨울철 풍속이 높아 겨울 수요 대응에 기여',
      '태양광과 발전 시간대가 달라 상호 보완 가능',
    ],
  },
  nuclear_2gw: {
    id: 'nuclear_2gw',
    name: '원자력 2GW 건설',
    description: '원자력 2 GW 추가. 건설 기간(7년) 동안 발전량 0, 완공 후 기저 발전.',
    constructionYears: 7,
    effect: { kind: 'addCapacity', tech: 'nuclear', gw: 2 },
    interactions: [
      '최소출력 제약 때문에 태양광이 많으면 낮 시간 출력제어를 키울 수 있음',
      '석탄 폐쇄 후 기저 공급 공백을 메울 수 있음 (완공 이후)',
    ],
  },
  coal_close_2gw: {
    id: 'coal_close_2gw',
    name: '석탄 발전소 2GW 폐쇄',
    description: '가장 오래된 석탄 설비 2 GW를 즉시 폐쇄. 폐지 비용 발생.',
    constructionYears: 0,
    effect: { kind: 'retireCapacity', tech: 'coal', gw: 2 },
    interactions: [
      '석탄 발전이 줄면 직접 배출 감소. 단, 줄어든 발전을 LNG가 대체하면 배출 감소폭이 작아짐',
      '대체 설비가 부족하면 피크 시간 미공급 전력이 발생할 수 있음',
    ],
  },
  lng_2gw: {
    id: 'lng_2gw',
    name: 'LNG 발전소 2GW 건설',
    description: 'LNG 복합 2 GW 추가. 빠른 출력 조절, 석탄보다 낮은 배출계수.',
    constructionYears: 3,
    effect: { kind: 'addCapacity', tech: 'lng', gw: 2 },
    interactions: [
      '피크 시간 공급 안정성 향상',
      '실제 발전량은 급전순위(변동비+탄소가격)에 따라 결정되어 설비만 늘고 발전은 적을 수 있음',
    ],
  },
  ess_10gwh: {
    id: 'ess_10gwh',
    name: 'ESS 10GWh 설치',
    description: '에너지저장장치 10 GWh / 2.5 GW (4시간형) 설치. 에너지를 생산하지 않고 이동만 함.',
    constructionYears: 1,
    effect: { kind: 'addStorage', gwh: 10, gw: 2.5 },
    interactions: [
      '충전할 잉여 전력이 있어야 효과가 있음 (태양광·풍력 과잉 시간)',
      '방전이 필요한 시간대(저녁 피크·공급 부족)가 있어야 가치가 있음',
      '충·방전 손실(왕복 효율) 만큼 에너지가 줄어듦',
    ],
  },
  grid_flex: {
    id: 'grid_flex',
    name: '전력망 유연성 강화',
    description:
      '계통 유연성 지표 +0.15 (동기발전 최소 요구량 감소) 및 수요반응 자원 +1.5 GW. 시행 2년.',
    constructionYears: 2,
    effect: { kind: 'gridFlex', flexDelta: 0.15, drDeltaGW: 1.5 },
    programCapex: 15000,
    programOmPerYear: 300,
    interactions: [
      '재생에너지 순간 수용 한도가 높아져 출력제어가 줄어들 수 있음',
      '잉여가 없는 계통에서는 효과가 작음',
    ],
  },
  efficiency: {
    id: 'efficiency',
    name: '에너지 효율 향상',
    description: '수요 증가율 0.25 %p 완화 및 연간 수요 1 % 절감. 시행 1년.',
    constructionYears: 1,
    effect: { kind: 'efficiency', growthDelta: -0.0025, demandCutFraction: 0.01 },
    programCapex: 8000,
    programOmPerYear: 500,
    interactions: [
      '모든 시간대 수요를 줄여 피크 부족과 화석 발전을 함께 줄임',
      '태양광 비중이 큰 계통에서는 낮 시간 잉여(출력제어)를 오히려 키울 수 있음',
    ],
  },
};

export const POLICY_IDS = Object.keys(DEFAULT_POLICIES) as PolicyId[];
