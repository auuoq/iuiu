import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WAX_EMBLEMS, SCENT_TAGS } from './LetterWriterModal.jsx';
import { LetterBgmEngine } from './LetterBgmEngine.jsx';

export function LetterReaderModal({ letter, onClose }) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(Boolean(letter.bgm_track));

  // Theme paper classes
  const getPaperClass = () => {
    switch (letter.paper_style) {
      case 'kraft': return 'paper-kraft-vintage';
      case 'pressed_flowers': return 'paper-pressed-flowers';
      case 'caro_ribbon': return 'paper-caro-ribbon';
      case 'starry': return 'paper-starry-night';
      case 'coffee': return 'paper-warm-coffee';
      default: return 'paper-kraft-vintage';
    }
  };

  const toggleMusic = () => {
    setIsPlayingMusic(prev => !prev);
  };

  const waxColor = letter.wax_seal?.color || 'red';
  const waxEmblem = letter.wax_seal?.emblem || 'heart';
  const waxIcon = WAX_EMBLEMS.find(e => e.id === waxEmblem)?.icon || '❤️';
  const scent = SCENT_TAGS.find(s => s.id === letter.scent_tag)?.label || SCENT_TAGS[0].label;

  // Floating rose petals
  const petals = [
    { id: 1, left: '10%', delay: '0s', duration: '9s' },
    { id: 2, left: '25%', delay: '2s', duration: '11s' },
    { id: 3, left: '50%', delay: '1s', duration: '8s' },
    { id: 4, left: '75%', delay: '3s', duration: '10s' },
    { id: 5, left: '88%', delay: '4s', duration: '12s' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Falling Rose Petals effect */}
      {petals.map(p => (
        <div
          key={p.id}
          className="falling-petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: '20px'
          }}
        >
          🌸
        </div>
      ))}

      {/* Background Music Engine */}
      <LetterBgmEngine url={letter.bgm_track} isPlaying={isPlayingMusic} />

      {/* Main Letter Paper Canvas (Identical sizing, padding, and layout to editor canvas preview!) */}
      <div
        className={`letter-canvas-surface ${getPaperClass()}`}
        style={{
          borderRadius: '24px',
          maxWidth: '740px',
          width: '100%',
          minHeight: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '36px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.22)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Custom Uploaded Background Image if any */}
        {letter.bg_image && (
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${letter.bg_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.18,
              pointerEvents: 'none',
              borderRadius: '24px',
              zIndex: 0
            }}
          />
        )}

        {/* Top-Right Badges: BGM Player + Scent Tag + Close Button */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 30
        }}>
          {/* Letter BGM Mini Player */}
          {letter.bgm_track && (
            <div
              onClick={toggleMusic}
              title={isPlayingMusic ? 'Bấm để tạm dừng nhạc' : 'Bấm để phát nhạc'}
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid var(--rose-border)',
                borderRadius: '16px',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #333 30%, #111 70%, #d4a373 100%)',
                animation: isPlayingMusic ? 'spinVinyl 3s linear infinite' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#fff' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--rose-primary)' }}>
                {isPlayingMusic ? 'Đang phát 🎵' : '❚❚ Dừng'}
              </span>
            </div>
          )}

          {/* Scent Tag */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.88)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--rose-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}>
            <span>🌸</span>
            <span>{scent}</span>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsPlayingMusic(false);
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
            title="Đóng lá thư"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Custom Wax Seal Header (Identical layout to Canvas preview!) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '22px',
          borderBottom: '1px dashed var(--border-subtle)',
          paddingBottom: '16px',
          position: 'relative',
          zIndex: 2,
          paddingRight: '120px'
        }}>
          <div className={`wax-seal wax-seal-${waxColor}`} style={{ width: '50px', height: '50px', fontSize: '20px' }}>
            {waxIcon}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase' }}>
              {letter.mood_tag || 'Thư Tình Yêu'}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-ink)', marginTop: '2px', lineHeight: 1.25 }}>
              {letter.title}
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span>Từ: <strong>{letter.sender_name}</strong></span>
              <span>•</span>
              <span>Ngày gửi: {new Date(letter.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Decorative Stickers on Reader (Identical rendering & coordinate space to Canvas preview!) */}
        {letter.stickers && letter.stickers.map((stk) => (
          <div
            key={stk.id}
            style={{
              position: 'absolute',
              left: `${stk.x}%`,
              top: `${stk.y}%`,
              transform: `scale(${stk.scale || 1}) rotate(${stk.rotation || 0}deg)`,
              transformOrigin: 'center center',
              pointerEvents: 'none',
              zIndex: 15
            }}
          >
            <img
              src={stk.url}
              alt="sticker"
              draggable={false}
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))'
              }}
            />
          </div>
        ))}

        {/* Letter Text Content */}
        <div style={{
          fontFamily: letter.font_family || "'Caveat', cursive, sans-serif",
          color: letter.text_color || '#2b2621',
          fontSize: '18px',
          lineHeight: '1.85',
          whiteSpace: 'pre-wrap',
          minHeight: '120px',
          marginBottom: '26px',
          position: 'relative',
          zIndex: 2
        }}>
          {letter.content}
        </div>

        {/* Polaroid Photos Attachment */}
        {letter.photos && letter.photos.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Ảnh kỷ niệm đính kèm:
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {letter.photos.map((photoUrl, i) => (
                <div key={i} className="polaroid" style={{ width: '140px', transform: `rotate(${i % 2 === 0 ? '-2.5deg' : '3deg'})` }}>
                  <div className="washi-tape" style={{ width: '40px', height: '12px' }} />
                  <img src={typeof photoUrl === 'string' ? photoUrl : photoUrl.url} alt="polaroid" className="polaroid-img" style={{ height: '100px' }} />
                  <div className="polaroid-caption" style={{ fontSize: '12px' }}>
                    {(typeof photoUrl === 'object' && photoUrl.caption) || 'Kỷ niệm ✨'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
