


(function() {
  'use strict';

  var DEATH_SOUND = 'src/death1.mp3';
  var GHOST_IMG   = 'src/ghost.png';

  
  
  var DEATH_ACTIVE = false;
  function startDeath() {
    if (DEATH_ACTIVE) return;
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length === 0) return;
    DEATH_ACTIVE = true;

    var totalBugs = bd.length;
    var killed = 0;

    var killNext = function() {
      var bugs = window.BugSim.getBugData();
      if (!bugs || bugs.length === 0) { DEATH_ACTIVE = false; return; }
      var progress = totalBugs > 1 ? killed / (totalBugs - 1) : 1;

      
      var batch = 1;
      if (progress > 0.6) batch = 1 + Math.floor(Math.random() * 3);
      else if (progress > 0.3) batch = 1 + Math.floor(Math.random() * 2);

      for (var i = 0; i < batch; i++) {
        var remaining = window.BugSim.getBugData();
        if (!remaining || remaining.length === 0) return;

        var entry = remaining[0];
        var el = entry.element;
        if (el) {
          var rect = el.getBoundingClientRect();
          spawnGhost(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }

        try {
          var snd = new Audio(DEATH_SOUND);
          snd.volume = 0.3;
          snd.play();
        } catch(_) {}

        window.BugSim.killBug(0, 'Swift and indiscriminate death');
        killed++;
      }

      
      if (window.BugSim.getBugData().length > 0) {
        
        var baseDelay = 400 * (1 - progress * 0.95);
        var jitter = baseDelay * 0.5 * (Math.random() - 0.3);
        var delay = Math.max(20, Math.floor(baseDelay + jitter));
        setTimeout(killNext, delay);
      } else {
        DEATH_ACTIVE = false;
      }
    };

    killNext();
  }

  function spawnGhost(x, y) {
    var ghost = document.createElement('img');
    ghost.src = GHOST_IMG;
    ghost.className = 'horseman-ghost';
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    document.body.appendChild(ghost);

    
    ghost.addEventListener('animationend', function() {
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    });
    
    setTimeout(function() {
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
    }, 1500);
  }

  
  window.Horsemen = {
    death: startDeath,
    war: startWar,
    famine: startFamine,
    pestilence: startPestilence,
    wicked: startSomethingWicked,
    isAnyActive: function() {
      return DEATH_ACTIVE || WAR_ACTIVE || FAMINE_ACTIVE || PEST_ACTIVE || WICKED_ACTIVE;
    }
  };

  
  
  

  var WAR_ACTIVE = false;
  var WAR_RAF = null;

  
  var WEAPONS = {
    gun:             { img: 'src/gun.png',             sfx: 'src/pistol_shoot.wav',           fireRate: 900,   damage: 4,   accuracy: 0.03,  speed: 120, type: 'bullet',  spread: 1,  spriteW: 56,  spriteH: 56,  facesRight: false },
    sniper:          { img: 'src/rifle.png',           sfx: 'src/sniper_shoot.wav',           fireRate: 4000,  damage: 25,  accuracy: 0.01,  speed: 220, type: 'bullet',  spread: 1,  spriteW: 115, spriteH: 45,  facesRight: true },
    shotgun:         { img: 'src/shotgun.png',         sfx: 'src/shotgun_shoot.wav',          fireRate: 1800,  damage: 5,   accuracy: 0.15,  speed: 100, type: 'bullet',  spread: 5,  spriteW: 110, spriteH: 42,  facesRight: true },
    rocketlauncher:  { img: 'src/rocketlauncher.png',  sfx: 'src/rocket_shoot.wav',           fireRate: 7000,  damage: 40,  accuracy: 0.04,  speed: 28,  type: 'rocket',  blastRadius: 150, spread: 1, spriteW: 110, spriteH: 65, facesRight: false },
    grenadelauncher: { img: 'src/grenade.png',         sfx: 'src/grenade_launcher_shoot.wav', fireRate: 5000,  damage: 30,  accuracy: 0.08,  speed: 16,  type: 'grenade', blastRadius: 110, spread: 1, spriteW: 100, spriteH: 60, facesRight: true }
  };
  var WEAPON_KEYS = Object.keys(WEAPONS);

  
  var SHOTGUN_MAX_RANGE = 500;

  function startWar() {
    if (WAR_ACTIVE) return;
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length < 2) return;
    WAR_ACTIVE = true;

    var container = document.querySelector('.bugs-container');
    if (!container) { WAR_ACTIVE = false; return; }

    
    var soundPools = {};
    WEAPON_KEYS.forEach(function(key) {
      var sfx = WEAPONS[key].sfx;
      if (!sfx) return;
      soundPools[key] = [];
      for (var p = 0; p < 6; p++) {
        var a = new Audio(sfx);
        a.volume = 0.025;
        a.preload = 'auto';
        a.load();
        soundPools[key].push(a);
      }
    });
    var soundIdx = {};
    WEAPON_KEYS.forEach(function(k) { soundIdx[k] = 0; });

    function playWeaponSound(weaponKey) {
      var pool = soundPools[weaponKey];
      if (!pool || !pool.length) return;
      var idx = soundIdx[weaponKey] % pool.length;
      soundIdx[weaponKey]++;
      var s = pool[idx];
      s.currentTime = 0;
      s.play().catch(function(){});
    }

    var cRect = container.getBoundingClientRect();
    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;
    var midX = fieldW / 2;

    
    var projLayer = document.createElement('div');
    projLayer.className = 'war-projectile-layer';
    projLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden;';
    container.appendChild(projLayer);

    
    var soldiers = [];
    var shuffled = bd.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }

    var half = Math.floor(shuffled.length / 2);
    for (var i = 0; i < shuffled.length; i++) {
      var team = i < half ? 0 : 1; 
      var wKey = WEAPON_KEYS[Math.floor(Math.random() * WEAPON_KEYS.length)];
      var wDef = WEAPONS[wKey];

      
      var wImg = document.createElement('img');
      wImg.src = wDef.img;
      wImg.className = 'war-weapon';
      var sw = wDef.spriteW || 56;
      var sh = wDef.spriteH || 56;
      wImg.style.cssText = 'position:absolute;width:' + sw + 'px;height:' + sh + 'px;pointer-events:none;z-index:51;';;
      container.appendChild(wImg);

      soldiers.push({
        bug: shuffled[i],
        team: team,
        hp: 100,
        weapon: wKey,
        weaponDef: wDef,
        weaponEl: wImg,
        lastFire: -Math.random() * wDef.fireRate,
        _nextFireDelay: wDef.fireRate * (0.3 + Math.random() * 0.7),
        _barrageShots: 0,
        _reloadUntil: 0,
        alive: true
      });
    }

    var projectiles = [];
    var explosions = [];

    
    var PULL_FORCE = 0.4;
    var shootingStarted = false;

    function bugsSettled() {
      for (var i = 0; i < soldiers.length; i++) {
        var s = soldiers[i];
        if (!s.alive) continue;
        var bCx = s.bug.x + s.bug.radius;
        
        if (s.team === 0 && bCx > midX) return false;
        if (s.team === 1 && bCx < midX) return false;
      }
      return true;
    }

    function pullBugsToSides() {
      for (var i = 0; i < soldiers.length; i++) {
        var s = soldiers[i];
        if (!s.alive) continue;
        var b = s.bug;
        var targetX = s.team === 0 ? fieldW * 0.2 : fieldW * 0.8;
        var diff = targetX - b.x;
        b.dx += diff > 0 ? PULL_FORCE : -PULL_FORCE;
      }
    }

    
    function fireWeapon(soldier, now) {
      
      if (soldier.weaponDef.type === 'grenade') {
        if (now < soldier._reloadUntil) return;
        if (soldier._barrageShots >= 4) {
          
          soldier._reloadUntil = now + 6000 + Math.random() * 2000;
          soldier._barrageShots = 0;
          return;
        }
        if (soldier._barrageShots === 0) {
          
          if (now - soldier.lastFire < soldier._nextFireDelay) return;
        } else {
          
          if (now - soldier.lastFire < 650 + Math.random() * 200) return;
        }
      } else {
        if (now - soldier.lastFire < soldier._nextFireDelay) return;
      }
      soldier.lastFire = now;
      
      var base = soldier.weaponDef.fireRate;
      soldier._nextFireDelay = base * (0.7 + Math.random() * 0.6);

      
      playWeaponSound(soldier.weapon);

      var b = soldier.bug;
      var bSize = b.radius * 2;
      var sx = b.x + bSize / 2;
      var sy = b.y + bSize / 2;

      
      var enemies = [];
      for (var i = 0; i < soldiers.length; i++) {
        if (soldiers[i].alive && soldiers[i].team !== soldier.team) enemies.push(soldiers[i]);
      }
      if (enemies.length === 0) return;
      var target = enemies[Math.floor(Math.random() * enemies.length)];
      var tx = target.bug.x + bSize / 2;
      var ty = target.bug.y + bSize / 2;

      var angle = Math.atan2(ty - sy, tx - sx);
      
      soldier._aimAngle = angle;
      var count = soldier.weaponDef.spread;

      for (var s = 0; s < count; s++) {
        var spread = (Math.random() - 0.5) * soldier.weaponDef.accuracy * 2;
        var a = angle + spread;
        var vx = Math.cos(a) * soldier.weaponDef.speed;
        var vy = Math.sin(a) * soldier.weaponDef.speed;

        var pEl = document.createElement('div');
        pEl.className = 'war-proj war-proj-' + soldier.weaponDef.type;
        
        if (soldier.weaponDef.type === 'bullet') {
          pEl.setAttribute('data-weapon', soldier.weapon);
        }
        
        if (soldier.weaponDef.type === 'grenade') {
          pEl.setAttribute('data-team', soldier.team === 0 ? 'red' : 'blu');
          
          pEl.style.animationDuration = (0.15 + Math.random() * 0.25) + 's';
        }
        pEl.style.left = sx + 'px';
        pEl.style.top = sy + 'px';

        
        if (soldier.weaponDef.type === 'bullet') {
          var tracerAngle = a * 180 / Math.PI;
          pEl.style.transform = 'translate(-50%,-50%) rotate(' + tracerAngle + 'deg)';
        }

        projLayer.appendChild(pEl);

        var proj = {
          el: pEl,
          x: sx, y: sy,
          vx: vx, vy: vy,
          type: soldier.weaponDef.type,
          damage: soldier.weaponDef.damage,
          team: soldier.team,
          born: now,
          blastRadius: soldier.weaponDef.blastRadius || 0,
          startX: sx, startY: sy
        };

        
        if (proj.type === 'grenade') {
          var barrageDmgScale = [1, 0.8, 0.6, 0.4];
          var shotIdx = Math.min(soldier._barrageShots, 3);
          proj.damage = soldier.weaponDef.damage * barrageDmgScale[shotIdx];
          soldier._barrageShots++;
        }

        
        if (proj.type === 'grenade') {
          var dx = tx - sx;
          var dy = ty - sy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          
          var frames = Math.max(20, Math.min(80, dist / soldier.weaponDef.speed));
          
          frames *= (0.85 + Math.random() * 0.3);
          var g = 0.35;
          
          
          proj.vx = dx / frames;
          proj.vy = (dy - 0.5 * g * frames * frames) / frames;
          proj.gravity = g;
        }

        projectiles.push(proj);
      }
    }

    
    function showDamageNumber(soldier, dmg) {
      if (!soldier.alive) return;
      var rounded = Math.round(dmg);
      if (rounded <= 0) return;

      
      if (!soldier._dmgEl || !soldier._dmgEl.parentNode) {
        
        var el = document.createElement('div');
        el.className = 'war-dmg-number';
        projLayer.appendChild(el);
        soldier._dmgEl = el;
        soldier._dmgTotal = 0;
        soldier._dmgBaseY = 0;
      }

      
      if (soldier._dmgFadeTimer) clearTimeout(soldier._dmgFadeTimer);
      soldier._dmgEl.classList.remove('war-dmg-fade');

      soldier._dmgTotal += rounded;
      soldier._dmgEl.textContent = '-' + soldier._dmgTotal;

      
      var bSize = soldier.bug.radius * 2;
      soldier._dmgEl.style.left = (soldier.bug.x + bSize / 2) + 'px';
      soldier._dmgEl.style.top = (soldier.bug.y - 8) + 'px';

      
      soldier._dmgFadeTimer = setTimeout(function() {
        if (soldier._dmgEl && soldier._dmgEl.parentNode) {
          soldier._dmgEl.classList.add('war-dmg-fade');
          setTimeout(function() {
            if (soldier._dmgEl && soldier._dmgEl.parentNode) {
              soldier._dmgEl.remove();
            }
            soldier._dmgEl = null;
            soldier._dmgTotal = 0;
          }, 600);
        }
      }, 2000);
    }

    
    function warShake(intensity) {
      var c = document.querySelector('.bugs-container');
      if (!c) return;
      var ox = (Math.random() - 0.5) * intensity;
      var oy = (Math.random() - 0.5) * intensity;
      c.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
      setTimeout(function() { c.style.transform = ''; }, 80);
    }

    
    function explodeAt(x, y, radius, damage, team) {
      
      warShake(radius > 120 ? 22 : radius > 100 ? 14 : 8);

      
      var burst = document.createElement('div');
      burst.className = 'war-explosion';
      burst.style.left = x + 'px';
      burst.style.top = y + 'px';
      burst.style.width = radius * 2 + 'px';
      burst.style.height = radius * 2 + 'px';
      projLayer.appendChild(burst);
      setTimeout(function() { if (burst.parentNode) burst.remove(); }, 600);

      
      for (var i = 0; i < soldiers.length; i++) {
        var s = soldiers[i];
        if (!s.alive) continue;
        var bSize = s.bug.radius * 2;
        var cx = s.bug.x + bSize / 2;
        var cy = s.bug.y + bSize / 2;
        var dx = cx - x, dy = cy - y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
          
          var linear = 1 - (dist / radius);
          var falloff = linear * linear;
          
          var actualDmg = damage * 0.5 * falloff;
          s.hp -= actualDmg;
          showDamageNumber(s, actualDmg);
          
          var kb = falloff * 25;
          var na = Math.atan2(dy, dx);
          s.bug.dx += Math.cos(na) * kb;
          s.bug.dy += Math.sin(na) * kb;
        }
      }
    }

    
    function warTick() {
      if (!WAR_ACTIVE) return;
      var now = performance.now();

      
      pullBugsToSides();

      
      if (!shootingStarted && bugsSettled()) {
        shootingStarted = true;
        
        for (var si = 0; si < soldiers.length; si++) {
          var s2 = soldiers[si];
          s2.lastFire = now;
          s2._nextFireDelay = s2.weaponDef.fireRate * (0.1 + Math.random() * 0.9);
        }
      }
      if (shootingStarted) {

        for (var i = 0; i < soldiers.length; i++) {
          var s = soldiers[i];
          if (!s.alive) continue;
          fireWeapon(s, now);
        }
      }

      
      for (var i = projectiles.length - 1; i >= 0; i--) {
        var p = projectiles[i];

        if (p.type === 'grenade' && p.gravity) {
          p.vy += p.gravity;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.el.style.left = p.x + 'px';
        p.el.style.top = p.y + 'px';

        
        if (p.type === 'bullet') {
          var tracerAngle = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
          p.el.style.transform = 'translate(-50%,-50%) rotate(' + tracerAngle + 'deg)';
        }
        
        if (p.type === 'rocket') {
          var projAngle = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
          p.el.style.transform = 'translate(-50%,-50%) rotate(' + projAngle + 'deg)';
        }
        

        
        if (p.type === 'rocket' || p.type === 'grenade') {
          var trail = document.createElement('div');
          trail.className = p.type === 'rocket' ? 'war-trail-rocket' : 'war-trail-grenade';
          trail.style.left = p.x + 'px';
          trail.style.top = p.y + 'px';
          projLayer.appendChild(trail);
          (function(t) { setTimeout(function() { if (t.parentNode) t.remove(); }, 300); })(trail);
        }

        
        if (p.x < -50 || p.x > fieldW + 50 || p.y < -100 || p.y > fieldH + 50) {
          p.el.remove();
          projectiles.splice(i, 1);
          continue;
        }

        
        if (p.type === 'grenade' && p.y >= fieldH - 10) {
          explodeAt(p.x, p.y, p.blastRadius, p.damage, p.team);
          p.el.remove();
          projectiles.splice(i, 1);
          continue;
        }

        
        var hit = false;
        for (var j = 0; j < soldiers.length; j++) {
          var s = soldiers[j];
          if (!s.alive || s.team === p.team) continue;
          var bSize = s.bug.radius * 2;
          var cx = s.bug.x + bSize / 2;
          var cy = s.bug.y + bSize / 2;
          var dx = p.x - cx, dy = p.y - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bSize / 2 + 5) {
            if (p.type === 'rocket') {
              
              s.hp -= p.damage;
              showDamageNumber(s, p.damage);
              explodeAt(p.x, p.y, p.blastRadius, p.damage, p.team);
            } else if (p.type === 'grenade') {
              s.hp -= p.damage;
              showDamageNumber(s, p.damage);
              explodeAt(p.x, p.y, p.blastRadius, p.damage, p.team);
            } else {
              
              var dmg = p.damage;
              var kbMult = 0.05;
              if (p.type === 'bullet' && p.damage <= 7) { 
                var traveled = Math.sqrt((p.x - p.startX) * (p.x - p.startX) + (p.y - p.startY) * (p.y - p.startY));
                
                var distScale = Math.max(0.3, 1 - traveled / SHOTGUN_MAX_RANGE * 0.7);
                dmg = p.damage * distScale;
                
                kbMult = 0.05 * (1 + 2 * Math.max(0, 1 - traveled / (SHOTGUN_MAX_RANGE * 0.6)));
              }
              s.hp -= dmg;
              showDamageNumber(s, dmg);
              
              s.bug.dx += p.vx * kbMult;
              s.bug.dy += p.vy * kbMult;
            }
            p.el.remove();
            projectiles.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;

        
        if (p.type === 'rocket' && now - p.born > 2000) {
          explodeAt(p.x, p.y, p.blastRadius, p.damage, p.team);
          p.el.remove();
          projectiles.splice(i, 1);
          continue;
        }
      }

      
      for (var i = soldiers.length - 1; i >= 0; i--) {
        var s = soldiers[i];
        
        if (s.alive && (!s.bug.element || !s.bug.element.parentNode)) {
          s.alive = false;
          if (s.weaponEl && s.weaponEl.parentNode) s.weaponEl.remove();
          if (s._dmgEl && s._dmgEl.parentNode) { s._dmgEl.remove(); s._dmgEl = null; }
          if (s._dmgFadeTimer) { clearTimeout(s._dmgFadeTimer); s._dmgFadeTimer = null; }
        }
        if (s.alive && s.hp <= 0) {
          s.alive = false;
          s.weaponEl.remove();

          
          var bd = window.BugSim.getBugData();
          var idx = bd.indexOf(s.bug);
          if (idx !== -1) {
            var el = s.bug.element;
            if (el) {
              var rect = el.getBoundingClientRect();
              spawnGhost(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
            window.BugSim.killBug(idx, 'Casualty of the War of Bugs');
            
            if (Math.random() < 0.03) {
              try {
                var dom = new Audio('src/tf_domination.mp3');
                dom.volume = 0.025;
                dom.play();
              } catch(_) {}
            }
          }
        }
      }

      
      for (var i = 0; i < soldiers.length; i++) {
        var s = soldiers[i];
        if (s._dmgEl && s._dmgEl.parentNode && s.alive) {
          var bSize = s.bug.radius * 2;
          s._dmgEl.style.left = (s.bug.x + bSize / 2) + 'px';
          s._dmgEl.style.top = (s.bug.y - 8) + 'px';
        }
      }

      
      
      
      
      
      
      
      
      for (var i = 0; i < soldiers.length; i++) {
        var s = soldiers[i];
        if (!s.alive) continue;
        var b = s.bug;
        var bSize = b.radius * 2;
        var bugCx = b.x + bSize / 2;
        var bugCy = b.y + bSize / 2;
        var sw = s.weaponDef.spriteW || 56;
        var wh = s.weaponDef.spriteH || 56;
        var aDeg = s._aimAngle != null ? (s._aimAngle * 180 / Math.PI) : (s.team === 0 ? 0 : 180);

        if (s.weaponDef.facesRight) {
          
          s.weaponEl.style.left = bugCx + 'px';
          s.weaponEl.style.top = (bugCy - wh / 2) + 'px';
          s.weaponEl.style.transformOrigin = '0% 50%';
          if (s.team === 0) {
            s.weaponEl.style.transform = 'rotate(' + aDeg + 'deg)';
          } else {
            s.weaponEl.style.transform = 'scaleX(-1) rotate(' + (180 - aDeg) + 'deg)';
          }
        } else {
          
          s.weaponEl.style.left = (bugCx - sw) + 'px';
          s.weaponEl.style.top = (bugCy - wh / 2) + 'px';
          s.weaponEl.style.transformOrigin = '100% 50%';
          if (s.team === 0) {
            s.weaponEl.style.transform = 'scaleX(-1) rotate(' + (-aDeg) + 'deg)';
          } else {
            s.weaponEl.style.transform = 'rotate(' + (aDeg - 180) + 'deg)';
          }
        }
      }

      
      var leftAlive = 0, rightAlive = 0;
      for (var i = 0; i < soldiers.length; i++) {
        if (soldiers[i].alive) {
          if (soldiers[i].team === 0) leftAlive++;
          else rightAlive++;
        }
      }

      if (shootingStarted && (leftAlive === 0 || rightAlive === 0)) {
        var vic = new Audio('src/victory-tf2.mp3');
        vic.volume = 0.025;
        vic.play().catch(function(){});
        endWar(projLayer, soldiers, projectiles);
        return;
      }

      WAR_RAF = requestAnimationFrame(warTick);
    }

    WAR_RAF = requestAnimationFrame(warTick);
  }

  function endWar(projLayer, soldiers, projectiles) {
    WAR_ACTIVE = false;
    if (WAR_RAF) { cancelAnimationFrame(WAR_RAF); WAR_RAF = null; }

    
    for (var i = 0; i < projectiles.length; i++) {
      if (projectiles[i].el.parentNode) projectiles[i].el.remove();
    }

    
    for (var i = 0; i < soldiers.length; i++) {
      if (soldiers[i].weaponEl && soldiers[i].weaponEl.parentNode) soldiers[i].weaponEl.remove();
      if (soldiers[i]._dmgEl && soldiers[i]._dmgEl.parentNode) soldiers[i]._dmgEl.remove();
      if (soldiers[i]._dmgFadeTimer) clearTimeout(soldiers[i]._dmgFadeTimer);
    }

    
    if (projLayer && projLayer.parentNode) projLayer.remove();
  }

  
  
  

  var FAMINE_ACTIVE = false;
  var FAMINE_RAF = null;

  function startFamine() {
    if (FAMINE_ACTIVE) return;
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length === 0) return;
    FAMINE_ACTIVE = true;

    var container = document.querySelector('.bugs-container');
    if (!container) { FAMINE_ACTIVE = false; return; }

    
    var BITE_SOUNDS = [];
    for (var p = 0; p < 6; p++) {
      var a = new Audio(p % 2 === 0 ? 'src/bite.mp3' : 'src/bite2.mp3');
      a.volume = 0.04;
      a.preload = 'auto';
      a.load();
      BITE_SOUNDS.push(a);
    }
    var biteIdx = 0;
    function playBite() {
      var s = BITE_SOUNDS[biteIdx % BITE_SOUNDS.length];
      biteIdx++;
      s.currentTime = 0;
      s.play().catch(function(){});
    }

    
    var SVG_NS = 'http://www.w3.org/2000/svg';

    
    var particleLayer = document.createElement('div');
    particleLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden;';
    container.appendChild(particleLayer);

    
    var ghouls = [];
    var ghoulUid = 0;

    
    function buildBiteMask(bites) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">';
      svg += '<rect x="0" y="0" width="1" height="1" fill="white"/>';
      for (var i = 0; i < bites.length; i++) {
        var b = bites[i];
        svg += '<circle cx="' + b.cx + '" cy="' + b.cy + '" r="' + b.r + '" fill="black"/>';
      }
      svg += '</svg>';
      return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }

    function applyBiteMask(el, bites) {
      var mask = buildBiteMask(bites);
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;
      el.style.webkitMaskSize = '100% 100%';
      el.style.maskSize = '100% 100%';
      el.style.webkitMaskMode = 'luminance';
      el.style.maskMode = 'luminance';
    }

    function clearBiteMask(el) {
      el.style.webkitMaskImage = '';
      el.style.maskImage = '';
      el.style.webkitMaskSize = '';
      el.style.maskSize = '';
      el.style.webkitMaskMode = '';
      el.style.maskMode = '';
      el.style.clipPath = '';
    }

    function initGhoul(bug) {
      
      applyBiteMask(bug.element, []);

      
      var origW = bug.element.style.width;
      var origH = bug.element.style.height;
      var origSize = bug.radius * 2;
      var savedFilter = bug.element.style.filter || '';

      return {
        bug: bug,
        alive: true,
        hunger: 0,         
        scale: 1,          
        bites: [],         
        bittenArea: 0,     
        clipId: null,
        clipEl: null,
        target: null,
        biteTimer: 0,
        huntSpeed: 1.2,
        starveTime: 0,     
        _origSize:   origSize,
        _origWidth:  origW,
        _origHeight: origH,
        _savedFilter: savedFilter
      };
    }

    
    var currentBugs = bd.slice();
    for (var i = 0; i < currentBugs.length; i++) {
      
      currentBugs[i]._famineOrigFilter = currentBugs[i].element.style.filter || '';
      currentBugs[i]._famineOrigW      = currentBugs[i].element.style.width;
      currentBugs[i]._famineOrigH      = currentBugs[i].element.style.height;
      ghouls.push(initGhoul(currentBugs[i]));
    }

    
    var SHRINK_RATE = 0.02;
    
    var HUNGER_RATE = 100 / 15;
    
    var HUNGER_THRESHOLD = 40;
    
    var BITE_INTERVAL = 600;
    
    var BITE_RADIUS = 0.18;
    
    var CONSUME_THRESHOLD = 0.45;
    
    var CHASE_SPEED = 2.5;
    
    var STARVE_TIMEOUT = 12;

    var lastTime = performance.now();

    function dist(a, b) {
      var ax = a.bug.x + a.bug.radius;
      var ay = a.bug.y + a.bug.radius;
      var bx = b.bug.x + b.bug.radius;
      var by = b.bug.y + b.bug.radius;
      return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
    }

    
    function rebuildClip(g) {
      applyBiteMask(g.bug.element, g.bites);
    }

    function findNearest(g) {
      var best = null, bestDist = Infinity;
      for (var i = 0; i < ghouls.length; i++) {
        var other = ghouls[i];
        if (other === g || !other.alive) continue;
        var d = dist(g, other);
        if (d < bestDist) {
          bestDist = d;
          best = other;
        }
      }
      return best;
    }

    function spawnBiteParticles(x, y) {
      for (var i = 0; i < 4; i++) {
        var p = document.createElement('div');
        p.className = 'famine-bite-particle';
        var angle = Math.random() * Math.PI * 2;
        var dist = 10 + Math.random() * 20;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        particleLayer.appendChild(p);
        (function(el) {
          setTimeout(function() { if (el.parentNode) el.remove(); }, 500);
        })(p);
      }
    }

    function consumeBug(attacker, victim) {
      
      var remainingMass = 1 - victim.bittenArea;
      attacker.scale += remainingMass * 0.3;
      attacker.hunger = Math.max(0, attacker.hunger - 40);

      
      victim.alive = false;
      var victimBug = victim.bug;

      
      clearBiteMask(victimBug.element);
      victimBug.element.style.width  = victim._origWidth  || '';
      victimBug.element.style.height = victim._origHeight || '';
      victimBug.element.style.filter = victim._savedFilter || '';

      
      var bugData = window.BugSim.getBugData();
      for (var i = 0; i < bugData.length; i++) {
        if (bugData[i] === victimBug || bugData[i]._uid === victimBug._uid) {
          window.BugSim.killBug(i, 'Consumed by a starving bug');
          break;
        }
      }

      
      attacker.target = null;
    }

    function spawnPopParticles(x, y, scale) {
      var count = Math.floor(8 + scale * 6);
      for (var i = 0; i < count; i++) {
        var p = document.createElement('div');
        p.className = 'famine-pop-particle';
        var angle = Math.random() * Math.PI * 2;
        var dist = 20 + Math.random() * 40 * scale;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        p.style.width = (4 + Math.random() * 4 * scale) + 'px';
        p.style.height = p.style.width;
        particleLayer.appendChild(p);
        (function(el) {
          setTimeout(function() { if (el.parentNode) el.remove(); }, 700);
        })(p);
      }
    }

    function famineTick(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.1); 
      lastTime = now;

      
      var bugData = window.BugSim && window.BugSim.getBugData();
      if (bugData) {
        for (var i = 0; i < bugData.length; i++) {
          var found = false;
          for (var j = 0; j < ghouls.length; j++) {
            if (ghouls[j].bug === bugData[i] || ghouls[j].bug._uid === bugData[i]._uid) {
              found = true;
              break;
            }
          }
          if (!found) {
            ghouls.push(initGhoul(bugData[i]));
          }
        }
      }

      
      for (var i = ghouls.length - 1; i >= 0; i--) {
        var g = ghouls[i];
        if (!g.alive) continue;
        
        var exists = false;
        if (bugData) {
          for (var j = 0; j < bugData.length; j++) {
            if (bugData[j] === g.bug || bugData[j]._uid === g.bug._uid) {
              exists = true;
              break;
            }
          }
        }
        if (!exists) {
          g.alive = false;
          clearBiteMask(g.bug.element);
        }
      }

      
      var aliveCount = 0;
      var lastAlive = null;
      for (var i = 0; i < ghouls.length; i++) {
        if (ghouls[i].alive) { aliveCount++; lastAlive = ghouls[i]; }
      }

      
      if (aliveCount === 0) {
        endFamine();
        return;
      }

      
      if (aliveCount === 1 && lastAlive) {
        lastAlive.scale -= dt * 0.15;
        var lastSize = Math.max(0, lastAlive.scale) * (lastAlive._origSize || (lastAlive.bug.radius * 2));
        lastAlive.bug.element.style.width  = lastSize + 'px';
        lastAlive.bug.element.style.height = lastSize + 'px';
        lastAlive.bug.element.style.filter = 'saturate(' + Math.max(0, lastAlive.scale * 0.5) + ') brightness(' + (0.5 + lastAlive.scale * 0.5) + ')';

        if (lastAlive.scale <= 0.05) {
          
          var popX = lastAlive.bug.x + lastAlive.bug.radius;
          var popY = lastAlive.bug.y + lastAlive.bug.radius;
          spawnPopParticles(popX, popY, 1.5);

          lastAlive.alive = false;
          clearBiteMask(lastAlive.bug.element);
          lastAlive.bug.element.style.filter = lastAlive._savedFilter || '';
          lastAlive.bug.element.style.width  = lastAlive._origWidth  || '';
          lastAlive.bug.element.style.height = lastAlive._origHeight || '';

          var bData = window.BugSim.getBugData();
          for (var k = 0; k < bData.length; k++) {
            if (bData[k] === lastAlive.bug || bData[k]._uid === lastAlive.bug._uid) {
              window.BugSim.killBug(k, 'Starved — the last survivor');
              break;
            }
          }

          
          var remaining = window.BugSim.getBugData();
          if (!remaining || remaining.length === 0) {
            endFamine();
            return;
          }
          
        }

        FAMINE_RAF = requestAnimationFrame(famineTick);
        return;
      }

      
      for (var i = 0; i < ghouls.length; i++) {
        var g = ghouls[i];
        if (!g.alive) continue;

        
        g.hunger = Math.min(100, g.hunger + HUNGER_RATE * dt);

        
        if (g.hunger >= 100) {
          g.starveTime += dt;
        } else {
          g.starveTime = 0;
        }

        
        if (g.starveTime >= STARVE_TIMEOUT) {
          var starveProg = Math.min(1, (g.starveTime - STARVE_TIMEOUT) / 3);
          g.scale = Math.max(0, 0.3 * (1 - starveProg));
          if (g.scale <= 0.02) {
            var px = g.bug.x + g.bug.radius;
            var py = g.bug.y + g.bug.radius;
            spawnPopParticles(px, py, 0.8);
            g.alive = false;
            clearBiteMask(g.bug.element);
            g.bug.element.style.filter = g._savedFilter || '';
            g.bug.element.style.width  = g._origWidth  || '';
            g.bug.element.style.height = g._origHeight || '';
            var bData = window.BugSim.getBugData();
            for (var k = 0; k < bData.length; k++) {
              if (bData[k] === g.bug || bData[k]._uid === g.bug._uid) {
                window.BugSim.killBug(k, 'Starved to death');
                break;
              }
            }
            continue;
          }
        } else {
          
          g.scale = Math.max(0.3, g.scale - SHRINK_RATE * dt);
        }

        
        var sat = Math.max(0, 1 - g.hunger / 120);
        var bright = g.starveTime >= STARVE_TIMEOUT ? (0.3 + 0.7 * (1 - Math.min(1, (g.starveTime - STARVE_TIMEOUT) / 3))) : 1;
        g.bug.element.style.filter = 'saturate(' + sat + ') brightness(' + bright + ')';
        
        
        var origSize = g._origSize || (g.bug.radius * 2);
        var curSize = origSize * g.scale;
        g.bug.element.style.width  = curSize + 'px';
        g.bug.element.style.height = curSize + 'px';

        
        if (g.hunger >= HUNGER_THRESHOLD) {
          
          if (!g.target || !g.target.alive) {
            g.target = findNearest(g);
          }

          if (g.target) {
            
            var gx = g.bug.x + g.bug.radius;
            var gy = g.bug.y + g.bug.radius;
            var tx = g.target.bug.x + g.target.bug.radius;
            var ty = g.target.bug.y + g.target.bug.radius;
            var dx = tx - gx;
            var dy = ty - gy;
            var d = Math.sqrt(dx * dx + dy * dy) || 1;

            
            var chaseStrength = CHASE_SPEED * (0.5 + g.hunger / 200);
            g.bug.dx += (dx / d) * chaseStrength;
            g.bug.dy += (dy / d) * chaseStrength;

            
            var biteRange = (g.bug.radius + g.target.bug.radius) * (g.scale + g.target.scale) * 0.5;
            if (d < biteRange + 10 && now - g.biteTimer > BITE_INTERVAL) {
              g.biteTimer = now;

              
              var target = g.target;
              var attackAngle = Math.atan2(gy - ty, gx - tx);
              
              
              var biteProgress = Math.min(1, target.bites.length / 8);
              var edgeDist = 0.45 - biteProgress * 0.35;
              
              var jitterAngle = attackAngle + (Math.random() - 0.5) * 1.2;
              var biteX = 0.5 + Math.cos(jitterAngle) * edgeDist;
              var biteY = 0.5 + Math.sin(jitterAngle) * edgeDist;
              
              biteX = Math.max(0.05, Math.min(0.95, biteX));
              biteY = Math.max(0.05, Math.min(0.95, biteY));

              var biteR = BITE_RADIUS * (0.8 + Math.random() * 0.4);
              target.bites.push({ cx: biteX, cy: biteY, r: biteR });
              target.bittenArea += biteR * biteR * Math.PI; 

              
              rebuildClip(target);

              
              g.scale += 0.03;
              g.hunger = Math.max(0, g.hunger - 15);
              g.starveTime = 0; 

              
              var worldBiteX = target.bug.x + biteX * target.bug.radius * 2;
              var worldBiteY = target.bug.y + biteY * target.bug.radius * 2;
              spawnBiteParticles(worldBiteX, worldBiteY);
              playBite();

              
              target.bug.dx += (dx / d) * -3;
              target.bug.dy += (dy / d) * -3;

              
              if (target.bittenArea >= CONSUME_THRESHOLD) {
                consumeBug(g, target);
              }
            }
          }
        }
      }

      FAMINE_RAF = requestAnimationFrame(famineTick);
    }

    FAMINE_RAF = requestAnimationFrame(famineTick);
  }

  function endFamine() {
    FAMINE_ACTIVE = false;
    if (FAMINE_RAF) { cancelAnimationFrame(FAMINE_RAF); FAMINE_RAF = null; }

    
    var bugData = window.BugSim && window.BugSim.getBugData();
    if (bugData) {
      for (var i = 0; i < bugData.length; i++) {
        var el = bugData[i].element;
        el.style.webkitMaskImage = '';
        el.style.maskImage = '';
        el.style.webkitMaskSize = '';
        el.style.maskSize = '';
        el.style.webkitMaskMode = '';
        el.style.maskMode = '';
        el.style.clipPath = '';
        
        el.style.width  = bugData[i]._famineOrigW  || el.style.width;
        el.style.height = bugData[i]._famineOrigH || el.style.height;
        
        el.style.filter = (typeof bugData[i]._famineOrigFilter !== 'undefined')
          ? bugData[i]._famineOrigFilter
          : el.style.filter.replace(/saturate\([^)]*\)\s*brightness\([^)]*\)/g, '').trim();
        delete bugData[i]._famineOrigFilter;
        delete bugData[i]._famineOrigW;
        delete bugData[i]._famineOrigH;
      }
    }

    
    var container = document.querySelector('.bugs-container');
    if (container) {
      var layers = container.querySelectorAll('[style*="pointer-events:none"][style*="z-index:50"]');
      for (var i = 0; i < layers.length; i++) layers[i].remove();
    }
  }

  
  
  

  var PEST_ACTIVE = false;
  var PEST_RAF = null;

  function startPestilence() {
    if (PEST_ACTIVE) return;
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length === 0) return;
    PEST_ACTIVE = true;

    var container = document.querySelector('.bugs-container');
    if (!container) { PEST_ACTIVE = false; return; }

    var fieldW = container.clientWidth;
    var fieldH = container.clientHeight;

    
    var SVG_NS = 'http://www.w3.org/2000/svg';

    
    var locustLayer = document.createElement('div');
    locustLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:55;overflow:hidden;';
    container.appendChild(locustLayer);

    
    var particleLayer = document.createElement('div');
    particleLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:56;overflow:hidden;';
    container.appendChild(particleLayer);

    
    var BITE_SOUNDS = [];
    for (var p = 0; p < 8; p++) {
      var a = new Audio(p % 2 === 0 ? 'src/bite.mp3' : 'src/bite2.mp3');
      a.volume = 0.03;
      a.preload = 'auto';
      a.load();
      BITE_SOUNDS.push(a);
    }
    var biteIdx = 0;
    function playBite() {
      var s = BITE_SOUNDS[biteIdx % BITE_SOUNDS.length];
      biteIdx++;
      s.currentTime = 0;
      s.play().catch(function(){});
    }

    
    var bugStates = {}; 

    
    function buildPestMask(bites) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">';
      svg += '<rect x="0" y="0" width="1" height="1" fill="white"/>';
      for (var i = 0; i < bites.length; i++) {
        var b = bites[i];
        svg += '<circle cx="' + b.cx + '" cy="' + b.cy + '" r="' + b.r + '" fill="black"/>';
      }
      svg += '</svg>';
      return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }

    function applyPestMask(el, bites) {
      var mask = buildPestMask(bites);
      el.style.webkitMaskImage = mask;
      el.style.maskImage = mask;
      el.style.webkitMaskSize = '100% 100%';
      el.style.maskSize = '100% 100%';
      el.style.webkitMaskMode = 'luminance';
      el.style.maskMode = 'luminance';
    }

    function clearPestMask(el) {
      el.style.webkitMaskImage = '';
      el.style.maskImage = '';
      el.style.webkitMaskSize = '';
      el.style.maskSize = '';
      el.style.webkitMaskMode = '';
      el.style.maskMode = '';
      el.style.clipPath = '';
    }

    function getBugState(bug) {
      var uid = bug._uid;
      if (bugStates[uid]) return bugStates[uid];

      
      applyPestMask(bug.element, []);

      var state = {
        bug: bug,
        bites: [],
        bittenArea: 0,
        clipId: null,
        clipEl: null,
        alive: true
      };
      bugStates[uid] = state;
      return state;
    }

    function rebuildPestClip(state) {
      applyPestMask(state.bug.element, state.bites);
    }

    function spawnBiteDebris(x, y) {
      for (var i = 0; i < 3; i++) {
        var p = document.createElement('div');
        p.className = 'pest-bite-particle';
        var angle = Math.random() * Math.PI * 2;
        var dist = 8 + Math.random() * 16;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        particleLayer.appendChild(p);
        (function(el) {
          setTimeout(function() { if (el.parentNode) el.remove(); }, 400);
        })(p);
      }
    }

    function killBugByState(state) {
      state.alive = false;
      clearPestMask(state.bug.element);

      var bugData = window.BugSim.getBugData();
      for (var i = 0; i < bugData.length; i++) {
        if (bugData[i] === state.bug || bugData[i]._uid === state.bug._uid) {
          window.BugSim.killBug(i, 'Devoured by the locust swarm');
          break;
        }
      }
    }

    
    var locusts = [];
    var LOCUST_SIZE = 55;
    var LOCUST_SPEED_MIN = 280;
    var LOCUST_SPEED_MAX = 480;
    var BITE_RADIUS = 0.12;
    
    var CONSUME_THRESHOLD = 0.85; 
    var BITE_COOLDOWN = 250; 

    function spawnLocust() {
      var el = document.createElement('img');
      el.src = 'src/locust.png';
      el.className = 'pest-locust';
      locustLayer.appendChild(el);

      
      var x = fieldW + LOCUST_SIZE;
      var y = Math.random() * fieldH;
      var speed = LOCUST_SPEED_MIN + Math.random() * (LOCUST_SPEED_MAX - LOCUST_SPEED_MIN);
      
      var angle = Math.PI + (Math.random() - 0.5) * 0.6;
      var vx = Math.cos(angle) * speed;
      var vy = Math.sin(angle) * speed;

      
      

      locusts.push({
        el: el,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        lastBite: 0,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 20 + Math.random() * 30
      });
    }

    
    var spawnTimer = 0;
    var startTime = performance.now();
    var lastTime = performance.now();
    
    var SPAWN_INTERVAL_START = 600;
    var SPAWN_INTERVAL_MIN = 25;
    var RAMP_DURATION = 12000; 
    var peteringOut = false;
    var peterStartTime = 0;
    var PETER_DURATION = 5000; 

    function getSpawnInterval(elapsed) {
      var t = Math.min(1, elapsed / RAMP_DURATION);
      
      var t2 = t * t;
      return SPAWN_INTERVAL_START * (1 - t2) + SPAWN_INTERVAL_MIN * t2;
    }

    function pestTick(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      var elapsed = now - startTime;

      
      fieldW = container.clientWidth;
      fieldH = container.clientHeight;

      
      var bugData = window.BugSim && window.BugSim.getBugData();
      var bugsExist = bugData && bugData.length > 0;

      
      if (!bugsExist && !peteringOut) {
        peteringOut = true;
        peterStartTime = now;
      }
      
      if (bugsExist && peteringOut) {
        peteringOut = false;
      }

      
      if (peteringOut && locusts.length === 0) {
        endPestilence();
        return;
      }

      
      if (bugsExist) {
        for (var i = 0; i < bugData.length; i++) {
          getBugState(bugData[i]);
        }
      }

      
      if (!peteringOut) {
        spawnTimer += dt * 1000;
        var interval = getSpawnInterval(elapsed);
        while (spawnTimer >= interval) {
          spawnTimer -= interval;
          spawnLocust();
        }
      } else {
        
        var peterProgress = Math.min(1, (now - peterStartTime) / PETER_DURATION);
        if (peterProgress < 1) {
          spawnTimer += dt * 1000;
          
          var peterInterval = SPAWN_INTERVAL_MIN + peterProgress * (SPAWN_INTERVAL_START * 3 - SPAWN_INTERVAL_MIN);
          while (spawnTimer >= peterInterval) {
            spawnTimer -= peterInterval;
            spawnLocust();
          }
        }
      }

      
      var margin = LOCUST_SIZE * 3;
      for (var li = locusts.length - 1; li >= 0; li--) {
        var loc = locusts[li];

        
        loc.wobblePhase += dt * (4 + Math.random() * 2);
        var wobbleOffset = Math.sin(loc.wobblePhase) * loc.wobbleAmp * dt;
        
        var speed = Math.sqrt(loc.vx * loc.vx + loc.vy * loc.vy) || 1;
        var perpX = -loc.vy / speed;
        var perpY = loc.vx / speed;

        loc.x += loc.vx * dt + perpX * wobbleOffset;
        loc.y += loc.vy * dt + perpY * wobbleOffset;

        
        loc.el.style.left = loc.x + 'px';
        loc.el.style.top = loc.y + 'px';

        
        if (loc.x < -margin || loc.x > fieldW + margin ||
            loc.y < -margin || loc.y > fieldH + margin) {
          loc.el.remove();
          locusts.splice(li, 1);
          continue;
        }

        
        if (now - loc.lastBite < BITE_COOLDOWN) continue;

        var locCx = loc.x + LOCUST_SIZE / 2;
        var locCy = loc.y + LOCUST_SIZE / 2;

        for (var bi = 0; bi < bugData.length; bi++) {
          var bug = bugData[bi];
          var state = bugStates[bug._uid];
          if (!state || !state.alive) continue;

          var bugCx = bug.x + bug.radius;
          var bugCy = bug.y + bug.radius;
          var dx = locCx - bugCx;
          var dy = locCy - bugCy;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < bug.radius + LOCUST_SIZE * 0.4) {
            
            loc.lastBite = now;

            var attackAngle = Math.atan2(locCy - bugCy, locCx - bugCx);
            var biteProgress = Math.min(1, state.bites.length / 12);
            var edgeDist = 0.45 - biteProgress * 0.38;
            var jitterAngle = attackAngle + (Math.random() - 0.5) * 1.5;
            var biteX = 0.5 + Math.cos(jitterAngle) * edgeDist;
            var biteY = 0.5 + Math.sin(jitterAngle) * edgeDist;
            biteX = Math.max(0.05, Math.min(0.95, biteX));
            biteY = Math.max(0.05, Math.min(0.95, biteY));

            var biteR = BITE_RADIUS * (0.7 + Math.random() * 0.6);
            state.bites.push({ cx: biteX, cy: biteY, r: biteR });
            state.bittenArea += biteR * biteR * Math.PI;

            rebuildPestClip(state);

            
            var worldX = bug.x + biteX * bug.radius * 2;
            var worldY = bug.y + biteY * bug.radius * 2;
            spawnBiteDebris(worldX, worldY);

            
            if (Math.random() < 0.3) playBite();

            
            bug.dx += (dx / dist) * -1.5;
            bug.dy += (dy / dist) * -1.5;

            
            if (state.bittenArea >= CONSUME_THRESHOLD) {
              killBugByState(state);
              
              bugData = window.BugSim.getBugData();
              bi--;
            }

            break; 
          }
        }
      }

      PEST_RAF = requestAnimationFrame(pestTick);
    }

    PEST_RAF = requestAnimationFrame(pestTick);
  }

  function endPestilence() {
    PEST_ACTIVE = false;
    if (PEST_RAF) { cancelAnimationFrame(PEST_RAF); PEST_RAF = null; }

    
    var bugData = window.BugSim && window.BugSim.getBugData();
    if (bugData) {
      for (var i = 0; i < bugData.length; i++) {
        bugData[i].element.style.webkitMaskImage = '';
        bugData[i].element.style.maskImage = '';
        bugData[i].element.style.webkitMaskSize = '';
        bugData[i].element.style.maskSize = '';
        bugData[i].element.style.webkitMaskMode = '';
        bugData[i].element.style.maskMode = '';
        bugData[i].element.style.clipPath = '';
        
      }
    }

    
    var container = document.querySelector('.bugs-container');
    if (container) {
      var layers = container.querySelectorAll('.pest-locust');
      for (var i = 0; i < layers.length; i++) layers[i].remove();
      
      var divLayers = container.querySelectorAll('[style*="z-index:55"], [style*="z-index:56"]');
      for (var i = 0; i < divLayers.length; i++) divLayers[i].remove();
    }
  }

  
  
  

  var WICKED_ACTIVE = false;
  var WICKED_TIMER = null;
  var WICKED_STORAGE_KEY = 'wickedArrivalTime';

  
  (function resumeWickedTimer() {
    var stored = localStorage.getItem(WICKED_STORAGE_KEY);
    if (!stored) return;
    var arrivalTime = parseInt(stored, 10);
    var now = Date.now();
    if (isNaN(arrivalTime)) { localStorage.removeItem(WICKED_STORAGE_KEY); return; }
    var remaining = arrivalTime - now;
    if (remaining <= 0) {
      
      localStorage.removeItem(WICKED_STORAGE_KEY);
      
      var checkReady = setInterval(function() {
        var bd = window.BugSim && window.BugSim.getBugData();
        if (bd && bd.length > 0) {
          clearInterval(checkReady);
          executeWickedSweep();
        }
      }, 500);
      
      setTimeout(function() { clearInterval(checkReady); }, 30000);
    } else {
      
      WICKED_TIMER = setTimeout(function() {
        localStorage.removeItem(WICKED_STORAGE_KEY);
        executeWickedSweep();
      }, remaining);
    }
  })();

  function startSomethingWicked() {
    if (WICKED_ACTIVE) return;
    
    if (localStorage.getItem(WICKED_STORAGE_KEY)) return;
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length === 0) return;
    WICKED_ACTIVE = true;

    var container = document.querySelector('.bugs-container');
    if (!container) { WICKED_ACTIVE = false; return; }

    
    var audio = new Audio('src/SomethingEvil.ogg');
    audio.volume = 0.5;
    audio.play().catch(function(){});

    
    var textOverlay = document.createElement('div');
    textOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:100;pointer-events:none;';
    var textEl = document.createElement('div');
    textEl.textContent = 'Something wicked this way comes';
    textEl.style.cssText = 'font-family:"Creepster",cursive,"Times New Roman",serif;font-size:clamp(28px,5vw,64px);color:#8b0000;text-shadow:0 0 20px rgba(139,0,0,0.8),0 0 40px rgba(0,0,0,0.6);opacity:0;transition:opacity 1.2s ease-in;text-align:center;padding:0 20px;letter-spacing:3px;';
    textOverlay.appendChild(textEl);
    container.appendChild(textOverlay);

    
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        textEl.style.opacity = '1';
      });
    });

    
    setTimeout(function() {
      textEl.style.transition = 'opacity 1.5s ease-out';
      textEl.style.opacity = '0';
      setTimeout(function() {
        if (textOverlay.parentNode) textOverlay.remove();
      }, 1600);
    }, 3000);

    
    var delaySeconds = 1 + Math.floor(Math.random() * 100);
    var arrivalTime = Date.now() + delaySeconds * 1000;
    localStorage.setItem(WICKED_STORAGE_KEY, String(arrivalTime));

    WICKED_TIMER = setTimeout(function() {
      localStorage.removeItem(WICKED_STORAGE_KEY);
      executeWickedSweep();
    }, delaySeconds * 1000);
  }

  function executeWickedSweep() {
    var bd = window.BugSim && window.BugSim.getBugData();
    if (!bd || bd.length === 0) { WICKED_ACTIVE = false; return; }

    var container = document.querySelector('.bugs-container');
    if (!container) { WICKED_ACTIVE = false; return; }

    
    var wickedImg = document.createElement('img');
    wickedImg.src = 'src/somethingwicked.png';
    wickedImg.style.cssText = 'position:absolute;top:0;height:100%;width:auto;z-index:101;pointer-events:none;image-rendering:auto;will-change:transform;left:-9999px;';
    container.appendChild(wickedImg);

    var ZOOM_DURATION = 180; 

    
    function doSweep() {
      var fieldW = container.clientWidth;

      
      var teleportSfx = new Audio('src/SomethingEvil3_Teleport.ogg');
      teleportSfx.volume = 0.6;
      teleportSfx.play().catch(function(){});

      
      var dopplerSfx = new Audio('src/BlackHoleLoop.ogg');
      dopplerSfx.loop = true;
      dopplerSfx.volume = 0;
      dopplerSfx.play().catch(function(){});

      
      var dopplerStart = performance.now();
      var imgW = wickedImg.offsetWidth;
      function updateDoppler() {
        var elapsed = performance.now() - dopplerStart;
        if (elapsed > ZOOM_DURATION + 100) {
          dopplerSfx.pause();
          dopplerSfx.currentTime = 0;
          return;
        }
        
        var t = Math.min(elapsed / ZOOM_DURATION, 1);
        
        var imgCenter = (fieldW + imgW) - t * (fieldW + 2 * imgW) + imgW / 2;
        
        var screenCenter = fieldW / 2;
        var dist = Math.abs(imgCenter - screenCenter) / (fieldW / 2 + imgW / 2);
        
        var vol = Math.max(0, 1 - dist * dist);
        dopplerSfx.volume = Math.min(1, vol * 0.8);
        requestAnimationFrame(updateDoppler);
      }
      requestAnimationFrame(updateDoppler);

      
      wickedImg.style.left = '';
      wickedImg.style.right = '-' + wickedImg.offsetWidth + 'px';
      wickedImg.style.transition = 'none';

      
      wickedImg.offsetHeight;

      
      wickedImg.style.transition = 'right ' + ZOOM_DURATION + 'ms linear';
      wickedImg.style.right = fieldW + 'px';

      
      var killTimeout = ZOOM_DURATION * 0.4;
      setTimeout(function() {
        var bugs = window.BugSim && window.BugSim.getBugData();
        if (bugs && bugs.length > 0) {
          var killCount = Math.ceil(bugs.length / 2);
          var indices = [];
          for (var i = 0; i < bugs.length; i++) indices.push(i);
          for (var i = indices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
          }
          var toKill = indices.slice(0, killCount).sort(function(a, b) { return b - a; });
          for (var i = 0; i < toKill.length; i++) {
            window.BugSim.killBug(toKill[i], 'Something wicked');
          }
        }
      }, killTimeout);

      
      setTimeout(function() {
        if (wickedImg.parentNode) wickedImg.remove();
        WICKED_ACTIVE = false;
      }, ZOOM_DURATION + 200);
    }

    
    if (wickedImg.complete && wickedImg.naturalWidth > 0) {
      
      requestAnimationFrame(function() { requestAnimationFrame(doSweep); });
    } else {
      wickedImg.onload = function() {
        requestAnimationFrame(function() { requestAnimationFrame(doSweep); });
      };
    }
  }

})();
