import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Heart, Wind, Volume2, VolumeX } from 'lucide-react';

// Web Audio Synthesizer for Wind Puff Sound
function playPuffSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {}
}

// Web Audio Synthesizer for Celebration Fanfare Chime
function playCheerChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.9);
    });
  } catch (e) {}
}

// Web Audio Synthesizer for Happy Birthday Melody
function playHappyBirthdayMelody() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
      { f: 392, d: 0.35 }, { f: 392, d: 0.35 }, { f: 440, d: 0.7 }, { f: 392, d: 0.7 }, { f: 523.25, d: 0.7 }, { f: 493.88, d: 1.2 },
      { f: 392, d: 0.35 }, { f: 392, d: 0.35 }, { f: 440, d: 0.7 }, { f: 392, d: 0.7 }, { f: 587.33, d: 0.7 }, { f: 523.25, d: 1.4 }
    ];
    let time = ctx.currentTime + 0.1;
    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, time);
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + n.d + 0.05);
      time += n.d * 0.95;
    });
    return ctx;
  } catch (e) {
    return null;
  }
}

export function CandleBlowModal({ milestone, partner, onClose, onOpenLetterWriter, onOpenLetter }) {
  // 3 Interactive Candles on the cake
  const [candles, setCandles] = useState([
    { id: 1, lit: true, label: 'Bình an 🌸', angle: -6 },
    { id: 2, lit: true, label: 'Hạnh phúc ❤️', angle: 0 },
    { id: 3, lit: true, label: 'Bên nhau ✨', angle: 6 }
  ]);
  const [wishText, setWishText] = useState('');
  const [blownOut, setBlownOut] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const audioCtxRef = useRef(null);

  // Play birthday chime when modal mounts
  useEffect(() => {
    if (isMusicPlaying) {
      audioCtxRef.current = playHappyBirthdayMelody();
    }
    return () => {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const triggerCelebration = () => {
    setBlownOut(true);
    playCheerChime();
    try {
      confetti({
        particleCount: 160,
        spread: 110,
        origin: { y: 0.55 },
        colors: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ff4757', '#a29bfe']
      });
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#ffd166', '#ff758c', '#ffffff']
        });
      }, 600);
    } catch (e) {}
  };

  // Blow out an individual candle
  const handleBlowSingleCandle = (id) => {
    playPuffSound();
    setCandles(prev => {
      const next = prev.map(c => c.id === id ? { ...c, lit: false } : c);
      const remainingLit = next.filter(c => c.lit).length;
      if (remainingLit === 0 && !blownOut) {
        setTimeout(triggerCelebration, 250);
      }
      return next;
    });
  };

  // Blow out all candles at once
  const handleBlowAllCandles = () => {
    playPuffSound();
    setCandles(prev => prev.map(c => ({ ...c, lit: false })));
    triggerCelebration();
  };

  // Auto-transition to open letter after celebration
  useEffect(() => {
    if (!blownOut) return;
    if (countdown <= 0) {
      handleProceedToLetter();
      return;
    }
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [blownOut, countdown]);

  const handleProceedToLetter = () => {
    onClose();
    if (milestone.letterId && onOpenLetter) {
      onOpenLetter(milestone.letterId);
    } else if (onOpenLetterWriter) {
      onOpenLetterWriter();
    }
  };

  const remainingLitCount = candles.filter(c => c.lit).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(26, 21, 18, 0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: '#fffdf9',
        border: '1.5px solid #ffccd5',
        borderRadius: '32px',
        maxWidth: '490px',
        width: '100%',
        padding: '36px 30px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Music Chime Toggle Button */}
        <button
          onClick={() => {
            if (isMusicPlaying) {
              if (audioCtxRef.current) try { audioCtxRef.current.close(); } catch (e) {}
              setIsMusicPlaying(false);
            } else {
              audioCtxRef.current = playHappyBirthdayMelody();
              setIsMusicPlaying(true);
            }
          }}
          title={isMusicPlaying ? 'Tắt giai điệu sinh nhật' : 'Bật giai điệu sinh nhật'}
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            background: 'rgba(255, 235, 238, 0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--rose-primary)',
            cursor: 'pointer'
          }}
        >
          {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          🎉 BẤT NGỜ DÀNH RIÊNG CHO BẠN
        </span>
        <h2 style={{ fontSize: '23px', fontWeight: '800', marginTop: '6px', marginBottom: '8px', color: 'var(--text-ink)' }}>
          {milestone.title}
        </h2>

        {/* ================= INTERACTIVE 3D LAYERED CAKE ================= */}
        <div style={{
          position: 'relative',
          width: '240px',
          height: '190px',
          margin: '0 auto 20px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          {/* 3 Candles */}
          <div style={{
            position: 'absolute',
            top: '10px',
            display: 'flex',
            gap: '32px',
            alignItems: 'flex-end',
            zIndex: 10
          }}>
            {candles.map((candle) => (
              <div
                key={candle.id}
                onClick={() => candle.lit && handleBlowSingleCandle(candle.id)}
                title={candle.lit ? 'Chạm vào để thổi tắt ngọn nến này! 🌬️' : 'Nến đã tắt'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: candle.lit ? 'pointer' : 'default',
                  transform: `rotate(${candle.angle}deg)`,
                  transition: 'transform 0.2s'
                }}
              >
                {/* Flame or Smoke */}
                {candle.lit ? (
                  <div
                    style={{
                      width: '18px',
                      height: '26px',
                      background: 'radial-gradient(circle at 50% 80%, #ffffff 0%, #ffd166 40%, #ff5e57 85%, transparent 100%)',
                      borderRadius: '50% 50% 35% 35%',
                      boxShadow: '0 0 16px #ffd166, 0 0 28px #ff758c',
                      animation: 'flameFlicker 0.6s infinite alternate ease-in-out',
                      marginBottom: '2px',
                      filter: 'drop-shadow(0 0 6px rgba(255, 209, 102, 0.8))'
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: '18px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'smokeRise 1.8s infinite ease-out',
                    opacity: 0.75
                  }}>
                    💨
                  </div>
                )}

                {/* Candle Stick */}
                <div style={{
                  width: '14px',
                  height: candle.id === 2 ? '48px' : '40px',
                  background: candle.id === 2
                    ? 'repeating-linear-gradient(45deg, #ff758c, #ff758c 5px, #ffffff 5px, #ffffff 10px)'
                    : (candle.id === 1
                      ? 'repeating-linear-gradient(45deg, #74b9ff, #74b9ff 5px, #ffffff 5px, #ffffff 10px)'
                      : 'repeating-linear-gradient(45deg, #ffeaa7, #ffeaa7 5px, #ffffff 5px, #ffffff 10px)'),
                  borderRadius: '4px',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.12)'
                }} />
              </div>
            ))}
          </div>

          {/* Top Cake Tier */}
          <div style={{
            width: '150px',
            height: '42px',
            background: 'linear-gradient(180deg, #ffffff 0%, #ffe3e8 100%)',
            borderRadius: '14px 14px 6px 6px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
            position: 'relative',
            zIndex: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '800',
            color: '#e06d7e'
          }}>
            <span>✨ Happy Birthday ✨</span>
          </div>

          {/* Bottom Cake Tier */}
          <div style={{
            width: '210px',
            height: '52px',
            background: 'linear-gradient(180deg, #ffc2d1 0%, #ffafcc 100%)',
            borderRadius: '16px 16px 8px 8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.09)',
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#8b1e2c'
          }}>
            <span>🍓</span>
            <span>Gửi Trọn Yêu Thương</span>
            <span>🍓</span>
          </div>

          {/* Cake Plate */}
          <div style={{
            width: '240px',
            height: '12px',
            background: 'linear-gradient(180deg, #ffffff 0%, #eaeaea 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 4,
            marginTop: '2px'
          }} />
        </div>

        <style>{`
          @keyframes flameFlicker {
            0% { transform: scale(1) rotate(-3deg); }
            50% { transform: scale(1.12) rotate(2deg); }
            100% { transform: scale(0.95) rotate(-2deg); }
          }
          @keyframes smokeRise {
            0% { transform: translateY(0) scale(0.8); opacity: 0.8; }
            100% { transform: translateY(-12px) scale(1.2); opacity: 0; }
          }
        `}</style>

        {/* ================= STEP 1: MAKE A WISH & BLOW CANDLES ================= */}
        {!blownOut ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff2f4',
              color: 'var(--rose-primary)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              <span>🕯️</span>
              <span>Chạm vào từng ngọn nến để thổi, hoặc bấm nút thổi cả 3 ngọn!</span>
            </div>

            {/* Secret Wish Input Field */}
            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="✨ Nhập điều ước tuổi mới gửi gắm vào ngọn nến..."
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  border: '1.5px dashed #ffccd5',
                  background: '#fff',
                  fontSize: '13.5px',
                  textAlign: 'center',
                  outline: 'none',
                  color: 'var(--text-ink)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                }}
              />
            </div>

            {/* Quick Wish Suggestion Pills */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[
                'Mãi mãi bên nhau hạnh phúc ❤️',
                'Tuổi mới luôn rạng rỡ 🌸',
                'Cùng nhau đi khắp thế gian ✈️'
              ].map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setWishText(pill)}
                  style={{
                    background: wishText === pill ? 'var(--rose-light)' : '#fdf6ee',
                    border: wishText === pill ? '1px solid var(--rose-primary)' : '1px solid #ebd9c8',
                    color: wishText === pill ? 'var(--rose-primary)' : '#7a5a3a',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Main Blow Candle Button */}
            <button
              onClick={handleBlowAllCandles}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff758c 0%, #e06d7e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(224, 109, 126, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Wind size={18} />
              <span>Phùuuu... Thổi Tắt {remainingLitCount === 3 ? 'Cả 3' : 'Hết'} Ngọn Nến!</span>
            </button>
          </div>
        ) : (
          /* ================= STEP 2: CELEBRATION & SEAMLESS TRANSITION TO OPEN LETTER ================= */
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #fff2f4 0%, #fef8ee 100%)',
              border: '1.5px solid #ffccd5',
              borderRadius: '20px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--rose-primary)', marginBottom: '6px' }}>
                🎉 Điều Ước Đã Bay Đến Các Vì Sao!
              </h3>
              <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5', margin: 0 }}>
                {wishText ? (
                  <>Điều ước <strong>"{wishText}"</strong> nhất định sẽ thành hiện thực! ✨</>
                ) : (
                  <>Những điều ước ngọt ngào nhất của tuổi mới sẽ trở thành hiện thực! ✨</>
                )}
              </p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                <strong>{partner ? partner.display_name : 'Người ấy'}</strong> đã cẩn thận chuẩn bị một bức thư bí mật dành riêng cho bạn!
              </p>
            </div>

            {/* Seamless Action Button: Opens Letter Immediately */}
            <button
              onClick={handleProceedToLetter}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #e06d7e 0%, #c44d60 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(224, 109, 126, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                animation: 'heartClaspPulse 2s infinite ease-in-out'
              }}
            >
              <span>💌 Mở Lá Thư Bí Mật Của {partner ? partner.display_name : 'Người Ấy'} ({countdown}s)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
