(function(){
  var COIN_STORAGE_KEY = '28bugs_gameCoins';
  var MUSIC_PURCHASE_STORAGE_KEY = '28bugs_musicPurchases';
  var MUSIC_STATE_KEY = '28bugs_musicCurrentKey';
  var MUSIC_PLAYING_KEY = '28bugs_musicPlaying';
  var MUSIC_SHUFFLE_KEY = '28bugs_musicShuffle';
  var MUSIC_REPEAT_MODE_KEY = '28bugs_musicRepeatMode';
  var MUSIC_KEEPPLAY_KEY = '28bugs_musicKeepPlay';
  var MUSIC_TIME_KEY = '28bugs_musicTime';
  var MUSIC_SHUFFLE_ALLOW_KEY = '28bugs_musicShuffleAllow';
  var MUSIC_VOLUME_KEY = '28bugs_musicVolume';
  var REPEAT_MODES = ['off', 'all', 'one'];
  var tracks = [
    { key: 'track1', name: 'Track 1', price: 100, file: 'src/music/track1.mp3', description: 'eShop - Menu (Track 2) WiiU' },
    { key: 'track2', name: 'Track 2', price: 100, file: 'src/music/track2.mp3', description: 'eShop - Menu (Track 5) WiiU' },
    { key: 'track3', name: 'Track 3', price: 100, file: 'src/music/track3.mp3', description: 'eShop - Menu (Track 6) WiiU' },
    { key: 'track4', name: 'Track 4', price: 100, file: 'src/music/track4.mp3', description: 'Mii Maker Editing Mii (TV + Gamepad)' },
    { key: 'track5', name: 'Track 5', price: 100, file: 'src/music/track5.mp3', description: 'eShop - Menu (Track 10) WiiU' },
    { key: 'track6', name: 'Track 6', price: 150, file: 'src/music/track6.mp3', description: 'eShop - Menu (Track 8) WiiU' },
    { key: 'track7', name: 'Track 7', price: 150, file: 'src/music/track7.mp3', description: 'LEASE - Takeshi Abo' },
    { key: 'track8', name: 'Track 8', price: 200, file: 'src/music/track8.mp3', description: 'Local Forecast (Daytime) Weather Channel Wii' },
    { key: 'track9', name: 'Lotus Waters', price: 150, file: 'src/music/track9.mp3', description: 'Lotus Waters - Yume 2kki' },
    { key: 'track10', name: 'Tea and Cake', price: 150, file: 'src/music/track10.mp3', description: 'Tea and Cake - Style Savvy: Trendsetters' },
    { key: 'track11', name: 'Internet Settings', price: 100, file: 'src/music/track11.mp3', description: '3DS Settings' },
    { key: 'track12', name: 'Track 12', price: 100, file: 'src/music/track12.mp3', description: 'eShop - Menu (Track 3) WiiU' },
    { key: 'track13', name: 'Track 13', price: 100, file: 'src/music/track13.mp3', description: 'eShop - Menu (Track 7) WiiU' },
    { key: 'track14', name: 'Track 14', price: 100, file: 'src/music/track14.mp3', description: 'eShop - Menu (Christmas 2015) WiiU' },
    { key: 'track15', name: 'Track 15', price: 150, file: 'src/music/track15.mp3', description: 'News Channel Wii' },
    { key: 'track16', name: 'Theme Shop', price: 150, file: 'src/music/track16.mp3', description: 'Theme Shop 3DS' }
  ];
  var audioMap = {};
  var currentKey = null;
  var shuffleMode = localStorage.getItem(MUSIC_SHUFFLE_KEY) !== '0';
  var repeatMode = (function(){
    var saved = localStorage.getItem(MUSIC_REPEAT_MODE_KEY);
    return REPEAT_MODES.indexOf(saved) !== -1 ? saved : 'all';
  })();
  var keepPlayMode = localStorage.getItem(MUSIC_KEEPPLAY_KEY) !== '0';
  var shuffleAllow = loadShuffleAllow();
  var timeSaverInterval = null;
  var progressInterval = null;
  var playHistory = [];
  var ui = {
    modal: document.getElementById('music-shop-modal'),
    items: document.getElementById('music-shop-items'),
    openBtn: document.getElementById('music-shop-btn'),
    closeBtn: document.getElementById('music-shop-close'),
    shell: null,
    nowTitle: null,
    nowDesc: null,
    nowStatus: null,
    art: null,
    shuffleBtn: null,
    repeatBtn: null,
    keepBtn: null,
    playBtn: null,
    nextBtn: null,
    prevBtn: null,
    progressFill: null,
    progressBar: null,
    elapsed: null,
    duration: null,
    headerCoins: document.getElementById('music-coin-count')
  };

  function ensureMusicModalStylesInjected(){
    try {
      if(document.getElementById('music-modal-shared-styles')) return;
      var style = document.createElement('style');
      style.id = 'music-modal-shared-styles';
      style.textContent = [
        '#music-shop-modal{display:none;position:fixed;inset:0;background-color:rgba(0,0,0,0.7);z-index:2000;}',
        '#music-shop-modal .modal-content{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;border-radius:10px;',
        'background:linear-gradient(180deg,var(--panel-bg-start, rgba(255,255,255,0.98)) 0%,var(--panel-bg-mid, rgba(245,245,245,0.95)) 50%,var(--panel-bg-end, rgba(235,235,235,0.92)) 100%);',
        'color:var(--ink,#1b2838);border:2px solid var(--panel-border, rgba(0,0,0,0.05));box-shadow:0 12px 30px rgba(0,0,0,0.35);}',
        '#music-shop-modal .modal-header{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px;}',
        '#music-shop-modal .modal-header h2{margin:0;}',
        '#music-shop-modal .balance{display:flex;align-items:center;gap:6px;font-weight:600;}',
        '#music-shop-modal .coin-icon{width:20px;height:20px;}',
        '#music-shop-modal .close-button{position:absolute;right:16px;top:12px;font-size:24px;cursor:pointer;color:var(--ink-muted,#6b7280);background:none;border:none;font-weight:bold;}',
        '#music-shop-modal .close-button:hover{color:var(--ink,#1b2838);}',
        '#music-shop-modal .music-modal-shell{display:flex;flex-direction:column;gap:12px;margin-bottom:12px;}',
        '#music-shop-modal .music-now{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--panel-border,#dfe6f1);border-radius:12px;background:var(--panel-bg-start,#f5f8ff);color:var(--ink,#1b2838);}',
        '#music-shop-modal .music-volume{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--panel-border,#dfe6f1);border-radius:12px;background:var(--panel-bg-start,#f5f8ff);color:var(--ink,#1b2838);}',
        '#music-shop-modal .music-volume-label{font-weight:700;min-width:60px;}',
        '#music-shop-modal .music-volume-control{flex:1;height:6px;accent-color:var(--accent,#64b5f6);}',
        '#music-shop-modal .music-volume-value{min-width:40px;text-align:right;font-weight:700;color:var(--ink,#1b2838);}',
        '#music-shop-modal .music-art{width:64px;height:64px;border-radius:14px;background:var(--accent,#1d2a44);color:var(--panel-accent-contrast,#f2f7ff);display:grid;place-items:center;font-weight:700;font-size:22px;box-shadow:0 6px 18px var(--panel-shadow, rgba(29,42,68,0.25));}',
        '#music-shop-modal .music-title{font-weight:700;font-size:1.05rem;color:var(--ink,#1b2838);}',
        '#music-shop-modal .music-desc{font-size:0.9rem;color:var(--ink-muted,#4b5563);}',
        '#music-shop-modal .music-status{font-size:0.85rem;color:var(--accent,#2563eb);font-weight:600;}',
        '#music-shop-modal .music-controls{display:flex;flex-wrap:wrap;gap:8px;}',
        '#music-shop-modal .music-controls button{flex:1 1 90px;padding:10px 12px;border:1px solid var(--panel-border,#c6d4ee);border-radius:10px;background:var(--panel-bg-start,#f3f6fd);color:var(--ink,#0f172a);font-weight:600;box-shadow:0 2px 8px var(--panel-shadow, rgba(15,23,42,0.08));transition:transform .12s ease, box-shadow .12s ease, background .2s ease;}',
        '#music-shop-modal .music-controls button:hover{transform:translateY(-1px);box-shadow:0 4px 12px var(--panel-shadow, rgba(15,23,42,0.12));background:var(--panel-bg-mid,#e7edfb);}',
        '#music-shop-modal .music-controls button.active{border-color:var(--accent,#2563eb);background:var(--panel-bg-mid,#dbeafe);color:var(--ink,#0f172a);}',
        '#music-shop-modal .music-progress{display:flex;align-items:center;gap:10px;}',
        '#music-shop-modal .music-progress-bar{position:relative;flex:1;height:8px;border-radius:999px;background:var(--panel-bg-mid,#e6edf5);overflow:hidden;cursor:pointer;padding:6px 0;background-clip:content-box;}',
        '#music-shop-modal .music-progress-fill{position:absolute;top:0;left:0;height:100%;width:0%;background:var(--accent,#2563eb);transition:width .2s ease;pointer-events:none;}',
        '#music-shop-modal .music-time{font-size:0.85rem;color:var(--ink-muted,#475569);min-width:42px;text-align:center;}',
        '#music-shop-modal .music-track{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px;margin-bottom:10px;border-radius:12px;border:1px solid var(--panel-border,#e5edf7);background:var(--panel-bg-start,#f8fafc);flex-wrap:nowrap;}',
        '#music-shop-modal .music-track-meta{display:flex;flex-direction:column;gap:4px;flex:1 1 auto;min-width:0;}',
        '#music-shop-modal .music-track-title{font-weight:700;color:var(--ink,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '#music-shop-modal .music-track-desc{font-size:0.9rem;color:var(--ink-muted,#4b5563);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '#music-shop-modal .music-track-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;flex:0 0 300px;}',
        '#music-shop-modal .music-track-price{font-weight:700;color:var(--ink,#0f172a);}',
        '#music-shop-modal .music-track-toggle{display:flex;align-items:center;gap:6px;font-size:0.9rem;color:var(--ink-muted,#334155);}',
        '#music-shop-modal .music-inline-btn{padding:8px 12px;border-radius:8px;border:1px solid var(--panel-border,#c6d4ee);background:var(--panel-bg-start,white);color:var(--ink,#0f172a);font-weight:600;cursor:pointer;transition:background .15s ease, transform .12s ease;}',
        '#music-shop-modal .music-inline-btn:hover:enabled{background:var(--panel-bg-mid,#e7edfb);transform:translateY(-1px);}',
        '#music-shop-modal .music-inline-btn.secondary{background:var(--accent,#0f172a);color:var(--panel-accent-contrast,#f8fafc);border-color:var(--accent,#0f172a);}',
        'body.theme-light #music-shop-modal .music-inline-btn.secondary{color:#fff;}',
        '@media (max-width:640px){#music-shop-modal .music-track{flex-direction:column;align-items:flex-start;}#music-shop-modal .music-track-actions{width:100%;justify-content:flex-start;}}',
        'body.theme-dark #music-shop-modal .music-now,body.theme-dark #music-shop-modal .music-volume,body.theme-dark #music-shop-modal .music-track,',
        'body.theme-midnight #music-shop-modal .music-now,body.theme-midnight #music-shop-modal .music-volume,body.theme-midnight #music-shop-modal .music-track{background:var(--panel-bg-mid,#171c20);}',
        'body.theme-dark #music-shop-modal .music-controls button,body.theme-midnight #music-shop-modal .music-controls button,',
        'body.theme-dark #music-shop-modal .music-inline-btn,body.theme-midnight #music-shop-modal .music-inline-btn{background:var(--panel-bg-start,#13171b);color:var(--ink,#e8eef5);}',
        'body.theme-dark #music-shop-modal .music-controls button.active,body.theme-midnight #music-shop-modal .music-controls button.active{background:var(--accent,#64b5f6);color:var(--panel-accent-contrast,#0b1321);}'
      ].join('');
      document.head.appendChild(style);
    } catch(_){ }
  }

  function normalizeMusicModalDOM(){
    if(!ui.modal) return;
    ui.modal.id = 'music-shop-modal';
    ui.modal.classList.add('modal');

    var content = ui.modal.querySelector('.modal-content');
    if(!content){
      content = document.createElement('div');
      content.className = 'modal-content';
      while(ui.modal.firstChild){ content.appendChild(ui.modal.firstChild); }
      ui.modal.appendChild(content);
    }
    if(content){
      content.removeAttribute('style');
      content.classList.add('music-modal-content');
    }

    var closeBtn = document.getElementById('music-shop-close');
    if(!closeBtn){
      closeBtn = document.createElement('span');
      closeBtn.id = 'music-shop-close';
      closeBtn.className = 'close-button';
      closeBtn.setAttribute('role','button');
      closeBtn.setAttribute('aria-label','Close');
      closeBtn.innerHTML = '&times;';
      if(content) content.appendChild(closeBtn);
    } else {
      closeBtn.removeAttribute('style');
      closeBtn.className = 'close-button';
    }

    var header = content ? content.querySelector('.modal-header') : null;
    if(!header && content){
      header = document.createElement('div');
      header.className = 'modal-header';
      var h2 = document.createElement('h2');
      h2.textContent = 'Music Tracks';
      header.appendChild(h2);

      var balance = document.createElement('div');
      balance.className = 'balance';

      var coinImg = document.createElement('img');
      coinImg.src = 'src/penny.png';
      coinImg.alt = 'Coin';
      coinImg.className = 'coin-icon';
      var coinCount = document.createElement('span');
      coinCount.id = 'music-coin-count';
      coinCount.textContent = '0';
      balance.appendChild(coinImg);
      balance.appendChild(coinCount);

      header.appendChild(balance);
      content.insertBefore(header, content.firstChild);
    } else if(header) {
      header.removeAttribute('style');
      header.classList.add('modal-header');
      var coinCountExisting = document.getElementById('music-coin-count');
      if(!coinCountExisting){
        var balanceExisting = header.querySelector('.balance');
        if(!balanceExisting){
          balanceExisting = document.createElement('div');
          balanceExisting.className = 'balance';
          header.appendChild(balanceExisting);
        }
        var img = balanceExisting.querySelector('img');
        if(!img){
          img = document.createElement('img');
          img.src = 'src/penny.png';
          img.alt = 'Coin';
          img.className = 'coin-icon';
          balanceExisting.insertBefore(img, balanceExisting.firstChild);
        }
        img.removeAttribute('style');
        img.classList.add('coin-icon');
        var span = document.createElement('span');
        span.id = 'music-coin-count';
        span.textContent = '0';
        balanceExisting.appendChild(span);
      }
    }

    var items = document.getElementById('music-shop-items');
    if(!items && content){
      items = document.createElement('div');
      items.id = 'music-shop-items';
      content.appendChild(items);
    }

    var extra = document.getElementById('music-extra-controls');
    if(!extra && content){
      extra = document.createElement('div');
      extra.id = 'music-extra-controls';
      extra.style.marginTop = '12px';
      extra.style.display = 'flex';
      extra.style.gap = '8px';
      extra.style.flexWrap = 'wrap';
      content.appendChild(extra);
    }

    
    ui.modal = document.getElementById('music-shop-modal');
    ui.items = document.getElementById('music-shop-items');
    ui.closeBtn = document.getElementById('music-shop-close');
    ui.headerCoins = document.getElementById('music-coin-count');
  }

  function loadShuffleAllow(){
    try {
      var raw = localStorage.getItem(MUSIC_SHUFFLE_ALLOW_KEY);
      return raw ? JSON.parse(raw) || {} : {};
    } catch(_){ return {}; }
  }
  function saveShuffleAllow(){
    try { localStorage.setItem(MUSIC_SHUFFLE_ALLOW_KEY, JSON.stringify(shuffleAllow)); } catch(_){ }
  }
  
  function reliableSeek(audio, targetTime, thenPlay) {
    if (!audio || !audio.duration || targetTime < 0) return;
    targetTime = Math.min(targetTime, audio.duration - 0.1);
    var wasPlaying = !audio.paused;

    function doSeek() {
      audio.currentTime = targetTime;
      var settled = false;
      var onSeeked = function () {
        if (settled) return; settled = true;
        if (thenPlay || wasPlaying) audio.play().catch(function () {});
      };
      audio.addEventListener('seeked', onSeeked, { once: true });
      
      setTimeout(function () {
        if (settled) return; settled = true;
        audio.removeEventListener('seeked', onSeeked);
        if (thenPlay || wasPlaying) audio.play().catch(function () {});
      }, 400);
    }

    if (!audio.paused) {
      audio.pause();
      
      setTimeout(doSeek, 20);
    } else {
      doSeek();
    }
  }

  function getMasterVolume(){
    var savedVol = localStorage.getItem(MUSIC_VOLUME_KEY);
    return savedVol !== null ? parseInt(savedVol, 10) / 100 : 1;
  }

  function getTrackByKey(key){
    for(var i = 0; i < tracks.length; i++){
      if(tracks[i].key === key) return tracks[i];
    }
    return null;
  }

  function getAudioInstance(key){
    if(!key) return null;
    if(audioMap[key]) return audioMap[key];

    var boot = window.__28bugs_bootAudio;
    if(boot && boot.key === key && boot.audio){
      audioMap[key] = boot.audio;
      boot.consumed = true;
      boot.audio = null;
      delete window.__28bugs_bootAudio;
      return audioMap[key];
    }

    var track = getTrackByKey(key);
    if(!track) return null;

    var a = new Audio(track.file);
    if (window.BugSFX) window.BugSFX.markAsMusic(a);
    a.preload = 'auto';
    a.loop = false;
    a.volume = getMasterVolume();
    audioMap[key] = a;
    return a;
  }
  function getCoins(){
    if (typeof GameCoins !== 'undefined' && GameCoins.getCoins) return GameCoins.getCoins();
    var stored = localStorage.getItem(COIN_STORAGE_KEY);
    var parsed = stored ? parseInt(stored, 10) : 0;
    return (isNaN(parsed) || parsed === null || parsed === undefined) ? 0 : parsed;
  }
  function setCoins(v){
    if (typeof GameCoins !== 'undefined' && GameCoins.setCoins) return GameCoins.setCoins(v);
    localStorage.setItem(COIN_STORAGE_KEY, String(v));
  }
  function spendCoins(amount){
    if (typeof GameCoins !== 'undefined' && GameCoins.spendCoins) return GameCoins.spendCoins(amount);
    var c = getCoins();
    if(c < amount) return false;
    setCoins(c - amount); return true;
  }
  function updateCoinDisplays(){
    var raw = (typeof GameCoins !== 'undefined' && GameCoins.getCoinsBig) ? GameCoins.getCoinsBig() : getCoins();
    var coinAmount = (typeof window.formatCoinAmount === 'function' ? window.formatCoinAmount(raw) : String(raw));
    coinAmount = coinAmount || '0';
    var el1 = document.getElementById('coin-count');
    if(el1) el1.textContent = coinAmount;
    if(ui.headerCoins) ui.headerCoins.textContent = coinAmount;
  }
  function loadPurchases(){
    try { var raw = localStorage.getItem(MUSIC_PURCHASE_STORAGE_KEY); return raw? JSON.parse(raw)||{} : {}; } catch(e){ return {}; }
  }
  function savePurchases(obj){
    localStorage.setItem(MUSIC_PURCHASE_STORAGE_KEY, JSON.stringify(obj));
    if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
      AccountSync.touchLocalSave();
    }
  }
  function isPurchased(key){ 
    if(['track1', 'track2', 'track3'].includes(key)) return true;
    var p = loadPurchases(); 
    return !!p[key]; 
  }
  function getPurchasedTracks(){ return tracks.filter(function(t){ return isPurchased(t.key); }); }
  function getShufflablePurchased(){ return getPurchasedTracks().filter(function(t){ return shuffleAllow[t.key] !== false; }); }

  function purchaseTrack(track){
    if(isPurchased(track.key)) return;
    if(!spendCoins(track.price)) { alert('Not enough coins for this track.'); return; }
    var p = loadPurchases(); p[track.key] = true; savePurchases(p);
    updateCoinDisplays();
    render();
    if (typeof AccountSync !== 'undefined' && AccountSync.saveProgress) {
      AccountSync.saveProgress().catch(function () {});
    }
  }

  function applyPlaybackModes(a){
    if(!a) return;
    a.loop = repeatMode === 'one';
    a.onended = function(){ handleTrackEnd(); };
  }

  function handleTrackEnd(){
    if(!currentKey) return;
    if(repeatMode === 'one'){
      playTrack(currentKey);
      return;
    }
    var nextKey = shuffleMode ? pickRandomTrackKey() : getSequentialKey(1);
    if(!nextKey){
      localStorage.setItem(MUSIC_PLAYING_KEY, '0');
      stopSavingTime(false);
      stopProgressTimer();
      render();
      return;
    }
    playTrack(nextKey);
  }

  function pickRandomTrackKey(){
    var pool = getShufflablePurchased();
    if(!pool.length) pool = getPurchasedTracks();
    if(!pool.length) return null;
    if(pool.length > 1 && currentKey){
      pool = pool.filter(function(t){ return t.key !== currentKey; });
      if(!pool.length) pool = getShufflablePurchased();
    }
    if(!pool.length) return currentKey || null;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    return pick ? pick.key : null;
  }

  function getSequentialKey(direction){
    var purchased = getPurchasedTracks();
    if(!purchased.length) return null;
    var idx = purchased.findIndex(function(t){ return t.key === currentKey; });
    if(idx === -1) idx = direction > 0 ? -1 : 0;
    var nextIdx = idx + direction;
    if(nextIdx >= purchased.length){
      if(repeatMode === 'all') nextIdx = 0; else return null;
    }
    if(nextIdx < 0){
      if(repeatMode === 'all') nextIdx = purchased.length - 1; else return null;
    }
    return purchased[nextIdx] ? purchased[nextIdx].key : null;
  }

  function playTrack(key){
    if(!isPurchased(key)) return;
    if(currentKey && currentKey !== key) {
      playHistory.push(currentKey);
      if(playHistory.length > 50) playHistory.shift();
    }
    if(currentKey && audioMap[currentKey]){
      audioMap[currentKey].pause();
      audioMap[currentKey].currentTime = 0;
    }
    currentKey = key;
    var a = getAudioInstance(key);
    if(a){ applyPlaybackModes(a); a.play().catch(function(){}); }
    localStorage.setItem(MUSIC_STATE_KEY, key);
    localStorage.setItem(MUSIC_PLAYING_KEY, '1');
    startSavingTime();
    startProgressTimer();
    render();
  }

  function pauseMusic(){
    if(currentKey && audioMap[currentKey]){
      audioMap[currentKey].pause();
    }
    localStorage.setItem(MUSIC_PLAYING_KEY, '0');
    stopSavingTime(true);
    stopProgressTimer();
    render();
  }

  var overlayPaused = false;

  function pauseForOverlay(){
    if(localStorage.getItem(MUSIC_PLAYING_KEY) !== '1') return;
    var boot = window.__28bugs_bootAudio;
    if(boot && boot.audio && !boot.audio.paused){
      overlayPaused = true;
      try { localStorage.setItem(MUSIC_TIME_KEY, String(boot.audio.currentTime)); } catch(_){}
      boot.audio.pause();
      stopProgressTimer();
      stopSavingTime(false);
      return;
    }
    var key = currentKey || localStorage.getItem(MUSIC_STATE_KEY);
    if(!key) return;
    var a = getAudioInstance(key);
    if(!a || a.paused) return;
    if(!currentKey) currentKey = key;
    overlayPaused = true;
    try { localStorage.setItem(MUSIC_TIME_KEY, String(a.currentTime)); } catch(_){}
    a.pause();
    stopProgressTimer();
    stopSavingTime(false);
  }

  function resumeFromOverlay(){
    if(!overlayPaused) return;
    overlayPaused = false;
    if(localStorage.getItem(MUSIC_PLAYING_KEY) !== '1') return;
    var key = currentKey || localStorage.getItem(MUSIC_STATE_KEY);
    if(!key || !isPurchased(key)) return;
    if(!currentKey) currentKey = key;
    var a = getAudioInstance(key);
    if(!a) return;
    applyPlaybackModes(a);
    var wantTime = parseFloat(localStorage.getItem(MUSIC_TIME_KEY) || '0');
    var doResume = function(){
      if(wantTime > 0.5 && a.duration){
        reliableSeek(a, wantTime, true);
      } else {
        a.play().catch(function(){});
      }
      startSavingTime();
      startProgressTimer();
      render();
    };
    if(a.readyState >= 3){ doResume(); }
    else { a.addEventListener('canplay', doResume, { once: true }); }
  }

  function restoreState(){
    var savedKey = localStorage.getItem(MUSIC_STATE_KEY);
    var playing = localStorage.getItem(MUSIC_PLAYING_KEY) === '1' && keepPlayMode;
    if(savedKey && isPurchased(savedKey)){
      currentKey = savedKey;
      if(playing){
        var a = getAudioInstance(savedKey);
        if(a){
          applyPlaybackModes(a);
          
          if(!a.paused && a.currentTime > 1){
            startSavingTime();
            startProgressTimer();
          } else {
            
            
            
            var wantTime = parseFloat(localStorage.getItem(MUSIC_TIME_KEY) || '0');
            var doRestore = function(){
              
              if(!a.paused && Math.abs(a.currentTime - wantTime) < 2){
                startSavingTime();
                startProgressTimer();
                return;
              }
              
              if(wantTime > 0.5 && a.duration){
                reliableSeek(a, wantTime, true);
              } else {
                a.play().catch(function(err){
                  console.warn('[MusicShop] restoreState play error:', err);
                  if(typeof window.__28bugs_armMusicUnlock === 'function'){
                    window.__28bugs_armMusicUnlock(a);
                  }
                });
              }
              if(a.paused && typeof window.__28bugs_armMusicUnlock === 'function'){
                window.__28bugs_armMusicUnlock(a);
              }
              startSavingTime();
              startProgressTimer();
            };
            if(a.readyState >= 3){ doRestore(); }
            else { a.addEventListener('canplay', doRestore, { once: true }); }
          }
        }
      }
    }
  }

  function buildUIOnce(){
    if(!ui.modal || !ui.items) return;
    if(ui.shell) return;
    var modalContent = ui.modal.querySelector('.modal-content') || ui.modal;
    var shell = document.getElementById('music-player-shell');
    if(shell){
      shell.className = 'music-modal-shell';
      shell.innerHTML = '';
    } else {
      shell = document.createElement('div');
      shell.className = 'music-modal-shell';
      modalContent.insertBefore(shell, ui.items);
    }
    ui.shell = shell;

    var now = document.createElement('div');
    now.className = 'music-now';
    var art = document.createElement('div');
    art.className = 'music-art';
    art.textContent = '♪';
    ui.art = art;
    var meta = document.createElement('div');
    meta.className = 'music-meta';
    var title = document.createElement('div');
    title.className = 'music-title';
    title.textContent = 'No track selected';
    var desc = document.createElement('div');
    desc.className = 'music-desc';
    desc.textContent = 'Pick a track to start';
    var status = document.createElement('div');
    status.className = 'music-status';
    status.textContent = 'Idle';
    meta.appendChild(title);
    meta.appendChild(desc);
    meta.appendChild(status);
    now.appendChild(art);
    now.appendChild(meta);
    ui.nowTitle = title;
    ui.nowDesc = desc;
    ui.nowStatus = status;

    var controls = document.createElement('div');
    controls.className = 'music-controls';
    var prev = document.createElement('button'); prev.id='music-prev-btn'; prev.textContent='⏮';
    var play = document.createElement('button'); play.id='music-play-btn'; play.textContent='Play';
    var next = document.createElement('button'); next.id='music-next-btn'; next.textContent='⏭';
    var shuffle = document.createElement('button'); shuffle.id='music-shuffle-btn';
    var repeat = document.createElement('button'); repeat.id='music-repeat-btn';
    var keep = document.createElement('button'); keep.id='music-keep-btn';
    controls.appendChild(prev);
    controls.appendChild(play);
    controls.appendChild(next);
    controls.appendChild(shuffle);
    controls.appendChild(repeat);
    controls.appendChild(keep);
    ui.prevBtn = prev; ui.playBtn = play; ui.nextBtn = next; ui.shuffleBtn = shuffle; ui.repeatBtn = repeat; ui.keepBtn = keep;

    var progressWrap = document.createElement('div');
    progressWrap.className = 'music-progress';
    var elapsed = document.createElement('span'); elapsed.className = 'music-time'; elapsed.textContent = '0:00';
    var bar = document.createElement('div'); bar.className = 'music-progress-bar';
    var fill = document.createElement('div'); fill.className = 'music-progress-fill';
    bar.appendChild(fill);
    var duration = document.createElement('span'); duration.className = 'music-time'; duration.textContent = '--:--';
    progressWrap.appendChild(elapsed);
    progressWrap.appendChild(bar);
    progressWrap.appendChild(duration);
    ui.progressFill = fill; ui.progressBar = bar; ui.elapsed = elapsed; ui.duration = duration;

    var volumeWrap = document.createElement('div');
    volumeWrap.className = 'music-volume';
    var volumeLabel = document.createElement('span');
    volumeLabel.className = 'music-volume-label';
    volumeLabel.textContent = 'Volume:';
    var volumeControl = document.createElement('input');
    volumeControl.type = 'range';
    volumeControl.min = '0';
    volumeControl.max = '100';
    volumeControl.value = '100';
    volumeControl.className = 'music-volume-control';
    var volumeValue = document.createElement('span');
    volumeValue.className = 'music-volume-value';
    volumeValue.textContent = '100%';

    var savedVol = localStorage.getItem(MUSIC_VOLUME_KEY);
    var initVol = savedVol !== null ? parseInt(savedVol, 10) : 100;
    volumeControl.value = String(initVol);
    volumeValue.textContent = initVol + '%';

    volumeControl.addEventListener('input', function(e) {
        var vol = parseFloat(e.target.value) / 100;
        volumeValue.textContent = e.target.value + '%';
        localStorage.setItem(MUSIC_VOLUME_KEY, e.target.value);
        Object.keys(audioMap).forEach(function(key) {
            audioMap[key].volume = vol;
        });
    });

    volumeWrap.appendChild(volumeLabel);
    volumeWrap.appendChild(volumeControl);
    volumeWrap.appendChild(volumeValue);
    ui.volumeControl = volumeControl;

    shell.appendChild(now);
    shell.appendChild(controls);
    shell.appendChild(progressWrap);
    shell.appendChild(volumeWrap);

    bar.addEventListener('click', function(e){
      e.stopPropagation();
      if(!currentKey || !audioMap[currentKey]) return;
      var a = audioMap[currentKey];
      if(!a.duration) return;
      var rect = bar.getBoundingClientRect();
      var percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      var targetTime = percent * a.duration;
      reliableSeek(a, targetTime, true);
    });
    bar.addEventListener('mousedown', function(e){
      e.preventDefault();
      if(!currentKey || !audioMap[currentKey]) return;
      var a = audioMap[currentKey];
      var onMove = function(e){
        if(!a.duration) return;
        var rect = bar.getBoundingClientRect();
        var percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var targetTime = percent * a.duration;
        a.currentTime = targetTime;
        updateProgress();
      };
      var onUp = function(){
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        
        if(a.duration){
          var rect = bar.getBoundingClientRect();
          
          reliableSeek(a, a.currentTime, true);
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    prev.addEventListener('click', function(e){ e.stopPropagation(); previousTrack(); });
    play.addEventListener('click', function(e){ e.stopPropagation(); togglePlayPause(); });
    next.addEventListener('click', function(e){ e.stopPropagation(); nextTrack(); });
    shuffle.addEventListener('click', function(e){ e.stopPropagation(); toggleShuffle(); });
    repeat.addEventListener('click', function(e){ e.stopPropagation(); cycleRepeat(); });
    keep.addEventListener('click', function(e){ e.stopPropagation(); toggleKeepPlay(); });
  }

  function togglePlayPause(){
    var a = currentKey ? getAudioInstance(currentKey) : null;
    var flaggedPlaying = localStorage.getItem(MUSIC_PLAYING_KEY) === '1';
    if(flaggedPlaying && a && !a.paused){
      pauseMusic();
      return;
    }
    if(currentKey){
      if(!a) a = getAudioInstance(currentKey);
      if(a){ applyPlaybackModes(a); a.play().catch(function(){}); }
      localStorage.setItem(MUSIC_PLAYING_KEY, '1');
      startSavingTime();
      startProgressTimer();
      render();
    } else {
      var first = getPurchasedTracks()[0];
      if(first) playTrack(first.key);
    }
  }

  function previousTrack(){
    if(shuffleMode && playHistory.length){
      var prevKey = playHistory.pop();
      if(prevKey && isPurchased(prevKey)){
        playTrack(prevKey);
        return;
      }
    }
    var key = getSequentialKey(-1);
    if(key) playTrack(key);
  }

  function nextTrack(){
    var key = shuffleMode ? pickRandomTrackKey() : getSequentialKey(1);
    if(key) playTrack(key);
  }

  function toggleShuffle(){
    shuffleMode = !shuffleMode;
    localStorage.setItem(MUSIC_SHUFFLE_KEY, shuffleMode ? '1':'0');
    if(currentKey && audioMap[currentKey]) applyPlaybackModes(audioMap[currentKey]);
    render();
  }

  function cycleRepeat(){
    var idx = REPEAT_MODES.indexOf(repeatMode);
    repeatMode = REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
    localStorage.setItem(MUSIC_REPEAT_MODE_KEY, repeatMode);
    if(currentKey && audioMap[currentKey]) applyPlaybackModes(audioMap[currentKey]);
    render();
  }

  function toggleKeepPlay(){
    keepPlayMode = !keepPlayMode;
    localStorage.setItem(MUSIC_KEEPPLAY_KEY, keepPlayMode ? '1':'0');
    render();
  }

  function render(){
    if(!ui.items) return;
    buildUIOnce();
    renderTrackList();
    updateNowPlayingUI();
    updateControlsState();
  }

  function renderTrackList(){
    ui.items.innerHTML = '';
    tracks.forEach(function(track){
      var purchased = isPurchased(track.key);
      var isCurrent = currentKey === track.key;
      var isPlaying = isCurrent && localStorage.getItem(MUSIC_PLAYING_KEY) === '1';
      var row = document.createElement('div');
      row.className = 'music-track';
      var left = document.createElement('div');
      left.className = 'music-track-meta';
      var name = document.createElement('div');
      name.className = 'music-track-title';
      name.textContent = track.name + (isCurrent ? ' • Now playing' : '');
      var desc = document.createElement('div');
      desc.className = 'music-track-desc';
      desc.textContent = track.description || '';
      left.appendChild(name);
      left.appendChild(desc);

      var right = document.createElement('div');
      right.className = 'music-track-actions';
      var price = document.createElement('div');
      price.className = 'music-track-price';
      price.textContent = purchased ? 'Purchased' : track.price + ' coins';
      var shuffleToggle = document.createElement('label');
      shuffleToggle.className = 'music-track-toggle';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = shuffleAllow[track.key] !== false; cb.disabled = !purchased;
      cb.addEventListener('change', function(e){
        shuffleAllow[track.key] = e.target.checked;
        saveShuffleAllow();
      });
      var cbSpan = document.createElement('span'); cbSpan.textContent = 'In shuffle';
      shuffleToggle.appendChild(cb);
      shuffleToggle.appendChild(cbSpan);

      var actionBtn = document.createElement('button');
      actionBtn.className = purchased ? 'music-inline-btn' : 'music-inline-btn secondary';
      if(purchased){
        actionBtn.textContent = isPlaying ? 'Pause' : 'Play';
        actionBtn.addEventListener('click', function(e){
          e.stopPropagation();
          if(isCurrent && isPlaying){
            var inst = getAudioInstance(track.key);
            if(inst && !inst.paused){ pauseMusic(); }
            else { togglePlayPause(); }
          }
          else if(isCurrent){ togglePlayPause(); }
          else { playTrack(track.key); }
        });
      } else {
        actionBtn.textContent = 'Buy';
        actionBtn.addEventListener('click', function(e){ e.stopPropagation(); purchaseTrack(track); });
      }

      right.appendChild(price);
      right.appendChild(shuffleToggle);
      right.appendChild(actionBtn);

      row.appendChild(left);
      row.appendChild(right);
      ui.items.appendChild(row);
    });
  }

  function updateNowPlayingUI(){
    var track = tracks.find(function(t){ return t.key === currentKey; });
    if(!ui.shell || !track){
      if(ui.nowTitle) ui.nowTitle.textContent = 'No track selected';
      if(ui.nowDesc) ui.nowDesc.textContent = 'Pick a track to start';
      if(ui.nowStatus) ui.nowStatus.textContent = 'Idle';
      return;
    }
    ui.nowTitle.textContent = track.name;
    ui.nowDesc.textContent = track.description || '';
    var isPlaying = localStorage.getItem(MUSIC_PLAYING_KEY) === '1';
    ui.nowStatus.textContent = isPlaying ? 'Playing' : 'Paused';
  }

  function updateControlsState(){
    if(ui.playBtn){ ui.playBtn.textContent = localStorage.getItem(MUSIC_PLAYING_KEY) === '1' ? 'Pause' : 'Play'; }
    if(ui.shuffleBtn){ ui.shuffleBtn.textContent = shuffleMode ? 'Shuffle: On' : 'Shuffle: Off'; ui.shuffleBtn.classList.toggle('active', shuffleMode); }
    if(ui.repeatBtn){
      var label = repeatMode === 'off' ? 'Repeat: Off' : repeatMode === 'all' ? 'Repeat: All' : 'Repeat: One';
      ui.repeatBtn.textContent = label;
      ui.repeatBtn.classList.toggle('active', repeatMode !== 'off');
    }
    if(ui.keepBtn){ ui.keepBtn.textContent = keepPlayMode ? 'Keep Play: On' : 'Keep Play: Off'; ui.keepBtn.classList.toggle('active', keepPlayMode); }
    updateProgress();
  }

  function formatTime(sec){
    if(!sec || isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function updateProgress(){
    if(!ui.progressFill || !currentKey) return;
    var a = audioMap[currentKey];
    if(!a){ ui.progressFill.style.width = '0%'; return; }
    var dur = a.duration || 0;
    var cur = a.currentTime || 0;
    var pct = dur ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
    ui.progressFill.style.width = pct + '%';
    if(ui.elapsed) ui.elapsed.textContent = formatTime(cur);
    if(ui.duration) ui.duration.textContent = dur ? formatTime(dur) : '--:--';
  }

  function startProgressTimer(){
    stopProgressTimer();
    progressInterval = setInterval(updateProgress, 400);
  }
  function stopProgressTimer(){
    if(progressInterval){ clearInterval(progressInterval); progressInterval = null; }
  }

  var _timeSave = { key: null, lastTs: 0, handler: null };
  function saveTimeNow(audio){
    try {
      if(!audio) return;
      var now = Date.now();
      if(now - (_timeSave.lastTs || 0) < 500) return; 
      _timeSave.lastTs = now;
      localStorage.setItem(MUSIC_TIME_KEY, String(audio.currentTime || 0));
    } catch(_){ }
  }

  function startSavingTime(){
    stopSavingTime(false);
    if(!currentKey) return;
    var a = audioMap[currentKey];
    if(!a) return;
    _timeSave.key = currentKey;
    _timeSave.lastTs = 0;
    _timeSave.handler = function(){
      
      if(a && !a.paused) saveTimeNow(a);
    };
    a.addEventListener('timeupdate', _timeSave.handler);
    a.addEventListener('seeking', _timeSave.handler);
    a.addEventListener('pause', function(){ saveTimeNow(a); }, { once: true });
  }

  function stopSavingTime(clearStored){
    try {
      if(_timeSave.key && audioMap[_timeSave.key] && _timeSave.handler){
        var a = audioMap[_timeSave.key];
        a.removeEventListener('timeupdate', _timeSave.handler);
        a.removeEventListener('seeking', _timeSave.handler);
      }
    } catch(_){ }
    _timeSave.key = null;
    _timeSave.handler = null;
    if(clearStored){ localStorage.removeItem(MUSIC_TIME_KEY); }
  }

  function openModal(){ if(!ui.modal) return; updateCoinDisplays(); render(); ui.modal.style.display = 'block'; }
  function closeModal(){ if(ui.modal) ui.modal.style.display = 'none'; }

  document.addEventListener('DOMContentLoaded', function(){
    ensureMusicModalStylesInjected();
    normalizeMusicModalDOM();
    if(!localStorage.getItem(MUSIC_SHUFFLE_KEY)) localStorage.setItem(MUSIC_SHUFFLE_KEY, '1');
    if(!localStorage.getItem(MUSIC_REPEAT_MODE_KEY)) localStorage.setItem(MUSIC_REPEAT_MODE_KEY, 'all');
    if(!localStorage.getItem(MUSIC_KEEPPLAY_KEY)) localStorage.setItem(MUSIC_KEEPPLAY_KEY, '1');
    shuffleMode = localStorage.getItem(MUSIC_SHUFFLE_KEY) === '1';
    repeatMode = (function(){
      var saved = localStorage.getItem(MUSIC_REPEAT_MODE_KEY);
      return REPEAT_MODES.indexOf(saved) !== -1 ? saved : 'all';
    })();
    keepPlayMode = localStorage.getItem(MUSIC_KEEPPLAY_KEY) === '1';
    restoreState();
    updateCoinDisplays();
    render();
    if(ui.openBtn){ ui.openBtn.addEventListener('click', function(e){ e.stopPropagation(); openModal(); }); }
    if(ui.closeBtn){ ui.closeBtn.addEventListener('click', function(e){ e.stopPropagation(); closeModal(); }); }
    window.addEventListener('click', function(e){ if(e.target === ui.modal){ closeModal(); } });
    document.addEventListener('click', function(e){
      if(!ui.modal || ui.modal.style.display !== 'block') return;
      var content = ui.modal.querySelector('.modal-content');
      if(content && !content.contains(e.target) && e.target !== ui.openBtn){
        closeModal();
      }
    });
  });

  window.BackgroundMusic = {
    play: playTrack,
    pause: pauseMusic,
    pauseOverlay: pauseForOverlay,
    resumeOverlay: resumeFromOverlay,
    next: nextTrack,
    previous: previousTrack,
    getCurrent: function(){ return currentKey; },
    unlockAll: function(){ unlockAllMusicTracks(); },
    tracks: tracks
  };

  function unlockAllMusicTracks(){
    var purchases = loadPurchases();
    var changed = false;
    tracks.forEach(function(t){
      if(!purchases[t.key]){ purchases[t.key] = true; changed = true; }
    });
    if(changed){
      savePurchases(purchases);
      render();
    }
  }
  window.addEventListener('simshop:devmode', function(){ unlockAllMusicTracks(); });

  window.addEventListener('beforeunload', function(){
    if(currentKey && audioMap[currentKey]){
      var a = audioMap[currentKey];
      if(a && !a.paused){
        localStorage.setItem(MUSIC_TIME_KEY, String(a.currentTime));
      }
    }
  });

  
  window.addEventListener('pagehide', function(){
    if(currentKey && audioMap[currentKey]){
      var a = audioMap[currentKey];
      if(a && !a.paused){
        localStorage.setItem(MUSIC_TIME_KEY, String(a.currentTime));
      }
    }
  });

  
  document.addEventListener('click', function(e){
    var link = e.target.closest('a[href]');
    if(!link) return;
    if(currentKey && audioMap[currentKey]){
      var a = audioMap[currentKey];
      if(a && !a.paused){
        localStorage.setItem(MUSIC_TIME_KEY, String(a.currentTime));
      }
    }
  }, true);
})();
