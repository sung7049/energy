import React, { useState } from 'react';
import type { SimConfig, PolicyId } from '../engine';
import { runScenario, compareScenarios, DEFAULT_CONFIG, POLICY_IDS } from '../engine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const ComparePage: React.FC<{ config: SimConfig }> = ({ config }) => {
  // 시나리오 A: 태양광 10GW (5GW 2번)
  const [policiesA, setPoliciesA] = useState<PolicyId[]>(['solar_5gw', 'solar_5gw']);
  // 시나리오 B: 태양광 10GW + ESS 20GWh (10GWh 2번)
  const [policiesB, setPoliciesB] = useState<PolicyId[]>([
    'solar_5gw',
    'solar_5gw',
    'ess_10gwh',
    'ess_10gwh',
  ]);

  const stateA = runScenario(config, { 2026: policiesA }, 'deterministic');
  const stateB = runScenario(config, { 2026: policiesB }, 'deterministic');
  const diff = compareScenarios(stateA, stateB);

  const chartData = diff.years.map((y: number, idx: number) => ({
    year: `${y}`,
    시나리오A_출력제어TWh: Number(
      (stateA.history[idx].curtailmentTWh.solar + stateA.history[idx].curtailmentTWh.wind).toFixed(2),
    ),
    시나리오B_출력제어TWh: Number(
      (stateB.history[idx].curtailmentTWh.solar + stateB.history[idx].curtailmentTWh.wind).toFixed(2),
    ),
    시나리오A_탄소배출Mt: Number(stateA.history[idx].emissionsMt.toFixed(1)),
    시나리오B_탄소배출Mt: Number(stateB.history[idx].emissionsMt.toFixed(1)),
  }));

  const togglePolicy = (scenario: 'A' | 'B', pid: PolicyId) => {
    if (scenario === 'A') {
      setPoliciesA((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
    } else {
      setPoliciesB((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '4px' }}>
          정책 시나리오 A vs B 비교 실험실
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          동일한 전력 수요와 기상 조건을 적용하여 서로 다른 정책 조합의 장기적 효과를 과학적으로 검증합니다.
        </p>
      </div>

      {/* 정책 선택기 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <PolicyBox
          title="시나리오 A 정책 조합"
          selected={policiesA}
          onToggle={(pid) => togglePolicy('A', pid)}
        />
        <PolicyBox
          title="시나리오 B 정책 조합"
          selected={policiesB}
          onToggle={(pid) => togglePolicy('B', pid)}
        />
      </div>

      {/* 요약 비교표 */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px' }}>지표 (2026~2050 누적)</th>
              <th style={{ padding: '10px 14px', color: 'var(--accent-blue)' }}>시나리오 A</th>
              <th style={{ padding: '10px 14px', color: 'var(--accent-purple)' }}>시나리오 B</th>
              <th style={{ padding: '10px 14px' }}>차이 (B − A)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '10px 14px' }}>총 재생에너지 출력제어량</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalCurtailmentA.toFixed(2)} TWh</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalCurtailmentB.toFixed(2)} TWh</td>
              <td
                style={{
                  padding: '10px 14px',
                  fontWeight: 600,
                  color: diff.summary.totalCurtailmentB <= diff.summary.totalCurtailmentA ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {(diff.summary.totalCurtailmentB - diff.summary.totalCurtailmentA).toFixed(2)} TWh
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '10px 14px' }}>총 전력 미공급량</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalUnservedA.toFixed(1)} GWh</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalUnservedB.toFixed(1)} GWh</td>
              <td
                style={{
                  padding: '10px 14px',
                  fontWeight: 600,
                  color: diff.summary.totalUnservedB <= diff.summary.totalUnservedA ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {(diff.summary.totalUnservedB - diff.summary.totalUnservedA).toFixed(1)} GWh
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '10px 14px' }}>총 온실가스 배출량</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalEmissionsA.toFixed(1)} MtCO₂</td>
              <td style={{ padding: '10px 14px' }}>{diff.summary.totalEmissionsB.toFixed(1)} MtCO₂</td>
              <td
                style={{
                  padding: '10px 14px',
                  fontWeight: 600,
                  color: diff.summary.totalEmissionsB <= diff.summary.totalEmissionsA ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {(diff.summary.totalEmissionsB - diff.summary.totalEmissionsA).toFixed(1)} MtCO₂
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px 14px' }}>2050년 최종 누적비용</td>
              <td style={{ padding: '10px 14px' }}>{(diff.summary.finalCostA / 10000).toFixed(1)} 조원</td>
              <td style={{ padding: '10px 14px' }}>{(diff.summary.finalCostB / 10000).toFixed(1)} 조원</td>
              <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                {((diff.summary.finalCostB - diff.summary.finalCostA) / 10000).toFixed(1)} 조원
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 비교 시각화 그래프 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>연도별 재생에너지 출력제어량 비교</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="year" stroke="#8b949e" fontSize={11} />
                <YAxis stroke="#8b949e" fontSize={11} unit=" TWh" />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="시나리오A_출력제어TWh" stroke="#58a6ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="시나리오B_출력제어TWh" stroke="#bc8cff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>연도별 온실가스 배출량 비교</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="year" stroke="#8b949e" fontSize={11} />
                <YAxis stroke="#8b949e" fontSize={11} unit=" Mt" />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="시나리오A_탄소배출Mt" stroke="#58a6ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="시나리오B_탄소배출Mt" stroke="#bc8cff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const PolicyBox: React.FC<{
  title: string;
  selected: PolicyId[];
  onToggle: (pid: PolicyId) => void;
}> = ({ title, selected, onToggle }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
    }}
  >
    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>{title}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {POLICY_IDS.map((pid) => {
        const isSel = selected.includes(pid);
        const pDef = DEFAULT_CONFIG.policies[pid];
        return (
          <button
            key={pid}
            onClick={() => onToggle(pid as PolicyId)}
            style={{
              padding: '6px 8px',
              fontSize: '0.75rem',
              textAlign: 'left',
              borderRadius: '4px',
              border: `1px solid ${isSel ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              background: isSel ? 'rgba(88, 166, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              color: isSel ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
          >
            {pDef.name}
          </button>
        );
      })}
    </div>
  </div>
);
