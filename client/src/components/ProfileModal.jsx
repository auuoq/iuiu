import React, { useState } from 'react';
import { api } from '../api/client.js';
import { X, User, Upload, Calendar, Lock, Heart, Check, Sparkles } from 'lucide-react';

export function ProfileModal({ user, couple, onClose, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [gender, setGender] = useState(user.gender || 'other');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState(couple?.anniversary_date || '2025-10-25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    if (!displayName.trim()) {
      setError('Tên gọi không được để trống');
      return;
    }

    if (newPassword && newPassword.trim().length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        display_name: displayName.trim(),
        gender,
        avatar_url: avatarUrl || null,
        anniversary_date: anniversaryDate || null
      };

      if (newPassword.trim()) {
        payload.new_password = newPassword.trim();
      }

      const res = await api.updateProfile(payload);
      setSuccess(true);
      setTimeout(() => {
        onProfileUpdated(res);
        onClose();
      }, 700);
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
      zIndex: 1100,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--paper-cream)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        maxWidth: '460px',
        width: '100%',
        padding: '30px',
        boxShadow: 'var(--shadow-warm)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          type="button"
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'var(--rose-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto'
          }}>
            <User size={24} color="var(--rose-primary)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
            Hồ Sơ Của Bạn
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
            Cập nhật tên gọi, ảnh đại diện và thông tin tình yêu
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

        {success && (
          <div style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Check size={16} /> Đã cập nhật hồ sơ thành công!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Avatar Upload */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Ảnh đại diện:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--bg-kraft)',
                border: '2px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '18px',
                color: 'var(--text-ink)',
                overflow: 'hidden'
              }}>
                {!avatarUrl && displayName.charAt(0)}
              </div>
              <label style={{
                cursor: 'pointer',
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Upload size={14} /> Chọn ảnh mới
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c94a5a',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>

          {/* Tên gọi */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Tên gọi của bạn:
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên gọi của bạn"
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

          {/* Giới tính */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Giới tính:
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
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Ngày kỷ niệm */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Ngày bắt đầu yêu nhau (Ngày kỷ niệm):
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#fff',
                fontSize: '13.5px'
              }}
            />
          </div>

          {/* Đổi mật khẩu mới */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Mật khẩu mới:
            </label>
            <input
              type="password"
              placeholder="Để trống nếu không muốn đổi mật khẩu"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          {/* Submit & Cancel Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '14px',
                background: '#f4ece1',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1.5,
                padding: '12px',
                borderRadius: '14px',
                background: 'var(--rose-primary)',
                border: 'none',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(224, 109, 126, 0.3)'
              }}
            >
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi 💖'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
