import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { StickerDrawer, DEFAULT_STICKERS } from './StickerDrawer.jsx';
import {
  ImagePlus,
  Trash2,
  Edit3,
  Sparkles,
  Move,
  RotateCw,
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
  const [rotatingItem, setRotatingItem] = useState(null);
  const [resizingItem, setResizingItem] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const dragRef = useRef(null);
  const rotatingRef = useRef(null);
  const resizingRef = useRef(null);

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
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[data-rotate-handle]') || e.target.closest('[data-resize-handle]')) return;
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

    const dData = {
      type,
      id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      origX: currentX,
      origY: currentY
    };
    dragRef.current = dData;
    setDragItem(dData);

    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  // Free interactive rotation pointer handling
  const handleRotatePointerDown = (e, type, id) => {
    e.stopPropagation();
    const itemEl = e.currentTarget.closest('[data-scrapbook-item]');
    if (!itemEl) return;

    const rect = itemEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rData = {
      type,
      id,
      centerX,
      centerY
    };
    rotatingRef.current = rData;
    setRotatingItem(rData);

    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  // Interactive corner/edge resize pointer handling
  const handleResizePointerDown = (e, type, id, handleType) => {
    e.stopPropagation();
    const itemEl = e.currentTarget.closest('[data-scrapbook-item]');
    if (!itemEl) return;

    const rect = itemEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let currentScale = 1;
    if (type === 'photo') {
      const it = photos.find(p => p.id === id);
      if (it) currentScale = it.scale || 1;
    } else if (type === 'sticker') {
      const it = stickers.find(s => s.id === id);
      if (it) currentScale = it.scale || 1;
    } else if (type === 'note') {
      const it = notes.find(n => n.id === id);
      if (it) currentScale = it.scale || 1;
    }

    const startDist = Math.max(15, Math.hypot(e.clientX - centerX, e.clientY - centerY));

    const resData = {
      type,
      id,
      handleType,
      centerX,
      centerY,
      startDist,
      startScale: currentScale
    };
    resizingRef.current = resData;
    setResizingItem(resData);

    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    const resItem = resizingRef.current;
    if (resItem) {
      const currentDist = Math.hypot(e.clientX - resItem.centerX, e.clientY - resItem.centerY);
      const ratio = currentDist / resItem.startDist;
      let newScale = Number((resItem.startScale * ratio).toFixed(2));
      newScale = Math.min(2.5, Math.max(0.4, newScale));

      if (resItem.type === 'photo') {
        setPhotos(prev => prev.map(p => p.id === resItem.id ? { ...p, scale: newScale } : p));
      } else if (resItem.type === 'sticker') {
        setStickers(prev => prev.map(s => s.id === resItem.id ? { ...s, scale: newScale } : s));
      } else if (resItem.type === 'note') {
        setNotes(prev => prev.map(n => n.id === resItem.id ? { ...n, scale: newScale } : n));
      }
      return;
    }

    const rotItem = rotatingRef.current;
    if (rotItem) {
      const dx = e.clientX - rotItem.centerX;
      const dy = e.clientY - rotItem.centerY;
      let angle = Math.round((Math.atan2(dy, dx) * 180 / Math.PI) + 90);
      if (angle > 180) angle -= 360;
      if (angle < -180) angle += 360;

      // Magnetic snap near straight angles
      if (Math.abs(angle) <= 3) angle = 0;
      else if (Math.abs(angle - 90) <= 2) angle = 90;
      else if (Math.abs(angle + 90) <= 2) angle = -90;

      if (rotItem.type === 'photo') {
        setPhotos(prev => prev.map(p => p.id === rotItem.id ? { ...p, rotation: angle } : p));
      } else if (rotItem.type === 'sticker') {
        setStickers(prev => prev.map(s => s.id === rotItem.id ? { ...s, rotation: angle } : s));
      } else if (rotItem.type === 'note') {
        setNotes(prev => prev.map(n => n.id === rotItem.id ? { ...n, rotation: angle } : n));
      }
      return;
    }

    const dItem = dragRef.current;
    if (!dItem) return;
    const dx = e.clientX - dItem.startPointerX;
    const dy = e.clientY - dItem.startPointerY;
    const newX = Math.max(5, dItem.origX + dx);
    const newY = Math.max(5, dItem.origY + dy);

    if (dItem.type === 'photo') {
      setPhotos(prev => prev.map(p => p.id === dItem.id ? { ...p, x: newX, y: newY } : p));
    } else if (dItem.type === 'sticker') {
      setStickers(prev => prev.map(s => s.id === dItem.id ? { ...s, x: newX, y: newY } : s));
    } else if (dItem.type === 'note') {
      setNotes(prev => prev.map(n => n.id === dItem.id ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handlePointerUp = (e) => {
    let shouldSave = false;
    if (resizingRef.current) {
      if (e?.currentTarget && e.currentTarget.releasePointerCapture) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      resizingRef.current = null;
      setResizingItem(null);
      shouldSave = true;
    }
    if (rotatingRef.current) {
      if (e?.currentTarget && e.currentTarget.releasePointerCapture) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      rotatingRef.current = null;
      setRotatingItem(null);
      shouldSave = true;
    }
    if (dragRef.current) {
      if (e?.currentTarget && e.currentTarget.releasePointerCapture) {
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      dragRef.current = null;
      setDragItem(null);
      shouldSave = true;
    }
    if (shouldSave) {
      broadcastAndSave();
    }
  };

  // Window-level pointer tracking ensures smooth drags everywhere
  useEffect(() => {
    const onWinMove = (e) => {
      if (resizingRef.current || rotatingRef.current || dragRef.current) {
        handlePointerMove(e);
      }
    };
    const onWinUp = (e) => {
      if (resizingRef.current || rotatingRef.current || dragRef.current) {
        handlePointerUp(e);
      }
    };
    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
    };
  }, []);

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

  const handleSetRotation = (type, id, deg) => {
    if (type === 'photo') {
      const updated = photos.map(p => p.id === id ? { ...p, rotation: deg } : p);
      setPhotos(updated);
      broadcastAndSave(updated, undefined, undefined);
    } else if (type === 'sticker') {
      const updated = stickers.map(s => s.id === id ? { ...s, rotation: deg } : s);
      setStickers(updated);
      broadcastAndSave(undefined, updated, undefined);
    } else if (type === 'note') {
      const updated = notes.map(n => n.id === id ? { ...n, rotation: deg } : n);
      setNotes(updated);
      broadcastAndSave(undefined, undefined, updated);
    }
  };

  // Reusable Corner & Edge Resize Handles
  const renderResizeHandles = (type, id) => {
    return (
      <div
        data-resize-handles-container="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 70
        }}
      >
        {/* Corner Handles */}
        {/* Top-Left */}
        <div
          data-resize-handle="tl"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'tl')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo góc để phóng to / thu nhỏ"
          style={{
            position: 'absolute',
            top: '-14px',
            left: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'nwse-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }} />
        </div>

        {/* Top-Right */}
        <div
          data-resize-handle="tr"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'tr')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo góc để phóng to / thu nhỏ"
          style={{
            position: 'absolute',
            top: '-14px',
            right: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'nesw-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }} />
        </div>

        {/* Bottom-Left */}
        <div
          data-resize-handle="bl"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'bl')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo góc để phóng to / thu nhỏ"
          style={{
            position: 'absolute',
            bottom: '-14px',
            left: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'nesw-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }} />
        </div>

        {/* Bottom-Right */}
        <div
          data-resize-handle="br"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'br')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo góc để phóng to / thu nhỏ"
          style={{
            position: 'absolute',
            bottom: '-14px',
            right: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'nwse-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
          }} />
        </div>

        {/* Edge Handles */}
        {/* Left Edge */}
        <div
          data-resize-handle="edge-left"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'edge-left')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo cạnh để chỉnh kích cỡ"
          style={{
            position: 'absolute',
            top: 'calc(50% - 14px)',
            left: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '5px',
            height: '16px',
            borderRadius: '3px',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }} />
        </div>

        {/* Right Edge */}
        <div
          data-resize-handle="edge-right"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'edge-right')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo cạnh để chỉnh kích cỡ"
          style={{
            position: 'absolute',
            top: 'calc(50% - 14px)',
            right: '-14px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '5px',
            height: '16px',
            borderRadius: '3px',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }} />
        </div>

        {/* Bottom Edge */}
        <div
          data-resize-handle="edge-bottom"
          onPointerDown={(e) => handleResizePointerDown(e, type, id, 'edge-bottom')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Kéo cạnh để chỉnh kích cỡ"
          style={{
            position: 'absolute',
            bottom: '-14px',
            left: 'calc(50% - 14px)',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ns-resize',
            pointerEvents: 'auto',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '16px',
            height: '5px',
            borderRadius: '3px',
            background: '#fff',
            border: '2px solid var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }} />
        </div>
      </div>
    );
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
        {/* 1. STICKERS */}
        {stickers.map(stk => {
          const isSelected = selectedItemId?.type === 'sticker' && selectedItemId?.id === stk.id;
          const isDraggingThis = dragItem?.id === stk.id;
          const isRotatingThis = rotatingItem?.id === stk.id;
          const isResizingThis = resizingItem?.id === stk.id;
          const scale = stk.scale || 1;
          const rot = stk.rotation || 0;

          return (
            <div
              key={stk.id}
              data-scrapbook-item="sticker"
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'sticker', id: stk.id }); }}
              onPointerDown={(e) => handlePointerDown(e, 'sticker', stk.id, stk.x, stk.y)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: 'absolute',
                left: `${stk.x}px`,
                top: `${stk.y}px`,
                zIndex: isSelected ? Math.max(stk.zIndex || 10, maxZ + 2) : (stk.zIndex || 10),
                cursor: isDraggingThis ? 'grabbing' : (isRotatingThis ? 'crosshair' : (isResizingThis ? 'nwse-resize' : 'grab')),
                transform: `scale(${isDraggingThis ? scale * 1.05 : scale}) rotate(${rot}deg)`,
                transition: (isDraggingThis || isRotatingThis || isResizingThis) ? 'none' : 'transform 0.15s ease',
                touchAction: 'none'
              }}
            >
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                {/* Free Rotate Handle on Top */}
                {isSelected && (
                  <div
                    data-rotate-handle="true"
                    onPointerDown={(e) => handleRotatePointerDown(e, 'sticker', stk.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleSetRotation('sticker', stk.id, 0);
                    }}
                    title="Kéo để xoay tự do • Nháy đúp để đặt thẳng (0°)"
                    style={{
                      position: 'absolute',
                      top: '-36px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'grab',
                      touchAction: 'none',
                      zIndex: 75
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          border: '2px solid var(--rose-primary)',
                          boxShadow: '0 2px 8px rgba(224, 109, 126, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--rose-primary)'
                        }}
                      >
                        <RotateCw size={11} />
                      </div>

                      {Math.abs(rot) > 0 && (
                        <button
                          type="button"
                          title="Đặt thẳng lại (0°)"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetRotation('sticker', stk.id, 0);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            background: 'var(--rose-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '1px 5px',
                            fontSize: '9px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(224, 109, 126, 0.4)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {rot}° ↺
                        </button>
                      )}
                    </div>
                    <div style={{ width: '2px', height: '8px', background: 'var(--rose-primary)' }} />
                  </div>
                )}

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

                {/* Sticker Selection Outline */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-4px',
                      border: '1.5px dashed var(--rose-primary)',
                      borderRadius: '8px',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                {/* Quick Delete button at Top-Right */}
                {isSelected && (
                  <button
                    type="button"
                    title="Xóa sticker"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSticker(stk.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#fee2e2',
                      border: '1.5px solid #ef4444',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      zIndex: 80
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                {/* Corner & Edge Resize Handles */}
                {isSelected && renderResizeHandles('sticker', stk.id)}
              </div>
            </div>
          );
        })}

        {/* 2. STICKY NOTES */}
        {notes.map(note => {
          const isSelected = selectedItemId?.type === 'note' && selectedItemId?.id === note.id;
          const isDraggingThis = dragItem?.id === note.id;
          const isRotatingThis = rotatingItem?.id === note.id;
          const isResizingThis = resizingItem?.id === note.id;
          const scale = note.scale || 1;
          const rot = note.rotation || 0;

          return (
            <div
              key={note.id}
              data-scrapbook-item="note"
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'note', id: note.id }); }}
              onPointerDown={(e) => handlePointerDown(e, 'note', note.id, note.x, note.y)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`sticky-note sticky-note-${note.color || 'yellow'}`}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                zIndex: isSelected ? Math.max(note.zIndex || 5, maxZ + 2) : (note.zIndex || 5),
                width: '185px',
                cursor: isDraggingThis ? 'grabbing' : (isRotatingThis ? 'crosshair' : (isResizingThis ? 'nwse-resize' : 'grab')),
                transform: `scale(${isDraggingThis ? scale * 1.05 : scale}) rotate(${rot}deg)`,
                transition: (isDraggingThis || isRotatingThis || isResizingThis) ? 'none' : 'transform 0.15s ease',
                touchAction: 'none'
              }}
            >
              {/* Free Rotate Handle on Top */}
              {isSelected && (
                <div
                  data-rotate-handle="true"
                  onPointerDown={(e) => handleRotatePointerDown(e, 'note', note.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleSetRotation('note', note.id, 0);
                  }}
                  title="Kéo để xoay tự do • Nháy đúp để đặt thẳng (0°)"
                  style={{
                    position: 'absolute',
                    top: '-36px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none',
                    zIndex: 75
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid var(--rose-primary)',
                        boxShadow: '0 2px 8px rgba(224, 109, 126, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--rose-primary)'
                      }}
                    >
                      <RotateCw size={12} />
                    </div>

                    {Math.abs(rot) > 0 && (
                      <button
                        type="button"
                        title="Đặt thẳng lại (0°)"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetRotation('note', note.id, 0);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'var(--rose-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(224, 109, 126, 0.4)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {rot}° ↺
                      </button>
                    )}
                  </div>
                  <div style={{ width: '2px', height: '10px', background: 'var(--rose-primary)' }} />
                </div>
              )}

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

              {/* Sticky Note Controls ONLY when Selected */}
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

                  {/* Clean Delete Button */}
                  <button
                    type="button"
                    title="Xóa giấy nhớ"
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c94a5a', padding: '1px 3px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Corner & Edge Resize Handles */}
              {isSelected && renderResizeHandles('note', note.id)}
            </div>
          );
        })}

        {/* 3. POLAROID PHOTOS */}
        {photos.map(photo => {
          const isSelected = selectedItemId?.type === 'photo' && selectedItemId?.id === photo.id;
          const isDraggingThis = dragItem?.id === photo.id;
          const isRotatingThis = rotatingItem?.id === photo.id;
          const isResizingThis = resizingItem?.id === photo.id;
          const scale = photo.scale || 1;
          const rot = photo.rotation || 0;

          return (
            <div
              key={photo.id}
              data-scrapbook-item="photo"
              onClick={(e) => { e.stopPropagation(); setSelectedItemId({ type: 'photo', id: photo.id }); }}
              onPointerDown={(e) => handlePointerDown(e, 'photo', photo.id, photo.x, photo.y)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: 'absolute',
                left: `${photo.x}px`,
                top: `${photo.y}px`,
                zIndex: isSelected ? Math.max(photo.zIndex || 2, maxZ + 2) : (photo.zIndex || 2),
                cursor: isDraggingThis ? 'grabbing' : (isRotatingThis ? 'crosshair' : (isResizingThis ? 'nwse-resize' : 'grab')),
                transform: `scale(${isDraggingThis ? scale * 1.04 : scale}) rotate(${rot}deg)`,
                transition: (isDraggingThis || isRotatingThis || isResizingThis) ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s',
                touchAction: 'none'
              }}
            >
              {/* Free Rotate Handle on Top (Visible ONLY when Selected) */}
              {isSelected && (
                <div
                  data-rotate-handle="true"
                  onPointerDown={(e) => handleRotatePointerDown(e, 'photo', photo.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleSetRotation('photo', photo.id, 0);
                  }}
                  title="Kéo để xoay tự do • Nháy đúp để đặt thẳng (0°)"
                  style={{
                    position: 'absolute',
                    top: '-36px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none',
                    zIndex: 75
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: '2px solid var(--rose-primary)',
                        boxShadow: '0 2px 10px rgba(224, 109, 126, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--rose-primary)',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <RotateCw size={13} />
                    </div>

                    {Math.abs(rot) > 0 && (
                      <button
                        type="button"
                        title="Đặt ảnh thẳng lại (0°)"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetRotation('photo', photo.id, 0);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          background: 'var(--rose-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(224, 109, 126, 0.4)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {rot}° ↺
                      </button>
                    )}
                  </div>
                  <div style={{ width: '2px', height: '8px', background: 'var(--rose-primary)' }} />
                </div>
              )}

              <div
                className="polaroid"
                style={{
                  width: '185px',
                  margin: 0,
                  boxShadow: isDraggingThis ? '0 18px 35px rgba(0,0,0,0.25)' : (isSelected ? '0 10px 25px rgba(224, 109, 126, 0.35)' : 'var(--shadow-warm)'),
                  border: isSelected ? '1.5px solid var(--rose-primary)' : '1px solid rgba(0,0,0,0.06)'
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

                {/* EDITING CONTROLS: ONLY VISIBLE WHEN SELECTED! */}
                {isSelected && (
                  <>
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

                      {/* Clean Delete Button */}
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
                          padding: '3px 8px',
                          color: '#c94a5a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>

                    {/* Extended Color Palette */}
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
                            boxShadow: photo.textColor === c.col ? '0 0 0 1.5px var(--rose-primary)' : 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Corner & Edge Resize Handles */}
              {isSelected && renderResizeHandles('photo', photo.id)}
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
