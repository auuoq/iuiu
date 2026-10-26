import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Plus, Sparkles, Upload } from 'lucide-react';

export const DEFAULT_STICKERS = [
  {
    id: 'heart-sparkle',
    name: 'Trái tim',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23DD2E44" d="M35.885 11.833c0-5.45-4.418-9.868-9.867-9.868-3.308 0-6.227 1.633-8.018 4.129-1.791-2.496-4.71-4.129-8.017-4.129-5.45 0-9.868 4.417-9.868 9.868 0 .772.098 1.52.266 2.241C1.751 22.587 11.216 31.568 18 34.034c6.783-2.466 16.249-11.447 17.617-19.96.17-.721.268-1.469.268-2.241z"/><circle fill="%23FFF" cx="28" cy="8" r="2.5"/><circle fill="%23FFF" cx="32" cy="13" r="1.5"/></svg>'
  },
  {
    id: 'cherry-blossom',
    name: 'Hoa anh đào',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23F4ABA6" d="M18 13c-2-4-7-5-9-2s0 8 4 9c0 0-4 1-5 4s2 6 6 5c0 0 0 4 3 5s6-2 6-6c2 4 7 5 9 2s0-8-4-9c0 0 4-1 5-4s-2-6-6-5c0 0 0-4-3-5s-6 2-6 6z"/><circle fill="%23FFCC4D" cx="18" cy="18" r="3.5"/></svg>'
  },
  {
    id: 'cat-smile',
    name: 'Mèo con',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23F4900C" d="M18 6c-8 0-14 5.5-14 13 0 4.5 2.2 8.5 5.8 11.1L8 34l5.3-2.2c1.5.4 3.1.7 4.7.7 8 0 14-5.5 14-13S26 6 18 6z"/><path fill="%23D96D00" d="M7 6l5 8-7 3zm22 0l-5 8 7 3z"/><circle fill="%23292F33" cx="13" cy="18" r="2"/><circle fill="%23292F33" cx="23" cy="18" r="2"/><ellipse fill="%23DC2F02" cx="18" cy="21" rx="1.5" ry="1"/></svg>'
  },
  {
    id: 'gift-box',
    name: 'Hộp quà',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23DD2E44" d="M32 14H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h28c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2z"/><path fill="%23EA596E" d="M30 14H6v18c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V14z"/><path fill="%23FFCC4D" d="M16 7h4v27h-4z"/><path fill="%23FFCC4D" d="M2 10h32v4H2z"/><path fill="%23FFCC4D" d="M18 8c-2-2-5-4-7-2s0 5 4 5h3zm0 0c2-2 5-4 7-2s0 5-4 5h-3z"/></svg>'
  },
  {
    id: 'ribbon-pink',
    name: 'Nơ hồng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23F4ABA6" d="M18 15c-3-5-9-8-13-4s0 10 7 10h6zm0 0c3-5 9-8 13-4s0 10-7 10h-6z"/><path fill="%23DD2E44" d="M12 21l-4 9 6-2 3-7zm12 0l4 9-6-2-3-7z"/><circle fill="%23E06D7E" cx="18" cy="17" r="4"/></svg>'
  },
  {
    id: 'sparkle-star',
    name: 'Ngôi sao',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23FFD983" d="M18 2l4 11 11 1-8 8 2 11-9-6-9 6 2-11-8-8 11-1z"/><circle fill="%23FFF" cx="18" cy="15" r="2.5"/></svg>'
  },
  {
    id: 'bear-cute',
    name: 'Gấu con',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle fill="%23A06A42" cx="10" cy="11" r="5"/><circle fill="%23DDA87F" cx="10" cy="11" r="2.5"/><circle fill="%23A06A42" cx="26" cy="11" r="5"/><circle fill="%23DDA87F" cx="26" cy="11" r="2.5"/><ellipse fill="%23A06A42" cx="18" cy="20" rx="12" ry="11"/><ellipse fill="%23DDA87F" cx="18" cy="23" rx="5.5" ry="4"/><circle fill="%23292F33" cx="14" cy="18" r="1.5"/><circle fill="%23292F33" cx="22" cy="18" r="1.5"/><ellipse fill="%23292F33" cx="18" cy="21.5" rx="2" ry="1.2"/></svg>'
  },
  {
    id: 'love-letter',
    name: 'Thư tình',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="%23FFF" d="M2 8h32v20H2z"/><path fill="%23E8DCCE" d="M2 8l16 12L34 8z"/><path fill="%23D4A373" d="M2 28l12-10L2 8zm32 0l-12-10 12-10z"/><circle fill="%23DD2E44" cx="18" cy="19" r="4"/></svg>'
  }
];

export function StickerDrawer({ onSelectSticker, customStickers = [], onAddCustomSticker }) {
  const [loading, setLoading] = useState(false);

  const handleCustomUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.uploadFile(file);
      onAddCustomSticker({
        id: `custom-${Date.now()}`,
        url: res.url,
        name: file.name
      });
    } catch (err) {
      alert('Không thể tải sticker: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const allStickers = [...DEFAULT_STICKERS, ...customStickers];

  return (
    <div style={{
      background: '#fcfaf6',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '12px 18px',
      marginTop: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={15} color="var(--rose-primary)" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-ink)' }}>
          Bộ Sticker của hai bạn (bấm để dán lên bảng):
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {allStickers.map(s => (
          <img
            key={s.id}
            src={s.url}
            alt={s.name}
            title={`Bấm để dán "${s.name}" lên bảng`}
            onClick={() => onSelectSticker(s)}
            style={{
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}

        <label style={{
          cursor: 'pointer',
          background: '#fff',
          border: '1px dashed var(--rose-primary)',
          color: 'var(--rose-primary)',
          borderRadius: '10px',
          padding: '6px 12px',
          fontSize: '11.5px',
          fontWeight: '700',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Upload size={13} /> {loading ? 'Đang tải...' : '+ Thêm sticker / meme riêng'}
          <input type="file" accept="image/*" onChange={handleCustomUpload} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
