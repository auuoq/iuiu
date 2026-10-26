import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client.js';
import { X, Lock, Clock, Heart, HelpCircle, Check, AlertCircle, Sparkles } from 'lucide-react';

export function LetterUnlockModal({ letter, userBalance, onClose, onUnlockSuccess }) {
  const [selectedChoice, setSelectedChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const isTimeLocked = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
  const quiz = letter.quiz;
  const bypassCost = quiz ? quiz.bypass_cost : 10;
  const totalBypass = (letter.open_heart_cost || 0) + bypassCost;

  const triggerSuccessEffects = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#e06d7e', '#ff4757', '#ffd1dc', '#f6da8c', '#ffffff']
      });
    } catch (e) {}
  };

  const executeOpenFlow = async (unlockFn) => {
    setError('');
    setLoading(true);
    try {
      await unlockFn();
      // Start envelope 3D opening animation
      setIsOpening(true);
      triggerSuccessEffects();
      // Wait for flap flip & letter slide-up animation to complete
      setTimeout(() => {
        onUnlockSuccess(letter.id);
      }, 1000);
    } catch (err) {
      setError(err.message);
      setIsOpening(false);
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    const answer = quiz.quiz_type === 'choice' ? selectedChoice : textAnswer;
    if (!answer) {
      setError('Vui lòng chọn hoặc nhập câu trả lời của bạn');
      return;
    }
    executeOpenFlow(() => api.unlockLetter(letter.id, { answer, useBypass: false }));
  };

  const handleBypassSubmit = () => {
    executeOpenFlow(() => api.unlockLetter(letter.id, { useBypass: true }));
  };

  const handleSimpleOpen = () => {
    executeOpenFlow(() => api.unlockLetter(letter.id, {}));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div className="envelope-3d-wrapper">
        <div className="envelope-card" style={{
          transform: isOpening ? 'scale(1.03) translateY(-10px)' : 'none',
          boxShadow: isOpening ? '0 30px 60px rgba(224, 109, 126, 0.35)' : undefined
        }}>
          {/* Airmail Decorative Top Border */}
          <div className="airmail-stripe" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isOpening}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              cursor: isOpening ? 'not-allowed' : 'pointer',
              zIndex: 30
            }}
          >
            <X size={17} />
          </button>

          {/* Envelope Header (Stamp & Address info) */}
          <div style={{
            padding: '24px 28px 16px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--rose-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>💌</span> THƯ TÌNH CHỜ MỞ
              </div>
              <h2 style={{
                fontFamily: 'var(--font-handwriting)',
                fontSize: '28px',
                color: 'var(--text-ink)',
                marginTop: '2px',
                lineHeight: 1.2
              }}>
                {letter.title}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Gửi từ: <strong style={{ color: 'var(--text-ink)' }}>{letter.sender_name}</strong>
              </div>
            </div>

            {/* Postage Stamp */}
            <div className="postage-stamp">
              <span style={{ fontSize: '20px' }}>🌹</span>
              <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--rose-primary)', marginTop: '2px' }}>
                {letter.open_heart_cost} ❤️
              </span>
            </div>
          </div>

          {/* Realistic Envelope Triangular Flap Area */}
          <div style={{
            position: 'relative',
            height: '80px',
            background: 'linear-gradient(to bottom, #eddccb 0%, #f4e8dc 100%)',
            borderTop: '1px solid #dfcfbe',
            borderBottom: '1px solid #dfcfbe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible'
          }}>
            {/* Background envelope fold diagonals */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              background: '#f8ece0',
              opacity: 0.6
            }} />

            {/* Inside letter sheet peeking out when opening */}
            {isOpening && (
              <div
                className="letter-sheet-emerging"
                style={{
                  position: 'absolute',
                  width: '88%',
                  height: '140px',
                  background: '#fffdfa',
                  border: '1px solid #ebd9c8',
                  borderRadius: '10px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <Sparkles size={24} color="var(--rose-primary)" />
                <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: '22px', color: 'var(--rose-primary)', fontWeight: '700' }}>
                  Đang mở bức thư tình... ✨
                </div>
              </div>
            )}

            {/* Central 3D Wax Seal */}
            <div
              onClick={() => {
                if (!loading && !isOpening && !isTimeLocked && !quiz) {
                  handleSimpleOpen();
                }
              }}
              className={`wax-seal ${isOpening ? 'seal-breaking' : ''}`}
              title={quiz ? 'Thư có câu đố thử thách' : 'Nhấp để bóc tem sáp mở thư'}
              style={{
                width: '68px',
                height: '68px',
                fontSize: '28px',
                zIndex: 25,
                boxShadow: '0 6px 16px rgba(128, 30, 30, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
                cursor: (quiz || isTimeLocked || isOpening) ? 'default' : 'pointer'
              }}
            >
              {isTimeLocked ? '⏳' : (quiz ? '🔒' : '❤️')}
            </div>
          </div>

          {/* Envelope Body Content / Quiz / Action */}
          <div style={{ padding: '24px 28px 26px 28px', background: '#fffdf9' }}>
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Case 1: Time Locked in future */}
            {isTimeLocked ? (
              <div style={{
                background: '#fdf7eb',
                border: '1px solid #ebd9b5',
                borderRadius: '16px',
                padding: '18px',
                textAlign: 'center'
              }}>
                <Clock size={28} color="#b07d48" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#8a6230' }}>
                  Lá thư đang hẹn giờ niêm phong
                </div>
                <p style={{ fontSize: '13px', color: '#a67c48', marginTop: '6px', lineHeight: '1.5' }}>
                  Bức thư này được người ấy hẹn giờ mở vào lúc:
                  <br />
                  <strong style={{ fontSize: '14px' }}>{new Date(letter.time_lock_at).toLocaleString('vi-VN')}</strong>.
                  <br />
                  Hãy kiên nhẫn chờ đến thời khắc bất ngờ nhé ⏳!
                </p>
              </div>
            ) : quiz ? (
              /* Case 2: Quiz Challenge */
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  background: 'var(--rose-light)',
                  border: '1px dashed var(--rose-border)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '11px',
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

                {/* Multiple choice */}
                {quiz.quiz_type === 'choice' && quiz.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {quiz.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedChoice(opt)}
                        disabled={loading || isOpening}
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

                {/* Text answer */}
                {quiz.quiz_type === 'text' && (
                  <div style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Nhập câu trả lời của bạn..."
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      disabled={loading || isOpening}
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
                        marginTop: '6px'
                      }}>
                        💡 <em>{quiz.hint}</em>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={loading || isOpening}
                    style={{
                      width: '100%',
                      background: 'var(--rose-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(224, 109, 126, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>{isOpening ? 'Đang mở phong bì...' : `Bóc Sáp Mở Thư (-${letter.open_heart_cost} ❤️)`}</span>
                  </button>

                  <button
                    onClick={handleBypassSubmit}
                    disabled={loading || isOpening}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px dashed var(--rose-primary)',
                      color: 'var(--rose-primary)',
                      borderRadius: '12px',
                      padding: '10px',
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
              /* Case 3: Simple Letter without quiz */
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '14.5px',
                  color: 'var(--text-ink)',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  Lá thư này đang được niêm phong cẩn thận. Bạn có muốn dùng{' '}
                  <strong style={{ color: 'var(--rose-primary)' }}>{letter.open_heart_cost} ❤️</strong>{' '}
                  để bóc con dấu sáp và mở đọc thư ngay không?
                </p>

                <button
                  onClick={handleSimpleOpen}
                  disabled={loading || isOpening}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #e06d7e 0%, #c95264 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '13px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: (loading || isOpening) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 18px rgba(224, 109, 126, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!loading && !isOpening) e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Sparkles size={16} />
                  <span>{isOpening ? '✨ Đang bóc tem & mở thư...' : `Bóc Tem Mở Thư Ngay (-${letter.open_heart_cost} ❤️)`}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Airmail Border */}
          <div className="airmail-stripe" />
        </div>
      </div>
    </div>
  );
}
