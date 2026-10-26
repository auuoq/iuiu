import React from 'react';
import { X, Calendar, Heart, BookmarkCheck } from 'lucide-react';

export function LetterReaderModal({ letter, onClose }) {
  const getPaperBackground = () => {
    switch (letter.paper_style) {
      case 'kraft': return '#f7efe2';
      case 'pink_pastel': return '#fff5f7';
      case 'caro_grid': return '#ffffff';
      default: return '#fcfaf6';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: getPaperBackground(),
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '36px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-light)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Wax Stamp Seal at Top Corner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '16px' }}>
          <div className="wax-seal" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
            ❤️
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-ink)', letterSpacing: '-0.2px' }}>
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
              width: '38px',
              height: '38px',
              transform: `rotate(${stk.rotation || 0}deg)`,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.15))'
            }}
          />
        ))}

        {/* Letter Text Content */}
        <div style={{
          fontSize: '17px',
          lineHeight: '1.85',
          color: letter.text_color || 'var(--text-ink)',
          whiteSpace: 'pre-wrap',
          marginBottom: '28px',
          fontFamily: letter.font_family || (letter.paper_style === 'kraft' ? 'Georgia, serif' : 'var(--font-main)')
        }}>
          {letter.content}
        </div>

        {/* Polaroid Photos Attachment */}
        {letter.photos && letter.photos.length > 0 && (
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Ảnh kỷ niệm đính kèm:
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {letter.photos.map((photoUrl, i) => (
                <div key={i} className="polaroid" style={{ width: '180px', transform: `rotate(${i % 2 === 0 ? '-3deg' : '4deg'})` }}>
                  <div className="washi-tape" style={{ width: '50px', height: '14px' }}></div>
                  <img src={photoUrl} alt="polaroid" className="polaroid-img" />
                  <div className="polaroid-caption">Kỷ niệm của chúng mình ✨</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div style={{
          marginTop: '30px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12.5px',
          color: '#2e7d32'
        }}>
          <BookmarkCheck size={18} flexShrink={0} />
          <span>Lá thư này đã được lưu vĩnh viễn trong Kho Kỷ Niệm. Bạn có thể mở ra đọc lại bất cứ lúc nào mà không mất thêm tim!</span>
        </div>
      </div>
    </div>
  );
}
