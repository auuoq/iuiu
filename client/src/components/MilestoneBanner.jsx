import React, { useState } from 'react';
import { Sparkles, Gift, Heart, Calendar } from 'lucide-react';
import { CandleBlowModal } from './CandleBlowModal.jsx';

export function MilestoneBanner({ milestones = [], partner, onOpenWriter }) {
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
        {milestones.map((m) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', background: 'var(--rose-primary)', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>
                  DỊP ĐẶC BIỆT HÔM NAY
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-ink)' }}>
                  {m.title}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {m.mustWrite 
                  ? `Đã đến lúc viết một lá thư ngọt ngào gửi gắm đến ${partner ? partner.display_name : 'người ấy'}!`
                  : `Hôm nay là ngày đặc biệt của bạn, hãy chờ xem người ấy chuẩn bị điều gì nhé!`}
              </p>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px' }}>
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
                gap: '6px'
              }}
            >
              🎂 Thổi Nến Bánh Kem
            </button>
          )}

          <button
            onClick={onOpenWriter}
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
            <span>Viết Thư Dịp Này ✍️</span>
          </button>
        </div>
      </div>

      {activeModalMilestone && (
        <CandleBlowModal
          milestone={activeModalMilestone}
          onClose={() => setActiveModalMilestone(null)}
          onOpenLetterWriter={onOpenWriter}
        />
      )}
    </>
  );
}
