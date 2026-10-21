import React, { useState } from 'react';
import { GamePage } from './game/GamePage';
import { LabPage } from './lab/LabPage';
import { ComparePage } from './lab/ComparePage';
import { QrShareModal } from './game/components/QrShareModal';
import { DEFAULT_CONFIG } from './engine';

export type AppTab = 'game' | 'lab' | 'compare';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('game');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 글로벌 상단 내비게이션 바 */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            에너지 장관 2050
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary, #3b82f6)',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: 600,
            }}
          >
            통합과학 교육용 정책 시뮬레이터
          </span>
        </div>

        {/* 메인 탭 선택 버튼들 및 패드 접속 QR */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('game')}
              style={{
                padding: '8px 16px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeTab === 'game' ? 'var(--primary, #3b82f6)' : 'transparent',
                color: activeTab === 'game' ? '#fff' : 'var(--text-secondary, #64748b)',
                border: '1px solid ' + (activeTab === 'game' ? 'var(--primary, #3b82f6)' : 'var(--border-color)'),
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🎮</span> 2050 카드 게임
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              style={{
                padding: '8px 16px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeTab === 'lab' ? 'var(--primary, #3b82f6)' : 'transparent',
                color: activeTab === 'lab' ? '#fff' : 'var(--text-secondary, #64748b)',
                border: '1px solid ' + (activeTab === 'lab' ? 'var(--primary, #3b82f6)' : 'var(--border-color)'),
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🔬</span> 시뮬레이션 실험실
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              style={{
                padding: '8px 16px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeTab === 'compare' ? 'var(--primary, #3b82f6)' : 'transparent',
                color: activeTab === 'compare' ? '#fff' : 'var(--text-secondary, #64748b)',
                border: '1px solid ' + (activeTab === 'compare' ? 'var(--primary, #3b82f6)' : 'var(--border-color)'),
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>⚖️</span> 시나리오 A/B 비교
            </button>
          </nav>

          {/* 패드 접속용 QR 버튼 */}
          <button
            onClick={() => setShowQrModal(true)}
            title="학생들이 태블릿 카메라로 QR 코드를 찍어 바로 접속할 수 있습니다"
            style={{
              padding: '8px 12px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📱</span> 패드 접속 QR
          </button>
        </div>
      </header>

      {/* QR 모달 */}
      {showQrModal && <QrShareModal onClose={() => setShowQrModal(false)} />}

      {/* 탭 본문 영역 */}
      <main style={{ flex: 1 }}>
        {activeTab === 'game' && <GamePage onGoToLab={() => setActiveTab('lab')} />}
        {activeTab === 'lab' && <LabPage />}
        {activeTab === 'compare' && <ComparePage config={DEFAULT_CONFIG} />}
      </main>
    </div>
  );
};
