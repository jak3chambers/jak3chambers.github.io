






(function () {
  'use strict';

  
  var PHASE1_HP = 300;
  var PHASE2_HP = 300;
  var TOTAL_HP = PHASE1_HP + PHASE2_HP;

  
  var P1_STAMINA = 6;
  var P2_STAMINA = 10;
  var STAMINA_RECOVERY_TIME = 1400; 
  var PARRY_STAMINA_REFUND = 5;

  
  var THROW_BASE_DMG = 12;
  var THROW_MAX_DMG = 40;

  
  var BUG_MAX_HP = 100;

  
  var ATTACK_TIME_SCALE = 1 / 1.35; 
  var P2_SPEED_MULT = 0.85; 

  
  var MIN_BUGS = 3;
  var BUG_CHECK_INTERVAL = 800; 

  
  var FIG_HW = 60;
  var FIG_HH = 120;
  var FIG_COLLISION_RADIUS = 54;
  var FIG_COLLISION_CENTER_Y = 34;

  
  var SFX = {
    youcantescape: ['src/Sp_youcantescape.wav', 'src/Sp_youcantescape2.wav'],
    destroy:       ['src/Sp_destroy.wav', 'src/Sp_destroy2.wav'],
    thiswillhurt:  ['src/Sp_thiswillhurt.wav'],
    begone:        ['src/Sp_begone.wav', 'src/Sp_begone2.wav'],
    nicetry:       ['src/Sp_nicetry.wav', 'src/Sp_nicetry2.wav'],
    yesthatsit:    ['src/Sp_yesthatsit.wav'],
    outro:         ['src/Sp_outro.wav'],
    intro:         ['src/Sp_intro.wav'],
    thisprison:    ['src/Sp_thisprison.wav'],
    dialogue:      [
      'src/dialogue (1).mp3', 'src/dialogue (2).mp3', 'src/dialogue (3).mp3',
      'src/dialogue (4).mp3', 'src/dialogue (5).mp3', 'src/dialogue (6).mp3',
      'src/dialogue (7).mp3', 'src/dialogue (8).mp3'
    ],
    dodge:         ['src/Dodge.ogg', 'src/Dodge3.ogg'],
    sparkles:      ['src/Sparkles.ogg'],
    impact:        ['src/Impacts_PROCESSED_001Short.wav', 'src/Impacts_SIMPLE_003.wav'],
    hammerimpact:  ['src/HammerImpact.ogg'],
    hammerexplode1:['src/HammerExplosion1.ogg'],
    hammerexplode2:['src/HammerExplosion2.ogg'],
    hammerexplode3:['src/HammerExplosion3.ogg'],
    deathexplosion:['src/Deathexplosion.wav'],
    boom:          ['src/boom.wav'],
    panopland:     ['src/Impacts_PROCESSED_179.wav']
  };

  var VOL_VOICE = 0.55;
  var VOL_INTRO = 0.9;
  var PANOP_WAR_VOL = 0.35;
  var introAudioPreload = null;
  var VOL_DODGE = 0.3;
  var VOL_HAMMER_IMPACT = 0.5;
  var VOL_HAMMER_EXPLODE = 0.025;
  var VOL_IMPACT = 0.35;
  var VOL_SPARKLES = 0.3;
  var VOL_BOOM = 0.2;
  var VOL_PANOP_LAND = 0.6;
  var VOL_DEATH_EXPLOSION = 0.8;

  var POSE_PART_SELECTOR = '.s-head,.s-neck,.s-hair,.s-beard,.s-torso,.s-arm,.s-forearm,.s-leg,.s-shin';

  
  var active = false;
  var hp = 0;
  var phase = 1;
  var stamina = 0;
  var maxStamina = 0;
  var exhausted = false;
  var attackCycle = 0;
  var currentAttack = null;
  var attackTimer = null;
  var moveTimer = null;
  var bugCheckTimer = null;
  var hitstunActive = false;
  var figureEl = null;
  var hudEl = null;
  var hpFillEl = null;
  var hpGhostEl = null;
  var prevHpPct = 100;
  var hpGhostTimeout = null;
  var voiceEl = null;
  var overlayEl = null;
  var vfxLayer = null;
  var container = null;
  var figX = 0, figY = 0;
  var lastAttack = '';
  var lastHeavyAttack = '';
  var savedTimers = []; 
  var bugHP = {}; 

  
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function playSound(files, vol) {
    if (!files || !files.length) return;
    var a = new Audio(pick(files));
    a.volume = vol !== undefined ? vol : 0.5;
    a.play().catch(function () {});
    return a;
  }

  function preloadIntroVoice() {
    if (!SFX.intro || !SFX.intro[0] || introAudioPreload) return;
    introAudioPreload = new Audio(SFX.intro[0]);
    introAudioPreload.preload = 'auto';
    introAudioPreload.load();
  }

  function duckPanopWar(duck) {
    var war = window._panopWarMusic;
    if (war) war.volume = duck ? 0.08 : PANOP_WAR_VOL;
  }

  function pauseSiteMusicForVoice() {
    try {
      if (window.BackgroundMusic && typeof window.BackgroundMusic.pauseOverlay === 'function') {
        window.BackgroundMusic.pauseOverlay();
      }
    } catch (e) {}
  }

  function resumeSiteMusicAfterVoice() {
    try {
      if (window.BackgroundMusic && typeof window.BackgroundMusic.resumeOverlay === 'function') {
        window.BackgroundMusic.resumeOverlay();
      }
    } catch (e) {}
  }

  function playVoiceAudio(files, vol, preloaded) {
    var a = preloaded || new Audio(pick(files));
    a.volume = vol;
    if (!preloaded) a.preload = 'auto';

    var started = false;
    function start() {
      if (started) return;
      started = true;
      a.play().catch(function () {});
    }

    if (a.readyState >= 2) {
      start();
    } else {
      a.addEventListener('canplay', start, { once: true });
      if (!preloaded) a.load();
    }
    return a;
  }

  function playSfx(key) {
    var files = SFX[key];
    if (!files) return;
    var vol = key === 'intro' ? VOL_INTRO : VOL_VOICE;
    var isLongVoice = key === 'intro' || key === 'outro';
    if (isLongVoice) pauseSiteMusicForVoice();
    duckPanopWar(true);

    var pre = (key === 'intro' && introAudioPreload) ? introAudioPreload : null;
    if (pre) introAudioPreload = null;

    var a = playVoiceAudio(files, vol, pre);
    if (a) {
      a.addEventListener('ended', function () {
        duckPanopWar(false);
        if (isLongVoice) resumeSiteMusicAfterVoice();
      }, { once: true });
    }
    return a;
  }

  function doImpactShake(intensity, duration) {
    if (!container) return;
    var amp = intensity || 5;
    var dur = duration || 150;
    var start = performance.now();

    function step() {
      if (!container) return;
      var t = (performance.now() - start) / dur;
      if (t >= 1) {
        container.style.transform = '';
        return;
      }
      var falloff = 1 - t;
      var x = (Math.random() * 2 - 1) * amp * falloff;
      var y = (Math.random() * 2 - 1) * amp * 0.45 * falloff;
      container.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function tm(base) {
    var phaseScale = phase === 2 ? P2_SPEED_MULT : 1;
    return Math.round(base * ATTACK_TIME_SCALE * phaseScale);
  }

  function getBugs() {
    var bd = window.BugSim && window.BugSim.getBugData();
    return bd && bd.length > 0 ? bd : null;
  }

  function killBugAt(index, cause) {
    if (window.BugSim) window.BugSim.killBug(index, cause || 'Sisyphus Prime');
  }

  
  function getBugHP(bug) {
    if (bugHP[bug._uid] === undefined) bugHP[bug._uid] = BUG_MAX_HP;
    return bugHP[bug._uid];
  }

  function damageBug(bug, amount, cause) {
    if (bugHP[bug._uid] === undefined) bugHP[bug._uid] = BUG_MAX_HP;
    bugHP[bug._uid] -= amount;
    
    if (bug.element) {
      bug.element.style.filter = 'brightness(2.5)';
      setTimeout(function() { if (bug.element) bug.element.style.filter = ''; }, 120);
    }
    if (bugHP[bug._uid] <= 0) {
      delete bugHP[bug._uid];
      var bugs = getBugs();
      if (bugs) {
        for (var i = 0; i < bugs.length; i++) {
          if (bugs[i]._uid === bug._uid) { killBugAt(i, cause); return true; }
        }
      }
      return true; 
    }
    return false; 
  }

  function knockbackBug(bug, fromX, fromY, force) {
    var bx = bug.x + bug.radius, by = bug.y + bug.radius;
    var dx = bx - fromX, dy = by - fromY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) { dx = 1; dy = 0; dist = 1; }
    bug.dx += (dx / dist) * force;
    bug.dy += (dy / dist) * force;
  }

  
  function hitBugsInRadius(cx, cy, radius, damage, knockForce, cause) {
    var bugs = getBugs();
    if (!bugs) return 0;
    var hit = 0;
    for (var i = bugs.length - 1; i >= 0; i--) {
      var b = bugs[i];
      var bx = b.x + b.radius, by = b.y + b.radius;
      var ddx = bx - cx, ddy = by - cy;
      var d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < radius) {
        knockbackBug(b, cx, cy, knockForce);
        damageBug(b, damage, cause || 'Sisyphus Prime');
        hit++;
      }
    }
    return hit;
  }

  
  function hitBugsInLine(x, halfWidth, damage, knockForce, cause) {
    var bugs = getBugs();
    if (!bugs) return;
    for (var i = bugs.length - 1; i >= 0; i--) {
      var b = bugs[i];
      var bx = b.x + b.radius;
      if (Math.abs(bx - x) < halfWidth) {
        knockbackBug(b, x, b.y + b.radius, knockForce);
        damageBug(b, damage, cause || 'Sisyphus Prime');
      }
    }
  }

  
  function hitTargetBug(target, damage, knockForce, cause) {
    var bugs = getBugs();
    if (!bugs) return;
    for (var i = 0; i < bugs.length; i++) {
      if (bugs[i]._uid === target._uid) {
        knockbackBug(bugs[i], figX + FIG_HW, figY + FIG_HH, knockForce);
        damageBug(bugs[i], damage, cause);
        return;
      }
    }
  }

  function knockbackBugsInRadius(cx, cy, radius, knockForce) {
    var bugs = getBugs();
    if (!bugs) return 0;
    var hit = 0;
    for (var i = bugs.length - 1; i >= 0; i--) {
      var bug = bugs[i];
      var bx = bug.x + bug.radius;
      var by = bug.y + bug.radius;
      var dx = bx - cx;
      var dy = by - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        knockbackBug(bug, cx, cy, knockForce);
        hit++;
      }
    }
    return hit;
  }

  function resolveFigureBugCollision(pushForce, selfShiftScale) {
    var bugs = getBugs();
    if (!bugs || !figureEl || !container) return;

    var centerX = figX + FIG_HW;
    var centerY = figY + FIG_HH + FIG_COLLISION_CENTER_Y;
    var shiftX = 0;
    var shiftY = 0;
    var collided = false;

    for (var i = 0; i < bugs.length; i++) {
      var bug = bugs[i];
      var bx = bug.x + bug.radius;
      var by = bug.y + bug.radius;
      var dx = bx - centerX;
      var dy = by - centerY;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var minDist = FIG_COLLISION_RADIUS + bug.radius;
      if (dist >= minDist) continue;

      collided = true;
      var nx = dx / dist;
      var ny = dy / dist;
      var overlap = minDist - dist;
      var separation = overlap * 0.75 + pushForce * 0.12;

      bug.x += nx * separation;
      bug.y += ny * separation;

      shiftX -= nx * overlap * selfShiftScale;
      shiftY -= ny * overlap * selfShiftScale;
    }

    if (!collided) return;

    figX = clamp(figX + shiftX, 0, Math.max(0, container.clientWidth - FIG_HW * 2));
    figY = clamp(figY + shiftY, 0, Math.max(0, container.clientHeight - FIG_HH * 2));
    figureEl.style.left = figX + 'px';
    figureEl.style.top = figY + 'px';

    if (window.BugSim && window.BugSim._requestUpdate) {
      window.BugSim._requestUpdate();
    }
  }

  
  function ensureMinBugs() {
    if (!active) return;
    
    if (window.Horsemen && window.Horsemen.isAnyActive && window.Horsemen.isAnyActive()) {
      return;
    }
    var bugs = getBugs();
    var count = bugs ? bugs.length : 0;
    if (count < MIN_BUGS) {
      var toSpawn = MIN_BUGS - count;
      if (window.BugSim && window.BugSim.spawnBug) {
        for (var i = 0; i < toSpawn; i++) window.BugSim.spawnBug();
      }
    }
  }

  
  function buildFigure() {
    var f = document.createElement('div');
    f.className = 'sisyphus-figure';
    f.innerHTML =
      '<div class="s-hair-strand"></div>' +
      '<div class="s-hair-strand"></div>' +
      '<div class="s-hair-strand"></div>' +
      '<div class="s-hair-strand"></div>' +
      '<div class="s-hair-strand"></div>' +
      '<div class="s-hair"></div>' +
      '<div class="s-head"><div class="face-shape-1"></div><div class="face-shape-2"></div><div class="face-shape-3"></div><div class="face-shape-4"></div></div>' +
      '<div class="s-beard"></div>' +
      '<div class="s-neck"></div>' +
      '<div class="s-torso"></div>' +
      '<div class="s-arm s-arm-left"><div class="s-forearm"><div class="s-fist"></div></div></div>' +
      '<div class="s-arm s-arm-right"><div class="s-forearm"><div class="s-fist"></div></div></div>' +
      '<div class="s-leg s-leg-left"><div class="s-shin"><div class="s-foot"></div></div></div>' +
      '<div class="s-leg s-leg-right"><div class="s-shin"><div class="s-foot"></div></div></div>';
    return f;
  }

  function buildHUD() {
    var h = document.createElement('div');
    h.className = 'panop-hud sisyphus-hud-instance';
    h.style.display = 'none';
    h.innerHTML =
      '<div class="panop-boss-name">SISYPHUS PRIME</div>' +
      '<div class="panop-hp-bar">' +
        '<div class="panop-hp-ghost"></div>' +
        '<div class="panop-hp-fill"></div>' +
      '</div>';
    return h;
  }

  
  function setPos(x, y) {
    figX = x;
    figY = y;
    figureEl.style.left = x + 'px';
    figureEl.style.top  = y + 'px';
  }

  function faceTarget(tx) {
    if (tx < figX + FIG_HW) {
      figureEl.classList.add('facing-left');
    } else {
      figureEl.classList.remove('facing-left');
    }
  }

  
  
  function startAttackTrail(selector, duration) {
    if (!figureEl || !vfxLayer || !container) return;
    var el = figureEl.querySelector(selector);
    if (!el) return;
    var contRect = container.getBoundingClientRect();
    var prevX = null, prevY = null;
    var startTime = performance.now();
    var dur = duration || 300;

    function trailStep() {
      if (!active) return;
      var elapsed = performance.now() - startTime;
      if (elapsed > dur) return;

      var rect = el.getBoundingClientRect();
      var cx = rect.left - contRect.left + rect.width / 2;
      var cy = rect.top - contRect.top + rect.height / 2;

      if (prevX !== null) {
        var dx = cx - prevX, dy = cy - prevY;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 2) {
          var angle = Math.atan2(dy, dx);
          var seg = document.createElement('div');
          seg.className = 'sisyphus-attack-trail';
          seg.style.left = prevX + 'px';
          seg.style.top = prevY + 'px';
          seg.style.width = len + 'px';
          seg.style.transform = 'rotate(' + angle + 'rad)';
          vfxLayer.appendChild(seg);
          setTimeout(function () { if (seg.parentNode) seg.remove(); }, 400);
        }
      }
      prevX = cx;
      prevY = cy;
      requestAnimationFrame(trailStep);
    }
    requestAnimationFrame(trailStep);
  }

  
  function trailRightFist(dur) { startAttackTrail('.s-arm-right .s-fist', dur); }
  function trailLeftFist(dur)  { startAttackTrail('.s-arm-left .s-fist', dur); }
  function trailRightFoot(dur) { startAttackTrail('.s-leg-right .s-foot', dur); }
  function trailLeftFoot(dur)  { startAttackTrail('.s-leg-left .s-foot', dur); }
  function trailBothFists(dur) { trailRightFist(dur); trailLeftFist(dur); }
  function trailBothFeet(dur)  { trailRightFoot(dur); trailLeftFoot(dur); }

  function spawnTrail() {
    var trail = buildFigure();
    trail.className = 'sisyphus-trail';
    trail.style.left = figX + 'px';
    trail.style.top  = figY + 'px';
    if (figureEl.classList.contains('facing-left')) trail.style.transform = 'scaleX(-1)';
    vfxLayer.appendChild(trail);
    setTimeout(function () { if (trail.parentNode) trail.remove(); }, 300);
  }

  
  function spawnDashLine(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 10) return;
    var angle = Math.atan2(dy, dx);
    var el = document.createElement('div');
    el.className = 'sisyphus-dashline';
    el.style.left = (x1 + FIG_HW) + 'px';
    el.style.top  = (y1 + FIG_HH) + 'px';
    el.style.width = len + 'px';
    el.style.transform = 'rotate(' + angle + 'rad)';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 400);
  }

  
  function dashTo(tx, ty, duration, cb) {
    if (hitstunActive) { if (cb) cb(); return; }
    playSound(SFX.dodge, VOL_DODGE);
    var startX = figX, startY = figY;
    var start = performance.now();
    var trailInterval = setInterval(function() { spawnTrail(); }, 50);
    faceTarget(tx);

    
    spawnDashLine(startX, startY, tx, ty);

    function step(now) {
      if (!active) { clearInterval(trailInterval); if (cb) cb(); return; }
      if (hitstunActive) {
        
        var waitHitstun = function () {
          if (!active) { clearInterval(trailInterval); if (cb) cb(); return; }
          if (hitstunActive) { requestAnimationFrame(waitHitstun); return; }
          
          start = performance.now() - (now - start);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(waitHitstun);
        return;
      }
      var t = Math.min(1, (now - start) / duration);
      var et = 1 - (1 - t) * (1 - t);
      setPos(startX + (tx - startX) * et, startY + (ty - startY) * et);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        clearInterval(trailInterval);
        if (cb) cb();
      }
    }
    requestAnimationFrame(step);
  }

  
  function spawnShockwave(x, y, large) {
    var el = document.createElement('div');
    el.className = 'sisyphus-shockwave' + (large ? ' large' : '');
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, large ? 600 : 500);
  }

  function spawnVShock(x) {
    var el = document.createElement('div');
    el.className = 'sisyphus-vshock';
    el.style.left = x + 'px';
    el.style.top = '0';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 400);
  }

  
  function spawnSparkleTrail(fromX, fromY, toX, toY, duration, cb) {
    var count = 12;
    var interval = duration / count;
    var spawned = 0;
    var trailTimer = setInterval(function () {
      if (spawned >= count) { clearInterval(trailTimer); if (cb) cb(); return; }
      var t = spawned / count;
      var px = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 30;
      var py = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 30;
      var p = document.createElement('div');
      p.className = 'sisyphus-sparkle-particle';
      p.style.left = px + 'px';
      p.style.top = py + 'px';
      vfxLayer.appendChild(p);
      setTimeout(function () { if (p.parentNode) p.remove(); }, 500);
      spawned++;
    }, interval);
  }

  function spawnBloodSplurt(x, y, violent) {
    if (!vfxLayer) return;
    if (window.__BossBloodVFX && window.__BossBloodVFX.burst) {
      window.__BossBloodVFX.burst(x, y, violent, vfxLayer);
    }
  }

  
  function launchBug(bug, fromX, fromY, force) {
    var bx = bug.x + bug.radius, by = bug.y + bug.radius;
    var dx = bx - fromX, dy = by - fromY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) { dx = 1; dy = 0; dist = 1; }
    bug.dx += (dx / dist) * force;
    bug.dy += (dy / dist) * force;
    
    if (bug.element) {
      bug.element.style.transition = 'transform 0.4s ease-out';
      bug.element.style.transform = 'rotate(' + (Math.random() > 0.5 ? 720 : -720) + 'deg)';
      setTimeout(function () {
        if (bug.element) {
          bug.element.style.transition = '';
          bug.element.style.transform = '';
        }
      }, 400);
    }
  }

  function spawnExplosion(x, y, size, huge, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'sisyphus-explosion' + (huge ? ' huge' : '') + (opts.soft ? ' soft' : '');
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, huge ? 1000 : 500);

    
    if (!opts.soft) {
      var flash = document.createElement('div');
      flash.style.cssText = 'position:absolute;inset:0;z-index:300;pointer-events:none;background:rgba(255,255,255,' + (huge ? '0.8' : '0.15') + ');animation:phase-flash ' + (huge ? '0.6' : '0.25') + 's ease-out forwards;';
      if (container) container.appendChild(flash);
      setTimeout(function () { if (flash.parentNode) flash.remove(); }, huge ? 500 : 250);
    }

    
    if (container && !opts.soft) {
      var intensity = huge ? 18 : 3;
      var dur = huge ? 600 : 150;
      var start = performance.now();
      function shake() {
        var t = (performance.now() - start) / dur;
        if (t >= 1) { container.style.transform = ''; return; }
        var amp = intensity * (1 - t);
        container.style.transform = 'translate(' + (Math.random() * amp * 2 - amp) + 'px,' + (Math.random() * amp * 2 - amp) + 'px)';
        requestAnimationFrame(shake);
      }
      requestAnimationFrame(shake);
    }
  }

  function spawnGlint(x, y, cb) {
    var el = document.createElement('div');
    el.className = 'sisyphus-glint';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    vfxLayer.appendChild(el);
    
    if (cb) {
      setTimeout(function () {
        if (el.parentNode) el.remove();
        cb();
      }, 600);
    }
    return el;
  }

  function spawnDmgNumber(x, y, amount, isParry) {
    var el = document.createElement('div');
    el.className = 'sisyphus-dmg' + (isParry ? ' parry-dmg' : '');
    el.textContent = '-' + amount;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    vfxLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 800);
  }

  
  function spawnChargeParticles(cx, cy, count, duration) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 80;
      var sx = Math.cos(angle) * dist;
      var sy = Math.sin(angle) * dist;
      var el = document.createElement('div');
      el.className = 'sisyphus-charge-particle';
      el.style.left = cx + 'px';
      el.style.top  = cy + 'px';
      el.style.setProperty('--sx', sx + 'px');
      el.style.setProperty('--sy', sy + 'px');
      el.style.setProperty('--dur', (duration * 0.6 + Math.random() * duration * 0.4) + 'ms');
      el.style.animationDelay = (Math.random() * duration * 0.3) + 'ms';
      vfxLayer.appendChild(el);
      (function(e, d) {
        setTimeout(function () { if (e.parentNode) e.remove(); }, d + 200);
      })(el, duration);
    }
  }

  function showVoice(text) {
    
  }

  function updateHP() {
    if (!hpFillEl) return;
    var pct = Math.max(0, hp / TOTAL_HP * 100);
    hpFillEl.style.width = pct + '%';

    
    if (!hpGhostEl && hudEl) hpGhostEl = hudEl.querySelector('.panop-hp-ghost');
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

  
  function clearPose() {
    var cl = figureEl.classList;
    var remove = [];
    for (var i = 0; i < cl.length; i++) {
      if (cl[i].indexOf('pose-') === 0) remove.push(cl[i]);
    }
    for (var j = 0; j < remove.length; j++) cl.remove(remove[j]);
    cl.remove('parryable', 'unparryable');
    
    var head = figureEl.querySelector('.s-head');
    if (head) head.style.cssText = '';
  }

  function setPose(name) {
    clearPose();
    figureEl.classList.add('pose-' + name);
  }

  function setIdle() {
    clearPose();
    figureEl.classList.add('idle', 'guard');
  }

  
  function killBugsInRadius(cx, cy, radius, cause) {
    var bugs = getBugs();
    if (!bugs) return 0;
    var killed = 0;
    for (var i = bugs.length - 1; i >= 0; i--) {
      var b = bugs[i];
      var bx = b.x + b.radius, by = b.y + b.radius;
      var dx = bx - cx, dy = by - cy;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        killBugAt(i, cause || 'Sisyphus Prime');
        killed++;
      }
    }
    return killed;
  }

  function killBugsInLine(x, halfWidth, cause) {
    var bugs = getBugs();
    if (!bugs) return;
    for (var i = bugs.length - 1; i >= 0; i--) {
      var bx = bugs[i].x + bugs[i].radius;
      if (Math.abs(bx - x) < halfWidth) {
        killBugAt(i, cause || 'Sisyphus Prime');
      }
    }
  }

  function pickTargetBug() {
    var bugs = getBugs();
    if (!bugs) return null;
    return bugs[Math.floor(Math.random() * bugs.length)];
  }

  function pickAttackNoRepeat(pool) {
    if (!pool || !pool.length) return null;
    if (pool.length === 1) return pool[0];
    var filtered = [];
    for (var i = 0; i < pool.length; i++) {
      if (pool[i] !== lastAttack) filtered.push(pool[i]);
    }
    return pick(filtered.length ? filtered : pool);
  }

  
  
  var throwCheckRAF = null;
  var throwDetecting = false;
  var THROW_WINDOW = 3000; 

  function getThrowHitCenter() {
    return {
      x: figX + FIG_HW,
      y: figY + 72
    };
  }

  function startThrowDetection() {
    if (throwDetecting) return;
    throwDetecting = true;
    function checkThrows() {
      if (!active || !throwDetecting) return;
      throwCheckRAF = requestAnimationFrame(checkThrows);
      if (hitstunActive) return;

      var bugs = getBugs();
      if (!bugs) return;

      var dragging = window.BugSim && window.BugSim.getDraggingBug ? window.BugSim.getDraggingBug() : null;
      var hitCenter = getThrowHitCenter();
      var hitR = FIG_COLLISION_RADIUS + 24;
      var now = performance.now();

      for (var i = 0; i < bugs.length; i++) {
        var b = bugs[i];

        if (dragging && dragging._uid === b._uid) continue;

        var isThrown = b._thrownAt && (now - b._thrownAt <= THROW_WINDOW);
        var isRicocheting = b._ricochetUntil && now <= b._ricochetUntil;
        if (!isThrown && !isRicocheting) continue;

        var speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (speed < 5) continue;

        var bx = b.x + b.radius, by = b.y + b.radius;
        var dx = bx - hitCenter.x, dy = by - hitCenter.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < hitR + b.radius) {
          doJackhammer(b, speed, i);
          break;
        }
      }
    }
    throwCheckRAF = requestAnimationFrame(checkThrows);
  }

  function stopThrowDetection() {
    throwDetecting = false;
    if (throwCheckRAF) { cancelAnimationFrame(throwCheckRAF); throwCheckRAF = null; }
  }

  
  function doJackhammer(bug, speed, bugIndex) {
    hitstunActive = true;

    
    var normSpeed = clamp((speed - 8) / 27, 0, 1);
    var dmg = Math.round(THROW_BASE_DMG + normSpeed * (THROW_MAX_DMG - THROW_BASE_DMG));

    
    var tier;
    if (normSpeed < 0.33) tier = 1;
    else if (normSpeed < 0.66) tier = 2;
    else tier = 3;

    
    var savedDX = bug.dx, savedDY = bug.dy;
    bug.dx = 0;
    bug.dy = 0;

    
    if (window.BugSim && window.BugSim._getAnimationRunning()) {
      window.BugSim._setAnimationRunning(false);
    }

    
    figureEl.classList.add('hitstun');

    
    playSound(SFX.hammerimpact, VOL_HAMMER_IMPACT);
    doImpactShake(4, 110);

    
    var freezeTime = 60 + Math.round(normSpeed * 180); 

    setTimeout(function () {
      if (!active) { resumeFromHitstun(); return; }

      
      figureEl.classList.remove('hitstun');

      
      var explodeKey = 'hammerexplode' + tier;
      playSound(SFX[explodeKey], VOL_HAMMER_EXPLODE);
      spawnBloodSplurt(figX + FIG_HW, figY + 58, normSpeed > 0.55);

      
      var cx = bug.x + bug.radius, cy = bug.y + bug.radius;
      var explSize = 80 + tier * 40;
      spawnExplosion(cx, cy, explSize, tier === 3);
      if (tier >= 2) spawnShockwave(cx, cy, tier === 3);

      
      var bx = bug.x + bug.radius, by2 = bug.y + bug.radius;
      var repelDX = bx - (figX + FIG_HW), repelDY = by2 - (figY + FIG_HH);
      var repelDist = Math.sqrt(repelDX * repelDX + repelDY * repelDY);
      if (repelDist < 1) { repelDX = 1; repelDY = 0; repelDist = 1; }
      var bounceForce = 10 + tier * 5;
      bug.dx = (repelDX / repelDist) * bounceForce;
      bug.dy = (repelDY / repelDist) * bounceForce;

      
      delete bug._thrownAt;

      
      dealDamage(dmg, true);

      
      setTimeout(function () {
        resumeFromHitstun();
      }, 80);
    }, freezeTime);
  }

  function resumeFromHitstun() {
    hitstunActive = false;
    figureEl.classList.remove('hitstun');
    
    if (window.BugSim) {
      window.BugSim._setAnimationRunning(true);
      window.BugSim._requestUpdate();
    }
  }

  function dealDamage(amount, isJackhammer) {
    hp -= amount;
    if (hp < 0) hp = 0;
    updateHP();

    spawnDmgNumber(figX + FIG_HW, figY - 20, amount, isJackhammer);

    
    figureEl.classList.add('parry-flash');
    setTimeout(function () { figureEl.classList.remove('parry-flash'); }, 150);

    
    if (phase === 1 && hp <= PHASE2_HP) {
      enterPhase2();
      return;
    }

    
    if (hp <= 0) {
      victory();
    }
  }

  
  function enterPhase2() {
    phase = 2;
    maxStamina = P2_STAMINA;
    stamina = P2_STAMINA;
    exhausted = false;

    clearTimeout(attackTimer);
    clearTimeout(moveTimer);
    currentAttack = null;

    var flash = document.createElement('div');
    flash.className = 'sisyphus-phase-flash';
    container.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.remove(); }, 600);

    figureEl.classList.add('phase2');
    hudEl.classList.add('phase2');

    playSfx('yesthatsit');

    setIdle();
    attackTimer = setTimeout(function () { nextAttack(); }, 1200);
  }

  
  var HEAVY_ATTACKS = ['youcantescape', 'destroy'];
  var LIGHT_ATTACKS = ['thiswillhurt', 'begone', 'roundhouse', 'chop', 'groundslam'];

  function nextAttack() {
    if (!active) return;
    if (hitstunActive) {
      attackTimer = setTimeout(function () { nextAttack(); }, 100);
      return;
    }

    ensureMinBugs();
    var bugs = getBugs();
    if (!bugs) { defeat(); return; }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    stamina = maxStamina; 

    
    var attack;
    if (stamina >= 3 && lastHeavyAttack === '' && Math.random() < 0.35) {
      attack = pickAttackNoRepeat(HEAVY_ATTACKS);
      while (attack === lastHeavyAttack && HEAVY_ATTACKS.length > 1) {
        attack = pickAttackNoRepeat(HEAVY_ATTACKS);
      }
      lastHeavyAttack = attack;
    } else {
      attack = pickAttackNoRepeat(LIGHT_ATTACKS);
      lastHeavyAttack = '';
    }

    var cost = (attack === 'youcantescape' || attack === 'destroy') ? 3 : 1;
    if (stamina < cost) {
      attack = pickAttackNoRepeat(LIGHT_ATTACKS);
      cost = 1;
    }

    stamina -= cost;
    attackCycle++;
    currentAttack = attack;
    lastAttack = attack;

    switch (attack) {
      case 'youcantescape': doYouCantEscape(); break;
      case 'destroy':       doDestroy(); break;
      case 'thiswillhurt':  doThisWillHurt(); break;
      case 'begone':        doBeGone(); break;
      case 'roundhouse':    doRoundhouse(); break;
      case 'chop':          doChop(); break;
      case 'groundslam':    doGroundSlam(); break;
    }
  }

  

  
  function doYouCantEscape() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    playSfx('youcantescape');

    figureEl.classList.remove('idle');
    setPose('sumo');

    attackTimer = setTimeout(function () {
      if (!active) return;

      var bugs = getBugs();
      var t1 = bugs ? pick(bugs) : target;
      var tx1 = t1.x + t1.radius - FIG_HW;
      var ty1 = t1.y + t1.radius - FIG_HH;

      dashTo(tx1, ty1, tm(110), function () {
        if (!active) return;
        setPose('punch');
        trailRightFist(200);

        hitTargetBug(t1, 30, 35, 'Sisyphus Prime');
        launchBug(t1, figX + FIG_HW, figY + FIG_HH, 25);
        playSound(SFX.impact, VOL_IMPACT);
        doImpactShake(6, 140);

        attackTimer = setTimeout(function () {
          var bugs2 = getBugs();
          var t2 = bugs2 ? pick(bugs2) : null;
          if (!t2) { setIdle(); nextAttack(); return; }
          var tx2 = t2.x + t2.radius - FIG_HW;
          var ty2 = t2.y + t2.radius - FIG_HH;

          dashTo(tx2, ty2, tm(100), function () {
            if (!active) return;
            setPose('kick');
            trailRightFoot(200);

            hitTargetBug(t2, 25, 35, 'Sisyphus Prime');
            launchBug(t2, figX + FIG_HW, figY + FIG_HH, 30);
            playSound(SFX.impact, VOL_IMPACT);
            doImpactShake(6, 140);

            attackTimer = setTimeout(function () {
              var bugs3 = getBugs();
              var t3 = bugs3 ? pick(bugs3) : null;
              if (!t3) { setIdle(); nextAttack(); return; }
              var tx3 = t3.x + t3.radius - FIG_HW;
              var ty3 = t3.y + t3.radius - FIG_HH;

              dashTo(tx3, ty3, tm(100), function () {
                if (!active) return;
                setPose('stomp');
                trailRightFoot(200);

                hitTargetBug(t3, 20, 30, 'Sisyphus Prime');
                launchBug(t3, figX + FIG_HW, figY + FIG_HH, 20);
                playSound(SFX.impact, VOL_IMPACT);
                doImpactShake(7, 170);

                var sx = figX + FIG_HW, sy = figY + 120;
                spawnShockwave(sx, sy, false);
                hitBugsInRadius(sx, sy, 120, 25, 35, 'Sisyphus Prime');

                attackTimer = setTimeout(function () {
                  setIdle();
                  attackTimer = setTimeout(function () { nextAttack(); }, tm(1000));
                }, tm(600));
              });
            }, tm(500));
          });
        }, tm(500));
      });
    }, tm(700));
  }

  
  function doDestroy() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    playSfx('destroy');

    figureEl.classList.remove('idle');
    var tx = target.x + target.radius - FIG_HW;
    var ty = target.y + target.radius - FIG_HH;

    dashTo(tx, ty, tm(120), function () {
      if (!active) return;

      setPose('uppercut');
      trailRightFist(200);
      hitTargetBug(target, 35, 40, 'Sisyphus Prime');
      launchBug(target, figX + FIG_HW, figY + FIG_HH, 30);
      playSound(SFX.impact, VOL_IMPACT);
      doImpactShake(7, 150);

      attackTimer = setTimeout(function () {
        var bugs2 = getBugs();
        var t2 = bugs2 ? pick(bugs2) : null;
        if (!t2) { setIdle(); nextAttack(); return; }

        
        applyPoseData({
          torso:0, 'arm-left':-70, 'forearm-left':-20,
          'arm-right':-82, 'forearm-right':-16,
          'leg-left':-12, 'shin-left':19,
          'leg-right':-22, 'shin-right':26
        });

        var glintX = t2.x + t2.radius + (t2.dx || 0) * 8;
        var glintY = t2.y + t2.radius + (t2.dy || 0) * 8;

        var sparkleAudio = playSound(SFX.sparkles, VOL_SPARKLES);
        
        spawnSparkleTrail(figX + FIG_HW, figY + 30, glintX, glintY, 320);

        var glintEl = spawnGlint(glintX, glintY, function () {
          if (!active) return;
          if (glintEl && glintEl.parentNode) glintEl.remove();
          if (sparkleAudio) { sparkleAudio.pause(); sparkleAudio.currentTime = 0; }
          playSound(SFX.boom, VOL_BOOM);
          doImpactShake(10, 220);
          spawnExplosion(glintX, glintY, 240, false);
          spawnShockwave(glintX, glintY, true);
          hitBugsInRadius(glintX, glintY, 125, 72, 50, 'Sisyphus Prime');

          
          var parts = figureEl.querySelectorAll(POSE_PART_SELECTOR);
          for (var i = 0; i < parts.length; i++) { parts[i].style.transform = ''; }
          setIdle();
          attackTimer = setTimeout(function () { nextAttack(); }, tm(1000));
        });
      }, tm(600));
    });
  }

  
  function doThisWillHurt() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    playSfx('thiswillhurt');

    figureEl.classList.remove('idle');
    var tx = target.x + target.radius - FIG_HW;
    var ty = target.y + target.radius - FIG_HH;

    dashTo(tx, ty, tm(120), function () {
      if (!active) return;

      
      setPose('charge');

      
      var chargeTime = tm(700);
      spawnChargeParticles(figX + FIG_HW, figY + FIG_HH, phase === 2 ? 20 : 14, chargeTime);

      
      var headEl = figureEl.querySelector('.s-head');
      var glowStart = performance.now();
      var glowRAF;
      function updateGlow() {
        if (!active) return;
        var elapsed = performance.now() - glowStart;
        var t = Math.min(1, elapsed / chargeTime);
        
        var glow = 6 + t * 30;
        var bright = 0.7 + t * 2.5;
        if (headEl) {
          headEl.style.boxShadow = '0 0 ' + glow + 'px ' + (glow * 0.5) + 'px rgba(255,255,200,' + (0.7 + t * 0.3) + '), 0 0 ' + (glow * 2) + 'px ' + glow + 'px rgba(255,213,79,' + (0.3 + t * 0.5) + ')';
          headEl.style.filter = 'brightness(' + bright + ')';
        }
        if (t < 1) glowRAF = requestAnimationFrame(updateGlow);
      }
      glowRAF = requestAnimationFrame(updateGlow);

      attackTimer = setTimeout(function () {
        if (!active) return;
        cancelAnimationFrame(glowRAF);
        clearPose();

        
        var ex = figX + FIG_HW, ey = figY + FIG_HH;
        spawnExplosion(ex, ey, 350, true);
        spawnShockwave(ex, ey, true);
        hitBugsInRadius(ex, ey, 175, 100, 30, 'Sisyphus Prime');
        playSound(SFX.impact, VOL_IMPACT);
        doImpactShake(12, 260);

        setIdle();
        attackTimer = setTimeout(function () { nextAttack(); }, tm(1000));
      }, chargeTime);
    });
  }

  
  function doBeGone() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    playSfx('begone');

    figureEl.classList.remove('idle');
    var tx = target.x + target.radius - FIG_HW;
    var ty = target.y + target.radius - FIG_HH;

    dashTo(tx, ty, tm(110), function () {
      if (!active) return;

      
      setPose('clap-open');

      attackTimer = setTimeout(function () {
        if (!active) return;

        
        setPose('clap');
        trailBothFists(200);

        spawnVShock(figX + FIG_HW);
        spawnShockwave(figX + FIG_HW, figY + FIG_HH, true);
        hitBugsInLine(figX + FIG_HW, 50, 40, 40, 'Sisyphus Prime');
        playSound(SFX.impact, VOL_IMPACT);
        doImpactShake(8, 180);

        attackTimer = setTimeout(function () {
          setIdle();
          attackTimer = setTimeout(function () { nextAttack(); }, tm(900));
        }, tm(400));
      }, tm(300));
    });
  }

  
  function doRoundhouse() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    figureEl.classList.remove('idle');
    var tx = target.x + target.radius - FIG_HW;
    var ty = target.y + target.radius - FIG_HH;

    dashTo(tx, ty, tm(100), function () {
      if (!active) return;

      setPose('roundhouse');
      trailRightFoot(250);

      hitTargetBug(target, 30, 20, 'Sisyphus Prime');
      playSound(SFX.impact, VOL_IMPACT);
      doImpactShake(6, 140);

      attackTimer = setTimeout(function () {
        setIdle();
        attackTimer = setTimeout(function () { nextAttack(); }, tm(900));
      }, tm(400));
    });
  }

  
  function doChop() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    figureEl.classList.remove('idle');

    
    setPose('chop-windup');

    attackTimer = setTimeout(function () {
      if (!active) return;

      
      var bugs = getBugs();
      var fresh = null;
      if (bugs) {
        for (var i = 0; i < bugs.length; i++) {
          if (bugs[i]._uid === target._uid) { fresh = bugs[i]; break; }
        }
        if (!fresh) fresh = pick(bugs);
      }
      if (!fresh) { setIdle(); nextAttack(); return; }

      var ftx = fresh.x + fresh.radius - FIG_HW;
      var fty = fresh.y + fresh.radius - FIG_HH;

      
      dashTo(ftx, fty, tm(80), function () {
        if (!active) return;
        
        setPose('chop-strike');
        trailBothFists(200);
        figureEl.classList.add('unparryable');

        
        spawnShockwave(figX + FIG_HW, figY + 120, false);

        hitTargetBug(fresh, 40, 18, 'Sisyphus Prime');
        playSound(SFX.impact, VOL_IMPACT);
        doImpactShake(8, 160);
        
        hitBugsInRadius(figX + FIG_HW, figY + 120, 60, 20, 15, 'Sisyphus Prime');

        attackTimer = setTimeout(function () {
          setIdle();
          attackTimer = setTimeout(function () { nextAttack(); }, tm(900));
        }, tm(400));
      });
    }, tm(400));
  }

  
  function doGroundSlam() {
    var target = pickTargetBug();
    if (!target) { nextAttack(); return; }

    figureEl.classList.remove('idle');

    setPose('airborne');

    var jumpHeight = 100;
    dashTo(figX, figY - jumpHeight, tm(180), function () {
      if (!active) return;

      var bugs = getBugs();
      var t = bugs ? pick(bugs) : target;
      var tx = t.x + t.radius - FIG_HW;
      var ty = t.y + t.radius - FIG_HH;

      dashTo(tx, ty, tm(90), function () {
        if (!active) return;
        setPose('slam');
        trailBothFists(200);
        trailBothFeet(200);

        hitTargetBug(t, 35, 40, 'Sisyphus Prime');
        launchBug(t, figX + FIG_HW, figY + FIG_HH, 35);
        playSound(SFX.impact, VOL_IMPACT);
        doImpactShake(10, 220);

        var sx = figX + FIG_HW, sy = figY + 120;
        spawnShockwave(sx, sy, true);
        hitBugsInRadius(sx, sy, 130, 30, 40, 'Sisyphus Prime');

        attackTimer = setTimeout(function () {
          setIdle();
          attackTimer = setTimeout(function () { nextAttack(); }, tm(1000));
        }, tm(500));
      });
    });
  }

  
  function doTaunt() {
    playSfx('nicetry');
    setPose('taunt');
    stamina -= 2;

    attackTimer = setTimeout(function () {
      setIdle();
      attackTimer = setTimeout(function () { nextAttack(); }, tm(300));
    }, tm(900));
  }

  

  
  function applyPoseData(data) {
    if (!figureEl) return;
    var torsoAngle = data.torso;
    var map = {
      '.s-torso':               data.torso,
      '.s-arm.s-arm-left':      data['arm-left'],
      '.s-arm.s-arm-right':     data['arm-right'],
      '.s-leg.s-leg-left':      data['leg-left'],
      '.s-leg.s-leg-right':     data['leg-right'],
      '.s-arm-left .s-forearm': data['forearm-left'],
      '.s-arm-right .s-forearm':data['forearm-right'],
      '.s-leg-left .s-shin':    data['shin-left'],
      '.s-leg-right .s-shin':   data['shin-right']
    };
    for (var sel in map) {
      if (map[sel] === undefined) continue;
      var el = figureEl.querySelector(sel);
      if (!el) continue;
      if (sel === '.s-torso') {
        el.style.transform = 'translateX(-50%) rotate(' + map[sel] + 'deg)';
      } else {
        el.style.transform = 'rotate(' + map[sel] + 'deg)';
      }
    }
    if (torsoAngle !== undefined) {
      var headEl = figureEl.querySelector('.s-head');
      var neckEl = figureEl.querySelector('.s-neck');
      var hairEl = figureEl.querySelector('.s-hair');
      var beardEl = figureEl.querySelector('.s-beard');
      var headAngle = torsoAngle * 0.55;
      if (headEl) headEl.style.transform = 'translateX(-50%) rotate(' + headAngle + 'deg)';
      if (neckEl) neckEl.style.transform = 'translateX(-50%) rotate(' + torsoAngle + 'deg)';
      if (hairEl) hairEl.style.transform = 'translateX(-50%) rotate(' + headAngle + 'deg)';
      if (beardEl) beardEl.style.transform = 'translateX(-50%) rotate(' + headAngle + 'deg)';
    }
  }

  function setPartTransitions(dur) {
    if (!figureEl) return;
    var parts = figureEl.querySelectorAll(POSE_PART_SELECTOR);
    for (var i = 0; i < parts.length; i++) {
      parts[i].style.transition = 'transform ' + dur + 's ease-in-out';
    }
  }

  function runStandardIntroMonologue() {
    startThrowDetection();
    playSfx('intro');
    figureEl.classList.remove('idle');
    clearPose();
    applyPoseData({
      torso:0, 'arm-left':13, 'forearm-left':-9,
      'arm-right':-13, 'forearm-right':-5,
      'leg-left':-5, 'shin-left':19,
      'leg-right':-22, 'shin-right':26
    });

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(7);
      applyPoseData({
        torso:0, 'arm-left':13, 'forearm-left':-13,
        'arm-right':-61, 'forearm-right':-142,
        'leg-left':-5, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 50);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(5);
      applyPoseData({
        torso:0, 'arm-left':-26, 'forearm-left':-68,
        'arm-right':-7, 'forearm-right':-78,
        'leg-left':-5, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 7000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.4);
      applyPoseData({
        torso:0, 'arm-left':78, 'forearm-left':93,
        'arm-right':-95, 'forearm-right':-78,
        'leg-left':-5, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 11000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(4);
      applyPoseData({
        torso:0, 'arm-left':13, 'forearm-left':-47,
        'arm-right':-95, 'forearm-right':7,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 17000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(4);
      applyPoseData({
        torso:0, 'arm-left':13, 'forearm-left':-47,
        'arm-right':-95, 'forearm-right':-84,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 21000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(3);
      applyPoseData({
        torso:0, 'arm-left':124, 'forearm-left':47,
        'arm-right':-107, 'forearm-right':-51,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 25000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.1);
      applyPoseData({
        torso:0, 'arm-left':44, 'forearm-left':-42,
        'arm-right':-46, 'forearm-right':42,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 27900);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.1);
      applyPoseData({
        torso:0, 'arm-left':19, 'forearm-left':-27,
        'arm-right':-65, 'forearm-right':-71,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 28500);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.1);
      applyPoseData({
        torso:0, 'arm-left':19, 'forearm-left':-27,
        'arm-right':-52, 'forearm-right':-126,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 28900);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso:0, 'arm-left':14, 'forearm-left':-41,
        'arm-right':-84, 'forearm-right':-9,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 31000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.4);
      applyPoseData({
        torso:0, 'arm-left':-48, 'forearm-left':-80,
        'arm-right':-50, 'forearm-right':-67,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 35000);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.4);
      applyPoseData({
        torso:0, 'arm-left':-48, 'forearm-left':-111,
        'arm-right':-50, 'forearm-right':-105,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 35400);

    setTimeout(function () {
      if (!active) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso:0, 'arm-left':-51, 'forearm-left':-120,
        'arm-right':-84, 'forearm-right':-74,
        'leg-left':-12, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });
    }, 38000);

    attackTimer = setTimeout(function () {
      if (figureEl) {
        var parts = figureEl.querySelectorAll(POSE_PART_SELECTOR);
        for (var i = 0; i < parts.length; i++) {
          parts[i].style.transform = '';
          parts[i].style.transition = '';
        }
      }
      if (hudEl) hudEl.style.display = '';
      setIdle();
      nextAttack();
    }, 39400);
  }

  function runPanopticonBurstIntro(opts) {
    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;
    var startX = (opts && typeof opts.spawnX === 'number' ? opts.spawnX : fieldW / 2) - FIG_HW;
    var startY = (opts && typeof opts.spawnY === 'number' ? opts.spawnY : fieldH * 0.35) - FIG_HH;
    var floorY = fieldH - 246;

    startThrowDetection();
    setPos(startX, startY);
    figureEl.classList.remove('idle');
    clearPose();
    setPartTransitions(0);
    applyPoseData({
      torso: 0,
      'arm-left': 112,
      'forearm-left': 28,
      'arm-right': -118,
      'forearm-right': -18,
      'leg-left': 4,
      'shin-left': 20,
      'leg-right': -8,
      'shin-right': 18
    });

    var velocityY = 3;
    var gravity = 0.7;
    var maxVelocityY = 17;
    var lastTime = 0;

    function fallStep(now) {
      if (!active) return;
      var dt = Math.min((now - lastTime) / 16.6667, 2);
      lastTime = now;

      velocityY = Math.min(maxVelocityY, velocityY + gravity * dt);
      var nextY = figY + velocityY * dt;

      if (nextY >= floorY) {
        setPos(figX, floorY);
        setPartTransitions(0);
        applyPoseData({
          torso:0, 'arm-left':13, 'forearm-left':-9,
          'arm-right':-13, 'forearm-right':-5,
          'leg-left':-5, 'shin-left':19,
          'leg-right':-22, 'shin-right':26
        });
        playSound(SFX.panopland, VOL_PANOP_LAND);
        doImpactShake(9, 240);
        spawnGroundShockwave(figX + FIG_HW, figY + FIG_HH + 90);
        knockbackBugsInRadius(figX + FIG_HW, figY + FIG_HH + 90, 240, 42);
        startThrowDetection();
        if (window.BugSim && window.BugSim._requestUpdate) {
          window.BugSim._requestUpdate();
        }
        setTimeout(function () {
          if (!active) return;
          runStandardIntroMonologue();
        }, 500);
        return;
      }

      setPos(figX, nextY);
      requestAnimationFrame(fallStep);
    }

    setTimeout(function () {
      if (!active) return;
      lastTime = performance.now();
      requestAnimationFrame(fallStep);
    }, 500);
  }

  function spawnGroundShockwave(x, y) {
    if (!vfxLayer) return;
    var shock = document.createElement('div');
    shock.className = 'sisyphus-shockwave';
    shock.style.left = x + 'px';
    shock.style.top = y + 'px';
    vfxLayer.appendChild(shock);
    setTimeout(function () { if (shock.parentNode) shock.remove(); }, 500);
  }

  function victory() {
    active = false;
    clearTimeout(attackTimer);
    clearTimeout(moveTimer);
    clearInterval(bugCheckTimer);
    stopThrowDetection();

    
    if (window._panopWarMusic) {
      window._panopWarMusic.pause();
      window._panopWarMusic = null;
    }

    figureEl.classList.remove('idle');
    clearPose();
    figureEl.classList.remove('facing-left');
    playSfx('outro');

    
    if (window.BugSim && window.BugSim.clearThrowCap) {
      window.BugSim.clearThrowCap();
    }

    
    var floorX = container.clientWidth / 2 - 60;
    var floorY = container.clientHeight - 260;
    figureEl.style.transition = 'none';
    figureEl.style.left = floorX + 'px';
    figureEl.style.top  = floorY + 'px';
    figX = floorX;
    figY = floorY;

    
    applyPoseData({
      torso: 0, 'arm-left': 22, 'forearm-left': -28,
      'arm-right': -16, 'forearm-right': 22,
      'leg-left': 14, 'shin-left': -20,
      'leg-right': -2, 'shin-right': 6
    });

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso: 0, 'arm-left': 19, 'forearm-left': -28,
        'arm-right': -88, 'forearm-right': -73,
        'leg-left': 14, 'shin-left': -20,
        'leg-right': -2, 'shin-right': 6
      });
    }, 6528);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': -29, 'forearm-left': -61,
        'arm-right': -31, 'forearm-right': -61,
        'leg-left': 14, 'shin-left': -20,
        'leg-right': -2, 'shin-right': 6
      });
    }, 10681);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': 23, 'forearm-left': -27,
        'arm-right': -15, 'forearm-right': 25,
        'leg-left': 14, 'shin-left': -20,
        'leg-right': -2, 'shin-right': 6
      });
    }, 12822);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso: 0, 'arm-left': 23, 'forearm-left': -27,
        'arm-right': -86, 'forearm-right': -126,
        'leg-left': 14, 'shin-left': -20,
        'leg-right': -2, 'shin-right': 6
      });
    }, 15601);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': 40, 'forearm-left': 96,
        'arm-right': -31, 'forearm-right': -82,
        'leg-left': 14, 'shin-left': -20,
        'leg-right': -2, 'shin-right': 6
      });
    }, 16695);

    
    setTimeout(function () {
      if (!figureEl) return;
      var cx = container.clientWidth / 2 - 60;
      var cy = container.clientHeight / 2 - 120;
      figureEl.style.transition = 'left 4s ease-in-out, top 4s ease-in-out';
      figureEl.style.left = cx + 'px';
      figureEl.style.top  = cy + 'px';
      figX = cx;
      figY = cy;

      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': 22, 'forearm-left': 116,
        'arm-right': -16, 'forearm-right': -97,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 18000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso: 0, 'arm-left': 44, 'forearm-left': 90,
        'arm-right': -40, 'forearm-right': -73,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 19000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': 22, 'forearm-left': 116,
        'arm-right': -16, 'forearm-right': -97,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 20000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso: 0, 'arm-left': 44, 'forearm-left': 90,
        'arm-right': -40, 'forearm-right': -73,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 21000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(1);
      applyPoseData({
        torso: 0, 'arm-left': 22, 'forearm-left': 116,
        'arm-right': -16, 'forearm-right': -97,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 22000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(2);
      applyPoseData({
        torso: 0, 'arm-left': 47, 'forearm-left': 128,
        'arm-right': -63, 'forearm-right': -97,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 23000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(0.5);
      applyPoseData({
        torso: 0, 'arm-left': 44, 'forearm-left': 90,
        'arm-right': -40, 'forearm-right': -73,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 24000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(2);
      applyPoseData({
        torso: 0, 'arm-left': 47, 'forearm-left': 128,
        'arm-right': -63, 'forearm-right': -97,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 25000);

    
    setTimeout(function () {
      if (!figureEl) return;
      figureEl.style.transition = 'filter 2s ease-in';
      figureEl.style.filter = 'brightness(8) saturate(0)';
      figureEl.classList.add('death-shake');
    }, 25000);

    
    setTimeout(function () {
      if (!figureEl) return;
      setPartTransitions(2);
      applyPoseData({
        torso: 0, 'arm-left': 117, 'forearm-left': 65,
        'arm-right': -123, 'forearm-right': -48,
        'leg-left': -5, 'shin-left': 22,
        'leg-right': -42, 'shin-right': 61
      });
    }, 26000);

    
    setTimeout(function () {
      if (!figureEl) return;
      playSound(SFX.deathexplosion, VOL_DEATH_EXPLOSION);
      var ex = figX + FIG_HW, ey = figY + FIG_HH;

      
      spawnExplosion(ex, ey, 900, true);
      setTimeout(function () { spawnExplosion(ex - 80, ey - 60, 600, true); }, 80);
      setTimeout(function () { spawnExplosion(ex + 90, ey + 40, 550, true); }, 160);
      setTimeout(function () { spawnExplosion(ex - 50, ey + 70, 500, true); }, 250);
      setTimeout(function () { spawnExplosion(ex + 60, ey - 80, 450, true); }, 340);
      spawnShockwave(ex, ey, true);

      figureEl.style.display = 'none';
    }, 27000);

    
    setTimeout(function () { cleanup(); }, 32000);
  }

  function defeat() {
    active = false;
    clearTimeout(attackTimer);
    clearTimeout(moveTimer);
    clearInterval(bugCheckTimer);
    stopThrowDetection();

    
    if (window.BugSim && window.BugSim.clearThrowCap) {
      window.BugSim.clearThrowCap();
    }

    overlayEl.querySelector('.result-text').className = 'result-text defeat';
    overlayEl.querySelector('.result-text').textContent = 'ALL BUGS DEVOURED';
    overlayEl.classList.add('show');

    setTimeout(function () { cleanup(); }, 4000);
  }

  
  function cleanup() {
    active = false;
    clearTimeout(attackTimer);
    clearTimeout(moveTimer);
    clearInterval(bugCheckTimer);
    stopThrowDetection();

    if (window.BossPageChrome) window.BossPageChrome.restore();
    if (window.__BossBloodVFX) window.__BossBloodVFX.destroyCanvas();

    
    if (window.BugSim) {
      window.BugSim._setAnimationRunning(true);
      window.BugSim._requestUpdate();
    }

    
    if (window.BugSim && window.BugSim.clearThrowCap) {
      window.BugSim.clearThrowCap();
    }

    if (introAudioPreload) {
      try { introAudioPreload.pause(); } catch (e) {}
      introAudioPreload = null;
    }
    duckPanopWar(false);
    resumeSiteMusicAfterVoice();

    if (figureEl && figureEl.parentNode) figureEl.remove();
    if (hudEl && hudEl.parentNode) hudEl.remove();
    if (voiceEl && voiceEl.parentNode) voiceEl.remove();
    if (overlayEl && overlayEl.parentNode) overlayEl.remove();
    if (vfxLayer && vfxLayer.parentNode) vfxLayer.remove();

    figureEl = hudEl = hpFillEl = voiceEl = overlayEl = vfxLayer = container = null;
  }

  
  function startSisyphus(opts) {
    if (active) return;
    var bd = getBugs();
    if (!bd) return;

    container = document.querySelector('.bugs-container');
    if (!container) return;
    active = true;
    preloadIntroVoice();

    if (window.BossPageChrome) window.BossPageChrome.hide();
    if (window.__BossBloodVFX) window.__BossBloodVFX.ensureCanvas(container);

    var fromPanopticon = opts && opts.introMode === 'panopticon-burst';

    if (!fromPanopticon && window.BugSim && window.BugSim.silentClearBugs) {
      window.BugSim.silentClearBugs(0);
    }

    
    hp = TOTAL_HP;
    phase = 1;
    stamina = P1_STAMINA;
    maxStamina = P1_STAMINA;
    exhausted = false;
    attackCycle = 0;
    lastHeavyAttack = '';
    hitstunActive = false;
    bugHP = {};

    
    figureEl = buildFigure();
    container.appendChild(figureEl);

    hudEl = buildHUD();
    hpFillEl = hudEl.querySelector('.panop-hp-fill');
    hpGhostEl = null;
    prevHpPct = 100;
    document.body.insertBefore(hudEl, document.body.firstChild);

    voiceEl = document.createElement('div');
    voiceEl.className = 'sisyphus-voice';
    container.appendChild(voiceEl);

    overlayEl = document.createElement('div');
    overlayEl.className = 'sisyphus-overlay';
    overlayEl.innerHTML = '<div class="result-text"></div>';
    container.appendChild(overlayEl);

    vfxLayer = document.createElement('div');
    vfxLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:149;overflow:hidden;';
    container.appendChild(vfxLayer);

    
    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;
    setPos(fieldW / 2 - 60, fieldH - 260);

    updateHP();

    
    if (window.BugSim && window.BugSim.setThrowCap) {
      window.BugSim.setThrowCap(70);
    }

    
    if (!fromPanopticon && window.BugSim && window.BugSim.spawnBug) {
      for (var i = 0; i < 28; i++) {
        window.BugSim.spawnBug();
      }
    }

    
    

    
    bugCheckTimer = setInterval(ensureMinBugs, BUG_CHECK_INTERVAL);

    if (opts && opts.introMode === 'panopticon-burst') {
      runPanopticonBurstIntro(opts);
    } else {
      applyPoseData({
        torso:0, 'arm-left':13, 'forearm-left':-9,
        'arm-right':-13, 'forearm-right':-5,
        'leg-left':-5, 'shin-left':19,
        'leg-right':-22, 'shin-right':26
      });

      setTimeout(function () {
        if (!active) return;
        runStandardIntroMonologue();
      }, 1000);
    }
  }

  
  window.SisyphusBoss = {
    start: startSisyphus,
    isActive: function() { return active; }
  };
})();
