






(function () {
  'use strict';

  var STORAGE_KEY = '28bugs_panopKeys';
  var PART_LEN = 4;  

  
  var KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!@#$%&';

  
  var state = loadState();

  function generateFragment() {
    var s = '';
    for (var i = 0; i < PART_LEN; i++) {
      s += KEY_CHARS.charAt(Math.floor(Math.random() * KEY_CHARS.length));
    }
    return s;
  }

  function freshState() {
    return {
      fragments: [null, null, null],
      fullKey: null
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.fragments)) return parsed;
      }
    } catch (e) {}
    return freshState();
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function hasAllFragments() {
    return state.fragments[0] && state.fragments[1] && state.fragments[2];
  }

  function fragmentCount() {
    var count = 0;
    for (var i = 0; i < state.fragments.length; i++) {
      if (state.fragments[i]) count++;
    }
    return count;
  }

  function getFullKey() {
    if (!hasAllFragments()) return null;
    return state.fragments[0] + state.fragments[1] + state.fragments[2];
  }

  function grantKey(name) {
    var idx = { alpha: 0, beta: 1, gamma: 2 }[name];
    if (idx === undefined) return;
    if (!state.fragments[idx]) {
      state.fragments[idx] = generateFragment();
    }
    state.fullKey = getFullKey();
    saveState();
  }

  function grantAllKeys() {
    grantKey('alpha');
    grantKey('beta');
    grantKey('gamma');
  }

  
  function renderSticky() {
    var el = document.getElementById('panop-sticky-codes');
    if (!el) return;
    var assembled = '';
    for (var i = 0; i < 3; i++) {
      assembled += state.fragments[i] || 'X'.repeat(PART_LEN);
    }
    el.innerHTML = '<span class="code-part assembled">' + escHtml(assembled) + '</span>';

    var title = document.querySelector('#panop-sticky .panop-sticky-title');
    if (title) title.textContent = 'CODES: ' + fragmentCount() + '/3';
  }

  
  var protocolUnlocked = false;
  var typeTimer = 0;

  function renderBody() {
    var body = document.getElementById('panop-terminal-body');
    var btn = document.getElementById('panop-terminal-launch');
    if (!body || !btn) return;

    protocolUnlocked = false;
    clearTimeout(typeTimer);

    var html = '';
    html += '<div class="panop-terminal-shell">';
    html += '<div class="panop-shell-line panop-shell-muted">BUGOS TERMINAL [Version 2.8.0]</div>';
    html += '<div class="panop-shell-line panop-shell-muted">(C) BUGTOPIA SYSTEMS. ALL RIGHTS RESERVED.</div>';
    html += '<div class="panop-shell-line panop-shell-blank"></div>';
    html += '<div class="panop-shell-line">ENTER FULL 12-CHARACTER ACCESS KEY.</div>';
    html += '<div class="panop-shell-line panop-shell-blank"></div>';
    html += '<div class="panop-input-row">';
    html += '<span class="panop-prompt">C:\\SECTOR28&gt;</span>';
    html += '<input type="text" id="panop-key-input" class="panop-key-input" maxlength="12" placeholder="\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7" spellcheck="false" autocomplete="off">';
    html += '<button type="button" id="panop-key-submit" class="panop-key-submit">ENTER</button>';
    html += '</div>';
    html += '<div id="panop-key-error" class="panop-shell-line panop-shell-status"></div>';
    html += '<div id="panop-protocol-area" class="panop-terminal-output"></div>';
    html += '</div>';

    body.innerHTML = html;

    btn.classList.remove('active');
    btn.disabled = true;

    var input = document.getElementById('panop-key-input');
    var submit = document.getElementById('panop-key-submit');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') tryUnlock();
      });
      input.addEventListener('input', function () {
        this.value = this.value.toUpperCase().replace(/\s+/g, '');
      });
    }
    if (submit) {
      submit.addEventListener('click', tryUnlock);
    }
  }

  function tryUnlock() {
    var input = document.getElementById('panop-key-input');
    var errorEl = document.getElementById('panop-key-error');
    if (!input || !errorEl) return;

    var val = input.value.trim().toUpperCase();
    var fullKey = getFullKey();

    if (!fullKey) {
      errorEl.textContent = 'ERROR: INVALID PASSSWORD';
      errorEl.className = 'panop-shell-line panop-shell-status is-error';
      shakeInput(input);
      return;
    }

    if (val !== fullKey) {
      errorEl.textContent = 'ERROR: INVALID PASSSWORD';
      errorEl.className = 'panop-shell-line panop-shell-status is-error';
      shakeInput(input);
      return;
    }

    errorEl.textContent = 'KEY ACCEPTED. PROTOCOL OUTPUT FOLLOWS.';
    errorEl.className = 'panop-shell-line panop-shell-status is-ok';
    input.disabled = true;
    input.classList.add('is-accepted');
    var submit = document.getElementById('panop-key-submit');
    if (submit) submit.disabled = true;
    showProtocol();
  }

  function shakeInput(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function showProtocol() {
    var area = document.getElementById('panop-protocol-area');
    if (!area) return;

    var lines = [
      { segments: [{ text: 'C:\\SECTOR28> AUTHORIZATION ACCEPTED', cls: 'pt-system' }], cls: 'pt-system' },
      { segments: [{ text: 'C:\\SECTOR28> DISPLAY PROTOCOL.TXT', cls: 'pt-system' }], cls: 'pt-system' },
      { segments: [{ text: '----------------------------------------------------------------------------------------------------------------------------------------', cls: 'pt-rule' }], cls: 'pt-rule' },
      { spacer: true },
      { segments: [{ text: 'FOLLOW PROTOCOL', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { spacer: true },
      { segments: [{ text: 'DO ', cls: 'pt-emphasis' }, { text: 'NOT', cls: 'pt-not' }, { text: ' APPROACH IT', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { spacer: true },
      { segments: [{ text: 'DO ', cls: 'pt-emphasis' }, { text: 'NOT', cls: 'pt-not' }, { text: ' THROW BUGS AT IT', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { spacer: true },
      { segments: [{ text: 'DO ', cls: 'pt-emphasis' }, { text: 'NOT', cls: 'pt-not' }, { text: ' LET IT', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { segments: [{ text: 'LOOK AT YOU', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { spacer: true },
      { segments: [{ text: 'STAY VIGILANT,', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { segments: [{ text: 'AND MOST IMPORTANTLY', cls: 'pt-emphasis' }], cls: 'pt-centerline' },
      { spacer: true },
      { segments: [{ text: 'have fun!', cls: 'pt-emphasis' }], cls: 'pt-centerline' }
    ];

    area.innerHTML = '';
    typeProtocolLines(area, lines, 0, function () {
      var btn = document.getElementById('panop-terminal-launch');
      if (btn) {
        btn.disabled = false;
        btn.classList.add('active');
        protocolUnlocked = true;
      }
    });
  }

  function typeProtocolLines(area, lines, index, done) {
    if (index >= lines.length) {
      if (done) done();
      return;
    }

    var line = lines[index];
    var div = document.createElement('div');
    if (line.spacer) {
      div.className = 'pt-spacer';
      area.appendChild(div);
      typeTimer = setTimeout(function () {
        typeProtocolLines(area, lines, index + 1, done);
      }, 80);
      return;
    }

    div.className = 'panop-protocol-line ' + (line.cls || 'pt-line');
    area.appendChild(div);
    typeSegments(div, line.segments, 0, function () {
      typeTimer = setTimeout(function () {
        typeProtocolLines(area, lines, index + 1, done);
      }, 90);
    });
  }

  function typeSegments(container, segments, segmentIndex, done) {
    if (segmentIndex >= segments.length) {
      if (done) done();
      return;
    }

    var segment = segments[segmentIndex];
    var span = document.createElement('span');
    if (segment.cls) span.className = segment.cls;
    container.appendChild(span);
    typeText(span, segment.text || '', 0, function () {
      typeSegments(container, segments, segmentIndex + 1, done);
    });
  }

  function typeText(el, text, index, done) {
    if (index >= text.length) {
      if (done) done();
      return;
    }

    el.textContent += text.charAt(index);
    typeTimer = setTimeout(function () {
      typeText(el, text, index + 1, done);
    }, text.charAt(index) === ' ' ? 12 : 22);
  }

  
  function initiateBreachSequence() {
    if (!protocolUnlocked) return;

    var modal = document.getElementById('panop-terminal-modal');
    if (modal) modal.style.display = 'none';

    state = freshState();
    saveState();

    resetToDefaults(function () {
      if (window.PanopticonBoss && window.PanopticonBoss.start) {
        window.PanopticonBoss.start();
      }
    });
  }

  function resetToDefaults(callback) {
    var set28 = document.getElementById('set-28-button');
    if (set28) set28.click();

    if (window.GooglyEyes && window.GooglyEyes.isActive && window.GooglyEyes.isActive()) {
      window.GooglyEyes.toggle();
    }
    if (window.WalkMode && window.WalkMode.isEnabled && window.WalkMode.isEnabled()) {
      window.WalkMode.disable();
    }
    if (window.WalkMode && window.WalkMode.isOcean && window.WalkMode.isOcean()) {
      window.WalkMode.toggleOcean();
    }
    if (window.TimeWarp && window.TimeWarp.isActive && window.TimeWarp.isActive()) {
      window.TimeWarp.stop();
    }
    if (window.MeteorShower && window.MeteorShower.isActive && window.MeteorShower.isActive()) {
      window.MeteorShower.stop();
    }
    if (window.Horsemen && window.Horsemen.stopAll) {
      window.Horsemen.stopAll();
    }
    if (window.BugSettings && window.BugSettings.resetToDefaults) {
      window.BugSettings.resetToDefaults();
    }

    setTimeout(function () {
      if (callback) callback();
    }, 100);
  }

  
  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  
  function init() {
    var btn = document.getElementById('panop-terminal-btn');
    var modal = document.getElementById('panop-terminal-modal');
    var launchBtn = document.getElementById('panop-terminal-launch');

    if (btn && modal) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        renderSticky();
        renderBody();
        modal.style.display = 'flex';
        setTimeout(function () {
          var input = document.getElementById('panop-key-input');
          if (input) input.focus();
        }, 0);
      });
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    if (launchBtn) {
      launchBtn.addEventListener('click', function () {
        initiateBreachSequence();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  
  window.PanopTerminal = {
    grantKey: grantKey,
    grantAllKeys: grantAllKeys,
    hasAllKeys: hasAllFragments,
    getKeys: function () {
      return {
        alpha: !!state.fragments[0],
        beta: !!state.fragments[1],
        gamma: !!state.fragments[2]
      };
    }
  };
})();
