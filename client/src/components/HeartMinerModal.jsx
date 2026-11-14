import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client.js';
import { HeartMinerCanvas } from './HeartMinerCanvas.jsx';
import {
  playLevelPass,
  playGameOver
} from '../utils/minerAudio.js';
import {
  X,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  ShoppingBag,
  Zap,
  Clock,
  Heart,
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-react';

const LEVEL_GOALS = [
  650,   // Level 1
  1500,  // Level 2
  2800,  // Level 3
  4200,  // Level 4
  5800,  // Level 5
  7600   // Level 6+
];

export function HeartMinerModal({ isOpen, onClose, currentUserId, walletBalance, onWalletUpdated }) {
  // Game session & state
  const [gameState, setGameState] = useState('READY'); // 'READY' | 'PLAYING' | 'SHOP' | 'GAME_OVER'
  const [sessionId, setSessionId] = useState(null);
  const [level, setLevel] = useState(1);
  const [cash, setCash] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [levelsCompleted, setLevelsCompleted] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [specialMessage, setSpecialMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shop inventory & active buffs
  const [dynamiteCount, setDynamiteCount] = useState(1); // Free 1 dynamite to start!
  const [hasPowerDrink, setHasPowerDrink] = useState(false);
  const [hasLuckyClover, setHasLuckyClover] = useState(false);
  const [hasDiamondPolish, setHasDiamondPolish] = useState(false);

  const containerRef = useRef(null);

  // Target score for current level
  const targetGoal = level <= LEVEL_GOALS.length
    ? LEVEL_GOALS[level - 1]
    : LEVEL_GOALS[LEVEL_GOALS.length - 1] + (level - LEVEL_GOALS.length) * 1600;

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
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.startMinigame();
      setSessionId(res.sessionId);
      onWalletUpdated?.(res.newBalance);

      // Reset game parameters
      setLevel(1);
      setCash(0);
      setTimeLeft(60);
      setLevelsCompleted(0);
      setDynamiteCount(1);
      setHasPowerDrink(false);
      setHasLuckyClover(false);
      setHasDiamondPolish(false);
      setGameState('PLAYING');
      setIsPaused(false);
    } catch (err) {
      setErrorMsg(err.message || 'Không đủ tim để bắt đầu chơi');
    } finally {
      setLoading(false);
    }
  };

  // End game & settle heart earnings
  const handleSettleEarnings = useCallback(async (completedCount) => {
    try {
      const res = await api.completeMinigame(sessionId, completedCount);
      if (res && res.newBalance !== undefined) {
        onWalletUpdated?.(res.newBalance);
      }
    } catch (e) {
      console.warn('Failed to settle earnings:', e);
    }
  }, [sessionId, onWalletUpdated]);

  // Level cleared handler -> opens Shop
  const handleLevelCleared = useCallback(() => {
    playLevelPass();
    const newCompleted = levelsCompleted + 1;
    setLevelsCompleted(newCompleted);
    setGameState('SHOP');
  }, [levelsCompleted]);

  // Game over handler
  const handleGameOver = useCallback(() => {
    playGameOver();
    setGameState('GAME_OVER');
    handleSettleEarnings(levelsCompleted);
  }, [levelsCompleted, handleSettleEarnings]);

  // 60-second level countdown timer
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Check if goal reached
          if (cash >= targetGoal) {
            handleLevelCleared();
          } else {
            handleGameOver();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isPaused, cash, targetGoal, handleLevelCleared, handleGameOver]);

  // Collect item callback
  const handleItemCollected = useCallback((value) => {
    setCash(prev => prev + value);
  }, []);

  // Use dynamite callback
  const handleUseDynamite = useCallback(() => {
    setDynamiteCount(prev => Math.max(0, prev - 1));
  }, []);

  // Special item found in mystery bag
  const handleSpecialFound = useCallback((msg) => {
    setSpecialMessage(msg);
    if (msg.includes('Thuốc Nổ')) {
      setDynamiteCount(prev => Math.min(3, prev + 1));
    } else if (msg.includes('Nước Tăng Lực')) {
      setHasPowerDrink(true);
    }
    setTimeout(() => setSpecialMessage(''), 3000);
  }, []);

  // Buy Shop Item
  const handleBuyShopItem = (itemKey, cost) => {
    if (cash < cost) return;
    setCash(prev => prev - cost);

    if (itemKey === 'dynamite') {
      setDynamiteCount(prev => Math.min(3, prev + 1));
    } else if (itemKey === 'powerDrink') {
      setHasPowerDrink(true);
    } else if (itemKey === 'luckyClover') {
      setHasLuckyClover(true);
    } else if (itemKey === 'diamondPolish') {
      setHasDiamondPolish(true);
    }
  };

  // Next Level from Shop
  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setTimeLeft(60);
    // Consumable power drinks or single-stage buffs reset after next level starts
    setGameState('PLAYING');
  };

  // Close and cleanup
  const handleClose = () => {
    if (gameState === 'PLAYING' || gameState === 'SHOP') {
      if (window.confirm('Bạn có chắc muốn thoát? Số tim thưởng từ các màn đã vượt qua sẽ được cộng vào ví của bạn.')) {
        handleSettleEarnings(levelsCompleted);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(28, 25, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div
        ref={containerRef}
        style={{
          background: '#fffdfa',
          border: '3px solid #d8caa8',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '860px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* TOP ARCADE HUD */}
        <div style={{
          background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
          borderBottom: '3px solid #d97706',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#78350f',
          fontWeight: '800',
          fontSize: '13px',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Cash & Goal */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              background: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '2px solid #b45309',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '11px', color: '#92400e' }}>TIỀN:</span>
              <span style={{ color: '#15803d', fontSize: '16px', fontWeight: '900' }}>${cash}</span>
            </div>

            <div style={{
              background: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '2px solid #b45309',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '11px', color: '#92400e' }}>MỤC TIÊU:</span>
              <span style={{ color: '#b91c1c', fontSize: '16px', fontWeight: '900' }}>${targetGoal}</span>
            </div>
          </div>

          {/* Center Info: Level & Earned Hearts */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '13px'
            }}>
              Màn: <span style={{ color: '#b45309', fontSize: '15px' }}>{level}</span>
            </div>

            <div style={{
              background: '#fee2e2',
              border: '1.5px solid #f87171',
              color: '#b91c1c',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12.5px'
            }}>
              <Heart size={13} fill="#b91c1c" />
              <span>Thưởng: +{levelsCompleted} ❤️</span>
            </div>
          </div>

          {/* Right Controls: Timer, Fullscreen, Close */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Timer */}
            <div style={{
              background: timeLeft <= 10 ? '#fee2e2' : '#fff',
              color: timeLeft <= 10 ? '#dc2626' : '#92400e',
              border: '2px solid #b45309',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
            }}>
              <Clock size={14} />
              <span style={{ fontSize: '15px', fontWeight: '900' }}>{timeLeft}s</span>
            </div>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Toàn màn hình"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78350f', padding: '4px' }}
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              title="Đóng game"
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* SPECIAL MESSAGE POPUP */}
        {specialMessage && (
          <div style={{
            position: 'absolute',
            top: '65px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #f59e0b',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderRadius: '20px',
            padding: '8px 20px',
            zIndex: 100,
            fontSize: '13px',
            fontWeight: '800',
            color: '#b45309',
            animation: 'bounce 0.5s'
          }}>
            {specialMessage}
          </div>
        )}

        {/* ACTIVE BUFFS BAR */}
        {gameState === 'PLAYING' && (
          <div style={{
            background: '#fffbf5',
            padding: '5px 16px',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #ebdcd0',
            color: '#78716c'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <span>Trợ lực đang có:</span>
              <span style={{ fontWeight: '700', color: dynamiteCount > 0 ? '#dc2626' : '#a8a29e' }}>
                🧨 {dynamiteCount} Thuốc Nổ
              </span>
              {hasPowerDrink && (
                <span style={{ fontWeight: '700', color: '#16a34a' }}>
                  🥤 Nước Tăng Lực (Kéo siêu nhanh)
                </span>
              )}
              {hasLuckyClover && (
                <span style={{ fontWeight: '700', color: '#0284c7' }}>
                  🍀 Cỏ 4 Lá (Túi tiền khủng)
                </span>
              )}
              {hasDiamondPolish && (
                <span style={{ fontWeight: '700', color: '#c026d3' }}>
                  💎 Sách Đánh Bóng (+30% giá kim cương)
                </span>
              )}
            </div>

            <span style={{ fontSize: '11px', color: '#a8a29e' }}>
              Nhấn <b>Phím Cách / Mũi tên xuống</b> để thả móc • Bấm <b>W / Mũi tên lên</b> để nổ bom
            </span>
          </div>
        )}

        {/* MAIN GAMEPLAY VIEW */}
        <div style={{ position: 'relative', background: '#ebdcc9', minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 1. READY SCREEN */}
          {gameState === 'READY' && (
            <div style={{
              textAlign: 'center',
              padding: '40px 24px',
              maxWidth: '520px',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '2px solid #ebdcd0'
            }}>
              <div style={{ fontSize: '50px', marginBottom: '8px' }}>⛏️💖</div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#b45309' }}>
                Đào Tim Cổ Điển (Heart Miner)
              </h2>
              <p style={{ color: '#78716c', fontSize: '13.5px', marginTop: '6px', lineHeight: 1.5 }}>
                Bản game Đào Vàng huyền thoại tuổi thơ với đồ họa Trái Tim lãng mạn. Thả móc câu gắp thật nhiều Tim, Pha Lê và Hộp Quà để vượt qua các màn chơi!
              </p>

              {/* Economy info */}
              <div style={{
                background: '#fef3c7',
                border: '1.5px solid #fde68a',
                borderRadius: '16px',
                padding: '14px',
                margin: '20px 0',
                fontSize: '13px',
                color: '#92400e',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏆 Quy tắc Thưởng - Phạt Ví Tim:</span>
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                  <li>Chi <b>1 ❤️</b> vé vào mỏ tình yêu.</li>
                  <li>Mỗi màn vượt qua được thưởng <b>+1 ❤️</b> tích lũy thẳng vào ví!</li>
                  <li>Vượt 3 màn = nhận 3 ❤️ (lời 2 ❤️ để tặng bạn ấy hoặc tưới cây).</li>
                </ul>
              </div>

              {errorMsg && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartGame}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #e06d7e 0%, #c95264 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '14px 32px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(224, 109, 126, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Play size={18} fill="#fff" />
                <span>{loading ? 'Đang vào mỏ...' : 'Bắt Đầu Đào Tim (-1 ❤️)'}</span>
              </button>
            </div>
          )}

          {/* 2. PLAYING CANVAS */}
          {gameState === 'PLAYING' && (
            <HeartMinerCanvas
              level={level}
              hasPowerDrink={hasPowerDrink}
              hasLuckyClover={hasLuckyClover}
              hasDiamondPolish={hasDiamondPolish}
              dynamiteCount={dynamiteCount}
              onUseDynamite={handleUseDynamite}
              onItemCollected={handleItemCollected}
              onSpecialFound={handleSpecialFound}
              isPaused={isPaused}
            />
          )}

          {/* 3. INTERMISSION SHOP */}
          {gameState === 'SHOP' && (
            <div style={{
              width: '100%',
              maxWidth: '680px',
              background: '#fff',
              border: '2px solid #ebdcd0',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
              margin: '20px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '14px', fontWeight: '800' }}>
                  🎉 CHÚC MỪNG BẠN ĐÃ QUA MÀN {level}!
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#92400e', marginTop: '8px' }}>
                  Cửa Hàng Tạp Hóa Tình Yêu 🛒
                </h3>
                <p style={{ color: '#78716c', fontSize: '13px' }}>
                  Dùng tiền đào được trong game để mua đồ trợ giúp cho Màn {level + 1}! (Mục tiêu tiếp theo: ${LEVEL_GOALS[level] || targetGoal + 1600})
                </p>
              </div>

              {/* Shop items grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {/* 1. Dynamite */}
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '24px' }}>🧨</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#991b1b' }}>Thuốc Nổ</div>
                    <div style={{ fontSize: '11.5px', color: '#78716c' }}>Nổ tan đá tảng khi gắp nhầm (Kho: {dynamiteCount}/3)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyShopItem('dynamite', 150)}
                    disabled={cash < 150 || dynamiteCount >= 3}
                    style={{
                      background: cash >= 150 && dynamiteCount < 3 ? '#ef4444' : '#d1d5db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: cash >= 150 && dynamiteCount < 3 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    $150
                  </button>
                </div>

                {/* 2. Power Drink */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '24px' }}>🥤</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#166534' }}>Nước Tăng Lực</div>
                    <div style={{ fontSize: '11.5px', color: '#78716c' }}>Kéo mọi vật phẩm nhanh gấp đôi</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyShopItem('powerDrink', 200)}
                    disabled={cash < 200 || hasPowerDrink}
                    style={{
                      background: cash >= 200 && !hasPowerDrink ? '#22c55e' : '#d1d5db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: cash >= 200 && !hasPowerDrink ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {hasPowerDrink ? 'Đã có' : '$200'}
                  </button>
                </div>

                {/* 3. Lucky Clover */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '24px' }}>🍀</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#075985' }}>Cỏ 4 Lá</div>
                    <div style={{ fontSize: '11.5px', color: '#78716c' }}>Túi bí ẩn mở ra toàn tiền khủng</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyShopItem('luckyClover', 100)}
                    disabled={cash < 100 || hasLuckyClover}
                    style={{
                      background: cash >= 100 && !hasLuckyClover ? '#0284c7' : '#d1d5db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: cash >= 100 && !hasLuckyClover ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {hasLuckyClover ? 'Đã có' : '$100'}
                  </button>
                </div>

                {/* 4. Diamond Polish */}
                <div style={{
                  background: '#faf5ff',
                  border: '1.5px solid #e9d5ff',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '24px' }}>💎</div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#86198f' }}>Sách Đánh Bóng</div>
                    <div style={{ fontSize: '11.5px', color: '#78716c' }}>Tăng 30% giá trị Kim Cương/Pha Lê</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyShopItem('diamondPolish', 180)}
                    disabled={cash < 180 || hasDiamondPolish}
                    style={{
                      background: cash >= 180 && !hasDiamondPolish ? '#a855f7' : '#d1d5db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      fontWeight: '800',
                      fontSize: '12.5px',
                      cursor: cash >= 180 && !hasDiamondPolish ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {hasDiamondPolish ? 'Đã có' : '$180'}
                  </button>
                </div>
              </div>

              {/* Continue button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleNextLevel}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '12px 32px',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  Tiếp Tục Màn {level + 1} ➡️
                </button>
              </div>
            </div>
          )}

          {/* 4. GAME OVER SCREEN */}
          {gameState === 'GAME_OVER' && (
            <div style={{
              textAlign: 'center',
              padding: '36px 24px',
              maxWidth: '480px',
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
              border: '2px solid #ebdcd0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏁</div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#b91c1c' }}>
                Hết Giờ! Chưa Đạt Mục Tiêu
              </h2>
              <p style={{ color: '#78716c', fontSize: '13px', marginTop: '4px' }}>
                Bạn đã dừng chân tại Màn {level} với số điểm ${cash} (Mục tiêu: ${targetGoal}).
              </p>

              {/* Reward Box */}
              <div style={{
                background: '#fee2e2',
                border: '2px dashed #f87171',
                borderRadius: '18px',
                padding: '18px',
                margin: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>
                  Tổng số Trái Tim thực tế bạn kiếm được:
                </span>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#b91c1c' }}>
                  +{levelsCompleted} ❤️
                </span>
                <span style={{ fontSize: '11.5px', color: '#7f1d1d' }}>
                  (Đã cộng trực tiếp vào Số Dư Ví Tim của bạn!)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleStartGame}
                  style={{
                    background: 'linear-gradient(135deg, #e06d7e 0%, #c95264 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '11px 22px',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Chơi Lại Ván Mới (-1 ❤️)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '14px',
                    padding: '11px 20px',
                    fontSize: '13.5px',
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
    </div>
  );
}
