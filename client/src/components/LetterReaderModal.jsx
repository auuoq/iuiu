import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Heart, BookmarkCheck, Music, Pause, Play, Sparkles } from 'lucide-react';
import { WAX_EMBLEMS, SCENT_TAGS } from './LetterWriterModal.jsx';

export function LetterReaderModal({ letter, onClose }) {
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

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

  // Play BGM if available
  useEffect(() => {
    if (letter.bgm_track) {
      const audio = new Audio(letter.bgm_track);
      audio.loop = true;
      audio.volume = 0.45;
      audioRef.current = audio;

      audio.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        console.warn('Letter BGM autoplay blocked:', err.message);
      });

      return () => {
        audio.pause();
      };
    }
  }, [letter.bgm_track]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(e => console.warn(e));
    }
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

      <div
        className={getPaperClass()}
        style={{
          borderRadius: '24px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '38px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.22)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-light)',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={22} />
        </button>

        {/* Top Floating Badges: Scent Tag & Mini Vinyl Player */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Scent Tag */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: 'var(--rose-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <span>🌸</span>
            <span>{scent}</span>
          </div>

          {/* Letter BGM Mini Player */}
          {letter.bgm_track && (
            <div
              onClick={toggleMusic}
              title={isPlayingMusic ? 'Bấm để tạm dừng nhạc' : 'Bấm để phát nhạc'}
              style={{
                background: '#fff',
                border: '1px solid var(--rose-border)',
                borderRadius: '20px',
                padding: '4px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(224, 109, 126, 0.15)'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #333 30%, #111 70%, #d4a373 100%)',
                animation: isPlayingMusic ? 'spinVinyl 3s linear infinite' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--rose-primary)' }}>
                {isPlayingMusic ? 'Đang phát giai điệu thư 🎵' : '❚❚ Nhạc thư đã dừng'}
              </span>
            </div>
          )}
        </div>

        {/* Wax Stamp Seal at Top Corner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', borderBottom: '1px dashed rgba(0,0,0,0.12)', paddingBottom: '16px' }}>
          <div className={`wax-seal wax-seal-${waxColor}`} style={{ width: '52px', height: '52px', fontSize: '22px' }}>
            {waxIcon}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase' }}>
              {letter.mood_tag || 'Lá Thư Tình'}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-ink)', letterSpacing: '-0.2px', marginTop: '2px' }}>
              {letter.title}
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
              <span>Từ: <strong>{letter.sender_name}</strong></span>
              <span>•</span>
              <span>Ngày gửi: {new Date(letter.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Decorative Stickers on Reader */}
        {letter.stickers && letter.stickers.map((stk) => (
          <img
            key={stk.id}
            src={stk.url}
            alt="sticker"
            style={{
              position: 'absolute',
              left: `${stk.x}%`,
              top: `${stk.y}%`,
              width: '40px',
              height: '40px',
              transform: `scale(${stk.scale || 1}) rotate(${stk.rotation || 0}deg)`,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.15))'
            }}
          />
        ))}

        {/* Letter Text Content */}
        <div style={{
          fontSize: '18px',
          lineHeight: '1.9',
          color: letter.text_color || 'var(--text-ink)',
          whiteSpace: 'pre-wrap',
          marginBottom: '28px',
          fontFamily: letter.font_family || (letter.paper_style === 'kraft' ? 'Georgia, serif' : 'var(--font-main)')
        }}>
          {letter.content}
        </div>

        {/* Polaroid Photos Attachment */}
        {letter.photos && letter.photos.length > 0 && (
          <div style={{ marginTop: '26px', marginBottom: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Ảnh kỷ niệm đính kèm:
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {letter.photos.map((photoUrl, i) => (
                <div key={i} className="polaroid" style={{ width: '180px', transform: `rotate(${i % 2 === 0 ? '-3deg' : '4deg'})` }}>
                  <div className="washi-tape" style={{ width: '50px', height: '14px' }}></div>
                  <img src={typeof photoUrl === 'string' ? photoUrl : photoUrl.url} alt="polaroid" className="polaroid-img" />
                  <div className="polaroid-caption">
                    {(typeof photoUrl === 'object' && photoUrl.caption) || 'Kỷ niệm của chúng mình ✨'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div style={{
          marginTop: '30px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12.5px',
          color: '#2e7d32'
        }}>
          <BookmarkCheck size={18} flexShrink={0} />
          <span>Lá thư này đã được lưu vĩnh viễn trong Hòm Thư Kỷ Niệm. Bạn có thể mở ra đọc lại bất cứ lúc nào!</span>
        </div>
      </div>
    </div>
  );
}
