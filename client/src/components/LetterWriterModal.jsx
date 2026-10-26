import React, { useState, useRef } from 'react';
import { api } from '../api/client.js';
import {
  X, Image, Sparkles, HelpCircle, Calendar, Heart, Upload, Archive, Send,
  Eye, Edit3, Type, Palette, Smile, Music, Play, Pause, Volume2, Move, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react';
import { DEFAULT_STICKERS } from './StickerDrawer.jsx';
import { ROMANTIC_PLAYLIST } from './AudioPlayer.jsx';

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

export function LetterWriterModal({ partner, letterToEdit = null, existingCategories = [], onClose, onLetterSaved }) {
  const isEditing = Boolean(letterToEdit);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  const [title, setTitle] = useState(letterToEdit?.title || '');
  const [moodTag, setMoodTag] = useState(letterToEdit?.mood_tag || 'Mở khi nhớ nhau');
  const [content, setContent] = useState(letterToEdit?.content || '');
  const [paperStyle, setPaperStyle] = useState(letterToEdit?.paper_style || 'kraft');
  const [fontFamily, setFontFamily] = useState(letterToEdit?.font_family || 'var(--font-handwriting)');
  const [textColor, setTextColor] = useState(letterToEdit?.text_color || '#2b2621');

  // Wax seal & Scent
  const [waxColor, setWaxColor] = useState(letterToEdit?.wax_seal?.color || 'red');
  const [waxEmblem, setWaxEmblem] = useState(letterToEdit?.wax_seal?.emblem || 'heart');
  const [scentTag, setScentTag] = useState(letterToEdit?.scent_tag || 'rose');

  // Background Music for Letter
  const [bgmTrack, setBgmTrack] = useState(letterToEdit?.bgm_track || ROMANTIC_PLAYLIST[0].url);
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);
  const previewAudioRef = useRef(null);

  // Photos & Decorative draggable stickers on letter
  const [photos, setPhotos] = useState(() => {
    if (letterToEdit?.photos) {
      return letterToEdit.photos.map(p => typeof p === 'string' ? { url: p, caption: 'Kỷ niệm của hai đứa 📸' } : p);
    }
    return [];
  });

  const [letterStickers, setLetterStickers] = useState(() => {
    if (letterToEdit?.stickers) {
      return letterToEdit.stickers;
    }
    return [
      { id: 'stk-1', url: DEFAULT_STICKERS[0].url, x: 80, y: 15, scale: 1, rotation: 6 },
      { id: 'stk-2', url: DEFAULT_STICKERS[1].url, x: 12, y: 78, scale: 1, rotation: -8 }
    ];
  });

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
  const contentTextareaRef = useRef(null);

  const defaultSuggestions = ['Mở khi nhớ nhau', 'Mở khi buồn', 'Mở khi giận nhau', 'Mở khi đi xa', 'Kỷ niệm', 'Tâm sự đêm khuya'];
  const allSuggestions = Array.from(new Set([...existingCategories, ...defaultSuggestions])).filter(Boolean);

  const quickStickers = ['❤️', '💌', '🧸', '🌸', '☕', '🌟', '💍', '💋', '🎀', '✨', '🌿', '🍓', '🍫', '🥂', '🕊️'];

  // Handle BGM Play/Pause in Preview
  const togglePreviewBgm = () => {
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(bgmTrack);
      previewAudioRef.current.loop = true;
      previewAudioRef.current.volume = 0.45;
    }
    const audio = previewAudioRef.current;
    if (isPreviewAudioPlaying) {
      audio.pause();
      setIsPreviewAudioPlaying(false);
    } else {
      audio.src = bgmTrack;
      audio.play().then(() => setIsPreviewAudioPlaying(true)).catch(e => console.warn(e));
    }
  };

  const handleInsertEmoji = (emoji) => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.substring(0, start) + emoji + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const handleAddDecorativeSticker = (stickerUrl) => {
    const newStk = {
      id: `letter-stk-${Date.now()}`,
      url: stickerUrl,
      x: Math.floor(Math.random() * 65 + 15),
      y: Math.floor(Math.random() * 60 + 20),
      scale: 1,
      rotation: Math.floor(Math.random() * 20 - 10)
    };
    setLetterStickers([...letterStickers, newStk]);
  };

  const handleRemoveDecorativeSticker = (stkId) => {
    setLetterStickers(letterStickers.filter(s => s.id !== stkId));
  };

  const handleAdjustSticker = (stkId, prop, delta) => {
    setLetterStickers(letterStickers.map(s => {
      if (s.id !== stkId) return s;
      if (prop === 'scale') {
        return { ...s, scale: Math.min(1.8, Math.max(0.6, (s.scale || 1) + delta)) };
      }
      if (prop === 'rotation') {
        return { ...s, rotation: ((s.rotation || 0) + delta) % 360 };
      }
      return s;
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setPhotos([...photos, { url: res.url, caption: 'Kỷ niệm của hai đứa 📸' }]);
    } catch (err) {
      setError('Tải ảnh thất bại: ' + err.message);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async (status = 'sent') => {
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung lá thư');
      return;
    }

    if (!moodTag.trim()) {
      setError('Vui lòng nhập loại thư');
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
        maxWidth: '750px',
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
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header with Mode Switch (Edit vs Preview) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', paddingRight: '36px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>
              {isEditing ? `Chỉnh Sửa Lá Thư Gửi ${partner.display_name} 📝` : `Xưởng Thư Tình Nghệ Thuật Cho ${partner.display_name} 💌`}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
              Trang trí giấy thủ công, gắn nhạc du dương và cài hương thơm kỷ niệm
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{
            display: 'flex',
            background: '#eee8de',
            padding: '3px',
            borderRadius: '14px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
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
              <Edit3 size={13} /> Soạn Thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '11px',
                border: 'none',
                background: activeTab === 'preview' ? '#fff' : 'transparent',
                color: activeTab === 'preview' ? 'var(--rose-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: activeTab === 'preview' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Eye size={13} /> Xem Trước (Preview)
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* ================= TAB 1: EDIT MODE ================= */}
        {activeTab === 'edit' ? (
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

            {/* Row: 5 Paper Styles & Font & Ink Color */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Paper Theme */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Chất liệu giấy nghệ thuật:
                </label>
                <select
                  value={paperStyle}
                  onChange={(e) => setPaperStyle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px', fontWeight: '600' }}
                >
                  {PAPER_THEMES.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              {/* Font Choice */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Phông chữ viết thư:
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px', fontWeight: '600' }}
                >
                  <option value="var(--font-handwriting)">Viết tay mộc mạc (Caveat)</option>
                  <option value="'Dancing Script', cursive">Viết tay uốn lượn (Dancing Script)</option>
                  <option value="var(--font-serif)">Cổ điển thanh lịch (Playfair)</option>
                  <option value="var(--font-main)">Hiện đại dễ đọc (Sans)</option>
                </select>
              </div>

              {/* Ink Color */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Màu mực:
                </label>
                <select
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: '#fff', fontSize: '13px', fontWeight: '600' }}
                >
                  <option value="#2b2621">Nâu cà phê cổ điển</option>
                  <option value="#111111">Mực đen tuyền</option>
                  <option value="#8b1e2c">Mực đỏ rượu vang</option>
                  <option value="#1b3b6f">Mực xanh navy</option>
                </select>
              </div>
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
              {/* Wax Seal Customization */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--rose-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span>Con Dấu Sáp Niêm Phong:</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Colors */}
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
                  {/* Emblems */}
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

              {/* Background Music for Letter */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Giai điệu khi mở thư 🎵:</span>
                  <button
                    type="button"
                    onClick={togglePreviewBgm}
                    style={{ background: 'none', border: 'none', color: 'var(--rose-primary)', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}
                  >
                    {isPreviewAudioPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isPreviewAudioPlaying ? 'Dừng thử' : 'Nghe thử'}</span>
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

            {/* Quick Stickers and Decorative Stickers */}
            <div style={{
              background: '#faf6ee',
              border: '1px solid #ebd9c8',
              borderRadius: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--rose-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Smile size={14} /> Chèn Sticker:
              </span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {quickStickers.map((em, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertEmoji(em)}
                    title={`Chèn ${em} vào nội dung`}
                    style={{
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      padding: '3px 7px',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'transform 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* Add decorative sticker to paper */}
              <button
                type="button"
                onClick={() => handleAddDecorativeSticker(DEFAULT_STICKERS[Math.floor(Math.random() * DEFAULT_STICKERS.length)].url)}
                style={{
                  marginLeft: 'auto',
                  background: 'var(--rose-light)',
                  border: '1px dashed var(--rose-primary)',
                  color: 'var(--rose-primary)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Dán Lên Giấy Thư 🌸
              </button>
            </div>

            {/* Letter Content Textarea */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Nội dung lá thư:
              </label>
              <textarea
                ref={contentTextareaRef}
                required
                rows={7}
                placeholder="Viết tâm sự, những lời yêu thương, kỷ niệm muốn gửi gắm tại đây..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={currentTheme.className}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  fontFamily: fontFamily,
                  color: textColor,
                  fontSize: '17px',
                  lineHeight: '1.75',
                  resize: 'vertical',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                }}
              />
            </div>

            {/* Polaroid Photos Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Ảnh kỷ niệm đính kèm (Polaroid):
                </label>
                <label style={{
                  cursor: 'pointer',
                  color: 'var(--rose-primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Upload size={13} /> Thêm ảnh từ máy
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {photos.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <div className="polaroid" style={{ width: '135px', padding: '6px 6px 14px 6px' }}>
                        <div className="washi-tape" style={{ width: '45px', height: '12px' }} />
                        <img src={typeof p === 'string' ? p : p.url} alt="Polaroid" style={{ width: '100%', height: '95px', objectFit: 'cover' }} />
                        <div
                          style={{
                            fontFamily: 'var(--font-handwriting)',
                            fontSize: '13px',
                            textAlign: 'center',
                            marginTop: '6px',
                            color: '#3b332b'
                          }}
                        >
                          {(typeof p === 'object' && p.caption) || 'Kỷ niệm 📸'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: '#ff4757',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cost & Time Lock Setting */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', background: '#faf6ee', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Phí mở thư:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={openHeartCost}
                    onChange={(e) => setOpenHeartCost(e.target.value)}
                    style={{ width: '80px', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontWeight: '700', fontSize: '14px' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--rose-primary)', fontWeight: '700' }}>❤️ Trái Tim</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Hẹn giờ mở thư:
                </label>
                <input
                  type="datetime-local"
                  value={timeLockAt}
                  onChange={(e) => setTimeLockAt(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Quiz Toggle */}
            <div style={{ background: '#faf6ee', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-ink)' }}>
                <Sparkles size={16} color="var(--rose-primary)" />
                <span>Cài đặt câu đố tình yêu để mở khóa</span>
                <input
                  type="checkbox"
                  checked={hasQuiz}
                  onChange={(e) => setHasQuiz(e.target.checked)}
                  style={{ marginLeft: 'auto', width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>

              {hasQuiz && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '14px', borderTop: '1px dashed #e4d7cb' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Hình thức câu đố:
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                        Tự luận (Nhập chữ tự do)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Câu hỏi đố:
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Ngày đầu tiên hai đứa gặp nhau là ở đâu?"
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13.5px' }}
                    />
                  </div>

                  {quizType === 'choice' && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Các phương án lựa chọn:
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                            />
                            <button
                              type="button"
                              onClick={() => setCorrectAnswer(opt)}
                              style={{
                                padding: '6px 10px',
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
                    </div>
                  )}

                  {quizType === 'text' && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Đáp án đúng:
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập đáp án chuẩn xác..."
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13.5px' }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Gợi ý ngọt ngào (khi đối phương bị bí):
                    </label>
                    <input
                      type="text"
                      placeholder="Gợi ý ngọt ngào..."
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Actions */}
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
                <span>{loading ? 'Đang lưu...' : 'Lưu kho lưu trữ (Nháp)'}</span>
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
                <span>{loading ? 'Đang gửi...' : 'Niêm Phong & Gửi Thư 💌'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================= TAB 2: LIVE PREVIEW MODE ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              className={currentTheme.className}
              style={{
                borderRadius: '20px',
                padding: '36px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Scent Tag in top corner */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.85)',
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
                <span>{currentScent}</span>
              </div>

              {/* Decorative Stickers in Preview */}
              {letterStickers.map(stk => (
                <div
                  key={stk.id}
                  style={{
                    position: 'absolute',
                    left: `${stk.x}%`,
                    top: `${stk.y}%`,
                    transform: `scale(${stk.scale || 1}) rotate(${stk.rotation || 0}deg)`,
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.15))'
                  }}
                >
                  <img src={stk.url} alt="sticker" style={{ width: '40px', height: '40px' }} />
                </div>
              ))}

              {/* Top Custom Wax Seal Stamp Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '16px' }}>
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

              {/* Letter Body Preview with Selected Font and Color */}
              <div style={{
                fontFamily: fontFamily,
                color: textColor,
                fontSize: '18px',
                lineHeight: '1.85',
                whiteSpace: 'pre-wrap',
                minHeight: '120px',
                marginBottom: '26px'
              }}>
                {content || '(Hãy viết vài dòng yêu thương vào nội dung lá thư...)'}
              </div>

              {/* Polaroid Attachments Preview */}
              {photos.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Ảnh kỷ niệm kèm theo:
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {photos.map((p, idx) => (
                      <div key={idx} className="polaroid" style={{ width: '150px', transform: `rotate(${idx % 2 === 0 ? '-2.5deg' : '3deg'})` }}>
                        <div className="washi-tape" style={{ width: '50px', height: '14px' }} />
                        <img src={typeof p === 'string' ? p : p.url} alt="Polaroid" className="polaroid-img" style={{ height: '110px' }} />
                        <div className="polaroid-caption" style={{ fontSize: '14px' }}>
                          {(typeof p === 'object' && p.caption) || 'Kỷ niệm của hai đứa ✨'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions in Preview Tab */}
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
                <Edit3 size={15} /> Quay Lại Chỉnh Sửa
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
                <span>{loading ? 'Đang gửi...' : 'Gửi Ngay Bức Thư Này 💌'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
