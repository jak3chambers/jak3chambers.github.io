





(function () {
  'use strict';

  
  var EYE_R        = 10;   
  var PUPIL_R      = 5;    
  var GRAVITY      = 0.4;  
  var DAMPING      = 0.88; 
  var ACCEL_MULT   = 1.8;  
  var BOUNCE       = 0.5;  
  var MAX_R        = EYE_R - PUPIL_R; 

  var enabled  = false;
  var eyeData  = [];       
  var rafId    = null;

  
  function getBugData() {
    return (window.BugSim && window.BugSim.getBugData) ? window.BugSim.getBugData() : [];
  }
  function getBugSize() {
    var base = window.matchMedia('(hover: hover) and (pointer: fine)').matches ? 75 : 55;
    if (window.WalkMode && window.WalkMode.isEnabled()) {
      return Math.round(base * 0.45);
    }
    return base;
  }

  
  function createEyeEl() {
    var eye = document.createElement('div');
    eye.className = 'googly-eye';
    var pupil = document.createElement('div');
    pupil.className = 'googly-pupil';
    eye.appendChild(pupil);
    return { eye: eye, pupil: pupil };
  }

  
  function attachEyes(bugEntry) {
    if (!bugEntry || !bugEntry.element) return;
    
    for (var i = 0; i < eyeData.length; i++) {
      if (eyeData[i].bug === bugEntry) return;
    }

    var container = document.querySelector('.bugs-container');
    if (!container) return;

    var left  = createEyeEl();
    var right = createEyeEl();
    container.appendChild(left.eye);
    container.appendChild(right.eye);

    eyeData.push({
      bug: bugEntry,
      leftEye: left.eye,   rightEye: right.eye,
      leftPupil: left.pupil, rightPupil: right.pupil,
      
      lpx: 0, lpy: 0, lpvx: 0, lpvy: 0,
      rpx: 0, rpy: 0, rpvx: 0, rpvy: 0,
      
      prevDx: bugEntry.dx || 0,
      prevDy: bugEntry.dy || 0
    });
  }

  
  function detachEyes(bugEntry) {
    for (var i = eyeData.length - 1; i >= 0; i--) {
      if (eyeData[i].bug === bugEntry) {
        eyeData[i].leftEye.remove();
        eyeData[i].rightEye.remove();
        eyeData.splice(i, 1);
      }
    }
  }

  
  function clampPupil(px, py, vx, vy, maxR) {
    if (maxR === undefined) maxR = MAX_R;
    var dist = Math.sqrt(px * px + py * py);
    if (dist > MAX_R) {
      
      var nx = px / dist;
      var ny = py / dist;
      px = nx * MAX_R;
      py = ny * MAX_R;
      
      var dot = vx * nx + vy * ny;
      vx -= 2 * dot * nx;
      vy -= 2 * dot * ny;
      vx *= BOUNCE;
      vy *= BOUNCE;
    }
    return { px: px, py: py, vx: vx, vy: vy };
  }

  
  function tick() {
    if (!enabled) { rafId = null; return; }
    
    
    if (window.BugSim && window.BugSim._getAnimationRunning && !window.BugSim._getAnimationRunning()) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    var bugSize = getBugSize();
    var bugs = getBugData();

    
    var scale = bugSize / 75;
    var eyeDia = Math.round(EYE_R * 2 * scale);
    var pupilDia = Math.round(PUPIL_R * 2 * scale);
    var maxR = (EYE_R - PUPIL_R) * scale;

    
    for (var i = eyeData.length - 1; i >= 0; i--) {
      var ed = eyeData[i];
      if (!ed.bug.element || !ed.bug.element.parentNode) {
        ed.leftEye.remove();
        ed.rightEye.remove();
        eyeData.splice(i, 1);
        continue;
      }
    }

    
    for (var j = 0; j < bugs.length; j++) {
      attachEyes(bugs[j]);
    }

    
    for (var k = 0; k < eyeData.length; k++) {
      var e = eyeData[k];
      var b = e.bug;

      
      var ax = (b.dx || 0) - e.prevDx;
      var ay = (b.dy || 0) - e.prevDy;
      e.prevDx = b.dx || 0;
      e.prevDy = b.dy || 0;

      
      var forceX = -ax * ACCEL_MULT;
      var forceY = -ay * ACCEL_MULT + GRAVITY;

      
      e.lpvx += forceX;
      e.lpvy += forceY;
      e.lpvx *= DAMPING;
      e.lpvy *= DAMPING;
      e.lpx += e.lpvx;
      e.lpy += e.lpvy;
      var lc = clampPupil(e.lpx, e.lpy, e.lpvx, e.lpvy, maxR);
      e.lpx = lc.px; e.lpy = lc.py; e.lpvx = lc.vx; e.lpvy = lc.vy;

      
      e.rpvx += forceX;
      e.rpvy += forceY;
      e.rpvx *= DAMPING;
      e.rpvy *= DAMPING;
      e.rpx += e.rpvx;
      e.rpy += e.rpvy;
      var rc = clampPupil(e.rpx, e.rpy, e.rpvx, e.rpvy, maxR);
      e.rpx = rc.px; e.rpy = rc.py; e.rpvx = rc.vx; e.rpvy = rc.vy;

      
      e.leftEye.style.width   = eyeDia + 'px';
      e.leftEye.style.height  = eyeDia + 'px';
      e.rightEye.style.width  = eyeDia + 'px';
      e.rightEye.style.height = eyeDia + 'px';
      e.leftPupil.style.width      = pupilDia + 'px';
      e.leftPupil.style.height     = pupilDia + 'px';
      e.leftPupil.style.marginLeft = (-pupilDia / 2) + 'px';
      e.leftPupil.style.marginTop  = (-pupilDia / 2) + 'px';
      e.rightPupil.style.width      = pupilDia + 'px';
      e.rightPupil.style.height     = pupilDia + 'px';
      e.rightPupil.style.marginLeft = (-pupilDia / 2) + 'px';
      e.rightPupil.style.marginTop  = (-pupilDia / 2) + 'px';

      
      
      var eyeOffsetX = bugSize * 0.18;
      var eyeY = b.y + bugSize * 0.22;
      var centerX = b.x + bugSize / 2;

      e.leftEye.style.left  = (centerX - eyeOffsetX) + 'px';
      e.leftEye.style.top   = eyeY + 'px';
      e.rightEye.style.left = (centerX + eyeOffsetX) + 'px';
      e.rightEye.style.top  = eyeY + 'px';

      
      e.leftPupil.style.transform  = 'translate(' + e.lpx + 'px,' + e.lpy + 'px)';
      e.rightPupil.style.transform = 'translate(' + e.rpx + 'px,' + e.rpy + 'px)';
    }

    rafId = requestAnimationFrame(tick);
  }

  
  function enable() {
    if (enabled) return;
    enabled = true;
    var bugs = getBugData();
    for (var i = 0; i < bugs.length; i++) attachEyes(bugs[i]);
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function disable() {
    enabled = false;
    for (var i = eyeData.length - 1; i >= 0; i--) {
      eyeData[i].leftEye.remove();
      eyeData[i].rightEye.remove();
    }
    eyeData.length = 0;
  }

  function toggle() {
    if (enabled) disable(); else enable();
    return enabled;
  }

  function isEnabled() { return enabled; }

  window.GooglyEyes = {
    enable: enable,
    disable: disable,
    toggle: toggle,
    isEnabled: isEnabled
  };
})();
