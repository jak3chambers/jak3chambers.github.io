(function () {
  'use strict';

  if (!window.THREE || !window.COBBLEMON_MUDKIP_GEOMETRY) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'message-creatures';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (_) {
    canvas.remove();
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 6, -6, 0.1, 100);
  camera.position.z = 20;
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  var keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
  keyLight.position.set(-4, 6, 10);
  scene.add(keyLight);

  var creatures = [];
  var mouse = new THREE.Vector2(0, 0);
  var worldWidth = 1;
  var worldHeight = 12;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  var CREATURE_COUNT = 28;
  var seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function makeCreature(modelRoot, index) {
    var creature = new THREE.Group();
    creature.add(modelRoot.clone(true));
    var perSide = CREATURE_COUNT / 2;
    var local = index % perSide;
    var col = local % 2;
    var rowIndex = Math.floor(local / 2);
    var rows = perSide / 2;
    creature.userData = { side: index < perSide ? 'left' : 'right',
      fx: (col + 0.15 + rand() * 0.7) / 2 * 0.86 + 0.07,
      fy: (rowIndex + 0.15 + rand() * 0.7) / rows * 0.92 + 0.04,
      phase: index * 1.1, baseY: 0, baseScale: 0.036 };
    scene.add(creature);
    return creature;
  }

  function screenPointToWorld(clientX, clientY) {
    return new THREE.Vector2(
      clientX / window.innerWidth * worldWidth - worldWidth / 2,
      worldHeight / 2 - clientY / window.innerHeight * worldHeight
    );
  }

  function layout() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var panel = document.querySelector('main').getBoundingClientRect();
    var leftSpace = panel.left;
    var rightSpace = width - panel.right;
    var narrow = width < 900 || Math.min(leftSpace, rightSpace) < 70;
    canvas.style.display = narrow ? 'none' : 'block';

    worldWidth = worldHeight * width / height;
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.top = worldHeight / 2;
    camera.bottom = -worldHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    creatures.forEach(function (creature, index) {
      var isLeft = creature.userData.side === 'left';
      var sideSpace = isLeft ? leftSpace : rightSpace;
      var pixelX = isLeft
        ? sideSpace * creature.userData.fx
        : panel.right + sideSpace * creature.userData.fx;
      var pixelY = height * creature.userData.fy;
      var target = screenPointToWorld(pixelX, pixelY);
      creature.position.set(target.x, target.y, 0);
      creature.userData.baseY = target.y;
      creature.scale.setScalar(creature.userData.baseScale * Math.min(1.35, Math.max(0.72, sideSpace / 240)));
    });
  }

  window.addEventListener('pointermove', function (event) {
    mouse.copy(screenPointToWorld(event.clientX, event.clientY));
  }, { passive: true });
  window.addEventListener('resize', layout);
  layout();

  function animate(time) {
    var seconds = time * 0.001;
    creatures.forEach(function (creature) {
      var dx = mouse.x - creature.position.x;
      var dy = mouse.y - creature.position.y;
      var targetYaw = Math.atan2(dx, 20);
      var yawDelta = Math.atan2(Math.sin(targetYaw - creature.rotation.y), Math.cos(targetYaw - creature.rotation.y));
      creature.rotation.y += yawDelta * 0.08;
      creature.rotation.x += (-Math.max(-0.45, Math.min(0.45, Math.atan2(dy, 24))) - creature.rotation.x) * 0.08;
      if (!reduceMotion) {
        creature.position.y = creature.userData.baseY + Math.sin(seconds * 1.3 + creature.userData.phase) * 0.035;
      }
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // ---- Adoption (right-click a mudkip) -------------------------------------
  // Saved in this browser only (localStorage), same as the messages. An
  // adoption lasts ADOPTION_DAYS, then the mudkip goes back to being unadopted.
  var ADOPTION_DAYS = 30;
  var STORE_KEY = 'mudkip-adoptions';
  var raycaster = new THREE.Raycaster();
  var pointerNdc = new THREE.Vector2();

  function loadAdoptions() {
    try {
      var data = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      var now = Date.now(), changed = false;
      Object.keys(data).forEach(function (key) {
        if (!data[key] || data[key].until <= now) { delete data[key]; changed = true; }
      });
      if (changed) localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return data;
    } catch (_) { return {}; }
  }
  function saveAdoption(index, owner, name) {
    var data = loadAdoptions();
    data[index] = { owner: owner, name: name, until: Date.now() + ADOPTION_DAYS * 86400000 };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  var style = document.createElement('style');
  style.textContent =
    '.mk-pop{position:fixed;z-index:1000;background:#ffa63f;color:#1d2f4a;border:2px solid #1d2f4a;border-radius:6px;box-shadow:0 3px 10px rgba(0,0,0,.3);font:14px "Comic Sans MS","Comic Sans",cursive;padding:6px}' +
    '.mk-pop button{font:inherit;color:inherit;background:#45a1de;border:1px solid #1d2f4a;border-radius:4px;padding:4px 10px;cursor:pointer}' +
    '.mk-pop button:disabled{opacity:.7;cursor:default}' +
    '.mk-pop label{display:block;margin:0 0 6px}' +
    '.mk-pop input{display:block;width:150px;margin-top:2px;font:inherit;padding:3px;border:1px solid #1d2f4a;border-radius:4px}' +
    '.mk-pop .mk-row{display:flex;gap:6px;justify-content:flex-end}' +
    '.mk-tip{position:fixed;z-index:1000;pointer-events:none;background:#1d2f4a;color:#fff;border-radius:6px;padding:4px 8px;font:13px "Comic Sans MS","Comic Sans",cursive;white-space:nowrap}';
  document.head.appendChild(style);

  var tip = document.createElement('div');
  tip.className = 'mk-tip';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  var popup = null;
  function closePopup() { if (popup) { popup.remove(); popup = null; } }
  function openPopup(x, y) {
    closePopup();
    popup = document.createElement('div');
    popup.className = 'mk-pop';
    document.body.appendChild(popup);
    popup.style.left = Math.min(x, window.innerWidth - 200) + 'px';
    popup.style.top = Math.min(y, window.innerHeight - 160) + 'px';
    return popup;
  }

  function creatureAt(clientX, clientY) {
    if (canvas.style.display === 'none') return -1;
    pointerNdc.set(clientX / window.innerWidth * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, camera);
    var best = -1, bestDist = Infinity;
    creatures.forEach(function (creature, index) {
      var hits = raycaster.intersectObject(creature, true);
      if (hits.length && hits[0].distance < bestDist) { best = index; bestDist = hits[0].distance; }
    });
    return best;
  }

  function showAdoptForm(index, x, y) {
    var box = openPopup(x, y);
    var owner = document.createElement('label');
    owner.textContent = 'Your name';
    var ownerInput = document.createElement('input');
    ownerInput.maxLength = 24;
    owner.appendChild(ownerInput);
    var name = document.createElement('label');
    name.textContent = 'Name your mudkip';
    var nameInput = document.createElement('input');
    nameInput.maxLength = 24;
    name.appendChild(nameInput);
    var row = document.createElement('div');
    row.className = 'mk-row';
    var cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    var save = document.createElement('button');
    save.textContent = 'Adopt';
    row.appendChild(cancel);
    row.appendChild(save);
    box.appendChild(owner);
    box.appendChild(name);
    box.appendChild(row);
    ownerInput.focus();
    cancel.addEventListener('click', closePopup);
    function submit() {
      var o = ownerInput.value.trim(), n = nameInput.value.trim();
      if (!o) { ownerInput.focus(); return; }
      if (!n) { nameInput.focus(); return; }
      saveAdoption(index, o, n);
      closePopup();
    }
    save.addEventListener('click', submit);
    box.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') submit();
      if (event.key === 'Escape') closePopup();
    });
  }

  window.addEventListener('contextmenu', function (event) {
    var index = creatureAt(event.clientX, event.clientY);
    if (index < 0) return;
    event.preventDefault();
    tip.style.display = 'none';
    var adoption = loadAdoptions()[index];
    var box = openPopup(event.clientX, event.clientY);
    var button = document.createElement('button');
    if (adoption) {
      var days = Math.ceil((adoption.until - Date.now()) / 86400000);
      button.textContent = 'Adopted (' + days + 'd left)';
      button.disabled = true;
    } else {
      button.textContent = 'Adopt?';
      button.addEventListener('click', function () { showAdoptForm(index, event.clientX, event.clientY); });
    }
    box.appendChild(button);
  });
  window.addEventListener('pointerdown', function (event) {
    if (popup && !popup.contains(event.target)) closePopup();
  });
  window.addEventListener('keydown', function (event) { if (event.key === 'Escape') closePopup(); });

  var tipPending = false;
  window.addEventListener('pointermove', function (event) {
    if (tipPending) return;
    tipPending = true;
    requestAnimationFrame(function () {
      tipPending = false;
      var index = creatureAt(event.clientX, event.clientY);
      var adoption = index >= 0 ? loadAdoptions()[index] : null;
      if (!adoption) { tip.style.display = 'none'; return; }
      tip.textContent = adoption.name + ' - owned by ' + adoption.owner;
      tip.style.display = 'block';
      tip.style.left = (event.clientX + 14) + 'px';
      tip.style.top = (event.clientY + 14) + 'px';
    });
  }, { passive: true });

  var textureLoader = new THREE.TextureLoader();
  textureLoader.load('src/mudkip.png', function (texture) {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
    var modelRoot = makeModelRoot(texture);
    for (var i = 0; i < CREATURE_COUNT; i++) creatures.push(makeCreature(modelRoot, i));
    window.messageCreatures = creatures;
    layout();
    requestAnimationFrame(animate);
  }, undefined, function () {
    canvas.remove();
  });
})();