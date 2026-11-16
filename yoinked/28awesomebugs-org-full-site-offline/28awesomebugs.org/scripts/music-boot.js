(function () {
    'use strict';

    var STORAGE_KEY = '28bugs_soundEffectsEnabled';
    var MUSIC_PATH_RE = /\/music\/|\/bomb\d+\.mp3|Pandemonium\.mp3|War\.mp3|\/siege\/(?:menu|gameover|battle)/i;

    function readStoredEnabled() {
        try {
            var v = localStorage.getItem(STORAGE_KEY);
            if (v === '0') return false;
            if (v === '1') return true;
        } catch (e) {}
        return true;
    }

    var enabled = readStoredEnabled();

    function getAudioSrc(el) {
        return (el && (el.currentSrc || el.src)) || '';
    }

    function isMusicElement(el) {
        if (!el) return false;
        if (el._bugMusic) return true;
        if (el.dataset && el.dataset.bugMusic === 'true') return true;
        if (el.id === 'showcase-audio') return true;
        return MUSIC_PATH_RE.test(getAudioSrc(el));
    }

    function isSoundEffectsEnabled() {
        if (window.BugSettings && window.BugSettings.settings && window.BugSettings.settings.soundEffectsEnabled === false) {
            return false;
        }
        return enabled;
    }

    function setSoundEffectsEnabled(val) {
        enabled = !!val;
        try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch (e) {}
        if (window.BugSettings && window.BugSettings.settings) {
            window.BugSettings.settings.soundEffectsEnabled = enabled;
        }
        if (!enabled) {
            try {
                document.querySelectorAll('audio').forEach(function (a) {
                    if (!isMusicElement(a)) {
                        a.pause();
                        a.currentTime = 0;
                    }
                });
            } catch (e) {}
        }
    }

    function markAsMusic(el) {
        if (el) el._bugMusic = true;
        return el;
    }

    if (!window.BugSFX) {
        var origPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            if (!isMusicElement(this) && !isSoundEffectsEnabled()) {
                return Promise.resolve();
            }
            return origPlay.apply(this, arguments);
        };

        if (typeof AudioBufferSourceNode !== 'undefined' && AudioBufferSourceNode.prototype.start) {
            var origStart = AudioBufferSourceNode.prototype.start;
            AudioBufferSourceNode.prototype.start = function () {
                if (!this._bugMusic && !isSoundEffectsEnabled()) return;
                return origStart.apply(this, arguments);
            };
        }

        window.BugSFX = {
            isEnabled: isSoundEffectsEnabled,
            setEnabled: setSoundEffectsEnabled,
            markAsMusic: markAsMusic,
            isMusicElement: isMusicElement
        };
    }
})();

(function () {
    'use strict';
    var KEY_CURRENT  = '28bugs_musicCurrentKey';
    var KEY_PLAYING  = '28bugs_musicPlaying';
    var KEY_KEEPPLAY = '28bugs_musicKeepPlay';
    var KEY_TIME     = '28bugs_musicTime';
    var KEY_VOLUME   = '28bugs_musicVolume';

    
    var savedKey  = localStorage.getItem(KEY_CURRENT);
    var wasPlaying = localStorage.getItem(KEY_PLAYING) === '1';
    var keepPlay   = localStorage.getItem(KEY_KEEPPLAY) !== '0';
    if (!savedKey || !wasPlaying || !keepPlay) { return; }

    
    var FILES = {
        track1:  'src/music/track1.mp3',
        track2:  'src/music/track2.mp3',
        track3:  'src/music/track3.mp3',
        track4:  'src/music/track4.mp3',
        track5:  'src/music/track5.mp3',
        track6:  'src/music/track6.mp3',
        track7:  'src/music/track7.mp3',
        track8:  'src/music/track8.mp3',
        track9:  'src/music/track9.mp3',
        track10: 'src/music/track10.mp3',
        track11: 'src/music/track11.mp3',
        track12: 'src/music/track12.mp3',
        track13: 'src/music/track13.mp3',
        track14: 'src/music/track14.mp3',
        track15: 'src/music/track15.mp3',
        track16: 'src/music/track16.mp3',
    };

    var file = FILES[savedKey];
    if (!file) return;

    var wantTime = parseFloat(localStorage.getItem(KEY_TIME) || '0');

    
    
    var src = file;
    if (wantTime > 0.5) {
        src += '#t=' + wantTime.toFixed(2);
    }

    var audio = new Audio(src);
    if (window.BugSFX) window.BugSFX.markAsMusic(audio);
    audio.preload = 'auto';

    
    var volRaw = localStorage.getItem(KEY_VOLUME);
    audio.volume = volRaw !== null ? parseInt(volRaw, 10) / 100 : 1;

    var unlockArmed = false;
    var unlockAudio = audio;

    function stillWantPlayback() {
        try {
            if (localStorage.getItem(KEY_KEEPPLAY) === '0') return false;
            return localStorage.getItem(KEY_PLAYING) === '1';
        } catch (e) {
            return false;
        }
    }

    function detachUnlock() {
        if (!unlockArmed) return;
        unlockArmed = false;
        document.removeEventListener('click', onUnlock, true);
    }

    function onUnlock(e) {
        if (!stillWantPlayback()) {
            detachUnlock();
            return;
        }
        if (!unlockAudio || !unlockAudio.paused) {
            detachUnlock();
            return;
        }
        if (e && e.target && e.target.closest && e.target.closest('#music-shop-modal')) {
            return;
        }
        unlockAudio.play().then(function () {
            detachUnlock();
        }).catch(function () {});
    }

    function armUnlock(el) {
        if (el) unlockAudio = el;
        if (unlockArmed) return;
        unlockArmed = true;
        document.addEventListener('click', onUnlock, true);
    }

    window.__28bugs_armMusicUnlock = armUnlock;

    function begin() {
        if (window.__28bugs_bootAudio && window.__28bugs_bootAudio.consumed) {
            return;
        }
        audio.play().then(function () {
            detachUnlock();
        }).catch(function (err) {
            console.warn('[MusicBoot] play() blocked:', err);
            armUnlock(audio);
        });
    }

    begin();
    if (audio.readyState < 3) {
        audio.addEventListener('canplay', function () { begin(); }, { once: true });
    }

    window.__28bugs_bootAudio = { key: savedKey, audio: audio, consumed: false, wantTime: wantTime };
})();
