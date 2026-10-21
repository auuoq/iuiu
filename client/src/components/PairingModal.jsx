import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Heart, Sparkles, Copy, Check, Users } from 'lucide-react';

export function PairingModal({ user, onPairSuccess }) {
  const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'
  const [anniversaryDate, setAnniversaryDate] = useState('2025-10-25');
  const [createdCode, setCreatedCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateCouple = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.createCouple(anniversaryDate);
      setCreatedCode(res.couple_code);
      setMode('created');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.joinCouple(joinCode.trim().toUpperCase());
      onPairSuccess(res.couple);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(43, 38, 33, 0.45)',
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
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'var(--rose-light)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <Users size={28} color="var(--rose-primary)" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>
          Kết Đôi Không Gian Riêng 1-1
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.5' }}>
          Chào {user.display_name}! Để bắt đầu viết thư và tích tim cùng nhau, hãy kết nối tài khoản của bạn với một người duy nhất.
        </p>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setMode('create')}
              style={{
                background: '#fff',
                border: '2px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--rose-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ fontSize: '26px' }}>✨</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Tạo mã kết đôi</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Lấy mã để gửi cho đối phương
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              style={{
                background: '#fff',
                border: '2px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--rose-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ fontSize: '26px' }}>💌</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Đã có mã kết đôi</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Nhập mã để kết nối ngay
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textAlign: 'left', marginBottom: '6px' }}>
              Ngày kỷ niệm:
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '14px',
                marginBottom: '18px'
              }}
            />
            <button
              onClick={handleCreateCouple}
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Đang tạo...' : 'Tạo mã kết đôi'}
            </button>
            <button
              onClick={() => setMode('choose')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '14px', cursor: 'pointer', fontSize: '13px' }}
            >
              Quay lại
            </button>
          </div>
        )}

        {mode === 'created' && (
          <div>
            <div style={{
              background: '#fff',
              border: '2px dashed var(--rose-primary)',
              borderRadius: '16px',
              padding: '20px',
              margin: '16px 0'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                MÃ KẾT ĐÔI
              </span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--rose-primary)', margin: '10px 0', letterSpacing: '2px' }}>
                {createdCode}
              </div>
              <button
                onClick={copyToClipboard}
                style={{
                  background: copied ? '#4caf50' : 'var(--rose-light)',
                  color: copied ? '#fff' : 'var(--rose-primary)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Đã sao chép!' : 'Sao chép mã'}
              </button>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Gửi mã này cho đối phương để cùng kết nối vào không gian chung.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Kiểm tra kết nối 🔄
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinCouple}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', textAlign: 'left', marginBottom: '6px' }}>
              Nhập mã kết đôi:
            </label>
            <input
              type="text"
              required
              placeholder="LOVE-XXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center',
                letterSpacing: '1px',
                marginBottom: '18px'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Đang kết nối...' : 'Xác Nhận Kết Đôi'}
            </button>
            <button
              type="button"
              onClick={() => setMode('choose')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '14px', cursor: 'pointer', fontSize: '13px' }}
            >
              Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
