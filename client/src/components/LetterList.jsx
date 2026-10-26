import React, { useState } from 'react';
import { Mail, Clock, Lock, CheckCircle2, Plus, Sparkles, Edit3, Trash2, Send, Archive } from 'lucide-react';

export function LetterList({ letters, onSelectLetter, onOpenWriter, onEditLetter, onDeleteLetter, onSendDraft, currentUserId }) {
  const [filterTab, setFilterTab] = useState('all');

  // Extract all custom categories created across non-draft letters
  const customCategories = Array.from(
    new Set(letters.filter(l => l.status !== 'draft').map(l => l.mood_tag).filter(Boolean))
  );

  const draftCount = letters.filter(l => l.status === 'draft' || l.status === 'archived').length;

  const filtered = letters.filter(l => {
    if (filterTab === 'all') {
      return l.status !== 'draft';
    }
    if (filterTab === 'drafts') {
      return l.status === 'draft' || l.status === 'archived';
    }
    if (filterTab === 'unopened') {
      return !l.is_opened && l.status !== 'draft';
    }
    if (filterTab === 'opened') {
      return Boolean(l.is_opened);
    }
    if (filterTab.startsWith('cat:')) {
      const cat = filterTab.replace('cat:', '');
      return l.mood_tag === cat && l.status !== 'draft';
    }
    return true;
  });

  const getCategoryColor = (tag) => {
    const palette = [
      { bg: '#fdeef2', color: '#b83b5e' },
      { bg: '#eef2f5', color: '#4a6572' },
      { bg: '#fdf7e3', color: '#997300' },
      { bg: '#f3eef8', color: '#6a4c93' },
      { bg: '#fcf0e8', color: '#c3512f' },
      { bg: '#eaf5ea', color: '#2e7d32' }
    ];
    let hash = 0;
    for (let i = 0; i < (tag || '').length; i++) {
      hash = (hash << 5) - hash + tag.charCodeAt(i);
    }
    return palette[Math.abs(hash) % palette.length];
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
              {letters.filter(l => l.status !== 'draft').length} thư
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
        <button
          onClick={() => setFilterTab('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterTab === 'all' ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
            background: filterTab === 'all' ? 'var(--rose-light)' : '#fff',
            color: filterTab === 'all' ? 'var(--rose-primary)' : 'var(--text-muted)',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Tất cả
        </button>

        {/* Dynamic Categories */}
        {customCategories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setFilterTab(`cat:${cat}`)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterTab === `cat:${cat}` ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
              background: filterTab === `cat:${cat}` ? 'var(--rose-light)' : '#fff',
              color: filterTab === `cat:${cat}` ? 'var(--rose-primary)' : 'var(--text-muted)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}

        <button
          onClick={() => setFilterTab('unopened')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterTab === 'unopened' ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
            background: filterTab === 'unopened' ? 'var(--rose-light)' : '#fff',
            color: filterTab === 'unopened' ? 'var(--rose-primary)' : 'var(--text-muted)',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Chưa mở 🔒
        </button>

        <button
          onClick={() => setFilterTab('opened')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterTab === 'opened' ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
            background: filterTab === 'opened' ? 'var(--rose-light)' : '#fff',
            color: filterTab === 'opened' ? 'var(--rose-primary)' : 'var(--text-muted)',
            fontSize: '12.5px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Đã mở (Đọc lại) 📖
        </button>

        {draftCount > 0 && (
          <button
            onClick={() => setFilterTab('drafts')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterTab === 'drafts' ? '1px solid #d97706' : '1px solid #fde68a',
              background: filterTab === 'drafts' ? '#fef3c7' : '#fff',
              color: '#b45309',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Archive size={13} />
            <span>Kho Lưu Trữ / Bản Nháp ({draftCount})</span>
          </button>
        )}
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
            const moodStyle = getCategoryColor(letter.mood_tag);
            const isLockedTime = letter.time_lock_at && new Date(letter.time_lock_at) > new Date();
            const isOpened = Boolean(letter.is_opened);
            const isMine = letter.sender_id === currentUserId;
            const isDraft = letter.status === 'draft';

            return (
              <div
                key={letter.id}
                onClick={() => onSelectLetter(letter)}
                style={{
                  background: isDraft ? '#fffdf7' : (isOpened ? '#faf8f5' : '#fff'),
                  border: isDraft ? '1px dashed #f59e0b' : '1px solid var(--border-subtle)',
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
                  e.currentTarget.style.borderColor = isDraft ? '#f59e0b' : 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Wax Seal Icon */}
                <div 
                  className="wax-seal"
                  style={{
                    background: isDraft ? '#d97706' : (isOpened ? '#748c94' : (isLockedTime ? '#d4a373' : undefined))
                  }}
                >
                  {isDraft ? '📂' : (isOpened ? '📖' : (isLockedTime ? '⏳' : '❤️'))}
                </div>

                {/* Letter Content Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: moodStyle.bg,
                      color: moodStyle.color
                    }}>
                      {letter.mood_tag || 'Thư mới'}
                    </span>
                    {isDraft && (
                      <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                        📂 Bản nháp (Chưa gửi)
                      </span>
                    )}
                    {isLockedTime && !isDraft && (
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
                    {!isDraft && (
                      <>
                        <span>•</span>
                        <span>Phí mở: <strong>{letter.open_heart_cost} ❤️</strong></span>
                      </>
                    )}
                    {isOpened && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#2e7d32', fontWeight: '600' }}>Đọc lại mọi lúc</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions for letter sender */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isMine && isDraft && onSendDraft && (
                    <button
                      type="button"
                      title="Gửi lá thư này ngay"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendDraft(letter);
                      }}
                      style={{
                        background: 'var(--rose-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={13} /> Gửi ngay
                    </button>
                  )}

                  {isMine && !isOpened && onEditLetter && (
                    <button
                      type="button"
                      title="Chỉnh sửa lá thư"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLetter(letter);
                      }}
                      style={{
                        background: '#f4ece1',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        color: 'var(--text-ink)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit3 size={15} />
                    </button>
                  )}

                  {isMine && onDeleteLetter && (
                    <button
                      type="button"
                      title="Xóa lá thư"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLetter(letter);
                      }}
                      style={{
                        background: '#fff0f3',
                        border: '1px solid #ffd1dc',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        color: '#c94a5a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  {/* Status indicator icon if not sender action */}
                  {!isMine && (
                    <div style={{ color: isOpened ? '#2e7d32' : 'var(--text-light)', paddingRight: '4px' }}>
                      {isOpened ? <CheckCircle2 size={20} /> : (isLockedTime ? <Clock size={20} /> : <Lock size={20} />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
