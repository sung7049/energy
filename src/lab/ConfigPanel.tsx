import React from 'react';
import type { SimConfig, Season } from '../engine';
import { SEASON_LABEL, SEASONS } from '../engine';

interface ConfigPanelProps {
  config: SimConfig;
  selectedYear: number;
  selectedSeason: Season;
  mode: 'deterministic' | 'stochastic';
  onUpdateInitialCap: (tech: string, val: number) => void;
  onUpdateDemandGrowth: (val: number) => void;
  onSelectYear: (year: number) => void;
  onSelectSeason: (season: Season) => void;
  onToggleMode: (mode: 'deterministic' | 'stochastic') => void;
  onReset: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  selectedYear,
  selectedSeason,
  mode,
  onUpdateInitialCap,
  onUpdateDemandGrowth,
  onSelectYear,
  onSelectSeason,
  onToggleMode,
  onReset,
}) => {
  const init = config.initial;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>국가 설정 패널</h2>
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            fontSize: '0.8rem',
          }}
        >
          초기화
        </button>
      </div>

      {/* 모드 선택 */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
          시뮬레이션 모드
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onToggleMode('deterministic')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.8rem',
              background: mode === 'deterministic' ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: mode === 'deterministic' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            결정론 (기준)
          </button>
          <button
            onClick={() => onToggleMode('stochastic')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.8rem',
              background: mode === 'stochastic' ? 'var(--accent-purple)' : 'var(--bg-card)',
              color: mode === 'stochastic' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            확률 (기상/고장)
          </button>
        </div>
      </div>

      {/* 탐색 컨트롤: 연도 & 계절 */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>조회 연도</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
              {selectedYear}년
            </span>
          </div>
          <input
            type="range"
            min={config.startYear}
            max={config.endYear}
            value={selectedYear}
            onChange={(e) => onSelectYear(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            대표일 계절
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => onSelectSeason(s)}
                style={{
                  padding: '4px',
                  fontSize: '0.75rem',
                  background: selectedSeason === s ? 'var(--accent-blue)' : 'var(--bg-card)',
                  color: selectedSeason === s ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {SEASON_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 슬라이더 목록: 발전 설비용량 조절 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
          초기 발전 설비 (2026년 기준)
        </h3>

        {[
          { key: 'solarGW', label: '태양광 설비용량', val: init.solarGW, max: 120, unit: 'GW', color: '#ffb300' },
          { key: 'windGW', label: '풍력 설비용량', val: init.windGW, max: 50, unit: 'GW', color: '#29b6f6' },
          { key: 'nuclearGW', label: '원자력 설비용량', val: init.nuclearGW, max: 60, unit: 'GW', color: '#ab47bc' },
          { key: 'coalGW', label: '석탄 발전 설비용량', val: init.coalGW, max: 60, unit: 'GW', color: '#8d6e63' },
          { key: 'lngGW', label: 'LNG 발전 설비용량', val: init.lngGW, max: 80, unit: 'GW', color: '#26a69a' },
          { key: 'essGWh', label: 'ESS 저장 용량', val: init.essGWh, max: 150, unit: 'GWh', color: '#66bb6a' },
          { key: 'essGW', label: 'ESS 충·방전 출력', val: init.essGW, max: 40, unit: 'GW', color: '#43a047' },
        ].map(({ key, label, val, max, unit, color }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ fontWeight: 600, color }}>
                {val} {unit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={max}
              value={val}
              onChange={(e) => onUpdateInitialCap(key, Number(e.target.value))}
              style={{ width: '100%', accentColor: color }}
            />
          </div>
        ))}

        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
            <span>연간 수요 증가율</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>
              {(init.demandGrowthRate * 100).toFixed(1)} %/년
            </span>
          </div>
          <input
            type="range"
            min={-1}
            max={4}
            step={0.1}
            value={init.demandGrowthRate * 100}
            onChange={(e) => onUpdateDemandGrowth(Number(e.target.value) / 100)}
            style={{ width: '100%', accentColor: 'var(--accent-yellow)' }}
          />
        </div>
      </div>
    </div>
  );
};
