import React from 'react';
import type { GameOverReason } from '../types';
import type { SimulationState } from '../../engine';

interface EndingModalProps {
  state: SimulationState;
  gameOverReason?: GameOverReason | null;
  onRestart: () => void;
  onGoToLab: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  state,
  gameOverReason,
  onRestart,
  onGoToLab,
}) => {
  const lastResult = state.history[state.history.length - 1];
  const firstResult = state.history[0];

  const startEmissions = firstResult?.emissionsMt || 145;
  const finalEmissions = lastResult?.emissionsMt || 0;
  const emissionReductionPct = Math.max(
    0,
    ((startEmissions - finalEmissions) / startEmissions) * 100,
  );

  const totalUnservedGWh = state.history.reduce((sum, h) => sum + h.unservedGWh, 0);

  // 2050년 완주 시 칭호 계산
  const getEndingTitle = () => {
    if (gameOverReason) {
      return {
        badge: '🚨 조기 퇴진',
        title: gameOverReason.title,
        desc: gameOverReason.description,
        color: '#ef4444',
      };
    }

    if (finalEmissions < 15 && totalUnservedGWh === 0) {
      return {
        badge: '🏆 전설의 명예장관',
        title: '2050 넷제로 신화의 영웅',
        desc: '365일 무정전 전력 안정성과 획기적인 탄소 감축을 동시에 달성하여 세계 에너지 역사를 새로 썼습니다!',
        color: '#10b981',
      };
    }

    if (emissionReductionPct > 80) {
      return {
        badge: '🌿 녹색 혁신가',
        title: '청정에너지 대전환의 선구자',
        desc: '태양광, 풍력, ESS를 중심으로 탄소 배출을 80% 이상 감축하며 성공적인 녹색 전력망을 구축했습니다.',
        color: '#059669',
      };
    }

    if (totalUnservedGWh === 0 && (lastResult?.capacitiesGW.nuclear ?? 0) > 30) {
      return {
        badge: '⚛️ 무탄소 기저의 수호신',
        title: '원자력 중심 안정 계통 구축자',
        desc: '견고한 기저전원과 청정망을 조화시켜 단 1초의 정전도 없이 산업 경쟁력과 온실가스를 지켜냈습니다.',
        color: '#8b5cf6',
      };
    }

    if (totalUnservedGWh === 0) {
      return {
        badge: '⚡ 철벽 방어관',
        title: '무정전 전력망의 수호자',
        desc: '탄소 감축의 압박 속에서도 한 치의 전력 부족 없이 대한민국의 공장과 가정을 안전하게 지켰습니다.',
        color: '#3b82f6',
      };
    }

    return {
      badge: '⚖️ 고뇌의 정책가',
      title: '격동의 2050 에너지 전환 관리자',
      desc: '복잡한 사회적 갈등과 정전 위험 속에서도 2050년까지 끈기 있게 대한민국 전력망을 이끌어왔습니다.',
      color: '#eab308',
    };
  };

  const ending = getEndingTitle();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          padding: '32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color, #e2e8f0)',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'center',
        }}
      >
        {/* 배지 & 타이틀 */}
        <div>
          <span
            style={{
              background: ending.color,
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '1px',
            }}
          >
            {ending.badge}
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '14px 0 8px 0' }}>
            {ending.title}
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {ending.desc}
          </p>
        </div>

        {/* 25년간의 종합 성적표 */}
        <div
          style={{
            background: 'var(--bg-input, #f8fafc)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            textAlign: 'left',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>온실가스 감축률</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {emissionReductionPct.toFixed(1)}% 감축
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({startEmissions.toFixed(0)}Mt → {finalEmissions.toFixed(0)}Mt)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>누적 미공급 전력 (정전)</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: totalUnservedGWh > 0 ? '#ef4444' : '#10b981',
                marginTop: '2px',
              }}
            >
              {totalUnservedGWh > 0 ? `${totalUnservedGWh.toFixed(1)} GWh` : '0 GWh (완벽 안정)'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {totalUnservedGWh === 0 ? '공급 신뢰도 100%' : '수급 차질 발생'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>최종 국민 지지율</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
              {state.socialAcceptance.toFixed(1)}점
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>민심 및 사회적 수용성</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>잔여 에너지 예산</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#eab308', marginTop: '2px' }}>
              {(state.budget / 10000).toFixed(1)}조 원
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>정부 재정 건전성</div>
          </div>
        </div>

        {/* 통합과학 학습 피드백 요약 */}
        <div
          style={{
            background: 'var(--bg-input, #f1f5f9)',
            padding: '16px',
            borderRadius: '14px',
            textAlign: 'left',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: '6px', color: 'var(--text-color)' }}>
            📚 통합과학 핵심 배움 포인트
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
            <li>
              <b>에너지 트릴레마:</b> 탄소 감축(환경), 전력 안정성(안보), 비용(경제성)은 서로 밀접하게 연결되어 있습니다.
            </li>
            <li>
              <b>재생에너지 간헐성과 ESS:</b> 태양광·풍력 설비가 늘어날수록 잉여 전력을 저장할 ESS와 스마트 유연 전력망이 필수적입니다.
            </li>
            <li>
              <b>설비 수명과 기저 전원:</b> 노후 석탄·원전의 퇴역 시기에 맞춰 대체 설비가 사전에 착공되지 않으면 미래에 급격한 전력 부족이 일어납니다.
            </li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={onRestart}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            🔄 새 임기 시작하기 (재도전)
          </button>
          <button
            onClick={onGoToLab}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--bg-input, #e2e8f0)',
              color: 'var(--text-color, #1e293b)',
              border: '1px solid var(--border-color)',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🔬 시뮬레이션 실험실 분석
          </button>
        </div>
      </div>
    </div>
  );
};
