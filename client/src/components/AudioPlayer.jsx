import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, SkipForward, SkipBack, Play, Pause, Plus, ListMusic } from 'lucide-react';

export const ROMANTIC_PLAYLIST = [
  {
    id: 'track-1',
    name: 'Hộp Nhạc Canon in D 🎵',
    artist: 'Music Box Romance',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'
  },
  {
    id: 'track-2',
    name: 'Piano Lãng Mạn Dưới Mưa 🎹',
    artist: 'Gentle Rain Piano',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3'
  },
  {
    id: 'track-3',
    name: 'Lofi Cafe Ngọt Ngào ☕',
    artist: 'Warm Coffee Beats',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c36bfb1c1c.mp3'
  },
  {
    id: 'track-4',
    name: 'Acoustic Guitar Thì Thầm 🎸',
    artist: 'Sweet Acoustic',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3'
  },
  {
    id: 'track-5',
    name: 'Gió Thu & Sóng Biển Êm 🌊',
    artist: 'Ocean Strings',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73e72dc0da.mp3'
  }
];

export function AudioPlayer() {
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('lovecapsule_custom_playlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...ROMANTIC_PLAYLIST, ...parsed];
      } catch (e) {}
    }
    return ROMANTIC_PLAYLIST;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');

  const audioRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;
    audio.volume = volume;

    if (currentTrack?.url) {
      const wasPlaying = isPlaying;
      audio.src = currentTrack.url;
      if (wasPlaying) {
        audio.play().catch(e => console.warn('Audio play restricted:', e.message));
      }
    }

    return () => {
      audio.pause();
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Autoplay block:', err.message);
      });
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleAddCustomSong = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const newSong = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Bài hát của hai bạn 💖',
      artist: 'Tự thêm online',
      url: customUrl.trim()
    };

    const updated = [...playlist, newSong];
    setPlaylist(updated);
    localStorage.setItem('lovecapsule_custom_playlist', JSON.stringify(updated.slice(ROMANTIC_PLAYLIST.length)));
    setCurrentTrackIndex(updated.length - 1);
    setCustomUrl('');
    setCustomName('');
    alert('Đã thêm bài hát online vào danh sách phát! 🎶');
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#fff',
        padding: '5px 12px',
        borderRadius: '24px',
        border: '1px solid var(--rose-border)',
        boxShadow: '0 2px 6px rgba(224, 109, 126, 0.1)'
      }}>
        {/* Spinning Vinyl Record Icon */}
        <div
          title={isPlaying ? `Đang phát: ${currentTrack?.name}` : 'Bấm để phát nhạc online'}
          onClick={togglePlay}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #333 30%, #111 70%, #d4a373 100%)',
            border: '2px solid #fff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: isPlaying ? 'spinVinyl 4s linear infinite' : 'none'
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
        </div>

        {/* Current Song Title (Truncated) */}
        <span
          onClick={() => setShowPlaylistModal(true)}
          title="Nhấp để xem danh sách bài hát hoặc thêm link nhạc"
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text-ink)',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer'
          }}
        >
          {currentTrack?.name}
        </span>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--rose-primary)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {/* Next Track Button */}
        <button
          type="button"
          onClick={nextTrack}
          title="Bài tiếp theo"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <SkipForward size={13} />
        </button>

        {/* Playlist & Add Song Modal Opener */}
        <button
          type="button"
          onClick={() => setShowPlaylistModal(true)}
          title="Xem danh sách phát & Thêm link bài hát"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--rose-primary)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ListMusic size={14} />
        </button>
      </div>

      {/* Playlist & Custom URL Modal */}
      {showPlaylistModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(43, 38, 33, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--paper-cream)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            boxShadow: 'var(--shadow-warm)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPlaylistModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={18} color="var(--rose-primary)" />
              <span>Giai Điệu Tình Yêu (Online)</span>
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '16px' }}>
              Nhạc nền phát trực tiếp khi có mạng, không cần tải về máy
            </p>

            {/* Song List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {playlist.map((track, idx) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    if (!isPlaying) togglePlay();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    border: currentTrackIndex === idx ? '1px solid var(--rose-primary)' : '1px solid var(--border-subtle)',
                    background: currentTrackIndex === idx ? 'var(--rose-light)' : '#fff',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: currentTrackIndex === idx ? 'var(--rose-primary)' : '#999', fontWeight: '700' }}>
                      {idx + 1}.
                    </span>
                    <div>
                      <div style={{ fontWeight: currentTrackIndex === idx ? '800' : '600', color: currentTrackIndex === idx ? 'var(--rose-primary)' : 'var(--text-ink)' }}>
                        {track.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{track.artist}</div>
                    </div>
                  </div>
                  {currentTrackIndex === idx && (
                    <span style={{ fontSize: '11px', color: 'var(--rose-primary)', fontWeight: '700' }}>
                      {isPlaying ? '▶ Đang phát' : '❚❚ Đã tạm dừng'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Online Song URL */}
            <form onSubmit={handleAddCustomSong} style={{ background: '#faf6ee', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} color="var(--rose-primary)" />
                <span>Thêm Link Nhạc Online Của Hai Bạn:</span>
              </div>
              <input
                type="text"
                placeholder="Tên bài hát kỷ niệm..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12.5px', marginBottom: '6px' }}
              />
              <input
                type="url"
                required
                placeholder="Dán link âm thanh online (.mp3, stream)..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12.5px', marginBottom: '8px' }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'var(--rose-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Thêm Vào Danh Sách Phát
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS for rotating vinyl */}
      <style>{`
        @keyframes spinVinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
