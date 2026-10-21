import React, { useState, useEffect } from 'react';

interface QrShareModalProps {
  onClose: () => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({ onClose }) => {
  const [connectUrl, setConnectUrl] = useState('');

  useEffect(() => {
    // 기본적으로 현재 브라우저의 접속 URL (localhost면 네트워크 IP 입력 권장)
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      // 안내용 기본 IP 권장
      setConnectUrl(`http://${window.location.hostname}:5173`);
    } else {
      setConnectUrl(currentOrigin);
    }
  }, []);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    connectUrl,
  )}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
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
          maxWidth: '440px',
          padding: '28px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color, #e2e8f0)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>📱 학생 패드 접속 QR</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          학생들이 <b>아이패드/갤럭시 탭의 기본 카메라</b>로 아래 QR 코드를 비추면 즉시 게임에 접속할 수 있습니다.
        </p>

        {/* QR 코드 이미지 */}
        <div
          style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '2px solid #e2e8f0',
          }}
        >
          <img
            src={qrImageUrl}
            alt="학생 접속용 QR 코드"
            style={{ width: '220px', height: '220px', display: 'block' }}
          />
        </div>

        {/* 접속 주소 표시 및 직접 수정 */}
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            접속 URL 링크
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={connectUrl}
              onChange={(e) => setConnectUrl(e.target.value)}
              placeholder="http://192.168.0.x:5173"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                textAlign: 'center',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>

        {/* 팁 박스 */}
        <div
          style={{
            background: 'var(--bg-input, #f8fafc)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '12px',
            textAlign: 'left',
            lineHeight: 1.5,
            width: '100%',
          }}
        >
          💡 <b>선생님 팁:</b> 교실 내 같은 Wi-Fi에 연결되어 있어야 합니다. 교사 컴퓨터의 터미널에 표시된 <b>Network IP</b>(예: <code>http://10.160.29.131:5173</code>)를 위에 입력하시면 QR 코드가 자동 갱신됩니다.
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: 'var(--primary, #3b82f6)',
            color: '#fff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          확인 완료
        </button>
      </div>
    </div>
  );
};
