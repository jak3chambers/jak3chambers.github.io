/* ===========================================================
   mascot.js - jak3chambers the mudkip (top-left corner of the home page)

   Uses the SAME mudkip model and texture as the staff page:
     three.js r128 (loaded in index.html), js/mudkip-model.js, media/mudkip/mudkip.png
   Words, timing and size live in mascot-config.js - you shouldn't need to
   edit this file.

   Safe to fail: if the 3D model can't load he turns into a flat drawing
   (or disappears if fallbackAvatar is false). The rest of the page is never
   affected.
   =========================================================== */
(function () {
  'use strict';

  var CFG = Object.assign({
    name: 'jak3chambers', size: 88, faceMouse: true, texture: 'media/mudkip/mudkip.png',
    firstLineDelaySeconds: 2.5, minSecondsBetween: 14, maxSecondsBetween: 32, showSeconds: 6,
    fallbackAvatar: true
  }, window.MASCOT_CONFIG || {});

  var lang = window.SITE_LANGUAGE === 'ca' ? 'ca' : 'en';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function textsFor(group) {
    var g = CFG[group];
    if (!g) return [];
    var list = g[lang] || g.en || [];
    return Array.isArray(list) ? list : [list];
  }

  /* ---------- DOM + styles ---------- */
  var header = document.querySelector('header');
  if (!header) return;

  var style = document.createElement('style');
  style.textContent =
    '#mascot{position:relative;flex:0 0 auto;width:' + CFG.size + 'px;height:' + CFG.size + 'px;z-index:20}' +
    '#mascot-btn{position:relative;display:block;width:100%;height:100%;padding:0;margin:0;border:0;background:none;cursor:pointer;font:inherit;-webkit-tap-highlight-color:transparent}' +
    '#mascot-btn:focus-visible{outline:2px solid var(--mew-hi,#f0a1c5);outline-offset:2px}' +
    '#mascot-canvas,#mascot-fallback{display:block;width:100%;height:100%}' +
    '#mascot-name{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;padding:0 6px;' +
      'font:bold 11px/16px "Liberation Sans",Arial,sans-serif;background:var(--mew-bar,#b24e7b);color:var(--mew-bar-text,#ffdada);' +
      'border:1px solid;border-color:var(--mew-hi,#f0a1c5) var(--mew-lo,#621f41) var(--mew-lo,#621f41) var(--mew-hi,#f0a1c5);pointer-events:none}' +
    '#mascot-bubble{position:absolute;left:calc(100% + 10px);top:6px;z-index:30;width:max-content;max-width:min(340px,calc(100vw - 150px));' +
      'padding:6px 10px;background:var(--mew-panel,#ffdada);color:var(--mew-panel-text,#250025);' +
      'border:2px solid;border-color:var(--mew-hi,#f0a1c5) var(--mew-lo,#621f41) var(--mew-lo,#621f41) var(--mew-hi,#f0a1c5);' +
      'font:14px/1.35 "Liberation Sans",Arial,sans-serif;opacity:0;visibility:hidden;transform:translateY(4px);pointer-events:none;' +
      'transition:opacity .15s,transform .15s,visibility 0s .15s}' +
    '#mascot-bubble.on{opacity:1;visibility:visible;transform:none;transition-delay:0s}' +
    '#mascot-bubble::before{content:"";position:absolute;left:-9px;top:8px;border:7px solid transparent;border-left-width:0;border-right-color:var(--mew-lo,#621f41)}' +
    '#mascot-bubble::after{content:"";position:absolute;left:-6px;top:10px;border:5px solid transparent;border-left-width:0;border-right-color:var(--mew-panel,#ffdada)}' +
    '@keyframes mascot-hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}' +
    '#mascot-fallback.hop{animation:mascot-hop .45s ease-out}' +
    '@media (max-width:700px){#mascot-bubble{left:0;top:calc(100% + 6px);max-width:calc(100vw - 24px)}' +
      '#mascot-bubble::before,#mascot-bubble::after{display:none}}' +
    '@media (prefers-reduced-motion:reduce){#mascot-bubble{transition:none}#mascot-fallback.hop{animation:none}}';
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.id = 'mascot';
  var btn = document.createElement('button');
  btn.id = 'mascot-btn';
  btn.type = 'button';
  btn.title = CFG.name;
  btn.setAttribute('aria-label', (lang === 'ca' ? 'Parla amb ' : 'Talk to ') + CFG.name);
  var nameTag = document.createElement('span');
  nameTag.id = 'mascot-name';
  nameTag.textContent = CFG.name;
  var bubble = document.createElement('div');
  bubble.id = 'mascot-bubble';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');
  btn.appendChild(nameTag);
  wrap.appendChild(btn);
  wrap.appendChild(bubble);
  header.insertBefore(wrap, header.firstChild);

  /* ---------- talking ---------- */
  var hopHook = function () {};        // replaced once the 3D (or flat) avatar exists
  var hideTimer = 0, talkTimer = 0, lastLine = '';

  function pick(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    var line;
    do { line = list[Math.floor(Math.random() * list.length)]; } while (line === lastLine);
    return line;
  }
  function hideBubble() { bubble.classList.remove('on'); }
  function say(line, seconds) {
    if (!line) return;
    lastLine = line;
    bubble.textContent = line;
    bubble.classList.add('on');
    hopHook();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideBubble, (seconds || CFG.showSeconds) * 1000);
  }
  function scheduleNext() {
    clearTimeout(talkTimer);
    var min = CFG.minSecondsBetween, max = Math.max(min, CFG.maxSecondsBetween);
    talkTimer = setTimeout(function () {
      if (!document.hidden && !bubble.classList.contains('on')) say(pick(textsFor('lines')));
      scheduleNext();
    }, (min + Math.random() * (max - min)) * 1000);
  }
  function startTalking() {
    var greeting = textsFor('greeting')[0];
    setTimeout(function () { if (greeting) say(greeting); }, CFG.firstLineDelaySeconds * 1000);
    scheduleNext();
  }
  btn.addEventListener('click', function () {
    var list = textsFor('clickLines');
    say(pick(list.length ? list : textsFor('lines')));
    scheduleNext();
  });

  /* ---------- flat fallback drawing ---------- */
  function showFallback(reason) {
    if (reason && window.console) console.warn('[mascot] using flat mudkip:', reason);
    var canvas = document.getElementById('mascot-canvas');
    if (canvas) canvas.remove();
    if (!CFG.fallbackAvatar) { wrap.remove(); return; }
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.id = 'mascot-fallback';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<path d="M18 64 L4 52 L8 72 Z" fill="#2f6fb5"/>' +
      '<ellipse cx="52" cy="62" rx="32" ry="24" fill="#4aa3df"/>' +
      '<ellipse cx="52" cy="72" rx="20" ry="11" fill="#e9f1f7"/>' +
      '<path d="M40 40 L50 14 L60 40 Z" fill="#2f6fb5"/>' +
      '<path d="M24 56 L8 44 L14 62 Z" fill="#f4a43a"/>' +
      '<path d="M80 56 L96 44 L90 62 Z" fill="#f4a43a"/>' +
      '<ellipse cx="40" cy="55" rx="4.5" ry="6" fill="#1b2a41"/><ellipse cx="64" cy="55" rx="4.5" ry="6" fill="#1b2a41"/>' +
      '<circle cx="41.5" cy="52.5" r="1.7" fill="#fff"/><circle cx="65.5" cy="52.5" r="1.7" fill="#fff"/>' +
      '<path d="M44 68 Q52 74 60 68" fill="none" stroke="#1b2a41" stroke-width="2.2" stroke-linecap="round"/>';
    btn.insertBefore(svg, nameTag);
    hopHook = function () {
      if (reduceMotion) return;
      svg.classList.remove('hop');
      void svg.getBoundingClientRect();
      svg.classList.add('hop');
    };
  }

  /* ---------- the real 3D mudkip (same model code as mudkips.js) ---------- */
  function start3D() {
    var canvas = document.createElement('canvas');
    canvas.id = 'mascot-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    btn.insertBefore(canvas, nameTag);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(CFG.size, CFG.size, false);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.z = 20;
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    var keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
    keyLight.position.set(-4, 6, 10);
    scene.add(keyLight);

    var geometryData = window.COBBLEMON_MUDKIP_GEOMETRY['minecraft:geometry'][0];
    var textureSize = geometryData.description;

    function faceRectangles(uv, size) {
      var u = uv[0], v = uv[1], width = size[0], height = size[1], depth = size[2];
      return [
        { x: u + depth + width, y: v + depth, width: depth, height: height },
        { x: u, y: v + depth, width: depth, height: height },
        { x: u + depth, y: v, width: width, height: depth },
        { x: u + depth + width, y: v, width: width, height: depth },
        { x: u + depth + width + depth, y: v + depth, width: width, height: height },
        { x: u + depth, y: v + depth, width: width, height: height }
      ];
    }

    function makeFaceMaterial(texture, rectangle, mirrored) {
      var faceTexture = texture.clone();
      faceTexture.magFilter = THREE.NearestFilter;
      faceTexture.minFilter = THREE.NearestFilter;
      faceTexture.generateMipmaps = false;
      faceTexture.wrapS = THREE.ClampToEdgeWrapping;
      faceTexture.wrapT = THREE.ClampToEdgeWrapping;
      var u = rectangle.x / textureSize.texture_width;
      var width = rectangle.width / textureSize.texture_width;
      faceTexture.repeat.set(mirrored ? -width : width, rectangle.height / textureSize.texture_height);
      faceTexture.offset.set(mirrored ? u + width : u, 1 - (rectangle.y + rectangle.height) / textureSize.texture_height);
      faceTexture.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 1, side: THREE.DoubleSide });
    }

    function makeModelRoot(texture) {
      var model = new THREE.Group();
      model.rotation.y = Math.PI;
      model.position.y = -9;
      var bones = {};
      var pivots = {};
      var hiddenExpression = /^(eye_(angry|sad)|eyelid_(happy|recoil))_/;

      geometryData.bones.forEach(function (bone) {
        if (hiddenExpression.test(bone.name)) return;
        var pivot = bone.pivot || [0, 0, 0];
        var parent = bone.parent ? bones[bone.parent] : model;
        var parentPivot = bone.parent ? pivots[bone.parent] || [0, 0, 0] : [0, 0, 0];
        if (!parent) return;

        var boneGroup = new THREE.Group();
        boneGroup.position.set(pivot[0] - parentPivot[0], pivot[1] - parentPivot[1], pivot[2] - parentPivot[2]);
        if (bone.rotation) {
          boneGroup.rotation.set(
            THREE.MathUtils.degToRad(bone.rotation[0]),
            THREE.MathUtils.degToRad(bone.rotation[1]),
            THREE.MathUtils.degToRad(bone.rotation[2]),
            'XYZ'
          );
        }
        parent.add(boneGroup);
        bones[bone.name] = boneGroup;
        pivots[bone.name] = pivot;

        (bone.cubes || []).forEach(function (cube) {
          if (!Array.isArray(cube.uv)) return;
          var origin = cube.origin;
          var size = cube.size;
          var inflate = cube.inflate || 0;
          var width = Math.max(0.025, size[0] + inflate * 2);
          var height = Math.max(0.025, size[1] + inflate * 2);
          var depth = Math.max(0.025, size[2] + inflate * 2);
          var box = new THREE.BoxGeometry(width, height, depth);
          var material = faceRectangles(cube.uv, size).map(function (rectangle) {
            return makeFaceMaterial(texture, rectangle, !!cube.mirror);
          });
          var mesh = new THREE.Mesh(box, material);
          mesh.position.set(
            origin[0] + size[0] / 2 - pivot[0],
            origin[1] + size[1] / 2 - pivot[1],
            origin[2] + size[2] / 2 - pivot[2]
          );
          boneGroup.add(mesh);
        });
      });
      return model;
    }

    new THREE.TextureLoader().load(CFG.texture, function (texture) {
      try {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;

        var model = makeModelRoot(texture);
        var holder = new THREE.Group();     // turns, bobs and hops
        holder.add(model);
        scene.add(holder);

        // centre the model and scale it to fill the little canvas, whatever its size
        model.updateMatrixWorld(true);
        var box = new THREE.Box3().setFromObject(model);
        var size = new THREE.Vector3();
        var center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        model.position.sub(center);
        holder.scale.setScalar(1.6 / Math.max(size.x, size.y, size.z * 0.7, 0.001));

        var pointer = null;
        window.addEventListener('pointermove', function (event) {
          pointer = { x: event.clientX, y: event.clientY };
        }, { passive: true });

        var hopStart = -1;
        hopHook = function () { if (!reduceMotion) hopStart = performance.now(); };

        function frame(now) {
          requestAnimationFrame(frame);
          if (document.hidden) return;
          var yawTarget = 0, pitchTarget = 0;
          if (CFG.faceMouse && pointer) {
            var rect = canvas.getBoundingClientRect();
            var dx = pointer.x - (rect.left + rect.width / 2);
            var dy = pointer.y - (rect.top + rect.height / 2);
            yawTarget = Math.max(-0.9, Math.min(0.9, Math.atan2(dx, 400) * 1.4));
            pitchTarget = Math.max(-0.35, Math.min(0.35, Math.atan2(dy, 500)));
          }
          holder.rotation.y += (yawTarget - holder.rotation.y) * 0.08;
          holder.rotation.x += (pitchTarget - holder.rotation.x) * 0.08;

          var y = 0;
          if (!reduceMotion) y += Math.sin(now * 0.0013) * 0.03;
          if (hopStart >= 0) {
            var t = (now - hopStart) / 450;
            if (t >= 1) hopStart = -1; else y += Math.sin(Math.PI * t) * 0.16;
          }
          holder.position.y = y;
          renderer.render(scene, camera);
        }
        requestAnimationFrame(frame);
      } catch (error) {
        showFallback(error && error.message);
      }
    }, undefined, function () {
      showFallback('could not load ' + CFG.texture);
    });
  }

  if (window.THREE && window.COBBLEMON_MUDKIP_GEOMETRY) {
    try { start3D(); } catch (error) { showFallback(error && error.message); }
  } else {
    showFallback('three.js or js/mudkip-model.js not loaded');
  }
  startTalking();
})();
