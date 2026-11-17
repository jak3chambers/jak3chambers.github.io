




(function () {
  'use strict';

  var METEOR_COUNT   = 120;      
  var SPAWN_WINDOW   = 20000;    
  var BASE_FALL_MS   = 800;     
  var running        = false;

  
  
  
  var TIERS = [
    { weight: 5,  scale: 0.5, label: 'tiny'   },
    { weight: 4,  scale: 0.8,  label: 'small'  },
    { weight: 3,  scale: 1.0,  label: 'medium' },
    { weight: 2,  scale: 1.7,  label: 'large'  },
    { weight: 1,  scale: 2.9,  label: 'huge'   }
  ];

  
  var REF = {
    headSize:    20,    
    tailWidth:   7,     
    tailLength:  120,   
    blastRadius: 140,   
    launchV:     40,    
    shakePx:     4,     
    shakeMs:     200,   
    sparkCount:  14,    
    sparkDist:   80,    
    smokeCount:  4,     
    smokeSize:   30,    
    ringSize:    24,    
    ringScale:   9,     
    flashSize:   60     
  };

  
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function pickTier() {
    var total = 0;
    for (var i = 0; i < TIERS.length; i++) total += TIERS[i].weight;
    var r = Math.random() * total;
    for (var j = 0; j < TIERS.length; j++) {
      r -= TIERS[j].weight;
      if (r <= 0) return TIERS[j];
    }
    return TIERS[2]; 
  }

  function getPlayfield() {
    var c = document.querySelector('.bugs-container');
    if (c) return { w: c.clientWidth, h: c.clientHeight };
    return { w: window.innerWidth, h: window.innerHeight };
  }

  function getBugData() {
    return (window.BugSim && window.BugSim.getBugData) ? window.BugSim.getBugData() : [];
  }

  function getBugSize() {
    var desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return desktop ? 75 : 55;
  }

  
  function shake(scale) {
    var px = Math.round(REF.shakePx * scale);
    var ms = Math.round(REF.shakeMs * Math.max(scale, 0.6));
    var body = document.body;
    
    if (body.classList.contains('meteor-shaking')) {
      var cur = parseFloat(body.style.getPropertyValue('--meteor-shake')) || 0;
      if (px <= cur) return;
      body.classList.remove('meteor-shaking');
      void body.offsetWidth; 
    }
    body.style.setProperty('--meteor-shake', px + 'px');
    body.style.setProperty('--meteor-shake-ms', ms + 'ms');
    body.classList.add('meteor-shaking');
    setTimeout(function () { body.classList.remove('meteor-shaking'); }, ms);
  }

  
  function spawnExplosion(x, y, scale, container) {
    
    var flash = document.createElement('div');
    flash.className = 'meteor-flash';
    var fs = Math.round(REF.flashSize * scale);
    flash.style.left = x + 'px';
    flash.style.top  = y + 'px';
    flash.style.width = fs + 'px';
    flash.style.height = fs + 'px';
    container.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 350);

    
    var ring = document.createElement('div');
    ring.className = 'meteor-blast-ring';
    var rs = Math.round(REF.ringSize * scale);
    ring.style.left = x + 'px';
    ring.style.top  = y + 'px';
    ring.style.width = rs + 'px';
    ring.style.height = rs + 'px';
    ring.style.setProperty('--ring-expand', REF.ringScale * scale);
    ring.style.borderWidth = Math.max(2, Math.round(3 * scale)) + 'px';
    container.appendChild(ring);
    setTimeout(function () { ring.remove(); }, 600);

    
    var sparkN = Math.round(REF.sparkCount * scale);
    var sparkD = REF.sparkDist * scale;
    for (var i = 0; i < sparkN; i++) {
      var p = document.createElement('div');
      p.className = 'meteor-spark';
      var angle = (Math.PI * 2 / sparkN) * i + rand(-0.3, 0.3);
      var dist  = rand(sparkD * 0.3, sparkD);
      var sz = Math.max(3, Math.round(5 * scale));
      p.style.left = x + 'px';
      p.style.top  = y + 'px';
      p.style.width = sz + 'px';
      p.style.height = sz + 'px';
      p.style.setProperty('--sx', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--sy', (Math.sin(angle) * dist) + 'px');
      p.style.animationDuration = (0.35 + scale * 0.25) + 's';
      container.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 800); })(p);
    }

    
    var smokeN = Math.round(REF.smokeCount * scale);
    var smokeS = REF.smokeSize * scale;
    for (var s = 0; s < smokeN; s++) {
      var sm = document.createElement('div');
      sm.className = 'meteor-smoke';
      sm.style.left = (x + rand(-smokeS * 0.6, smokeS * 0.6)) + 'px';
      sm.style.top  = (y + rand(-smokeS * 0.3, smokeS * 0.1)) + 'px';
      sm.style.width = smokeS + 'px';
      sm.style.height = smokeS + 'px';
      sm.style.animationDelay = (s * 0.07) + 's';
      sm.style.animationDuration = (0.45 + scale * 0.3) + 's';
      container.appendChild(sm);
      (function (el) { setTimeout(function () { el.remove(); }, 900); })(sm);
    }
  }

  
  function launchNearbyBugs(ix, iy, scale) {
    var bugs = getBugData();
    var size = getBugSize();
    var halfSize = size / 2;
    var radius = REF.blastRadius * scale;
    var launchV = REF.launchV * scale;

    for (var i = 0; i < bugs.length; i++) {
      var b = bugs[i];
      var bx = b.x + halfSize;
      var by = b.y + halfSize;
      var dx = bx - ix;
      var dy = by - iy;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        var angle = Math.atan2(dy, dx);
        var power = launchV * (1 - dist / radius);
        b.dx += Math.cos(angle) * power;
        b.dy += Math.sin(angle) * power - (10 * scale); 
      }
    }
  }

  
  function spawnMeteor(container) {
    var pf = getPlayfield();
    var tier = pickTier();
    var s = tier.scale;

    var meteor = document.createElement('div');
    meteor.className = 'meteor';

    
    var tail = document.createElement('div');
    tail.className = 'meteor-tail';
    var tw = Math.round(REF.tailWidth * s);
    var tl = Math.round(REF.tailLength * s);
    tail.style.width  = tw + 'px';
    tail.style.height = tl + 'px';
    tail.style.left   = (-tw / 2) + 'px';
    tail.style.top    = (-tl) + 'px';
    tail.style.filter = 'blur(' + Math.max(1, 1.5 * s) + 'px)';
    meteor.appendChild(tail);

    
    var head = document.createElement('div');
    head.className = 'meteor-head';
    var hs = Math.round(REF.headSize * s);
    head.style.width  = hs + 'px';
    head.style.height = hs + 'px';
    head.style.left   = (-hs / 2) + 'px';
    head.style.top    = (-hs / 2) + 'px';
    head.style.boxShadow = '0 0 ' + Math.round(14 * s) + 'px ' + Math.round(6 * s) + 'px rgba(255,150,30,.9), ' +
                           '0 0 ' + Math.round(30 * s) + 'px ' + Math.round(10 * s) + 'px rgba(255,80,0,.5)';
    meteor.appendChild(head);

    
    var landX = rand(40, pf.w - 40);
    var drift = rand(-140, 140);
    var startX = landX - drift;
    var startY = -hs - tl;
    var landY = pf.h - 4;

    meteor.style.left = startX + 'px';
    meteor.style.top  = startY + 'px';

    
    var ang = Math.atan2(landY - startY, landX - startX);
    var deg = (ang * 180 / Math.PI) - 90;
    meteor.style.setProperty('--meteor-angle', deg + 'deg');

    container.appendChild(meteor);

    
    var duration = BASE_FALL_MS + rand(-100, 150) - (s - 1) * 80;
    var startTime = performance.now();

    function tick(now) {
      var t = Math.min((now - startTime) / duration, 1);
      var ease = t * t; 
      var cx = startX + (landX - startX) * ease;
      var cy = startY + (landY - startY) * ease;
      meteor.style.left = cx + 'px';
      meteor.style.top  = cy + 'px';

      
      meteor.style.opacity = 0.4 + 0.6 * t;

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        
        meteor.remove();
        spawnExplosion(landX, landY, s, container);
        launchNearbyBugs(landX, landY, s);
        shake(s);
      }
    }
    requestAnimationFrame(tick);
  }

  
  function startMeteorShower() {
    if (running) return;
    var container = document.querySelector('.bugs-container');
    if (!container) return;

    running = true;

    var layer = document.createElement('div');
    layer.className = 'meteor-layer';
    container.appendChild(layer);

    for (var i = 0; i < METEOR_COUNT; i++) {
      (function (delay) {
        setTimeout(function () { spawnMeteor(layer); }, delay);
      })(rand(0, SPAWN_WINDOW));
    }

    setTimeout(function () {
      if (layer.parentNode) layer.remove();
      running = false;
    }, SPAWN_WINDOW + BASE_FALL_MS + 2500);
  }

  
  window.MeteorShower = {
    start: startMeteorShower,
    isActive: function() { return running; }
  };
})();
