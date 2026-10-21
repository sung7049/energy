import React from 'react';
import type { YearResult } from '../engine';
import { generateAnalysis } from '../engine';

interface AnalysisPanelProps {
  yearResult: YearResult;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ yearResult }) => {
  const analysis = generateAnalysis(yearResult);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>공학 및 정책 분석 결과</h2>

      {/* 상태 요약 배지 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--bg-main)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>탄소 배출량</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-red)' }}>
            {yearResult.emissionsMt.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>MtCO₂</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-main)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>미공급 전력량</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: yearResult.unservedGWh > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {yearResult.unservedGWh.toFixed(1)} <span style={{ fontSize: '0.8rem' }}>GWh</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-main)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>재생E 출력제어</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-yellow)' }}>
            {(yearResult.curtailmentTWh.solar + yearResult.curtailmentTWh.wind).toFixed(2)} <span style={{ fontSize: '0.8rem' }}>TWh</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-main)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>평균 발전비용</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
            {yearResult.avgCostWonPerKWh.toFixed(0)} <span style={{ fontSize: '0.8rem' }}>원/kWh</span>
          </div>
        </div>
      </div>

      {/* 분석 세부 항목 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
        <Section title="1. 전력 수급 안정성 및 부족 시간대" items={analysis.scarcityAnalysis} />
        <Section title="2. 출력제어(Curtailment) 발생 원인" items={analysis.curtailmentAnalysis} />
        <Section title="3. ESS(저장장치)의 실제 기여도" items={analysis.essContribution} />
        <Section title="4. 온실가스 배출 변화 원인" items={analysis.emissionTrend} />
        <Section title="5. 가동 설비 및 진행 중인 건설 사업" items={analysis.capacityEffects} />
        <Section title="6. 시뮬레이션 모델의 한계 및 주의점" items={analysis.limitations} isMuted />
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; items: string[]; isMuted?: boolean }> = ({ title, items, isMuted }) => (
  <div
    style={{
      background: isMuted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: '6px', color: isMuted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
      {title}
    </div>
    <ul style={{ paddingLeft: '16px', color: isMuted ? 'var(--text-muted)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  </div>
);
