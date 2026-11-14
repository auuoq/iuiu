import React, { useState, useRef } from 'react';
import { api } from '../api/client.js';
import {
  X, Image, Sparkles, HelpCircle, Calendar, Heart, Upload, Archive, Send,
  Eye, Edit3, Type, Palette, Smile, Music, Play, Pause, Volume2, Move,
  ZoomIn, ZoomOut, RotateCw, Trash2, Plus, Sliders, Mail
} from 'lucide-react';
import { DEFAULT_STICKERS } from './StickerDrawer.jsx';
import { ROMANTIC_PLAYLIST } from './AudioPlayer.jsx';
import { PostageStamp, STAMP_DESIGNS, ENVELOPE_THEMES } from './PostageStamp.jsx';

export const PAPER_THEMES = [
  { id: 'kraft', name: 'Giấy Da Cổ Điển 📜', className: 'paper-kraft-vintage' },
  { id: 'pressed_flowers', name: 'Cánh Hoa Hồng Ép 🌸', className: 'paper-pressed-flowers' },
  { id: 'caro_ribbon', name: 'Kẻ Ô Ruy Băng 🎀', className: 'paper-caro-ribbon' },
  { id: 'starry', name: 'Bầu Trời Sao ✨', className: 'paper-starry-night' },
  { id: 'coffee', name: 'Cà Phê & Sách Ấm ☕', className: 'paper-warm-coffee' }
];

export const WAX_SEAL_COLORS = [
  { id: 'red', name: 'Đỏ Ruby', className: 'wax-seal-red' },
  { id: 'gold', name: 'Vàng Gold', className: 'wax-seal-gold' },
  { id: 'pink', name: 'Hồng Pastel', className: 'wax-seal-pink' },
  { id: 'purple', name: 'Tím Rượu', className: 'wax-seal-purple' }
];

export const WAX_EMBLEMS = [
  { id: 'heart', icon: '❤️', label: 'Trái tim' },
  { id: 'rose', icon: '🌹', label: 'Hoa hồng' },
  { id: 'butterfly', icon: '🦋', label: 'Cánh bướm' },
  { id: 'lock', icon: '🔒', label: 'Ổ khóa' }
];

export const SCENT_TAGS = [
  { id: 'rose', label: 'Hương hoa hồng sớm 🌹' },
  { id: 'coffee', label: 'Mùi cà phê ấm áp ☕' },
  { id: 'vanilla', label: 'Hương vani ngọt ngào 🍦' },
  { id: 'rain', label: 'Hương mưa đêm êm dịu 🌧️' },
  { id: 'jasmine', label: 'Hương hoa nhài thơm 🌼' }
];

export const FONT_OPTIONS = [
  { id: "'Caveat', cursive, sans-serif", name: 'Viết tay mộc mạc (Caveat)' },
  { id: "'Dancing Script', cursive", name: 'Viết tay uốn lượn (Dancing Script)' },
  { id: "'Pacifico', cursive", name: 'Nét chữ tròn ngọt ngào (Pacifico)' },
  { id: "'Great Vibes', cursive", name: 'Thư pháp hoàng gia (Great Vibes)' },
  { id: "'Playfair Display', Georgia, serif", name: 'Cổ điển thanh lịch (Playfair)' },
  { id: "'Comfortaa', cursive", name: 'Tròn trịa ấm cúng (Comfortaa)' },
  { id: "'Quicksand', sans-serif", name: 'Tươi trẻ nhẹ nhàng (Quicksand)' },
  { id: "'Merriweather', serif", name: 'Văn học hoài niệm (Merriweather)' },
  { id: 'var(--font-main)', name: 'Hiện đại dễ đọc (Sans-serif)' }
];

export const COLOR_PRESETS = [
  { hex: '#2b2621', name: 'Nâu cà phê' },
  { hex: '#8b1e2c', name: 'Đỏ rượu vang' },
  { hex: '#d4526e', name: 'Hồng đào' },
  { hex: '#1b3b6f', name: 'Xanh Navy' },
  { hex: '#2d5a3f', name: 'Xanh rêu' },
  { hex: '#5e3a75', name: 'Tím Lavender' },
  { hex: '#9c6515', name: 'Vàng hổ phách' },
  { hex: '#111111', name: 'Đen mực tàu' }
];

export const ANIMATED_STICKERS = [
  {
    id: 'anim-heart',
    name: 'Tim Đập Rộn Ràng',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@keyframes pulse{0%,100%{transform:scale(0.85);transform-origin:center;}50%{transform:scale(1.18);transform-origin:center;}}path{animation:pulse 0.9s infinite ease-in-out;}</style><path fill="%23e06d7e" d="M50 88s-35-22-35-46a20 20 0 0 1 35-12 20 20 0 0 1 35 12c0 24-35 46-35 46z"/><circle fill="%23fff" cx="35" cy="35" r="4"/></svg>'
  },
  {
    id: 'anim-sparkle',
    name: 'Sao Lấp Lánh',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@keyframes spin{0%{transform:rotate(0deg) scale(0.9);transform-origin:center;}50%{transform:rotate(180deg) scale(1.15);transform-origin:center;}100%{transform:rotate(360deg) scale(0.9);transform-origin:center;}}polygon{animation:spin 3s infinite linear;}</style><polygon fill="%23f7b731" points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"/></svg>'
  },
  {
    id: 'anim-sakura',
    name: 'Cánh Hoa Bay',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@keyframes float{0%,100%{transform:translateY(0) rotate(0deg);transform-origin:center;}50%{transform:translateY(-8px) rotate(18deg);transform-origin:center;}}path{animation:float 2.2s infinite ease-in-out;}</style><path fill="%23fd79a8" d="M50 15c-10-15-25 5-10 20s20 20 20 20 5-5 20-20-10-35-20-20-5 5-10 0z"/><circle fill="%23ffeaa7" cx="50" cy="50" r="7"/></svg>'
  },
  {
    id: 'anim-envelope',
    name: 'Bao Thư Tình',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}g{animation:bounce 1.4s infinite ease-in-out;}</style><g><rect fill="%23fab1a0" x="10" y="30" width="80" height="55" rx="8"/><polygon fill="%23ff7675" points="10,30 50,60 90,30"/><path fill="%23d63031" d="M50 48c-3-6-10-4-10 1 0 7 10 13 10 13s10-6 10-13c0-5-7-7-10-1z"/></g></svg>'
  },
  {
    id: 'anim-cat',
    name: 'Mèo Ôm Tim',
    url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif'
  },
  {
    id: 'anim-bear',
    name: 'Gấu Nhảy Múa',
    url: 'https://media.giphy.com/media/kZqbBT64ECtjy/giphy.gif'
  }
];

export function LetterWriterModal({ partner, letterToEdit = null, initialMilestone = null, existingCategories = [], onClose, onLetterSaved }) {
  const isEditing = Boolean(letterToEdit);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'decor' | 'envelope'

  const [milestoneId, setMilestoneId] = useState(letterToEdit?.milestone_id || initialMilestone?.id || null);

  // Letter Basic Content
  const [title, setTitle] = useState(() => {
    if (letterToEdit?.title) return letterToEdit.title;
    if (initialMilestone?.title) return `Gửi ${partner?.display_name || 'người ấy'} nhân dịp ${initialMilestone.title}`;
    return '';
  });
  const [moodTag, setMoodTag] = useState(() => {
    if (letterToEdit?.mood_tag) return letterToEdit.mood_tag;
    if (initialMilestone?.title) return initialMilestone.title;
    return 'Mở khi nhớ nhau';
  });
  const [content, setContent] = useState(letterToEdit?.content || '');
  const [paperStyle, setPaperStyle] = useState(letterToEdit?.paper_style || 'kraft');
  const [fontFamily, setFontFamily] = useState(letterToEdit?.font_family || "'Caveat', cursive, sans-serif");
  const [textColor, setTextColor] = useState(letterToEdit?.text_color || '#2b2621');

  // Wax seal & Scent
  const [waxColor, setWaxColor] = useState(letterToEdit?.wax_seal?.color || 'red');
  const [waxEmblem, setWaxEmblem] = useState(letterToEdit?.wax_seal?.emblem || 'heart');
  const [scentTag, setScentTag] = useState(letterToEdit?.scent_tag || 'rose');

  // Background Music for Letter
  const [bgmTrack, setBgmTrack] = useState(letterToEdit?.bgm_track || ROMANTIC_PLAYLIST[0].url);
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  // Outer Envelope & Postage Stamp
  const [envelopeColor, setEnvelopeColor] = useState(letterToEdit?.envelope_config?.color || 'dusty_rose');
  const [stampDesign, setStampDesign] = useState(letterToEdit?.envelope_config?.stamp_design || 'rose');
  const [stampImage, setStampImage] = useState(letterToEdit?.envelope_config?.stamp_image || null);
  const [envelopeViewSide, setEnvelopeViewSide] = useState('front'); // 'front' | 'back'

  // Custom Letter Paper Background
  const [bgImage, setBgImage] = useState(letterToEdit?.bg_image || null);
  const [bgOpacity, setBgOpacity] = useState(0.2);

  // Photos & Decorative Draggable Stickers / GIFs
  const [photos, setPhotos] = useState(() => {
    if (letterToEdit?.photos) {
      return letterToEdit.photos.map(p => typeof p === 'string' ? { url: p, caption: 'Kỷ niệm của hai đứa 📸' } : p);
    }
    return [];
  });

  const [letterStickers, setLetterStickers] = useState(() => {
    if (letterToEdit?.stickers && letterToEdit.stickers.length > 0) {
      return letterToEdit.stickers;
    }
    return [
      { id: 'stk-1', url: DEFAULT_STICKERS[0].url, x: 80, y: 15, scale: 1, rotation: 6 },
      { id: 'stk-2', url: DEFAULT_STICKERS[1].url, x: 12, y: 78, scale: 1, rotation: -8 }
    ];
  });

  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [selectedStickerTab, setSelectedStickerTab] = useState('classic'); // 'classic' | 'animated'
  const canvasRef = useRef(null);
  const dragInfoRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, itemId: null });

  // Letter Lock and Unlock Rules
  const [openHeartCost, setOpenHeartCost] = useState(letterToEdit?.open_heart_cost ?? 5);
  const [timeLockAt, setTimeLockAt] = useState(() => {
    if (letterToEdit?.time_lock_at) {
      try {
        const d = new Date(letterToEdit.time_lock_at);
        return d.toISOString().slice(0, 16);
      } catch (e) {}
    }
    return '';
  });

  // Quiz states
  const [hasQuiz, setHasQuiz] = useState(Boolean(letterToEdit?.quiz));
  const [quizType, setQuizType] = useState(letterToEdit?.quiz?.quiz_type || 'choice');
  const [quizQuestion, setQuizQuestion] = useState(letterToEdit?.quiz?.question || '');
  const [quizOptions, setQuizOptions] = useState(() => {
    if (letterToEdit?.quiz?.options && letterToEdit.quiz.options.length > 0) {
      return [...letterToEdit.quiz.options, '', '', ''].slice(0, Math.max(letterToEdit.quiz.options.length, 3));
    }
    return ['', '', ''];
  });
  const [correctAnswer, setCorrectAnswer] = useState(letterToEdit?.quiz?.correct_answer || '');
  const [quizHint, setQuizHint] = useState(letterToEdit?.quiz?.hint || '');
  const [bypassCost, setBypassCost] = useState(letterToEdit?.quiz?.bypass_cost ?? 15);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Audio Preview toggle
  const togglePreviewBgm = () => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(bgmTrack);
      previewAudioRef.current.loop = true;
      previewAudioRef.current.volume = 0.45;
    }

    if (isPreviewAudioPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewAudioPlaying(false);
    } else {
      previewAudioRef.current.src = bgmTrack;
      previewAudioRef.current.play().then(() => {
        setIsPreviewAudioPlaying(true);
      }).catch(e => console.warn(e));
    }
  };

  // Sticker & Canvas Drag-and-Drop Handlers
  const handlePointerDown = (e, item) => {
    e.stopPropagation();
    setSelectedStickerId(item.id);

    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    dragInfoRef.current = {
      startX: clientX,
      startY: clientY,
      origX: item.x,
      origY: item.y,
      itemId: item.id
    };

    const handlePointerMove = (moveEvt) => {
      if (!canvasRef.current || !dragInfoRef.current.itemId) return;
      const currentX = moveEvt.clientX ?? (moveEvt.touches && moveEvt.touches[0].clientX);
      const currentY = moveEvt.clientY ?? (moveEvt.touches && moveEvt.touches[0].clientY);
      const deltaX = currentX - dragInfoRef.current.startX;
      const deltaY = currentY - dragInfoRef.current.startY;

      const rect = canvasRef.current.getBoundingClientRect();
      const pctDeltaX = (deltaX / rect.width) * 100;
      const pctDeltaY = (deltaY / rect.height) * 100;

      const newX = Math.min(92, Math.max(2, dragInfoRef.current.origX + pctDeltaX));
      const newY = Math.min(92, Math.max(2, dragInfoRef.current.origY + pctDeltaY));

      setLetterStickers(prev => prev.map(s => s.id === dragInfoRef.current.itemId ? { ...s, x: newX, y: newY } : s));
    };

    const handlePointerUp = () => {
      dragInfoRef.current.itemId = null;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleAddSticker = (url) => {
    const newStk = {
      id: `stk-${Date.now()}`,
      url,
      x: Math.floor(Math.random() * 50 + 25),
      y: Math.floor(Math.random() * 45 + 25),
      scale: 1,
      rotation: Math.floor(Math.random() * 16 - 8)
    };
    setLetterStickers(prev => [...prev, newStk]);
    setSelectedStickerId(newStk.id);
  };

  const handleAdjustSticker = (id, prop, delta) => {
    setLetterStickers(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (prop === 'scale') {
        return { ...s, scale: Math.min(2.5, Math.max(0.5, Number(((s.scale || 1) + delta).toFixed(2)))) };
      }
      if (prop === 'rotation') {
        return { ...s, rotation: ((s.rotation || 0) + delta) % 360 };
      }
      return s;
    }));
  };

  const handleRemoveSticker = (id) => {
    setLetterStickers(prev => prev.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Upload custom sticker / animated GIF from computer
  const handleCustomStickerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      handleAddSticker(res.url);
    } catch (err) {
      setError('Tải sticker/GIF thất bại: ' + err.message);
    }
  };

  // Upload custom paper background image
  const handleBgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setBgImage(res.url);
    } catch (err) {
      setError('Tải ảnh nền thất bại: ' + err.message);
    }
  };

  // Upload photo for custom postage stamp
  const handleStampPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setStampImage(res.url);
      setStampDesign('custom');
    } catch (err) {
      setError('Tải ảnh tem thất bại: ' + err.message);
    }
  };

  // Polaroid Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setPhotos([...photos, { url: res.url, caption: 'Kỷ niệm của hai đứa 📸' }]);
    } catch (err) {
      setError('Tải ảnh polaroid thất bại: ' + err.message);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Save or Send Letter
  const handleSave = async (status = 'sent') => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề cho lá thư');
      return;
    }
    if (!content.trim()) {
      setError('Vui lòng viết vài dòng nội dung gửi gắm yêu thương');
      return;
    }

    if (hasQuiz) {
      if (!quizQuestion.trim() || !correctAnswer.trim()) {
        setError('Vui lòng nhập đầy đủ câu hỏi và đáp án đúng cho câu đố');
        return;
      }
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        receiver_id: partner.id,
        milestone_id: milestoneId,
        title: title.trim(),
        mood_tag: moodTag.trim(),
        content: content.trim(),
        paper_style: paperStyle,
        photos: photos.map(p => typeof p === 'string' ? p : p.url),
        stickers: letterStickers,
        bgm_track: bgmTrack || null,
        wax_seal: { color: waxColor, emblem: waxEmblem },
        scent_tag: scentTag || 'rose',
        font_family: fontFamily,
        text_color: textColor,
        bg_image: bgImage || null,
        envelope_config: {
          color: envelopeColor,
          stamp_design: stampDesign,
          stamp_image: stampImage
        },
        open_heart_cost: Number(openHeartCost),
        time_lock_at: timeLockAt ? new Date(timeLockAt).toISOString() : null,
        status
      };

      if (hasQuiz) {
        payload.quiz = {
          quiz_type: quizType,
          question: quizQuestion,
          options: quizType === 'choice' ? quizOptions.filter(o => o.trim()) : [],
          correct_answer: correctAnswer,
          hint: quizHint,
          bypass_cost: Number(bypassCost)
        };
      } else {
        payload.quiz = null;
      }

      let res;
      if (isEditing) {
        res = await api.updateLetter(letterToEdit.id, payload);
      } else {
        res = await api.createLetter(payload);
      }
      onLetterSaved(res.letter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = PAPER_THEMES.find(t => t.id === paperStyle) || PAPER_THEMES[0];
  const currentWaxEmblemIcon = WAX_EMBLEMS.find(e => e.id === waxEmblem)?.icon || '❤️';
  const currentScent = SCENT_TAGS.find(s => s.id === scentTag)?.label || SCENT_TAGS[0].label;

  const defaultSuggestions = [
    'Mở khi nhớ nhau',
    'Mở khi thấy mệt mỏi',
    'Mở khi cần động viên',
    'Mở khi giận dỗi',
    'Mở vào ngày kỷ niệm',
    'Mở khi không ngủ được'
  ];
  const allSuggestions = Array.from(new Set([...defaultSuggestions, ...existingCategories]));

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.65)',
      backdropFilter: 'blur(7px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--paper-cream)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        maxWidth: '820px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '30px',
        boxShadow: 'var(--shadow-warm)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={() => {
            if (previewAudioRef.current) previewAudioRef.current.pause();
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
            zIndex: 20
          }}
        >
          <X size={22} />
        </button>

        {/* Modal Header & 3 Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-ink)' }}>
              {isEditing ? 'Chỉnh Sửa Lá Thư Yêu Thương' : 'Gửi Gắm Lá Thư Yêu Thương'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Người nhận: <strong style={{ color: 'var(--rose-primary)' }}>{partner.display_name}</strong>
            </div>
          </div>

          {/* 3 Interactive Mode Tabs */}
          <div style={{
            display: 'flex',
            background: '#eee8de',
            padding: '3px',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)',
            gap: '2px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '11px',
                border: 'none',
                background: activeTab === 'edit' ? '#fff' : 'transparent',
                color: activeTab === 'edit' ? 'var(--rose-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'edit' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Edit3 size={13} /> 1. Soạn Thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('decor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '11px',
                border: 'none',
                background: activeTab === 'decor' ? '#fff' : 'transparent',
                color: activeTab === 'decor' ? 'var(--rose-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'decor' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Sparkles size={13} /> 2. Trang Trí Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('envelope')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '11px',
                border: 'none',
                background: activeTab === 'envelope' ? '#fff' : 'transparent',
                color: activeTab === 'envelope' ? 'var(--rose-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'envelope' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Mail size={13} /> 3. Phong Bì & Tem
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* ================= TAB 1: SOẠN THẢO (EDIT MODE) ================= */}
        {activeTab === 'edit' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave('sent'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Category / Mood Tag */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Loại thư / Chủ đề ("Mở khi..."):
              </label>
              <input
                type="text"
                required
                placeholder="Nhập loại thư (Ví dụ: Mở khi đi xa, Mở khi thấy mệt...)"
                value={moodTag}
                onChange={(e) => setMoodTag(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Gợi ý:</span>
                {allSuggestions.slice(0, 6).map((tag, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setMoodTag(tag)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '14px',
                      border: moodTag === tag ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                      background: moodTag === tag ? 'var(--rose-light)' : '#fff',
                      color: moodTag === tag ? 'var(--rose-primary)' : 'var(--text-muted)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Title */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Tiêu đề lá thư:
              </label>
              <input
                type="text"
                required
                placeholder="Mở khi cần động viên hoặc nhớ nhau..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: '#fff',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Row: 8 Fonts & Unrestricted Color Picker */}
            <div style={{
              background: '#fcf8f2',
              border: '1px solid #ebd9c8',
              borderRadius: '16px',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}>
              {/* Expanded Font Selector (8 Vietnamese Fonts) */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Type size={14} color="var(--rose-primary)" />
                  <span>Phông chữ tiếng Việt (8 kiểu):</span>
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px', fontWeight: '600' }}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Ink Color Picker + Presets */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Palette size={14} color="var(--rose-primary)" />
                    <span>Màu mực viết thư:</span>
                  </span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    title="Chọn màu mực tùy thích"
                    style={{ width: '26px', height: '22px', border: 'none', background: 'none', cursor: 'pointer', verticalAlign: 'middle' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {COLOR_PRESETS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTextColor(c.hex)}
                      title={c.name}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: textColor === c.hex ? '2px solid #fff' : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: textColor === c.hex ? '0 0 0 2px var(--rose-primary)' : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content Textarea with live font and color */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Lời tâm tình của bạn:
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                  Có thể chèn emoji hoặc trang trí thêm ảnh ở tab 2
                </span>
              </div>
              <textarea
                required
                rows={7}
                placeholder="Gửi em, lá thư này anh viết vào một buổi chiều nhớ em thật nhiều..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  background: '#fffdf9',
                  fontFamily: fontFamily,
                  color: textColor,
                  fontSize: '18px',
                  lineHeight: '1.8',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Row: Wax Seal & Scent & Background Music */}
            <div style={{
              background: '#fcf8f2',
              border: '1px solid #ebd9c8',
              borderRadius: '16px',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {/* Wax Seal */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--rose-primary)', display: 'block', marginBottom: '4px' }}>
                  Con Dấu Sáp Niêm Phong:
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {WAX_SEAL_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setWaxColor(c.id)}
                      className={`wax-seal ${c.className}`}
                      title={c.name}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: waxColor === c.id ? '2px solid #fff' : 'none',
                        boxShadow: waxColor === c.id ? '0 0 0 2px #000' : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                  <select
                    value={waxEmblem}
                    onChange={(e) => setWaxEmblem(e.target.value)}
                    style={{ flex: 1, padding: '5px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '12px', fontWeight: '700' }}
                  >
                    {WAX_EMBLEMS.map(e => (
                      <option key={e.id} value={e.id}>{e.icon} {e.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scent Tag */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)', display: 'block', marginBottom: '4px' }}>
                  Mùi hương gửi kèm thư:
                </label>
                <select
                  value={scentTag}
                  onChange={(e) => setScentTag(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '12px', fontWeight: '600' }}
                >
                  {SCENT_TAGS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Letter BGM */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Nhạc nền khi mở thư 🎵:</span>
                  <button
                    type="button"
                    onClick={togglePreviewBgm}
                    style={{ background: 'none', border: 'none', color: 'var(--rose-primary)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}
                  >
                    {isPreviewAudioPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPreviewAudioPlaying ? 'Dừng' : 'Nghe thử'}</span>
                  </button>
                </label>
                <select
                  value={bgmTrack}
                  onChange={(e) => {
                    setBgmTrack(e.target.value);
                    if (previewAudioRef.current) {
                      previewAudioRef.current.pause();
                      setIsPreviewAudioPlaying(false);
                    }
                  }}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '12px', fontWeight: '600' }}
                >
                  {ROMANTIC_PLAYLIST.map(track => (
                    <option key={track.id} value={track.url}>{track.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photos Attachment (Polaroid) */}
            <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={15} color="var(--rose-primary)" />
                  <span>Ảnh Polaroid Kỷ Niệm ({photos.length}/4)</span>
                </span>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--rose-light)',
                  color: 'var(--rose-primary)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>
                  <Upload size={13} />
                  <span>Thêm ảnh kỷ niệm</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {photos.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '90px' }}>
                      <img src={typeof p === 'string' ? p : p.url} alt="photo" style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e06d7e', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Time lock & Quiz Settings */}
            <div style={{
              background: '#fbf7ee',
              border: '1px solid #ebd9c8',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Phí mở thư (Trái tim ❤️):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={openHeartCost}
                    onChange={(e) => setOpenHeartCost(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Hẹn giờ mở thư (Tùy chọn):
                  </label>
                  <input
                    type="datetime-local"
                    value={timeLockAt}
                    onChange={(e) => setTimeLockAt(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Quiz Toggle */}
              <div style={{ paddingTop: '8px', borderTop: '1px dashed #e2d2c0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--rose-primary)' }}>
                  <input
                    type="checkbox"
                    checked={hasQuiz}
                    onChange={(e) => setHasQuiz(e.target.checked)}
                  />
                  <span>🔒 Cài đặt câu đố tình yêu để mở khóa thư</span>
                </label>

                {hasQuiz && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="quizType"
                          value="choice"
                          checked={quizType === 'choice'}
                          onChange={() => setQuizType('choice')}
                        />
                        Trắc nghiệm (Chọn 1 trong các đáp án)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="quizType"
                          value="text"
                          checked={quizType === 'text'}
                          onChange={() => setQuizType('text')}
                        />
                        Tự luận (Nhập chữ)
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Câu hỏi đố (Ví dụ: Ngày đầu tiên hai đứa gặp nhau ở đâu?)"
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />

                    {quizType === 'choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {quizOptions.map((opt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', width: '20px' }}>{String.fromCharCode(65 + i)}.</span>
                            <input
                              type="text"
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...quizOptions];
                                newOpts[i] = e.target.value;
                                setQuizOptions(newOpts);
                              }}
                              style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                            />
                            <button
                              type="button"
                              onClick={() => setCorrectAnswer(opt)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '8px',
                                border: correctAnswer === opt && opt.trim() ? '2px solid #2e7d32' : '1px solid #ccc',
                                background: correctAnswer === opt && opt.trim() ? '#e8f5e9' : '#fff',
                                color: correctAnswer === opt && opt.trim() ? '#2e7d32' : '#666',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {correctAnswer === opt && opt.trim() ? '✓ Đúng' : 'Chọn'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {quizType === 'text' && (
                      <input
                        type="text"
                        placeholder="Nhập đáp án chuẩn xác..."
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                      />
                    )}

                    <input
                      type="text"
                      placeholder="Gợi ý ngọt ngào khi đối phương bị bí..."
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#f2ede4',
                  color: 'var(--text-ink)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Archive size={16} />
                <span>{loading ? 'Đang lưu...' : 'Lưu Nháp'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('decor')}
                style={{
                  flex: 1,
                  background: '#fff',
                  color: 'var(--rose-primary)',
                  border: '1px solid var(--rose-primary)',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={16} />
                <span>Sang Bước 2: Trang Trí ✨</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1.5,
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(224, 109, 126, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={16} />
                <span>{loading ? 'Đang gửi...' : 'Gửi Thư Ngay 💌'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 2: TRANG TRÍ CANVAS (DRAG-AND-DROP CANVAS) ================= */}
        {activeTab === 'decor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Toolbar for Canvas Customization */}
            <div style={{
              background: '#fcf8f2',
              border: '1px solid #ebd9c8',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Paper presets & Background Image upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)' }}>Giấy thư:</span>
                <select
                  value={paperStyle}
                  onChange={(e) => setPaperStyle(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '12.5px', fontWeight: '600' }}
                >
                  {PAPER_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>

                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: bgImage ? 'var(--rose-light)' : '#fff',
                  color: bgImage ? 'var(--rose-primary)' : 'var(--text-ink)',
                  border: '1px solid var(--border-subtle)',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <Upload size={12} />
                  <span>{bgImage ? 'Đổi ảnh nền riêng' : 'Tải ảnh nền thư'}</span>
                  <input type="file" accept="image/*" onChange={handleBgImageUpload} style={{ display: 'none' }} />
                </label>

                {bgImage && (
                  <button
                    type="button"
                    onClick={() => setBgImage(null)}
                    style={{ background: 'none', border: 'none', color: '#c62828', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Xóa ảnh nền
                  </button>
                )}
              </div>

              {/* Background Opacity slider if custom bg uploaded */}
              {bgImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Độ mờ nền:</span>
                  <input
                    type="range"
                    min="0.08"
                    max="0.45"
                    step="0.02"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))}
                    style={{ width: '80px', accentColor: 'var(--rose-primary)' }}
                  />
                </div>
              )}
            </div>

            {/* THE INTERACTIVE LETTER PAPER CANVAS */}
            <div
              ref={canvasRef}
              className={`letter-canvas-surface ${currentTheme.className}`}
              style={{
                position: 'relative',
                minHeight: '460px',
                padding: '36px',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
              onClick={() => setSelectedStickerId(null)}
            >
              {/* Optional Custom Background Overlay */}
              {bgImage && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: bgOpacity,
                    pointerEvents: 'none',
                    borderRadius: '20px',
                    zIndex: 0
                  }}
                />
              )}

              {/* Scent Tag in top corner */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
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
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                zIndex: 2
              }}>
                <span>🌸</span>
                <span>{currentScent}</span>
              </div>

              {/* Top Custom Wax Seal Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '16px', position: 'relative', zIndex: 2 }}>
                <div className={`wax-seal wax-seal-${waxColor}`} style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                  {currentWaxEmblemIcon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase' }}>
                    {moodTag || 'Thư Tình Yêu'}
                  </div>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-ink)', marginTop: '2px' }}>
                    {title || '(Chưa có tiêu đề)'}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Gửi đến: <strong>{partner.display_name}</strong> • Phí mở: <strong>{openHeartCost} ❤️</strong>
                  </div>
                </div>
              </div>

              {/* Letter Text Content on Canvas */}
              <div style={{
                fontFamily: fontFamily,
                color: textColor,
                fontSize: '18px',
                lineHeight: '1.85',
                whiteSpace: 'pre-wrap',
                minHeight: '120px',
                marginBottom: '26px',
                position: 'relative',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                {content || '(Hãy viết vài dòng tâm tình vào nội dung lá thư...)'}
              </div>

              {/* Polaroid Attachments Preview on Canvas */}
              {photos.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)', position: 'relative', zIndex: 2 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Ảnh kỷ niệm kèm theo:
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {photos.map((p, idx) => (
                      <div key={idx} className="polaroid" style={{ width: '130px', transform: `rotate(${idx % 2 === 0 ? '-2.5deg' : '3deg'})` }}>
                        <div className="washi-tape" style={{ width: '40px', height: '12px' }} />
                        <img src={typeof p === 'string' ? p : p.url} alt="Polaroid" className="polaroid-img" style={{ height: '95px' }} />
                        <div className="polaroid-caption" style={{ fontSize: '12px' }}>
                          {(typeof p === 'object' && p.caption) || 'Kỷ niệm ✨'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DRAGGABLE & RESIZABLE STICKERS / ANIMATED GIFS */}
              {letterStickers.map(stk => {
                const isSelected = selectedStickerId === stk.id;
                return (
                  <div
                    key={stk.id}
                    className={`canvas-interactive-item ${isSelected ? 'is-selected' : ''}`}
                    style={{
                      left: `${stk.x}%`,
                      top: `${stk.y}%`,
                      transform: `scale(${stk.scale || 1}) rotate(${stk.rotation || 0}deg)`,
                      transformOrigin: 'center center',
                      zIndex: isSelected ? 40 : 15
                    }}
                    onMouseDown={(e) => handlePointerDown(e, stk)}
                    onTouchStart={(e) => handlePointerDown(e, stk)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStickerId(stk.id);
                    }}
                  >
                    {/* Controls popup when item is selected */}
                    {isSelected && (
                      <div className="canvas-item-controls" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="canvas-ctrl-btn"
                          title="Phóng to"
                          onClick={() => handleAdjustSticker(stk.id, 'scale', 0.15)}
                        >
                          <ZoomIn size={13} />
                        </button>
                        <button
                          type="button"
                          className="canvas-ctrl-btn"
                          title="Thu nhỏ"
                          onClick={() => handleAdjustSticker(stk.id, 'scale', -0.15)}
                        >
                          <ZoomOut size={13} />
                        </button>
                        <button
                          type="button"
                          className="canvas-ctrl-btn"
                          title="Xoay nghiêng"
                          onClick={() => handleAdjustSticker(stk.id, 'rotation', 15)}
                        >
                          <RotateCw size={13} />
                        </button>
                        <button
                          type="button"
                          className="canvas-ctrl-btn danger"
                          title="Xóa sticker này"
                          onClick={() => handleRemoveSticker(stk.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    <img
                      src={stk.url}
                      alt="sticker"
                      draggable={false}
                      style={{
                        width: '46px',
                        height: '46px',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* STICKER & GIF DRAWER: Click to Add directly onto Canvas */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-ink)' }}>
                    Thư Viện Sticker & GIF Động:
                  </span>
                  <div style={{ display: 'flex', gap: '4px', background: '#f0ece4', padding: '2px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStickerTab('classic')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedStickerTab === 'classic' ? '#fff' : 'transparent',
                        color: selectedStickerTab === 'classic' ? 'var(--rose-primary)' : 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Sticker Đẹp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStickerTab('animated')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedStickerTab === 'animated' ? '#fff' : 'transparent',
                        color: selectedStickerTab === 'animated' ? 'var(--rose-primary)' : 'var(--text-muted)',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      GIF Động ✨
                    </button>
                  </div>
                </div>

                {/* Upload Any GIF / Image */}
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--rose-light)',
                  color: 'var(--rose-primary)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>
                  <Upload size={13} />
                  <span>Tải GIF / Ảnh từ máy</span>
                  <input type="file" accept="image/*,.gif" onChange={handleCustomStickerUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* Items row */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 2px' }}>
                {(selectedStickerTab === 'classic' ? DEFAULT_STICKERS : ANIMATED_STICKERS).map(stk => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => handleAddSticker(stk.url)}
                    title={`Thêm ${stk.name} vào canvas`}
                    style={{
                      background: '#faf6ee',
                      border: '1px solid #ebd9c8',
                      borderRadius: '10px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: '58px',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <img src={stk.url} alt={stk.name} style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: '54px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stk.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions for Canvas Tab */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                style={{
                  flex: 1,
                  background: '#f2ede4',
                  color: 'var(--text-ink)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Edit3 size={15} /> 1. Quay Lại Soạn Lời
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('envelope')}
                style={{
                  flex: 1.2,
                  background: '#fff',
                  color: 'var(--rose-primary)',
                  border: '1px solid var(--rose-primary)',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Mail size={16} /> 3. Sang Tùy Chỉnh Phong Bì & Tem 💌
              </button>

              <button
                type="button"
                onClick={() => handleSave('sent')}
                disabled={loading}
                style={{
                  flex: 1.2,
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(224, 109, 126, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={16} />
                <span>{loading ? 'Đang gửi...' : 'Gửi Thư Ngay 💌'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PHONG BÌ & TEM THƯ (OUTER ENVELOPE & STAMPS) ================= */}
        {activeTab === 'envelope' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* View Switcher: Front (Address & Stamp) vs Back (Flap & Wax Seal) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'inline-flex',
                background: '#eae3d6',
                borderRadius: '24px',
                padding: '4px',
                gap: '4px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <button
                  type="button"
                  onClick={() => setEnvelopeViewSide('front')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    background: envelopeViewSide === 'front' ? '#ffffff' : 'transparent',
                    color: envelopeViewSide === 'front' ? 'var(--rose-primary)' : 'var(--text-muted)',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: envelopeViewSide === 'front' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>🏷️ Mặt Trước (Dán Tem & Tên Nhận)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnvelopeViewSide('back')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    background: envelopeViewSide === 'back' ? '#ffffff' : 'transparent',
                    color: envelopeViewSide === 'back' ? 'var(--rose-primary)' : 'var(--text-muted)',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: envelopeViewSide === 'back' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>💌 Mặt Sau (Nắp Gập & Dấu Sáp)</span>
                </button>
              </div>
            </div>

            {/* Live 3D Envelope Preview */}
            <div style={{
              background: '#f8f4ec',
              border: '1px solid #ebd9c8',
              borderRadius: '20px',
              padding: '30px 20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {envelopeViewSide === 'front' ? (
                /* FRONT VIEW: Clear Postage Stamp, Airmail Badge, and Vintage Address Card */
                <div className={`craft-envelope-container env-${envelopeColor}`} style={{ maxWidth: '460px' }}>
                  <div className={`craft-envelope-front env-${envelopeColor}`} style={{ minHeight: '280px', position: 'relative' }}>
                    {/* Airmail Vintage Label at Top-Left */}
                    <div style={{
                      position: 'absolute',
                      top: '18px',
                      left: '20px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{
                        background: '#1b3b6f',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '9.5px',
                        fontWeight: '800',
                        letterSpacing: '1px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span>✈️ PAR AVION</span>
                      </div>
                      <div style={{
                        border: '1px solid rgba(255,255,255,0.7)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '8.5px',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        BY AIR MAIL
                      </div>
                    </div>

                    {/* Postage Stamp at Top-Right (Prominent, crisp, completely visible!) */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '20px',
                      transform: 'rotate(4deg)',
                      zIndex: 20,
                      transition: 'transform 0.25s ease'
                    }}>
                      <PostageStamp
                        design={stampDesign}
                        imageUrl={stampImage}
                        cost={openHeartCost}
                        size="lg"
                        showPostmark={true}
                      />
                    </div>

                    {/* Vintage Postal Address Card (Nhãn Bưu Thiếp Tình Yêu) in the center */}
                    <div style={{
                      margin: '82px 20px 18px 20px',
                      background: 'rgba(255, 253, 249, 0.96)',
                      border: '1.5px dashed #c4a482',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 10
                    }}>
                      <div style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: '#9e6d42',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}>
                        <span>💌 THƯ TÌNH GỬI ĐẾN</span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-handwriting)',
                        fontSize: '26px',
                        color: '#2b2621',
                        marginTop: '6px',
                        lineHeight: 1.25,
                        fontWeight: '700',
                        wordBreak: 'break-word'
                      }}>
                        {title || 'Lá Thư Chưa Đặt Tên'}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: '#665c54',
                        marginTop: '10px',
                        borderTop: '1px dashed rgba(196,164,130,0.45)',
                        paddingTop: '8px',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <div>
                          Kính gửi: <strong style={{ color: 'var(--rose-primary)' }}>{partner.display_name}</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9e6d42' }}>
                          Bưu Chính Tình Yêu 💕
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* BACK VIEW: Top Flap, Clasp/Wax Seal, and Bottom Fold */
                <div className={`craft-envelope-container env-${envelopeColor}`} style={{ maxWidth: '460px' }}>
                  <div className={`craft-envelope-pocket env-${envelopeColor}`} style={{ minHeight: '280px' }}>
                    {/* Top Flap */}
                    <div className="craft-envelope-top-flap">
                      <div style={{ position: 'absolute', bottom: '-24px', zIndex: 25 }}>
                        <div className="heart-clasp-btn" style={{ width: '48px', height: '48px' }}>
                          <Heart size={24} color="#fff" fill="#fff" />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Fold */}
                    <div className="craft-envelope-bottom-fold" />

                    {/* Back Information when Sealed */}
                    <div style={{ padding: '165px 24px 24px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(4px)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        textShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}>
                        <Sparkles size={14} />
                        <span>Niêm phong bởi LoveCapsule</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                        Đối phương sẽ chạm vào khóa trái tim để mở lá thư này ✨
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customizer Controls: 1. Envelope Colors, 2. Postage Stamps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Envelope Color Chooser */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-ink)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} color="var(--rose-primary)" />
                  <span>Màu sắc & Chất liệu phong bì ngoài:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                  {ENVELOPE_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setEnvelopeColor(theme.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: envelopeColor === theme.id ? '2px solid var(--rose-primary)' : '1px solid #e0d8cc',
                        background: envelopeColor === theme.id ? 'var(--rose-light)' : '#faf7f2',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.colorHex, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-ink)', lineHeight: 1.2 }}>
                        {theme.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Postage Stamp Chooser */}
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Bộ Sưu Tập Tem Thư Cổ Điển:</span>
                  </span>
                  {/* Photo Stamp Upload Button */}
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: stampDesign === 'custom' ? 'var(--rose-light)' : '#f5ede0',
                    color: 'var(--rose-primary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}>
                    <Upload size={12} />
                    <span>{stampImage ? 'Đổi ảnh tem đôi' : 'Tạo tem từ ảnh đôi 📸'}</span>
                    <input type="file" accept="image/*" onChange={handleStampPhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '8px' }}>
                  {STAMP_DESIGNS.filter(s => s.id !== 'custom').map(stamp => (
                    <button
                      key={stamp.id}
                      type="button"
                      onClick={() => {
                        setStampDesign(stamp.id);
                        setStampImage(null);
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '10px',
                        border: (stampDesign === stamp.id && !stampImage) ? '2px solid var(--rose-primary)' : '1px solid #ebd9c8',
                        background: (stampDesign === stamp.id && !stampImage) ? 'var(--rose-light)' : '#faf7f2',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{stamp.icon}</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-ink)', whiteSpace: 'nowrap' }}>
                        {stamp.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Actions from Tab 3 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('decor')}
                style={{
                  flex: 1,
                  background: '#f2ede4',
                  color: 'var(--text-ink)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={15} /> 2. Quay Lại Trang Trí Canvas
              </button>

              <button
                type="button"
                onClick={() => handleSave('sent')}
                disabled={loading}
                style={{
                  flex: 1.5,
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(224, 109, 126, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={16} />
                <span>{loading ? 'Đang gửi...' : 'Niêm Phong & Gửi Thư Ngay 💌'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
