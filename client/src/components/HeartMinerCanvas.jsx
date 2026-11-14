import React, { useRef, useEffect, useCallback } from 'react';
import {
  playShoot,
  playCatch,
  playReelTick,
  playExplosion
} from '../utils/minerAudio.js';

export function HeartMinerCanvas({
  level,
  hasPowerDrink,
  hasLuckyClover,
  hasDiamondPolish,
  dynamiteCount,
  onUseDynamite,
  onItemCollected,
  onSpecialFound,
  isPaused
}) {
  const canvasRef = useRef(null);

  // References for mutable game loop state
  const stateRef = useRef({
    // Crane & Hook
    originX: 400,
    originY: 55,
    angle: 0,
    angleDir: 1,
    angleSpeed: 0.032,
    hookState: 'IDLE', // 'IDLE' | 'SHOOTING' | 'RETRACTING'
    hookLength: 45,
    hookSpeed: 9.5,
    caughtItem: null,
    // Entities
    items: [],
    particles: [],
    // Miner animation
    crankRotation: 0,
    tickCounter: 0
  });

  // Level Item Generation
  const initLevelItems = useCallback((lvl) => {
    const items = [];
    const usedPositions = [];

    function getValidPos(radius, minY = 140, maxY = 460) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const x = 50 + Math.random() * 700;
        const y = minY + Math.random() * (maxY - minY);
        const collides = usedPositions.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < (p.r + radius + 15);
        });
        if (!collides) {
          usedPositions.push({ x, y, r: radius });
          return { x, y };
        }
      }
      return { x: 100 + Math.random() * 600, y: minY + Math.random() * (maxY - minY) };
    }

    // Diamond price adjusted with Polish book
    const diamondVal = hasDiamondPolish ? 780 : 600;

    // Helper item adders
    const addHeart = (size) => {
      if (size === 'small') {
        const pos = getValidPos(16, 120, 460);
        items.push({ id: Math.random(), type: 'heart_small', x: pos.x, y: pos.y, r: 15, value: 50, mass: 1.1 });
      } else if (size === 'medium') {
        const pos = getValidPos(23, 140, 460);
        items.push({ id: Math.random(), type: 'heart_medium', x: pos.x, y: pos.y, r: 21, value: 100, mass: 2.2 });
      } else if (size === 'giant') {
        const pos = getValidPos(33, 180, 470);
        items.push({ id: Math.random(), type: 'heart_giant', x: pos.x, y: pos.y, r: 30, value: 250, mass: 4.5 });
      } else if (size === 'king') {
        const pos = getValidPos(42, 240, 480);
        items.push({ id: Math.random(), type: 'heart_king', x: pos.x, y: pos.y, r: 38, value: 500, mass: 6.5 });
      }
    };

    const addDiamond = () => {
      const pos = getValidPos(14, 180, 480);
      items.push({ id: Math.random(), type: 'diamond', x: pos.x, y: pos.y, r: 13, value: diamondVal, mass: 0.8 });
    };

    const addRock = (size) => {
      if (size === 'small') {
        const pos = getValidPos(18, 130, 460);
        items.push({ id: Math.random(), type: 'rock_small', x: pos.x, y: pos.y, r: 17, value: 11, mass: 4.8 });
      } else {
        const pos = getValidPos(32, 160, 470);
        items.push({ id: Math.random(), type: 'rock_large', x: pos.x, y: pos.y, r: 30, value: 20, mass: 9.0 });
      }
    };

    const addMysteryBag = () => {
      const pos = getValidPos(22, 150, 470);
      items.push({ id: Math.random(), type: 'mystery_bag', x: pos.x, y: pos.y, r: 20, value: 0, mass: 2.5 });
    };

    const addBear = () => {
      items.push({
        id: Math.random(),
        type: 'bear',
        x: 100,
        y: 200 + Math.random() * 200,
        r: 18,
        value: 200,
        mass: 1.8,
        vx: 1.4,
        minX: 60,
        maxX: 740
      });
    };

    // Distribution by level
    if (lvl === 1) {
      for (let i = 0; i < 5; i++) addHeart('small');
      for (let i = 0; i < 3; i++) addHeart('medium');
      addHeart('giant');
      addRock('small');
      addRock('small');
    } else if (lvl === 2) {
      for (let i = 0; i < 4; i++) addHeart('small');
      for (let i = 0; i < 3; i++) addHeart('medium');
      for (let i = 0; i < 2; i++) addHeart('giant');
      addDiamond();
      addRock('small');
      addRock('large');
      addMysteryBag();
    } else if (lvl === 3) {
      for (let i = 0; i < 3; i++) addHeart('medium');
      for (let i = 0; i < 2; i++) addHeart('giant');
      addHeart('king');
      addDiamond();
      addDiamond();
      addRock('small');
      addRock('large');
      addRock('large');
      addMysteryBag();
      addBear();
    } else {
      // Level 4+
      for (let i = 0; i < 3; i++) addHeart('medium');
      for (let i = 0; i < 3; i++) addHeart('giant');
      addHeart('king');
      for (let i = 0; i < 3; i++) addDiamond();
      for (let i = 0; i < 3; i++) addRock('large');
      for (let i = 0; i < 2; i++) addRock('small');
      addMysteryBag();
      addMysteryBag();
      addBear();
    }

    stateRef.current.items = items;
    stateRef.current.hookState = 'IDLE';
    stateRef.current.hookLength = 45;
    stateRef.current.caughtItem = null;
    stateRef.current.particles = [];
  }, [hasDiamondPolish]);

  // Load level items on level change
  useEffect(() => {
    initLevelItems(level);
  }, [level, initLevelItems]);

  // Hook Launch Trigger
  const fireHook = useCallback(() => {
    const s = stateRef.current;
    if (s.hookState === 'IDLE' && !isPaused) {
      s.hookState = 'SHOOTING';
      playShoot();
    }
  }, [isPaused]);

  // Dynamite Trigger
  const throwDynamite = useCallback(() => {
    const s = stateRef.current;
    if (s.hookState === 'RETRACTING' && s.caughtItem && dynamiteCount > 0 && !isPaused) {
      // Consume dynamite
      onUseDynamite();
      playExplosion();

      // Create explosion particles at item position
      const item = s.caughtItem;
      for (let i = 0; i < 28; i++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pSpeed = 2 + Math.random() * 6;
        s.particles.push({
          x: item.x,
          y: item.y,
          vx: Math.cos(pAngle) * pSpeed,
          vy: Math.sin(pAngle) * pSpeed,
          radius: 3 + Math.random() * 5,
          color: Math.random() > 0.5 ? '#f43f5e' : (Math.random() > 0.5 ? '#fbbf24' : '#e11d48'),
          alpha: 1,
          decay: 0.035
        });
      }

      // Detach and accelerate reel
      s.caughtItem = null;
    }
  }, [dynamiteCount, onUseDynamite, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'Space') {
        e.preventDefault();
        fireHook();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        throwDynamite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fireHook, throwDynamite]);

  // Main Canvas Render & Physics Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      const s = stateRef.current;

      // 1. UPDATE PHYSICS
      if (!isPaused) {
        // A. Hook swinging
        if (s.hookState === 'IDLE') {
          s.angle += s.angleSpeed * s.angleDir;
          if (s.angle > 1.25) {
            s.angle = 1.25;
            s.angleDir = -1;
          } else if (s.angle < -1.25) {
            s.angle = -1.25;
            s.angleDir = 1;
          }
        }

        // B. Hook Shooting
        if (s.hookState === 'SHOOTING') {
          s.hookLength += s.hookSpeed;
          const hookX = s.originX + Math.sin(s.angle) * s.hookLength;
          const hookY = s.originY + Math.cos(s.angle) * s.hookLength;

          // Check boundary limits
          if (hookX < 15 || hookX > 785 || hookY > 488) {
            s.hookState = 'RETRACTING';
          }

          // Check item collision
          for (let i = 0; i < s.items.length; i++) {
            const item = s.items[i];
            const dist = Math.hypot(hookX - item.x, hookY - item.y);
            if (dist < item.r + 10) {
              // Caught!
              s.caughtItem = item;
              s.items.splice(i, 1);
              s.hookState = 'RETRACTING';
              playCatch();
              break;
            }
          }
        }

        // C. Hook Retracting
        if (s.hookState === 'RETRACTING') {
          // Reeling speed formula based on weight
          let speed = 13.0;
          if (s.caughtItem) {
            const effectiveMass = Math.max(0.8, s.caughtItem.mass);
            speed = 10.5 / effectiveMass;
            if (hasPowerDrink) {
              speed *= 2.2;
            }
          }

          s.hookLength -= speed;
          s.crankRotation += 0.25;

          s.tickCounter++;
          if (s.tickCounter % 9 === 0) {
            playReelTick();
          }

          if (s.hookLength <= 45) {
            // Reached crane
            s.hookLength = 45;
            s.hookState = 'IDLE';

            if (s.caughtItem) {
              const item = s.caughtItem;
              s.caughtItem = null;

              if (item.type === 'mystery_bag') {
                // Mystery bag resolution
                let prizeVal = 100;
                if (hasLuckyClover) {
                  const prizes = [400, 550, 700, 850];
                  prizeVal = prizes[Math.floor(Math.random() * prizes.length)];
                } else {
                  const prizes = [50, 150, 250, 500, 750];
                  prizeVal = prizes[Math.floor(Math.random() * prizes.length)];
                }

                // Chance to award dynamite
                if (Math.random() < 0.25) {
                  onSpecialFound?.('🧨 Nhận được 1 quả Thuốc Nổ!');
                } else if (Math.random() < 0.25) {
                  onSpecialFound?.('⚡ Nhận được Nước Tăng Lực!');
                }

                onItemCollected(prizeVal);
              } else {
                onItemCollected(item.value);
              }
            }
          }
        }

        // D. Update roaming bears
        s.items.forEach(item => {
          if (item.type === 'bear') {
            item.x += item.vx;
            if (item.x >= item.maxX) {
              item.x = item.maxX;
              item.vx = -Math.abs(item.vx);
            } else if (item.x <= item.minX) {
              item.x = item.minX;
              item.vx = Math.abs(item.vx);
            }
          }
        });

        // E. Update explosion particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            s.particles.splice(i, 1);
          }
        }
      }

      // Calculate current hook tip
      const hookX = s.originX + Math.sin(s.angle) * s.hookLength;
      const hookY = s.originY + Math.cos(s.angle) * s.hookLength;

      if (s.caughtItem) {
        s.caughtItem.x = hookX;
        s.caughtItem.y = hookY + s.caughtItem.r * 0.7;
      }

      // 2. RENDER CANVAS
      ctx.clearRect(0, 0, 800, 500);

      // Background underground mine
      const groundGrad = ctx.createLinearGradient(0, 75, 0, 500);
      groundGrad.addColorStop(0, '#ebdcc9');
      groundGrad.addColorStop(0.3, '#dfccb3');
      groundGrad.addColorStop(1, '#caa382');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 75, 800, 425);

      // Subtle earth texture lines
      ctx.strokeStyle = 'rgba(163, 127, 98, 0.2)';
      ctx.lineWidth = 1.5;
      for (let y = 110; y < 490; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(200, y + 10, 500, y - 10, 800, y + 5);
        ctx.stroke();
      }

      // Top surface platform
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 75);
      skyGrad.addColorStop(0, '#fef6ee');
      skyGrad.addColorStop(1, '#fde6ce');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, 75);

      // Grass / surface border
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(0, 70, 800, 5);

      // Wooden mine support beam
      ctx.fillStyle = '#8b5cf6';
      ctx.fillStyle = '#92400e';
      ctx.fillRect(s.originX - 45, 60, 90, 10);

      // Crane Pulley Base
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(s.originX, s.originY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Cute Miner Character
      ctx.save();
      ctx.translate(s.originX, s.originY - 26);
      // Miner body
      ctx.fillStyle = '#e06d7e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Miner head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -12, 10, 0, Math.PI * 2);
      ctx.fill();
      // Miner hat with love badge
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -15, 11, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', 0, -15);
      // Crank handle turning
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      const crankX = 12 + Math.cos(s.crankRotation) * 8;
      const crankY = Math.sin(s.crankRotation) * 8;
      ctx.lineTo(crankX, crankY);
      ctx.stroke();
      ctx.restore();

      // DRAW ITEMS
      s.items.forEach(item => drawItem(ctx, item));

      // DRAW CAUGHT ITEM
      if (s.caughtItem) {
        drawItem(ctx, s.caughtItem);
      }

      // DRAW ROPE
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(s.originX, s.originY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      // DRAW HOOK / CLAW
      ctx.save();
      ctx.translate(hookX, hookY);
      ctx.rotate(s.angle);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(-4, -6, 8, 8);

      const clawSpread = s.hookState === 'SHOOTING' ? 14 : (s.caughtItem ? 7 : 11);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // Left claw
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.quadraticCurveTo(-clawSpread, 12, -4, 18);
      ctx.stroke();

      // Right claw
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.quadraticCurveTo(clawSpread, 12, 4, 18);
      ctx.stroke();

      ctx.restore();

      // DRAW EXPLOSION PARTICLES
      s.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, hasPowerDrink, hasLuckyClover, onItemCollected, onSpecialFound]);

  // Helper: Draw item with crisp Canvas vector art
  function drawItem(ctx, item) {
    ctx.save();
    ctx.translate(item.x, item.y);

    if (item.type.startsWith('heart_')) {
      const r = item.r;
      let gradColor1 = '#f43f5e';
      let gradColor2 = '#be123c';

      if (item.type === 'heart_giant') {
        gradColor1 = '#fb7185';
        gradColor2 = '#9f1239';
      } else if (item.type === 'heart_king') {
        gradColor1 = '#ff4d6d';
        gradColor2 = '#590d22';
      }

      ctx.fillStyle = gradColor1;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const topY = -r * 0.4;
      ctx.moveTo(0, topY);
      ctx.bezierCurveTo(r * 0.9, -r * 1.1, r * 1.3, r * 0.3, 0, r);
      ctx.bezierCurveTo(-r * 1.3, r * 0.3, -r * 0.9, -r * 1.1, 0, topY);
      ctx.fill();

      // Gold outline for King Heart
      if (item.type === 'heart_king') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Heart Gloss shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'diamond') {
      const r = item.r;
      ctx.shadowColor = 'rgba(236, 72, 153, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.1);
      ctx.lineTo(r, -r * 0.3);
      ctx.lineTo(r * 0.7, r);
      ctx.lineTo(-r * 0.7, r);
      ctx.lineTo(-r, -r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Facet highlight
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.1);
      ctx.lineTo(r * 0.3, -r * 0.3);
      ctx.lineTo(-r * 0.3, -r * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (item.type.startsWith('rock_')) {
      const r = item.r;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      // Craggy irregular rock
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.8, -r * 0.7);
      ctx.lineTo(r, 0);
      ctx.lineTo(r * 0.8, r * 0.8);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.9, r * 0.7);
      ctx.lineTo(-r, -0.2);
      ctx.lineTo(-r * 0.6, -r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rock crack lines
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.2);
      ctx.lineTo(r * 0.2, r * 0.1);
      ctx.lineTo(r * 0.4, r * 0.4);
      ctx.stroke();
    } else if (item.type === 'mystery_bag') {
      const r = item.r;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 2, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-4, -r * 0.9, 8, 6);

      // Question mark '?'
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 2);
    } else if (item.type === 'bear') {
      const r = item.r;
      // Teddy bear holding a heart
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      // Bear ears
      ctx.beginPath();
      ctx.arc(-r * 0.7, -r * 0.7, r * 0.35, 0, Math.PI * 2);
      ctx.arc(r * 0.7, -r * 0.7, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // Little heart in bear's paws
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(-2, 2, 4, 0, Math.PI * 2);
      ctx.arc(2, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onClick={fireHook}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '800 / 500',
          display: 'block',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          cursor: stateRef.current.hookState === 'IDLE' ? 'pointer' : 'default',
          background: '#ebdcc9'
        }}
      />

      {/* Floating Mobile / On-Screen Controls */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        zIndex: 10
      }}>
        {/* Dynamite button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            throwDynamite();
          }}
          disabled={dynamiteCount <= 0}
          title="Bấm W hoặc Mũi tên lên để nổ bom"
          style={{
            background: dynamiteCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : '#9ca3af',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: '24px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: dynamiteCount > 0 ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: dynamiteCount > 0 ? 1 : 0.6
          }}
        >
          <span>🧨 Nổ Bom</span>
          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
            {dynamiteCount}
          </span>
        </button>

        {/* Shoot Hook Button (Touch friendly) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fireHook();
          }}
          style={{
            background: 'linear-gradient(135deg, #e06d7e 0%, #c95264 100%)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.7)',
            borderRadius: '24px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(224, 109, 126, 0.4)'
          }}
        >
          ⬇️ Thả Móc (Space)
        </button>
      </div>
    </div>
  );
}
