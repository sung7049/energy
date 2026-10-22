import React from 'react';
import type { YearResult } from '../../engine';
import { TECH_LABEL } from '../../engine';

interface YearSummaryModalProps {
  result: YearResult;
  prevApproval?: number;
  choiceExplanation: string;
  onNextYear: () => void;
}

export const YearSummaryModal: React.FC<YearSummaryModalProps> = ({
  result,
  prevApproval,
  choiceExplanation,
  onNextYear,
}) => {
  const totalGenTWh = Object.values(result.generationTWh).reduce((a, b) => a + b, 0);
  const approvalDiff =
    prevApproval !== undefined ? Math.round(result.socialAcceptance - prevApproval) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color, #e2e8f0)',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px' }}>
            DAILY ENERGY DISPATCH
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0' }}>
            📰 {result.year}년 연말 결산 특보
          </h2>
        </div>

        {/* 정책 시행 피드백 */}
        <div
          style={{
            background: 'var(--bg-input, #f8fafc)',
            padding: '14px 16px',
            borderRadius: '12px',
            borderLeft: '4px solid var(--primary, #3b82f6)',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--primary, #3b82f6)' }}>
            장관의 정책 결정 및 효과
          </div>
          <div>{choiceExplanation}</div>
        </div>

        {/* 미공급(정전) 경보 또는 무정전 축하 */}
        {result.unservedGWh > 0 ? (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '28px' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>전력 수급 부족(정전) 발생!</div>
              <div style={{ fontSize: '12px' }}>
                연간 {result.unservedGWh.toFixed(1)} GWh의 전력이 부족했습니다. ({result.unservedHours}시간) 국민들의 불만과 산업체 피해가 커집니다.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#f0fdf4',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>365일 무정전 안정 수급 달성</div>
              <div style={{ fontSize: '12px' }}>
                모든 피크 시간대 수요를 결손 없이 100% 정상 공급했습니다.
              </div>
            </div>
          </div>
        )}

        {/* 핵심 통계 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div
            style={{
              background: 'var(--bg-input, #21262d)',
              padding: '10px',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>국민 지지율 변화</div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 800,
                marginTop: '2px',
                color: approvalDiff > 0 ? '#10b981' : approvalDiff < 0 ? '#ef4444' : '#3b82f6',
              }}
            >
              {result.socialAcceptance.toFixed(0)}%{' '}
              <span style={{ fontSize: '13px' }}>
                ({approvalDiff > 0 ? `+${approvalDiff}` : approvalDiff}%p)
              </span>
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-input, #21262d)',
              padding: '10px',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>연간 온실가스</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>
              {result.emissionsMt.toFixed(1)} Mt
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-input, #21262d)',
              padding: '10px',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>총 공급 전력량</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px', color: '#f0f6fc' }}>
              {result.servedTWh.toFixed(1)} TWh
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-input, #21262d)',
              padding: '10px',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>출력제어(잉여 버림)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px', color: '#eab308' }}>
              {(result.curtailmentTWh.solar + result.curtailmentTWh.wind).toFixed(1)} TWh
            </div>
          </div>
        </div>

        {/* 발전원별 비중 미니 바 */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
            {result.year}년 발전량 믹스 비중
          </div>
          <div
            style={{
              height: '16px',
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              background: '#e2e8f0',
            }}
          >
            {(['solar', 'wind', 'nuclear', 'lng', 'coal'] as const).map((tech) => {
              const gen = result.generationTWh[tech] || 0;
              const pct = totalGenTWh > 0 ? (gen / totalGenTWh) * 100 : 0;
              if (pct < 0.5) return null;
              const colorMap = {
                solar: '#f59e0b',
                wind: '#06b6d4',
                nuclear: '#8b5cf6',
                lng: '#3b82f6',
                coal: '#64748b',
              };
              return (
                <div
                  key={tech}
                  title={`${TECH_LABEL[tech]}: ${pct.toFixed(1)}%`}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: colorMap[tech],
                  }}
                />
              );
            })}
          </div>
          {/* 범례 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              marginTop: '6px',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {(['solar', 'wind', 'nuclear', 'lng', 'coal'] as const).map((tech) => {
              const gen = result.generationTWh[tech] || 0;
              const pct = totalGenTWh > 0 ? (gen / totalGenTWh) * 100 : 0;
              return (
                <span key={tech}>
                  {TECH_LABEL[tech]}: {pct.toFixed(1)}%
                </span>
              );
            })}
          </div>
        </div>

        {/* 설비 변동 내역 (신규 완공 / 퇴역) */}
        {(result.completedThisYear.length > 0 || result.retiredThisYear.length > 0) && (
          <div style={{ fontSize: '12px', background: 'var(--bg-input, #f8fafc)', padding: '10px', borderRadius: '8px' }}>
            {result.completedThisYear.map((c, i) => (
              <div key={i} style={{ color: '#047857' }}>
                🏗️ <b>완공:</b> {c.name} 본격 가동 시작
              </div>
            ))}
            {result.retiredThisYear.map((r, i) => (
              <div key={i} style={{ color: '#b91c1c' }}>
                🍂 <b>퇴역:</b> {TECH_LABEL[r.tech]} {r.gw > 0 ? `${r.gw}GW` : `${r.gwh}GWh`} (
                {r.reason === 'lifetime' ? '설계 수명 만료' : '정책적 조기 폐쇄'})
              </div>
            ))}
          </div>
        )}

        {/* 다음 연도 진행 버튼 */}
        <button
          onClick={onNextYear}
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--primary, #3b82f6)',
            color: '#fff',
            border: 'none',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          {result.year < 2050 ? `${result.year + 1}년으로 계속하기 👉` : '2050 최종 성적표 보기 🏆'}
        </button>
      </div>
    </div>
  );
};
