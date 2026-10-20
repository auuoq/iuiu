import React, { useState } from 'react';
import { Mail, Clock, Lock, CheckCircle2, Plus, Sparkles } from 'lucide-react';

export function LetterList({ letters, onSelectLetter, onOpenWriter, currentUserId }) {
  const [filterMood, setFilterMood] = useState('all');

  const filtered = letters.filter(l => {
    if (filterMood === 'all') return true;
    if (filterMood === 'opened') return l.is_opened === 1;
    if (filterMood === 'timelock') return l.time_lock_at && new Date(l.time_lock_at) > new Date();
    return l.mood_tag === filterMood;
  });

  const getMoodBadge = (tag) => {
    switch (tag) {
      case 'sad': return { label: 'Mở khi em buồn 🌧️', bg: '#eef2f5', color: '#4a6572' };
      case 'miss': return { label: 'Mở khi nhớ anh 🥺', bg: '#fdeef2', color: '#b83b5e' };
      case 'angry': return { label: 'Mở khi mình giận nhau 💔', bg: '#fcf0e8', color: '#c3512f' };
      case 'secret': return { label: 'Thư bí mật 🤫', bg: '#f3eef8', color: '#6a4c93' };
      case 'anniversary': return { label: 'Kỷ niệm đặc biệt 🎂', bg: '#fdf7e3', color: '#997300' };
      default: return { label: 'Thư ngọt ngào ✨', bg: '#fff0f3', color: 'var(--rose-primary)' };
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: 'var(--shadow-warm)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Hòm Thư Tình Yêu</span>
            <span style={{ fontSize: '13px', background: 'var(--rose-light)', color: 'var(--rose-primary)', padding: '2px 8px', borderRadius: '12px' }}>
              {letters.length} thư
            </span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Những bức thư được niêm phong cẩn thận, mở ra để cảm nhận sự ấm áp
          </p>
        </div>

        <button
          onClick={onOpenWriter}
          style={{
            background: 'var(--rose-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(224, 109, 126, 0.25)',
            transition: 'transform 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={16} />
          <span>Viết Thư Mới</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'sad', label: 'Mở khi buồn' },
          { id: 'miss', label: 'Mở khi nhớ' },
          { id: 'timelock', label: 'Hẹn giờ ⏳' },
          { id: 'opened', label: 'Đã mở (Đọc lại) 📖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterMood(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterMood === tab.id ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
              background: filterMood === tab.id ? 'var(--rose-light)' : '#fff',
              color: filterMood === tab.id ? 'var(--rose-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Letter Items */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          background: 'var(--bg-sand)',
          borderRadius: '16px',
          border: '1px dashed var(--border-subtle)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>💌</div>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>Chưa có lá thư nào trong mục này</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Hãy là người đầu tiên viết thư gửi đến người ấy nhé!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(letter => {
            const mood = getMoodBadge(letter.mood_tag);
            const isLockedTime = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
            const isOpened = Boolean(letter.is_opened);
            const isMine = letter.sender_id === currentUserId;

            return (
              <div
                key={letter.id}
                onClick={() => onSelectLetter(letter)}
                style={{
                  background: isOpened ? '#faf8f5' : '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--rose-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Wax Seal Icon */}
                <div 
                  className="wax-seal"
                  style={{
                    background: isOpened ? '#748c94' : (isLockedTime ? '#d4a373' : undefined)
                  }}
                >
                  {isOpened ? '📖' : (isLockedTime ? '⏳' : '❤️')}
                </div>

                {/* Letter Content Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: mood.bg,
                      color: mood.color
                    }}>
                      {mood.label}
                    </span>
                    {isLockedTime && (
                      <span style={{ fontSize: '11px', color: '#b07d48', background: '#fdf6ed', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                        ⏳ Hẹn giờ: {new Date(letter.time_lock_at).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {letter.has_quiz && !isOpened && (
                      <span style={{ fontSize: '11px', color: '#c94a5a', background: '#fdf2f4', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
                        🔒 Có câu đố
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-ink)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {letter.title}
                  </h3>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                    <span>Từ: <strong>{isMine ? 'Bạn' : letter.sender_name}</strong></span>
                    <span>•</span>
                    <span>Phí mở: <strong>{letter.open_heart_cost} ❤️</strong></span>
                    {isOpened && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#2e7d32', fontWeight: '600' }}>Đọc lại mọi lúc</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status indicator icon */}
                <div style={{ color: isOpened ? '#2e7d32' : 'var(--text-light)', paddingRight: '4px' }}>
                  {isOpened ? <CheckCircle2 size={20} /> : (isLockedTime ? <Clock size={20} /> : <Lock size={20} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
