import React from 'react';
import { Heart, Sparkles, LogOut, Send } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer.jsx';

export function CoupleTopBar({ user, partner, couple, walletBalance, daysTogether, onPoke, onLogout }) {
  const user1 = user;
  const user2 = partner || { display_name: 'Đang đợi người yêu...', avatar_url: null };

  return (
    <header style={{
      background: 'rgba(255, 253, 249, 0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Left: Couple Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {/* User Avatar */}
            <div 
              title={user1.display_name}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                background: user1.avatar_url ? `url(${user1.avatar_url}) center/cover` : 'var(--bg-kraft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                color: 'var(--text-ink)',
                zIndex: 2
              }}
            >
              {!user1.avatar_url && user1.display_name.charAt(0)}
            </div>

            {/* Partner Avatar */}
            <div 
              title={user2.display_name}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                marginLeft: '-14px',
                background: user2.avatar_url ? `url(${user2.avatar_url}) center/cover` : '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                color: '#666',
                zIndex: 1
              }}
            >
              {!user2.avatar_url && (partner ? partner.display_name.charAt(0) : '?')}
            </div>

            <div style={{
              position: 'absolute',
              bottom: '-2px',
              left: '26px',
              background: 'var(--rose-primary)',
              color: '#fff',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              border: '2px solid #fff',
              zIndex: 3
            }}>
              ❤️
            </div>
          </div>

          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{user.display_name}</span>
              <span style={{ color: 'var(--rose-primary)' }}>&amp;</span>
              <span>{partner ? partner.display_name : 'Người yêu'}</span>
              <span>🌿</span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--rose-primary)', fontWeight: '600' }}>
              {daysTogether > 0 ? `Đã bên nhau ${daysTogether} ngày yêu` : 'Ngày đầu tiên bên nhau ✨'}
            </div>
          </div>
        </div>

        {/* Right: Actions, Wallet & Audio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AudioPlayer />

          {/* Heart Wallet Badge */}
          <div style={{
            background: '#fff',
            border: '1px solid var(--rose-border)',
            padding: '5px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13.5px',
            fontWeight: '700',
            color: 'var(--rose-primary)',
            boxShadow: '0 2px 6px rgba(224, 109, 126, 0.1)'
          }}>
            <Heart size={15} fill="var(--rose-primary)" color="var(--rose-primary)" />
            <span>{walletBalance} Tim</span>
          </div>

          {/* Poke / Send Spark Button */}
          {partner && (
            <button
              onClick={onPoke}
              title="Bắn tim rung chuông sang máy người yêu"
              style={{
                background: 'var(--rose-light)',
                border: '1px solid var(--rose-border)',
                color: 'var(--rose-primary)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Sparkles size={14} />
              <span>Bắn Tim</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Đăng xuất"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-light)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '8px'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
