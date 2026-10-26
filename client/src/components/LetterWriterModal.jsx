import React, { useState } from 'react';
import { api } from '../api/client.js';
import { X, Image, Sparkles, HelpCircle, Calendar, Heart, Upload, Archive, Send } from 'lucide-react';

export function LetterWriterModal({ partner, letterToEdit = null, existingCategories = [], onClose, onLetterSaved }) {
  const isEditing = Boolean(letterToEdit);
  const [title, setTitle] = useState(letterToEdit?.title || '');
  const [moodTag, setMoodTag] = useState(letterToEdit?.mood_tag || 'Mở khi nhớ nhau');
  const [content, setContent] = useState(letterToEdit?.content || '');
  const [paperStyle, setPaperStyle] = useState(letterToEdit?.paper_style || 'kraft');
  const [photos, setPhotos] = useState(() => {
    if (letterToEdit?.photos) {
      return letterToEdit.photos.map(p => typeof p === 'string' ? { url: p, caption: '' } : p);
    }
    return [];
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
  const [quizType, setQuizType] = useState(letterToEdit?.quiz?.quiz_type || 'choice'); // 'choice' | 'text'
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

  const defaultSuggestions = ['Mở khi nhớ nhau', 'Mở khi buồn', 'Mở khi giận nhau', 'Mở khi đi xa', 'Kỷ niệm', 'Tâm sự đêm khuya'];
  const allSuggestions = Array.from(new Set([...existingCategories, ...defaultSuggestions])).filter(Boolean);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setPhotos([...photos, { url: res.url, caption: 'Kỷ niệm của hai đứa ☕' }]);
    } catch (err) {
      setError('Tải ảnh thất bại: ' + err.message);
    }
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

    setLoading(true);
    setError('');

    try {
      const payload = {
        receiver_id: partner.id,
        title: title.trim(),
        mood_tag: moodTag.trim(),
        content: content.trim(),
        paper_style: paperStyle,
        photos: photos.map(p => p.url),
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

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.55)',
      backdropFilter: 'blur(5px)',
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
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        boxShadow: 'var(--shadow-warm)',
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

        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
          {isEditing ? `Chỉnh Sửa Lá Thư Gửi ${partner.display_name} 📝` : `Soạn Lá Thư Mới Cho ${partner.display_name} 💌`}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Gửi gắm lời yêu thương, cảm xúc và cài đặt thử thách ngọt ngào
        </p>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSave('sent'); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Custom Category Tag */}
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
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            />
            {/* Quick Suggestions Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Gợi ý nhanh:</span>
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
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
          </div>

          {/* Paper Style Selector */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Chất liệu giấy thư:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'kraft', name: 'Giấy Kraft Cổ Điển', bg: '#e8dcce' },
                { id: 'pink_pastel', name: 'Hồng Pastel Dịu Ngọt', bg: '#ffd6e0' },
                { id: 'caro_grid', name: 'Caro Tối Giản', bg: '#f1f1f1' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPaperStyle(p.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: paperStyle === p.id ? '2px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                    background: p.bg,
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Content */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Nội dung lá thư:
            </label>
            <textarea
              required
              rows={6}
              placeholder="Viết nội dung lá thư tại đây..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                background: paperStyle === 'kraft' ? '#fbf8f2' : (paperStyle === 'pink_pastel' ? '#fffafb' : '#fff'),
                fontSize: '14.5px',
                lineHeight: '1.7',
                color: 'var(--text-ink)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Real Photo Attachment (Polaroid) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Đính kèm ảnh (Polaroid):
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
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {photos.map((p, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={p.url} alt="attach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      style={{
                        position: 'absolute',
                        top: '2px', right: '2px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px', height: '18px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Time Lock */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#fdf9f4', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
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
                  style={{ width: '70px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--rose-primary)' }}>❤️ Trái Tim</span>
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
                style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Quiz Configuration Toggle */}
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--rose-primary)" />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Cài đặt câu đố tình yêu để mở khóa</span>
              </div>
              <input
                type="checkbox"
                checked={hasQuiz}
                onChange={(e) => setHasQuiz(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--rose-primary)' }}
              />
            </div>

            {hasQuiz && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setQuizType('choice')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: quizType === 'choice' ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                      background: quizType === 'choice' ? 'var(--rose-light)' : '#fcfaf6',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Trắc nghiệm 4 lựa chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizType('text')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: quizType === 'text' ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                      background: quizType === 'text' ? 'var(--rose-light)' : '#fcfaf6',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Tự nhập câu trả lời
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Câu hỏi kỷ niệm:
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập câu hỏi thử thách..."
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13.5px' }}
                  />
                </div>

                {quizType === 'choice' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      Nhập các đáp án lựa chọn:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {quizOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', width: '16px' }}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <input
                            type="text"
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...quizOptions];
                              newOpts[i] = e.target.value;
                              setQuizOptions(newOpts);
                            }}
                            style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12.5px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Đáp án chính xác:
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập chính xác đáp án..."
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Gợi ý (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="Gợi ý ngọt ngào..."
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Phí bỏ qua câu đố:
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={bypassCost}
                      onChange={(e) => setBypassCost(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Save Draft vs Send */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave('draft')}
              style={{
                flex: 1,
                background: '#f4ece1',
                color: 'var(--text-ink)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '13px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Archive size={16} />
              <span>Lưu kho lưu trữ (Nháp)</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave('sent')}
              style={{
                flex: 1.3,
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '13px',
                fontSize: '14.5px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(224, 109, 126, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              <span>{loading ? 'Đang xử lý...' : (isEditing ? 'Cập Nhật & Gửi Đi 💌' : 'Niêm Phong & Gửi Thư 💌')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
