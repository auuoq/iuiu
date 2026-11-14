import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client.js';
import {
  X,
  Play,
  RotateCcw,
  RotateCw,
  Smartphone,
  Sparkles,
  Heart,
  Maximize2,
  Minimize2,
  AlertCircle,
  Trophy,
  CheckCircle2
} from 'lucide-react';

export function HeartMinerModal({ isOpen, onClose, currentUserId, walletBalance, onWalletUpdated }) {
  const [gameState, setGameState] = useState('READY'); // 'READY' | 'PLAYING' | 'GAME_OVER'
  const [sessionId, setSessionId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelsCompleted, setLevelsCompleted] = useState(0);
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [settled, setSettled] = useState(false);

  // Mobile & Orientation state
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && (window.innerWidth <= 768 || ('ontouchstart' in window));
  });
  const [isLandscape, setIsLandscape] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
  });
  const [isVirtualRotated, setIsVirtualRotated] = useState(false);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Send precise bounding dimensions to iframe's mobile-layer
  const sendIframeDimensions = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      let w = 0;
      let h = 0;
      if (isVirtualRotated) {
        w = Math.round(window.innerHeight);
        h = Math.round(window.innerWidth - 38);
      } else {
        const rect = iframeRef.current.getBoundingClientRect();
        w = Math.round(rect.width);
        h = Math.round(rect.height);
      }
      if (w > 0 && h > 0) {
        iframeRef.current.contentWindow.postMessage({
          type: 'dvcd-kich-thuoc',
          w,
          h
        }, '*');
      }
    } catch (e) {}
  }, [isVirtualRotated]);

  // Resize & orientation change listener
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w <= 768 || ('ontouchstart' in window);
      const landscape = w > h;
      setIsMobile(mobile);
      setIsLandscape(landscape);
      // Auto-exit virtual rotation if device is rotated to real landscape
      if (landscape) {
        setIsVirtualRotated(false);
      }
      setTimeout(sendIframeDimensions, 100);
      setTimeout(sendIframeDimensions, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [sendIframeDimensions]);

  // Keep dimensions synced when view mode changes
  useEffect(() => {
    sendIframeDimensions();
    const t = setTimeout(sendIframeDimensions, 250);
    return () => clearTimeout(t);
  }, [isLandscape, isVirtualRotated, isFullscreen, sendIframeDimensions]);

  // Toggle rotate / orientation (Virtual CSS rotation for mobile with portrait lock)
  const handleToggleRotate = () => {
    setIsVirtualRotated(prev => !prev);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Start new game session (deducts 1 heart)
  const handleStartGame = async () => {
    if (walletBalance < 1) {
      setErrorMsg('Bạn không đủ tim (cần tối thiểu 1 ❤️) để bắt đầu đào vàng! Hãy hoàn thành nhiệm vụ hoặc mở thư để nhận thêm tim nhé.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.startMinigame();
      setSessionId(res.sessionId);
      if (res.newBalance !== undefined) {
        onWalletUpdated?.(res.newBalance);
      }

      // Reset state for new run
      setCurrentLevel(1);
      setLevelsCompleted(0);
      setShowLevelUpBanner(null);
      setSettled(false);
      setIframeKey(Date.now());
      setGameState('PLAYING');
    } catch (err) {
      setErrorMsg(err.message || 'Không đủ tim để bắt đầu chơi.');
    } finally {
      setLoading(false);
    }
  };

  // Settle heart earnings with backend
  const settleEarnings = useCallback(async (completedCount) => {
    if (settled) return;
    setSettled(true);

    try {
      const res = await api.completeMinigame(sessionId, completedCount);
      if (res && res.newBalance !== undefined) {
        onWalletUpdated?.(res.newBalance);
      }
    } catch (e) {
      console.warn('Failed to settle earnings:', e);
    }
  }, [sessionId, settled, onWalletUpdated]);

  // Handle Game Over from daovang iframe
  const handleGameOver = useCallback((failedLevel, finalScore) => {
    setGameState('GAME_OVER');
    settleEarnings(levelsCompleted);
  }, [levelsCompleted, settleEarnings]);

  // Listen for messages from authentic Gold Miner engine iframe
  useEffect(() => {
    if (!isOpen || gameState !== 'PLAYING') return;

    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, level, score } = event.data;

      if (type === 'LOVECAPSULE_MINER_LEVEL_PASSED') {
        const passedLvl = level || currentLevel;
        setLevelsCompleted(prev => {
          const next = prev + 1;
          setShowLevelUpBanner({ level: passedLvl, earned: next });
          setTimeout(() => setShowLevelUpBanner(null), 3600);
          return next;
        });
        setCurrentLevel(passedLvl + 1);
      } else if (type === 'LOVECAPSULE_MINER_GAME_OVER') {
        handleGameOver(level, score);
      } else if (type === 'LOVECAPSULE_MINER_STATE_CHANGE') {
        if (event.data.level && event.data.level > 0) {
          setCurrentLevel(event.data.level);
        }
      } else if (type === 'dvcd-xin-kich-thuoc') {
        sendIframeDimensions();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, gameState, currentLevel, handleGameOver, sendIframeDimensions]);

  // Close and cleanup safely
  const handleClose = () => {
    if (gameState === 'PLAYING') {
      const msg = levelsCompleted > 0
        ? `Bạn có chắc muốn thoát? Số tim thưởng tích lũy (+${levelsCompleted} ❤️) sẽ được bảo lưu và cộng vào ví của bạn!`
        : 'Bạn có chắc muốn thoát khỏi lượt đào hiện tại?';

      if (window.confirm(msg)) {
        if (levelsCompleted > 0 && !settled) {
          settleEarnings(levelsCompleted);
        }
        onClose();
      }
    } else {
      if (levelsCompleted > 0 && !settled) {
        settleEarnings(levelsCompleted);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEdgeToEdge = isFullscreen || isMobile || isVirtualRotated || isLandscape;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 10, 6, 0.92)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isEdgeToEdge ? '0px' : '12px',
      overflow: 'hidden'
    }}>
      <div
        ref={containerRef}
        style={isVirtualRotated ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '100dvh',
          height: '100vw',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          transformOrigin: 'center center',
          zIndex: 10000,
          maxWidth: 'none',
          maxHeight: 'none',
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#fab81b'
        } : isEdgeToEdge ? {
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          maxWidth: '100vw',
          borderRadius: 0,
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#fab81b'
        } : {
          background: '#fab81b',
          border: '4px solid #854d0e',
          borderRadius: '22px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          width: '100%',
          maxWidth: '980px',
          height: 'auto',
          maxHeight: '94vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* TOP ARCADE CABINET BAR */}
        <div style={{
          background: 'linear-gradient(180deg, #92400e 0%, #78350f 100%)',
          borderBottom: '2px solid #b45309',
          padding: (isLandscape || isVirtualRotated) ? '4px 12px' : '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 10,
          flexShrink: 0
        }}>
          {/* Left Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>⛏️</span>
            <div style={{ fontWeight: '900', fontSize: (isLandscape || isVirtualRotated) ? '13px' : '14.5px', color: '#fef08a', letterSpacing: '0.4px', lineHeight: 1.2 }}>
              ĐÀO TIM CỔ ĐIỂN
            </div>
          </div>

          {/* Center Stats (When in Game) */}
          {gameState === 'PLAYING' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '3px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(254, 240, 138, 0.3)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#fef08a' }}>
                Màn: <span style={{ color: '#fff', fontSize: '13.5px' }}>{currentLevel}</span>
              </div>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Heart size={12} fill="#f43f5e" />
                <span>+{levelsCompleted} ❤️</span>
              </div>
            </div>
          )}

          {/* Right Controls & Wallet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#b91c1c',
              padding: '3px 9px',
              borderRadius: '14px',
              fontSize: '12px',
              fontWeight: '800',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
            }}>
              <Heart size={12} fill="#fff" />
              <span>{walletBalance}</span>
            </div>

            {/* ROTATE TOGGLE BUTTON */}
            <button
              type="button"
              onClick={handleToggleRotate}
              style={{
                background: isVirtualRotated ? '#15803d' : 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#fff',
                padding: '4px 9px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: '700'
              }}
              title={isVirtualRotated ? 'Trở về màn hình dọc' : 'Xoay ngang màn hình để chơi'}
            >
              <RotateCw size={13} />
              <span>{isVirtualRotated ? 'Dọc' : 'Xoay ngang'}</span>
            </button>

            {!isMobile && (
              <button
                type="button"
                onClick={toggleFullscreen}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              style={{
                background: '#dc2626',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="Đóng / Thoát"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* FLOATING LEVEL UP BANNER */}
        {showLevelUpBanner && (
          <div style={{
            position: 'absolute',
            top: '52px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            border: '2px solid #86efac',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            borderRadius: '24px',
            padding: '8px 22px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            animation: 'fadeIn 0.3s ease-out',
            whiteSpace: 'nowrap'
          }}>
            <Trophy size={18} color="#fde047" />
            <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.3px' }}>
              VƯỢT QUA MÀN {showLevelUpBanner.level}! (+{showLevelUpBanner.earned} ❤️)
            </div>
          </div>
        )}

        {/* 1. READY SCREEN */}
        {gameState === 'READY' && (
          <div style={{
            background: '#fffbf5',
            padding: (isMobile || isLandscape || isVirtualRotated) ? '18px 16px' : '36px 24px',
            textAlign: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: (isLandscape || isVirtualRotated) ? '34px' : '48px', marginBottom: '4px' }}>⛏️</div>
            <h2 style={{ fontSize: (isLandscape || isVirtualRotated) ? '19px' : '23px', fontWeight: '900', color: '#854d0e', letterSpacing: '0.4px', margin: '4px 0' }}>
              ĐÀO TIM CỔ ĐIỂN
            </h2>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '14px',
              padding: '12px 18px',
              maxWidth: '360px',
              width: '100%',
              margin: '12px auto',
              textAlign: 'left',
              color: '#92400e',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '800', marginBottom: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={14} color="#d97706" />
                <span>Cơ chế thưởng:</span>
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.5 }}>
                <li>Phí chơi: <b>1 ❤️</b></li>
                <li>Vượt mỗi màn: <b>+1 ❤️</b></li>
              </ul>
            </div>

            {/* Mobile Orientation Advice Card */}
            {isMobile && !isLandscape && !isVirtualRotated && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '10px 14px',
                maxWidth: '360px',
                width: '100%',
                margin: '0 auto 14px',
                fontSize: '12px',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <Smartphone size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>📱 <b>Mẹo chơi:</b> Xoay ngang máy (hoặc nhấn nút <b>"Xoay ngang"</b> ở góc phải trên) để chơi toàn màn hình siêu nét nhé!</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                color: '#dc2626',
                background: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '700',
                maxWidth: '360px',
                margin: '0 auto 12px'
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStartGame}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  border: '2px solid #b45309',
                  borderRadius: '12px',
                  padding: '11px 28px',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={16} fill="#fff" />
                <span>{loading ? 'Đang mở...' : 'Bắt đầu chơi (-1 ❤️)'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* 2. PLAYING VIEW (Authentic 100% Gold Miner Phaser Engine via iframe) */}
        {gameState === 'PLAYING' && (
          <div style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 0,
            height: isEdgeToEdge ? 'calc(100% - 38px)' : '580px',
            background: '#0d0805'
          }}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src="/daovang/index.html"
              title="Đào Vàng Cổ Điển"
              onLoad={() => {
                setTimeout(sendIframeDimensions, 100);
                setTimeout(sendIframeDimensions, 400);
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                background: '#0d0805'
              }}
              allow="autoplay; fullscreen"
            />
          </div>
        )}

        {/* 3. GAME OVER SCREEN */}
        {gameState === 'GAME_OVER' && (
          <div style={{
            background: '#fffbf5',
            padding: (isMobile || isLandscape || isVirtualRotated) ? '18px 16px' : '36px 24px',
            textAlign: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '4px' }}>🏁</div>
            <h2 style={{ fontSize: (isLandscape || isVirtualRotated) ? '19px' : '22px', fontWeight: '900', color: '#854d0e', margin: '4px 0' }}>
              KẾT THÚC LƯỢT ĐÀO!
            </h2>
            <p style={{ color: '#78716c', fontSize: '13px', marginTop: '2px' }}>
              Bạn đã dừng chân tại Màn {currentLevel}.
            </p>

            <div style={{
              background: '#fef3c7',
              border: '2px dashed #f59e0b',
              borderRadius: '16px',
              padding: '14px 20px',
              maxWidth: '360px',
              width: '100%',
              margin: '12px auto',
              color: '#92400e'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#78350f' }}>
                Số Màn Đã Vượt Qua: <b style={{ color: '#b45309' }}>{levelsCompleted} màn</b>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#b91c1c', margin: '4px 0' }}>
                +{levelsCompleted} ❤️
              </div>
              <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '700' }}>
                ✓ Đã cộng trực tiếp vào Số Dư Ví Tim của bạn!
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStartGame}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={15} />
                <span>Chơi Lại (-1 ❤️)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
