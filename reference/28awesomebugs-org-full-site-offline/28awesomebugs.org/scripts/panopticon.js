






(function () {
  'use strict';

  
  var PHASE1_HP = 200;
  var PHASE2_HP = 250;
  var TOTAL_HP  = PHASE1_HP + PHASE2_HP;

  var THROW_BASE_DMG = 8;
  var THROW_MAX_DMG  = 30;
  var EYE_THROW_MAX_DMG = 40;

  var EYE_HP = 100;
  var EYE_COUNT_P1 = 6;
  var EYE_COUNT_P2 = 6;
  var HEAL_PER_EYE = 35;
  var HEAL_TIMER_MAX = 15000; 

  var HEAD_SIZE = 160;
  var ORBIT_RADIUS = 180;

  var MORTAR_COUNT_P1 = 16;
  var MORTAR_COUNT_P2 = 25;
  var BEAM_COUNT_P1 = 2;
  var BEAM_COUNT_P2 = 3;

  var BREAKOUT_TIME = 39000; 

  var HARD_DMG_RATE = 2; 

  var ATTACK_COOLDOWN_P1 = 3000;
  var ATTACK_COOLDOWN_P2 = 2000;

  
  var SFX = {
    ricochet:      ['src/Ricochet.wav'],
    virtueAttack:  ['src/VirtueAttack.wav'],
    bhLaunch:      ['src/BlackHoleLaunch.wav'],
    bhLoop:        ['src/BlackHoleLoop.ogg'],
    hammerimpact:  ['src/HammerImpact.ogg'],
    breakoutChop:  ['src/PM_BB_DESIGNED_CINEMATIC_CHOPS_25.wav'],
    hammerexplode1:['src/HammerExplosion1.ogg'],
    hammerexplode2:['src/HammerExplosion2.ogg'],
    hammerexplode3:['src/HammerExplosion3.ogg'],
    gabrielBreak:  ['src/GabrielWeaponBreak.wav'],
    headBreak:     ['src/HeadBreak.wav'],
    headBreak2:    ['src/HeadBreak2.wav'],
    animeSlash:    ['src/AnimeSlash.wav'],
    throatDrone:   ['src/ThroatDroneHeavy.wav'],
    deepdrone:     ['src/deepdrone1.wav'],
    thisprison:    ['src/Sp_thisprison.wav']
  };

  
  
  var VOL_PANDEMONIUM        = 0.3;   
  var VOL_PANDEMONIUM_QUIET  = 0.2;   
  var VOL_WAR                = 0.35;  

  
  var VOL_RICOCHET           = 0.3;   
  var VOL_VIRTUE_ATTACK      = 0.3;   
  var VOL_VIRTUE_HEAL        = 0.15;  
  var VOL_BH_LAUNCH          = 0.4;   
  var VOL_BH_LOOP_MAX        = 0.4;   
  var VOL_HAMMER_IMPACT      = 0.3;   
  var VOL_HAMMER_EXPLODE     = 0.15; 
  var VOL_MORTAR_EXPLODE     = 0.04;  
  var VOL_GABRIEL_BREAK      = 0.4;   
  var VOL_ANIME_SLASH        = 0.15;  
  var VOL_HEAL_DRONE         = 0.3;   
  var VOL_PRISON_VOICE       = 0.5;   
  var VOL_ARM_PUNCH_1        = 0.4;   
  var VOL_ARM_PUNCH_2        = 0.5;   
  var VOL_PANOP_SHATTER      = 0.6;   
  var VOL_BLACKOUT_DRONE     = 0.2;   

  
  var BREAKOUT_MUSIC_SLOW    = 0.3;   
  var BREAKOUT_MUSIC_FAST    = 2.0;   
  var BREAKOUT_MUSIC_SLOW_MS = 1000;  
  var BREAKOUT_MUSIC_RAMP_MS = 4000;  
  var BREAKOUT_MUSIC_PITCH   = false; 

  
  var active = false;
  var hp = 0;
  var phase = 1;
  var container = null;
  var bossEl = null;
  var headEl = null;
  var stalkEl = null;
  var hudEl = null;
  var hpFillEl = null;
  var healTimerFillEl = null;
  var vfxLayer = null;
  var overlayEl = null;
  var eyes = [];       
  var attackTimer = null;
  var healTimer = 0;
  var healInterval = null;
  var hardDmgInterval = null;
  var breakoutTimer = null;
  var throwCheckRAF = null;
  var fightStartTime = 0;
  var eyeLaserInterval = null;
  var bloodRainInterval = null;
  var hitstunActive = false;
  var attackInProgress = false;
  var healDroneAudio = null;
  var orbitRAF = null;
  var fightMusic = null;  
  var warMusic = null;    
  var blackoutDroneAudio = null;
  var breakoutAudioContext = null;
  var breakoutMusicBuffer = null;
  var breakoutMusicReverseBuffer = null;
  var breakoutMusicNode = null;
  var breakoutMusicGain = null;
  var breakoutMusicLoadPromise = null;
  var bloodCanvas = null;
  var bloodCtx = null;
  var bloodSplats = [];
  var bloodStains = [];
  var bloodSplatRAF = null;
  var heavyBloodPhase = false;
  var HEAVY_BLOOD_SCALE = 0.8;

  
  var bossX = 0, bossY = 0;
  var currentSpriteW = 750;  

  
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function stainAlpha(age) {
    if (age >= 21000) return 0;
    if (age < 7000) return 1 - 0.5 * (age / 7000);
    if (age < 14000) return 0.5 - 0.3 * ((age - 7000) / 7000);
    return 0.2 - 0.2 * ((age - 14000) / 7000);
  }

  function enterHeavyBloodPhase() {
    heavyBloodPhase = true;
  }

  function startBloodSplatLoop() {
    if (bloodSplatRAF || !bloodCtx || !bloodCanvas) return;

    function drawCircle(x, y, radius, alpha) {
      if (radius <= 0) return;
      bloodCtx.globalAlpha = alpha;
      bloodCtx.beginPath();
      bloodCtx.arc(x, y, radius, 0, Math.PI * 2);
      bloodCtx.fill();
    }

    function stampTrailStain(particle, splat, now) {
      var ageRatio = Math.min(1, particle.age / splat.maxTrailAge);
      var trailChance = splat.trailChanceStart + (splat.trailChanceEnd - splat.trailChanceStart) * ageRatio;
      if (Math.random() >= trailChance) return;
      addBloodStain(
        particle.x,
        particle.y,
        Math.max(splat.lockRadius, particle.r * (splat.trailRadiusStart + (splat.trailRadiusEnd - splat.trailRadiusStart) * ageRatio)),
        now
      );
    }

    function step() {
      if (!bloodCtx || !bloodCanvas) {
        bloodSplatRAF = null;
        return;
      }

      if (!bloodSplats.length && !bloodStains.length) {
        bloodSplatRAF = null;
        return;
      }

      bloodSplatRAF = requestAnimationFrame(step);

      var now = performance.now();
      bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
      bloodCtx.fillStyle = '#8b0000';

      for (var i = bloodStains.length - 1; i >= 0; i--) {
        var stain = bloodStains[i];
        var alpha = stainAlpha(now - stain.bornAt);
        if (alpha <= 0) {
          bloodStains.splice(i, 1);
          continue;
        }
        drawCircle(stain.x, stain.y, stain.r, alpha);
      }

      for (var s = bloodSplats.length - 1; s >= 0; s--) {
        var splat = bloodSplats[s];
        for (var p = splat.particles.length - 1; p >= 0; p--) {
          var particle = splat.particles[p];
          drawCircle(particle.x, particle.y, particle.r, 0.95);
          particle.age += 16.6667;
          stampTrailStain(particle, splat, now);

          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= splat.drag;
          particle.vy = particle.vy * splat.drag + splat.gravity;
          particle.r -= splat.decay;

          var speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          var outOfBounds = particle.x < -24 || particle.x > bloodCanvas.width + 24 || particle.y < -24 || particle.y > bloodCanvas.height + 24;

          if (particle._rainLandY != null && particle.y >= particle._rainLandY) {
            var landX = clamp(particle.x, 0, bloodCanvas.width);
            var landY = clamp(particle._rainLandY, 0, bloodCanvas.height);
            var landR = Math.max(splat.lockRadius, particle.r * 1.15);
            addBloodStain(landX, landY, landR, now);
            if (particle._rainFloor && Math.random() < 0.36) {
              addBloodStain(
                landX + (Math.random() - 0.5) * 18,
                landY + (Math.random() - 0.5) * 18,
                landR * 0.75,
                now
              );
            }
            splat.particles.splice(p, 1);
            continue;
          }

          if (particle.r < splat.lockRadius || speed < splat.settleSpeed || outOfBounds || Math.random() < splat.consistency) {
            addBloodStain(
              clamp(particle.x, 0, bloodCanvas.width),
              clamp(particle.y, 0, bloodCanvas.height),
              particle.r > 0 ? particle.r : splat.lockRadius,
              now
            );
            splat.particles.splice(p, 1);
          }
        }
        if (!splat.particles.length) bloodSplats.splice(s, 1);
      }
    }

    bloodSplatRAF = requestAnimationFrame(step);
  }

  function addBloodStain(x, y, radius, bornAt) {
    if (!bloodCanvas) return;
    bloodStains.push({
      x: clamp(x, 0, bloodCanvas.width),
      y: clamp(y, 0, bloodCanvas.height),
      r: radius,
      bornAt: bornAt || performance.now()
    });
    startBloodSplatLoop();
  }

  function addBloodRainParticle(x, targetY, size, landsOnFloor) {
    if (!bloodCanvas || !bloodCtx) return;
    bloodSplats.push({
      particles: [{
        x: x,
        y: -8 - Math.random() * 24,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 5 + Math.random() * 4,
        r: 1.8 + size * 0.35,
        age: 0,
        _rainLandY: targetY,
        _rainFloor: landsOnFloor
      }],
      gravity: 0.62,
      drag: 0.9985,
      consistency: 0.0008,
      decay: 0.012,
      lockRadius: 1.4,
      settleSpeed: 1.2,
      maxTrailAge: 480,
      trailChanceStart: 0.9,
      trailChanceEnd: 0.3,
      trailRadiusStart: 0.6,
      trailRadiusEnd: 0.22
    });
    startBloodSplatLoop();
  }

  function initBloodCanvas(targetContainer) {
    var cont = targetContainer || container;
    if (!cont || bloodCanvas) return;
    container = cont;
    bloodCanvas = document.createElement('canvas');
    bloodCanvas.width = container.clientWidth;
    bloodCanvas.height = container.clientHeight;
    bloodCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.95;';
    bloodCtx = bloodCanvas.getContext('2d');
    if (!bloodCtx) {
      bloodCanvas.remove();
      bloodCanvas = null;
      return;
    }
    container.insertBefore(bloodCanvas, container.firstChild);
    bloodSplats = [];
    bloodStains = [];
    startBloodSplatLoop();
  }

  function destroyBloodCanvas() {
    if (bloodSplatRAF) {
      cancelAnimationFrame(bloodSplatRAF);
      bloodSplatRAF = null;
    }
    if (bloodCanvas && bloodCanvas.parentNode) bloodCanvas.remove();
    bloodCanvas = null;
    bloodCtx = null;
    heavyBloodPhase = false;
    bloodSplats = [];
    bloodStains = [];
  }

  function getBloodBurstOptions(violentOrOpts) {
    if (violentOrOpts && typeof violentOrOpts === 'object') {
      return {
        violent: !!violentOrOpts.violent,
        profile: violentOrOpts.profile || (violentOrOpts.violent ? 'violent' : 'normal'),
        legacyParticles: violentOrOpts.legacyParticles !== false,
        directionAngle: typeof violentOrOpts.directionAngle === 'number' ? violentOrOpts.directionAngle : null,
        coneAngleDeg: typeof violentOrOpts.coneAngleDeg === 'number' ? violentOrOpts.coneAngleDeg : null
      };
    }
    return {
      violent: !!violentOrOpts,
      profile: violentOrOpts ? 'violent' : 'normal',
      legacyParticles: true,
      directionAngle: null,
      coneAngleDeg: null
    };
  }

  function createBloodProfile(opts) {
    if (opts.profile === 'cataclysm') {
      return {
        particleCount: 22,
        gravity: 0.8 + Math.random() * 0.24,
        drag: 0.9975,
        decay: 0.06 + Math.random() * 0.02,
        consistency: 0.0015 + Math.random() * 0.0015,
        minRadius: 2,
        maxRadius: 10 + Math.random() * 5,
        originSpread: 22,
        speedMin: 50,
        speedMax: 92,
        upwardBiasMin: 0,
        upwardBiasMax: 10,
        lockRadius: 1,
        settleSpeed: 2.2,
        horizontalStretch: 1.18,
        maxTrailAge: 340,
        trailChanceStart: 0.95,
        trailChanceEnd: 0.12,
        trailRadiusStart: 0.6,
        trailRadiusEnd: 0.16
      };
    }
    if (opts.profile === 'eruption') {
      return {
        particleCount: 24,
        gravity: 0.64 + Math.random() * 0.2,
        drag: 0.997,
        decay: 0.075 + Math.random() * 0.03,
        consistency: 0.002 + Math.random() * 0.002,
        minRadius: 2,
        maxRadius: 12 + Math.random() * 6,
        originSpread: 18,
        speedMin: 34,
        speedMax: 64,
        upwardBiasMin: 0,
        upwardBiasMax: 8,
        lockRadius: 1.1,
        settleSpeed: 2,
        horizontalStretch: 1.15,
        maxTrailAge: 300,
        trailChanceStart: 0.8,
        trailChanceEnd: 0.1,
        trailRadiusStart: 0.52,
        trailRadiusEnd: 0.15
      };
    }
    if (opts.violent) {
      return {
        particleCount: 22,
        gravity: 0.48 + Math.random() * 0.16,
        drag: 0.996,
        decay: 0.08 + Math.random() * 0.03,
        consistency: 0.003 + Math.random() * 0.002,
        minRadius: 1.5,
        maxRadius: 10 + Math.random() * 5,
        originSpread: 16,
        speedMin: 26,
        speedMax: 46,
        upwardBiasMin: 0,
        upwardBiasMax: 5,
        lockRadius: 1.1,
        settleSpeed: 1.8,
        horizontalStretch: 1.08,
        maxTrailAge: 260,
        trailChanceStart: 0.58,
        trailChanceEnd: 0.08,
        trailRadiusStart: 0.45,
        trailRadiusEnd: 0.12
      };
    }
    return {
      particleCount: 16,
      gravity: 0.36 + Math.random() * 0.12,
      drag: 0.995,
      decay: 0.11 + Math.random() * 0.04,
      consistency: 0.006 + Math.random() * 0.003,
      minRadius: 1,
      maxRadius: 6 + Math.random() * 3,
      originSpread: 12,
      speedMin: 14,
      speedMax: 28,
      upwardBiasMin: 0,
      upwardBiasMax: 2,
      lockRadius: 1.2,
      settleSpeed: 1.6,
      horizontalStretch: 1,
      maxTrailAge: 220,
      trailChanceStart: 0.34,
      trailChanceEnd: 0.05,
      trailRadiusStart: 0.4,
      trailRadiusEnd: 0.1
    };
  }

  function addBloodSplat(x, y, violent) {
    if (!bloodCanvas || !bloodCtx) return;
    var opts = getBloodBurstOptions(violent);
    var profile = createBloodProfile(opts);
    var particleCount = profile.particleCount;
    if (heavyBloodPhase) particleCount = Math.max(1, Math.round(particleCount * HEAVY_BLOOD_SCALE));
    var particles = [];

    for (var i = 0; i < particleCount; i++) {
      var angle;
      if (opts.directionAngle !== null && opts.coneAngleDeg !== null) {
        var halfCone = (opts.coneAngleDeg * Math.PI / 180) * 0.5;
        angle = opts.directionAngle + (Math.random() * 2 - 1) * halfCone;
      } else {
        angle = Math.random() * Math.PI * 2;
      }
      var speed = profile.speedMin + Math.random() * (profile.speedMax - profile.speedMin);
      var upwardBias = profile.upwardBiasMin + Math.random() * (profile.upwardBiasMax - profile.upwardBiasMin);
      var ox = x + (Math.random() - 0.5) * profile.originSpread;
      var oy = y + (Math.random() - 0.5) * profile.originSpread * 0.8;
      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed * profile.horizontalStretch,
        vy: Math.sin(angle) * speed - upwardBias,
        r: profile.minRadius + Math.random() * (profile.maxRadius - profile.minRadius),
        age: 0
      });
    }

    bloodSplats.push({
      particles: particles,
      gravity: profile.gravity,
      drag: profile.drag,
      consistency: profile.consistency,
      decay: profile.decay,
      lockRadius: profile.lockRadius,
      settleSpeed: profile.settleSpeed,
      maxTrailAge: profile.maxTrailAge,
      trailChanceStart: profile.trailChanceStart,
      trailChanceEnd: profile.trailChanceEnd,
      trailRadiusStart: profile.trailRadiusStart,
      trailRadiusEnd: profile.trailRadiusEnd
    });
    startBloodSplatLoop();
  }

  function stopBreakoutMusicNode() {
    if (breakoutMusicNode) {
      try { breakoutMusicNode.stop(); } catch (e) {}
      breakoutMusicNode.disconnect();
      breakoutMusicNode = null;
    }
    if (breakoutMusicGain) {
      breakoutMusicGain.disconnect();
      breakoutMusicGain = null;
    }
  }

  function createReversedBuffer(ctx, buffer) {
    var reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
      var src = buffer.getChannelData(channel);
      var dest = reversed.getChannelData(channel);
      for (var i = 0, len = src.length; i < len; i++) dest[i] = src[len - 1 - i];
    }
    return reversed;
  }

  function ensureBreakoutReverseMusic() {
    if (breakoutMusicBuffer && breakoutMusicReverseBuffer && breakoutAudioContext) {
      return Promise.resolve(true);
    }
    if (breakoutMusicLoadPromise) return breakoutMusicLoadPromise;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || !window.fetch) return Promise.resolve(false);

    breakoutAudioContext = breakoutAudioContext || new AudioCtx();
    breakoutMusicLoadPromise = fetch('src/Pandemonium.mp3')
      .then(function (response) { return response.arrayBuffer(); })
      .then(function (arrayBuffer) { return breakoutAudioContext.decodeAudioData(arrayBuffer.slice(0)); })
      .then(function (buffer) {
        breakoutMusicBuffer = buffer;
        breakoutMusicReverseBuffer = createReversedBuffer(breakoutAudioContext, buffer);
        return true;
      })
      .catch(function () { return false; });

    return breakoutMusicLoadPromise;
  }

  function startReverseBreakoutMusic(forwardOffset, durationMs) {
    if (!breakoutAudioContext || !breakoutMusicReverseBuffer) return false;
    stopBreakoutMusicNode();
    breakoutAudioContext.resume().catch(function () {});

    breakoutMusicNode = breakoutAudioContext.createBufferSource();
    breakoutMusicNode._bugMusic = true;
    breakoutMusicGain = breakoutAudioContext.createGain();
    breakoutMusicNode.buffer = breakoutMusicReverseBuffer;
    breakoutMusicNode.loop = true;
    breakoutMusicNode.playbackRate.setValueAtTime(BREAKOUT_MUSIC_SLOW, breakoutAudioContext.currentTime);
    breakoutMusicNode.playbackRate.linearRampToValueAtTime(BREAKOUT_MUSIC_FAST, breakoutAudioContext.currentTime + durationMs / 1000);
    breakoutMusicGain.gain.setValueAtTime(0, breakoutAudioContext.currentTime);
    breakoutMusicGain.gain.linearRampToValueAtTime(VOL_PANDEMONIUM, breakoutAudioContext.currentTime + 0.12);
    breakoutMusicNode.connect(breakoutMusicGain);
    breakoutMusicGain.connect(breakoutAudioContext.destination);

    var reverseOffset = breakoutMusicReverseBuffer.duration - clamp(forwardOffset, 0, breakoutMusicReverseBuffer.duration - 0.05);
    breakoutMusicNode.start(0, clamp(reverseOffset, 0, breakoutMusicReverseBuffer.duration - 0.05));
    return true;
  }

  function startBreakoutMusicRamp() {
    if (!fightMusic) return;

    fightMusic.playbackRate = 1.0;
    fightMusic.preservesPitch = BREAKOUT_MUSIC_PITCH;
    fightMusic.volume = VOL_PANDEMONIUM;
    fightMusic.play().catch(function () {});

    var rampStart = performance.now();
    function slowDown() {
      if (!fightMusic) return;
      var t = Math.min((performance.now() - rampStart) / BREAKOUT_MUSIC_SLOW_MS, 1);
      fightMusic.playbackRate = 1.0 + (BREAKOUT_MUSIC_SLOW - 1.0) * t;
      if (t < 1) {
        requestAnimationFrame(slowDown);
        return;
      }

      var forwardOffset = fightMusic.currentTime;
      ensureBreakoutReverseMusic().then(function (ready) {
        if (!fightMusic) return;
        if (!ready || !startReverseBreakoutMusic(forwardOffset, BREAKOUT_MUSIC_RAMP_MS)) {
          var reverseRampStart = performance.now();
          function forwardFallbackRamp() {
            if (!fightMusic) return;
            var tf = Math.min((performance.now() - reverseRampStart) / BREAKOUT_MUSIC_RAMP_MS, 1);
            fightMusic.playbackRate = BREAKOUT_MUSIC_SLOW + (BREAKOUT_MUSIC_FAST - BREAKOUT_MUSIC_SLOW) * tf;
            if (tf < 1) requestAnimationFrame(forwardFallbackRamp);
          }
          requestAnimationFrame(forwardFallbackRamp);
          return;
        }

        var fadeStart = performance.now();
        var originalVolume = fightMusic.volume;
        function fadeOutForward() {
          if (!fightMusic) return;
          var tfade = Math.min((performance.now() - fadeStart) / 140, 1);
          fightMusic.volume = originalVolume * (1 - tfade);
          if (tfade < 1) {
            requestAnimationFrame(fadeOutForward);
            return;
          }
          fightMusic.pause();
          fightMusic.volume = VOL_PANDEMONIUM;
        }
        requestAnimationFrame(fadeOutForward);
      });
    }

    requestAnimationFrame(slowDown);
  }

  function playSound(files, vol) {
    if (!files || !files.length) return null;
    var a = new Audio(pick(files));
    a.volume = vol !== undefined ? vol : 0.5;
    a.play().catch(function () {});
    return a;
  }

  
  function playSoundPitched(files, vol, pitch) {
    if (!files || !files.length) return null;
    var a = new Audio(pick(files));
    a.volume = vol !== undefined ? vol : 0.5;
    a.preservesPitch = false;
    
    a.playbackRate = (pitch || 1) + (Math.random() - 0.5) * 0.2;
    a.play().catch(function () {});
    return a;
  }

  function getBugs() {
    var bd = window.BugSim && window.BugSim.getBugData();
    return bd && bd.length > 0 ? bd : null;
  }

  function killBugAt(index, cause) {
    if (window.BugSim) window.BugSim.killBug(index, cause || 'Flesh Panopticon');
  }

  
  function buildBoss() {
    bossEl = document.createElement('div');
    bossEl.className = 'panop-boss';

    
    headEl = document.createElement('div');
    headEl.className = 'panop-head';
    var headImg = document.createElement('img');
    headImg.src = 'src/panop.png';
    headImg.draggable = false;
    headEl.appendChild(headImg);

    
    var armsWrap = document.createElement('div');
    armsWrap.className = 'panop-arms-wrap';
    armsWrap.innerHTML =
      '<div class="panop-arm panop-arm-left"><div class="panop-fist"></div></div>' +
      '<div class="panop-arm panop-arm-right"><div class="panop-fist"></div></div>';
    headEl.appendChild(armsWrap);

    bossEl.appendChild(headEl);

    return bossEl;
  }

  var hpGhostEl = null;
  var hpGhostTimeout = null;
  var prevHpPct = 100;

  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.className = 'panop-hud';
    hudEl.innerHTML =
      '<div class="panop-boss-name">FLESH PANOPTICON</div>' +
      '<div class="panop-hp-bar">' +
        '<div class="panop-hp-ghost"></div>' +
        '<div class="panop-hp-fill"></div>' +
      '</div>' +
      '<div class="panop-heal-bar"><div class="panop-heal-fill"></div></div>';
    return hudEl;
  }

  function updateHP() {
    if (!hpFillEl) return;
    var pct = Math.max(0, hp / TOTAL_HP * 100);
    hpFillEl.style.width = pct + '%';

    
    if (!hpGhostEl) hpGhostEl = hudEl.querySelector('.panop-hp-ghost');
    if (hpGhostEl) {
      if (pct < prevHpPct) {
        
        clearTimeout(hpGhostTimeout);
        hpGhostEl.style.transition = 'none';
        hpGhostEl.style.width = prevHpPct + '%';
        hpGhostTimeout = setTimeout(function () {
          hpGhostEl.style.transition = 'width 0.6s ease-out';
          hpGhostEl.style.width = pct + '%';
        }, 400);
      } else {
        
        clearTimeout(hpGhostTimeout);
        hpGhostEl.style.transition = 'width 0.3s ease-out';
        hpGhostEl.style.width = pct + '%';
      }
    }
    prevHpPct = pct;
  }

  function updateHealTimer() {
    if (!healTimerFillEl) return;
    var pct = Math.max(0, healTimer / HEAL_TIMER_MAX * 100);
    healTimerFillEl.style.width = pct + '%';
  }

  
  var orbitSpeed = 0.15; 
  function spawnEyes(count) {
    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'panop-eye';
      vfxLayer.appendChild(el);
      var baseAngle = (Math.PI * 2 / count) * i - Math.PI / 2;
      var orbitR = Math.min(fieldW, fieldH) * 0.35 + Math.random() * Math.min(fieldW, fieldH) * 0.08;
      var ex = bossX + Math.cos(baseAngle) * orbitR;
      var ey = bossY + Math.sin(baseAngle) * orbitR;
      ex = clamp(ex, 40, fieldW - 40);
      ey = clamp(ey, 40, fieldH - 40);
      el.style.left = ex + 'px';
      el.style.top = ey + 'px';
      var eye = { el: el, hp: EYE_HP, cx: ex, cy: ey, alive: true, baseAngle: baseAngle, orbitR: orbitR };
      eyes.push(eye);
    }
  }

  function startOrbitLoop() {
    if (orbitRAF) cancelAnimationFrame(orbitRAF);
    var lastTime = performance.now();
    function step(now) {
      if (!active) { orbitRAF = null; return; }
      var dt = (now - lastTime) / 1000;
      lastTime = now;
      var fieldW = container.clientWidth;
      var fieldH = container.clientHeight;
      for (var i = 0; i < eyes.length; i++) {
        var e = eyes[i];
        if (!e.alive) continue;
        e.baseAngle += orbitSpeed * dt;
        var ex = bossX + Math.cos(e.baseAngle) * e.orbitR;
        var ey = bossY + Math.sin(e.baseAngle) * e.orbitR;
        ex = clamp(ex, 40, fieldW - 40);
        ey = clamp(ey, 40, fieldH - 40);
        e.cx = ex;
        e.cy = ey;
        e.el.style.left = ex + 'px';
        e.el.style.top = ey + 'px';
      }
      orbitRAF = requestAnimationFrame(step);
    }
    orbitRAF = requestAnimationFrame(step);
  }

  function aliveEyeCount() {
    var c = 0;
    for (var i = 0; i < eyes.length; i++) {
      if (eyes[i].alive) c++;
    }
    return c;
  }

  function damageEye(eye, dmg) {
    eye.hp -= dmg;
    eye.el.style.filter = 'brightness(3)';
    setTimeout(function () {
      if (eye.el) eye.el.style.filter = '';
    }, 100);
    if (eye.hp <= 0) {
      eye.alive = false;
      playSound(SFX.headBreak, VOL_GABRIEL_BREAK);
      
      spawnBloodBurst(eye.cx, eye.cy);
      eye.el.style.transition = 'transform 0.3s, opacity 0.3s';
      eye.el.style.transform = 'scale(0.1)';
      eye.el.style.opacity = '0';
      setTimeout(function () { if (eye.el.parentNode) eye.el.remove(); }, 300);
    }
  }

  function spawnBloodBurst(x, y, violent, layerOverride) {
    var opts = getBloodBurstOptions(violent);
    addBloodSplat(x, y, opts);
    if (!opts.legacyParticles) return;
    var count = opts.violent ? (12 + Math.floor(Math.random() * 8)) : (12 + Math.floor(Math.random() * 8));
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'panop-blood-particle';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      var angle = Math.random() * Math.PI * 2;
      var dist = 30 + Math.random() * 80;
      if (opts.profile === 'eruption') dist = 130 + Math.random() * 290;
      else if (opts.profile === 'cataclysm') dist = 220 + Math.random() * 520;
      else if (opts.violent) dist = 90 + Math.random() * 320;
      var tx = Math.cos(angle) * dist;
      var ty = Math.sin(angle) * dist - (opts.violent ? (25 + Math.random() * 60) : 0);
      var size = opts.profile === 'cataclysm'
        ? (5 + Math.random() * 10)
        : (opts.violent ? (7 + Math.random() * 16) : (4 + Math.random() * 8));
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.setProperty('--tx', tx + 'px');
      p.style.setProperty('--ty', ty + 'px');
      if (opts.profile === 'cataclysm') p.style.animationDuration = '1.1s';
      else if (opts.violent) p.style.animationDuration = '0.9s';
      var layer = layerOverride || vfxLayer;
      if (layer) layer.appendChild(p);
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.remove(); }, opts.violent ? 1150 : 600);
      })(p);
    }
  }

  
  function spawnBloodShockwave(x, y, layer, scale, delay) {
    if (!layer) return;
    setTimeout(function () {
      var ring = document.createElement('div');
      ring.className = 'panop-blood-shockwave';
      ring.style.left = x + 'px';
      ring.style.top = y + 'px';
      ring.style.setProperty('--sw-scale', scale);
      layer.appendChild(ring);
      setTimeout(function () { if (ring.parentNode) ring.remove(); }, 1000);
    }, delay);
  }

  
  function startHardDmg() {
    hardDmgInterval = setInterval(function () {
      if (!active) return;
      if (aliveEyeCount() === 0) return;
      var bugs = getBugs();
      if (!bugs) return;
      
      for (var i = 0; i < bugs.length; i++) {
        var b = bugs[i];
        if (!b._panopHardDmg) b._panopHardDmg = 0;
        b._panopHardDmg += HARD_DMG_RATE;
      }
    }, 1000);
  }

  
  var THROW_WINDOW = 3000;
  var RICOCHET_WINDOW = 1500; 
  var RICOCHET_EYE_ASSIST = 0.2; 
  var RICOCHET_BOSS_ASSIST = 0.15; 
  var _frameBugs = null; 

  function startThrowDetection() {
    function check() {
      if (!active || hitstunActive) { throwCheckRAF = requestAnimationFrame(check); return; }
      throwCheckRAF = requestAnimationFrame(check);

      _frameBugs = getBugs();
      if (!_frameBugs) return;
      var bugs = _frameBugs;
      var dragging = window.BugSim && window.BugSim.getDraggingBug ? window.BugSim.getDraggingBug() : null;
      var now = performance.now();

      for (var i = 0; i < bugs.length; i++) {
        var b = bugs[i];
        if (dragging && dragging._uid === b._uid) continue;
        
        var isThrown = b._thrownAt && (now - b._thrownAt <= THROW_WINDOW);
        var isRicocheting = b._ricochetUntil && now <= b._ricochetUntil;
        if (!isThrown && !isRicocheting) {
          
          if (b._pingPongCount) b._pingPongCount = 0;
          continue;
        }
        var speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (speed < 5) continue;
        var bx = b.x + b.radius, by = b.y + b.radius;

        
        if (!b._pingPongCount) b._pingPongCount = 0;

        
        var hitSomething = false;
        for (var j = 0; j < eyes.length; j++) {
          var e = eyes[j];
          if (!e.alive) continue;
          
          if (b._lastHitEyeIdx === j && isRicocheting && !isThrown) continue;
          var edx = bx - e.cx, edy = by - e.cy;
          var eDistSq = edx * edx + edy * edy;
          var eyeHitR = currentSpriteW * 0.067;
          var hitRadius = isRicocheting ? (eyeHitR * (1 + RICOCHET_EYE_ASSIST) + b.radius) : (eyeHitR + b.radius);
          if (eDistSq < hitRadius * hitRadius) {
            b._pingPongCount++;
            doJackhammerEye(b, speed, e, j);
            hitSomething = true;
            break;
          }
        }
        if (hitSomething) continue;

        
        if (b._lastHitBoss && isRicocheting && !isThrown) continue;
        var hx = bossX, hy = bossY;
        var hdx = bx - hx, hdy = by - hy;
        var hDistSq = hdx * hdx + hdy * hdy;
        var baseHitR = currentSpriteW * 0.1;
        var bossHitRadius = isRicocheting ? (baseHitR * (1 + RICOCHET_BOSS_ASSIST) + b.radius) : (baseHitR + b.radius);
        if (hDistSq < bossHitRadius * bossHitRadius) {
          b._pingPongCount++;
          doJackhammer(b, speed);
          break;
        }
      }
    }
    throwCheckRAF = requestAnimationFrame(check);
  }

  function stopThrowDetection() {
    if (throwCheckRAF) { cancelAnimationFrame(throwCheckRAF); throwCheckRAF = null; }
  }

  function resumeFromHitstun() {
    hitstunActive = false;
    if (headEl) headEl.classList.remove('panop-hitstun');
    if (window.BugSim) {
      window.BugSim._setAnimationRunning(true);
      window.BugSim._requestUpdate();
    }
  }

  
  
  var meteorBugs = []; 

  function applyMeteorEffect(bug, pingCount) {
    var intensity = clamp(pingCount, 1, 8);
    
    var heat = Math.min(intensity / 8, 1);
    var hue = Math.round(40 - heat * 40); 
    var brightness = 1 + heat * 1.5;
    var saturate = 1 + heat * 2;
    if (bug._bugEl) {
      bug._bugEl.style.filter = 'brightness(' + brightness + ') saturate(' + saturate + ') hue-rotate(-' + (30 - hue) + 'deg)';
      bug._bugEl.style.boxShadow = '0 0 ' + (8 + intensity * 6) + 'px rgba(255,' + Math.round(150 - heat * 100) + ',0,' + (0.3 + heat * 0.5) + ')';
    }
    
    if (!bug._bugEl) {
      var bugEls = document.querySelectorAll('.bug');
      var contRect = container.getBoundingClientRect();
      var bx = bug.x + bug.radius, by = bug.y + bug.radius;
      for (var i = 0; i < bugEls.length; i++) {
        var rect = bugEls[i].getBoundingClientRect();
        var ex = rect.left - contRect.left + rect.width / 2;
        var ey = rect.top - contRect.top + rect.height / 2;
        if (Math.abs(ex - bx) < 20 && Math.abs(ey - by) < 20) {
          bug._bugEl = bugEls[i];
          bug._bugEl.style.filter = 'brightness(' + brightness + ') saturate(' + saturate + ') hue-rotate(-' + (30 - hue) + 'deg)';
          bug._bugEl.style.boxShadow = '0 0 ' + (8 + intensity * 6) + 'px rgba(255,' + Math.round(150 - heat * 100) + ',0,' + (0.3 + heat * 0.5) + ')';
          break;
        }
      }
    }
    
    if (!bug._meteorTrailActive) {
      bug._meteorTrailActive = true;
      meteorBugs.push(bug);
    }
    bug._meteorIntensity = intensity;
  }

  function clearMeteorEffect(bug) {
    if (bug._bugEl) {
      bug._bugEl.style.filter = '';
      bug._bugEl.style.boxShadow = '';
    }
    bug._meteorTrailActive = false;
    bug._meteorIntensity = 0;
    delete bug._bugEl;
  }

  
  var meteorTrailRAF = null;
  function startMeteorTrailLoop() {
    function trailStep() {
      if (!active) { meteorTrailRAF = null; return; }
      meteorTrailRAF = requestAnimationFrame(trailStep);
      var now = performance.now();
      for (var i = meteorBugs.length - 1; i >= 0; i--) {
        var b = meteorBugs[i];
        
        var isActive = (b._thrownAt && (now - b._thrownAt <= THROW_WINDOW)) ||
                       (b._ricochetUntil && now <= b._ricochetUntil);
        if (!isActive) {
          clearMeteorEffect(b);
          meteorBugs.splice(i, 1);
          continue;
        }
        var speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (speed < 3) continue;
        var bx = b.x + b.radius, by = b.y + b.radius;
        var intensity = b._meteorIntensity || 1;
        
        if (b._prevTrailX !== undefined) {
          spawnMeteorLine(b._prevTrailX, b._prevTrailY, bx, by, intensity);
        }
        b._prevTrailX = bx;
        b._prevTrailY = by;
      }
    }
    meteorTrailRAF = requestAnimationFrame(trailStep);
  }

  function stopMeteorTrailLoop() {
    if (meteorTrailRAF) { cancelAnimationFrame(meteorTrailRAF); meteorTrailRAF = null; }
    for (var i = 0; i < meteorBugs.length; i++) {
      clearMeteorEffect(meteorBugs[i]);
      delete meteorBugs[i]._prevTrailX;
      delete meteorBugs[i]._prevTrailY;
    }
    meteorBugs = [];
  }

  function spawnMeteorLine(x1, y1, x2, y2, intensity) {
    if (!vfxLayer) return;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    var angle = Math.atan2(dy, dx);
    var el = document.createElement('div');
    el.className = 'panop-meteor-line';
    el.style.left = x1 + 'px';
    el.style.top = y1 + 'px';
    el.style.width = len + 'px';
    
    var thick = 3 + clamp(intensity, 0, 6) * 0.8;
    el.style.height = thick + 'px';
    el.style.transform = 'rotate(' + angle + 'rad)';
    
    var heat = clamp(intensity / 8, 0, 1);
    var r = 255;
    var g = Math.round(220 - heat * 160);
    var b2 = Math.round(60 - heat * 60);
    el.style.background = 'rgba(' + r + ',' + g + ',' + b2 + ',0.85)';
    el.style.boxShadow = '0 0 ' + (4 + intensity) + 'px rgba(' + r + ',' + g + ',0,0.5)';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 800 + Math.random() * 400);
  }

  
  function doScreenShake(intensity, duration) {
    if (!container) return;
    var start = performance.now();
    function shakeStep() {
      var t = (performance.now() - start) / duration;
      if (t >= 1) { container.style.transform = ''; return; }
      var mag = intensity * (1 - t);
      var ox = (Math.random() - 0.5) * 2 * mag;
      var oy = (Math.random() - 0.5) * 2 * mag;
      container.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
      requestAnimationFrame(shakeStep);
    }
    requestAnimationFrame(shakeStep);
  }

  function doJackhammer(bug, speed) {
    hitstunActive = true;

    var normSpeed = clamp((speed - 8) / 27, 0, 1);
    var dmg = Math.round(THROW_BASE_DMG + normSpeed * (THROW_MAX_DMG - THROW_BASE_DMG));
    var tier = normSpeed < 0.33 ? 1 : normSpeed < 0.66 ? 2 : 3;

    
    var savedDX = bug.dx, savedDY = bug.dy;
    bug.dx = 0;
    bug.dy = 0;

    
    if (window.BugSim && window.BugSim._getAnimationRunning && window.BugSim._getAnimationRunning()) {
      window.BugSim._setAnimationRunning(false);
    }

    
    if (headEl) headEl.classList.add('panop-hitstun');

    
    var pingCount = bug._pingPongCount || 1;
    var basePitch = 0.85 + Math.min(pingCount, 8) * 0.12;
    playSoundPitched(SFX.hammerimpact, VOL_HAMMER_IMPACT, basePitch);

    
    applyMeteorEffect(bug, pingCount);

    var freezeTime = 60 + Math.round(normSpeed * 180);

    var bx = bug.x + bug.radius, by = bug.y + bug.radius;

    setTimeout(function () {
      if (!active) { resumeFromHitstun(); return; }

      if (headEl) headEl.classList.remove('panop-hitstun');

      
      spawnBloodBurst(bx, by);
      playSound(SFX['hammerexplode' + tier], VOL_HAMMER_EXPLODE);
      doScreenShake(3 + tier * 2, 150 + tier * 50);

      
      var repelDX = bx - bossX, repelDY = by - bossY;
      var repelDist = Math.sqrt(repelDX * repelDX + repelDY * repelDY) || 1;
      var bounceForce = 25 + tier * 10;
      bug.dx = (repelDX / repelDist) * bounceForce;
      bug.dy = (repelDY / repelDist) * bounceForce;
      delete bug._thrownAt;
      bug._ricochetUntil = performance.now() + RICOCHET_WINDOW;
      bug._lastHitBoss = true;
      delete bug._lastHitEyeIdx;

      dealDamage(dmg);

      setTimeout(function () {
        resumeFromHitstun();
      }, 80);
    }, freezeTime);
  }

  function doJackhammerEye(bug, speed, eye, eyeIdx) {
    hitstunActive = true;

    var normSpeed = clamp((speed - 8) / 27, 0, 1);
    var dmg = Math.round(THROW_BASE_DMG + normSpeed * (EYE_THROW_MAX_DMG - THROW_BASE_DMG));
    var tier = normSpeed < 0.33 ? 1 : normSpeed < 0.66 ? 2 : 3;

    
    bug.dx = 0;
    bug.dy = 0;

    
    if (window.BugSim && window.BugSim._getAnimationRunning && window.BugSim._getAnimationRunning()) {
      window.BugSim._setAnimationRunning(false);
    }

    
    var pingCount = bug._pingPongCount || 1;
    var basePitch = 0.85 + Math.min(pingCount, 8) * 0.12;
    playSoundPitched(SFX.hammerimpact, VOL_HAMMER_IMPACT, basePitch);

    
    applyMeteorEffect(bug, pingCount);

    
    if (eye.el) {
      eye.el.style.filter = 'brightness(3)';
    }

    var freezeTime = 60 + Math.round(normSpeed * 180);
    var bx = bug.x + bug.radius, by = bug.y + bug.radius;

    setTimeout(function () {
      if (!active) { resumeFromHitstun(); return; }

      if (eye.el) eye.el.style.filter = '';

      
      spawnBloodBurst(bx, by);
      playSound(SFX['hammerexplode' + tier], VOL_HAMMER_EXPLODE);
      doScreenShake(2 + tier, 100 + tier * 30);

      
      var repelDX = bx - eye.cx, repelDY = by - eye.cy;
      var repelDist = Math.sqrt(repelDX * repelDX + repelDY * repelDY) || 1;
      var bounceForce = 28 + tier * 10;
      bug.dx = (repelDX / repelDist) * bounceForce;
      bug.dy = (repelDY / repelDist) * bounceForce;
      delete bug._thrownAt;
      bug._ricochetUntil = performance.now() + RICOCHET_WINDOW;
      bug._lastHitEyeIdx = eyeIdx;
      delete bug._lastHitBoss;

      damageEye(eye, dmg);

      setTimeout(function () {
        resumeFromHitstun();
      }, 80);
    }, freezeTime);
  }

  function dealDamage(amount) {
    hp -= amount;
    if (hp < 0) hp = 0;
    updateHP();

    
    spawnDmgNumber(bossX, bossY - 80, amount);

    
    if (aliveEyeCount() > 0) {
      var mult = aliveEyeCount() >= 5 ? 1.5 : aliveEyeCount() >= 1 ? 0.2 : 0.133;
      healTimer -= amount * mult * 100;
      if (healTimer < 0) healTimer = 0;
      updateHealTimer();
    }

    if (hp <= 0) {
      doBreakout();
      return;
    }

    
    if (phase === 1 && hp <= PHASE2_HP) {
      enterPhase2();
    }
  }

  function enterPhase2() {
    phase = 2;
    
    var flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;z-index:300;pointer-events:none;background:rgba(139,0,0,0.5);animation:phase-flash 0.8s ease-out forwards;';
    container.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.remove(); }, 800);

    
    

    
    clearEyes();
    spawnEyes(EYE_COUNT_P2);
    for (var pi = 0; pi < eyes.length; pi++) {
      spawnEyeWithPortal(eyes[pi], pi * 200);
    }
    var p2EyeDelay = eyes.length * 200 + 600;
    setTimeout(function () {
      if (!active) return;
      startEyeLasers();
      startOrbitLoop();
    }, p2EyeDelay);

    
    healTimer = HEAL_TIMER_MAX;
    updateHealTimer();
  }

  function clearEyes() {
    
    if (eyeLaserInterval) { clearInterval(eyeLaserInterval); eyeLaserInterval = null; }
    
    if (vfxLayer) {
      var lasers = vfxLayer.querySelectorAll('.panop-eye-laser');
      for (var j = 0; j < lasers.length; j++) lasers[j].remove();
    }
    for (var i = 0; i < eyes.length; i++) {
      if (eyes[i].el.parentNode) eyes[i].el.remove();
    }
    eyes = [];
  }

  
  function spawnExplosion(x, y, size) {
    var el = document.createElement('div');
    el.className = 'panop-explosion';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 500);
  }

  function spawnDmgNumber(x, y, amount) {
    var el = document.createElement('div');
    el.className = 'panop-dmg-num';
    el.textContent = '-' + amount;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 800);
  }

  

  
  function doMortarBarrage() {
    if (!active) return;
    attackInProgress = true;

    
    spawnTelegraph('#ffd54f');

    var count = phase === 2 ? MORTAR_COUNT_P2 : MORTAR_COUNT_P1;
    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;

    function fireOrb(idx) {
      if (!active || idx >= count) {
        if (active) scheduleAttack();
        return;
      }
      
      var mortar = document.createElement('div');
      mortar.className = 'panop-mortar';
      
      var startX = bossX + (Math.random() - 0.5) * HEAD_SIZE * 0.6;
      var startY = bossY - HEAD_SIZE / 2;
      mortar.style.left = startX + 'px';
      mortar.style.top = startY + 'px';

      
      var targetX = Math.random() * (fieldW - 40) + 20;
      var targetY = fieldH - 5;
      vfxLayer.appendChild(mortar);

      
      animateMortar(mortar, startX, startY, targetX, targetY, function (mx, my, mortarEl) {
        
        if (mortarEl.parentNode) mortarEl.remove();
        spawnExplosion(mx, my, 140);
        doScreenShake(6, 200);
        playSound(SFX.hammerexplode1, VOL_MORTAR_EXPLODE);
        
        var bugs = getBugs();
        if (!bugs) return;
        for (var i = bugs.length - 1; i >= 0; i--) {
          var b = bugs[i];
          var bx = b.x + b.radius, by = b.y + b.radius;
          var dx = bx - mx, dy = by - my;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            b.dx += (dx / 80) * 20;
            b.dy += (dy / 80) * 20;
            
            if (!b._panopHardDmg) b._panopHardDmg = 0;
            b._panopHardDmg += 8;
            flashBugImpact(b);
          }
        }
      });

      
      var delay = 200 + idx * 20;
      setTimeout(function () { fireOrb(idx + 1); }, delay);
    }
    fireOrb(0);
  }

  function animateMortar(el, sx, sy, tx, ty, onLand) {
    var dur = 2400 + Math.random() * 600; 
    var fieldH = container.clientHeight;
    var arcH = fieldH * 0.5 + Math.random() * 50; 
    var prevX = sx, prevY = sy;

    
    el._mortarData = {
      sx: sx, sy: sy, tx: tx, ty: ty,
      start: performance.now(), dur: dur, arcH: arcH,
      parried: false, exploded: false
    };

    function step() {
      if (!active || el._mortarData.exploded) { if (el.parentNode) el.remove(); return; }
      var d = el._mortarData;
      var t = (performance.now() - d.start) / d.dur;
      if (t >= 1) {
        if (d.parried) {
          
          if (el.parentNode) el.remove();
          dealDamage(25);
          spawnExplosion(bossX, bossY, 140);
          doScreenShake(8, 250);
          playSound(SFX.ricochet, VOL_RICOCHET);
          if (headEl) {
            headEl.style.filter = 'brightness(3)';
            setTimeout(function () { if (headEl) headEl.style.filter = ''; }, 150);
          }
        } else {
          onLand(d.tx, d.ty, el);
        }
        return;
      }
      var cx, cy;
      if (d.parried) {
        
        cx = d.sx + (d.tx - d.sx) * t;
        cy = d.sy + (d.ty - d.sy) * t;
      } else {
        
        cx = d.sx + (d.tx - d.sx) * t;
        cy = d.sy + (d.ty - d.sy) * t - d.arcH * Math.sin(Math.PI * t);
      }
      el.style.left = cx + 'px';
      el.style.top = cy + 'px';

      
      spawnMortarTrail(prevX, prevY, cx, cy);
      prevX = cx;
      prevY = cy;

      
      checkMortarCollision(el, cx, cy);

      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function spawnMortarTrail(x1, y1, x2, y2) {
    if (!vfxLayer) return;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    var angle = Math.atan2(dy, dx);
    var el = document.createElement('div');
    el.className = 'panop-mortar-trail';
    el.style.left = x1 + 'px';
    el.style.top = y1 + 'px';
    el.style.width = len + 'px';
    el.style.transform = 'rotate(' + angle + 'rad)';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 1200);
  }

  function checkMortarCollision(mortarEl, mx, my) {
    var d = mortarEl._mortarData;
    if (d.parried || d.exploded) return;
    var bugs = _frameBugs || getBugs();
    if (!bugs) return;
    var now = performance.now();
    for (var i = 0; i < bugs.length; i++) {
      var b = bugs[i];
      var bx = b.x + b.radius, by = b.y + b.radius;
      var dx = bx - mx, dy = by - my;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 35) {
        
        var isParrying = (b._thrownAt && now - b._thrownAt <= THROW_WINDOW) ||
                         (b._ricochetUntil && now < b._ricochetUntil);
        var speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (isParrying && speed >= 5) {
          
          d.parried = true;
          d.sx = mx;
          d.sy = my;
          d.tx = bossX;
          d.ty = bossY;
          d.start = performance.now();
          d.dur = 120; 
          d.arcH = 0; 
          mortarEl.classList.add('parried');
          playSound(SFX.ricochet, VOL_RICOCHET);
          
          var pushDX = bx - mx, pushDY = by - my;
          var pushLen = Math.sqrt(pushDX * pushDX + pushDY * pushDY) || 1;
          b.dx = (pushDX / pushLen) * 25;
          b.dy = (pushDY / pushLen) * 25;
        } else {
          
          d.exploded = true;
          if (mortarEl.parentNode) mortarEl.remove();
          spawnExplosion(mx, my, 100);
          doScreenShake(4, 150);
          playSound(SFX.hammerexplode1, VOL_MORTAR_EXPLODE);
          
          var pushDist = dist || 1;
          b.dx += (dx / pushDist) * 15;
          b.dy += (dy / pushDist) * 15;
        }
        break;
      }
    }
  }

  
  function doDivineBeam() {
    if (!active) return;
    attackInProgress = true;

    spawnTelegraph('#ffffff');
    doScreenShake(4, 300);

    var beamCount = phase === 2 ? BEAM_COUNT_P2 : BEAM_COUNT_P1;
    var beamsFired = 0;

    function fireBeam() {
      if (!active || beamsFired >= beamCount) {
        if (active) scheduleAttack();
        return;
      }
      var isHorizontal = Math.random() < 0.35; 

      
      var bugs = getBugs();
      var tx = container.clientWidth / 2, ty = container.clientHeight / 2;
      if (bugs) {
        var best = null, bestCount = 0;
        for (var i = 0; i < bugs.length; i++) {
          var count = 0;
          for (var j = 0; j < bugs.length; j++) {
            var dx = bugs[i].x - bugs[j].x, dy = bugs[i].y - bugs[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < 100) count++;
          }
          if (count > bestCount) { bestCount = count; best = bugs[i]; }
        }
        if (best) { tx = best.x + best.radius; ty = best.y + best.radius; }
      }

      playSound(SFX.virtueAttack, VOL_VIRTUE_ATTACK);

      
      var warn = document.createElement('div');
      warn.className = 'panop-beam-warn';
      warn.style.left = tx + 'px';
      warn.style.top = ty + 'px';
      vfxLayer.appendChild(warn);

      
      setTimeout(function () {
        if (!active) { if (warn.parentNode) warn.remove(); return; }
        if (warn.parentNode) warn.remove();

        var beam = document.createElement('div');
        if (isHorizontal) {
          beam.className = 'panop-beam panop-beam-horizontal';
          beam.style.left = '0';
          beam.style.top = ty + 'px';
        } else {
          beam.className = 'panop-beam';
          beam.style.left = tx + 'px';
          beam.style.top = '0';
        }
        vfxLayer.appendChild(beam);
        doScreenShake(6, 200);

        var lingerTime = 800 + beamsFired * 600;

        
        var dmgInterval = setInterval(function () {
          if (!active) { clearInterval(dmgInterval); return; }
          var bugs = getBugs();
          if (!bugs) return;
          for (var i = bugs.length - 1; i >= 0; i--) {
            var b = bugs[i];
            var bx = b.x + b.radius, by = b.y + b.radius;
            var inBeam = isHorizontal ? Math.abs(by - ty) < 50 : Math.abs(bx - tx) < 50;
            if (inBeam) {
              
              b.dy += (Math.random() - 0.5) * 18;
              b.dx += (Math.random() - 0.5) * 18;
              if (!b._panopHardDmg) b._panopHardDmg = 0;
              b._panopHardDmg += 5;
              flashBugImpact(b);
            }
          }
        }, 150);

        setTimeout(function () {
          clearInterval(dmgInterval);
          if (beam.parentNode) beam.remove();
          beamsFired++;
          setTimeout(fireBeam, 300);
        }, lingerTime);
      }, 400); 
    }
    setTimeout(fireBeam, 300);
  }

  
  function doBlackHole() {
    if (!active) return;
    attackInProgress = true;

    spawnTelegraph('#9c27b0');

    setTimeout(function () {
      if (!active) return;
      playSound(SFX.bhLaunch, VOL_BH_LAUNCH);

      var bhEl = document.createElement('div');
      bhEl.className = 'panop-blackhole';
      vfxLayer.appendChild(bhEl);

      
      var loopAudio = new Audio('src/BlackHoleLoop.ogg');
      loopAudio.loop = true;
      loopAudio.volume = 0;
      loopAudio.play().catch(function () {});

      
      var bugs = getBugs();
      var targetX = container.clientWidth / 2, targetY = container.clientHeight / 2;
      if (bugs && bugs.length > 0) {
        var best = pick(bugs);
        targetX = best.x + best.radius;
        targetY = best.y + best.radius;
      }

      var bhX = bossX, bhY = bossY + 40;
      var speed = phase === 2 ? 1.8 : 1.2;
      var alive = true;

      function stepBH() {
        if (!active || !alive) {
          loopAudio.pause();
          if (bhEl.parentNode) bhEl.remove();
          return;
        }
        
        var dx = targetX - bhX, dy = targetY - bhY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 30) {
          
          alive = false;
          loopAudio.pause();
          bhEl.classList.add('implode');
          spawnExplosion(bhX, bhY, 200);

          
          var bugs = getBugs();
          if (bugs) {
            for (var i = 0; i < bugs.length; i++) {
              var b = bugs[i];
              var bx = b.x + b.radius, by = b.y + b.radius;
              var bdx = bx - bhX, bdy = by - bhY;
              if (Math.sqrt(bdx * bdx + bdy * bdy) < 120) {
                
                b.dx += (bhX - bx) * 0.3;
                b.dy += (bhY - by) * 0.3;
                
                if (!b._panopHardDmg) b._panopHardDmg = 0;
                b._panopHardDmg += 15;
                flashBugImpact(b);
              }
            }
          }

          setTimeout(function () {
            if (bhEl.parentNode) bhEl.remove();
            if (active) scheduleAttack();
          }, 600);
          return;
        }

        bhX += (dx / dist) * speed;
        bhY += (dy / dist) * speed;
        bhEl.style.left = bhX + 'px';
        bhEl.style.top = bhY + 'px';

        
        var screenCenter = container.clientWidth / 2;
        var distFromCenter = Math.abs(bhX - screenCenter) / (container.clientWidth / 2);
        loopAudio.volume = Math.max(0, (1 - distFromCenter) * VOL_BH_LOOP_MAX);

        
        var bugs2 = getBugs();
        if (bugs2) {
          for (var i = 0; i < bugs2.length; i++) {
            var b = bugs2[i];
            var bx = b.x + b.radius, by = b.y + b.radius;
            var pdx = bhX - bx, pdy = bhY - by;
            var pd = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd < 150 && pd > 5) {
              b.dx += (pdx / pd) * 0.3;
              b.dy += (pdy / pd) * 0.3;
              
              if (pd < 40) {
                if (!b._panopHardDmg) b._panopHardDmg = 0;
                b._panopHardDmg += 5;
                flashBugImpact(b);
              }
            }
          }
        }

        requestAnimationFrame(stepBH);
      }
      requestAnimationFrame(stepBH);
    }, 700);
  }

  
  function spawnTelegraph(color) {
    var flash = document.createElement('div');
    flash.className = 'panop-telegraph';
    flash.style.left = bossX + 'px';
    flash.style.top = bossY + 'px';
    flash.style.borderColor = color;
    flash.style.boxShadow = '0 0 40px 20px ' + color;
    vfxLayer.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.remove(); }, 600);
  }

  
  function scheduleAttack() {
    if (!active) return;
    attackInProgress = false;
    var cooldown = phase === 2 ? ATTACK_COOLDOWN_P2 : ATTACK_COOLDOWN_P1;
    cooldown += Math.random() * 1000;

    attackTimer = setTimeout(function () {
      if (!active) return;
      pickAttack();
    }, cooldown);
  }

  function pickAttack() {
    var r = Math.random();
    if (r < 0.4) {
      doMortarBarrage();
    } else if (r < 0.7) {
      doDivineBeam();
    } else {
      doBlackHole();
    }
  }

  
  function startHealTimer() {
    healTimer = HEAL_TIMER_MAX;
    updateHealTimer();

    healInterval = setInterval(function () {
      if (!active) return;
      healTimer -= 100;
      if (healTimer < 0) healTimer = 0;
      updateHealTimer();

      if (healTimer <= 0) {
        
        if (attackInProgress) {
          healTimer = 500; 
          return;
        }
        
        var alive = aliveEyeCount();
        if (alive > 0) {
          doHealSequence();
        } else {
          
          clearEyes();
          var count = phase === 2 ? EYE_COUNT_P2 : EYE_COUNT_P1;
          spawnEyes(count);
          healTimer = HEAL_TIMER_MAX;
          updateHealTimer();
          startEyeLasers();
          startOrbitLoop();
        }
      }
    }, 100);
  }

  function doHealSequence() {
    
    healTimer = HEAL_TIMER_MAX;

    
    if (eyeLaserInterval) { clearInterval(eyeLaserInterval); eyeLaserInterval = null; }

    
    healDroneAudio = new Audio('src/ThroatDroneHeavy.wav');
    healDroneAudio.loop = true;
    healDroneAudio.volume = VOL_HEAL_DRONE;
    healDroneAudio.play().catch(function () {});

    
    var alive = [];
    for (var i = 0; i < eyes.length; i++) {
      if (eyes[i].alive) alive.push(eyes[i]);
    }

    function spawnHealArcs() {
      
      var aliveNow = [];
      for (var ai = 0; ai < eyes.length; ai++) {
        if (eyes[ai].alive) aliveNow.push(eyes[ai]);
      }
      if (aliveNow.length === 0) return;
      var src = aliveNow[Math.floor(Math.random() * aliveNow.length)];
      for (var j = 0; j < 3; j++) {
        spawnElectricArc(src.cx, src.cy, bossX, bossY);
      }
    }

    
    
    var healShakeInterval = setInterval(function () {
      if (!active) { clearInterval(healShakeInterval); return; }
      doScreenShake(3, 400);
    }, 350);

    var absorbIndex = 0;
    var absorbInterval = setInterval(function () {
      if (!active || absorbIndex >= alive.length) {
        clearInterval(absorbInterval);
        clearInterval(healShakeInterval);
        
        if (healDroneAudio) { healDroneAudio.pause(); healDroneAudio = null; }
        if (!active) return; 
        
        clearEyes();
        var count = phase === 2 ? EYE_COUNT_P2 : EYE_COUNT_P1;
        spawnEyes(count);
        for (var pi = 0; pi < eyes.length; pi++) {
          spawnEyeWithPortal(eyes[pi], pi * 200);
        }
        healTimer = HEAL_TIMER_MAX;
        updateHealTimer();
        var respawnDelay = eyes.length * 200 + 600;
        setTimeout(function () {
          if (!active) return;
          startEyeLasers();
          startOrbitLoop();
        }, respawnDelay);
        return;
      }

      var eye = alive[absorbIndex];

      
      for (var k = 0; k < 3; k++) {
        spawnElectricArc(eye.cx, eye.cy, bossX, bossY);
      }
      playSound(SFX.virtueAttack, VOL_VIRTUE_HEAL);

      setTimeout(function () {
        eye.alive = false;
        spawnBloodBurst(eye.cx, eye.cy);
        if (eye.el.parentNode) eye.el.remove();

        
        hp = Math.min(TOTAL_HP, hp + HEAL_PER_EYE);
        updateHP();
        spawnDmgNumber(bossX, bossY - 80, '+' + HEAL_PER_EYE);
        
        if (headEl) {
          headEl.style.filter = 'brightness(1.5) hue-rotate(90deg)';
          setTimeout(function () { if (headEl) headEl.style.filter = ''; }, 200);
        }
      }, 300);

      absorbIndex++;
    }, 500);
  }

  
  function spawnElectricArc(x1, y1, x2, y2) {
    if (!vfxLayer) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:149;overflow:visible;';
    svg.setAttribute('viewBox', '0 0 ' + container.clientWidth + ' ' + container.clientHeight);

    
    var segments = 12 + Math.floor(Math.random() * 6);
    var path = 'M ' + x1 + ' ' + y1;
    for (var i = 1; i < segments; i++) {
      var t = i / segments;
      var mx = x1 + (x2 - x1) * t;
      var my = y1 + (y2 - y1) * t;
      
      var perpX = -(y2 - y1);
      var perpY = (x2 - x1);
      var perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      var jag = (Math.random() - 0.5) * 60;
      mx += (perpX / perpLen) * jag;
      my += (perpY / perpLen) * jag;
      path += ' L ' + mx + ' ' + my;
    }
    path += ' L ' + x2 + ' ' + y2;

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    pathEl.setAttribute('fill', 'none');
    pathEl.setAttribute('stroke', '#4cff4c');
    pathEl.setAttribute('stroke-width', '3');
    pathEl.setAttribute('filter', 'drop-shadow(0 0 6px #4cff4c)');
    pathEl.style.opacity = '1';
    svg.appendChild(pathEl);

    
    var pathEl2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl2.setAttribute('d', path);
    pathEl2.setAttribute('fill', 'none');
    pathEl2.setAttribute('stroke', '#ffffff');
    pathEl2.setAttribute('stroke-width', '1.5');
    svg.appendChild(pathEl2);

    vfxLayer.appendChild(svg);

    
    var flickerCount = 0;
    var flickerInterval = setInterval(function () {
      flickerCount++;
      if (flickerCount > 6) {
        clearInterval(flickerInterval);
        if (svg.parentNode) svg.remove();
        return;
      }
      
      var newPath = 'M ' + x1 + ' ' + y1;
      for (var j = 1; j < segments; j++) {
        var t2 = j / segments;
        var mx2 = x1 + (x2 - x1) * t2;
        var my2 = y1 + (y2 - y1) * t2;
        var pX2 = -(y2 - y1), pY2 = (x2 - x1);
        var pL2 = Math.sqrt(pX2 * pX2 + pY2 * pY2) || 1;
        var jag2 = (Math.random() - 0.5) * 60;
        mx2 += (pX2 / pL2) * jag2;
        my2 += (pY2 / pL2) * jag2;
        newPath += ' L ' + mx2 + ' ' + my2;
      }
      newPath += ' L ' + x2 + ' ' + y2;
      pathEl.setAttribute('d', newPath);
      pathEl2.setAttribute('d', newPath);
      svg.style.opacity = flickerCount % 2 === 0 ? '1' : '0.6';
    }, 80);
  }

  
  function startEyeLasers() {
    eyeLaserInterval = setInterval(function () {
      if (!active) return;
      var alive = [];
      for (var i = 0; i < eyes.length; i++) {
        if (eyes[i].alive) alive.push(eyes[i]);
      }
      if (alive.length === 0) return;
      var bugs = getBugs();
      if (!bugs || bugs.length === 0) return;

      
      var eye = pick(alive);
      var bug = pick(bugs);
      var tx = bug.x + bug.radius, ty = bug.y + bug.radius;

      
      var dx = tx - eye.cx, dy = ty - eye.cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var angle = Math.atan2(dy, dx) * (180 / Math.PI);

      var laser = document.createElement('div');
      laser.className = 'panop-eye-laser';
      laser.style.left = eye.cx + 'px';
      laser.style.top = eye.cy + 'px';
      laser.style.width = dist + 'px';
      laser.style.transform = 'rotate(' + angle + 'deg)';
      if (vfxLayer) vfxLayer.appendChild(laser);

      playSound(SFX.animeSlash, VOL_ANIME_SLASH);

      
      bug.dx += (dx / dist) * 4;
      bug.dy += (dy / dist) * 4;
      
      if (!bug._panopHardDmg) bug._panopHardDmg = 0;
      bug._panopHardDmg += 4;
      flashBugImpact(bug);

      setTimeout(function () { if (laser.parentNode) laser.remove(); }, 400);
    }, 4000 + Math.random() * 2000);
  }

  
  function doBreakout() {
    if (!active) return;
    active = false;
    clearTimeout(attackTimer);
    clearTimeout(breakoutTimer);
    breakoutTimer = null;
    clearInterval(healInterval);
    clearInterval(hardDmgInterval);
    if (orbitRAF) cancelAnimationFrame(orbitRAF);
    stopThrowDetection();
    stopMeteorTrailLoop();

    enterHeavyBloodPhase();

    
    if (window.BugSim && window.BugSim.clearThrowCap) {
      window.BugSim.clearThrowCap();
    }

    
    clearEyes();

    
    if (healDroneAudio) { healDroneAudio.pause(); healDroneAudio = null; }

    
    if (healTimerFillEl && healTimerFillEl.parentNode) {
      healTimerFillEl.parentNode.style.display = 'none';
    }

    
    if (fightMusic) fightMusic.volume = VOL_PANDEMONIUM_QUIET;

    
    playSound(SFX.thisprison, VOL_PRISON_VOICE);

    var armsWrap = headEl.querySelector('.panop-arms-wrap');
    if (armsWrap) armsWrap.style.display = 'block';

    var leftArm = headEl.querySelector('.panop-arm-left');
    var rightArm = headEl.querySelector('.panop-arm-right');

    var savedBossX = bossX;
    var savedBossY = bossY;
    var savedVfxLayer = vfxLayer;
    var savedContainer = container;

    
    setTimeout(function () {
      if (rightArm) {
        rightArm.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0.3, 1)';
        rightArm.style.transform = 'translateX(24px) translateY(-3px) rotate(-6deg)';
        rightArm.style.opacity = '1';
      }
      if (headEl) headEl.classList.add('panop-shake');
      doScreenShake(5, 400);
      
      var breakoutShake1 = setInterval(function () {
        doScreenShake(4, 350);
      }, 350);
      playSound(SFX.breakoutChop, VOL_ARM_PUNCH_1);

      startBreakoutMusicRamp();

      
      var spurtInterval = setInterval(function () {
        spawnBloodBurst(
          savedBossX + 40 + Math.random() * 20,
          savedBossY - 10 + Math.random() * 20,
          { violent: true, profile: 'eruption', legacyParticles: false, directionAngle: 0, coneAngleDeg: 15 }
        );
      }, 250);

      
      setTimeout(function () {
        if (leftArm) {
          leftArm.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0.3, 1)';
          leftArm.style.transform = 'translateX(24px) translateY(-3px) rotate(6deg)';
          leftArm.style.opacity = '1';
        }
        doScreenShake(6, 500);
        playSound(SFX.breakoutChop, VOL_ARM_PUNCH_2);
        if (headEl) headEl.classList.add('panop-shake-violent');
        
        clearInterval(breakoutShake1);
        var breakoutShake2 = setInterval(function () {
          doScreenShake(5, 300);
        }, 300);

        
        var spurtInterval2 = setInterval(function () {
          spawnBloodBurst(
            savedBossX + 40 + Math.random() * 20,
            savedBossY + 10 + Math.random() * 20,
            { violent: true, profile: 'eruption', legacyParticles: false, directionAngle: 0, coneAngleDeg: 30 }
          );
        }, 188);

        
        setTimeout(function () {
          clearInterval(spurtInterval);
          clearInterval(spurtInterval2);
          clearInterval(breakoutShake2);

          
          stopBreakoutMusicNode();
          if (fightMusic) { fightMusic.pause(); fightMusic = null; }

          
          if (headEl) headEl.style.display = 'none';

          
          spawnDeathBurst(savedBossX, savedBossY, savedVfxLayer);

          
          spawnBloodShockwave(savedBossX, savedBossY, savedVfxLayer, 1.0, 0);
          spawnBloodShockwave(savedBossX, savedBossY, savedVfxLayer, 1.4, 120);
          spawnBloodShockwave(savedBossX, savedBossY, savedVfxLayer, 1.8, 250);

          
          var fieldW = savedContainer ? savedContainer.clientWidth : window.innerWidth;
          var fieldH = savedContainer ? savedContainer.clientHeight : window.innerHeight;
          var localBurstCount = 7;
          var wideBurstCount = 12;

          function clampBurstPoint(px, py) {
            return {
              x: clamp(px, 0, fieldW),
              y: clamp(py, 0, fieldH)
            };
          }

          function staggeredLocalBurst(idx) {
            if (idx >= localBurstCount) return;
            setTimeout(function () {
              spawnBloodBurst(
                savedBossX + (Math.random() - 0.5) * 180,
                savedBossY + (Math.random() - 0.45) * 220,
                { violent: true, profile: 'eruption', legacyParticles: false }
              );
            }, idx * 32);
          }

          function staggeredWideBurst(idx) {
            if (idx >= wideBurstCount) return;
            setTimeout(function () {
              var point = clampBurstPoint(
                savedBossX + (Math.random() - 0.5) * fieldW * 1.25,
                savedBossY + (Math.random() - 0.38) * fieldH * 0.9
              );
              spawnBloodBurst(point.x, point.y, { violent: true, profile: 'cataclysm', legacyParticles: false });
            }, 120 + idx * 26);
          }

          for (var i = 0; i < localBurstCount; i++) staggeredLocalBurst(i);
          for (var j = 0; j < wideBurstCount; j++) staggeredWideBurst(j);

          playSound(SFX.headBreak2, VOL_PANOP_SHATTER);
          doScreenShake(18, 800);

          
          startBloodRain(savedVfxLayer, savedContainer);

          
          spawnSisyphusEmergence(savedBossX, savedBossY, savedVfxLayer, savedContainer);
        }, 2000);
      }, 3000);
    }, 3000);
  }

  
  function spawnDeathBurst(x, y, layer) {
    if (!layer) return;
    var ring = document.createElement('div');
    ring.className = 'panop-death-burst';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    layer.appendChild(ring);
    setTimeout(function () { if (ring.parentNode) ring.remove(); }, 800);
  }

  
  function startBloodRain(layer, cont) {
    if (!cont) return;
    var fieldW = cont.clientWidth;
    var fieldH = cont.clientHeight;
    var startTime = performance.now();
    var RAIN_PEAK_MS = 11000;
    var RAIN_TAPER_MS = 3500;
    var RAIN_END_MS = RAIN_PEAK_MS + RAIN_TAPER_MS;
    var baseInterval = 15;

    function spawnDrop() {
      var elapsed = performance.now() - startTime;
      if (!bloodCanvas || !bloodCanvas.parentNode) {
        clearInterval(bloodRainInterval);
        bloodRainInterval = null;
        return;
      }
      if (elapsed >= RAIN_END_MS) {
        clearInterval(bloodRainInterval);
        bloodRainInterval = null;
        return;
      }

      var rainIntensity = 1;
      if (elapsed >= RAIN_PEAK_MS) {
        rainIntensity = 1 - ((elapsed - RAIN_PEAK_MS) / RAIN_TAPER_MS);
        if (rainIntensity <= 0) {
          clearInterval(bloodRainInterval);
          bloodRainInterval = null;
          return;
        }
      }

      var progress = Math.min(1, elapsed / RAIN_PEAK_MS);
      var dropsThisTick = progress < 0.3 ? 4 : (progress < 0.7 ? 3 : 2);
      if (heavyBloodPhase) dropsThisTick = Math.max(1, Math.round(dropsThisTick * HEAVY_BLOOD_SCALE));
      dropsThisTick = Math.max(0, Math.round(dropsThisTick * rainIntensity));
      if (dropsThisTick <= 0) return;

      fieldW = cont.clientWidth;
      fieldH = cont.clientHeight;

      for (var i = 0; i < dropsThisTick; i++) {
        if (Math.random() < progress * 0.8) continue;
        if (elapsed >= RAIN_PEAK_MS && Math.random() > rainIntensity) continue;

        var dropX = Math.random() * fieldW;
        var landsOnFloor = Math.random() < 0.25;
        var targetY = landsOnFloor
          ? fieldH - (Math.random() * 18)
          : fieldH * (0.16 + Math.random() * 0.66);
        var size = 2 + Math.random() * 5;
        addBloodRainParticle(dropX, targetY, size, landsOnFloor);
      }
    }

    bloodRainInterval = setInterval(spawnDrop, baseInterval);
  }

  function spawnSisyphusEmergence(ox, oy, layer, cont) {
    if (bossEl && bossEl.parentNode) bossEl.remove();
    if (hudEl && hudEl.parentNode) hudEl.remove();

    if (window.BugSim && window.BugSim._setAnimationRunning) {
      window.BugSim._setAnimationRunning(true);
      if (window.BugSim._requestUpdate) window.BugSim._requestUpdate();
    }

    if (window.SisyphusBoss && window.SisyphusBoss.start) {
      warMusic = new Audio('src/War.mp3');
      if (window.BugSFX) window.BugSFX.markAsMusic(warMusic);
      warMusic.loop = true;
      warMusic.volume = VOL_WAR;
      warMusic.play().catch(function () {});
      window._panopWarMusic = warMusic;

      window.SisyphusBoss.start({
        introMode: 'panopticon-burst',
        spawnX: ox,
        spawnY: oy
      });
    }

    setTimeout(function () {
      if (layer && layer.parentNode) layer.remove();
      if (overlayEl && overlayEl.parentNode) overlayEl.remove();
    }, 12000);
  }

  
  function spawnGoldenRelease(x, y, layer) {
    if (!layer) return;
    
    var flash = document.createElement('div');
    flash.className = 'panop-golden-flash';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    flash.style.zIndex = '200';
    layer.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.remove(); }, 1200);

    
    var ring = document.createElement('div');
    ring.className = 'panop-golden-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.zIndex = '200';
    layer.appendChild(ring);
    setTimeout(function () { if (ring.parentNode) ring.remove(); }, 1000);

    
    for (var i = 0; i < 24; i++) {
      var p = document.createElement('div');
      p.className = 'panop-golden-particle';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      var angle = (Math.PI * 2 / 24) * i + (Math.random() - 0.5) * 0.3;
      var dist = 60 + Math.random() * 120;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      layer.appendChild(p);
      (function (el) { setTimeout(function () { if (el.parentNode) el.remove(); }, 900); })(p);
    }
  }

  
  
  function flashBugImpact(bug) {
    var bugEl = bug._bugEl;
    if (!bugEl) {
      
      var bugEls = document.querySelectorAll('.bug');
      if (!container) return;
      var contRect = container.getBoundingClientRect();
      var bx = bug.x + bug.radius, by = bug.y + bug.radius;
      for (var i = 0; i < bugEls.length; i++) {
        var rect = bugEls[i].getBoundingClientRect();
        var ex = rect.left - contRect.left + rect.width / 2;
        var ey = rect.top - contRect.top + rect.height / 2;
        if (Math.abs(ex - bx) < 25 && Math.abs(ey - by) < 25) {
          bugEl = bugEls[i];
          break;
        }
      }
    }
    if (!bugEl) return;
    bugEl.style.filter = 'brightness(2.5) saturate(0) contrast(1.5)';
    setTimeout(function () {
      if (bugEl) bugEl.style.filter = '';
    }, 120);
  }

  
  function spawnEyeWithPortal(eyeObj, delay) {
    if (!active && !eyeObj._forceSpawn) return; 
    eyeObj.el.style.opacity = '0';
    eyeObj.el.style.transform = 'translate(-50%, -50%) scale(0)';
    var portal = document.createElement('div');
    portal.className = 'panop-eye-portal';
    portal.style.left = eyeObj.cx + 'px';
    portal.style.top = eyeObj.cy + 'px';
    if (vfxLayer) vfxLayer.appendChild(portal);
    setTimeout(function () {
      
      eyeObj.el.style.transition = 'opacity 0.2s, transform 0.25s ease-out';
      eyeObj.el.style.opacity = '1';
      eyeObj.el.style.transform = 'translate(-50%, -50%) scale(1)';
      setTimeout(function () {
        eyeObj.el.style.transition = '';
        eyeObj.el.style.transform = 'translate(-50%, -50%)';
      }, 300);
    }, delay + 250); 
    setTimeout(function () {
      if (portal.parentNode) portal.remove();
    }, delay + 550);
  }

  function startPanopticon() {
    if (active) return;
    var bd = getBugs();
    if (!bd) return;

    container = document.querySelector('.bugs-container');
    container.style.overflow = 'hidden';
    if (!container) return;
    active = true;

    hideBossPageChrome();

    hp = TOTAL_HP;
    phase = 1;
    eyes = [];
    fightStartTime = performance.now();

    
    var blackout = document.createElement('div');
    blackout.className = 'panop-blackout';
    blackout.style.opacity = '1';   
    document.body.appendChild(blackout);
    blackoutDroneAudio = playSound(SFX.deepdrone, VOL_BLACKOUT_DRONE);

    
    bossEl = buildBoss();
    initBloodCanvas();
    container.appendChild(bossEl);

    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;
    bossX = fieldW / 2;
    
    
    var spriteW = Math.min(790, fieldW * 0.88);
    currentSpriteW = spriteW;
    var spriteH = spriteW * (650 / 750);
    var bottomOffset = 55;  
    var headCenterFromTop = spriteH * 0.28;
    bossY = fieldH - spriteH + bottomOffset + headCenterFromTop;

    bossEl.style.left = bossX + 'px';
    bossEl.style.bottom = '-' + bottomOffset + 'px';

    hudEl = buildHUD();
    hudEl.style.display = 'none';  
    document.body.insertBefore(hudEl, document.body.firstChild);
    hpFillEl = hudEl.querySelector('.panop-hp-fill');
    healTimerFillEl = hudEl.querySelector('.panop-heal-fill');

    vfxLayer = document.createElement('div');
    vfxLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:149;overflow:hidden;';
    container.appendChild(vfxLayer);

    overlayEl = document.createElement('div');
    overlayEl.className = 'panop-overlay';
    overlayEl.innerHTML = '<div class="result-text"></div>';
    container.appendChild(overlayEl);

    updateHP();

    
    setTimeout(function () {
      if (!active) {
        if (blackoutDroneAudio) { blackoutDroneAudio.pause(); blackoutDroneAudio = null; }
        blackout.remove();
        return;
      }
      if (blackoutDroneAudio) { blackoutDroneAudio.pause(); blackoutDroneAudio = null; }
      blackout.remove();  

      
      setTimeout(function () {
        if (!active) return;
        hudEl.style.display = '';

        spawnEyes(EYE_COUNT_P1);
        for (var i = 0; i < eyes.length; i++) {
          spawnEyeWithPortal(eyes[i], i * 200);
        }

        if (window.BugSim && window.BugSim.setThrowCap) {
          window.BugSim.setThrowCap(70);
        }

        var eyeSpawnDuration = eyes.length * 200 + 600;
        setTimeout(function () {
          if (!active) return;
          startThrowDetection();
          startMeteorTrailLoop();
          startHardDmg();
          startHealTimer();
          startEyeLasers();
          startOrbitLoop();

          fightMusic = new Audio('src/Pandemonium.mp3');
          if (window.BugSFX) window.BugSFX.markAsMusic(fightMusic);
          fightMusic.loop = true;
          fightMusic.volume = VOL_PANDEMONIUM;
          fightMusic.play().catch(function () {});

          attackTimer = setTimeout(function () { pickAttack(); }, 2000);

          breakoutTimer = setTimeout(function () {
            doBreakout();
          }, BREAKOUT_TIME);
        }, eyeSpawnDuration);
      }, 1000); 
    }, 3000); 
  }

  function cleanup() {
    active = false;
    hitstunActive = false;
    clearTimeout(attackTimer);
    clearTimeout(breakoutTimer);
    clearInterval(healInterval);
    clearInterval(hardDmgInterval);
    clearInterval(eyeLaserInterval);
    if (bloodRainInterval) { clearInterval(bloodRainInterval); bloodRainInterval = null; }
    if (healDroneAudio) { healDroneAudio.pause(); healDroneAudio = null; }
    stopBreakoutMusicNode();
    if (fightMusic) { fightMusic.pause(); fightMusic = null; }
    if (warMusic) { warMusic.pause(); warMusic = null; }
    if (blackoutDroneAudio) { blackoutDroneAudio.pause(); blackoutDroneAudio = null; }
    if (orbitRAF) { cancelAnimationFrame(orbitRAF); orbitRAF = null; }
    stopThrowDetection();
    stopMeteorTrailLoop();

    
    if (window.BugSim && window.BugSim.clearThrowCap) {
      window.BugSim.clearThrowCap();
    }

    
    if (window.BugSim) {
      window.BugSim._setAnimationRunning(true);
      window.BugSim._requestUpdate();
    }

    clearEyes();

    if (bossEl && bossEl.parentNode) bossEl.remove();
    if (hudEl && hudEl.parentNode) hudEl.remove();
    if (vfxLayer && vfxLayer.parentNode) vfxLayer.remove();
    if (overlayEl && overlayEl.parentNode) overlayEl.remove();
    destroyBloodCanvas();
    if (container) container.style.overflow = '';

    restoreBossPageChrome();

    bossEl = headEl = stalkEl = hudEl = hpFillEl = hpGhostEl = healTimerFillEl = vfxLayer = overlayEl = container = null;
    prevHpPct = 100;
  }

  
  var pageChromeSnapshot = null;

  function resizeBloodCanvas(targetContainer) {
    var cont = targetContainer || container;
    if (!bloodCanvas || !cont) return;
    var oldW = bloodCanvas.width;
    var oldH = bloodCanvas.height;
    var newW = cont.clientWidth;
    var newH = cont.clientHeight;
    if (oldW > 0 && oldH > 0 && (oldW !== newW || oldH !== newH)) {
      var scaleX = newW / oldW;
      var scaleY = newH / oldH;
      var scaleR = (scaleX + scaleY) * 0.5;
      for (var i = 0; i < bloodStains.length; i++) {
        bloodStains[i].x *= scaleX;
        bloodStains[i].y *= scaleY;
        bloodStains[i].r *= scaleR;
      }
      for (var s = 0; s < bloodSplats.length; s++) {
        var parts = bloodSplats[s].particles;
        for (var p = 0; p < parts.length; p++) {
          parts[p].x *= scaleX;
          parts[p].y *= scaleY;
          if (parts[p]._rainLandY != null) parts[p]._rainLandY *= scaleY;
        }
      }
    }
    bloodCanvas.width = newW;
    bloodCanvas.height = newH;
    if (bloodStains.length || bloodSplats.length) startBloodSplatLoop();
  }

  function syncPlayfieldLayout() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (window.BugSim && window.BugSim.recomputePlayfieldLayout) {
          window.BugSim.recomputePlayfieldLayout();
        }
        var cont = document.querySelector('.bugs-container');
        if (cont) resizeBloodCanvas(cont);
      });
    });
  }

  function hideBossPageChrome() {
    if (pageChromeSnapshot) return;
    var newsTicker = document.getElementById('news-ticker');
    pageChromeSnapshot = {
      tickerEnabled: window.BugSettings && window.BugSettings.settings
        ? window.BugSettings.settings.newsTickerEnabled
        : document.body.classList.contains('has-news-ticker')
    };
    document.body.classList.add('boss-fight-active');
    document.body.classList.remove('has-news-ticker');
    if (newsTicker) newsTicker.style.display = 'none';
    var tray = document.querySelector('.button-tray');
    if (tray) tray.style.display = 'none';
    var headerNav = document.querySelector('header');
    if (headerNav) headerNav.style.display = 'none';
    syncPlayfieldLayout();
  }

  function restoreBossPageChrome() {
    if (!pageChromeSnapshot) return;
    var newsTicker = document.getElementById('news-ticker');
    var tray = document.querySelector('.button-tray');
    var headerNav = document.querySelector('header');
    var tickerEnabled = window.BugSettings && window.BugSettings.settings
      ? window.BugSettings.settings.newsTickerEnabled
      : pageChromeSnapshot.tickerEnabled;
    document.body.classList.remove('boss-fight-active');
    if (newsTicker) newsTicker.style.display = tickerEnabled ? 'flex' : 'none';
    document.body.classList.toggle('has-news-ticker', tickerEnabled);
    if (tray) tray.style.display = '';
    if (headerNav) headerNav.style.display = '';
    pageChromeSnapshot = null;
    syncPlayfieldLayout();
  }

  window.BossPageChrome = {
    hide: hideBossPageChrome,
    restore: restoreBossPageChrome
  };

  window.__BossBloodVFX = {
    ensureCanvas: initBloodCanvas,
    destroyCanvas: destroyBloodCanvas,
    resizeCanvas: resizeBloodCanvas,
    burst: spawnBloodBurst
  };

  window.PanopticonBoss = {
    start: startPanopticon,
    isActive: function () { return active; }
  };
})();
