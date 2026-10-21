import React, { useState, useMemo, useCallback } from 'react';
import {
  DEFAULT_CONFIG,
  createInitialState,
  stepYear,
  applyPolicy,
  type SimulationState,
  type YearResult,
} from '../engine';
import { selectCardForYear } from './cards';
import type { CardChoice, GameOverReason } from './types';
import { GaugeHeader } from './components/GaugeHeader';
import { CardSwiper } from './components/CardSwiper';
import { YearSummaryModal } from './components/YearSummaryModal';
import { EndingModal } from './components/EndingModal';

interface GamePageProps {
  onGoToLab?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onGoToLab }) => {
  // 시뮬레이션 상태
  const [simState, setSimState] = useState<SimulationState>(() =>
    createInitialState(DEFAULT_CONFIG, 42, 'deterministic'),
  );

  // 연도별 선택된 정책 및 결과 기록
  const [lastYearResult, setLastYearResult] = useState<YearResult | null>(null);
  const [lastChoiceExplanation, setLastChoiceExplanation] = useState<string>('');
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // 게임 종료 사유
  const [gameOverReason, setGameOverReason] = useState<GameOverReason | null>(null);
  const [isGameEnded, setIsGameEnded] = useState<boolean>(false);

  // 현재 호버 중인 선택지 (게이지 인디케이터용)
  const [hoveredChoice, setHoveredChoice] = useState<CardChoice | null>(null);

  // 사용한 카드 ID 추적
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());

  // 현재 연도 (2026 ~ 2050)
  const currentYear = simState.year;

  // 현재 연도에 해당하는 카드 선택
  const currentCard = useMemo(() => {
    return selectCardForYear(currentYear, simState, lastYearResult ?? undefined, usedCardIds);
  }, [currentYear, simState, lastYearResult, usedCardIds]);

  // 카드 선택 처리
  const handleChoose = useCallback(
    (choice: CardChoice, _direction: 'left' | 'right') => {
      // 1. 상태 복제
      let nextState = structuredClone(simState);

      // 2. 정책 적용 (있을 경우)
      if (choice.policyId) {
        nextState = applyPolicy(nextState, choice.policyId);
      }

      // 3. 특수 보정 (예산 및 지지율 직접 가감)
      if (choice.budgetDeltaEok) {
        nextState.budget += choice.budgetDeltaEok;
      }
      if (choice.approvalDelta) {
        nextState.socialAcceptance = Math.max(
          0,
          Math.min(100, nextState.socialAcceptance + choice.approvalDelta),
        );
      }

      // 4. 엔진 1년 전진 시뮬레이션 (물리 계산 수행)
      const step = stepYear(nextState);
      const yearResult = step.result;
      const updatedState = step.state;

      // 사용한 카드 등록
      setUsedCardIds((prev) => new Set(prev).add(currentCard.id));

      // 결과 저장
      setLastYearResult(yearResult);
      setLastChoiceExplanation(choice.explanation);
      setSimState(updatedState);
      setHoveredChoice(null);

      // 게임 오버 조건 체크
      if (updatedState.socialAcceptance <= 0) {
        setGameOverReason({
          type: 'approval_zero',
          title: '국민 불신임으로 인한 장관 해임',
          description:
            '전기요금 급등과 전력 혼란으로 국민 지지율이 0%에 도달하여 국회에서 해임건의안이 통과되었습니다.',
        });
        setIsGameEnded(true);
        return;
      }

      if (yearResult.unservedGWh > 1000) {
        setGameOverReason({
          type: 'blackout',
          title: '국가 대정전(블랙아웃) 참사로 인한 경질',
          description:
            '연간 1,000GWh 이상의 치명적인 전력 공급 결손이 발생하여 산업이 마비되고 국가 비상사태가 선포되었습니다.',
        });
        setIsGameEnded(true);
        return;
      }

      if (updatedState.budget < -100000) {
        // 부채 10조 초과
        setGameOverReason({
          type: 'bankruptcy',
          title: '정부 에너지 재정 파탄',
          description:
            '감당할 수 없는 누적 적자와 재정 지출로 에너지 전환 기금이 파산에 이르렀습니다.',
        });
        setIsGameEnded(true);
        return;
      }

      // 정상적인 경우 연말 결산 모달 오픈
      setShowSummaryModal(true);
    },
    [simState, currentCard.id],
  );

  // 다음 연도로 진행
  const handleNextYear = useCallback(() => {
    setShowSummaryModal(false);
    if (simState.year > 2050) {
      setIsGameEnded(true);
    }
  }, [simState.year]);

  // 게임 재시작
  const handleRestart = useCallback(() => {
    setSimState(createInitialState(DEFAULT_CONFIG, 42, 'deterministic'));
    setLastYearResult(null);
    setLastChoiceExplanation('');
    setShowSummaryModal(false);
    setGameOverReason(null);
    setIsGameEnded(false);
    setUsedCardIds(new Set());
    setHoveredChoice(null);
  }, []);

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px 16px 40px 16px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* 게임 헤더 바 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> 에너지 장관 2050
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            정책 결정을 내려 탄소중립과 전력 공급 안정을 동시에 달성하세요!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRestart}
            title="게임 처음부터 다시 시작"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: '#cbd5e1',
              background: '#21262d',
              border: '1px solid #30363d',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🔄 리셋
          </button>
          {onGoToLab && (
            <button
              onClick={onGoToLab}
              title="상세 수치 실험실로 이동"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'var(--bg-input, #e2e8f0)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              🔬 실험실 보기
            </button>
          )}
        </div>
      </div>

      {/* 2026~2050 진행 바 타임라인 */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--text-muted)',
          }}
        >
          <span>시작 (2026년)</span>
          <span style={{ color: 'var(--primary, #3b82f6)' }}>
            임기 {Math.min(25, currentYear - 2026 + 1)}년차 / 25년
          </span>
          <span>목표 (2050년 넷제로)</span>
        </div>
        <div
          style={{
            height: '6px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, ((currentYear - 2026) / 24) * 100)}%`,
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 4대 핵심 게이지 헤더 */}
      <GaugeHeader
        budgetEok={simState.budget}
        approval={simState.socialAcceptance}
        unservedGWh={lastYearResult?.unservedGWh ?? 0}
        emissionsMt={lastYearResult?.emissionsMt ?? 145}
        activeChoice={hoveredChoice}
      />

      {/* Reigns 스타일 카드 스와이프 인터페이스 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentYear <= 2050 && !isGameEnded ? (
          <CardSwiper
            card={currentCard}
            year={currentYear}
            onChoose={handleChoose}
            onHoverChoice={setHoveredChoice}
          />
        ) : null}
      </div>

      {/* 연말 결산 특보 모달 */}
      {showSummaryModal && lastYearResult && (
        <YearSummaryModal
          result={lastYearResult}
          choiceExplanation={lastChoiceExplanation}
          onNextYear={handleNextYear}
        />
      )}

      {/* 게임 종료 / 2050 완주 엔딩 모달 */}
      {isGameEnded && (
        <EndingModal
          state={simState}
          gameOverReason={gameOverReason}
          onRestart={handleRestart}
          onGoToLab={onGoToLab || (() => {})}
        />
      )}
    </div>
  );
};
