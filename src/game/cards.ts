import type { GameCard } from './types';

export const GAME_CARDS: GameCard[] = [
  // 1. 2026년 시작 카드: 노후 석탄화력 발전소 폐쇄 결단
  {
    id: 'start_coal_retirement',
    title: '노후 석탄발전소 조기 폐쇄 결단',
    department: '기후환경국장',
    avatar: '🏭',
    description:
      '장관님, 가동 30년이 넘은 노후 석탄화력 2GW를 조기 폐쇄해야 온실가스와 미세먼지를 즉각 줄일 수 있습니다. 반면 전력당국은 피크 공급 불안을 경고합니다.',
    targetYear: 2026,
    leftChoice: {
      text: '석탄 2GW 조기 폐쇄',
      subtext: '탄소와 미세먼지를 신속히 감축합니다.',
      policyId: 'coal_close_2gw',
      indicators: { budget: 0, approval: 1, grid: -1, environment: 1 },
      explanation: '가장 오래된 석탄 설비 2GW가 즉시 폐쇄되어 탄소 배출이 줄어듭니다.',
    },
    rightChoice: {
      text: '수명 만료까지 유지',
      subtext: '공급 안정성을 최우선으로 지킵니다.',
      indicators: { budget: 0, approval: -1, grid: 1, environment: -1 },
      explanation: '석탄 설비를 유지하여 전력 예비력을 확보하지만 환경단체가 비판합니다.',
    },
  },

  // 2. 2027년: 서해안 대규모 해상풍력 사업
  {
    id: 'wind_farm_west_sea',
    title: '서해안 대규모 해상풍력 단지 승인',
    department: '재생에너지추진단장',
    avatar: '🌬️',
    description:
      '서해안에 3GW 규모의 해상풍력 단지를 착공할 계획입니다. 완공까지 3년이 소요되며 대규모 투자비가 들지만, 겨울철과 야간에도 청정 전력을 생산할 수 있습니다.',
    targetYear: 2027,
    leftChoice: {
      text: '풍력 4GW 사업 승인',
      subtext: '대규모 투자를 단행해 바람을 잡습니다.',
      policyId: 'wind_3gw',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '3년 후 풍력 4GW가 가동되어 겨울철 수요와 무탄소 전력에 기여합니다.',
    },
    rightChoice: {
      text: '어민 갈등 고려해 보류',
      subtext: '예산을 아끼고 갈등을 피합니다.',
      indicators: { budget: 1, approval: -1, grid: 0, environment: -1 },
      explanation: '투자를 아꼈으나 장기 재생에너지 공급 경로 확보가 지연됩니다.',
    },
  },

  // 3. 2028년: 신규 대형 원자력 발전소 건설 허가
  {
    id: 'nuclear_expansion_debate',
    title: '신형 원전 3GW 건설 허가',
    department: '원자력발전협회 회장',
    avatar: '⚛️',
    description:
      '안정적인 기저 전력과 탄소 감축을 위해 3GW급 원전을 착공해야 합니다. 건설에 7년이 걸리고 대규모 공사비가 들지만, 완공 후에는 값싸고 배출 없는 전력을 24시간 공급합니다.',
    targetYear: 2028,
    leftChoice: {
      text: '원전 3GW 착공 허가',
      subtext: '7년 뒤 가동될 기저 전원을 구축합니다.',
      policyId: 'nuclear_2gw',
      indicators: { budget: -1, approval: -1, grid: 1, environment: 1 },
      explanation: '7년 후 원전 3GW가 완공되어 안정적인 무탄소 전력을 공급합니다.',
    },
    rightChoice: {
      text: '주민 반대 우려로 불허',
      subtext: '방폐장 및 안전 우려를 존중합니다.',
      indicators: { budget: 1, approval: 1, grid: -1, environment: 0 },
      explanation: '막대한 건설 예산을 아끼고 지역 갈등을 피했습니다.',
    },
  },

  // 4. 2029년: 재생에너지 출력제어 갈등과 대용량 ESS
  {
    id: 'spring_curtailment_ess',
    title: '봄철 태양광 잉여 전력과 ESS 확충',
    department: '전력망운영센터장',
    avatar: '🔋',
    description:
      '봄철 맑은 날 정오에 태양광 발전이 전력 수요를 초과하여 계통 불안정 위험이 있습니다. 16GWh 대용량 ESS(배터리)를 설치하여 잉여 전력을 저장할 것을 건의합니다.',
    targetYear: 2029,
    leftChoice: {
      text: 'ESS 16GWh 긴급 구축',
      subtext: '남는 전기를 모아 저녁 피크에 방전합니다.',
      policyId: 'ess_10gwh',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: 'ESS가 태양광 과잉 발전량을 흡수해 저녁 피크 시간 전력 공급에 활용됩니다.',
    },
    rightChoice: {
      text: '발전소 출력 강제 차단',
      subtext: '설비비 지출을 피하고 출력을 제어합니다.',
      indicators: { budget: 1, approval: -1, grid: 0, environment: -1 },
      explanation: '청정 전기가 버려지면서 사업자들의 반발과 탄소 감축 손실이 발생합니다.',
    },
  },

  // 5. 2030년: AI 데이터센터 급증과 전력 부족 경보
  {
    id: 'ai_datacenter_demand_shock',
    title: 'AI 데이터센터 유치와 전력 피크 위기',
    department: '산업통상전략관',
    avatar: '🖥️',
    description:
      '글로벌 첨단 AI 데이터센터가 대거 입주하면서 전력 수요가 급증하고 있습니다! 즉각적인 공급력 확보를 위해 LNG 복합발전 3GW를 확충할지, 산업 절전·효율 개선으로 대응할지 결정해야 합니다.',
    targetYear: 2030,
    leftChoice: {
      text: 'LNG 복합 3GW 증설',
      subtext: '빠른 기동과 확실한 피크 대응을 택합니다.',
      policyId: 'lng_2gw',
      indicators: { budget: -1, approval: 1, grid: 1, environment: -1 },
      explanation: '2년 후 LNG 3GW가 추가되어 전력 공급이 안정화되지만 가스 배출이 늘어납니다.',
    },
    rightChoice: {
      text: '스마트 에너지 효율화',
      subtext: '수요 관리와 산업체 절전 투자를 지원합니다.',
      policyId: 'efficiency',
      indicators: { budget: -1, approval: 0, grid: 1, environment: 1 },
      explanation: '연간 전력 수요 증가세를 낮추고 전체 에너지 소비를 줄여 대응합니다.',
    },
  },

  // 6. 2031년: 지능형 유연 전력망(Smart Grid) 투자
  {
    id: 'smart_grid_flexibility',
    title: '차세대 스마트 그리드와 수요반응(DR)',
    department: '한국전력 송배전본부장',
    avatar: '⚡',
    description:
      '재생에너지가 늘어남에 따라 전통적 회전 동기발전기 비중이 줄어 주파수 안정성이 흔들립니다. 전력망 유연성을 높이고 1.5GW 규모의 스마트 수요반응(DR) 시스템을 구축해야 합니다.',
    targetYear: 2031,
    leftChoice: {
      text: '유연성 전력망 국책사업',
      subtext: '계통 유연성과 스마트 DR을 강화합니다.',
      policyId: 'grid_flex',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '전력망이 재생에너지 변동성을 더 유연하게 흡수하고 비상시 정전을 예방합니다.',
    },
    rightChoice: {
      text: '기존 계통 그대로 운영',
      subtext: '투자 비용을 아끼고 관망합니다.',
      indicators: { budget: 1, approval: -1, grid: -1, environment: 0 },
      explanation: '재생에너지 접속 한계가 정체되어 출력제어가 증가할 수 있습니다.',
    },
  },

  // 7. 2032년: 영농형 및 지붕 태양광 대확산
  {
    id: 'distributed_solar_boom',
    title: '영농형·산단 지붕 태양광 8GW 프로젝트',
    department: '농림축산에너지협력관',
    avatar: '☀️',
    description:
      '모듈 가격이 대폭 하락하여 경제성이 크게 개선되었습니다. 농지와 산업단지 지붕을 활용해 분산형 태양광 8GW를 집중 설치하자는 제안이 올라왔습니다. 공기는 단 1년입니다.',
    targetYear: 2032,
    leftChoice: {
      text: '태양광 8GW 대규모 승인',
      subtext: '1년 만에 청정 발전용량을 대폭 확충합니다.',
      policyId: 'solar_5gw',
      indicators: { budget: -1, approval: 1, grid: 0, environment: 1 },
      explanation: '태양광 8GW가 바로 다음 해 가동을 시작해 낮 시간 화석 발전을 밀어냅니다.',
    },
    rightChoice: {
      text: '경관·산림 훼손 방지 우선',
      subtext: '신규 허가 심사를 대폭 강화합니다.',
      indicators: { budget: 0, approval: 0, grid: 0, environment: -1 },
      explanation: '무분별한 난개발을 막았으나 태양광 보급 속도가 주춤합니다.',
    },
  },

  // 8. 2033년: 전기요금 현실화 논쟁
  {
    id: 'electricity_tariff_reform',
    title: '전기요금 원가 연동제와 물가 갈등',
    department: '기획재정부 차관',
    avatar: '💰',
    description:
      '장관님, 에너지 전환 투자와 연료비 부담으로 전력 공기업 누적 적자가 심각합니다. 전기요금을 인상하여 예산을 건전화할 것인지, 민생 안정을 위해 동결할 것인지 결단해야 합니다.',
    targetYear: 2033,
    leftChoice: {
      text: '전기요금 현실화 (인상)',
      subtext: '재정을 건전화하고 과소비를 억제합니다.',
      budgetDeltaEok: 15000,
      approvalDelta: -10,
      indicators: { budget: 1, approval: -1, grid: 1, environment: 1 },
      explanation: '전력 예산 1.5조 원이 확충되었으나 국민들의 원성이 자자합니다.',
    },
    rightChoice: {
      text: '물가 안정을 위해 동결',
      subtext: '서민 부담을 줄이고 정부 재정으로 흡수합니다.',
      budgetDeltaEok: -8000,
      approvalDelta: 10,
      indicators: { budget: -1, approval: 1, grid: 0, environment: 0 },
      explanation: '지지율은 급상승했으나 정부 에너지 예산 잔액이 8,000억 원 감소했습니다.',
    },
  },

  // 9. 2034년: 2차 노후 석탄화력 퇴역과 지역 경제
  {
    id: 'second_coal_phaseout',
    title: '석탄화력 폐쇄 도시의 정의로운 전환',
    department: '충남 발전소 소재 지자체장',
    avatar: '🏛️',
    description:
      '남아있는 석탄발전소 2GW를 추가 폐쇄하려 하자 발전소 근로자들과 지역 상인들이 상경 투쟁을 시작했습니다! 일자리 대책과 친환경 전환 지원이 시급합니다.',
    targetYear: 2034,
    leftChoice: {
      text: '석탄 2GW 추가 폐쇄 및 전환',
      subtext: '탄소 감축을 늦출 수 없습니다.',
      policyId: 'coal_close_2gw',
      indicators: { budget: 0, approval: -1, grid: -1, environment: 1 },
      explanation: '석탄 2GW가 추가 폐쇄되어 온실가스가 대폭 줄어듭니다.',
    },
    rightChoice: {
      text: '폐쇄 일정 연기',
      subtext: '지역 경제와 고용 안정을 위해 유예합니다.',
      indicators: { budget: 0, approval: 1, grid: 1, environment: -1 },
      explanation: '지역 갈등은 봉합되었으나 국제 환경기구의 탄소 배출 비판이 이어집니다.',
    },
  },

  // 10. 2035년: 해상풍력 2차 확장과 계통 연계
  {
    id: 'offshore_wind_phase2',
    title: '동해 부유식 해상풍력 4GW 사업',
    department: '해양에너지개발공사',
    avatar: '🌊',
    description:
      '동해안의 깊은 바다에 부유식 해상풍력 4GW를 건설하는 첨단 사업입니다. 바람의 질이 좋아 높은 이용률을 기대할 수 있으나 고난도 해상 송전선로 연결이 필수입니다.',
    targetYear: 2035,
    leftChoice: {
      text: '부유식 풍력 4GW 추진',
      subtext: '미래 핵심 해상풍력 기술을 선점합니다.',
      policyId: 'wind_3gw',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '3년 후 가동되어 동해안의 청정 무탄소 전력을 공급합니다.',
    },
    rightChoice: {
      text: '육상 재생에너지에 집중',
      subtext: '비싼 해양 건설비를 회피합니다.',
      indicators: { budget: 1, approval: 0, grid: 0, environment: 0 },
      explanation: '리스크를 피했으나 해상풍력 밸류체인 구축 기회를 놓쳤습니다.',
    },
  },

  // 11. 2036년: 전력망 대혼란과 에너지 저장(ESS) 2차 증설
  {
    id: 'ess_scaleup_2036',
    title: '출력제어 한계 도달! 대규모 ESS 확충',
    department: '전력거래소 이사장',
    avatar: '🔌',
    description:
      '태양광과 풍력이 급증하여 낮 시간 버려지는 전력(출력제어)이 연간 수 TWh에 달하고 있습니다! 16GWh ESS를 추가로 설치하여 계통 낭비를 막아야 합니다.',
    targetYear: 2036,
    leftChoice: {
      text: 'ESS 16GWh 추가 증설',
      subtext: '저장 설비를 늘려 버려지는 전기를 구조합니다.',
      policyId: 'ess_10gwh',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '저장 용량이 대폭 확충되어 잉여 전력 흡수와 저녁 피크 안정도가 크게 향상됩니다.',
    },
    rightChoice: {
      text: '재생에너지 증설 일시 제한',
      subtext: '배터리 투자 비용을 아낍니다.',
      indicators: { budget: 1, approval: -1, grid: 0, environment: -1 },
      explanation: '비용은 아꼈지만 탄소 감축 속도가 현저히 느려집니다.',
    },
  },

  // 12. 2037년: 무탄소 기저 전원과 원전 계속운전 / 신규 건설
  {
    id: 'nuclear_clean_baseload',
    title: '무탄소 기저전원 원자력 3GW 추가',
    department: '원자력학회 이사장',
    avatar: '⚛️',
    description:
      '2040년대 석탄 발전의 완전 퇴역에 대비하여 무탄소 기저 전원 3GW를 선제 착공해야 합니다. 7년의 7년 건설 기간을 고려하면 지금이 마지막 골든타임입니다.',
    targetYear: 2037,
    leftChoice: {
      text: '원전 3GW 착공 승인',
      subtext: '2044년 완공을 목표로 기저 공급을 보강합니다.',
      policyId: 'nuclear_2gw',
      indicators: { budget: -1, approval: -1, grid: 1, environment: 1 },
      explanation: '7년 뒤 가동될 3GW 원전 건설이 시작되어 미래의 대정전을 예방합니다.',
    },
    rightChoice: {
      text: '재생에너지 100% 경로 집중',
      subtext: '원자력 의존을 지양하고 다른 대안을 모색합니다.',
      indicators: { budget: 1, approval: 1, grid: -1, environment: 0 },
      explanation: '원전 건설비는 절감되었으나 향후 무탄소 기저 공급 공백이 커질 수 있습니다.',
    },
  },

  // 13. 2038년: 건물 및 산단 전면 고효율화 (에너지 효율)
  {
    id: 'super_efficiency_drive',
    title: '국가 전력 효율 혁신 프로젝트',
    department: '한국에너지공단 이사장',
    avatar: '🏢',
    description:
      '가장 깨끗하고 저렴한 발전소는 "전기를 쓰지 않는 것"입니다! 모든 신축 건물 제로에너지 인증 의무화와 산업용 인버터 모터 전면 교체를 지원합니다.',
    targetYear: 2038,
    leftChoice: {
      text: '초고효율화 국책 지원',
      subtext: '국가 전력 수요 증가세를 영구적으로 꺾습니다.',
      policyId: 'efficiency',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '수요가 구조적으로 절감되어 발전소 건설 부담과 탄소 배출이 함께 줄어듭니다.',
    },
    rightChoice: {
      text: '기업 자율 추진에 일임',
      subtext: '정부 재정 지출을 최소화합니다.',
      indicators: { budget: 1, approval: -1, grid: -1, environment: 0 },
      explanation: '단기 재정은 보존했으나 전력 수요가 가파르게 상승합니다.',
    },
  },

  // 14. 2039년: 유연성 백업용 청정 LNG 발전소
  {
    id: 'lng_peaker_addition',
    title: '재생에너지 간헐성 대응 백업 LNG 2GW',
    department: '전력수급비상대책반장',
    avatar: '🔥',
    description:
      '바람이 불지 않고 비가 쏟아지는 혹한기 며칠간 계통 붕괴 위험이 있습니다. 15분 만에 최대 출력으로 가동할 수 있는 유연성 LNG 복합 2GW가 절실합니다.',
    targetYear: 2039,
    leftChoice: {
      text: '유연성 LNG 3GW 건설',
      subtext: '비상 정전을 막기 위한 든든한 백업을 마련합니다.',
      policyId: 'lng_2gw',
      indicators: { budget: -1, approval: 0, grid: 1, environment: -1 },
      explanation: '2년 후 LNG 3GW가 추가되어 비상시 급전 능력이 강화됩니다.',
    },
    rightChoice: {
      text: '수요반응과 ESS로만 버티기',
      subtext: '화석연료 시설 추가를 일절 금지합니다.',
      indicators: { budget: 1, approval: 1, grid: -1, environment: 1 },
      explanation: '화석연료 추가를 막았으나 악천후 시 예비율 하락 위험을 감수해야 합니다.',
    },
  },

  // 15. 2040년: 태양광 대확산과 국민 펀드
  {
    id: 'solar_national_fund',
    title: '전국 햇빛 발전소 5GW 국민 참여 펀드',
    department: '시민에너지협동조합 연합',
    avatar: '☀️',
    description:
      '국민들이 십시일반 참여하는 이익공유형 태양광 8GW 프로젝트입니다. 지역 주민에게 배당을 지급하여 수용성을 획기적으로 높이고 재생에너지를 신속 보급합니다.',
    targetYear: 2040,
    leftChoice: {
      text: '국민 참여 태양광 8GW 승인',
      subtext: '수용성을 확보하며 태양광을 추가합니다.',
      policyId: 'solar_5gw',
      indicators: { budget: -1, approval: 1, grid: 0, environment: 1 },
      explanation: '1년 만에 태양광 8GW가 가동되어 주간 탄소 배출을 획기적으로 줄입니다.',
    },
    rightChoice: {
      text: '송전망 혼잡 우려로 반려',
      subtext: '계통 포화 지역의 무분별한 유입을 통제합니다.',
      indicators: { budget: 0, approval: -1, grid: 1, environment: 0 },
      explanation: '계통 혼잡은 피했으나 시민들의 친환경 기대감은 실망으로 돌아섰습니다.',
    },
  },

  // 16. 2041년: 전력망 동기화 및 가상관성 신기술 도입
  {
    id: 'virtual_inertia_grid',
    title: '그리드포밍(Grid-Forming) 인버터 의무화',
    department: '전기학회 계통연구회장',
    avatar: '📡',
    description:
      '재생에너지가 전체의 절반을 넘어가면서 발전기 회전 관성이 고갈되었습니다! 대규모 전력망 유연성 투자와 인버터 가상관성 기술을 긴급 전면 배포해야 합니다.',
    targetYear: 2041,
    leftChoice: {
      text: '차세대 전력망 유연화 도입',
      subtext: '정전 없는 고비중 재생에너지 전력망을 만듭니다.',
      policyId: 'grid_flex',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '전력망 유연성이 0.15 향상되고 대규모 수요반응 자원이 확보됩니다.',
    },
    rightChoice: {
      text: '기술 검증 부족으로 유예',
      subtext: '해외 사례를 더 지켜봅니다.',
      indicators: { budget: 1, approval: -1, grid: -1, environment: 0 },
      explanation: '투자비는 아꼈으나 주파수 급락 시 계통 트립 위험이 커집니다.',
    },
  },

  // 17. 2042년: 잔여 석탄화력 완전 퇴출 논의
  {
    id: 'final_coal_shutdown',
    title: '대한민국 마지막 석탄발전소 영구 폐쇄',
    department: '대통령실 기후수석',
    avatar: '🍂',
    description:
      '국제 사회에 공약한 석탄 발전 전면 폐지 시한이 다가왔습니다. 남아있는 석탄화력 2GW를 영구 폐쇄하여 "탈석탄 대한민국"을 선언할 역사적 순간입니다.',
    targetYear: 2042,
    leftChoice: {
      text: '마지막 석탄 2GW 즉시 폐쇄',
      subtext: '석탄의 시대를 끝내고 탄소를 감축합니다.',
      policyId: 'coal_close_2gw',
      indicators: { budget: 0, approval: 1, grid: -1, environment: 1 },
      explanation: '석탄 발전이 영구 퇴출되며 국가 온실가스가 극적으로 줄어듭니다.',
    },
    rightChoice: {
      text: '비상용 예비 설비로 존치',
      subtext: '혹시 모를 겨울 한파에 대비해 보관합니다.',
      indicators: { budget: 0, approval: -1, grid: 1, environment: -1 },
      explanation: '전력 안정성은 지켰지만 넷제로 약속 이행에 의문이 제기됩니다.',
    },
  },

  // 18. 2043년: 해상풍력 4차 확대
  {
    id: 'wind_expansion_2043',
    title: '남해안 청정 해상풍력 4GW 추가 착공',
    department: '남해안광역개발청장',
    avatar: '🌬️',
    description:
      '기술 혁신으로 풍력 터빈 용량이 기당 15MW로 거대화되었습니다. 남해안 바람길을 활용한 3GW 풍력 단지를 구축해 야간 및 사계절 무탄소 전력을 확충합시다.',
    targetYear: 2043,
    leftChoice: {
      text: '초대형 풍력 4GW 착공',
      subtext: '대형 터빈 기술을 결합해 청정 바람을 담습니다.',
      policyId: 'wind_3gw',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '3년 후 완공되어 사계절 균형 잡힌 재생에너지 포트폴리오를 완성합니다.',
    },
    rightChoice: {
      text: '사업 규모 대폭 축소',
      subtext: '재정 부담을 줄입니다.',
      indicators: { budget: 1, approval: 0, grid: 0, environment: 0 },
      explanation: '예산을 절약했으나 풍력 비중 확충 목표가 지연됩니다.',
    },
  },

  // 19. 2044년: 계통 장주기 에너지 저장장치(ESS)
  {
    id: 'long_duration_ess',
    title: '장주기 ESS 16GWh 추가 보급',
    department: '에너지기술연구원장',
    avatar: '🔋',
    description:
      '재생에너지 비중이 70%에 육박하면서 날씨가 흐린 날에도 며칠간 버틸 수 있는 저장장치가 필요합니다. 10GWh 대용량 저장 설비를 확충하여 계통 복원력을 극대화합시다.',
    targetYear: 2044,
    leftChoice: {
      text: '장주기 ESS 16GWh 구축',
      subtext: '미래형 무탄소 전력망의 든든한 저수지를 만듭니다.',
      policyId: 'ess_10gwh',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '재생에너지 잉여 전력을 거의 100% 흡수하고 피크 공급을 책임집니다.',
    },
    rightChoice: {
      text: '기존 가스발전 백업에 의존',
      subtext: '배터리 추가 구매를 보류합니다.',
      indicators: { budget: 1, approval: -1, grid: 0, environment: -1 },
      explanation: '비용은 아꼈지만 탄소 배출 제로화가 지체됩니다.',
    },
  },

  // 20. 2045년: 마지막 5년, 탄소중립 2050 총력전
  {
    id: 'efficiency_final_push',
    title: '2050 탄소중립을 향한 국가 에너지 혁신',
    department: '국가탄소중립녹색성장위원장',
    avatar: '🌱',
    description:
      '2050년 넷제로까지 단 5년 남았습니다! 산업, 수송, 건물 전 부문의 에너지 효율을 극한으로 끌어올리고 전 국민 절전 캠페인을 전개할 전면적 특별법을 발의합니다.',
    targetYear: 2045,
    leftChoice: {
      text: '탄소중립 특별 혁신법 통과',
      subtext: '국가 수요 구조를 영구 혁신하고 탄소를 절감합니다.',
      policyId: 'efficiency',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '전력 수요 증가가 억제되고 최종 에너지 소비가 뚜렷하게 줄어듭니다.',
    },
    rightChoice: {
      text: '규제 과도 우려로 완화',
      subtext: '기업의 자율성에 맡깁니다.',
      indicators: { budget: 1, approval: -1, grid: -1, environment: 0 },
      explanation: '단기 규제 반발은 피했으나 2050 넷제로 달성에 먹구름이 낍니다.',
    },
  },

  // === 동적 긴급 카드 (조건부 발동) ===
  // 긴급 카드 1: 대정전(블랙아웃) 위기 경보
  {
    id: 'emergency_unserved_power',
    title: '⚠️ 비상 경보: 전력 공급 부족 사태 발생!',
    department: '중앙전력관제센터장',
    avatar: '🚨',
    description:
      '장관님! 지난 1년간 심각한 전력 미공급 사태가 발생하여 산업체 조업 중단과 국민들의 비난이 빗발치고 있습니다! 즉시 긴급 공급력 확충을 결단해야 합니다!',
    condition: (_state, lastResult) => (lastResult?.unservedGWh ?? 0) > 10,
    leftChoice: {
      text: '긴급 LNG 3GW 급행 건설',
      subtext: '비상 발전설비를 3년 내로 전력망에 투입합니다.',
      policyId: 'lng_2gw',
      indicators: { budget: -1, approval: 1, grid: 1, environment: -1 },
      explanation: 'LNG 복합이 조기 투입되어 공급 부족 사태를 진화합니다.',
    },
    rightChoice: {
      text: '수요반응(DR) 및 긴급 절전령',
      subtext: '공장 가동을 멈추고 강제 절전으로 버팁니다.',
      policyId: 'grid_flex',
      indicators: { budget: -1, approval: -1, grid: 1, environment: 1 },
      explanation: '스마트 DR을 총동원해 공급 부족을 메우지만 경제적 피해가 발생합니다.',
    },
  },

  // 긴급 카드 2: 온실가스 배출 폭증에 따른 국제 탄소세 압박
  {
    id: 'emergency_high_emissions',
    title: '⚠️ EU 탄소국경조정제도(CBAM) 무역 제재 직면',
    department: '외교통상교섭본부장',
    avatar: '🌍',
    description:
      '대한민국의 전력 부문 온실가스 배출이 여전히 줄지 않아 수출 주력 품목에 천문학적인 탄소 관세가 부과될 위기입니다! 즉각적인 친환경 전환 조치가 요구됩니다.',
    condition: (_state, lastResult) => (lastResult?.emissionsMt ?? 0) > 120,
    leftChoice: {
      text: '태양광 8GW 긴급 보급',
      subtext: '1년 만에 가동되는 태양광으로 화석 발전을 줄입니다.',
      policyId: 'solar_5gw',
      indicators: { budget: -1, approval: 1, grid: 0, environment: 1 },
      explanation: '신속하게 태양광을 투입해 화석연료 발전을 대체하고 배출을 낮춥니다.',
    },
    rightChoice: {
      text: '석탄 2GW 과감한 조기 폐쇄',
      subtext: '가장 배출이 심한 설비를 즉각 셧다운합니다.',
      policyId: 'coal_close_2gw',
      indicators: { budget: 0, approval: -1, grid: -1, environment: 1 },
      explanation: '석탄 배출을 즉각 제거하여 무역 제재 위기를 극복합니다.',
    },
  },

  // 긴급 카드 3: 예산 고갈 위기
  {
    id: 'emergency_fiscal_crisis',
    title: '⚠️ 재정 고갈 경보: 에너지 기금 바닥',
    department: '국회 예산결산특별위원장',
    avatar: '💸',
    description:
      '장관님, 무리한 설비 투자와 보조금 지출로 정부 에너지 예산이 고갈 직전입니다! 특별 재정 확충책을 내놓지 않으면 부처 업무가 마비됩니다.',
    condition: (state) => state.budget < 5000,
    leftChoice: {
      text: '에너지 전환 특별채권 발행',
      subtext: '국채 2조 원을 발행해 예산을 긴급 수혈합니다.',
      budgetDeltaEok: 20000,
      approvalDelta: -5,
      indicators: { budget: 1, approval: -1, grid: 0, environment: 0 },
      explanation: '재정 2조 원이 충원되어 급한 불을 껐으나 미래 세대 빚이 늘었습니다.',
    },
    rightChoice: {
      text: '신규 사업 전면 동결 및 구조조정',
      subtext: '허리띠를 졸라매고 신규 지출을 중단합니다.',
      budgetDeltaEok: 5000,
      approvalDelta: -10,
      indicators: { budget: 1, approval: -1, grid: -1, environment: 0 },
      explanation: '사업 중단으로 혼란이 발생했으나 재정 파탄은 면했습니다.',
    },
  },

  // 긴급 카드 4: 지지율 급락 위기
  {
    id: 'emergency_low_approval',
    title: '⚠️ 민심 이반: 장관 불신임 결의안 발의 직전',
    department: '대통령 비서실장',
    avatar: '📉',
    description:
      '전기요금 인상과 각종 정책 혼선으로 국민 지지율이 바닥을 치고 있습니다. 대대적인 민생 지원책과 대국민 소통을 진행하지 않으면 내일 아침 경질될 수 있습니다!',
    condition: (state) => state.socialAcceptance < 20,
    leftChoice: {
      text: '전 국민 에너지 바우처 지급',
      subtext: '취약계층 및 서민에게 1조 원의 난방·전기비를 지원합니다.',
      budgetDeltaEok: -10000,
      approvalDelta: 25,
      indicators: { budget: -1, approval: 1, grid: 0, environment: 0 },
      explanation: '국민 지지율이 극적으로 반등하여 정치적 위기를 모면했습니다.',
    },
    rightChoice: {
      text: '정책 신념 유지 담화문 발표',
      subtext: '미래를 위한 고통 분담을 솔직하게 호소합니다.',
      approvalDelta: 5,
      indicators: { budget: 0, approval: 0, grid: 0, environment: 0 },
      explanation: '진정성 있는 호소로 지지율 하락을 가까스로 방어했습니다.',
    },
  },
];

/**
 * 특정 연도에 제시할 카드 1장을 결정하는 함수
 */
export function selectCardForYear(
  year: number,
  state: import('../engine').SimulationState,
  lastResult?: import('../engine').YearResult,
  usedCardIds: Set<string> = new Set(),
): GameCard {
  // 1. 긴급 조건 충족 카드가 있는지 먼저 확인
  const emergencyCards = GAME_CARDS.filter(
    (c) => c.condition && !usedCardIds.has(c.id) && c.condition(state, lastResult),
  );
  if (emergencyCards.length > 0) {
    return emergencyCards[0];
  }

  // 2. 해당 연도 지정 카드 탐색
  const yearCard = GAME_CARDS.find((c) => c.targetYear === year && !usedCardIds.has(c.id));
  if (yearCard) {
    return yearCard;
  }

  // 3. 미사용 일반 카드 탐색
  const availableCards = GAME_CARDS.filter((c) => !c.condition && !usedCardIds.has(c.id));
  if (availableCards.length > 0) {
    return availableCards[0];
  }

  // 4. 모든 카드를 소진한 경우: 주기적 정책 제안 카드 생성
  return {
    id: `dynamic_${year}`,
    title: `${year}년 정기 전력 수급 정책 협의`,
    department: '전력정책심의회',
    avatar: '⚖️',
    description: `${year}년도 국가 에너지 수급과 탄소중립 로드맵 이행을 위한 정책 방향을 선택해주세요.`,
    leftChoice: {
      text: '태양광 8GW 및 청정망 보급',
      subtext: '재생에너지 확충에 속도를 냅니다.',
      policyId: 'solar_5gw',
      indicators: { budget: -1, approval: 1, grid: 0, environment: 1 },
      explanation: '태양광 8GW가 추가되어 탄소 감축에 기여합니다.',
    },
    rightChoice: {
      text: '에너지 절감 및 효율 혁신',
      subtext: '수요 관리로 전력 소비를 줄입니다.',
      policyId: 'efficiency',
      indicators: { budget: -1, approval: 1, grid: 1, environment: 1 },
      explanation: '에너지 효율이 향상되어 전체 수요가 절감됩니다.',
    },
  };
}
