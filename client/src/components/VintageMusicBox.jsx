import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ListMusic,
  Plus,
  Trash2,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);

  return match ? match[1] : null;
}

export const ROMANTIC_PLAYLIST = [
  {
    id: 'track-yt-1',
    name: 'Until I Found You 💖',
    artist: 'Sweet Acoustic Romance',
    url: 'https://www.youtube.com/watch?v=hXzPxBhhmY8'
  },
  {
    id: 'track-box-1',
    name: 'Hộp Nhạc Canon in D 🎵',
    artist: 'Music Box Romance',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'
  },
  {
    id: 'track-yt-2',
    name: 'City of Stars ✨',
    artist: 'La La Land OST',
    url: 'https://www.youtube.com/watch?v=GTWqwSNQCcg'
  },
  {
    id: 'track-box-2',
    name: 'Piano Lãng Mạn Dưới Mưa 🎹',
    artist: 'Gentle Rain Piano',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3'
  },
  {
    id: 'track-yt-3',
    name: 'Ed Sheeran - Perfect 💖',
    artist: 'Acoustic Guitar',
    url: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g'
  },
  {
    id: 'track-box-3',
    name: 'Lofi Cafe Ngọt Ngào ☕',
    artist: 'Warm Coffee Beats',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c36bfb1c1c.mp3'
  }
];

const STORAGE_PLAYLIST_KEY = 'lovecapsule_active_playlist';

export function getSavedPlaylist() {
  if (typeof window === 'undefined') return ROMANTIC_PLAYLIST;
  const activeSaved = localStorage.getItem(STORAGE_PLAYLIST_KEY);
  if (activeSaved) {
    try {
      const parsed = JSON.parse(activeSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-migrate any broken VEVO links to working ones
        return parsed.map(s => s.url?.includes('GxldQ9GyXfY') ? { ...s, url: 'https://www.youtube.com/watch?v=hXzPxBhhmY8' } : s);
      }
    } catch (e) {}
  }
  const customSaved = localStorage.getItem('lovecapsule_custom_playlist');
  if (customSaved) {
    try {
      const parsedCustom = JSON.parse(customSaved);
      if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
        return [...ROMANTIC_PLAYLIST, ...parsedCustom];
      }
    } catch (e) {}
  }
  return ROMANTIC_PLAYLIST;
}

export function saveSongToPlaylist(song) {
  const current = getSavedPlaylist();
  const exists = current.some(s => s.url === song.url);
  const updated = exists ? current : [...current, song];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('lovecapsule:playlist-updated', { detail: updated }));
  }
  return updated;
}

export function VintageMusicBox() {
  const [playlist, setPlaylist] = useState(() => getSavedPlaylist());

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [prevVolume, setPrevVolume] = useState(0.4);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // New song inputs
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [addError, setAddError] = useState('');

  // Playback Progress & Seeking
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e) => {
    setIsSeeking(true);
    setCurrentTime(Number(e.target.value));
  };

  const handleSeekEnd = (e) => {
    const target = Number(e.target.value);
    setIsSeeking(false);
    if (isYouTubeTrack) {
      if (ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(target, true);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytReadyRef = useRef(false);
  const pendingYtIdRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0] || { name: 'Chưa có bài hát', artist: '', url: '' };
  const isYouTubeTrack = Boolean(extractYouTubeId(currentTrack?.url));

  // Progress update timer for seek bar & time display
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (isSeeking) return;
      if (isYouTubeTrack) {
        if (ytReadyRef.current && ytPlayerRef.current?.getCurrentTime) {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(curr);
            if (dur > 0) setDuration(dur);
          } catch (e) {}
        }
      } else if (audioRef.current) {
        const curr = audioRef.current.currentTime || 0;
        const dur = audioRef.current.duration || 0;
        setCurrentTime(curr);
        if (dur > 0 && !isNaN(dur)) setDuration(dur);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, isYouTubeTrack, isSeeking]);

  // Listen for external playlist updates
  useEffect(() => {
    const handlePlaylistUpdated = (e) => {
      if (Array.isArray(e.detail)) {
        setPlaylist(e.detail);
      }
    };
    window.addEventListener('lovecapsule:playlist-updated', handlePlaylistUpdated);
    return () => window.removeEventListener('lovecapsule:playlist-updated', handlePlaylistUpdated);
  }, []);

  // Listen for pause global music event (e.g. from Letter Writer Preview or Letter Reader)
  useEffect(() => {
    const handlePauseGlobal = () => {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      if (ytReadyRef.current && ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }
    };
    window.addEventListener('lovecapsule:pause-global-music', handlePauseGlobal);
    return () => window.removeEventListener('lovecapsule:pause-global-music', handlePauseGlobal);
  }, []);

  // Initialize YouTube Iframe API
  useEffect(() => {
    let isSubscribed = true;

    function initYT() {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('lovecapsule-yt-player', {
          height: '120',
          width: '120',
          videoId: extractYouTubeId(currentTrack?.url) || 'GxldQ9GyXfY',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              ytReadyRef.current = true;
              window.__ytPlayer = ytPlayerRef.current;
              event.target.setVolume(Math.round(volume * 100));

              if (pendingYtIdRef.current) {
                event.target.loadVideoById(pendingYtIdRef.current);
                pendingYtIdRef.current = null;
                if (isPlaying) {
                  event.target.playVideo();
                }
              }
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              if (event.data === window.YT.PlayerState.ENDED) {
                handleNext();
              } else if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setErrorMessage('');
              }
            },
            onError: (err) => {
              console.warn('YouTube Player error code:', err?.data);
              if (err?.data === 150 || err?.data === 101) {
                setErrorMessage('⚠️ Video YouTube này bị chủ sở hữu chặn phát nhúng trên website khác. Vui lòng chọn bản cover/lyric hoặc link MP3 khác nhé!');
                setIsPlaying(false);
              } else if (err?.data === 100 || err?.data === 2) {
                setErrorMessage('⚠️ Không tìm thấy bài hát trên YouTube. Vui lòng kiểm tra lại link!');
                setIsPlaying(false);
              }
            }
          }
        });
      } catch (e) {
        console.warn('YT Player init failed:', e);
      }
    }

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        if (isSubscribed) initYT();
      };
    }

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Initialize HTML5 Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = false;
      audioRef.current.onended = () => {
        handleNext();
      };
    }
  }, []);

  // Track switch effect
  useEffect(() => {
    const track = playlist[currentTrackIndex] || playlist[0];
    if (!track?.url) return;

    setErrorMessage('');
    setCurrentTime(0);
    setDuration(0);

    const ytId = extractYouTubeId(track.url);

    if (ytId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (ytReadyRef.current && ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        if (isPlaying) {
          ytPlayerRef.current.loadVideoById(ytId);
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.cueVideoById(ytId);
        }
      } else {
        pendingYtIdRef.current = ytId;
      }
    } else {
      if (ytReadyRef.current && ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }

      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.volume = volume;
        if (isPlaying) {
          audioRef.current.play().catch(e => console.warn('Audio play error:', e.message));
        }
      }
    }
  }, [currentTrackIndex]);

  // Volume change effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (ytReadyRef.current && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      try {
        ytPlayerRef.current.setVolume(Math.round(volume * 100));
      } catch (e) {}
    }
  }, [volume]);

  const togglePlay = () => {
    const track = playlist[currentTrackIndex] || playlist[0];
    if (!track?.url) return;

    const ytId = extractYouTubeId(track.url);

    if (isPlaying) {
      if (ytId && ytReadyRef.current && ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setErrorMessage('');
      if (ytId) {
        if (audioRef.current) audioRef.current.pause();
        if (ytReadyRef.current && ytPlayerRef.current?.loadVideoById) {
          ytPlayerRef.current.loadVideoById(ytId);
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } else {
          pendingYtIdRef.current = ytId;
          setIsPlaying(true);
        }
      } else {
        if (ytReadyRef.current && ytPlayerRef.current?.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        }
        if (audioRef.current) {
          if (!audioRef.current.src || audioRef.current.src !== track.url) {
            audioRef.current.src = track.url;
          }
          audioRef.current.volume = volume;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.warn('Autoplay error:', err.message);
          });
        }
      }
    }
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume > 0 ? prevVolume : 0.4);
    }
  };

  const handleAddSong = (e) => {
    e.preventDefault();
    setAddError('');
    setErrorMessage('');

    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) {
      setAddError('Vui lòng nhập đường dẫn bài hát');
      return;
    }

    const ytId = extractYouTubeId(trimmedUrl);
    const isAudioExt = trimmedUrl.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i);

    if (!ytId && !isAudioExt && !trimmedUrl.startsWith('http')) {
      setAddError('Link không hợp lệ! Vui lòng nhập link YouTube hoặc link file âm thanh (MP3)');
      return;
    }

    const title = newTitle.trim() || (ytId ? 'Bài hát YouTube' : 'Bài hát mới');
    const newSong = {
      id: `song-${Date.now()}`,
      name: title,
      artist: ytId ? 'YouTube' : 'Âm thanh tự chọn',
      url: trimmedUrl
    };

    const updated = [...playlist, newSong];
    setPlaylist(updated);
    localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('lovecapsule:playlist-updated', { detail: updated }));

    setNewTitle('');
    setNewUrl('');
    const newIdx = updated.length - 1;
    setCurrentTrackIndex(newIdx);
    setIsPlaying(true);

    if (ytId) {
      if (audioRef.current) audioRef.current.pause();
      if (ytReadyRef.current && ytPlayerRef.current?.loadVideoById) {
        ytPlayerRef.current.loadVideoById(ytId);
        ytPlayerRef.current.playVideo();
      } else {
        pendingYtIdRef.current = ytId;
      }
    } else {
      if (ytReadyRef.current && ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo();
      }
      if (audioRef.current) {
        audioRef.current.src = trimmedUrl;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(e => console.warn(e));
      }
    }
  };

  // Allow deleting ANY song
  const handleDeleteSong = (songId) => {
    if (playlist.length <= 1) {
      alert('Hộp nhạc cần ít nhất 1 bài hát!');
      return;
    }

    const updated = playlist.filter(s => s.id !== songId);
    setPlaylist(updated);
    localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(updated));

    if (currentTrackIndex >= updated.length) {
      setCurrentTrackIndex(0);
    }
  };

  const handleResetDefaultPlaylist = () => {
    if (window.confirm('Khôi phục lại danh sách bài hát mặc định?')) {
      setPlaylist(ROMANTIC_PLAYLIST);
      localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(ROMANTIC_PLAYLIST));
      setCurrentTrackIndex(0);
    }
  };

  return (
    <>
      {/* Hidden YouTube Iframe Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '-300px',
          left: '-300px',
          width: '120px',
          height: '120px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -999
        }}
      >
        <div id="lovecapsule-yt-player" />
      </div>

      {/* Main Vintage Music Box Widget */}
      <div
        className="vintage-music-box-container"
        style={{
          position: 'fixed',
          bottom: '18px',
          right: '20px',
          zIndex: 99,
          fontFamily: 'var(--font-main)',
          userSelect: 'none',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {isMinimized ? (
          /* Minimized Floating Antique Gramophone Badge */
          <div
            onClick={() => setIsMinimized(false)}
            title="Mở Hộp Nhạc Đĩa Cổ Điển"
            style={{
              background: 'linear-gradient(145deg, #381a10 0%, #200d06 100%)',
              border: '2px solid #d4af37',
              outline: '1px solid #78350f',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,230,160,0.3)',
              borderRadius: '32px',
              padding: '7px 16px 7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#fef3c7',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Spinning Mini Vinyl */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'repeating-radial-gradient(circle, #242424 0, #242424 2px, #151515 3px, #242424 4px)',
                border: '1.5px solid #d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: isPlaying ? 'spinVinyl 3.5s linear infinite' : 'none'
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #b91c1c 0%, #7f1d1d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px'
                }}
              >
                ❤️
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '160px' }}>
              <span style={{ fontSize: '10px', color: '#e5c07b', fontWeight: '800', letterSpacing: '0.8px' }}>
                HỘP NHẠC ĐĨA {isYouTubeTrack ? '• YT' : ''}
              </span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#ffffff'
                }}
              >
                {currentTrack?.name}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #aa8012 100%)',
                color: '#1a0d07',
                border: '1px solid #fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              {isPlaying ? <Pause size={13} fill="#1a0d07" /> : <Play size={13} fill="#1a0d07" style={{ marginLeft: '1px' }} />}
            </button>
          </div>
        ) : (
          /* Full Authentic Vintage Turntable / Gramophone Console */
          <div
            style={{
              background: 'linear-gradient(160deg, #3d1f14 0%, #261108 50%, #180903 100%)',
              border: '2.5px solid #d4af37',
              outline: '1.5px solid #78350f',
              borderRadius: '22px',
              padding: '16px 20px',
              boxShadow: '0 16px 45px rgba(0, 0, 0, 0.6), inset 0 1px 3px rgba(255, 230, 160, 0.4)',
              color: '#fef3c7',
              width: '410px',
              maxWidth: 'calc(100vw - 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}
          >
            {/* 4 Corner Brass Rivet Studs */}
            <div style={{ position: 'absolute', top: '7px', left: '9px', width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', boxShadow: 'inset 0 1px 1px #fff, 0 1px 2px #000' }} />
            <div style={{ position: 'absolute', top: '7px', right: '9px', width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', boxShadow: 'inset 0 1px 1px #fff, 0 1px 2px #000' }} />
            <div style={{ position: 'absolute', bottom: '7px', left: '9px', width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', boxShadow: 'inset 0 1px 1px #fff, 0 1px 2px #000' }} />
            <div style={{ position: 'absolute', bottom: '7px', right: '9px', width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', boxShadow: 'inset 0 1px 1px #fff, 0 1px 2px #000' }} />

            {/* Header: Vintage Gramophone Title & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📻</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#fde68a',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                  }}
                >
                  Hộp Nhạc Đĩa Cổ Điển
                </span>
                {isYouTubeTrack && (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      color: '#fff',
                      fontSize: '9.5px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      letterSpacing: '0.4px'
                    }}
                  >
                    YouTube
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPlaylistModal(true)}
                  title="Mở danh sách bài hát"
                  style={{
                    background: 'linear-gradient(135deg, #4c2918 0%, #2f170b 100%)',
                    border: '1.5px solid #d4af37',
                    color: '#fef3c7',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d4af37'}
                >
                  <ListMusic size={14} color="#f59e0b" />
                  <span>DS Nhạc ({playlist.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Thu nhỏ hộp nhạc"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d4af37',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>

            {/* Turntable Deck & Marquee Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'radial-gradient(ellipse at center, rgba(30, 15, 8, 0.9) 0%, rgba(10, 5, 2, 0.95) 100%)',
                border: '1.5px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '16px',
                padding: '12px 14px',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7)'
              }}
            >
              {/* Authentic Vinyl Turntable with Mechanical Tonearm */}
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Turntable Platter Rim */}
                <div
                  style={{
                    position: 'absolute',
                    width: '82px',
                    height: '82px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #2a2a2a 0%, #1a1a1a 100%)',
                    border: '2px solid #b8860b',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                  }}
                />

                {/* Spinning Vinyl Grooves */}
                <div
                  style={{
                    width: '78px',
                    height: '78px',
                    borderRadius: '50%',
                    background: 'repeating-radial-gradient(circle, #262626 0, #262626 2px, #161616 3px, #262626 4px)',
                    border: '1px solid #444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    animation: isPlaying ? 'spinVinyl 3.5s linear infinite' : 'none'
                  }}
                >
                  {/* Center Ruby Album Label */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #dc2626 0%, #881337 70%, #4c0519 100%)',
                      border: '1.5px solid #d4af37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
                      fontSize: '12px'
                    }}
                  >
                    ❤️
                  </div>
                  {/* Spindle */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#d4af37',
                      border: '1px solid #fff'
                    }}
                  />
                </div>

                {/* Dynamic Brass Tonearm (Needle moves onto record when playing!) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-6px',
                    width: '38px',
                    height: '70px',
                    transformOrigin: '28px 10px',
                    transform: isPlaying ? 'rotate(22deg)' : 'rotate(0deg)',
                    transition: 'transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none',
                    zIndex: 6
                  }}
                >
                  <svg width="38" height="70" viewBox="0 0 38 70" fill="none">
                    {/* Brass Gimbal Pivot */}
                    <circle cx="28" cy="10" r="7" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="1.2" />
                    <circle cx="28" cy="10" r="2.5" fill="#3b1d0e" />
                    {/* Counterweight */}
                    <rect x="25" y="0" width="6" height="4" rx="1" fill="#92400e" stroke="#78350f" strokeWidth="0.8" />
                    {/* Curved Metallic Arm */}
                    <path
                      d="M28 15 L24 45 L13 62"
                      stroke="url(#armGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Cartridge Headshell */}
                    <rect
                      x="7"
                      y="58"
                      width="11"
                      height="6"
                      rx="1.5"
                      transform="rotate(30 12 61)"
                      fill="#991b1b"
                      stroke="#fef08a"
                      strokeWidth="0.8"
                    />
                    {/* Stylus Needle tip */}
                    <circle cx="10" cy="67" r="1.4" fill="#ffffff" />
                    <defs>
                      <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="50%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#78350f" />
                      </linearGradient>
                      <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef9c3" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#854d0e" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Marquee & Track Information */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {/* Vacuum Tube Lamp indicator */}
                  <div
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      background: isPlaying ? '#22c55e' : '#f59e0b',
                      boxShadow: isPlaying ? '0 0 10px #22c55e' : '0 0 5px #f59e0b',
                      flexShrink: 0
                    }}
                  />
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {currentTrack?.name}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#e5c07b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: '600'
                  }}
                >
                  {currentTrack?.artist || 'Giai điệu lãng mạn'}
                </div>
              </div>
            </div>

            {/* Error Banner if YouTube video blocked or errored */}
            {errorMessage && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                color: '#fca5a5',
                lineHeight: 1.3
              }}>
                {errorMessage}
              </div>
            )}

            {/* Track Progress Scrubber & Time Display (Tua nhạc & thời gian) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '2px 4px 0 4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#fde68a',
              fontFamily: 'monospace'
            }}>
              <span style={{ minWidth: '35px', textAlign: 'right', color: '#fef3c7' }}>
                {formatTime(currentTime)}
              </span>

              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="0.5"
                  value={currentTime}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekEnd}
                  onTouchEnd={handleSeekEnd}
                  style={{
                    width: '100%',
                    height: '5px',
                    borderRadius: '4px',
                    accentColor: '#f59e0b',
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Kéo thanh này để tua bài hát"
                />
              </div>

              <span style={{ minWidth: '35px', color: '#d4af37' }}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Controls: Prev, Play/Pause, Next & Volume */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              {/* Playback Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  title="Bài trước"
                  style={{
                    background: 'linear-gradient(135deg, #442618 0%, #29150b 100%)',
                    border: '1.5px solid #d4af37',
                    color: '#fef3c7',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <SkipBack size={16} fill="#fef3c7" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? 'Tạm dừng' : 'Phát nhạc nền'}
                  style={{
                    background: 'linear-gradient(135deg, #fde047 0%, #d4af37 50%, #996515 100%)',
                    border: '2px solid #ffffff',
                    color: '#1a0d07',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.5)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isPlaying ? (
                    <Pause size={19} fill="#1a0d07" />
                  ) : (
                    <Play size={19} fill="#1a0d07" style={{ marginLeft: '2px' }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  title="Bài tiếp theo"
                  style={{
                    background: 'linear-gradient(135deg, #442618 0%, #29150b 100%)',
                    border: '1.5px solid #d4af37',
                    color: '#fef3c7',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <SkipForward size={16} fill="#fef3c7" />
                </button>
              </div>

              {/* Volume Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px' }}>
                <button
                  type="button"
                  onClick={toggleMute}
                  title={volume === 0 ? 'Bật âm' : 'Tắt tiếng'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d4af37',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={{
                    width: '85px',
                    accentColor: '#d4af37',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playlist & Add Song Modal */}
      {showPlaylistModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(25, 14, 8, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px'
          }}
          onClick={() => setShowPlaylistModal(false)}
        >
          <div
            style={{
              background: '#fffdfa',
              border: '2px solid #b8860b',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Clean & Direct */}
            <div
              style={{
                background: 'linear-gradient(135deg, #2f1910 0%, #1e0e07 100%)',
                color: '#fef3c7',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #c59b27'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📻</span>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: '#fef3c7' }}>
                  Danh Sách Bài Hát
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#d4af37',
                  fontSize: '24px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Form Add Song: Clean, NO verbose examples or suggestions */}
              <form
                onSubmit={handleAddSong}
                style={{
                  background: '#fef9f0',
                  border: '1.5px dashed #d4af37',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#92400e' }}>
                  Thêm bài hát mới
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tên bài hát:
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên bài hát"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #d8c8ba',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Link YouTube hoặc MP3:
                  </label>
                  <input
                    type="text"
                    placeholder="Dán link tại đây"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #d8c8ba',
                      fontSize: '13.5px',
                      outline: 'none',
                      background: '#fff'
                    }}
                  />
                </div>

                {addError && (
                  <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                    {addError}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37 0%, #aa8012 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '2px',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <Plus size={15} />
                  <span>Thêm bài hát</span>
                </button>
              </form>

              {/* Playlist Items */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-ink)' }}>
                    Các bài hát trong hộp nhạc ({playlist.length}):
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaultPlaylist}
                    title="Khôi phục các bài hát mặc định"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Khôi phục gốc</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {playlist.map((track, idx) => {
                    const isCurrent = idx === currentTrackIndex;
                    const isYT = Boolean(extractYouTubeId(track.url));

                    return (
                      <div
                        key={track.id || idx}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          setIsPlaying(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: isCurrent ? '1.5px solid #d4af37' : '1px solid var(--border-subtle)',
                          background: isCurrent ? '#fffbeb' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isCurrent ? '#d4af37' : 'var(--bg-kraft)',
                              color: isCurrent ? '#fff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              flexShrink: 0
                            }}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause size={13} fill="#fff" />
                            ) : (
                              <Play size={13} fill="currentColor" style={{ marginLeft: '1px' }} />
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13.5px',
                                fontWeight: isCurrent ? '800' : '600',
                                color: isCurrent ? '#92400e' : 'var(--text-ink)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {track.name}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{track.artist || 'LoveCapsule'}</span>
                              {isYT && (
                                <span
                                  style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    fontSize: '9.5px',
                                    fontWeight: '700',
                                    padding: '0 5px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  YouTube
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete button (Available for EVERY track) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSong(track.id);
                          }}
                          title={`Xóa bài hát "${track.name}"`}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
