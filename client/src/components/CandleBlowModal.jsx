import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles } from 'lucide-react';

export function CandleBlowModal({ milestone, onClose, onOpenLetterWriter, onOpenLetter }) {
  const [blownOut, setBlownOut] = useState(false);

  const handleBlowCandle = () => {
    setBlownOut(true);
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#ff4757']
      });
    } catch (e) {}
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(26, 21, 18, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: '#fffdf9',
        border: '1px solid var(--border-subtle)',
        borderRadius: '28px',
        maxWidth: '460px',
        width: '100%',
        padding: '36px 28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🎂 NGÀY ĐẶC BIỆT CỦA BẠN
        </span>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginTop: '6px', marginBottom: '20px' }}>
          {milestone.title}
        </h2>

        {/* Birthday Cake Graphic with Flame */}
        <div style={{ position: 'relative', width: '200px', height: '180px', margin: '0 auto 24px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* Candle */}
          <div style={{
            position: 'absolute',
            top: '30px',
            width: '12px',
            height: '42px',
            background: 'repeating-linear-gradient(45deg, #ffd1dc, #ffd1dc 6px, #fff 6px, #fff 12px)',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {/* Candle Flame or Smoke */}
            {!blownOut ? (
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '-2px',
                width: '16px',
                height: '24px',
                background: 'radial-gradient(circle at 50% 80%, #fff 0%, #ffd166 40%, #ff5e57 80%, transparent 100%)',
                borderRadius: '50% 50% 35% 35%',
                boxShadow: '0 0 15px #ffd166, 0 0 25px #ff5e57',
                animation: 'flameFlicker 0.6s infinite alternate ease-in-out'
              }}></div>
            ) : (
              <div style={{
                position: 'absolute',
                top: '-22px',
                left: '2px',
                fontSize: '18px',
                opacity: 0.8
              }}>
                💨
              </div>
            )}
          </div>

          {/* Cake Layers */}
          <div style={{
            width: '180px',
            height: '70px',
            background: 'linear-gradient(180deg, #ffe5ec 0%, #fcd5ce 100%)',
            borderRadius: '16px 16px 8px 8px',
            boxShadow: '0 6px 15px rgba(0,0,0,0.08)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '700',
            color: '#b56576'
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '0',
              right: '0',
              height: '16px',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}></div>
            <span>Happy Birthday ✨</span>
          </div>

          {/* Plate */}
          <div style={{
            width: '210px',
            height: '10px',
            background: '#e9ecef',
            borderRadius: '10px',
            marginTop: '2px'
          }}></div>
        </div>

        <style>{`
          @keyframes flameFlicker {
            0% { transform: scale(1) rotate(-2deg); }
            100% { transform: scale(1.1) rotate(2deg); }
          }
        `}</style>

        {!blownOut ? (
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Hãy nhắm mắt ước một điều ước thật đẹp cho hai bạn rồi nhấn nút thổi nến nhé!
            </p>
            <button
              onClick={handleBlowCandle}
              style={{
                background: 'linear-gradient(135deg, #e06d7e 0%, #ff758c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '13px 28px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(224, 109, 126, 0.35)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🎂 Thổi Nến &amp; Mở Quà
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#2e7d32', marginBottom: '8px' }}>
              🎉 Chúc Mừng Sinh Nhật!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Nến đã tắt và điều ước đã bay đến các vì sao! Người yêu đã chuẩn bị một lá thư bí mật cho bạn rồi đấy.
            </p>
            <button
              onClick={() => {
                onClose();
                if (milestone.letterId && onOpenLetter) {
                  onOpenLetter(milestone.letterId);
                } else if (onOpenLetterWriter) {
                  onOpenLetterWriter();
                }
              }}
              style={{
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 24px',
                fontSize: '14.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {milestone.letterId ? 'Mở Thư Bí Mật Của Người Ấy 💌' : 'Xem Thư Kỷ Niệm 💌'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
