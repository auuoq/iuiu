import React, { useState } from 'react';
import { api, setToken } from '../api/client.js';
import { Heart, User, Lock, Sparkles, Upload } from 'lucide-react';

export function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('female');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setAvatarUrl(res.url);
    } catch (err) {
      setError('Tải ảnh đại diện thất bại: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ username, password });
        setToken(res.token);
        onAuthSuccess(res.user);
      } else {
        const res = await api.register({
          username,
          password,
          display_name: displayName || username,
          gender,
          avatar_url: avatarUrl || null
        });
        setToken(res.token);
        onAuthSuccess(res.user);
      }
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
        maxWidth: '440px',
        width: '100%',
        padding: '32px',
        boxShadow: 'var(--shadow-warm)',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            background: 'var(--rose-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Heart size={26} color="var(--rose-primary)" fill="var(--rose-primary)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>
            {isLogin ? 'Chào mừng bạn quay lại' : 'Tạo Không Gian Tình Yêu'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
            {isLogin ? 'Đăng nhập để vào hòm thư kỷ niệm' : 'Nơi riêng tư chỉ dành riêng cho hai người'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Ảnh đại diện thật của bạn:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: avatarUrl ? `url(${avatarUrl}) center/cover` : '#eee',
                    border: '2px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '12px'
                  }}>
                    {!avatarUrl && <User size={20} />}
                  </div>
                  <label style={{
                    cursor: 'pointer',
                    background: '#fff',
                    border: '1px solid var(--border-subtle)',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Upload size={14} /> Chọn ảnh thật
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Biệt danh thân mật của bạn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bé Mèo, Anh Gấu, Lan..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
                  Giới tính (để tự động nhắc ngày 8/3, 20/10 hoặc 19/11):
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: '#fff',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="female">Nữ</option>
                  <option value="male">Nam</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              Tên đăng nhập:
            </label>
            <input
              type="text"
              required
              placeholder="Tên đăng nhập của bạn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>
              Mật khẩu:
            </label>
            <input
              type="password"
              required
              placeholder="Mật khẩu bí mật"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--rose-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản & Bắt Đầu 💌')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--rose-primary)',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
