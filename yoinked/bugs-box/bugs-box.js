/* ===========================================================
   bugs-box.js  –  the bouncing-bugs box, extracted from 28awesomebugs.org

   Needs: bugs-config.js (loaded first) + bugs-box.css.
   No other libraries. The physics, drag-and-throw and click popup are
   ported 1:1 from the original script; the shop / boss / theme / audio
   code is gone.

   USAGE
     <div class="bugs-container" style="height:500px"></div>
     <script src="bugs-config.js"></script>
     <script src="bugs-box.js"></script>

   Every .bugs-container on the page starts automatically. To start one by
   hand (or with different settings):
     const box = BugsBox.init(element, { gravity: 0, count: 10 });
     box.freeze(); box.unfreeze(); box.setCount(40); box.destroy();
     box.settings.gravity = 0.3;   // live-tweak physics
   =========================================================== */
(function () {
  'use strict';

  var DRAG_PULL_STRENGTH = 0.25;
  var DRAG_PULL_MAX = 12;
  var DRAG_DAMPING = 0.9;
  var DRAG_SLACK = 12;
  var DRAG_HISTORY_SIZE = 8;
  var DRAG_HISTORY_MAX_AGE = 200; // ms
  var THROW_SCALE = 16;
  var THROW_CAP = 35;
  var CLICK_MOVE_TOLERANCE = 5;   // px: moving more than this = a drag, not a click

  var uidCounter = 1;

  function init(container, overrides) {
    if (!container || container._bugsBox) return container && container._bugsBox;

    var cfg = Object.assign({}, window.BUGS_CONFIG || {}, overrides || {});
    var settings = {
      gravity: cfg.gravity != null ? cfg.gravity : 0.1,
      bounciness: cfg.bounciness != null ? cfg.bounciness : 0.9,
      friction: cfg.friction != null ? cfg.friction : 0.9999,
      maxSpeed: cfg.maxSpeed != null ? cfg.maxSpeed : 60,
      speedCapEnabled: cfg.speedCapEnabled !== false
    };
    var dragEnabled = cfg.drag !== false;
    var infoEnabled = cfg.clickInfo !== false;
    var hatsEnabled = false;
    var roster = (cfg.bugs && cfg.bugs.length) ? cfg.bugs : [{ image: '', name: 'Bug', story: '', birthday: '' }];

    var bugData = [];
    var running = true;
    var rafId = 0;
    var playW = container.clientWidth;
    var playH = container.clientHeight;
    var desktopMQ = window.matchMedia('(max-width: 768px)');
    var getSize = function () { return desktopMQ.matches ? (cfg.mobileSize || 55) : (cfg.size || 75); };

    /* ---------- click popup ---------- */
    var infoBox = document.createElement('div'), infoOpen = false;
    infoBox.className = 'bug-info-box';
    infoBox.innerHTML =
      '<div class="bug-info-header"><img class="bug-info-portrait" src="" alt="">' +
      '<span class="bug-info-name"></span></div>' +
      '<div class="bug-info-body"><p class="bug-info-story"></p>' +
      '<span class="bug-info-born"></span></div>';
    container.appendChild(infoBox);

    function fillInfo(bug) {
      infoBox.querySelector('.bug-info-portrait').src = bug.currentSrc || bug.src;
      var nameEl = infoBox.querySelector('.bug-info-name');
      nameEl.textContent = bug.dataset.bugName;
      nameEl.classList.toggle('shiny-name', bug.classList.contains('shiny'));
      infoBox.querySelector('.bug-info-story').textContent = bug.dataset.bugStory;
      var birthdayLabel = window.SITE_LANGUAGE === 'ca' ? 'Aniversari: ' : 'Born: ';
      var birthday = bug.dataset.bugBirthday;
      if (window.SITE_LANGUAGE === 'ca' && /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(birthday)) {
        var parsedBirthday = new Date(birthday);
        if (!isNaN(parsedBirthday.getTime())) {
          birthday = new Intl.DateTimeFormat('ca-ES', { dateStyle: 'long' }).format(parsedBirthday);
        }
      }
      infoBox.querySelector('.bug-info-born').textContent = birthday ? birthdayLabel + birthday : '';
    }

    function clearInfoHandlers() {
      if (infoBox._onOpen) { infoBox.removeEventListener('animationend', infoBox._onOpen); infoBox._onOpen = null; }
      if (infoBox._onClose) { infoBox.removeEventListener('animationend', infoBox._onClose); infoBox._onClose = null; }
    }

    function showInfo(bug) {
      if (!infoBox) return;
      clearInfoHandlers();

      if (infoOpen && infoBox.style.display !== 'none') {
        // already open: swap content with the line-sweep effect
        infoBox.classList.remove('crt-opening', 'crt-closing');
        var oldH = infoBox.offsetHeight;
        infoBox.style.height = oldH + 'px';
        fillInfo(bug);
        infoBox.classList.remove('crt-swapping');
        void infoBox.offsetWidth;
        infoBox.classList.add('crt-swapping');
        infoBox.style.height = 'auto';
        var newH = infoBox.offsetHeight;
        infoBox.style.height = oldH + 'px';
        void infoBox.offsetWidth;
        infoBox.style.height = newH + 'px';
        infoBox.addEventListener('transitionend', function te(e) {
          if (e.propertyName === 'height') { infoBox.removeEventListener('transitionend', te); infoBox.style.height = 'auto'; }
        });
        infoBox.addEventListener('animationend', function ae(e) {
          if (e.animationName === 'crt-line-sweep') { infoBox.removeEventListener('animationend', ae); infoBox.classList.remove('crt-swapping'); }
        });
        return;
      }

      infoBox.classList.remove('crt-closing', 'crt-open', 'crt-swapping');
      fillInfo(bug);
      infoBox.style.display = 'none';
      infoBox.style.height = 'auto';
      void infoBox.offsetWidth;
      infoBox.classList.add('crt-opening');
      infoBox.style.display = '';
      infoOpen = true;
      infoBox._onOpen = function (e) {
        if (e.animationName !== 'crt-turn-on') return;
        infoBox.removeEventListener('animationend', infoBox._onOpen);
        infoBox._onOpen = null;
        infoBox.classList.remove('crt-opening');
        infoBox.classList.add('crt-open');
      };
      infoBox.addEventListener('animationend', infoBox._onOpen);
    }

    function closeInfo() {
      if (!infoBox || !infoOpen || infoBox.classList.contains('crt-closing')) return;
      clearInfoHandlers();
      infoBox.classList.remove('crt-opening', 'crt-open', 'crt-swapping');
      infoBox.style.display = 'block';
      void infoBox.offsetWidth;
      infoBox.classList.add('crt-closing');
      infoOpen = false;
      infoBox._onClose = function (e) {
        if (e.animationName !== 'crt-turn-off') return;
        infoBox.removeEventListener('animationend', infoBox._onClose);
        infoBox._onClose = null;
        infoBox.classList.remove('crt-closing');
        infoBox.style.display = 'none';
      };
      infoBox.addEventListener('animationend', infoBox._onClose);
    }

    /* ---------- making bugs ---------- */
    var fallbackColors = ['#e57373', '#f06292', '#ba68c8', '#7986cb', '#4fc3f7', '#4db6ac', '#aed581', '#ffd54f', '#ff8a65'];
    function fallbackImage(name, i) {
      var letter = (name || '?').trim().charAt(0).toUpperCase() || '?';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="' +
        fallbackColors[i % fallbackColors.length] + '"/><text x="75" y="75" font-family="Arial,sans-serif" font-size="80" ' +
        'font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="central">' + letter.replace(/[<&]/g, '?') + '</text></svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function positionHat(bug) {
      if (!bug.hat) return;
      var bugSize = parseInt(bug.element.style.width, 10) || getSize();
      bug.hat.style.left = (bug.x + bugSize / 2) + 'px';
      bug.hat.style.top = (bug.y + 4) + 'px';
      bug.hat.style.transform = 'translate(-50%, -100%)';
    }

    function ensureHat(bug) {
      if (!bug || !bug.element || bug.hat) return;
      var hat = document.createElement('img');
      hat.src = 'src/bug-hat-trim.png';
      hat.alt = '';
      hat.className = 'bug-hat';
      hat.draggable = false;
      hat.style.position = 'absolute';
      hat.style.pointerEvents = 'none';
      hat.style.width = '32px';
      hat.style.height = '33px';
      container.appendChild(hat);
      bug.hat = hat;
      positionHat(bug);
    }

    function removeHat(bug) {
      if (!bug || !bug.hat) return;
      bug.hat.remove();
      bug.hat = null;
    }

    function addBug(info) {
      info = info || roster[Math.floor(Math.random() * roster.length)];
      var size = getSize();
      var img = document.createElement('img');
      img.className = 'bug';
      img.alt = info.name || 'Bug';
      img.draggable = false;
      img.style.width = size + 'px';
      img.style.height = size + 'px';
      img.dataset.bugName = info.name || 'Bug';
      img.dataset.bugStory = info.story || '';
      img.dataset.bugBirthday = info.birthday || '';
      if (Math.random() < (cfg.shinyChance != null ? cfg.shinyChance : 0.01)) img.classList.add('shiny');
      if (cfg.fallbackWhenImageMissing !== false) {
        var idx = bugData.length;
        img.addEventListener('error', function onErr() {
          img.removeEventListener('error', onErr);
          img.src = fallbackImage(info.name, idx);
        });
      }
      img.src = info.image || fallbackImage(info.name, bugData.length);

      var x = Math.random() * Math.max(0, playW - size);
      var y = Math.random() * Math.max(0, playH - size);
      img.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      container.appendChild(img);

      var bug = {
        element: img, x: x, y: y,
        dx: (Math.random() - 0.5) * 5, dy: (Math.random() - 0.5) * 5, hat: null,
        mass: 1, radius: size / 2, drag: 0.995, _uid: uidCounter++
      };
      bugData.push(bug);
      if (hatsEnabled) ensureHat(bug);

      img.addEventListener('click', function (event) {
        event.stopPropagation();
        if (img._wasDragged) { img._wasDragged = false; return; }
        if (infoEnabled) showInfo(img);
      });
    }

    function removeBugAt(index) {
      if (index < 0 || index >= bugData.length) return false;
      var bug = bugData[index];
      if (dragging === bug) {
        if (bug.element.releasePointerCapture && dragPointerId !== null) {
          try { bug.element.releasePointerCapture(dragPointerId); } catch (_) {}
        }
        bug.element.classList.remove('dragging');
        dragging = null;
        dragPointerId = null;
      }
      removeHat(bug);
      bug.element.remove();
      bugData.splice(index, 1);
      return true;
    }

    function setCount(n) {
      while (bugData.length > n) {
        removeBugAt(bugData.length - 1);
      }
      while (bugData.length < n) addBug();
    }

    // initial set: shuffle the roster so you get a random selection each load
    var pool = roster.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var count = cfg.count != null ? cfg.count : 28;
    for (var k = 0; k < count; k++) addBug(pool[k % pool.length]);

    /* ---------- physics (ported from the original) ---------- */
    var gridCellSize = 0, gridCols = 0, gridRows = 0, grid = [];
    var checkedPairs = new Set();

    function buildGrid(w, h, size) {
      gridCellSize = size + 2;
      gridCols = Math.max(1, Math.ceil(w / gridCellSize));
      gridRows = Math.max(1, Math.ceil(h / gridCellSize));
      var total = gridCols * gridRows;
      if (grid.length !== total) {
        grid = new Array(total);
        for (var i = 0; i < total; i++) grid[i] = [];
      } else {
        for (var i2 = 0; i2 < total; i2++) grid[i2].length = 0;
      }
    }
    function cellOf(bug) {
      return [
        Math.min(gridCols - 1, Math.max(0, (bug.x / gridCellSize) | 0)),
        Math.min(gridRows - 1, Math.max(0, (bug.y / gridCellSize) | 0))
      ];
    }
    function insertGrid(bug) { var c = cellOf(bug); grid[c[1] * gridCols + c[0]].push(bug); }
    function neighborsOf(bug) {
      var c = cellOf(bug), col = c[0], row = c[1], out = [];
      for (var r = Math.max(0, row - 1); r <= Math.min(gridRows - 1, row + 1); r++) {
        for (var cc = Math.max(0, col - 1); cc <= Math.min(gridCols - 1, col + 1); cc++) {
          var cell = grid[r * gridCols + cc];
          for (var k = 0; k < cell.length; k++) if (cell[k] !== bug) out.push(cell[k]);
        }
      }
      return out;
    }

    function collide(bug, other) {
      var combined = bug.radius + other.radius;
      var dx = bug.x - other.x, dy = bug.y - other.y;
      var distSq = dx * dx + dy * dy;
      var minDist = combined + 1;
      if (distSq >= minDist * minDist) return;
      if (distSq === 0) { bug.x += 2; bug.y += 2; return; }
      var dist = Math.sqrt(distSq);
      var nx = dx / dist, ny = dy / dist;
      var dot = (bug.dx - other.dx) * nx + (bug.dy - other.dy) * ny;
      if (dot > 0) return;
      var e = settings.bounciness;
      var impulse = Math.min((2 * dot) / (bug.mass + other.mass), 40);
      bug.dx -= impulse * other.mass * nx * e;
      bug.dy -= impulse * other.mass * ny * e;
      other.dx += impulse * bug.mass * nx * e;
      other.dy += impulse * bug.mass * ny * e;
      var correction = (combined - dist + 1) / 1.8;
      bug.x += nx * correction; bug.y += ny * correction;
      other.x -= nx * correction; other.y -= ny * correction;
      if (Math.random() < 0.2) {
        bug.dx += (Math.random() - 0.5) * 0.3; bug.dy += (Math.random() - 0.5) * 0.3;
        other.dx += (Math.random() - 0.5) * 0.3; other.dy += (Math.random() - 0.5) * 0.3;
      }
    }

    /* ---------- drag & throw ---------- */
    var dragging = null, dragPointerId = null;
    var dragOffX = 0, dragOffY = 0, dragTX = 0, dragTY = 0;
    var dragHistory = [];
    var dragStartX = 0, dragStartY = 0, dragMoved = false;

    function onPointerDown(e) {
      if (!dragEnabled) return;
      var target = e.target.closest && e.target.closest('.bug');
      if (!target || !container.contains(target)) return;
      var rec = null;
      for (var i = 0; i < bugData.length; i++) if (bugData[i].element === target) { rec = bugData[i]; break; }
      if (!rec) return;
      var rect = container.getBoundingClientRect();
      var px = e.clientX - rect.left, py = e.clientY - rect.top;
      dragOffX = px - rec.x; dragOffY = py - rec.y;
      dragging = rec; dragPointerId = e.pointerId;
      dragTX = rec.x; dragTY = rec.y;
      dragStartX = px; dragStartY = py; dragMoved = false;
      dragHistory = [{ x: px, y: py, t: performance.now() }];
      if (target.setPointerCapture) target.setPointerCapture(e.pointerId);
      target.classList.add('dragging');
      e.preventDefault();
      if (!running) { requestFrame(); } // let you drag while frozen
    }

    function onPointerMove(e) {
      if (!dragging || dragPointerId !== e.pointerId) return;
      var rect = container.getBoundingClientRect();
      var size = getSize();
      var px = e.clientX - rect.left, py = e.clientY - rect.top;
      dragTX = Math.min(Math.max(0, px - dragOffX), Math.max(0, playW - size));
      dragTY = Math.min(Math.max(0, py - dragOffY), Math.max(0, playH - size));
      if (Math.abs(px - dragStartX) > CLICK_MOVE_TOLERANCE || Math.abs(py - dragStartY) > CLICK_MOVE_TOLERANCE) dragMoved = true;
      dragHistory.push({ x: px, y: py, t: performance.now() });
      if (dragHistory.length > DRAG_HISTORY_SIZE) dragHistory.shift();
      e.preventDefault();
    }

    function onPointerUp(e) {
      if (!dragging) return;
      if (e && dragPointerId !== e.pointerId) return;
      var el = dragging.element;
      if (el.releasePointerCapture && dragPointerId !== null) { try { el.releasePointerCapture(dragPointerId); } catch (_) {} }
      el.classList.remove('dragging');
      el._wasDragged = dragMoved; // so the click that follows a drag doesn't open the popup
      if (dragMoved) setTimeout(function () { el._wasDragged = false; }, 0);

      var now = performance.now();
      while (dragHistory.length > 1 && now - dragHistory[0].t > DRAG_HISTORY_MAX_AGE) dragHistory.shift();
      var vx = 0, vy = 0;
      if (dragHistory.length >= 2) {
        var o = dragHistory[0], n = dragHistory[dragHistory.length - 1];
        var dt = Math.max(16, n.t - o.t);
        vx = (n.x - o.x) / dt; vy = (n.y - o.y) / dt;
      }
      var ndx = vx * THROW_SCALE, ndy = vy * THROW_SCALE;
      var speed = Math.sqrt(ndx * ndx + ndy * ndy);
      if (speed > THROW_CAP) { ndx = ndx / speed * THROW_CAP; ndy = ndy / speed * THROW_CAP; }
      dragging.dx = ndx; dragging.dy = ndy;
      dragging = null; dragPointerId = null;
    }

    container.addEventListener('pointerdown', onPointerDown, { passive: false });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp, { passive: false });
    document.addEventListener('pointercancel', onPointerUp, { passive: false });

    // click anywhere that isn't a bug / the popup closes the popup
    function onDocClick(e) {
      if (!infoBox || !infoOpen) return;
      if (infoBox.contains(e.target)) return;
      closeInfo();
    }
    document.addEventListener('click', onDocClick);

    /* ---------- main loop ---------- */
    function frame() {
      rafId = 0;
      if (!running && !dragging) return;
      var size = getSize();
      var bottom = playH;

      buildGrid(playW, playH, size);
      for (var i = 0; i < bugData.length; i++) insertGrid(bugData[i]);
      checkedPairs.clear();

      for (var n = 0; n < bugData.length; n++) {
        var bug = bugData[n];
        var held = dragging === bug;

        // escaped the box somehow? put it back in the middle
        if (!held && (bug.x < -size || bug.x > playW + size || bug.y < -size || bug.y > playH + size)) {
          bug.x = playW / 2 + (Math.random() - 0.5) * 100;
          bug.y = playH / 2 + (Math.random() - 0.5) * 100;
          bug.dx = (Math.random() - 0.5) * 5;
          bug.dy = (Math.random() - 0.5) * 5;
        }

        if (!held && settings.speedCapEnabled) {
          var sq = bug.dx * bug.dx + bug.dy * bug.dy, max = settings.maxSpeed;
          if (sq > max * max) { var f = max / Math.sqrt(sq); bug.dx *= f; bug.dy *= f; }
        }

        if (held) {
          var tx = Math.min(Math.max(0, dragTX), Math.max(0, playW - size));
          var ty = Math.min(Math.max(0, dragTY + DRAG_SLACK), Math.max(0, playH - size));
          var ddx = tx - bug.x, ddy = ty - bug.y, dsq = ddx * ddx + ddy * ddy;
          if (dsq > 0.000001) {
            var d = Math.sqrt(dsq), pull = Math.min(DRAG_PULL_MAX, d * DRAG_PULL_STRENGTH);
            bug.dx += ddx / d * pull; bug.dy += ddy / d * pull;
          }
          bug.dx *= DRAG_DAMPING; bug.dy *= DRAG_DAMPING;
        }

        bug.x += bug.dx; bug.y += bug.dy;

        bug.dy += settings.gravity;
        bug.dx *= bug.drag; bug.dy *= bug.drag;

        var jitter = Math.random() < 0.1 ? (Math.random() - 0.5) * 0.5 : 0;
        var bs = bug.radius * 2;

        // walls (first pass: clamp + bounce)
        if (bug.x < 0) { bug.x = 0; bug.dx = Math.abs(bug.dx); bug.dy += jitter; }
        else if (bug.x + bs > playW) { bug.x = Math.max(0, playW - bs); bug.dx = -Math.abs(bug.dx); bug.dy += jitter; }
        if (bug.y < 0) { bug.y = 0; bug.dy = Math.abs(bug.dy); bug.dx += jitter; }
        else if (bug.y + bs > bottom) { bug.y = Math.max(0, bottom - bs); bug.dy = -Math.abs(bug.dy) * 0.3; bug.dx += jitter; }

        // walls (second pass: 2px margin with a small kick – this is what makes them lively)
        if (bug.x <= 2) { bug.x = 2; bug.dx = Math.abs(bug.dx) + 0.5; }
        else if (bug.x >= playW - bs - 2) { bug.x = playW - bs - 2; bug.dx = -Math.abs(bug.dx) - 0.5; }
        if (bug.y <= 2) { bug.y = 2; bug.dy = Math.abs(bug.dy) + 0.5; }
        else if (bug.y >= bottom - bs - 2) { bug.y = bottom - bs - 2; bug.dy = -Math.abs(bug.dy) - 0.5; }

        // bug vs bug
        var nb = neighborsOf(bug);
        for (var m = 0; m < nb.length; m++) {
          var other = nb[m];
          var a = bug._uid, b = other._uid;
          var key = a < b ? a * 100000 + b : b * 100000 + a;
          if (checkedPairs.has(key)) continue;
          checkedPairs.add(key);
          collide(bug, other);
        }

        bug.dx *= settings.friction; bug.dy *= settings.friction;
        if (Math.abs(bug.dx) < 0.05 && Math.abs(bug.dy) < 0.05 && Math.random() < 0.1) {
          bug.dx += (Math.random() - 0.5) * 0.2; bug.dy += (Math.random() - 0.5) * 0.2;
        }

        bug.element.style.transform = 'translate3d(' + bug.x + 'px,' + bug.y + 'px,0)';
        positionHat(bug);
      }
      requestFrame();
    }
    function requestFrame() { if (!rafId) rafId = requestAnimationFrame(frame); }

    /* ---------- resize handling ---------- */
    function relayout() {
      playW = container.clientWidth;
      playH = container.clientHeight;
      var size = getSize();
      bugData.forEach(function (b) {
        b.radius = size / 2;
        b.element.style.width = size + 'px';
        b.element.style.height = size + 'px';
        b.x = Math.min(Math.max(b.x, 0), Math.max(0, playW - size));
        b.y = Math.min(Math.max(b.y, 0), Math.max(0, playH - size));
        b.element.style.transform = 'translate3d(' + b.x + 'px,' + b.y + 'px,0)';
        positionHat(b);
      });
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(relayout); ro.observe(container); }
    else window.addEventListener('resize', relayout);

    requestFrame();

    var api = {
      settings: settings,
      bugs: bugData,
      setCount: setCount,
      addBug: function () { addBug(); },
      removeBug: removeBugAt,
      freeze: function () { running = false; },
      unfreeze: function () { if (!running) { running = true; requestFrame(); } },
      setDragEnabled: function (enabled) {
        dragEnabled = !!enabled;
        if (!dragEnabled && dragging) {
          var element = dragging.element;
          if (element.releasePointerCapture && dragPointerId !== null) {
            try { element.releasePointerCapture(dragPointerId); } catch (_) {}
          }
          element.classList.remove('dragging');
          dragging = null;
          dragPointerId = null;
        }
      },
      setInfoEnabled: function (enabled) {
        infoEnabled = !!enabled;
        if (!infoEnabled) closeInfo();
      },
      setHatsEnabled: function (enabled) {
        hatsEnabled = !!enabled;
        bugData.forEach(function (bug) {
          if (hatsEnabled) ensureHat(bug);
          else removeHat(bug);
        });
      },
      closeInfo: closeInfo,
      destroy: function () {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', relayout);
        container.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        document.removeEventListener('click', onDocClick);
        bugData.forEach(function (b) { removeHat(b); b.element.remove(); });
        infoBox.remove();
        bugData.length = 0;
        container._bugsBox = null;
      }
    };
    container._bugsBox = api;
    return api;
  }

  function autoStart() {
    var boxes = document.querySelectorAll('.bugs-container');
    for (var i = 0; i < boxes.length; i++) init(boxes[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoStart);
  else autoStart();

  window.BugsBox = { init: init };
})();
