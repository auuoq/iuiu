import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client.js';
import { X, Lock, Clock, Heart, HelpCircle, Check, AlertCircle, Sparkles, ArrowDown } from 'lucide-react';

export function LetterUnlockModal({ letter, userBalance, onClose, onUnlockSuccess }) {
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isTimeLocked = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
  const quiz = letter.quiz;
  const bypassCost = quiz ? quiz.bypass_cost : 10;
  const totalBypass = (letter.open_heart_cost || 0) + bypassCost;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#e06d7e', '#ff4757', '#ffd1dc', '#f6da8c', '#ffffff']
      });
    } catch (e) {}
  };

  // Step 1: Open the envelope flap by clicking the heart in the center
  const handleOpenFlap = () => {
    if (isFlapOpen) return;
    setIsFlapOpen(true);
    triggerConfetti();
  };

  // Step 2: Answering quiz or unlocking letter
  const executeUnlock = async (actionFn) => {
    setError('');
    setLoading(true);
    try {
      await actionFn();
      setIsCompleting(true);
      triggerConfetti();
      setTimeout(() => {
        onUnlockSuccess(letter.id);
      }, 700);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    const answer = quiz.quiz_type === 'choice' ? selectedChoice : textAnswer;
    if (!answer) {
      setError('Vui lòng chọn hoặc nhập câu trả lời của bạn');
      return;
    }
    executeUnlock(() => api.unlockLetter(letter.id, { answer, useBypass: false }));
  };

  const handleBypassSubmit = () => {
    executeUnlock(() => api.unlockLetter(letter.id, { useBypass: true }));
  };

  const handleSimpleOpen = () => {
    executeUnlock(() => api.unlockLetter(letter.id, {}));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(38, 30, 26, 0.72)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div className="craft-envelope-container">
        {/* Close Modal Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: isFlapOpen ? '-50px' : '-44px',
            right: '4px',
            background: 'rgba(255,255,255,0.85)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-ink)',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <X size={18} />
        </button>

        {/* ================= CRAFT ENVELOPE BODY ================= */}
        <div
          className="craft-envelope-pocket"
          style={{
            marginTop: isFlapOpen ? '70px' : '0',
            transition: 'margin-top 0.6s ease'
          }}
        >
          {/* Top Curved Flap (Nắp phong bì gập cong) */}
          <div className={`craft-envelope-top-flap ${isFlapOpen ? 'is-open' : ''}`}>
            {/* Heart Clasp Button in the center (Khóa hình trái tim ở giữa nắp) */}
            {!isFlapOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-25px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 30
                }}
              >
                <button
                  type="button"
                  onClick={handleOpenFlap}
                  className="heart-clasp-btn"
                  title="Nhấn vào trái tim để mở phong bì"
                >
                  <Heart size={26} color="#fff" fill="#fff" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Fold Diagonal overlay */}
          <div className="craft-envelope-bottom-fold" />

          {/* Envelope Front Details when SEALED */}
          {!isFlapOpen ? (
            <div style={{
              padding: '110px 28px 30px 28px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10
            }}>
              {/* Postage Stamp at top-right */}
              <div
                className="postage-stamp"
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '24px',
                  transform: 'rotate(4deg)'
                }}
              >
                <span style={{ fontSize: '18px' }}>🌹</span>
                <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--rose-primary)' }}>
                  {letter.open_heart_cost} ❤️
                </span>
              </div>

              {/* Title & Sender */}
              <div style={{
                fontFamily: 'var(--font-handwriting)',
                fontSize: '32px',
                color: '#fff',
                textShadow: '0 2px 6px rgba(0,0,0,0.25)',
                lineHeight: 1.2
              }}>
                {letter.title}
              </div>

              <div style={{
                color: 'rgba(255,255,255,0.88)',
                fontSize: '13px',
                marginTop: '6px',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>
                Gửi từ: <strong style={{ color: '#fff' }}>{letter.sender_name}</strong>
              </div>

              {/* Interactive prompt to tap heart */}
              <div
                onClick={handleOpenFlap}
                style={{
                  marginTop: '45px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.92)',
                  color: '#945869',
                  padding: '7px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  animation: 'heartClaspPulse 2s infinite ease-in-out'
                }}
              >
                <Sparkles size={14} color="#945869" />
                <span>Chạm vào trái tim ở giữa để mở thư 💌</span>
              </div>
            </div>
          ) : (
            /* ================= STAGE 2: ENVELOPE OPENED & LETTER SLIDES OUT ================= */
            <div
              className="letter-sheet-card"
              style={{
                position: 'relative',
                zIndex: 12,
                background: '#fffdfa',
                border: '1px solid #ebd9c8',
                borderRadius: '18px',
                padding: '24px 26px',
                margin: '0 12px',
                boxShadow: '0 20px 45px rgba(50, 30, 38, 0.22)',
                color: 'var(--text-ink)'
              }}
            >
              {/* Letter Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px dashed var(--border-subtle)',
                paddingBottom: '14px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--rose-primary)', textTransform: 'uppercase' }}>
                    {letter.mood_tag || 'Lá Thư Kỷ Niệm'}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-ink)', marginTop: '2px' }}>
                    {letter.title}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Người gửi: <strong>{letter.sender_name}</strong> • Phí mở: <strong>{letter.open_heart_cost} ❤️</strong>
                  </div>
                </div>

                <div className="wax-seal" style={{ width: '44px', height: '44px', fontSize: '18px' }}>
                  ❤️
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={15} flexShrink={0} />
                  <span>{error}</span>
                </div>
              )}

              {/* CASE A: Time Locked */}
              {isTimeLocked ? (
                <div style={{
                  background: '#fdf7eb',
                  border: '1px solid #ebd9b5',
                  borderRadius: '14px',
                  padding: '18px',
                  textAlign: 'center'
                }}>
                  <Clock size={28} color="#b07d48" style={{ margin: '0 auto 6px auto' }} />
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#8a6230' }}>
                    Lá thư đang hẹn giờ niêm phong
                  </div>
                  <p style={{ fontSize: '13px', color: '#a67c48', marginTop: '6px', lineHeight: '1.5' }}>
                    Bức thư này được hẹn giờ mở vào lúc:
                    <br />
                    <strong style={{ fontSize: '14px' }}>{new Date(letter.time_lock_at).toLocaleString('vi-VN')}</strong>.
                    <br />
                    Hãy kiên nhẫn chờ đến thời khắc bất ngờ nhé ⏳!
                  </p>
                </div>
              ) : quiz ? (
                /* CASE B: Has Quiz Challenge */
                <div>
                  <div style={{
                    background: 'var(--rose-light)',
                    border: '1px dashed var(--rose-border)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '14px'
                  }}>
                    <div style={{
                      fontSize: '11.5px',
                      fontWeight: '800',
                      color: 'var(--rose-primary)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      ✨ CÂU ĐỐ MỞ KHÓA THƯ:
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-ink)', lineHeight: '1.4' }}>
                      {quiz.question}
                    </div>
                  </div>

                  {/* Multiple Choice */}
                  {quiz.quiz_type === 'choice' && quiz.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                      {quiz.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedChoice(opt)}
                          disabled={loading || isCompleting}
                          style={{
                            padding: '10px 14px',
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
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: selectedChoice === opt ? 'var(--rose-primary)' : '#eee',
                            color: selectedChoice === opt ? '#fff' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text Input */}
                  {quiz.quiz_type === 'text' && (
                    <div style={{ marginBottom: '14px' }}>
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời của bạn..."
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={loading || isCompleting}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
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
                    <div style={{ marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b07d48',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <HelpCircle size={13} /> {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý ngọt ngào'}
                      </button>
                      {showHint && (
                        <div style={{
                          background: '#fdf9f4',
                          border: '1px dashed #ebd9b5',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          color: '#8a6230',
                          marginTop: '4px'
                        }}>
                          💡 <em>{quiz.hint}</em>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleAnswerSubmit}
                      disabled={loading || isCompleting}
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
                        boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={16} />
                      <span>{loading ? 'Đang kiểm tra...' : `Xác Nhận & Đọc Thư (-${letter.open_heart_cost} ❤️)`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBypassSubmit}
                      disabled={loading || isCompleting}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px dashed var(--rose-primary)',
                        color: 'var(--rose-primary)',
                        borderRadius: '12px',
                        padding: '9px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Năn nỉ mở bằng {totalBypass} ❤️ (Bỏ qua câu đố)
                    </button>
                  </div>
                </div>
              ) : (
                /* CASE C: Simple letter without quiz */
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{
                    fontSize: '14.5px',
                    color: 'var(--text-ink)',
                    marginBottom: '18px',
                    lineHeight: '1.5'
                  }}>
                    Bạn đã mở nắp phong bì! Dùng{' '}
                    <strong style={{ color: 'var(--rose-primary)' }}>{letter.open_heart_cost} ❤️</strong>{' '}
                    để rút bức thư và đọc trọn vẹn ngay nhé.
                  </p>

                  <button
                    type="button"
                    onClick={handleSimpleOpen}
                    disabled={loading || isCompleting}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #e06d7e 0%, #c95264 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: (loading || isCompleting) ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(224, 109, 126, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>{loading ? 'Đang mở thư...' : `Rút Thư Ra Đọc Ngay (-${letter.open_heart_cost} ❤️)`}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
