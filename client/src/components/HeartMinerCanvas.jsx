import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  playShoot,
  playCatch,
  playReelTick,
  playExplosion
} from '../utils/minerAudio.js';

export function HeartMinerCanvas({
  level,
  cash,
  targetGoal,
  timeLeft,
  levelsCompleted,
  hasPowerDrink,
  hasLuckyClover,
  hasDiamondPolish,
  dynamiteCount,
  onUseDynamite,
  onItemCollected,
  onSpecialFound,
  onExitGame,
  isPaused
}) {
  const canvasRef = useRef(null);

  // Asset images loaded flag
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const assetsRef = useRef({
    bg: null,
    hook: null,
    playerMining: null,
    playerThrow: null,
    gold: null,
    rock: null,
    diamond: null,
    bag: null,
    dynamite: null,
    explosion: null
  });

  // Preload authentic images
  useEffect(() => {
    const assets = {
      bg: '/miner/background.png',
      hook: '/miner/hook.png',
      playerMining: '/miner/player_mining.png',
      playerThrow: '/miner/player_throw.png',
      gold: '/miner/gold.png',
      rock: '/miner/rock.png',
      diamond: '/miner/diamond.png',
      bag: '/miner/bag.png',
      dynamite: '/miner/dynamite.png',
      explosion: '/miner/explosion.png'
    };

    let loadedCount = 0;
    const total = Object.keys(assets).length;

    Object.entries(assets).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[key] = img;
        loadedCount++;
        if (loadedCount >= total) {
          setAssetsLoaded(true);
        }
      };
      img.onerror = () => {
        // Fallback gracefully even if image fails
        loadedCount++;
        if (loadedCount >= total) {
          setAssetsLoaded(true);
        }
      };
    });
  }, []);

  // References for game state
  const stateRef = useRef({
    originX: 400,
    originY: 64,
    angle: 0,
    angleDir: 1,
    angleSpeed: 0.034,
    hookState: 'IDLE', // 'IDLE' | 'SHOOTING' | 'RETRACTING'
    hookLength: 38,
    hookSpeed: 10.0,
    caughtItem: null,
    // Entities
    items: [],
    // Explosions
    explosions: [], // { x, y, frame: 0, maxFrame: 14 }
    // Animation
    animFrame: 0,
    tickCounter: 0,
    minerAction: 'IDLE' // 'IDLE' | 'MINING' | 'THROWING'
  });

  // Level Item Generation
  const initLevelItems = useCallback((lvl) => {
    const items = [];
    const usedPositions = [];

    function getValidPos(radius, minY = 130, maxY = 470) {
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
      return { x: 80 + Math.random() * 640, y: minY + Math.random() * (maxY - minY) };
    }

    const diamondVal = hasDiamondPolish ? 780 : 600;

    // Helpers to add authentic objects
    const addHeart = (size) => {
      if (size === 'ruby') {
        const pos = getValidPos(20, 140, 480);
        items.push({ id: Math.random(), type: 'heart_ruby', x: pos.x, y: pos.y, r: 18, value: 100, mass: 1.8 });
      } else if (size === 'giant_ruby') {
        const pos = getValidPos(30, 180, 480);
        items.push({ id: Math.random(), type: 'heart_giant_ruby', x: pos.x, y: pos.y, r: 28, value: 250, mass: 3.5 });
      } else if (size === 'golden_heart') {
        const pos = getValidPos(26, 160, 480);
        items.push({ id: Math.random(), type: 'heart_golden', x: pos.x, y: pos.y, r: 24, value: 200, mass: 2.8 });
      }
    };

    const addClassicGold = (size) => {
      if (size === 'small') {
        const pos = getValidPos(16, 120, 470);
        items.push({ id: Math.random(), type: 'gold_small', x: pos.x, y: pos.y, r: 15, value: 50, mass: 1.2 });
      } else if (size === 'medium') {
        const pos = getValidPos(24, 150, 480);
        items.push({ id: Math.random(), type: 'gold_medium', x: pos.x, y: pos.y, r: 22, value: 100, mass: 2.4 });
      } else {
        const pos = getValidPos(36, 200, 480);
        items.push({ id: Math.random(), type: 'gold_giant', x: pos.x, y: pos.y, r: 34, value: 500, mass: 6.0 });
      }
    };

    const addDiamond = () => {
      const pos = getValidPos(14, 170, 480);
      items.push({ id: Math.random(), type: 'diamond', x: pos.x, y: pos.y, r: 13, value: diamondVal, mass: 0.8 });
    };

    const addRock = (size) => {
      if (size === 'small') {
        const pos = getValidPos(18, 130, 480);
        items.push({ id: Math.random(), type: 'rock_small', x: pos.x, y: pos.y, r: 17, value: 11, mass: 4.8 });
      } else {
        const pos = getValidPos(32, 160, 480);
        items.push({ id: Math.random(), type: 'rock_large', x: pos.x, y: pos.y, r: 30, value: 20, mass: 8.8 });
      }
    };

    const addMysteryBag = () => {
      const pos = getValidPos(22, 140, 480);
      items.push({ id: Math.random(), type: 'bag', x: pos.x, y: pos.y, r: 20, value: 0, mass: 2.2 });
    };

    // Level item population
    if (lvl === 1) {
      addClassicGold('small');
      addClassicGold('small');
      addHeart('ruby');
      addHeart('ruby');
      addHeart('golden_heart');
      addClassicGold('medium');
      addRock('small');
      addRock('small');
      addMysteryBag();
    } else if (lvl === 2) {
      addClassicGold('small');
      addHeart('ruby');
      addHeart('golden_heart');
      addHeart('giant_ruby');
      addClassicGold('medium');
      addClassicGold('giant');
      addDiamond();
      addRock('small');
      addRock('large');
      addMysteryBag();
    } else if (lvl === 3) {
      addHeart('ruby');
      addHeart('golden_heart');
      addHeart('giant_ruby');
      addClassicGold('medium');
      addClassicGold('giant');
      addDiamond();
      addDiamond();
      addRock('small');
      addRock('large');
      addRock('large');
      addMysteryBag();
      addMysteryBag();
    } else {
      // Level 4+
      addHeart('ruby');
      addHeart('golden_heart');
      addHeart('giant_ruby');
      addClassicGold('medium');
      addClassicGold('giant');
      addDiamond();
      addDiamond();
      addDiamond();
      addRock('large');
      addRock('large');
      addRock('small');
      addMysteryBag();
      addMysteryBag();
    }

    stateRef.current.items = items;
    stateRef.current.hookState = 'IDLE';
    stateRef.current.hookLength = 38;
    stateRef.current.caughtItem = null;
    stateRef.current.explosions = [];
  }, [hasDiamondPolish]);

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
      onUseDynamite();

      // Trigger authentic explosion
      try {
        const audio = new Audio('/miner/explosion.ogg');
        audio.volume = 0.6;
        audio.play().catch(() => playExplosion());
      } catch (e) {
        playExplosion();
      }

      // Add explosion animation
      s.explosions.push({
        x: s.caughtItem.x,
        y: s.caughtItem.y,
        frame: 0,
        maxFrame: 14
      });

      s.caughtItem = null;
      s.minerAction = 'THROWING';
      setTimeout(() => {
        if (s.minerAction === 'THROWING') s.minerAction = 'IDLE';
      }, 500);
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
      const assets = assetsRef.current;

      // 1. UPDATE PHYSICS
      if (!isPaused) {
        // A. Hook swinging
        if (s.hookState === 'IDLE') {
          s.minerAction = 'IDLE';
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
          s.minerAction = 'IDLE';
          s.hookLength += s.hookSpeed;
          const hookX = s.originX + Math.sin(s.angle) * s.hookLength;
          const hookY = s.originY + Math.cos(s.angle) * s.hookLength;

          // Boundary checks
          if (hookX < 15 || hookX > 785 || hookY > 505) {
            s.hookState = 'RETRACTING';
          }

          // Item collisions
          for (let i = 0; i < s.items.length; i++) {
            const item = s.items[i];
            const dist = Math.hypot(hookX - item.x, hookY - item.y);
            if (dist < item.r + 14) {
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
          s.minerAction = 'MINING';
          let speed = 14.0;
          if (s.caughtItem) {
            const effectiveMass = Math.max(0.8, s.caughtItem.mass);
            speed = 11.0 / effectiveMass;
            if (hasPowerDrink) {
              speed *= 2.2;
            }
          }

          s.hookLength -= speed;
          s.tickCounter++;

          if (s.tickCounter % 5 === 0) {
            s.animFrame = (s.animFrame + 1) % 7;
          }

          if (s.tickCounter % 10 === 0) {
            playReelTick();
          }

          if (s.hookLength <= 38) {
            // Reached miner top deck
            s.hookLength = 38;
            s.hookState = 'IDLE';
            s.minerAction = 'IDLE';

            if (s.caughtItem) {
              const item = s.caughtItem;
              s.caughtItem = null;

              // Play reward audio
              try {
                const rewardAud = new Audio('/miner/reward.ogg');
                rewardAud.volume = 0.5;
                rewardAud.play().catch(() => playCatch());
              } catch (e) {
                playCatch();
              }

              if (item.type === 'bag') {
                let prizeVal = 100;
                if (hasLuckyClover) {
                  const prizes = [450, 600, 750, 900];
                  prizeVal = prizes[Math.floor(Math.random() * prizes.length)];
                } else {
                  const prizes = [50, 150, 300, 500, 800];
                  prizeVal = prizes[Math.floor(Math.random() * prizes.length)];
                }

                if (Math.random() < 0.28) {
                  onSpecialFound?.('🧨 Nhận được 1 quả Thuốc Nổ!');
                } else if (Math.random() < 0.28) {
                  onSpecialFound?.('⚡ Nhận được Nước Tăng Lực!');
                }

                onItemCollected(prizeVal);
              } else {
                onItemCollected(item.value);
              }
            }
          }
        }

        // Update explosions
        for (let i = s.explosions.length - 1; i >= 0; i--) {
          const exp = s.explosions[i];
          exp.frame += 0.5;
          if (exp.frame >= exp.maxFrame) {
            s.explosions.splice(i, 1);
          }
        }
      }

      // Calculate hook position
      const hookX = s.originX + Math.sin(s.angle) * s.hookLength;
      const hookY = s.originY + Math.cos(s.angle) * s.hookLength;

      if (s.caughtItem) {
        s.caughtItem.x = hookX;
        s.caughtItem.y = hookY + s.caughtItem.r * 0.7;
      }

      // 2. RENDER GRAPHICS
      ctx.clearRect(0, 0, 800, 520);

      // A. Real underground earth background
      if (assets.bg && assets.bg.complete) {
        // Draw background from y: 64 to 520
        ctx.drawImage(assets.bg, 0, 64, 800, 456);
      } else {
        // Fallback rich earth gradient
        const groundGrad = ctx.createLinearGradient(0, 64, 0, 520);
        groundGrad.addColorStop(0, '#c79853');
        groundGrad.addColorStop(0.4, '#a37136');
        groundGrad.addColorStop(1, '#633e14');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 64, 800, 456);
      }

      // B. Items underground
      s.items.forEach(item => drawItem(ctx, item, assets));

      // C. Caught item
      if (s.caughtItem) {
        drawItem(ctx, s.caughtItem, assets);
      }

      // D. Steel Cable
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.originX, s.originY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      // Cable highlight
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.originX, s.originY);
      ctx.lineTo(hookX, hookY);
      ctx.stroke();

      // E. Authentic Iron Hook
      ctx.save();
      ctx.translate(hookX, hookY);
      ctx.rotate(s.angle);

      if (assets.hook && assets.hook.complete) {
        // Draw real iron claw hook
        ctx.drawImage(assets.hook, -18, -6, 36, 30);
      } else {
        // Procedural hook
        ctx.fillStyle = '#475569';
        ctx.fillRect(-4, -6, 8, 8);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.quadraticCurveTo(-14, 12, -4, 18);
        ctx.moveTo(3, 0);
        ctx.quadraticCurveTo(14, 12, 4, 18);
        ctx.stroke();
      }
      ctx.restore();

      // F. Explosions
      s.explosions.forEach(exp => {
        if (assets.explosion && assets.explosion.complete) {
          const frameIdx = Math.floor(exp.frame);
          ctx.drawImage(
            assets.explosion,
            frameIdx * 128, 0, 128, 128,
            exp.x - 45, exp.y - 45, 90, 90
          );
        } else {
          // Fallback explosion circle
          ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.beginPath();
          ctx.arc(exp.x, exp.y, 35, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // G. AUTHENTIC GOLD MINER TOP ARCADE BAR (Match 100% screenshot)
      // Solid golden-yellow banner across top
      ctx.fillStyle = '#fab81b';
      ctx.fillRect(0, 0, 800, 64);

      // Bottom shadow/border of yellow bar
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 61, 800, 3);

      // Wooden rail separating ground
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(0, 64, 800, 5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 68, 800, 1);

      // Center royal blue semicircle dome arch
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(s.originX, 64, 52, Math.PI, 0, false);
      ctx.fill();
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Winch reel bracket
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.originX - 16, 54, 32, 10);

      // Animated Real Prospector / Miner inside blue arch
      if (assets.playerMining && assets.playerMining.complete) {
        let frameIdx = 0;
        if (s.minerAction === 'MINING') {
          frameIdx = s.animFrame;
        }
        ctx.drawImage(
          assets.playerMining,
          frameIdx * 80, 0, 80, 120,
          s.originX - 28, 64 - 72, 56, 84
        );
      } else {
        // Fallback miner
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(s.originX, 36, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // LEFT SIDE HUD: Tiền & Mục tiêu (Classic Font & Colors)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // 1. Tiền $...
      ctx.font = 'bold 18px "Arial Black", Gadget, sans-serif';
      ctx.fillStyle = '#5c3a00';
      ctx.fillText('Tiền', 18, 12);

      ctx.font = 'bold 22px "Arial Black", Gadget, sans-serif';
      ctx.fillStyle = '#15803d'; // Rich green digital color
      ctx.fillText(`$${cash}`, 70, 10);

      // 2. Mục tiêu $...
      ctx.font = 'bold 15px "Arial Black", Gadget, sans-serif';
      ctx.fillStyle = '#5c3a00';
      ctx.fillText('Mục tiêu', 18, 36);

      ctx.font = 'bold 17px "Arial Black", Gadget, sans-serif';
      ctx.fillStyle = '#b45309'; // Dark golden orange
      ctx.fillText(`$${targetGoal}`, 92, 35);

      // RIGHT SIDE HUD: Thoát, TG: 60, Cấp: 1
      // 1. Thoát button
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(620, 12, 60, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Thoát', 650, 32);

      // 2. TG & Cấp
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 15px "Arial Black", Gadget, sans-serif';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(`TG:  ${timeLeft}`, 695, 12);
      ctx.fillText(`Cấp: ${level}`, 695, 36);

      // 3. Heart Bonus indicator
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`+${levelsCompleted} ❤️`, 695, 52);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, hasPowerDrink, hasLuckyClover, onItemCollected, onSpecialFound, cash, targetGoal, timeLeft, level, levelsCompleted]);

  // Handle click on canvas (detects Thoát button or fire hook)
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 520 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked "Thoát" button (x: 620-680, y: 12-52)
    if (clickX >= 620 && clickX <= 680 && clickY >= 12 && clickY <= 52) {
      onExitGame?.();
      return;
    }

    // Otherwise fire hook
    fireHook();
  };

  // Helper to draw items
  function drawItem(ctx, item, assets) {
    ctx.save();
    ctx.translate(item.x, item.y);

    if (item.type.startsWith('gold_')) {
      if (assets.gold && assets.gold.complete) {
        const size = item.r * 2.2;
        ctx.drawImage(assets.gold, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, item.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.type.startsWith('rock_')) {
      if (assets.rock && assets.rock.complete) {
        const size = item.r * 2.1;
        ctx.drawImage(assets.rock, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.arc(0, 0, item.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.type === 'diamond') {
      if (assets.diamond && assets.diamond.complete) {
        const size = item.r * 2.2;
        ctx.drawImage(assets.diamond, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, item.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.type === 'bag') {
      if (assets.bag && assets.bag.complete) {
        const size = item.r * 2.0;
        ctx.drawImage(assets.bag, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, item.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.type.startsWith('heart_')) {
      // 3D Faceted Crystal Heart
      const r = item.r;
      const isGold = item.type === 'heart_golden';
      const isGiant = item.type === 'heart_giant_ruby';

      // Drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      // Outer Heart Path
      ctx.beginPath();
      const topY = -r * 0.4;
      ctx.moveTo(0, topY);
      ctx.bezierCurveTo(r * 0.9, -r * 1.15, r * 1.35, r * 0.3, 0, r * 1.05);
      ctx.bezierCurveTo(-r * 1.35, r * 0.3, -r * 0.9, -r * 1.15, 0, topY);

      // 3D Jewel Gradient Fill
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      if (isGold) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.3, '#facc15');
        grad.addColorStop(0.7, '#ca8a04');
        grad.addColorStop(1, '#854d0e');
      } else if (isGiant) {
        grad.addColorStop(0, '#fda4af');
        grad.addColorStop(0.3, '#f43f5e');
        grad.addColorStop(0.7, '#be123c');
        grad.addColorStop(1, '#4c0519');
      } else {
        grad.addColorStop(0, '#ff758f');
        grad.addColorStop(0.4, '#e11d48');
        grad.addColorStop(1, '#881337');
      }

      ctx.fillStyle = grad;
      ctx.fill();

      // Faceted 3D Bevel Rim
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = isGold ? '#fef9c3' : '#ffe4e6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Specular Star Sparkle
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.28, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', userSelect: 'none' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={520}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '800 / 520',
          display: 'block',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          background: '#fab81b'
        }}
      />

      {/* Floating Controls for Mobile / Quick Action */}
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
            border: '2px solid rgba(255,255,255,0.8)',
            borderRadius: '24px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: dynamiteCount > 0 ? 'pointer' : 'not-allowed',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>🧨 Nổ Bom ({dynamiteCount})</span>
        </button>

        {/* Shoot Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fireHook();
          }}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            border: '2px solid rgba(255,255,255,0.8)',
            borderRadius: '24px',
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}
        >
          ⬇️ Thả Móc (Space)
        </button>
      </div>
    </div>
  );
}
