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
import { VintageMusicBox } from './components/VintageMusicBox.jsx';
import { MilestoneBanner } from './components/MilestoneBanner.jsx';
import { ProfileModal } from './components/ProfileModal.jsx';
import { HeartMinerModal } from './components/HeartMinerModal.jsx';
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
  const [letterToEdit, setLetterToEdit] = useState(null);
  const [activeMilestoneForLetter, setActiveMilestoneForLetter] = useState(null);
  const [unlockingLetter, setUnlockingLetter] = useState(null);
  const [readingLetter, setReadingLetter] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHeartMiner, setShowHeartMiner] = useState(false);
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
    const wsHost = window.location.port === '5173' ? `${window.location.hostname}:4000` : window.location.host;
    const wsUrl = `${protocol}//${wsHost}`;
    
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
          } else if (data.type === 'profile_updated') {
            loadInitialData();
          } else if (data.type === 'new_letter') {
            api.getLetters().then(setLetters);
          } else if (data.type === 'scrapbook_updated') {
            window.dispatchEvent(new CustomEvent('lovecapsule_scrapbook_sync', { detail: data }));
          } else if (data.type === 'letter_deleted') {
            setLetters(prev => prev.filter(l => l.id !== data.letter_id));
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

  const handleOpenWriter = () => {
    setLetterToEdit(null);
    setShowWriter(true);
  };

  const handleEditLetter = (letter) => {
    setLetterToEdit(letter);
    setShowWriter(true);
  };

  const handleDeleteLetter = async (letter) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lá thư "${letter.title}" không?`)) return;
    try {
      await api.deleteLetter(letter.id);
      setLetters(prev => prev.filter(l => l.id !== letter.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendDraft = async (letter) => {
    try {
      const res = await api.updateLetter(letter.id, { status: 'sent' });
      setLetters(prev => prev.map(l => l.id === letter.id ? res.letter : l));
      spawnHearts(15);
      alert('Đã gửi thư thành công đến người ấy! 💌');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLetterSaved = (savedLetter) => {
    setShowWriter(false);
    setLetterToEdit(null);
    setActiveMilestoneForLetter(null);
    setLetters(prev => {
      const idx = prev.findIndex(l => l.id === savedLetter.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedLetter;
        return copy;
      }
      return [savedLetter, ...prev];
    });
    spawnHearts(8);
    // Refresh milestones so banner updates to sent or completed state immediately
    api.getMilestones().then(mRes => {
      setMilestones(mRes.todayMilestones || []);
    }).catch(e => console.warn(e));
  };

  const handleLetterSelect = (letter) => {
    if (letter.status === 'draft' && letter.sender_id === currentUser.id) {
      handleEditLetter(letter);
      return;
    }
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
        onOpenGift={() => setShowGiftModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenMiner={() => setShowHeartMiner(true)}
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
      <main className="app-main-content" style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
        {/* Milestone Banner (Active if today is anniversary or special holiday) */}
        <MilestoneBanner
          milestones={milestones}
          partner={partner}
          onOpenWriter={(m) => {
            setActiveMilestoneForLetter(m || null);
            setShowWriter(true);
          }}
          onOpenLetter={(letterId) => {
            const targetLetter = letters.find(l => l.id === letterId);
            if (targetLetter) {
              handleLetterSelect(targetLetter);
            }
          }}
        />

        {/* TẦNG 1: Góc Kỷ Niệm Của Hai Bạn (Ảnh Polaroid, Lời Nhắn Yêu) */}
        <div style={{ width: '100%', marginBottom: '28px' }}>
          <ScrapbookBoard coupleId={couple.id} currentUserId={currentUser.id} wsRef={wsRef} />
        </div>

        {/* TẦNG 2: Hòm Thư Tình Yêu (Rộng Toàn Bộ 1100px, Gọn Gàng & Dễ Nhìn) */}
        <div style={{ width: '100%', marginBottom: '28px' }}>
          <LetterList
            letters={letters}
            currentUserId={currentUser.id}
            onSelectLetter={handleLetterSelect}
            onOpenWriter={handleOpenWriter}
            onEditLetter={handleEditLetter}
            onDeleteLetter={handleDeleteLetter}
            onSendDraft={handleSendDraft}
          />
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
          letterToEdit={letterToEdit}
          initialMilestone={activeMilestoneForLetter}
          existingCategories={Array.from(new Set(letters.map(l => l.mood_tag).filter(Boolean)))}
          onClose={() => {
            setShowWriter(false);
            setLetterToEdit(null);
            setActiveMilestoneForLetter(null);
          }}
          onLetterSaved={handleLetterSaved}
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

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          couple={couple}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(res) => {
            setCurrentUser(res.user);
            if (res.couple) setCouple(res.couple);
            loadInitialData();
          }}
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

      {/* Heart Miner Arcade Modal */}
      <HeartMinerModal
        isOpen={showHeartMiner}
        onClose={() => setShowHeartMiner(false)}
        currentUserId={currentUser?.id}
        walletBalance={walletBalance}
        onWalletUpdated={(newBal) => setWalletBalance(newBal)}
      />

      {/* Vintage Antique Music Box (Docked at bottom, persistent background music including minigame) */}
      <VintageMusicBox />
    </div>
  );
}
