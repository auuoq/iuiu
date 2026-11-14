/* ==========================================================================
   LoveCapsule Bridge for Authentic Classic Gold Miner
   ========================================================================== */
(function () {
  'use strict';

  // Ensure sidebar width is zero so game takes full container
  document.documentElement.style.setProperty('--sidebar-w', '0px');

  function notifyParent(data) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    } catch (err) {
      console.warn('[LoveCapsule Bridge] postMessage failed:', err);
    }
  }

  function setupHook() {
    if (!window.Game || !window.Game.prototype) {
      setTimeout(setupHook, 50);
      return;
    }

    if (window.Game.prototype.__lovecapsuleHooked) return;
    window.Game.prototype.__lovecapsuleHooked = true;

    // 1. Hook Game.prototype.endLevel (win / loss tracking)
    var originalEndLevel = window.Game.prototype.endLevel;
    window.Game.prototype.endLevel = function () {
      var thua = this.currentLevelGoal > window.Game.currentMoney;
      var diem = window.Game.currentMoney;
      var cap  = window.Game.currentLevelNum;

      if (thua) {
        notifyParent({
          type: 'LOVECAPSULE_MINER_GAME_OVER',
          level: cap,
          score: diem,
          goal: this.currentLevelGoal
        });
      } else {
        notifyParent({
          type: 'LOVECAPSULE_MINER_LEVEL_PASSED',
          level: cap,
          score: diem,
          goal: this.currentLevelGoal
        });
      }

      return originalEndLevel.apply(this, arguments);
    };

    // 2. Ensure Game.prototype.create clears any fade overlay so screen is NEVER black
    var originalGameCreate = window.Game.prototype.create;
    window.Game.prototype.create = function () {
      if (window.FadeInOut && window.FadeInOut.instance && window.FadeInOut.instance.spr_bg) {
        window.FadeInOut.instance.spr_bg.alpha = 0;
      }
      return originalGameCreate.apply(this, arguments);
    };

    // 3. Make start button in MainMenu cursor pointer & responsive
    if (window.MainMenu && window.MainMenu.prototype) {
      var origMenuCreate = window.MainMenu.prototype.create;
      window.MainMenu.prototype.create = function () {
        origMenuCreate.apply(this, arguments);

        var self = this;
        // Find buttons and ensure hand cursor and responsive input
        if (self.game && self.game.world && self.game.world.children) {
          self.game.world.children.forEach(function (child) {
            if (child instanceof Phaser.Button || (child.events && child.events.onInputDown)) {
              if (child.input) child.input.useHandCursor = true;
            }
          });
        }
      };
    }

    // 4. State change observer
    var checkGame = setInterval(function () {
      var gameInstance = (window.Phaser && Phaser.GAMES && Phaser.GAMES[0]) || null;
      if (gameInstance && gameInstance.state && gameInstance.state.onStateChange) {
        clearInterval(checkGame);
        gameInstance.state.onStateChange.add(function (newState) {
          // If entering Game state, ensure any black fade overlay is completely transparent
          if (newState === 'Game') {
            if (window.FadeInOut && window.FadeInOut.instance && window.FadeInOut.instance.spr_bg) {
              window.FadeInOut.instance.spr_bg.alpha = 0;
            }
          }

          notifyParent({
            type: 'LOVECAPSULE_MINER_STATE_CHANGE',
            state: newState,
            level: (window.Game && window.Game.currentLevelNum) || 1,
            score: (window.Game && window.Game.currentMoney) || 0
          });
        });
      }
    }, 100);

    // Initial ready ping
    notifyParent({ type: 'LOVECAPSULE_MINER_READY' });
  }

  // Handle commands from LoveCapsule parent modal
  window.addEventListener('message', function (ev) {
    if (!ev || !ev.data) return;
    if (ev.data.type === 'LOVECAPSULE_PAUSE') {
      if (typeof window.dvcdTamDungPhu === 'function') window.dvcdTamDungPhu(true);
    } else if (ev.data.type === 'LOVECAPSULE_RESUME') {
      if (typeof window.dvcdTamDungPhu === 'function') window.dvcdTamDungPhu(false);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHook);
  } else {
    setupHook();
  }
})();
