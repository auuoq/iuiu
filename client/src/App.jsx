import React, { useState, useEffect, useRef } from 'react';
import { api, getToken, setToken } from './api/client.js';
import { CoupleTopBar } from './components/CoupleTopBar.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { PairingModal } from './components/PairingModal.jsx';
import { LetterList } from './components/LetterList.jsx';
import { LetterWriterModal } from './components/LetterWriterModal.jsx';
import { LetterUnlockModal } from './components/LetterUnlockModal.jsx';
import { LetterReaderModal } from './components/LetterReaderModal.jsx';
import { ScrapbookBoard } from './components/ScrapbookBoard.jsx';
import { LovePlantWidget } from './components/LovePlantWidget.jsx';
import { MilestoneBanner } from './components/MilestoneBanner.jsx';
import { Heart, Gift, Sparkles, Send } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [couple, setCouple] = useState(null);
  const [walletBalance, setWalletBalance] = useState(20);
  const [letters, setLetters] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [daysTogether, setDaysTogether] = useState(0);

  // Modals
  const [showWriter, setShowWriter] = useState(false);
  const [unlockingLetter, setUnlockingLetter] = useState(null);
  const [readingLetter, setReadingLetter] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState(10);
  const [giftMessage, setGiftMessage] = useState('Thưởng cho em/anh nè!');

  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // Floating heart pulse animation
  const [pulseHearts, setPulseHearts] = useState([]);

  const spawnHearts = (count = 5) => {
    const newHearts = [];
    for (let i = 0; i < count; i++) {
      newHearts.push({
        id: Math.random(),
        left: Math.random() * 80 + 10,
        bottom: 20
      });
    }
    setPulseHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setPulseHearts(prev => prev.slice(count));
    }, 1300);
  };

  const loadInitialData = async () => {
    try {
      const meData = await api.getMe();
      setCurrentUser(meData.user);
      setPartner(meData.partner);
      setCouple(meData.couple);

      if (meData.couple) {
        // Fetch wallet, letters, milestones
        const [wRes, lRes, mRes] = await Promise.all([
          api.getWallet(),
          api.getLetters(),
          api.getMilestones()
        ]);
        setWalletBalance(wRes.balance || 0);
        setLetters(lRes || []);
        setMilestones(mRes.todayMilestones || []);
        setDaysTogether(mRes.daysTogether || 0);
      }
    } catch (err) {
      console.warn('Initial load failed:', err.message);
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!couple || !couple.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:4000`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', couple_id: couple.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'couple_paired') {
            loadInitialData();
            spawnHearts(20);
          } else if (data.type === 'poke') {
            spawnHearts(12);
          } else if (data.type === 'new_letter') {
            api.getLetters().then(setLetters);
          } else if (data.type === 'plant_watered') {
            api.getCoupleInfo().then(info => setCouple(info.couple));
          } else if (data.type === 'heart_gift_received') {
            api.getWallet().then(w => setWalletBalance(w.balance));
            spawnHearts(15);
            alert(`💌 Bạn vừa nhận được ${data.amount} ❤️ từ ${data.sender_name}: "${data.message}"`);
          }
        } catch (e) {}
      };

      return () => ws.close();
    } catch (e) {}
  }, [couple]);

  const handlePoke = () => {
    spawnHearts(8);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'poke',
        couple_id: couple.id,
        sender_name: currentUser.display_name
      }));
    }
  };

  const handleLetterSelect = (letter) => {
    if (letter.is_opened || letter.sender_id === currentUser.id) {
      setReadingLetter(letter);
    } else {
      setUnlockingLetter(letter);
    }
  };

  const handleUnlockSuccess = async (letterId) => {
    setUnlockingLetter(null);
    const updatedLetters = await api.getLetters();
    setLetters(updatedLetters);
    const wallet = await api.getWallet();
    setWalletBalance(wallet.balance);

    const opened = updatedLetters.find(l => l.id === letterId);
    if (opened) {
      setReadingLetter(opened);
    }
  };

  const handleSendGift = async (e) => {
    e.preventDefault();
    try {
      await api.giftHearts(partner.id, giftAmount, giftMessage);
      setShowGiftModal(false);
      const w = await api.getWallet();
      setWalletBalance(w.balance);
      spawnHearts(6);
      alert('Đã tặng Trái Tim thành công đến người yêu! 💖');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-primary)', fontWeight: '700' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>💌</div>
          <div>Đang mở không gian của hai bạn...</div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <AuthModal onAuthSuccess={loadInitialData} />;
  }

  // Logged in but not paired yet
  if (!couple || !partner) {
    return <PairingModal user={currentUser} couple={couple} onPairSuccess={loadInitialData} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <CoupleTopBar
        user={currentUser}
        partner={partner}
        couple={couple}
        walletBalance={walletBalance}
        daysTogether={daysTogether}
        onPoke={handlePoke}
        onLogout={() => { setToken(null); setCurrentUser(null); setCouple(null); }}
      />

      {/* Floating Hearts Animation */}
      {pulseHearts.map(h => (
        <div
          key={h.id}
          className="floating-heart"
          style={{ left: `${h.left}%`, bottom: `${h.bottom}px`, fontSize: '28px' }}
        >
          💖
        </div>
      ))}

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
        {/* Milestone Banner (Active if today is anniversary or special holiday) */}
        <MilestoneBanner
          milestones={milestones}
          partner={partner}
          onOpenWriter={() => setShowWriter(true)}
        />

        {/* 2 Columns Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Column 1: Letters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <LetterList
              letters={letters}
              currentUserId={currentUser.id}
              onSelectLetter={handleLetterSelect}
              onOpenWriter={() => setShowWriter(true)}
            />
          </div>

          {/* Column 2: Photo Scrapbook Board & Love Plant */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Scrapbook Board */}
            <ScrapbookBoard coupleId={couple.id} />

            {/* Virtual Love Plant Widget & Gift Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <LovePlantWidget
                couple={couple}
                onPlantWatered={(res) => {
                  setWalletBalance(res.balance);
                  setCouple(prev => ({ ...prev, plant_stage: res.plant_stage, plant_exp: res.plant_exp }));
                }}
              />

              {/* Heart Gift Quick Box */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: 'var(--shadow-warm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ width: '44px', height: '44px', background: 'var(--rose-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Gift size={22} color="var(--rose-primary)" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '800' }}>Tặng Tim Cho {partner.display_name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 14px 0' }}>
                  Tặng tim để người ấy có thêm ngân sách bóc thư và mở quà
                </p>
                <button
                  onClick={() => setShowGiftModal(true)}
                  style={{
                    background: 'var(--rose-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Gửi Quà Tặng ❤️
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-muted)',
        fontSize: '12.5px',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '30px'
      }}>
        <span>LoveCapsule — Không gian ấm cúng dành riêng cho hai bạn 💌</span>
      </footer>

      {/* Modals */}
      {showWriter && (
        <LetterWriterModal
          partner={partner}
          onClose={() => setShowWriter(false)}
          onLetterCreated={(newLetter) => {
            setShowWriter(false);
            api.getLetters().then(setLetters);
          }}
        />
      )}

      {unlockingLetter && (
        <LetterUnlockModal
          letter={unlockingLetter}
          userBalance={walletBalance}
          onClose={() => setUnlockingLetter(null)}
          onUnlockSuccess={handleUnlockSuccess}
        />
      )}

      {readingLetter && (
        <LetterReaderModal
          letter={readingLetter}
          onClose={() => setReadingLetter(null)}
        />
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(43, 38, 33, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '400px', width: '100%', padding: '26px', textAlign: 'center', position: 'relative' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              Tặng Tim Cho {partner.display_name} 💖
            </h3>
            <form onSubmit={handleSendGift} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Số Trái Tim muốn tặng (Số dư: {walletBalance} ❤️):
                </label>
                <input
                  type="number"
                  min="1"
                  max={walletBalance}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Lời nhắn gửi kèm:
                </label>
                <input
                  type="text"
                  placeholder="Nhập lời nhắn gửi kèm..."
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#f0ece4', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'var(--rose-primary)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  Xác Nhận Tặng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
