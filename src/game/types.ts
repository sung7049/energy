import type { PolicyId, SimulationState, YearResult } from '../engine';

export type GaugeType = 'budget' | 'approval' | 'grid' | 'environment';

export interface CardChoice {
  text: string;
  subtext?: string;
  policyId?: PolicyId;
  /** 특수 예산/수용성 변화 (엔진 외 추가 효과) */
  budgetDeltaEok?: number;
  approvalDelta?: number;
  /** 사용자에게 표시할 예상 영향 힌트 (+1: 상승, -1: 하락, 0: 없음) */
  indicators: {
    budget: -1 | 0 | 1;
    approval: -1 | 0 | 1;
    grid: -1 | 0 | 1;
    environment: -1 | 0 | 1;
  };
  explanation: string;
}

export interface GameCard {
  id: string;
  title: string;
  department: string; // 예: "기후대기정책과장", "전력거래소 관제센터장", "재정기획국장", "원자력안전위원장", "시민환경단체 연대"
  avatar: string; // 이모지 또는 아이콘
  description: string;
  leftChoice: CardChoice;
  rightChoice: CardChoice;
  /** 특정 연도에 우선 등장 (옵션) */
  targetYear?: number;
  /** 등장 조건 (옵션) */
  condition?: (state: SimulationState, lastResult?: YearResult) => boolean;
}

export interface GameOverReason {
  type: 'approval_zero' | 'blackout' | 'bankruptcy';
  title: string;
  description: string;
}
