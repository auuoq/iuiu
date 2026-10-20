import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Droplet, Sparkles, Heart } from 'lucide-react';

export function LovePlantWidget({ couple, onPlantWatered }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const stage = couple ? couple.plant_stage || 1 : 1;
  const exp = couple ? couple.plant_exp || 0 : 0;
  const currentStageExp = exp % 50;
  const progressPercent = Math.min(100, Math.floor((currentStageExp / 50) * 100));

  const getPlantVisual = () => {
    if (stage >= 8) return { icon: '🌳', text: 'Cây Tình Yêu Trĩu Quả', color: '#2e7d32' };
    if (stage >= 5) return { icon: '🌸', text: 'Cây Tình Yêu Nở Hoa Rực Rỡ', color: '#c2185b' };
    if (stage >= 3) return { icon: '🌿', text: 'Chậu Cây Tươi Tốt', color: '#388e3c' };
    return { icon: '🌱', text: 'Mầm Non Tình Yêu', color: '#4caf50' };
  };

  const plantInfo = getPlantVisual();

  const handleWater = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await api.waterPlant();
      setMsg('Đã tưới nước thành công! +5 ❤️');
      onPlantWatered(res);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: 'var(--shadow-warm)',
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Cây Tình Yêu Chung</span>
          <span>🌱</span>
        </h3>
        <span style={{ fontSize: '12px', fontWeight: '700', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '10px' }}>
          Cấp {stage}/10
        </span>
      </div>

      {/* Plant Pot Visual */}
      <div style={{
        background: 'linear-gradient(180deg, #fefbf6 0%, #f4ede4 100%)',
        border: '1px solid #ebdcd0',
        borderRadius: '16px',
        padding: '24px 16px',
        margin: '12px 0 16px 0',
        position: 'relative'
      }}>
        <div style={{ fontSize: '54px', marginBottom: '6px', userSelect: 'none', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
          {plantInfo.icon}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: plantInfo.color }}>
          {plantInfo.text}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Tổng điểm chăm sóc: {exp} EXP
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '80%',
          height: '7px',
          background: '#e0d5c8',
          borderRadius: '10px',
          margin: '12px auto 0 auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #81c784 0%, #4caf50 100%)',
            borderRadius: '10px',
            transition: 'width 0.4s ease'
          }}></div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {currentStageExp}/50 EXP lên cấp tiếp theo
        </div>
      </div>

      {/* Water Action */}
      <button
        onClick={handleWater}
        disabled={loading}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          padding: '11px',
          fontSize: '13.5px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.25)',
          transition: 'transform 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Droplet size={16} />
        <span>{loading ? 'Đang tưới nước...' : 'Tưới Nước Cây Tình Yêu (+5 ❤️)'}</span>
      </button>

      {msg && (
        <div style={{ fontSize: '12.5px', marginTop: '10px', color: msg.includes('thành công') ? '#2e7d32' : '#c62828', fontWeight: '600' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
