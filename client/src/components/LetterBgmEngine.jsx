import React, { useEffect, useRef } from 'react';
import { extractYouTubeId } from './VintageMusicBox.jsx';

export function LetterBgmEngine({ url, isPlaying, volume = 0.45, onEnded }) {
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const containerId = useRef(`letter-bgm-yt-${Math.random().toString(36).substring(2, 9)}`);
  const ytId = extractYouTubeId(url);
  const isYouTube = Boolean(ytId);

  // When playing starts, pause global music box
  useEffect(() => {
    if (isPlaying && url) {
      window.dispatchEvent(new CustomEvent('lovecapsule:pause-global-music'));
    }
  }, [isPlaying, url]);

  // HTML5 Audio playback for MP3 and direct audio streams
  useEffect(() => {
    if (isYouTube || !url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    audioRef.current.volume = volume;
    if (audioRef.current.src !== url) {
      audioRef.current.src = url;
    }

    if (isPlaying) {
      audioRef.current.play().catch(e => console.warn('BGM MP3 play error:', e.message));
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [url, isPlaying, isYouTube, volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (!url || !isYouTube) return null;

  // Render hidden YouTube player iframe with autoplay when active
  return (
    <div
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: '120px',
        height: '120px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -999
      }}
    >
      {isPlaying && ytId && (
        <iframe
          key={`${ytId}-${isPlaying}`}
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&loop=1&playlist=${ytId}`}
          title="letter-bgm-youtube"
          allow="autoplay; encrypted-media"
          style={{ width: '120px', height: '120px', border: 'none' }}
        />
      )}
    </div>
  );
}

