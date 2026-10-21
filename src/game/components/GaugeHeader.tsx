import React from 'react';
import type { CardChoice } from '../types';

interface GaugeHeaderProps {
  budgetEok: number; // 억원
  approval: number; // 0 ~ 100
  unservedGWh: number; // 최근 미공급 전력
  emissionsMt: number; // 최근 배출량
  startEmissionsMt?: number;
  activeChoice?: CardChoice | null;
}

export const GaugeHeader: React.FC<GaugeHeaderProps> = ({
  budgetEok,
  approval,
  unservedGWh,
  emissionsMt,
  startEmissionsMt = 145, // 2026년 기준 약 145Mt
  activeChoice,
}) => {
  // 1. 예산 게이지 (0 ~ 100조 원 기준, 100조 = 1,000,000 억원)
  const budgetRatio = Math.max(0, Math.min(100, (budgetEok / 500000) * 100));
  const budgetTrillionWon = (budgetEok / 10000).toFixed(1);

  // 2. 지지율 게이지 (0 ~ 100)
  const approvalRatio = Math.max(0, Math.min(100, approval));

  // 3. 전력 수급 안정성 게이지 (미공급이 0이면 100%, 미공급 500GWh 이상이면 0%)
  const gridReliability = Math.max(0, Math.min(100, 100 - (unservedGWh / 5)));

  // 4. 환경 (2026년 배출량 대비 감축률, 배출이 0이면 100%)
  const cleanRatio = Math.max(0, Math.min(100, ((startEmissionsMt - emissionsMt) / startEmissionsMt) * 100));

  const gauges = [
    {
      id: 'budget' as const,
      name: '국가 예산',
      icon: '💰',
      value: `${budgetTrillionWon}조`,
      percent: budgetRatio,
      color: budgetRatio < 20 ? '#ef4444' : '#eab308',
      delta: activeChoice?.indicators.budget ?? 0,
    },
    {
      id: 'approval' as const,
      name: '국민 지지율',
      icon: '👥',
      value: `${approval.toFixed(0)}%`,
      percent: approvalRatio,
      color: approvalRatio < 20 ? '#ef4444' : '#3b82f6',
      delta: activeChoice?.indicators.approval ?? 0,
    },
    {
      id: 'grid' as const,
      name: '전력 안정도',
      icon: '⚡',
      value: unservedGWh > 0 ? `결손 ${unservedGWh.toFixed(0)}GWh` : '100% 정상',
      percent: gridReliability,
      color: gridReliability < 70 ? '#ef4444' : '#10b981',
      delta: activeChoice?.indicators.grid ?? 0,
    },
    {
      id: 'environment' as const,
      name: '탄소 감축',
      icon: '🌿',
      value: `${emissionsMt.toFixed(1)} Mt`,
      percent: cleanRatio,
      color: '#10b981',
      delta: activeChoice?.indicators.environment ?? 0,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-color)',
        marginBottom: '20px',
      }}
    >
      {gauges.map((g) => {
        const hasIndicator = g.delta !== 0;
        return (
          <div
            key={g.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Reigns 특유의 점/화살표 인디케이터 (선택 시 깜빡이는 효과) */}
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor:
                  g.delta > 0 ? '#10b981' : g.delta < 0 ? '#ef4444' : 'transparent',
                boxShadow: hasIndicator ? '0 0 8px ' + (g.delta > 0 ? '#10b981' : '#ef4444') : 'none',
                opacity: hasIndicator ? 1 : 0,
                transform: hasIndicator ? 'scale(1.2)' : 'scale(0.8)',
                transition: 'all 0.2s ease',
              }}
            />

            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{g.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
              {g.name}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0 6px 0', color: '#f0f6fc' }}>
              {g.value}
            </div>

            {/* 게이지 바 */}
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${g.percent}%`,
                  height: '100%',
                  background: g.color,
                  transition: 'width 0.4s ease, background 0.3s ease',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
