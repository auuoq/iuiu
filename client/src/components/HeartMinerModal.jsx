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
  const [dynamiteCount, setDynamiteCount] = useState(1); // Free 1 dynamite to start
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
      background: 'rgba(20, 15, 10, 0.88)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <div
        ref={containerRef}
        style={{
          background: '#fab81b',
          border: '4px solid #854d0e',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          width: '100%',
          maxWidth: '820px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* SPECIAL MESSAGE POPUP */}
        {specialMessage && (
          <div style={{
            position: 'absolute',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #f59e0b',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            borderRadius: '20px',
            padding: '8px 22px',
            zIndex: 100,
            fontSize: '13.5px',
            fontWeight: '800',
            color: '#b45309'
          }}>
            {specialMessage}
          </div>
        )}

        {/* 1. READY SCREEN */}
        {gameState === 'READY' && (
          <div style={{
            background: '#fffbf5',
            padding: '40px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>⛏️</div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#854d0e', letterSpacing: '0.5px' }}>
              ĐÀO TIM CỔ ĐIỂN (GOLD MINER)
            </h2>
            <p style={{ color: '#78716c', fontSize: '14px', marginTop: '6px' }}>
              Phiên bản huyền thoại tuổi thơ với đồ họa Trái Tim &amp; Kim Cương tuyệt đẹp!
            </p>

            <div style={{
              background: '#fef3c7',
              border: '2px dashed #f59e0b',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '460px',
              margin: '22px auto',
              textAlign: 'left',
              color: '#92400e',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '800', marginBottom: '6px' }}>🏆 Luật Chơi &amp; Thưởng Ví Tim:</div>
              <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: 1.6 }}>
                <li>Chi <b>1 ❤️</b> vé vào mỏ tình yêu.</li>
                <li>Mỗi màn vượt qua được thưởng <b>+1 ❤️</b> thẳng vào ví!</li>
                <li>Vượt 3 màn = nhận 3 ❤️ (lời 2 ❤️ để tặng bạn ấy hoặc tưới cây).</li>
              </ul>
            </div>

            {errorMsg && (
              <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStartGame}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  border: '2px solid #b45309',
                  borderRadius: '14px',
                  padding: '13px 32px',
                  fontSize: '15px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(217, 119, 6, 0.4)'
                }}
              >
                {loading ? 'Đang mở mỏ...' : 'BẮT ĐẦU ĐÀO (-1 ❤️)'}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px 20px',
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

        {/* 2. PLAYING CANVAS VIEW (Authentic 100% Gold Miner HUD & Sprites) */}
        {gameState === 'PLAYING' && (
          <HeartMinerCanvas
            level={level}
            cash={cash}
            targetGoal={targetGoal}
            timeLeft={timeLeft}
            levelsCompleted={levelsCompleted}
            hasPowerDrink={hasPowerDrink}
            hasLuckyClover={hasLuckyClover}
            hasDiamondPolish={hasDiamondPolish}
            dynamiteCount={dynamiteCount}
            onUseDynamite={handleUseDynamite}
            onItemCollected={handleItemCollected}
            onSpecialFound={handleSpecialFound}
            onExitGame={handleClose}
            isPaused={isPaused}
          />
        )}

        {/* 3. AUTHENTIC RETRO WOODEN SHOP (Cửa Hàng Tạp Hóa Kinh Điển) */}
        {gameState === 'SHOP' && (
          <div style={{
            background: 'linear-gradient(180deg, #78350f 0%, #451a03 100%)',
            padding: '24px 20px',
            color: '#fff'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{ background: '#16a34a', color: '#fff', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                🎉 ĐÃ VƯỢT QUA MÀN {level}!
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fde047', marginTop: '6px', letterSpacing: '1px' }}>
                TIỆM TẠP HÓA ĐÀO VÀNG 🛒
              </h2>
              <div style={{ fontSize: '13px', color: '#fef08a' }}>
                Mục tiêu Màn {level + 1} tiếp theo: <b style={{ color: '#4ade80' }}>${LEVEL_GOALS[level] || targetGoal + 1600}</b> • Tiền của bạn: <b style={{ color: '#4ade80', fontSize: '16px' }}>${cash}</b>
              </div>
            </div>

            {/* Shopkeeper dialogue speech */}
            <div style={{
              background: '#292524',
              border: '2px solid #a8a29e',
              borderRadius: '16px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{ fontSize: '38px', lineHeight: 1 }}>👴🏻</div>
              <div style={{ fontSize: '13.5px', color: '#fed7aa', fontStyle: 'italic', lineHeight: 1.4 }}>
                "Khá lắm anh bạn trẻ! Màn tới đất cứng đá to nhiều lắm, hãy mua chút đồ nghề trợ giúp để đào cho năng suất nhé!"
              </div>
            </div>

            {/* Wooden shelf / counter items */}
            <div style={{
              background: 'linear-gradient(180deg, #92400e 0%, #78350f 100%)',
              border: '3px solid #b45309',
              borderRadius: '16px',
              padding: '18px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.4)',
              marginBottom: '20px'
            }}>
              {/* 1. Thuốc nổ Dynamite */}
              <div style={{
                background: '#451a03',
                border: '2px solid #d97706',
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px'
              }}>
                <div>
                  <img src="/miner/dynamite.png" alt="Dynamite" style={{ height: '48px', display: 'block', margin: '0 auto 6px auto' }} />
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#fca5a5' }}>Thuốc Nổ</div>
                  <div style={{ fontSize: '11px', color: '#d6d3d1' }}>Nổ tan đá tảng ({dynamiteCount}/3)</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyShopItem('dynamite', 150)}
                  disabled={cash < 150 || dynamiteCount >= 3}
                  style={{
                    marginTop: '8px',
                    background: cash >= 150 && dynamiteCount < 3 ? '#16a34a' : '#57534e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: cash >= 150 && dynamiteCount < 3 ? 'pointer' : 'not-allowed'
                  }}
                >
                  {dynamiteCount >= 3 ? 'Đầy kho' : '$150'}
                </button>
              </div>

              {/* 2. Nước tăng lực */}
              <div style={{
                background: '#451a03',
                border: '2px solid #d97706',
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px'
              }}>
                <div>
                  <div style={{ fontSize: '42px', lineHeight: '48px', marginBottom: '6px' }}>🥤</div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#86efac' }}>Nước Tăng Lực</div>
                  <div style={{ fontSize: '11px', color: '#d6d3d1' }}>Kéo mọi thứ siêu nhanh</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyShopItem('powerDrink', 200)}
                  disabled={cash < 200 || hasPowerDrink}
                  style={{
                    marginTop: '8px',
                    background: cash >= 200 && !hasPowerDrink ? '#16a34a' : '#57534e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: cash >= 200 && !hasPowerDrink ? 'pointer' : 'not-allowed'
                  }}
                >
                  {hasPowerDrink ? 'Đã có' : '$200'}
                </button>
              </div>

              {/* 3. Cỏ 4 lá */}
              <div style={{
                background: '#451a03',
                border: '2px solid #d97706',
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px'
              }}>
                <div>
                  <div style={{ fontSize: '42px', lineHeight: '48px', marginBottom: '6px' }}>🍀</div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#7dd3fc' }}>Cỏ 4 Lá</div>
                  <div style={{ fontSize: '11px', color: '#d6d3d1' }}>Túi ? mở ra toàn tiền khủng</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyShopItem('luckyClover', 100)}
                  disabled={cash < 100 || hasLuckyClover}
                  style={{
                    marginTop: '8px',
                    background: cash >= 100 && !hasLuckyClover ? '#16a34a' : '#57534e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: cash >= 100 && !hasLuckyClover ? 'pointer' : 'not-allowed'
                  }}
                >
                  {hasLuckyClover ? 'Đã có' : '$100'}
                </button>
              </div>

              {/* 4. Sách đánh bóng */}
              <div style={{
                background: '#451a03',
                border: '2px solid #d97706',
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px'
              }}>
                <div>
                  <div style={{ fontSize: '42px', lineHeight: '48px', marginBottom: '6px' }}>💎</div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#f0abfc' }}>Sách Đánh Bóng</div>
                  <div style={{ fontSize: '11px', color: '#d6d3d1' }}>Kim Cương tăng +30% giá</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBuyShopItem('diamondPolish', 180)}
                  disabled={cash < 180 || hasDiamondPolish}
                  style={{
                    marginTop: '8px',
                    background: cash >= 180 && !hasDiamondPolish ? '#16a34a' : '#57534e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: cash >= 180 && !hasDiamondPolish ? 'pointer' : 'not-allowed'
                  }}
                >
                  {hasDiamondPolish ? 'Đã có' : '$180'}
                </button>
              </div>
            </div>

            {/* Next Level Action */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleNextLevel}
                style={{
                  background: 'linear-gradient(180deg, #facc15 0%, #eab308 100%)',
                  color: '#713f12',
                  border: '2px solid #ca8a04',
                  borderRadius: '16px',
                  padding: '12px 36px',
                  fontSize: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  letterSpacing: '0.5px'
                }}
              >
                TIẾP TỤC MÀN {level + 1} ➡️
              </button>
            </div>
          </div>
        )}

        {/* 4. GAME OVER SCREEN */}
        {gameState === 'GAME_OVER' && (
          <div style={{
            background: '#fffbf5',
            padding: '36px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏁</div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#b91c1c' }}>
              HẾT GIỜ! CHƯA ĐẠT MỤC TIÊU
            </h2>
            <p style={{ color: '#78716c', fontSize: '13.5px', marginTop: '4px' }}>
              Bạn dừng chân tại Màn {level} với số điểm ${cash} (Mục tiêu: ${targetGoal}).
            </p>

            <div style={{
              background: '#fee2e2',
              border: '2px dashed #f87171',
              borderRadius: '16px',
              padding: '18px',
              maxWidth: '380px',
              margin: '20px auto',
              color: '#991b1b'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>
                Tổng số Trái Tim thực tế bạn kiếm được:
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#b91c1c', margin: '4px 0' }}>
                +{levelsCompleted} ❤️
              </div>
              <div style={{ fontSize: '12px', color: '#7f1d1d' }}>
                (Đã cộng trực tiếp vào Số Dư Ví Tim của bạn!)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStartGame}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '11px 24px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={16} />
                <span>Chơi Lại Ván Mới (-1 ❤️)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '14px',
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
      </div>
    </div>
  );
}
