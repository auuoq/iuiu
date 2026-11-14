import React, { useState } from 'react';
import { Sparkles, Gift, Heart, Calendar } from 'lucide-react';
import { CandleBlowModal } from './CandleBlowModal.jsx';

export function MilestoneBanner({ milestones = [], partner, onOpenWriter, onOpenLetter }) {
  const [activeModalMilestone, setActiveModalMilestone] = useState(null);

  if (!milestones || milestones.length === 0) return null;

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #fff2f4 0%, #fef8ee 100%)',
        border: '1.5px solid #ffccd5',
        borderRadius: '18px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 15px rgba(224, 109, 126, 0.1)'
      }}>
        {milestones.map((m) => {
          let badgeText = 'DỊP ĐẶC BIỆT HÔM NAY';
          let badgeBg = 'var(--rose-primary)';
          let descText = m.mustWrite 
            ? `Hôm nay là ${m.title}! Hãy bí mật viết một lá thư ngọt ngào gửi gắm đến ${partner ? partner.display_name : 'người ấy'} nhé!`
            : `Hôm nay là ngày đặc biệt của bạn, hãy chờ xem người ấy chuẩn bị điều gì nhé!`;

          if (m.isReceiver && m.hasLetter) {
            badgeText = '🎉 BẤT NGỜ DÀNH CHO BẠN!';
            badgeBg = '#e06d7e';
            descText = `${partner ? partner.display_name : 'Người ấy'} đã bí mật chuẩn bị chiếc bánh kem và lá thư yêu thương dành riêng cho bạn! Mau thổi nến và mở quà nào!`;
          } else if (m.isWriter && !m.hasLetter) {
            badgeText = 'NHẮC NHỞ BÍ MẬT 🤫';
            badgeBg = '#d97706';
            descText = `Hôm nay là ${m.title}! Hãy bí mật viết một lá thư ngọt ngào gửi gắm đến ${partner ? partner.display_name : 'người ấy'} nhé!`;
          } else if (m.isWriter && m.hasLetter) {
            badgeText = 'ĐÃ GỬI BẤT NGỜ 💌';
            badgeBg = '#16a34a';
            descText = `Bạn đã gửi lá thư chúc mừng cho ${partner ? partner.display_name : 'người ấy'} rồi! Hãy cùng người ấy đón ngày đặc biệt nhé ✨`;
          }

          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {m.interactive_fx === 'candle_blow' ? '🎂' : (m.interactive_fx === 'flower_bloom' ? '💐' : '✨')}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: badgeBg, color: '#fff', padding: '1px 8px', borderRadius: '10px' }}>
                    {badgeText}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-ink)' }}>
                    {m.title}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {descText}
                </p>
              </div>
            </div>
          );
        })}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* For Celebrant who has received the letter: SHOW BLOW CANDLE & OPEN LETTER */}
          {milestones[0].isReceiver && milestones[0].hasLetter && (
            <>
              {milestones[0].interactive_fx === 'candle_blow' && (
                <button
                  onClick={() => setActiveModalMilestone(milestones[0])}
                  style={{
                    background: '#ffd166',
                    color: '#8a6230',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 10px rgba(255, 209, 102, 0.4)'
                  }}
                >
                  🎂 Thổi Nến Bánh Kem
                </button>
              )}

              {milestones[0].letterId && onOpenLetter && (
                <button
                  onClick={() => onOpenLetter(milestones[0].letterId)}
                  style={{
                    background: 'var(--rose-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 10px rgba(224, 109, 126, 0.25)'
                  }}
                >
                  <span>Mở Thư Bí Mật 💌</span>
                </button>
              )}
            </>
          )}

          {/* For Writer who has NOT sent the letter yet: SHOW WRITE LETTER BUTTON */}
          {milestones[0].mustWrite && (
            <button
              onClick={() => onOpenWriter && onOpenWriter(milestones[0])}
              style={{
                background: 'var(--rose-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(224, 109, 126, 0.25)'
              }}
            >
              <span>Viết Thư Dịp Này ✍️</span>
            </button>
          )}

          {/* For Writer who HAS sent the letter: CAN BLOW CANDLE TOGETHER */}
          {milestones[0].isWriter && milestones[0].hasLetter && milestones[0].interactive_fx === 'candle_blow' && (
            <button
              onClick={() => setActiveModalMilestone(milestones[0])}
              style={{
                background: '#ffd166',
                color: '#8a6230',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🎂 Thổi Nến Cùng Nhau
            </button>
          )}
        </div>
      </div>

      {activeModalMilestone && (
        <CandleBlowModal
          milestone={activeModalMilestone}
          onClose={() => setActiveModalMilestone(null)}
          onOpenLetterWriter={() => onOpenWriter && onOpenWriter(activeModalMilestone)}
          onOpenLetter={onOpenLetter}
        />
      )}
    </>
  );
}
