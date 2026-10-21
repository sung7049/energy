import React, { useState } from 'react';
import type { Season, SimConfig, SimMode } from '../engine';
import { DEFAULT_CONFIG, runScenario } from '../engine';
import { ConfigPanel } from './ConfigPanel';
import {
  DispatchChart,
  PotentialAndCurtailChart,
  EssSocChart,
  GenerationShareChart,
  MultiYearTrendChart,
} from './charts/SimulationCharts';
import { AnalysisPanel } from './AnalysisPanel';
import { ComparePage } from './ComparePage';

export const LabPage: React.FC = () => {
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');
  const [mode, setMode] = useState<SimMode>('deterministic');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedSeason, setSelectedSeason] = useState<Season>('spring');

  // 단일 시나리오 시뮬레이션 실행 (결정론적 / 확률적)
  const simulationState = React.useMemo(() => {
    return runScenario(config, {}, mode, 42);
  }, [config, mode]);

  const yearResult =
    simulationState.history.find((h) => h.year === selectedYear) ||
    simulationState.history[0];

  const handleUpdateCap = (tech: string, val: number) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      (next.initial as any)[tech] = val;
      return next;
    });
  };

  const handleUpdateDemandGrowth = (val: number) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      next.initial.demandGrowthRate = val;
      return next;
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 네비게이션 헤더 */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            에너지 장관 2050 <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--accent-blue)' }}>시뮬레이션 실험실</span>
          </h1>
          <span
            style={{
              fontSize: '0.75rem',
              background: 'rgba(210, 153, 34, 0.15)',
              color: 'var(--accent-yellow)',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(210, 153, 34, 0.4)',
            }}
          >
            {config.countryName}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('single')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              background: activeTab === 'single' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'single' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            단일 국가 시뮬레이션
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              background: activeTab === 'compare' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'compare' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            정책 시나리오 A/B 비교
          </button>
        </div>
      </header>

      {/* 알림 배너: 교육용 가상 모델 주의사항 */}
      <div
        style={{
          background: 'rgba(88, 166, 255, 0.08)',
          borderBottom: '1px solid rgba(88, 166, 255, 0.2)',
          padding: '6px 24px',
          fontSize: '0.75rem',
          color: 'var(--accent-blue)',
        }}
      >
        ⚠️ {config.disclaimer}
      </div>

      {/* 메인 작업 영역 */}
      {activeTab === 'single' ? (
        <main
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '280px 1fr 340px',
            gap: '16px',
            padding: '16px 24px',
            height: 'calc(100vh - 80px)',
            overflow: 'hidden',
          }}
        >
          {/* 왼쪽: 국가 설정 패널 */}
          <aside
            style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              padding: '16px',
              overflowY: 'auto',
            }}
          >
            <ConfigPanel
              config={config}
              selectedYear={selectedYear}
              selectedSeason={selectedSeason}
              mode={mode}
              onUpdateInitialCap={handleUpdateCap}
              onUpdateDemandGrowth={handleUpdateDemandGrowth}
              onSelectYear={setSelectedYear}
              onSelectSeason={setSelectedSeason}
              onToggleMode={setMode}
              onReset={handleReset}
            />
          </aside>

          {/* 중앙: 7개 핵심 시뮬레이션 그래프 */}
          <section
            style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingRight: '4px',
            }}
          >
            {/* 1. 시간대별 전력 수급 및 공급원 */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  1. 시간대별 전력 수요 및 발전원별 실제 공급량 ({selectedYear}년 {selectedSeason})
                </h3>
              </div>
              <DispatchChart yearResult={yearResult} history={simulationState.history} season={selectedSeason} />
            </div>

            {/* 2 & 3. 재생에너지 잠재/출력제어 + ESS SOC 변화 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  2. 태양광·풍력 잠재량 vs 출력제어
                </h3>
                <PotentialAndCurtailChart
                  yearResult={yearResult}
                  history={simulationState.history}
                  season={selectedSeason}
                />
              </div>

              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  3. ESS 충·방전 및 충전 상태(SOC) 변화
                </h3>
                <EssSocChart yearResult={yearResult} history={simulationState.history} season={selectedSeason} />
              </div>
            </div>

            {/* 4 & 5. 연도별 발전 비중 & 탄소/미공급/비용 추이 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  4. 발전원별 연간 발전 비중 (2026~2050)
                </h3>
                <GenerationShareChart
                  yearResult={yearResult}
                  history={simulationState.history}
                  season={selectedSeason}
                />
              </div>

              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  padding: '14px',
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  5. 연도별 탄소배출 / 미공급량 / 누적비용
                </h3>
                <MultiYearTrendChart
                  yearResult={yearResult}
                  history={simulationState.history}
                  season={selectedSeason}
                />
              </div>
            </div>
          </section>

          {/* 오른쪽: 공학 분석 결과 패널 */}
          <aside
            style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              padding: '16px',
              overflowY: 'auto',
            }}
          >
            <AnalysisPanel yearResult={yearResult} />
          </aside>
        </main>
      ) : (
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          <ComparePage config={config} />
        </main>
      )}
    </div>
  );
};
