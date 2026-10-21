import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GameCard, CardChoice } from '../types';

interface CardSwiperProps {
  card: GameCard;
  year: number;
  onChoose: (choice: CardChoice, direction: 'left' | 'right') => void;
  onHoverChoice: (choice: CardChoice | null) => void;
}

export const CardSwiper: React.FC<CardSwiperProps> = ({
  card,
  year,
  onChoose,
  onHoverChoice,
}) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const threshold = 100; // 스와이프 결정 임계 거리(px)

  const activeDirection: 'left' | 'right' | null =
    dragOffset.x < -30 ? 'left' : dragOffset.x > 30 ? 'right' : null;

  const activeChoice: CardChoice | null =
    activeDirection === 'left'
      ? card.leftChoice
      : activeDirection === 'right'
      ? card.rightChoice
      : null;

  // 드래그 시 상위 컴포넌트에 호버 상태 알림
  useEffect(() => {
    onHoverChoice(activeChoice);
  }, [activeChoice, onHoverChoice]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragOffset.x < -threshold) {
      onChoose(card.leftChoice, 'left');
    } else if (dragOffset.x > threshold) {
      onChoose(card.rightChoice, 'right');
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const rotationDeg = Math.max(-20, Math.min(20, dragOffset.x * 0.1));

  const handleSelectLeft = useCallback(() => {
    onHoverChoice(null);
    onChoose(card.leftChoice, 'left');
  }, [card.leftChoice, onChoose, onHoverChoice]);

  const handleSelectRight = useCallback(() => {
    onHoverChoice(null);
    onChoose(card.rightChoice, 'right');
  }, [card.rightChoice, onChoose, onHoverChoice]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* 연도 및 부서 배지 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            background: 'var(--primary, #3b82f6)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          📅 {year}년 정책 딜레마
        </span>
        <span
          style={{
            background: 'var(--bg-input, #e2e8f0)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {card.department}
        </span>
      </div>

      {/* 선택지 힌트 텍스트 (드래그 시 카드 상단에 노출) */}
      <div
        style={{
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color:
            activeDirection === 'left'
              ? '#ef4444'
              : activeDirection === 'right'
              ? '#10b981'
              : 'var(--text-muted)',
          marginBottom: '8px',
          padding: '4px 16px',
          transition: 'color 0.2s ease',
        }}
      >
        {activeChoice ? (
          <div>
            <div>{activeChoice.text}</div>
            <div style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
              {activeChoice.subtext}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '13px', fontWeight: 'normal', opacity: 0.8 }}>
            ↔️ 카드를 좌우로 밀거나 아래 버튼을 눌러 결정하세요
          </span>
        )}
      </div>

      {/* 카드 본체 (드래그 & 스와이프 인터랙션) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%',
          minHeight: '380px',
          background: 'var(--bg-card, #ffffff)',
          border: '2px solid var(--border-color, #30363d)',
          borderRadius: '24px',
          boxShadow: isDragging
            ? '0 20px 40px rgba(0, 0, 0, 0.2)'
            : '0 8px 24px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 24px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.3}px, 0) rotate(${rotationDeg}deg)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 스와이프 오버레이 스탬프 (REJECT / APPROVE) */}
        {activeDirection && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              [activeDirection === 'left' ? 'right' : 'left']: '20px',
              border: `4px solid ${activeDirection === 'left' ? '#ef4444' : '#10b981'}`,
              color: activeDirection === 'left' ? '#ef4444' : '#10b981',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '1px',
              transform: `rotate(${activeDirection === 'left' ? '12deg' : '-12deg'})`,
              opacity: Math.min(1, Math.abs(dragOffset.x) / threshold),
              pointerEvents: 'none',
            }}
          >
            {activeDirection === 'left' ? '선택 A' : '선택 B'}
          </div>
        )}

        {/* 발의자 아바타 */}
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: '#21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
            marginBottom: '16px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
            border: '2px solid var(--border-color, #30363d)',
          }}
        >
          {card.avatar}
        </div>

        {/* 카드 제목 */}
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 800,
            textAlign: 'center',
            margin: '0 0 16px 0',
            lineHeight: 1.3,
            color: '#ffffff',
          }}
        >
          {card.title}
        </h3>

        {/* 안건 설명문 */}
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#e2e8f0',
            textAlign: 'center',
            flex: 1,
            margin: '0 0 16px 0',
          }}
        >
          {card.description}
        </p>

        {/* 카드 하단 팁 */}
        <div
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            borderTop: '1px dashed var(--border-color, #30363d)',
            paddingTop: '12px',
            width: '100%',
          }}
        >
          💡 물리 엔진 기반 실시간 계산이 연동됩니다
        </div>
      </div>

      {/* 데스크톱/모바일 겸용 명시적 버튼 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          width: '100%',
          marginTop: '16px',
        }}
      >
        <button
          onClick={handleSelectLeft}
          onMouseEnter={() => onHoverChoice(card.leftChoice)}
          onMouseLeave={() => onHoverChoice(null)}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.15)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '15px' }}>👈 {card.leftChoice.text}</span>
          <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.85 }}>
            {card.leftChoice.subtext || '선택 A'}
          </span>
        </button>

        <button
          onClick={handleSelectRight}
          onMouseEnter={() => onHoverChoice(card.rightChoice)}
          onMouseLeave={() => onHoverChoice(null)}
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid #10b981',
            background: 'rgba(16, 185, 129, 0.08)',
            color: '#6ee7b7',
            background: 'rgba(16, 185, 129, 0.15)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '15px' }}>{card.rightChoice.text} 👉</span>
          <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.85 }}>
            {card.rightChoice.subtext || '선택 B'}
          </span>
        </button>
      </div>
    </div>
  );
};
