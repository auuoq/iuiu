import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client.js';
import { X, Lock, Clock, Heart, HelpCircle, Check, AlertCircle } from 'lucide-react';

export function LetterUnlockModal({ letter, userBalance, onClose, onUnlockSuccess }) {
  const [selectedChoice, setSelectedChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isTimeLocked = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
  const quiz = letter.quiz;
  const bypassCost = quiz ? quiz.bypass_cost : 10;
  const totalBypass = (letter.open_heart_cost || 0) + bypassCost;

  const triggerSuccessEffects = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e06d7e', '#ff4757', '#ffd1dc', '#f6da8c']
      });
    } catch (e) {}
  };

  const handleAnswerSubmit = async () => {
    setError('');
    const answer = quiz.quiz_type === 'choice' ? selectedChoice : textAnswer;
    if (!answer) {
      setError('Vui lòng chọn hoặc nhập câu trả lời của bạn');
      return;
    }

    setLoading(true);
    try {
      await api.unlockLetter(letter.id, { answer, useBypass: false });
      triggerSuccessEffects();
      onUnlockSuccess(letter.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBypassSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.unlockLetter(letter.id, { useBypass: true });
      triggerSuccessEffects();
      onUnlockSuccess(letter.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleOpen = async () => {
    setError('');
    setLoading(true);
    try {
      await api.unlockLetter(letter.id, {});
      triggerSuccessEffects();
      onUnlockSuccess(letter.id);
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
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--paper-cream)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        boxShadow: 'var(--shadow-warm)',
        position: 'relative',
        textAlign: 'center'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Big Wax Seal */}
        <div style={{ margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center' }}>
          <div className="wax-seal" style={{ width: '64px', height: '64px', fontSize: '26px' }}>
            {isTimeLocked ? '⏳' : (quiz ? '🔒' : '❤️')}
          </div>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>
          {letter.title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Từ: <strong>{letter.sender_name}</strong> • Phí mở: <strong>{letter.open_heart_cost} ❤️</strong>
        </p>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {/* Case 1: Time Locked in the future */}
        {isTimeLocked ? (
          <div style={{ background: '#fdf7eb', border: '1px solid #ebd9b5', borderRadius: '16px', padding: '20px' }}>
            <Clock size={32} color="#b07d48" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#8a6230' }}>
              Lá thư đang hẹn giờ niêm phong
            </div>
            <p style={{ fontSize: '13px', color: '#a67c48', marginTop: '6px', lineHeight: '1.5' }}>
              Bức thư này được người ấy hẹn giờ mở vào lúc:
              <br />
              <strong>{new Date(letter.time_lock_at).toLocaleString('vi-VN')}</strong>.
              <br />
              Hãy kiên nhẫn chờ đến ngày đặc biệt nhé ⏳!
            </p>
          </div>
        ) : quiz ? (
          /* Case 2: Love Quiz Challenge */
          <div style={{ textAlign: 'left', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--rose-primary)', letterSpacing: '0.5px' }}>
                THỬ THÁCH MỞ KHÓA
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-ink)', marginBottom: '14px', lineHeight: '1.4' }}>
              {quiz.question}
            </div>

            {/* Multiple Choice */}
            {quiz.quiz_type === 'choice' && quiz.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedChoice(opt)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: selectedChoice === opt ? '2px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                      background: selectedChoice === opt ? 'var(--rose-light)' : '#fff',
                      color: selectedChoice === opt ? 'var(--rose-primary)' : 'var(--text-ink)',
                      fontWeight: selectedChoice === opt ? '700' : '500',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: selectedChoice === opt ? 'var(--rose-primary)' : '#eee', color: selectedChoice === opt ? '#fff' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Text Input */}
            {quiz.quiz_type === 'text' && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Nhập câu trả lời của bạn..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                />
              </div>
            )}

            {/* Hint */}
            {quiz.hint && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  style={{ background: 'none', border: 'none', color: '#b07d48', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <HelpCircle size={13} /> {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý ngọt ngào'}
                </button>
                {showHint && (
                  <div style={{ background: '#fdf9f4', border: '1px dashed #ebd9b5', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#8a6230', marginTop: '6px' }}>
                    💡 <em>{quiz.hint}</em>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleAnswerSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)'
                }}
              >
                {loading ? 'Đang mở sáp...' : `Bóc Sáp Mở Thư (-${letter.open_heart_cost} ❤️)`}
              </button>

              <button
                onClick={handleBypassSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px dashed var(--rose-primary)',
                  color: 'var(--rose-primary)',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Năn nỉ xin mở bằng {totalBypass} ❤️ (Bỏ qua câu đố)
              </button>
            </div>
          </div>
        ) : (
          /* Case 3: Simple Letter without quiz */
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-ink)', marginBottom: '18px', lineHeight: '1.5' }}>
              Lá thư này không có câu đố thử thách. Bạn có muốn dùng <strong>{letter.open_heart_cost} ❤️</strong> để bóc tem sáp mở thư không?
            </p>
            <button
              onClick={handleSimpleOpen}
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)'
              }}
            >
              {loading ? 'Đang bóc tem...' : `Bóc Tem Mở Thư Ngay (-${letter.open_heart_cost} ❤️)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
