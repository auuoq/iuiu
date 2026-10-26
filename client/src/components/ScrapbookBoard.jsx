import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { StickerDrawer, DEFAULT_STICKERS } from './StickerDrawer.jsx';
import { ImagePlus, Trash2, Edit3, Sparkles, Move } from 'lucide-react';

export function ScrapbookBoard({ coupleId }) {
  const storageKey = `lovecapsule_board_${coupleId || 'default'}`;
  const boardRef = useRef(null);

  const defaultPhotos = [
    {
      id: 'sample-1',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
      caption: 'Lần đầu đi cà phê cùng nhau ☕',
      x: 30,
      y: 40,
      rotation: -4,
      tapeStyle: 'pink',
      zIndex: 2
    },
    {
      id: 'sample-2',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80',
      caption: 'Chuyến đi biển đáng nhớ 🌊',
      x: 260,
      y: 60,
      rotation: 5,
      tapeStyle: 'mint',
      zIndex: 3
    }
  ];

  const defaultStickers = [
    { id: 'stk-1', url: DEFAULT_STICKERS[0].url, x: 220, y: 20, zIndex: 10 },
    { id: 'stk-2', url: DEFAULT_STICKERS[1].url, x: 60, y: 320, zIndex: 10 }
  ];

  const [photos, setPhotos] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_photos`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p, idx) => ({
          ...p,
          x: typeof p.x === 'number' ? p.x : 30 + (idx % 2) * 230,
          y: typeof p.y === 'number' ? p.y : 40 + (idx % 2) * 50,
          zIndex: p.zIndex || idx + 2
        }));
      } catch (e) {}
    }
    return defaultPhotos;
  });

  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_stickers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s, idx) => ({
          ...s,
          // Replace any old broken external iconify URLs with local crisp SVG
          url: s.url && s.url.includes('api.iconify.design')
            ? DEFAULT_STICKERS[idx % DEFAULT_STICKERS.length].url
            : (s.url || DEFAULT_STICKERS[0].url),
          x: typeof s.x === 'number' ? s.x : 100 + (idx % 3) * 90,
          y: typeof s.y === 'number' ? s.y : 30 + (idx % 3) * 80,
          zIndex: s.zIndex || 15 + idx
        }));
      } catch (e) {}
    }
    return defaultStickers;
  });

  const [customStickerList, setCustomStickerList] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_custom_stickers`);
    return saved ? JSON.parse(saved) : [];
  });

  const [uploading, setUploading] = useState(false);
  const [maxZ, setMaxZ] = useState(25);
  const [dragItem, setDragItem] = useState(null);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_photos`, JSON.stringify(photos));
  }, [photos, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_stickers`, JSON.stringify(stickers));
  }, [stickers, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_custom_stickers`, JSON.stringify(customStickerList));
  }, [customStickerList, storageKey]);

  // Drag & drop pointer handlers
  const handlePointerDown = (e, type, id, currentX, currentY) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    e.stopPropagation();

    const nextZ = maxZ + 1;
    setMaxZ(nextZ);

    if (type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, zIndex: nextZ } : p));
    } else {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, zIndex: nextZ } : s));
    }

    setDragItem({
      type,
      id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      origX: currentX,
      origY: currentY
    });

    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!dragItem) return;
    const dx = e.clientX - dragItem.startPointerX;
    const dy = e.clientY - dragItem.startPointerY;
    const newX = Math.max(10, dragItem.origX + dx);
    const newY = Math.max(10, dragItem.origY + dy);

    if (dragItem.type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === dragItem.id ? { ...p, x: newX, y: newY } : p));
    } else {
      setStickers(prev => prev.map(s => s.id === dragItem.id ? { ...s, x: newX, y: newY } : s));
    }
  };

  const handlePointerUp = (e) => {
    if (dragItem && e.currentTarget && e.currentTarget.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    setDragItem(null);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      const nextZ = maxZ + 1;
      setMaxZ(nextZ);
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: res.url,
        caption: 'Kỷ niệm mới của hai bạn 📸',
        x: Math.floor(Math.random() * 80 + 80),
        y: Math.floor(Math.random() * 80 + 80),
        rotation: (Math.random() * 10 - 5).toFixed(1),
        tapeStyle: Math.random() > 0.5 ? 'pink' : 'yellow',
        zIndex: nextZ
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
    const nextZ = maxZ + 1;
    setMaxZ(nextZ);
    const newStk = {
      id: `board-stk-${Date.now()}`,
      url: sticker.url,
      x: Math.floor(Math.random() * 120 + 100),
      y: Math.floor(Math.random() * 120 + 80),
      zIndex: nextZ
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
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Góc Kỷ Niệm Của Hai Bạn</span>
            <span style={{ fontSize: '14px' }}>📌</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Kéo thả ảnh và sticker tự do để sắp xếp theo ý thích của hai bạn
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

      {/* Scrapbook Board Free Drag Area */}
      <div
        ref={boardRef}
        style={{
          background: '#fffdf9',
          backgroundImage: 'radial-gradient(#eedccb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          border: '2px dashed #ded2c6',
          borderRadius: '18px',
          height: '480px',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Subtle helper instruction */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <Move size={12} color="var(--rose-primary)" />
          <span>Nhấn giữ và kéo thả ảnh hoặc sticker để di chuyển tự do</span>
        </div>

        {/* Draggable Stickers */}
        {stickers.map(stk => (
          <div
            key={stk.id}
            onPointerDown={(e) => handlePointerDown(e, 'sticker', stk.id, stk.x, stk.y)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Nhấp đúp để gỡ sticker hoặc kéo thả di chuyển"
            onDoubleClick={() => handleRemoveSticker(stk.id)}
            style={{
              position: 'absolute',
              left: `${stk.x}px`,
              top: `${stk.y}px`,
              zIndex: stk.zIndex || 10,
              cursor: dragItem?.id === stk.id ? 'grabbing' : 'grab',
              transform: dragItem?.id === stk.id ? 'scale(1.15)' : 'scale(1)',
              transition: dragItem?.id === stk.id ? 'none' : 'transform 0.15s ease',
              touchAction: 'none'
            }}
          >
            <img
              src={stk.url}
              alt="sticker"
              draggable={false}
              style={{
                width: '46px',
                height: '46px',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
                pointerEvents: 'none',
                display: 'block'
              }}
            />
          </div>
        ))}

        {/* Draggable Polaroid Photos */}
        {photos.length === 0 ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>Bảng kỷ niệm chưa có ảnh nào</div>
            <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Bấm nút "+ Thêm Ảnh Thật" ở góc trên để dán ảnh nhé!</div>
          </div>
        ) : (
          photos.map(photo => {
            const isDraggingThis = dragItem?.id === photo.id;
            return (
              <div
                key={photo.id}
                onPointerDown={(e) => handlePointerDown(e, 'photo', photo.id, photo.x, photo.y)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: 'absolute',
                  left: `${photo.x}px`,
                  top: `${photo.y}px`,
                  zIndex: photo.zIndex || 2,
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  transform: isDraggingThis
                    ? `scale(1.04) rotate(${photo.rotation}deg)`
                    : `rotate(${photo.rotation}deg)`,
                  transition: isDraggingThis ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s',
                  touchAction: 'none'
                }}
              >
                <div
                  className="polaroid"
                  style={{
                    width: '190px',
                    margin: 0,
                    boxShadow: isDraggingThis ? '0 15px 30px rgba(0,0,0,0.22)' : 'var(--shadow-warm)'
                  }}
                >
                  {/* Washi Tape at Top */}
                  <div
                    className="washi-tape"
                    style={{
                      width: '60px',
                      height: '18px',
                      background: photo.tapeStyle === 'pink' ? 'var(--tape-pink)' : (photo.tapeStyle === 'mint' ? 'var(--tape-mint)' : 'var(--tape-yellow)')
                    }}
                  />

                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="polaroid-img"
                    draggable={false}
                    style={{ pointerEvents: 'none' }}
                  />

                  <div className="polaroid-caption" style={{ minHeight: '32px' }}>
                    {photo.caption}
                  </div>

                  {/* Actions Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px dashed #eee'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCaption(photo.id);
                      }}
                      style={{
                        background: '#f7efe2',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: 'var(--text-ink)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Edit3 size={11} /> Sửa chữ
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      style={{
                        background: '#fff0f3',
                        border: '1px solid #ffd1dc',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#c94a5a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticker Drawer */}
      <StickerDrawer
        onSelectSticker={handleAddSticker}
        customStickers={customStickerList}
        onAddCustomSticker={(newStk) => setCustomStickerList([...customStickerList, newStk])}
      />
    </div>
  );
}
