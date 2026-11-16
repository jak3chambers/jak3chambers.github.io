


var ProfileModal = (function() {
  var API_BASE = 'https://api.28awesomebugs.org';

  var profileModal = document.getElementById('profile-modal');
  if (!profileModal) return null;

  var profileClose = document.getElementById('profile-modal-close');
  var avatarPicker = document.getElementById('avatar-picker');
  var avatarGrid = document.getElementById('avatar-grid');
  var avatarImg = document.getElementById('profile-avatar-img');

  var bugAvatars = [
    'bug1','bug2','bug3','bug4','bug5','bug6','bug7','bug8','bug10','bug11',
    'bug12','bug13','bug14','bug15','bug16','bug17','bug18','bug19','bug20','bug21',
    'bug22','bug23','bug24','bug25','bug26','bug27','bug28','bug29','bug30','bug31',
    'bug32','bug33','bug34','bug35','bug36','bug37','bug38','bug39','bug40','bug41',
    'bug42','bug43','bug44','bug45','bug46','bug47','bug48','bug49','bug50',
    'bug51','bug52','bug53','bug54','bug55','bug56','bug57','bug58','bug59','bug60',
    'bug61','bug62','bug63','bug64','bug65','bug66','bug67','bug68','bug69','bug70',
    'bug71','bug72','bug73','bug74','bug75','bug76','bug77','bug78','bug79','bug80',
    'bug81','bug82','bug83','bug84','bug85','bug86','bug87'
  ];
  var ellieAvatars = [
    'elliebug2','elliebug3','elliebug4','elliebug5','elliebug6','elliebug7','elliebug8','elliebug9','elliebug10',
    'elliebug11','elliebug12','elliebug13','elliebug14','elliebug15','elliebug16','elliebug17','elliebug18',
    'elliebug19','elliebug20','elliebug21','elliebug22','elliebug23','elliebug24','elliebug25','elliebug26',
    'elliebug27','elliebug28','elliebug29','elliebug30','elliebug31','elliebug32','elliebug33','elliebug34',
    'elliebug35','elliebug36','elliebug37','elliebug38','elliebug40','elliebug41','elliebug42','elliebug43'
  ];

  
  var bugExtMap = {};
  if (typeof bugImages !== 'undefined') {
    bugImages.forEach(function(p) {
      var m = p.match(/bug(\d+)\.\w+$/);
      if (m) bugExtMap['bug' + m[1]] = p;
    });
  }

  function avatarSrc(key) {
    if (!key) return 'src/bug1.png';
    if (key.startsWith('elliebug')) return 'src/elliebugs/' + key + '.png';
    return bugExtMap[key] || ('src/' + key + '.jpg');
  }

  function showError(el, msg) { el.textContent = msg; el.style.display = ''; }
  function hideError(el) { el.style.display = 'none'; }

  function isLuckyTagName(name) {
    return name === 'Lucky' || /^Lucky x\d+$/.test(name);
  }

  function indexUserTags(userTags) {
    var earnedByName = {};
    (userTags || []).forEach(function(t) {
      if (isLuckyTagName(t.tag_name)) {
        earnedByName['Lucky'] = t;
      } else {
        earnedByName[t.tag_name] = t;
      }
    });
    return earnedByName;
  }

  function maybeSyncLocalLuckyTags(user) {
    try {
      var count = parseInt(localStorage.getItem('28bugs_luckyTagCount') || '0', 10);
      if (localStorage.getItem('28bugs_luckyCharm') === 'true' && count === 0) count = 1;
      if (count < 1) return;
      var hasServerLucky = (user.tags || []).some(function(t) { return isLuckyTagName(t.tag_name); });
      if (hasServerLucky || typeof AccountSync === 'undefined' || !AccountSync.saveProgress) return;
      AccountSync.saveProgress().then(function(result) {
        if (!result || !result.success) return;
        var syncedUser = AccountSync.getUser();
        if (syncedUser && result.tags) syncedUser.tags = result.tags;
        renderTags(syncedUser ? syncedUser.tags : result.tags);
        renderTagCompendium(syncedUser ? syncedUser.tags : result.tags);
      }).catch(function() {});
    } catch (e) {}
  }

  
  
  var KNOWN_TAGS = [
    
    { name: 'True Fan',              color: '#FFD700', effect: 'shine',          rare: false, description: 'Visit the main page, playground, fishing, games, forum, and education pages.' },
    
    { name: 'Good Parent',           color: '#90EE90', effect: null,             rare: false, description: 'Raise your bug to level 10.' },
    { name: 'Stellar Parent',        color: '#87CEEB', effect: 'sparkle',        rare: false, description: 'Raise your bug to level 20.' },
    { name: 'Supreme Parent',        color: '#DDA0DD', effect: 'glow',           rare: false, description: 'Raise your bug to level 35.' },
    { name: 'Ultimate Parent',       color: '#FF1493', effect: 'glow',           rare: false, description: 'Raise your bug to level 50.' },
    { name: 'United Nations Threat', color: '#DC143C', effect: 'glow',           rare: false, description: 'Fire a nuke in the Simulacrum.' },
    { name: 'Sandbox Master',        color: '#FFB6C1', effect: 'sparkle',        rare: false, description: 'Buy every upgrade in Simulacrum.' },
    
    { name: 'Ultra Fisher',          color: '#90EE90', effect: null,             rare: false, description: 'Catch at least 128 different fish species.' },
    { name: 'Ultimate Fisher',       color: '#FFD700', effect: 'rainbow',        rare: false, description: 'Catch all 160 fish in both normal and hard mode.' },
    
    { name: 'Rich',                  color: '#FFD700', effect: null,             rare: false, description: 'Accumulate 1 million coins.' },
    { name: '1%',                    color: '#DAA520', effect: null,             rare: false, description: 'Accumulate 1 trillion coins.' },
    { name: 'Gambler',               color: '#8B4513', effect: null,             rare: false, description: 'Place a single bet of 50,000 coins or more.' },
    
    { name: 'Killer',                color: '#FF4444', effect: null,             rare: false, description: 'Let 10 bugs die.' },
    { name: 'Psychopath',            color: '#8B0000', effect: null,             rare: false, description: 'Let 100 bugs die.' },
    
    { name: 'Bug Hoarder',           color: '#C8A96E', effect: 'shine',          rare: false, description: 'Buy all 41 bugs in the bug shop.' },
    { name: 'Audiophile',            color: '#9B59B6', effect: 'glow',           rare: false, description: 'Own all 16 tracks in the music shop.' },
    { name: 'Moody',                 color: '#FF6B35', effect: 'moody-gradient', rare: false, description: 'Own all 5 themes in the shop.' },
    { name: 'True',                  color: '#4CAF50', effect: 'shine',          rare: false, description: 'Own everything in every shop.' },
    { name: 'Silver Spoon',          color: '#C0C0C0', effect: null,             rare: false, description: 'Discover a hidden secret.' },
    { name: 'Scientist',             color: '#888888', effect: null,             rare: false, description: 'Submit feedback on the Simulacrum.' },
    
    { name: 'Loved',                 color: '#FF69B4', effect: 'sparkle',        rare: false, description: 'Get 15+ upvotes on a forum post or comment.' },
    
    { name: 'Tetris Pro',                      color: '#00CED1', effect: 'shine',  rare: false, description: 'Rank in the top 10 on the Bug Tetris Normal all-time leaderboard.' },
    { name: 'Tetris Normal Grandmaster',       color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Normal all-time leaderboard.' },
    { name: 'Tetris Normal Daily Grandmaster', color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Normal daily leaderboard.' },
    { name: 'Tetris Sprint Grandmaster',       color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Sprint all-time leaderboard.' },
    { name: 'Tetris Sprint Daily Grandmaster', color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Sprint daily leaderboard.' },
    { name: 'Tetris Ultra Grandmaster',        color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Ultra all-time leaderboard.' },
    { name: 'Tetris Ultra Daily Grandmaster',  color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Ultra daily leaderboard.' },
    { name: 'Tetris Dig Grandmaster',          color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Dig all-time leaderboard.' },
    { name: 'Tetris Dig Daily Grandmaster',    color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Dig daily leaderboard.' },
    { name: 'Tetris Swarm Grandmaster',        color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Swarm all-time leaderboard.' },
    { name: 'Tetris Swarm Daily Grandmaster',  color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Swarm daily leaderboard.' },
    { name: 'Tetris Perfection Grandmaster',       color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on the Bug Tetris Perfection all-time leaderboard.' },
    { name: 'Tetris Perfection Daily Grandmaster', color: '#FFD700', effect: 'rainbow', rare: true, description: 'Hold #1 on today\'s Bug Tetris Perfection daily leaderboard.' },
    
    { name: 'Lucky',                 color: '#F9A825', effect: 'shine',          rare: false, description: 'Win the Lucky tag on the wheel.' },

    { name: 'Buggle Fan',              color: '#66BB6A', effect: 'shine',          rare: false, description: 'Reach a 5-day Buggle win streak.' },
    { name: 'Buggle Pro',              color: '#42A5F5', effect: 'glow',           rare: false, description: 'Win 10 daily Buggle puzzles.' },
    { name: 'Buggle Expert',           color: '#7E57C2', effect: 'sparkle',        rare: false, description: 'Reach a 15-day Buggle win streak.' },
    { name: 'Ultimax Buggle Supreme',  color: '#FFD700', effect: 'rainbow',        rare: true,  description: 'Win 100 daily Buggle puzzles.' },
    { name: 'Buggle Addict',           color: '#FF7043', effect: 'glow',           rare: false, description: 'Reach a 50-day Buggle win streak.' },
    { name: 'Smartypants',             color: '#AB47BC', effect: 'shine',          rare: false, description: 'Solve a daily Buggle puzzle in under 5 guesses.' }
  ];

  
  profileModal.querySelectorAll('.profile-section-toggle').forEach(function(btn) {
    var sectionId = btn.getAttribute('data-section');
    var body = document.getElementById(sectionId);
    btn.setAttribute('aria-expanded', body.classList.contains('profile-section-collapsed') ? 'false' : 'true');
    btn.addEventListener('click', function() {
      var collapsed = body.classList.toggle('profile-section-collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (sectionId === 'cloud-section' && !collapsed) renderCloudSavePanel();
    });
  });

  var _cloudPanelReady = false;
  function renderCloudSavePanel() {
    if (_cloudPanelReady || typeof AccountSync === 'undefined') return;
    var section = document.getElementById('cloud-section');
    if (!section) return;
    _cloudPanelReady = true;

    var report = AccountSync.getSaveSizeReport ? AccountSync.getSaveSizeReport() : { total: 0, keys: [] };
    var wireBytes = report.total;
    if (AccountSync.estimateWireSaveBytes) {
      wireBytes = AccountSync.estimateWireSaveBytes();
    }
    var maxBytes = AccountSync.MAX_SAVE_PAYLOAD_BYTES || (512 * 1024);
    var info = document.createElement('div');
    info.className = 'profile-cloud-size-info';
    info.style.cssText = 'margin:10px 0 12px;font-size:0.85em;color:var(--ink-muted,#6b7280);line-height:1.5';
    info.innerHTML = '<strong>Local save size:</strong> '
      + (AccountSync.formatBytes ? AccountSync.formatBytes(report.total) : report.total + ' B')
      + '<br><strong>Cloud upload (compressed):</strong> '
      + (AccountSync.formatBytes ? AccountSync.formatBytes(wireBytes) : wireBytes + ' B')
      + ' / ' + (AccountSync.formatBytes ? AccountSync.formatBytes(maxBytes) : maxBytes + ' B')
      + '<br><span style="font-size:0.92em">Bulky keys are LZ-compressed for cloud sync. '
      + 'If upload is still over the limit, use trim below.</span>';

    if (report.keys.length) {
      var list = document.createElement('ul');
      list.style.cssText = 'margin:8px 0 0;padding-left:1.2em;font-size:0.82em';
      report.keys.slice(0, 6).forEach(function(item) {
        var li = document.createElement('li');
        var label = (AccountSync.BULKY_SAVE_LABELS && AccountSync.BULKY_SAVE_LABELS[item.key]) || item.key;
        li.textContent = label + ': ' + (AccountSync.formatBytes ? AccountSync.formatBytes(item.bytes) : item.bytes + ' B');
        list.appendChild(li);
      });
      info.appendChild(list);
    }

    var trimBtn = document.createElement('button');
    trimBtn.type = 'button';
    trimBtn.className = 'auth-btn auth-btn-danger';
    trimBtn.id = 'profile-trim-bulky-save';
    trimBtn.style.marginTop = '10px';
    trimBtn.textContent = 'Trim bulky data & save to cloud';
    trimBtn.addEventListener('click', async function() {
      if (!confirm('Remove playground builder data, simulacrum run saves, bug buddy saves, and related bulky data from this device AND cloud? Other progress (coins, stocks, achievements) is kept.')) return;
      trimBtn.disabled = true;
      var errEl = document.getElementById('profile-error');
      var successEl = document.getElementById('profile-success');
      hideError(errEl);
      successEl.style.display = 'none';
      try {
        var result = await AccountSync.trimBulkySaveAndSync();
        if (result.success) {
          successEl.textContent = 'Bulky data cleared and progress saved! Refresh recommended.';
          successEl.style.display = '';
          _cloudPanelReady = false;
          if (info.parentNode) info.parentNode.removeChild(info);
          if (trimBtn.parentNode) trimBtn.parentNode.removeChild(trimBtn);
          renderCloudSavePanel();
        } else {
          showError(errEl, result.error || 'Trim/save failed.');
        }
      } catch (e) {
        showError(errEl, 'Connection error.');
      }
      trimBtn.disabled = false;
    });

    var btns = section.querySelector('.profile-cloud-btns');
    if (btns) {
      btns.parentNode.insertBefore(info, btns);
      btns.parentNode.insertBefore(trimBtn, btns.nextSibling);
    }
  }

  
  var _colorTarget = null;
  var _hue = 210, _sat = 80, _bri = 80;
  var _colorSaveTimeout = null;
  var _colorChanged = false;
  var currentAvatarTab = 'bugs';

  function isDarkThemeActive() {
    return !!(document.body && document.body.classList.contains('theme-dark'));
  }

  function applyProfileNameColor(nameColor) {
    var nameEl = document.getElementById('profile-username');
    if (!nameEl) return;
    nameEl.style.color = nameColor || '';
  }

  function buildAvatarGrid(tab) {
    var list = tab === 'elliebugs' ? ellieAvatars : bugAvatars;
    var user = AccountSync.getUser();
    var current = (user && user.profilePicture) || null;
    avatarGrid.innerHTML = '';
    list.forEach(function(key) {
      var div = document.createElement('div');
      div.className = 'avatar-grid-item' + (key === current ? ' selected' : '');
      var img = document.createElement('img');
      img.src = avatarSrc(key);
      img.alt = key;
      img.loading = 'lazy';
      div.appendChild(img);
      div.addEventListener('click', function() { selectAvatar(key); });
      avatarGrid.appendChild(div);
    });
  }

  async function selectAvatar(key) {
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    try {
      var res = await fetch(API_BASE + '/api/auth/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profilePicture: key })
      });
      var data = await res.json();
      if (data.success) {
        var u = AccountSync.getUser();
        if (u) u.profilePicture = data.profilePicture;
        avatarImg.src = avatarSrc(data.profilePicture);
        showPickerTab('none');
        successEl.textContent = 'Profile picture updated!';
        successEl.style.display = '';
        avatarGrid.querySelectorAll('.avatar-grid-item').forEach(function(el) {
          el.classList.toggle('selected', el.querySelector('img').alt === key);
        });
      } else {
        showError(errEl, data.error || 'Failed to update avatar.');
      }
    } catch(e) { showError(errEl, 'Connection error.'); }
  }

  
  profileModal.querySelectorAll('.avatar-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      
      if (_colorTarget && _colorChanged) {
        saveColor(hsbToHex(_hue, _sat, _bri));
        _colorChanged = false;
      }
      profileModal.querySelectorAll('.avatar-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentAvatarTab = tab.getAttribute('data-tab');
      showPickerTab(currentAvatarTab);
    });
  });

  function showPickerTab(tab) {
    var colorPickerWrap = document.getElementById('color-picker-wrap');
    if (tab === 'none') {
      avatarPicker.style.display = 'none';
      return;
    }
    avatarPicker.style.display = '';
    if (tab === 'banner' || tab === 'name-color') {
      avatarGrid.style.display = 'none';
      if (colorPickerWrap) colorPickerWrap.style.display = '';
      initColorPicker(tab);
    } else {
      avatarGrid.style.display = '';
      if (colorPickerWrap) colorPickerWrap.style.display = 'none';
      buildAvatarGrid(tab);
    }
  }

  
  document.getElementById('avatar-cancel').addEventListener('click', function() {
    
    if (_colorTarget && _colorChanged) {
      saveColor(hsbToHex(_hue, _sat, _bri));
      _colorChanged = false;
    }
    avatarPicker.style.display = 'none';
  });

  
  document.getElementById('profile-customize-btn').addEventListener('click', function() {
    if (avatarPicker.style.display === 'none') {
      avatarPicker.style.display = '';
      var firstTab = document.querySelector('.avatar-tab.active');
      currentAvatarTab = firstTab ? firstTab.getAttribute('data-tab') : 'bugs';
      showPickerTab(currentAvatarTab);
    } else {
      avatarPicker.style.display = 'none';
    }
  });

  
  document.getElementById('profile-change-name-btn').addEventListener('click', function() {
    var wrap = document.getElementById('profile-change-name-wrap');
    var input = document.getElementById('profile-new-name');
    wrap.style.display = '';
    this.style.display = 'none';
    var user = AccountSync.getUser();
    input.value = user ? user.username : '';
    input.focus();
  });
  document.getElementById('profile-cancel-name').addEventListener('click', function() {
    document.getElementById('profile-change-name-wrap').style.display = 'none';
    document.getElementById('profile-change-name-btn').style.display = '';
  });
  document.getElementById('profile-save-name').addEventListener('click', async function() {
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    var newName = document.getElementById('profile-new-name').value.trim();
    if (!newName) { showError(errEl, 'Username cannot be empty.'); return; }
    this.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: newName })
      });
      var data = await res.json();
      if (data.success) {
        var u = AccountSync.getUser();
        if (u) u.username = data.username;
        document.getElementById('profile-username').textContent = data.username;
        var displayEl = document.querySelector('.user-display-name');
        if (displayEl) displayEl.textContent = data.username;
        document.getElementById('profile-change-name-wrap').style.display = 'none';
        document.getElementById('profile-change-name-btn').style.display = '';
        successEl.textContent = 'Username updated!';
        successEl.style.display = '';
      } else { showError(errEl, data.error || 'Failed to change username.'); }
    } catch(e) { showError(errEl, 'Connection error.'); }
    this.disabled = false;
  });

  function hsbToHex(h, s, b) {
    s /= 100; b /= 100;
    var c = b * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = b - c;
    var r, g, bl;
    if (h < 60)       { r = c; g = x; bl = 0; }
    else if (h < 120) { r = x; g = c; bl = 0; }
    else if (h < 180) { r = 0; g = c; bl = x; }
    else if (h < 240) { r = 0; g = x; bl = c; }
    else if (h < 300) { r = x; g = 0; bl = c; }
    else              { r = c; g = 0; bl = x; }
    var toHex = function(v) { var h = Math.round((v + m) * 255).toString(16); return h.length < 2 ? '0' + h : h; };
    return '#' + toHex(r) + toHex(g) + toHex(bl);
  }

  function hexToHsb(hex) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min;
    var h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    var s = max === 0 ? 0 : (d / max) * 100;
    var v = max * 100;
    return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
  }

  function initColorPicker(target) {
    _colorTarget = target;
    var user = AccountSync.getUser();
    var currentColor = null;
    if (target === 'banner') currentColor = user && user.bannerColor;
    else currentColor = user && user.nameColor;

    if (currentColor) {
      var hsb = hexToHsb(currentColor);
      _hue = hsb.h; _sat = hsb.s; _bri = hsb.b;
    } else {
      _hue = 210; _sat = 80; _bri = 80;
    }
    renderColorPicker();
  }

  function renderColorPicker() {
    var wrap = document.getElementById('color-picker-wrap');
    if (!wrap) return;
    var hex = hsbToHex(_hue, _sat, _bri);

    wrap.innerHTML =
      '<div class="cp-preview" style="background:' + hex + '"></div>' +
      '<div class="cp-hex-display">' + hex + '</div>' +
      '<div class="cp-slider-group">' +
        '<label class="cp-label">Hue</label>' +
        '<input type="range" class="cp-range cp-hue" min="0" max="359" value="' + _hue + '" />' +
      '</div>' +
      '<div class="cp-slider-group">' +
        '<label class="cp-label">Saturation</label>' +
        '<input type="range" class="cp-range cp-sat" min="0" max="100" value="' + _sat + '" />' +
      '</div>' +
      '<div class="cp-slider-group">' +
        '<label class="cp-label">Brightness</label>' +
        '<input type="range" class="cp-range cp-bri" min="0" max="100" value="' + _bri + '" />' +
      '</div>' +
      '<div class="cp-actions">' +
        '<button class="auth-btn profile-btn-inline" id="cp-reset">Reset to Default</button>' +
      '</div>';

    
    var hueEl = wrap.querySelector('.cp-hue');
    hueEl.style.background = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';

    
    var satEl = wrap.querySelector('.cp-sat');
    var satLeft = hsbToHex(_hue, 0, _bri);
    var satRight = hsbToHex(_hue, 100, _bri);
    satEl.style.background = 'linear-gradient(to right, ' + satLeft + ', ' + satRight + ')';

    
    var briEl = wrap.querySelector('.cp-bri');
    var briRight = hsbToHex(_hue, _sat, 100);
    briEl.style.background = 'linear-gradient(to right, #000000, ' + briRight + ')';

    function onSliderInput() {
      _hue = parseInt(hueEl.value);
      _sat = parseInt(satEl.value);
      _bri = parseInt(briEl.value);
      var newHex = hsbToHex(_hue, _sat, _bri);

      wrap.querySelector('.cp-preview').style.background = newHex;
      wrap.querySelector('.cp-hex-display').textContent = newHex;

      
      satEl.style.background = 'linear-gradient(to right, ' + hsbToHex(_hue, 0, _bri) + ', ' + hsbToHex(_hue, 100, _bri) + ')';
      
      briEl.style.background = 'linear-gradient(to right, #000000, ' + hsbToHex(_hue, _sat, 100) + ')';

      
      applyColorPreview(newHex);
      _colorChanged = true;

      
      if (_colorSaveTimeout) clearTimeout(_colorSaveTimeout);
      _colorSaveTimeout = setTimeout(function() {
        saveColor(newHex);
        _colorChanged = false;
      }, 500);
    }

    hueEl.addEventListener('input', onSliderInput);
    satEl.addEventListener('input', onSliderInput);
    briEl.addEventListener('input', onSliderInput);

    wrap.querySelector('#cp-reset').addEventListener('click', function() { saveColor(null); _colorChanged = false; });
  }

  function applyColorPreview(hex) {
    if (_colorTarget === 'banner') {
      var hero = document.querySelector('.profile-hero');
      if (hero) hero.style.background = hex;
    } else {
      var nameEl = document.getElementById('profile-username');
      if (nameEl) nameEl.style.color = hex;
    }
  }

  async function saveColor(hex) {
    if (_colorSaveTimeout) clearTimeout(_colorSaveTimeout);
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    var body = {};
    if (_colorTarget === 'banner') body.bannerColor = hex;
    else body.nameColor = hex;
    try {
      var res = await fetch(API_BASE + '/api/auth/update-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      var data = await res.json();
      if (data.success) {
        var u = AccountSync.getUser();
        if (u) {
          u.bannerColor = data.bannerColor;
          u.nameColor = data.nameColor;
        }
        successEl.textContent = (_colorTarget === 'banner' ? 'Banner' : 'Name') + ' color saved!';
        successEl.style.display = '';
        
        if (_colorTarget === 'banner') {
          var hero = document.querySelector('.profile-hero');
          if (hero) hero.style.background = data.bannerColor || '';
        } else {
          var nameEl = document.getElementById('profile-username');
          if (nameEl) nameEl.style.color = data.nameColor || '';
        }
      } else {
        showError(errEl, data.error || 'Failed to save color.');
      }
    } catch(e) { showError(errEl, 'Connection error.'); }
  }

  
  profileClose.addEventListener('click', function() { profileModal.style.display = 'none'; });
  profileModal.addEventListener('click', function(e) { if (e.target === profileModal) profileModal.style.display = 'none'; });

  
  document.getElementById('profile-bio').addEventListener('input', function() {
    document.getElementById('profile-bio-count').textContent = this.value.length;
  });
  document.getElementById('profile-update-bio').addEventListener('click', async function() {
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    var bio = document.getElementById('profile-bio').value;
    this.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/update-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio: bio })
      });
      var data = await res.json();
      if (data.success) {
        successEl.textContent = 'Bio updated!';
        successEl.style.display = '';
        var u = AccountSync.getUser();
        if (u) u.bio = data.bio;
      } else { showError(errEl, data.error || 'Failed to update bio.'); }
    } catch(e) { showError(errEl, 'Connection error.'); }
    this.disabled = false;
  });

  
  document.getElementById('profile-change-pw').addEventListener('click', async function() {
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    var current = document.getElementById('profile-current-pw').value;
    var newPw = document.getElementById('profile-new-pw').value;
    if (!current || !newPw) { showError(errEl, 'Please fill in both fields.'); return; }
    if (newPw.length < 8) { showError(errEl, 'New password must be at least 8 characters.'); return; }
    this.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: current, newPassword: newPw })
      });
      var data = await res.json();
      if (data.success) {
        successEl.textContent = 'Password updated!';
        successEl.style.display = '';
        document.getElementById('profile-current-pw').value = '';
        document.getElementById('profile-new-pw').value = '';
      } else { showError(errEl, data.error || 'Failed to update password.'); }
    } catch(e) { showError(errEl, 'Connection error.'); }
    this.disabled = false;
  });

  
  document.getElementById('profile-update-email').addEventListener('click', async function() {
    var errEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');
    hideError(errEl); successEl.style.display = 'none';
    var email = document.getElementById('profile-email').value.trim();
    if (!email) { showError(errEl, 'Please enter an email.'); return; }
    this.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email })
      });
      var data = await res.json();
      if (data.success) {
        successEl.textContent = 'Email updated!';
        successEl.style.display = '';
      } else { showError(errEl, data.error || 'Failed to update email.'); }
    } catch(e) { showError(errEl, 'Connection error.'); }
    this.disabled = false;
  });

  
  document.getElementById('profile-save-now').addEventListener('click', async function() {
    this.disabled = true;
    try {
      var result = await AccountSync.saveProgress({ force: true });
      if (result.success) {
        document.getElementById('profile-success').textContent = 'Progress saved!';
        document.getElementById('profile-success').style.display = '';
        var user = AccountSync.getUser();
        var tags = (user && user.tags) ? user.tags : (result.tags || []);
        renderTags(tags);
        renderTagCompendium(tags);
        if (result.awarded && result.awarded.length && typeof showNotification === 'function') {
          showNotification('Achievement unlocked: ' + result.awarded.join(', '));
        }
        if (result.removed && result.removed.length && typeof showNotification === 'function') {
          showNotification('Tags updated: ' + result.removed.join(', ') + ' removed');
        }
      } else {
        showError(document.getElementById('profile-error'), result.error || 'Save failed.');
      }
    } catch(e) { showError(document.getElementById('profile-error'), 'Connection error.'); }
    this.disabled = false;
  });
  document.getElementById('profile-load-now').addEventListener('click', async function() {
    if (!confirm('Load cloud save? This will overwrite your local progress.')) return;
    this.disabled = true;
    try {
      var result = await AccountSync.loadProgress({ overwriteLocal: true });
      if (result.success) {
        document.getElementById('profile-success').textContent = 'Cloud save loaded! Refreshing...';
        document.getElementById('profile-success').style.display = '';
        setTimeout(function() { location.reload(); }, 1200);
      } else {
        showError(document.getElementById('profile-error'), result.error || 'Load failed.');
      }
    } catch(e) { showError(document.getElementById('profile-error'), 'Connection error.'); }
    this.disabled = false;
  });

  
  document.getElementById('profile-delete-account').addEventListener('click', async function() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!confirm('FINAL WARNING: All your data will be permanently deleted. Continue?')) return;
    this.disabled = true;
    try {
      var res = await fetch(API_BASE + '/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      });
      var data = await res.json();
      if (data.success) {
        profileModal.style.display = 'none';
        alert('Account deleted.');
        location.reload();
      } else {
        showError(document.getElementById('profile-error'), data.error || 'Failed to delete account.');
      }
    } catch(e) { showError(document.getElementById('profile-error'), 'Connection error.'); }
    this.disabled = false;
  });

  
  function escapeTagHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  var ALLOWED_TAG_EFFECTS = {
    shine: true,
    glow: true,
    sparkle: true,
    rainbow: true,
    gradient: true,
    'moody-gradient': true
  };

  function isTagVisible(tag) {
    return !Number(tag && tag.hidden);
  }

  function tagEffectClass(effect) {
    if (!effect || !ALLOWED_TAG_EFFECTS[effect]) return '';
    return ' tag-' + effect;
  }

  function renderTags(tags) {
    var container = document.getElementById('profile-tags');
    if (!container) return;
    var visibleTags = (tags || []).filter(isTagVisible);
    if (!visibleTags.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = visibleTags.map(function(tag) {
      var effectClass = tagEffectClass(tag.tag_effect);
      var safeColor = /^#[0-9a-fA-F]{6}$/.test(tag.tag_color) ? tag.tag_color : '#888888';
      return '<span class="profile-tag' + effectClass + '" style="border-color:' + safeColor + ';color:' + safeColor + '">' + escapeTagHtml(tag.tag_name) + '</span>';
    }).join('');
  }

  function renderTagCompendium(userTags) {
    var container = document.getElementById('tags-section');
    if (!container) return;

    var earnedByName = indexUserTags(userTags);

    
    var html = '<div class="tag-compendium">';

    
    KNOWN_TAGS.forEach(function(def) {
      var earned = earnedByName[def.name];
      var isLocked = !earned;
      var safeColor = isLocked ? '#aaaaaa' : def.color;
      var effectClass = (!isLocked && def.effect) ? tagEffectClass(def.effect) : '';
      var desc = def.rare ? '???' : def.description;

      html += '<div class="tag-comp-entry' + (isLocked ? ' tag-comp-locked' : '') + '">';
      html += '<div class="tag-comp-header">';
      var displayName = earned ? earned.tag_name : def.name;
      html += '<span class="profile-tag' + effectClass + '" style="border-color:' + safeColor + ';color:' + safeColor + '">' + escapeTagHtml(displayName) + '</span>';
      if (!isLocked && earned && earned.id) {
        var isVisible = isTagVisible(earned);
        html += '<label class="tag-toggle-switch" title="' + (isVisible ? 'Shown on profile' : 'Hidden from profile') + '">';
        html += '<input type="checkbox" class="tag-toggle-input" data-tag-id="' + earned.id + '"' + (isVisible ? ' checked' : '') + '>';
        html += '<span class="tag-toggle-slider"></span>';
        html += '</label>';
        html += '<span class="tag-toggle-label">' + (isVisible ? 'Showing' : 'Hidden') + '</span>';
      }
      html += '</div>';
      html += '<div class="tag-comp-desc">' + escapeTagHtml(desc) + '</div>';
      html += '</div>';
    });

    
    (userTags || []).forEach(function(t) {
      if (KNOWN_TAGS.some(function(def) { return def.name === t.tag_name; })) return;
      if (isLuckyTagName(t.tag_name)) return;
      var safeColor = /^#[0-9a-fA-F]{6}$/.test(t.tag_color) ? t.tag_color : '#888888';
      var effectClass = tagEffectClass(t.tag_effect);
      var isVisible = isTagVisible(t);

      html += '<div class="tag-comp-entry">';
      html += '<div class="tag-comp-header">';
      html += '<span class="profile-tag' + effectClass + '" style="border-color:' + safeColor + ';color:' + safeColor + '">' + escapeTagHtml(t.tag_name) + '</span>';
      if (t.id) {
        html += '<label class="tag-toggle-switch" title="' + (isVisible ? 'Shown on profile' : 'Hidden from profile') + '">';
        html += '<input type="checkbox" class="tag-toggle-input" data-tag-id="' + t.id + '"' + (isVisible ? ' checked' : '') + '>';
        html += '<span class="tag-toggle-slider"></span>';
        html += '</label>';
        html += '<span class="tag-toggle-label">' + (isVisible ? 'Showing' : 'Hidden') + '</span>';
      }
      html += '</div>';
      html += '<div class="tag-comp-desc">Special tag.</div>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    
    container.querySelectorAll('.tag-toggle-input').forEach(function(input) {
      input.addEventListener('change', function() {
        var tagId = parseInt(this.getAttribute('data-tag-id'), 10);
        var newHidden = this.checked ? 0 : 1;
        toggleTagVisibility(tagId, newHidden, this);
      });
    });
  }

  async function toggleTagVisibility(tagId, newHidden, checkbox) {
    try {
      var res = await fetch(API_BASE + '/api/auth/tags/' + tagId + '/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ hidden: newHidden })
      });
      var data = await res.json();
      if (data.success) {
        
        var u = AccountSync.getUser();
        if (u && u.tags) {
          var t = u.tags.find(function(tag) { return tag.id === tagId; });
          if (t) t.hidden = newHidden;
        }
        
        var visibleTags = (u && u.tags || []).slice();
        renderTags(visibleTags);
        
        var entry = checkbox.closest('.tag-comp-entry');
        if (entry) {
          var lbl = entry.querySelector('.tag-toggle-label');
          if (lbl) lbl.textContent = newHidden ? 'Hidden' : 'Showing';
          checkbox.title = newHidden ? 'Hidden from profile' : 'Shown on profile';
        }
      } else {
        checkbox.checked = !checkbox.checked; 
        var errEl = document.getElementById('profile-error');
        if (errEl) showError(errEl, data.error || 'Failed to update tag visibility.');
      }
    } catch(e) {
      checkbox.checked = !checkbox.checked; 
      var errEl = document.getElementById('profile-error');
      if (errEl) showError(errEl, 'Connection error.');
    }
  }

  
  function open() {
    var user = AccountSync.getUser();
    if (!user) return;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-pw-username').value = user.username;
    avatarImg.src = avatarSrc(user.profilePicture);
    var bioEl = document.getElementById('profile-bio');
    bioEl.value = user.bio || '';
    document.getElementById('profile-bio-count').textContent = bioEl.value.length;
    avatarPicker.style.display = 'none';

    
    document.getElementById('profile-change-name-wrap').style.display = 'none';
    document.getElementById('profile-change-name-btn').style.display = '';

    
    var hero = document.querySelector('.profile-hero');
    if (hero) hero.style.background = user.bannerColor || '';
    applyProfileNameColor(user.nameColor);

    
    renderTags(user.tags || []);
    renderTagCompendium(user.tags || []);
    maybeSyncLocalLuckyTags(user);

    hideError(document.getElementById('profile-error'));
    document.getElementById('profile-success').style.display = 'none';

    
    var panel = document.getElementById('profile-friends-panel');
    var sections = profileModal.querySelector('.profile-sections');
    if (panel && sections) {
      panel.style.display = 'none';
      sections.style.display = '';
      
    }

    
    loadFriendRequestBadge();

    profileModal.style.display = 'block';
  }

  

  var _currentFriendTab = 'list';

  function loadFriendRequestBadge() {
    fetch(API_BASE + '/api/auth/friend-requests', { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var count = data.success && data.requests ? data.requests.length : 0;
        
        var badge = document.getElementById('friends-request-badge');
        if (badge) {
          if (count > 0) { badge.textContent = count; badge.style.display = ''; }
          else { badge.style.display = 'none'; }
        }
        
        var btnBadge = document.getElementById('profile-friends-btn-badge');
        if (btnBadge) {
          if (count > 0) { btnBadge.textContent = count; btnBadge.style.display = ''; }
          else { btnBadge.style.display = 'none'; }
        }
        
        var navBadge = document.getElementById('nav-friend-badge');
        if (navBadge) {
          if (count > 0) { navBadge.textContent = count; navBadge.style.display = ''; }
          else { navBadge.style.display = 'none'; }
        }
        
        fetch(API_BASE + '/api/auth/friends', { credentials: 'include' })
          .then(function(r2) { return r2.json(); })
          .then(function(d2) {
            var countEl = document.getElementById('profile-friends-count');
            if (countEl && d2.success) {
              countEl.textContent = '(' + (d2.friends ? d2.friends.length : 0) + ')';
            }
          }).catch(function() {});
      }).catch(function() {});
  }

  function openFriendsPanel() {
    var panel = document.getElementById('profile-friends-panel');
    var sections = profileModal.querySelector('.profile-sections');
    var pickerEl = document.getElementById('avatar-picker');
    if (!panel || !sections) return;
    if (pickerEl) pickerEl.style.display = 'none';
    sections.style.display = 'none';
    panel.style.display = '';
    _currentFriendTab = 'list';
    profileModal.querySelectorAll('.friends-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-ftab') === 'list');
    });
    loadFriendTab('list');
  }

  function closeFriendsPanel() {
    var panel = document.getElementById('profile-friends-panel');
    var sections = profileModal.querySelector('.profile-sections');
    if (!panel || !sections) return;
    panel.style.display = 'none';
    sections.style.display = '';
  }

  function loadFriendTab(tab) {
    _currentFriendTab = tab;
    var content = document.getElementById('friends-tab-content');
    if (!content) return;
    content.innerHTML = '<div class="friends-loading">Loading...</div>';
    if (tab === 'list') {
      fetch(API_BASE + '/api/auth/friends', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(data) { renderFriendsList(data.friends || []); })
        .catch(function() { content.innerHTML = '<div class="friends-empty">Could not load friends.</div>'; });
    } else {
      fetch(API_BASE + '/api/auth/friend-requests', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(data) { renderRequestsList(data.requests || []); })
        .catch(function() { content.innerHTML = '<div class="friends-empty">Could not load requests.</div>'; });
    }
  }

  function renderFriendsList(friends) {
    var content = document.getElementById('friends-tab-content');
    if (!content) return;
    if (!friends || friends.length === 0) {
      content.innerHTML = '<div class="friends-empty">No friends yet. Add some!</div>';
      return;
    }
    var html = '<ul class="friends-list">';
    friends.forEach(function(f) {
      html += '<li class="friends-list-item" data-username="' + escapeTagHtml(f.username) + '">' +
        '<img class="friends-list-avatar" src="' + escapeTagHtml(avatarSrc(f.profile_picture)) + '" alt="' + escapeTagHtml(f.username) + '" />' +
        '<div class="friends-list-info">' +
          '<span class="friends-list-name" style="' + (f.name_color ? 'color:' + escapeTagHtml(f.name_color) + ';' : '') + '">' + escapeTagHtml(f.username) + '</span>' +
          '<span class="friends-list-meta">' + (f.friend_count || 0) + ' friend' + (f.friend_count === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<button class="friends-view-btn auth-btn profile-btn-inline">View</button>' +
        '</li>';
    });
    html += '</ul>';
    content.innerHTML = html;
    content.querySelectorAll('.friends-list-item').forEach(function(item) {
      item.querySelector('.friends-view-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        openPublicProfile(item.getAttribute('data-username'));
      });
      item.addEventListener('click', function() {
        openPublicProfile(item.getAttribute('data-username'));
      });
    });
  }

  function renderRequestsList(requests) {
    var content = document.getElementById('friends-tab-content');
    if (!content) return;
    if (!requests || requests.length === 0) {
      content.innerHTML = '<div class="friends-empty">No pending friend requests.</div>';
      return;
    }
    var html = '<ul class="friends-list">';
    requests.forEach(function(r) {
      html += '<li class="friends-list-item" data-id="' + r.id + '" data-username="' + escapeTagHtml(r.username) + '">' +
        '<img class="friends-list-avatar" src="' + escapeTagHtml(avatarSrc(r.profile_picture)) + '" alt="' + escapeTagHtml(r.username) + '" />' +
        '<div class="friends-list-info">' +
          '<span class="friends-list-name">' + escapeTagHtml(r.username) + '</span>' +
          '<span class="friends-list-meta">wants to be your friend</span>' +
        '</div>' +
        '<div class="friends-req-actions">' +
          '<button class="friends-accept-btn auth-btn profile-btn-inline friends-accept">&#10003;</button>' +
          '<button class="friends-decline-btn auth-btn profile-btn-inline friends-decline">&#10007;</button>' +
        '</div>' +
        '</li>';
    });
    html += '</ul>';
    content.innerHTML = html;
    content.querySelectorAll('.friends-list-item').forEach(function(item) {
      var requesterId = parseInt(item.getAttribute('data-id'), 10);
      item.querySelector('.friends-accept-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        acceptFriendRequest(requesterId, item);
      });
      item.querySelector('.friends-decline-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        declineFriendRequest(requesterId, item);
      });
      item.addEventListener('click', function() {
        openPublicProfile(item.getAttribute('data-username'));
      });
    });
  }

  async function acceptFriendRequest(requesterId, itemEl) {
    try {
      var res = await fetch(API_BASE + '/api/auth/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requesterId: requesterId })
      });
      var data = await res.json();
      if (data.success) {
        itemEl.remove();
        var remaining = document.querySelectorAll('#friends-tab-content .friends-list-item').length;
        if (remaining === 0) {
          document.getElementById('friends-tab-content').innerHTML = '<div class="friends-empty">No pending friend requests.</div>';
        }
        loadFriendRequestBadge();
      }
    } catch(e) {}
  }

  async function declineFriendRequest(requesterId, itemEl) {
    try {
      var res = await fetch(API_BASE + '/api/auth/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requesterId: requesterId })
      });
      var data = await res.json();
      if (data.success) {
        itemEl.remove();
        var remaining = document.querySelectorAll('#friends-tab-content .friends-list-item').length;
        if (remaining === 0) {
          document.getElementById('friends-tab-content').innerHTML = '<div class="friends-empty">No pending friend requests.</div>';
        }
        loadFriendRequestBadge();
      }
    } catch(e) {}
  }

  

  var _pubProfileUsername = null;

  function openPublicProfile(username) {
    var modal = document.getElementById('pub-profile-modal');
    if (!modal) return;
    _pubProfileUsername = username;
    
    document.getElementById('pub-profile-avatar').src = avatarSrc(null);
    document.getElementById('pub-profile-username').textContent = '';
    document.getElementById('pub-profile-username').style.color = '';
    document.getElementById('pub-profile-friend-count').textContent = '';
    document.getElementById('pub-profile-hero').style.background = '';
    document.getElementById('pub-profile-tags').innerHTML = '';
    document.getElementById('pub-profile-bio').textContent = '';
    var friendBtn = document.getElementById('pub-profile-friend-btn');
    friendBtn.style.display = 'none';
    modal.style.display = 'block';

    fetch(API_BASE + '/api/auth/profile/' + encodeURIComponent(username), { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success || !data.profile) return;
        var p = data.profile;
        document.getElementById('pub-profile-avatar').src = avatarSrc(p.profilePicture);
        document.getElementById('pub-profile-username').textContent = p.username;
        if (p.nameColor) document.getElementById('pub-profile-username').style.color = p.nameColor;
        document.getElementById('pub-profile-friend-count').textContent = p.friendCount + ' friend' + (p.friendCount === 1 ? '' : 's');
        if (p.bannerColor) document.getElementById('pub-profile-hero').style.background = p.bannerColor;
        
        var tagsEl = document.getElementById('pub-profile-tags');
        if (p.tags && p.tags.length > 0) {
          tagsEl.innerHTML = p.tags.map(function(tag) {
            var effectClass = tagEffectClass(tag.tag_effect);
            var safeColor = /^#[0-9a-fA-F]{6}$/.test(tag.tag_color) ? tag.tag_color : '#888888';
            return '<span class="profile-tag' + effectClass + '" style="border-color:' + safeColor + ';color:' + safeColor + '">' + escapeTagHtml(tag.tag_name) + '</span>';
          }).join('');
        }
        
        if (p.bio) document.getElementById('pub-profile-bio').textContent = p.bio;
        
        if (p.relationship !== 'self') {
          friendBtn.style.display = '';
          updateFriendButton(p.relationship);
          friendBtn.onclick = function() { handleFriendAction(p.id, p.username, p.relationship); };
        }
      })
      .catch(function() {});
  }

  function updateFriendButton(relationship) {
    var btn = document.getElementById('pub-profile-friend-btn');
    if (!btn) return;
    if (relationship === 'none') {
      btn.textContent = '+ Add Friend';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-add';
    } else if (relationship === 'friends') {
      btn.textContent = '✓ Friends';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-remove';
    } else if (relationship === 'request_sent') {
      btn.textContent = 'Request Sent';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-pending';
    } else if (relationship === 'request_received') {
      btn.textContent = 'Accept Request';
      btn.className = 'auth-btn pub-profile-friend-btn pub-profile-friend-add';
    }
  }

  async function handleFriendAction(userId, username, currentRelationship) {
    if (typeof ProfileViewer !== 'undefined' && typeof ProfileViewer.handleFriendAction === 'function') {
      return ProfileViewer.handleFriendAction(userId, username, currentRelationship);
    }
    
    var btn = document.getElementById('pub-profile-friend-btn');
    if (!btn) return;
    btn.disabled = true;
    try {
      if (currentRelationship === 'none' || currentRelationship === 'request_received') {
        var res = await fetch(API_BASE + '/api/auth/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: username })
        });
        var data = await res.json();
        if (data.success) {
          var newRel = data.status === 'accepted' ? 'friends' : 'request_sent';
          updateFriendButton(newRel);
          btn.onclick = function() { handleFriendAction(userId, username, newRel); };
          loadFriendRequestBadge();
        }
      } else if (currentRelationship === 'friends') {
        if (!confirm('Remove ' + username + ' from friends?')) { btn.disabled = false; return; }
        var res = await fetch(API_BASE + '/api/auth/friends/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: userId })
        });
        var data = await res.json();
        if (data.success) {
          updateFriendButton('none');
          btn.onclick = function() { handleFriendAction(userId, username, 'none'); };
          loadFriendRequestBadge();
        }
      } else if (currentRelationship === 'request_sent') {
        var res = await fetch(API_BASE + '/api/auth/friends/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: userId })
        });
        var data = await res.json();
        if (data.success) {
          updateFriendButton('none');
          btn.onclick = function() { handleFriendAction(userId, username, 'none'); };
        }
      }
    } catch(e) {}
    btn.disabled = false;
  }

  
  var friendsPanelBack = document.getElementById('friends-panel-back');
  if (friendsPanelBack) {
    friendsPanelBack.addEventListener('click', closeFriendsPanel);
  }

  var profileFriendsBtn = document.getElementById('profile-friends-btn');
  if (profileFriendsBtn) {
    profileFriendsBtn.addEventListener('click', openFriendsPanel);
  }

  profileModal.querySelectorAll('.friends-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      profileModal.querySelectorAll('.friends-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      loadFriendTab(tab.getAttribute('data-ftab'));
    });
  });

  
  var pubProfileClose = document.getElementById('pub-profile-close');
  var pubProfileModal = document.getElementById('pub-profile-modal');
  if (pubProfileClose && pubProfileModal) {
    pubProfileClose.addEventListener('click', function() { pubProfileModal.style.display = 'none'; });
    pubProfileModal.addEventListener('click', function(e) { if (e.target === pubProfileModal) pubProfileModal.style.display = 'none'; });
  }

  
  loadFriendRequestBadge();

  window.addEventListener('28bugs-tags-updated', function(e) {
    if (profileModal.style.display !== 'block') return;
    var tags = (e.detail && e.detail.tags) || [];
    renderTags(tags);
    renderTagCompendium(tags);
  });

  return {
    open: open,
    avatarSrc: avatarSrc,
    openPublicProfile: function(username) {
      if (typeof ProfileViewer !== 'undefined') {
        ProfileViewer.openProfile(username);
      } else {
        openPublicProfile(username);
      }
    },
    refreshBadge: loadFriendRequestBadge
  };
})();
