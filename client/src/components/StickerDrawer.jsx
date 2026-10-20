import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Plus, Sparkles, Upload } from 'lucide-react';

export const DEFAULT_STICKERS = [
  { id: 'heart-sparkle', url: 'https://api.iconify.design/fluent-emoji:sparkling-heart.svg', name: 'Trái tim lấp lánh' },
  { id: 'cherry-blossom', url: 'https://api.iconify.design/noto:cherry-blossom.svg', name: 'Hoa anh đào' },
  { id: 'cat-smile', url: 'https://api.iconify.design/noto:cat-with-wry-smile.svg', name: 'Mèo cười' },
  { id: 'paw-prints', url: 'https://api.iconify.design/noto:paw-prints.svg', name: 'Dấu chân mèo' },
  { id: 'gift-box', url: 'https://api.iconify.design/noto:wrapped-gift.svg', name: 'Hộp quà' },
  { id: 'ribbon-pink', url: 'https://api.iconify.design/noto:ribbon.svg', name: 'Nơ hồng' }
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
          Bộ Sticker của hai bạn:
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
