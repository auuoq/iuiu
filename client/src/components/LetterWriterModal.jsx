import React, { useState } from 'react';
import { api } from '../api/client.js';
import { X, Image, Sparkles, HelpCircle, Calendar, Heart, Upload } from 'lucide-react';

export function LetterWriterModal({ partner, onClose, onLetterCreated }) {
  const [title, setTitle] = useState('');
  const [moodTag, setMoodTag] = useState('sad');
  const [content, setContent] = useState('');
  const [paperStyle, setPaperStyle] = useState('kraft');
  const [photos, setPhotos] = useState([]);
  const [openHeartCost, setOpenHeartCost] = useState(5);
  const [timeLockAt, setTimeLockAt] = useState('');
  
  // Quiz states
  const [hasQuiz, setHasQuiz] = useState(false);
  const [quizType, setQuizType] = useState('choice'); // 'choice' | 'text'
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [quizHint, setQuizHint] = useState('');
  const [bypassCost, setBypassCost] = useState(15);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung lá thư');
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
        title,
        mood_tag: moodTag,
        content,
        paper_style: paperStyle,
        photos: photos.map(p => p.url),
        open_heart_cost: Number(openHeartCost),
        time_lock_at: timeLockAt ? new Date(timeLockAt).toISOString() : null
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
      }

      const res = await api.createLetter(payload);
      onLetterCreated(res.letter);
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
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
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
          Soạn Lá Thư Mới Cho {partner.display_name} 💌
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Gửi gắm lời yêu thương, cảm xúc và cài đặt thử thách ngọt ngào
        </p>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mood Tag */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Danh mục cảm xúc ("Open When..."):
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'sad', label: 'Mở khi em buồn 🌧️' },
                { id: 'miss', label: 'Mở khi nhớ anh 🥺' },
                { id: 'angry', label: 'Mở khi giận nhau 💔' },
                { id: 'secret', label: 'Thư bí mật 🤫' },
                { id: 'anniversary', label: 'Kỷ niệm 🎂' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMoodTag(m.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: moodTag === m.id ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                    background: moodTag === m.id ? 'var(--rose-light)' : '#fff',
                    color: moodTag === m.id ? 'var(--rose-primary)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
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
              placeholder="Ví dụ: Mở khi em cảm thấy áp lực vì công việc..."
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

          {/* Paper Style */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Màu giấy viết thư:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'kraft', label: 'Giấy Kraft mộc', bg: '#f4ece1', border: '#d8c8ba' },
                { id: 'pink_pastel', label: 'Hồng ngọt ngào', bg: '#fdf2f4', border: '#f5c6cb' },
                { id: 'caro_grid', label: 'Kẻ ô Caro', bg: '#ffffff', border: '#d0d7de' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPaperStyle(p.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: p.bg,
                    border: paperStyle === p.id ? '2px solid var(--rose-primary)' : `1px solid ${p.border}`,
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Content */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Nội dung tâm tình:
            </label>
            <textarea
              required
              rows={6}
              placeholder="Hãy viết những lời ngọt ngào, chân thành nhất gửi đến người ấy..."
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
                Đính kèm ảnh kỷ niệm thật (Polaroid):
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
                <Upload size={13} /> + Thêm ảnh thật
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>

            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 0' }}>
                {photos.map((p, idx) => (
                  <div key={idx} style={{
                    position: 'relative',
                    width: '90px',
                    background: '#fff',
                    padding: '4px 4px 10px 4px',
                    boxShadow: 'var(--shadow-polaroid)',
                    borderRadius: '2px',
                    flexShrink: 0
                  }}>
                    <img src={p.url} alt="attached" style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#e06d7e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
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
                Hẹn giờ mở thư (Tùy chọn):
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={hasQuiz}
                onChange={(e) => setHasQuiz(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--rose-primary)' }}
              />
              <span>🔒 Cài đặt Câu Đố Bí Mật (Quiz) trước khi mở thư</span>
            </label>

            {hasQuiz && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setQuizType('choice')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: quizType === 'choice' ? 'var(--rose-light)' : '#f0ece4',
                      color: quizType === 'choice' ? 'var(--rose-primary)' : '#666',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Trắc Nghiệm (Chọn đáp án)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizType('text')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: quizType === 'text' ? 'var(--rose-light)' : '#f0ece4',
                      color: quizType === 'text' ? 'var(--rose-primary)' : '#666',
                      border: 'none',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Nhập Chữ Tự Do
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Câu hỏi kỷ niệm:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lần đầu mình đi xem phim là phim gì?"
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
                            style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
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
                    placeholder="Nhập đáp án đúng"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13.5px', fontWeight: '600' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Gợi ý ngọt ngào (Hint):
                    </label>
                    <input
                      type="text"
                      placeholder="Gợi ý nếu người ấy quên..."
                      value={quizHint}
                      onChange={(e) => setQuizHint(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Số ❤️ chuộc thư nếu trả lời sai:
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={bypassCost}
                      onChange={(e) => setBypassCost(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--rose-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(224, 109, 126, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px'
            }}
          >
            <span>{loading ? 'Đang niêm phong sáp...' : 'Niêm Phong Sáp & Gửi Đi 💌'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
