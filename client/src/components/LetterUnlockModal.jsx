import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../api/client.js';
import { X, Lock, Clock, Heart, HelpCircle, Check, AlertCircle, Sparkles, HelpCircle as QuizIcon } from 'lucide-react';

import { PostageStamp } from './PostageStamp.jsx';

export function LetterUnlockModal({ letter, userBalance, onClose, onUnlockSuccess }) {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isOpeningFlap, setIsOpeningFlap] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const envCfg = letter.envelope_config || { color: 'dusty_rose', stamp_design: 'rose', stamp_image: null };
  const envClass = `env-${envCfg.color || 'dusty_rose'}`;

  const isTimeLocked = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
  const quiz = letter.quiz;
  const bypassCost = quiz ? quiz.bypass_cost : 10;
  const totalBypass = (letter.open_heart_cost || 0) + bypassCost;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#e06d7e', '#ff4757', '#ffd1dc', '#f6da8c', '#ffffff']
      });
    } catch (e) {}
  };

  // Called when user clicks the heart clasp or "Mở phong bì" button
  const handleHeartClick = () => {
    if (loading || isOpeningFlap) return;
    setError('');

    // If time-locked
    if (isTimeLocked) {
      alert(`⏳ Lá thư này được hẹn giờ mở vào lúc:\n${new Date(letter.time_lock_at).toLocaleString('vi-VN')}\nHãy kiên nhẫn chờ đến ngày đặc biệt nhé!`);
      return;
    }

    // If letter has a quiz, show the quiz popup first!
    if (quiz) {
      setShowQuizModal(true);
      return;
    }

    // If letter has no quiz, directly trigger the opening animation & unlock!
    runEnvelopeOpenAndUnlock(() => api.unlockLetter(letter.id, {}));
  };

  // Runs the 3D envelope flap opening animation, slides letter out, and calls onUnlockSuccess
  const runEnvelopeOpenAndUnlock = async (unlockPromiseFn) => {
    setLoading(true);
    setError('');
    try {
      await unlockPromiseFn();
      setShowQuizModal(false);
      // Trigger flap opening animation
      setIsOpeningFlap(true);
      triggerConfetti();

      // Wait for flap flip & letter slide-up animation (1s) before transitioning to letter reader
      setTimeout(() => {
        onUnlockSuccess(letter.id);
      }, 1050);
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
    runEnvelopeOpenAndUnlock(() => api.unlockLetter(letter.id, { answer, useBypass: false }));
  };

  const handleBypassSubmit = () => {
    runEnvelopeOpenAndUnlock(() => api.unlockLetter(letter.id, { useBypass: true }));
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
      <div className={`craft-envelope-container ${envClass}`}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isOpeningFlap || loading}
          style={{
            position: 'absolute',
            top: '-46px',
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
            cursor: (isOpeningFlap || loading) ? 'not-allowed' : 'pointer',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <X size={18} />
        </button>

        {/* ================= THE PHYSICAL CRAFT ENVELOPE ================= */}
        <div className={`craft-envelope-pocket ${envClass}`}>
          {/* Top Curved Flap (Nắp gập cong có khóa trái tim) */}
          <div className={`craft-envelope-top-flap ${isOpeningFlap ? 'is-open' : ''}`}>
            {/* Heart Clasp Button in the center */}
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
                onClick={handleHeartClick}
                className="heart-clasp-btn"
                title={`Nhấn vào trái tim để mở thư (-${letter.open_heart_cost} ❤️)`}
                style={{
                  transform: isOpeningFlap ? 'scale(1.3) rotate(15deg)' : undefined,
                  opacity: isOpeningFlap ? 0 : 1,
                  transition: 'opacity 0.4s, transform 0.4s'
                }}
              >
                <Heart size={26} color="#fff" fill="#fff" />
              </button>
            </div>
          </div>

          {/* Bottom Fold Diagonal overlay */}
          <div className="craft-envelope-bottom-fold" />

          {/* Inside letter sheet peeking out when opening */}
          {isOpeningFlap && (
            <div
              className="letter-sheet-card"
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                background: '#fffdf9',
                borderRadius: '14px',
                border: '1px solid #ebd9c8',
                padding: '24px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                zIndex: 10,
                textAlign: 'center'
              }}
            >
              <Sparkles size={28} color="var(--rose-primary)" style={{ margin: '0 auto 6px auto' }} />
              <div style={{ fontFamily: 'var(--font-handwriting)', fontSize: '26px', color: 'var(--rose-primary)', fontWeight: '700' }}>
                Đang rút lá thư tình yêu ra... ✨
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {letter.title}
              </div>
            </div>
          )}

          {/* Envelope Front Details when SEALED */}
          <div style={{
            padding: '100px 28px 30px 28px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10
          }}>
            {/* Custom Postage Stamp at top-right */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                right: '24px',
                transform: 'rotate(5deg)'
              }}
            >
              <PostageStamp
                design={envCfg.stamp_design || 'rose'}
                imageUrl={envCfg.stamp_image}
                cost={letter.open_heart_cost}
                size="md"
                showPostmark={true}
                postmarkDate={letter.created_at}
              />
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
              {quiz && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '11.5px' }}>🔒 Có câu đố</span>}
            </div>

            {/* Error Message if any */}
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '12.5px',
                marginTop: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} flexShrink={0} />
                <span>{error}</span>
              </div>
            )}

            {/* Interactive button showing heart cost directly */}
            <div style={{ marginTop: '50px' }}>
              <button
                type="button"
                onClick={handleHeartClick}
                disabled={loading || isOpeningFlap}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#945869',
                  padding: '9px 24px',
                  borderRadius: '24px',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                  cursor: (loading || isOpeningFlap) ? 'not-allowed' : 'pointer',
                  border: 'none',
                  animation: 'heartClaspPulse 2s infinite ease-in-out',
                  transition: 'transform 0.15s'
                }}
              >
                <Sparkles size={15} color="#945869" />
                <span>
                  {isOpeningFlap ? '✨ Đang mở phong bì...' : `Chạm vào trái tim để mở thư (-${letter.open_heart_cost} ❤️)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= STEP 2 POPUP: LOVE QUIZ CHALLENGE (If has quiz) ================= */}
      {showQuizModal && quiz && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#fffdfa',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: 'var(--shadow-warm)',
            position: 'relative'
          }}>
            {/* Close Quiz Modal */}
            <button
              type="button"
              onClick={() => { setShowQuizModal(false); setError(''); }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Quiz Header */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--rose-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto'
              }}>
                <Lock size={22} color="var(--rose-primary)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                Câu Đố Thử Thách Mở Thư 🔒
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Từ {letter.sender_name}: Hãy giải câu đố để bóc tem sáp mở thư nhé!
              </p>
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

            {/* Question Box */}
            <div style={{
              background: 'var(--rose-light)',
              border: '1px dashed var(--rose-border)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-ink)', lineHeight: '1.4' }}>
                {quiz.question}
              </div>
            </div>

            {/* Multiple Choice */}
            {quiz.quiz_type === 'choice' && quiz.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedChoice(opt)}
                    disabled={loading}
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
                      gap: '10px'
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

            {/* Text Answer */}
            {quiz.quiz_type === 'text' && (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Nhập câu trả lời của bạn..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={loading}
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
                    marginTop: '4px'
                  }}>
                    💡 <em>{quiz.hint}</em>
                  </div>
                )}
              </div>
            )}

            {/* Submit & Bypass Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
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
                  boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Đang mở khóa...' : `Mở Khóa Bóc Thư (-${letter.open_heart_cost} ❤️)`}</span>
              </button>

              <button
                type="button"
                onClick={handleBypassSubmit}
                disabled={loading}
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
        </div>
      )}
    </div>
  );
}
