import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { StickerDrawer } from './StickerDrawer.jsx';
import { ImagePlus, Trash2, Edit3, Sparkles } from 'lucide-react';

export function ScrapbookBoard({ coupleId }) {
  // Persist photos and board stickers in localStorage for the couple
  const storageKey = `lovecapsule_board_${coupleId || 'default'}`;

  const [photos, setPhotos] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_photos`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default sweet starter photos if brand new
    return [
      {
        id: 'sample-1',
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
        caption: 'Lần đầu đi cà phê cùng nhau ☕',
        rotation: -4,
        tapeStyle: 'pink'
      },
      {
        id: 'sample-2',
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80',
        caption: 'Chuyến đi biển đáng nhớ 🌊',
        rotation: 5,
        tapeStyle: 'mint'
      }
    ];
  });

  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_stickers`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'stk-1', url: 'https://api.iconify.design/fluent-emoji:sparkling-heart.svg', top: '20px', right: '30px' },
      { id: 'stk-2', url: 'https://api.iconify.design/noto:cherry-blossom.svg', bottom: '25px', left: '30px' }
    ];
  });

  const [customStickerList, setCustomStickerList] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_custom_stickers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_photos`, JSON.stringify(photos));
  }, [photos, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_stickers`, JSON.stringify(stickers));
  }, [stickers, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_custom_stickers`, JSON.stringify(customStickerList));
  }, [customStickerList, storageKey]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: res.url,
        caption: 'Kỷ niệm mới của hai bạn 📸',
        rotation: (Math.random() * 10 - 5).toFixed(1),
        tapeStyle: Math.random() > 0.5 ? 'pink' : 'yellow'
      };
      setPhotos([...photos, newPhoto]);
    } catch (err) {
      alert('Không thể tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditCaption = (photoId) => {
    const current = photos.find(p => p.id === photoId);
    const newCaption = prompt('Nhập chú thích cho ảnh Polaroid này:', current ? current.caption : '');
    if (newCaption !== null) {
      setPhotos(photos.map(p => p.id === photoId ? { ...p, caption: newCaption } : p));
    }
  };

  const handleDeletePhoto = (photoId) => {
    if (confirm('Bạn có muốn gỡ tấm ảnh này khỏi bảng kỷ niệm không?')) {
      setPhotos(photos.filter(p => p.id !== photoId));
    }
  };

  const handleAddSticker = (sticker) => {
    const newStk = {
      id: `board-stk-${Date.now()}`,
      url: sticker.url,
      top: `${Math.floor(Math.random() * 60 + 15)}%`,
      left: `${Math.floor(Math.random() * 70 + 15)}%`
    };
    setStickers([...stickers, newStk]);
  };

  const handleRemoveSticker = (stkId) => {
    setStickers(stickers.filter(s => s.id !== stkId));
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: 'var(--shadow-warm)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Góc Kỷ Niệm Của Hai Bạn</span>
            <span style={{ fontSize: '14px' }}>📌</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Dán ảnh thật, viết ghi chú và gắn sticker do chính hai bạn lựa chọn
          </p>
        </div>

        <label style={{
          cursor: 'pointer',
          background: 'var(--rose-primary)',
          color: '#fff',
          borderRadius: '12px',
          padding: '10px 18px',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(224, 109, 126, 0.25)',
          transition: 'transform 0.15s'
        }}>
          <ImagePlus size={16} />
          <span>{uploading ? 'Đang tải...' : '+ Thêm Ảnh Thật'}</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Scrapbook Board Area */}
      <div style={{
        background: '#fffdf9',
        border: '2px dashed #ded2c6',
        borderRadius: '18px',
        minHeight: '360px',
        padding: '30px 20px',
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {/* Floating Board Stickers */}
        {stickers.map(stk => (
          <img
            key={stk.id}
            src={stk.url}
            alt="sticker"
            title="Nhấp đúp để gỡ sticker"
            onDoubleClick={() => handleRemoveSticker(stk.id)}
            style={{
              position: 'absolute',
              top: stk.top,
              left: stk.left,
              right: stk.right,
              bottom: stk.bottom,
              width: '50px',
              height: '50px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
              cursor: 'pointer',
              userSelect: 'none',
              zIndex: 5
            }}
          />
        ))}

        {/* Polaroid Photos */}
        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontWeight: '700' }}>Bảng kỷ niệm đang trống</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Bấm nút "+ Thêm Ảnh Thật" phía trên để lưu giữ kỷ niệm đầu tiên nhé!</div>
          </div>
        ) : (
          photos.map(p => (
            <div
              key={p.id}
              className="polaroid"
              style={{
                width: '180px',
                transform: `rotate(${p.rotation || 0}deg)`,
                zIndex: 2
              }}
            >
              <div 
                className={`washi-tape ${p.tapeStyle === 'mint' ? 'washi-tape-mint' : (p.tapeStyle === 'yellow' ? 'washi-tape-yellow' : '')}`}
              ></div>
              <img src={p.url} alt="memory" className="polaroid-img" />
              <div className="polaroid-caption" title={p.caption}>
                {p.caption}
              </div>

              {/* Action buttons on hover */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => handleEditCaption(p.id)}
                  title="Sửa chú thích"
                  style={{
                    background: '#f4ede4',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '11px',
                    color: '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <Edit3 size={11} /> Sửa chữ
                </button>
                <button
                  onClick={() => handleDeletePhoto(p.id)}
                  title="Gỡ ảnh"
                  style={{
                    background: '#ffebee',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '11px',
                    color: '#c62828',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Sticker Drawer */}
      <StickerDrawer
        onSelectSticker={handleAddSticker}
        customStickers={customStickerList}
        onAddCustomSticker={(newStk) => setCustomStickerList([...customStickerList, newStk])}
      />
    </div>
  );
}
