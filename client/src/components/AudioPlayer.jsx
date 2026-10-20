import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

/**
 * AudioPlayer provides gentle, relaxing background sound using Web Audio API
 * synthesizer chords, ensuring 100% reliable offline playback with zero external dependencies.
 */
export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const startLofiSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Gentle pentatonic chime frequencies (C major 7th / F major 7th vibes)
      const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25]; // C4, E4, G4, B4, C5, E5

      const playChime = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = notes[Math.floor(Math.random() * notes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.6);
      };

      playChime();
      intervalRef.current = setInterval(() => {
        playChime();
      }, 2500);

      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio autoplay restricted:', err.message);
    }
  };

  const stopLofiSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopLofiSound();
    } else {
      startLofiSound();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: '#fff',
      padding: '4px 10px',
      borderRadius: '20px',
      border: '1px solid var(--border-subtle)',
      fontSize: '12px',
      fontWeight: '600',
      color: 'var(--text-muted)'
    }}>
      <Music size={13} color="var(--rose-primary)" />
      <span style={{ fontSize: '11.5px' }}>Nhạc Lofi:</span>
      <button 
        onClick={toggleSound}
        style={{
          border: 'none',
          background: isPlaying ? 'var(--rose-light)' : '#f0ece4',
          color: isPlaying ? 'var(--rose-primary)' : 'var(--text-muted)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        title={isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền lofi du dương"}
      >
        {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
      </button>
    </div>
  );
}
