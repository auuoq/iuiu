import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { StickerDrawer, DEFAULT_STICKERS } from './StickerDrawer.jsx';
import {
  ImagePlus,
  Trash2,
  Edit3,
  Sparkles,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  StickyNote,
  Palette,
  Check
} from 'lucide-react';

export function ScrapbookBoard({ coupleId, currentUserId, wsRef }) {
  const boardRef = useRef(null);

  const defaultPhotos = [
    {
      id: 'sample-1',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop&q=80',
      caption: 'Lần đầu đi cà phê cùng nhau ☕',
      textColor: '#2b2621',
      x: 40,
      y: 50,
      rotation: -4,
      scale: 1,
      tapeStyle: 'pink',
      zIndex: 2
    },
    {
      id: 'sample-2',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80',
      caption: 'Chuyến đi biển đáng nhớ 🌊',
      textColor: '#2b2621',
      x: 320,
      y: 55,
      rotation: 4,
      scale: 1,
      tapeStyle: 'mint',
      zIndex: 3
    }
  ];

  const defaultStickers = [
    { id: 'stk-1', url: DEFAULT_STICKERS[0].url, x: 280, y: 30, rotation: 6, scale: 1, zIndex: 10 },
    { id: 'stk-2', url: DEFAULT_STICKERS[1].url, x: 860, y: 220, rotation: -8, scale: 1, zIndex: 10 }
  ];

  const defaultNotes = [
    {
      id: 'note-1',
      text: 'Hôm nay nhớ em nhiều lắm! Nhớ ăn tối đúng giờ nha ❤️',
      color: 'yellow',
      x: 600,
      y: 100,
      rotation: -2,
      scale: 1,
      zIndex: 5
    }
  ];

  const [photos, setPhotos] = useState(defaultPhotos);
  const [stickers, setStickers] = useState(defaultStickers);
  const [notes, setNotes] = useState(defaultNotes);
  const [selectedItemId, setSelectedItemId] = useState(null); // { type, id }

  const [customStickerList, setCustomStickerList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [maxZ, setMaxZ] = useState(30);
  const [dragItem, setDragItem] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load from server on mount
  useEffect(() => {
    let isMounted = true;
    api.getScrapbook().then(data => {
      if (!isMounted) return;
      if (data && (data.photos?.length || data.stickers?.length || data.notes?.length)) {
        if (data.photos) setPhotos(data.photos);
        if (data.stickers) setStickers(data.stickers);
        if (data.notes) setNotes(data.notes);
      }
    }).catch(e => console.warn('Fetch scrapbook error:', e));

    return () => { isMounted = false; };
  }, [coupleId]);

  // Real-time synchronization event listener from WebSocket
  useEffect(() => {
    const handleSync = (e) => {
      const { boardState, sender_id } = e.detail;
      if (sender_id && sender_id === currentUserId) return; // Ignore own echoes
      if (boardState) {
        setIsSyncing(true);
        if (boardState.photos) setPhotos(boardState.photos);
        if (boardState.stickers) setStickers(boardState.stickers);
        if (boardState.notes) setNotes(boardState.notes);
        setTimeout(() => setIsSyncing(false), 800);
      }
    };
    window.addEventListener('lovecapsule_scrapbook_sync', handleSync);
    return () => window.removeEventListener('lovecapsule_scrapbook_sync', handleSync);
  }, [currentUserId]);

  // Save to DB and broadcast over WS
  const broadcastAndSave = (newPhotos, newStickers, newNotes) => {
    const p = newPhotos !== undefined ? newPhotos : photos;
    const s = newStickers !== undefined ? newStickers : stickers;
    const n = newNotes !== undefined ? newNotes : notes;

    // Instant WebSocket broadcast for 0ms lag
    if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'scrapbook_update',
        couple_id: coupleId,
        sender_id: currentUserId,
        boardState: { photos: p, stickers: s, notes: n }
      }));
    }

    // Persist to server database
    api.saveScrapbook({ photos: p, stickers: s, notes: n }).catch(err => {
      console.warn('Scrapbook server save error:', err.message);
    });
  };

  // Pointer drag handling
  const handlePointerDown = (e, type, id, currentX, currentY) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
    e.stopPropagation();

    const nextZ = maxZ + 1;
    setMaxZ(nextZ);
    setSelectedItemId({ type, id });

    if (type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, zIndex: nextZ } : p));
    } else if (type === 'sticker') {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, zIndex: nextZ } : s));
    } else if (type === 'note') {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: nextZ } : n));
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
    const newX = Math.max(5, dragItem.origX + dx);
    const newY = Math.max(5, dragItem.origY + dy);

    if (dragItem.type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === dragItem.id ? { ...p, x: newX, y: newY } : p));
    } else if (dragItem.type === 'sticker') {
      setStickers(prev => prev.map(s => s.id === dragItem.id ? { ...s, x: newX, y: newY } : s));
    } else if (dragItem.type === 'note') {
      setNotes(prev => prev.map(n => n.id === dragItem.id ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handlePointerUp = (e) => {
    if (dragItem && e.currentTarget && e.currentTarget.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (dragItem) {
      broadcastAndSave();
    }
    setDragItem(null);
  };

  // Upload Photo
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
        textColor: '#2b2621',
        x: Math.floor(Math.random() * 80 + 40),
        y: Math.floor(Math.random() * 80 + 40),
        rotation: Number((Math.random() * 10 - 5).toFixed(1)),
        scale: 1,
        tapeStyle: Math.random() > 0.5 ? 'pink' : 'yellow',
        zIndex: nextZ
      };
      const updated = [...photos, newPhoto];
      setPhotos(updated);
      setSelectedItemId({ type: 'photo', id: newPhoto.id });
      broadcastAndSave(updated, undefined, undefined);
    } catch (err) {
      alert('Không thể tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Add Sticky Note
  const handleAddStickyNote = (color = 'yellow') => {
    const nextZ = maxZ + 1;
    setMaxZ(nextZ);
    const newNote = {
      id: `note-${Date.now()}`,
      text: 'Viết lời nhắn yêu thương vào đây...',
      color,
      x: Math.floor(Math.random() * 100 + 80),
      y: Math.floor(Math.random() * 100 + 100),
      rotation: Number((Math.random() * 8 - 4).toFixed(1)),
      scale: 1,
      zIndex: nextZ
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    setSelectedItemId({ type: 'note', id: newNote.id });
    broadcastAndSave(undefined, undefined, updated);
  };

  // Add Sticker
  const handleAddSticker = (sticker) => {
    const nextZ = maxZ + 1;
    setMaxZ(nextZ);
    const newStk = {
      id: `board-stk-${Date.now()}`,
      url: sticker.url,
      x: Math.floor(Math.random() * 120 + 80),
      y: Math.floor(Math.random() * 120 + 60),
      rotation: Number((Math.random() * 16 - 8).toFixed(1)),
      scale: 1,
      zIndex: nextZ
    };
    const updated = [...stickers, newStk];
    setStickers(updated);
    setSelectedItemId({ type: 'sticker', id: newStk.id });
    broadcastAndSave(undefined, updated, undefined);
  };

  // Transform controls: Zoom, Rotate
  const handleAdjustScale = (type, id, delta) => {
    if (type === 'photo') {
      const updated = photos.map(p => {
        if (p.id !== id) return p;
        const newScale = Math.min(1.6, Math.max(0.65, Number(((p.scale || 1) + delta).toFixed(2))));
        return { ...p, scale: newScale };
      });
      setPhotos(updated);
      broadcastAndSave(updated, undefined, undefined);
    } else if (type === 'sticker') {
      const updated = stickers.map(s => {
        if (s.id !== id) return s;
        const newScale = Math.min(1.8, Math.max(0.6, Number(((s.scale || 1) + delta).toFixed(2))));
        return { ...s, scale: newScale };
      });
      setStickers(updated);
      broadcastAndSave(undefined, updated, undefined);
    } else if (type === 'note') {
      const updated = notes.map(n => {
        if (n.id !== id) return n;
        const newScale = Math.min(1.6, Math.max(0.7, Number(((n.scale || 1) + delta).toFixed(2))));
        return { ...n, scale: newScale };
      });
      setNotes(updated);
      broadcastAndSave(undefined, undefined, updated);
    }
  };

  const handleAdjustRotation = (type, id, deg) => {
    if (type === 'photo') {
      const updated = photos.map(p => p.id === id ? { ...p, rotation: ((p.rotation || 0) + deg) % 360 } : p);
      setPhotos(updated);
      broadcastAndSave(updated, undefined, undefined);
    } else if (type === 'sticker') {
      const updated = stickers.map(s => s.id === id ? { ...s, rotation: ((s.rotation || 0) + deg) % 360 } : s);
      setStickers(updated);
      broadcastAndSave(undefined, updated, undefined);
    } else if (type === 'note') {
      const updated = notes.map(n => n.id === id ? { ...n, rotation: ((n.rotation || 0) + deg) % 360 } : n);
      setNotes(updated);
      broadcastAndSave(undefined, undefined, updated);
    }
  };

  // Edit Caption & Text Color
  const handleEditCaption = (photoId) => {
    const current = photos.find(p => p.id === photoId);
    const newCaption = prompt('Nhập chú thích mới cho ảnh Polaroid:', current ? current.caption : '');
    if (newCaption !== null) {
      const updated = photos.map(p => p.id === photoId ? { ...p, caption: newCaption } : p);
      setPhotos(updated);
      broadcastAndSave(updated, undefined, undefined);
    }
  };

  const handleChangePhotoColor = (photoId, color) => {
    const updated = photos.map(p => p.id === photoId ? { ...p, textColor: color } : p);
    setPhotos(updated);
    broadcastAndSave(updated, undefined, undefined);
  };

  const handleChangeTape = (photoId) => {
    const tapes = ['pink', 'mint', 'yellow'];
    const updated = photos.map(p => {
      if (p.id !== photoId) return p;
      const curIdx = tapes.indexOf(p.tapeStyle || 'pink');
      const nextTape = tapes[(curIdx + 1) % tapes.length];
      return { ...p, tapeStyle: nextTape };
    });
    setPhotos(updated);
    broadcastAndSave(updated, undefined, undefined);
  };

  const handleDeletePhoto = (photoId) => {
    if (confirm('Bạn có muốn gỡ tấm ảnh này khỏi bảng kỷ niệm không?')) {
      const updated = photos.filter(p => p.id !== photoId);
      setPhotos(updated);
      if (selectedItemId?.id === photoId) setSelectedItemId(null);
      broadcastAndSave(updated, undefined, undefined);
    }
  };

  // Note updates
  const handleUpdateNoteText = (noteId, text) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, text } : n);
    setNotes(updated);
  };

  const handleFinishNoteEdit = () => {
    broadcastAndSave(undefined, undefined, notes);
  };

  const handleChangeNoteColor = (noteId, color) => {
    const updated = notes.map(n => n.id === noteId ? { ...n, color } : n);
    setNotes(updated);
    broadcastAndSave(undefined, undefined, updated);
  };

  const handleDeleteNote = (noteId) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    if (selectedItemId?.id === noteId) setSelectedItemId(null);
    broadcastAndSave(undefined, undefined, updated);
  };

  const handleDeleteSticker = (stkId) => {
    const updated = stickers.filter(s => s.id !== stkId);
    setStickers(updated);
    if (selectedItemId?.id === stkId) setSelectedItemId(null);
    broadcastAndSave(undefined, updated, undefined);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: 'var(--shadow-warm)'
    }}>
      {/* Header & Controls */}
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
            <span style={{ fontSize: '15px' }}>📌</span>
            {isSyncing && (
              <span style={{ fontSize: '11.5px', color: 'var(--rose-primary)', fontWeight: '700', background: 'var(--rose-light)', padding: '2px 8px', borderRadius: '10px' }}>
                ✨ Đang đồng bộ...
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '2px' }}>
            Kéo thả, phóng to thu nhỏ, xoay nghiêng &amp; dán giấy nhớ — Đồng bộ thời gian thực
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Add Sticky Note */}
          <button
            type="button"
            onClick={() => handleAddStickyNote('yellow')}
            style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '9px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <StickyNote size={14} /> + Thêm Giấy Nhớ
          </button>

          {/* Add Real Photo */}
          <label style={{
            cursor: 'pointer',
            background: 'var(--rose-primary)',
            color: '#fff',
            borderRadius: '12px',
            padding: '9px 16px',
            fontSize: '12.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(224, 109, 126, 0.25)',
            transition: 'transform 0.15s'
          }}>
            <ImagePlus size={15} />
            <span>{uploading ? 'Đang tải...' : '+ Thêm Ảnh Thật'}</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Scrapbook Board Free Drag Area */}
      <div
        ref={boardRef}
        onClick={() => setSelectedItemId(null)}
        style={{
          background: '#fffdf9',
          backgroundImage: 'radial-gradient(#ebdcd0 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          border: '2px dashed #dfd3c5',
          borderRadius: '20px',
          minHeight: '520px',
          height: '560px',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Helper instruction badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <Move size={11} color="var(--rose-primary)" />
          <span>Kéo thả để di chuyển • Chọn ảnh/note để phóng to, xoay nghiêng hoặc đổi màu</span>
        </div>

        {/* 1. STICKERS */}
        {stickers.map(stk => {
          const isSelected = selectedItemId?.type === 'sticker' && selectedItemId?.id === stk.id;
          const isDraggingThis = dragItem?.id === stk.id;
          const scale = stk.scale || 1;
          const rot = stk.rotation || 0;

          return (
            <div
              key={stk.id}
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'sticker', id: stk.id }); }}
              onPointerDown={(e) => handlePointerDown(e, 'sticker', stk.id, stk.x, stk.y)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: 'absolute',
                left: `${stk.x}px`,
                top: `${stk.y}px`,
                zIndex: stk.zIndex || 10,
                cursor: isDraggingThis ? 'grabbing' : 'grab',
                transform: `scale(${isDraggingThis ? scale * 1.1 : scale}) rotate(${rot}deg)`,
                transition: isDraggingThis ? 'none' : 'transform 0.15s ease',
                touchAction: 'none'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={stk.url}
                  alt="sticker"
                  draggable={false}
                  style={{
                    width: '48px',
                    height: '48px',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
                    pointerEvents: 'none',
                    display: 'block'
                  }}
                />

                {/* Sticker floating toolbar when selected */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '-36px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      zIndex: 100
                    }}
                  >
                    <button
                      type="button"
                      title="Thu nhỏ"
                      onClick={() => handleAdjustScale('sticker', stk.id, -0.15)}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      type="button"
                      title="Phóng to"
                      onClick={() => handleAdjustScale('sticker', stk.id, 0.15)}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
                    >
                      <ZoomIn size={12} />
                    </button>
                    <button
                      type="button"
                      title="Xoay nghiêng"
                      onClick={() => handleAdjustRotation('sticker', stk.id, 12)}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-ink)' }}
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      type="button"
                      title="Xóa sticker"
                      onClick={() => handleDeleteSticker(stk.id)}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: '#c94a5a' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 2. STICKY NOTES */}
        {notes.map(note => {
          const isSelected = selectedItemId?.type === 'note' && selectedItemId?.id === note.id;
          const isDraggingThis = dragItem?.id === note.id;
          const scale = note.scale || 1;
          const rot = note.rotation || 0;

          return (
            <div
              key={note.id}
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'note', id: note.id }); }}
              onPointerDown={(e) => handlePointerDown(e, 'note', note.id, note.x, note.y)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`sticky-note sticky-note-${note.color || 'yellow'}`}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                zIndex: note.zIndex || 5,
                width: '185px',
                cursor: isDraggingThis ? 'grabbing' : 'grab',
                transform: `scale(${isDraggingThis ? scale * 1.05 : scale}) rotate(${rot}deg)`,
                transition: isDraggingThis ? 'none' : 'transform 0.15s ease',
                touchAction: 'none'
              }}
            >
              {/* Tape sticker at top of note */}
              <div
                className="washi-tape"
                style={{
                  width: '45px',
                  height: '12px',
                  top: '-6px',
                  background: 'rgba(255,255,255,0.65)'
                }}
              />

              {/* Editable Text Area */}
              <textarea
                value={note.text}
                onChange={(e) => handleUpdateNoteText(note.id, e.target.value)}
                onBlur={handleFinishNoteEdit}
                placeholder="Ghi lời nhắn ở đây..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '17px',
                  lineHeight: '1.45',
                  color: 'inherit',
                  cursor: 'text'
                }}
              />

              {/* Sticky Note Controls when Selected */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px dashed rgba(0,0,0,0.15)'
                  }}
                >
                  {/* Color Pickers */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['yellow', 'pink', 'mint', 'blue'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleChangeNoteColor(note.id, col)}
                        style={{
                          width: '15px',
                          height: '15px',
                          borderRadius: '50%',
                          border: note.color === col ? '1.5px solid #000' : '1px solid rgba(0,0,0,0.2)',
                          background: col === 'yellow' ? '#fdf3a9' : (col === 'pink' ? '#ffd9e2' : (col === 'mint' ? '#d2f2df' : '#d8ecf8')),
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      type="button"
                      title="Thu nhỏ"
                      onClick={() => handleAdjustScale('note', note.id, -0.1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      type="button"
                      title="Phóng to"
                      onClick={() => handleAdjustScale('note', note.id, 0.1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      <ZoomIn size={12} />
                    </button>
                    <button
                      type="button"
                      title="Xoay nghiêng"
                      onClick={() => handleAdjustRotation('note', note.id, 5)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      type="button"
                      title="Xóa giấy nhớ"
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c94a5a' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 3. POLAROID PHOTOS */}
        {photos.map(photo => {
          const isSelected = selectedItemId?.type === 'photo' && selectedItemId?.id === photo.id;
          const isDraggingThis = dragItem?.id === photo.id;
          const scale = photo.scale || 1;
          const rot = photo.rotation || 0;

          return (
            <div
              key={photo.id}
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'photo', id: photo.id }); }}
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
                transform: `scale(${isDraggingThis ? scale * 1.04 : scale}) rotate(${rot}deg)`,
                transition: isDraggingThis ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s',
                touchAction: 'none'
              }}
            >
              <div
                className="polaroid"
                style={{
                  width: '185px',
                  margin: 0,
                  boxShadow: isDraggingThis ? '0 18px 35px rgba(0,0,0,0.25)' : (isSelected ? '0 10px 25px rgba(224, 109, 126, 0.35)' : 'var(--shadow-warm)'),
                  border: isSelected ? '1px solid var(--rose-primary)' : 'none'
                }}
              >
                {/* Washi Tape at Top */}
                <div
                  onClick={(e) => { e.stopPropagation(); handleChangeTape(photo.id); }}
                  title="Bấm để đổi màu băng dính Washi Tape"
                  className="washi-tape"
                  style={{
                    width: '60px',
                    height: '17px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
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

                {/* Caption with customizable text color */}
                <div
                  className="polaroid-caption"
                  style={{
                    minHeight: '28px',
                    color: photo.textColor || '#3b332b',
                    fontSize: '16px'
                  }}
                >
                  {photo.caption}
                </div>

                {/* Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px',
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
                      padding: '3px 7px',
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

                  {/* Quick Rotate & Scale & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <button
                      type="button"
                      title="Xoay nghiêng"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustRotation('photo', photo.id, 5);
                      }}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-ink)' }}
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      type="button"
                      title="Thu nhỏ"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustScale('photo', photo.id, -0.1);
                      }}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-ink)' }}
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      type="button"
                      title="Phóng to"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustScale('photo', photo.id, 0.1);
                      }}
                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-ink)' }}
                    >
                      <ZoomIn size={12} />
                    </button>
                    <button
                      type="button"
                      title="Xóa ảnh"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      style={{
                        background: '#fff0f3',
                        border: '1px solid #ffd1dc',
                        borderRadius: '6px',
                        padding: '3px 6px',
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

                {/* Extended Color Palette when Selected */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      paddingTop: '4px',
                      borderTop: '1px dotted #ebdcd0'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Màu chữ:</span>
                    {[
                      { col: '#2b2621', label: 'Nâu đen' },
                      { col: '#e06d7e', label: 'Hồng' },
                      { col: '#1e3a8a', label: 'Xanh' },
                      { col: '#8b1e2c', label: 'Đỏ rượu' }
                    ].map(c => (
                      <button
                        key={c.col}
                        type="button"
                        onClick={() => handleChangePhotoColor(photo.id, c.col)}
                        style={{
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          background: c.col,
                          border: photo.textColor === c.col ? '2px solid #fff' : 'none',
                          boxShadow: photo.textColor === c.col ? '0 0 0 1px #000' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
