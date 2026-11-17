






window.TimeWarp = (() => {
    'use strict';

    const DURATION = 60000;
    const MIN_EFFECT_MS = 4000;
    const MAX_EFFECT_MS = 9000;
    const CHANNEL_INTERVAL = 7000;
    const VOLUME_INTERVAL = 8000;
    const TOTAL_BARS = 16;

    let running = false;
    let masterTimer = null;
    let effectTimers = [];

    
    let overlay = null;
    let statusIcon = null;
    let channelLabel = null;
    let volumeLabel = null;
    let hudResizeHandler = null;
    let headerResizeObserver = null;

    function getSimHudTop() {
        const header = document.querySelector('header');
        if (header) {
            return Math.round(header.getBoundingClientRect().bottom + 12);
        }
        const main = document.querySelector('main');
        if (main) {
            return Math.round(main.getBoundingClientRect().top + 12);
        }
        return 120;
    }

    function updateHudPosition() {
        const top = getSimHudTop() + 'px';
        if (statusIcon) statusIcon.style.top = top;
        if (channelLabel) channelLabel.style.top = top;
    }

    function bindHudPositionTracking() {
        updateHudPosition();
        if (!hudResizeHandler) {
            hudResizeHandler = function() {
                if (running) updateHudPosition();
            };
            window.addEventListener('resize', hudResizeHandler);
        }
        const header = document.querySelector('header');
        if (header && typeof ResizeObserver !== 'undefined' && !headerResizeObserver) {
            headerResizeObserver = new ResizeObserver(function() {
                if (running) updateHudPosition();
            });
            headerResizeObserver.observe(header);
        }
    }

    function unbindHudPositionTracking() {
        if (hudResizeHandler) {
            window.removeEventListener('resize', hudResizeHandler);
            hudResizeHandler = null;
        }
        if (headerResizeObserver) {
            headerResizeObserver.disconnect();
            headerResizeObserver = null;
        }
        if (statusIcon) statusIcon.style.top = '';
        if (channelLabel) channelLabel.style.top = '';
    }

    function ensureOverlay() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'tw-overlay';
        overlay.innerHTML =
            '<div id="tw-scanlines"></div>' +
            '<div id="tw-vignette"></div>' +
            '<div id="tw-static-noise"></div>';
        document.body.appendChild(overlay);

        statusIcon = document.createElement('div');
        statusIcon.id = 'tw-status-icon';
        document.body.appendChild(statusIcon);

        channelLabel = document.createElement('div');
        channelLabel.id = 'tw-channel-label';
        document.body.appendChild(channelLabel);

        volumeLabel = document.createElement('div');
        volumeLabel.id = 'tw-volume-label';
        document.body.appendChild(volumeLabel);
    }

    
    
    
    const SPEED_MODES = ['fastforward', 'fastforward2', 'slowdown', 'slowdown2'];

    let currentSpeedMode = null;

    function applySpeedMode(mode) {
        clearSpeedMode();
        currentSpeedMode = mode;
        overlay.className = 'tw-active tw-mode-' + mode;

        switch (mode) {
            case 'fastforward':
                window.__bugSpeedMultiplier = 2.5;
                statusIcon.textContent = '>>';
                statusIcon.className = 'tw-icon-show';
                break;

            case 'fastforward2':
                window.__bugSpeedMultiplier = 6;
                statusIcon.textContent = '>>>';
                statusIcon.className = 'tw-icon-show';
                break;

            case 'slowdown':
                window.__bugSpeedMultiplier = 0.25;
                statusIcon.textContent = '<<';
                statusIcon.className = 'tw-icon-show';
                break;

            case 'slowdown2':
                window.__bugSpeedMultiplier = 0.05;
                statusIcon.textContent = '<<<';
                statusIcon.className = 'tw-icon-show';
                break;
        }
    }

    function clearSpeedMode() {
        currentSpeedMode = null;
        window.__bugSpeedMultiplier = 1;
        if (statusIcon) { statusIcon.textContent = ''; statusIcon.className = ''; }
    }

    
    
    
    let currentChannel = 1;
    const CHANNEL_EFFECTS = [
        function negative(el)    { el.style.filter = 'invert(1) hue-rotate(180deg)'; },
        function sepia(el)       { el.style.filter = 'sepia(1) saturate(2) brightness(0.9)'; },
        function oversaturate(el){ el.style.filter = 'saturate(4) contrast(1.3)'; },
        function ghost(el)       { el.style.filter = 'brightness(2) contrast(0.5)'; el.style.opacity = '0.5'; },
        function thermal(el)     { el.style.filter = 'hue-rotate(270deg) saturate(3) contrast(1.5)'; },
        function glitch(el)      { el.style.filter = 'hue-rotate(90deg) brightness(1.1)'; },
        function swapImage(el)   {
            var pool = window.BugData ? window.BugData.getFullBugImagePool() : [];
            if (pool.length) el.src = pool[Math.floor(Math.random() * pool.length)];
        },
        function scramble(el, bug) {
            var w = window.innerWidth;
            var h = window.innerHeight;
            bug.x = Math.random() * (w - bug.radius * 2);
            bug.y = Math.random() * (h - bug.radius * 2);
            
            
            el.style.transform = 'translate3d(' + bug.x + 'px,' + bug.y + 'px,0)';
        },
        function turbo(el, bug) {
            var speed = 3 + Math.random() * 5;
            var angle = Math.random() * Math.PI * 2;
            bug.dx = Math.cos(angle) * speed;
            bug.dy = Math.sin(angle) * speed;
        },
        function superBounce(el, bug) {
            bug.drag = 0.9995;
            var boost = 2 + Math.random() * 3;
            bug.dx *= boost;
            bug.dy *= boost;
        }
    ];

    function applyChannelChange() {
        currentChannel = Math.floor(Math.random() * 99) + 1;
        channelLabel.textContent = 'CH ' + currentChannel;
        channelLabel.classList.add('tw-channel-show');
        setTimeout(function() { channelLabel.classList.remove('tw-channel-show'); }, 2500);

        var noise = document.getElementById('tw-static-noise');
        if (noise) {
            noise.classList.add('tw-static-burst');
            setTimeout(function() { noise.classList.remove('tw-static-burst'); }, 250);
        }

        var effectFn = CHANNEL_EFFECTS[Math.floor(Math.random() * CHANNEL_EFFECTS.length)];
        var bugs = window.BugSim ? window.BugSim.getBugData() : [];
        for (var i = 0; i < bugs.length; i++) {
            resetBugVisuals(bugs[i].element);
            effectFn(bugs[i].element, bugs[i]);
        }
    }

    
    
    
    let volumeLevel = 8;
    let volumeTarget = 8;
    let volumeAnimTimer = null;
    let volumeHideTimer = null;

    function applyVolumeChange() {
        var up = Math.random() < 0.5;
        var delta = Math.floor(Math.random() * 3) + 2;
        volumeTarget = Math.max(2, Math.min(TOTAL_BARS - 1, volumeLevel + (up ? delta : -delta)));

        if (volumeHideTimer) clearTimeout(volumeHideTimer);

        animateVolumeBars();
    }

    function animateVolumeBars() {
        if (volumeAnimTimer) clearInterval(volumeAnimTimer);

        var dir = volumeTarget > volumeLevel ? 1 : -1;

        volumeAnimTimer = setInterval(function() {
            if (volumeLevel === volumeTarget) {
                clearInterval(volumeAnimTimer);
                volumeAnimTimer = null;

                volumeHideTimer = setTimeout(function() {
                    if (volumeLabel) {
                        volumeLabel.textContent = '';
                        volumeLabel.className = '';
                    }
                }, 1800);
                return;
            }

            volumeLevel += dir;
            applyVolumeSizeToBugs(volumeLevel);
            renderVolumeBars(volumeLevel, dir > 0);
        }, 120);
    }

    function applyVolumeSizeToBugs(barCount) {
        var scale = barCount / (TOTAL_BARS / 2);
        var bugs = window.BugSim ? window.BugSim.getBugData() : [];
        var baseSize = 75;
        var newSize = Math.round(baseSize * scale);
        
        
        var walkModeActive = window.WalkMode && window.WalkMode.isEnabled && window.WalkMode.isEnabled();
        var WALK_SCALE = 0.45; 
        
        for (var i = 0; i < bugs.length; i++) {
            var b = bugs[i];
            if (walkModeActive) {
                
                var walkSmallSize = Math.round(newSize * WALK_SCALE);
                b.element.style.width = walkSmallSize + 'px';
                b.element.style.height = walkSmallSize + 'px';
                b.radius = Math.round(walkSmallSize / 2);
            } else {
                
                b.element.style.width = newSize + 'px';
                b.element.style.height = newSize + 'px';
                b.radius = newSize / 2;
            }
        }
        
        
        if (walkModeActive && window.WalkMode && window.WalkMode.onExternalSizeChange) {
            window.WalkMode.onExternalSizeChange();
        }
    }

    function renderVolumeBars(barCount, isUp) {
        if (!volumeLabel) return;
        var label = isUp ? 'VOL+' : 'VOL-';
        var bars = '';
        for (var v = 0; v < TOTAL_BARS; v++) {
            bars += v < barCount ? '\u2588' : '\u2591';
        }
        volumeLabel.textContent = label + ' ' + bars;
        volumeLabel.className = 'tw-vol-show';
    }

    
    
    
    function resetBugVisuals(el) {
        el.style.filter = '';
        el.style.opacity = '';
        el.style.clipPath = '';
    }

    function resetAllBugs() {
        var bugs = window.BugSim ? window.BugSim.getBugData() : [];
        var baseSize = 75;
        for (var i = 0; i < bugs.length; i++) {
            var b = bugs[i];
            resetBugVisuals(b.element);
            b.element.style.width = '';
            b.element.style.height = '';
            b.radius = baseSize / 2;
            if (b._origDrag) { b.drag = b._origDrag; }
            if (b._origSrc) { b.element.src = b._origSrc; }
        }
        
        if (window.WalkMode && window.WalkMode.isEnabled && window.WalkMode.isEnabled()) {
            if (window.WalkMode.onExternalSizeChange) {
                window.WalkMode.onExternalSizeChange();
            }
        }
    }

    function saveBugState() {
        var bugs = window.BugSim ? window.BugSim.getBugData() : [];
        for (var i = 0; i < bugs.length; i++) {
            bugs[i]._origSrc = bugs[i].element.src;
            bugs[i]._origDrag = bugs[i].drag;
        }
    }

    function randBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    
    
    
    function start() {
        if (running) return;
        running = true;

        ensureOverlay();
        bindHudPositionTracking();
        saveBugState();
        volumeLevel = 8;
        volumeTarget = 8;
        currentChannel = 1;

        overlay.classList.add('tw-active');

        scheduleNextSpeedMode();

        var chTimer = setInterval(function() {
            if (!running) return;
            applyChannelChange();
        }, CHANNEL_INTERVAL);
        effectTimers.push(chTimer);

        var volTimer = setInterval(function() {
            if (!running) return;
            applyVolumeChange();
        }, VOLUME_INTERVAL);
        effectTimers.push(volTimer);

        masterTimer = setTimeout(function() { stop(); }, DURATION);
    }

    function scheduleNextSpeedMode() {
        if (!running) return;
        var delay = randBetween(MIN_EFFECT_MS, MAX_EFFECT_MS);
        var t = setTimeout(function() {
            if (!running) return;
            var mode = SPEED_MODES[Math.floor(Math.random() * SPEED_MODES.length)];
            applySpeedMode(mode);
            scheduleNextSpeedMode();
        }, delay);
        effectTimers.push(t);
    }

    function stop() {
        running = false;

        if (masterTimer) { clearTimeout(masterTimer); masterTimer = null; }
        for (var i = 0; i < effectTimers.length; i++) {
            clearTimeout(effectTimers[i]);
            clearInterval(effectTimers[i]);
        }
        effectTimers = [];
        if (volumeAnimTimer) { clearInterval(volumeAnimTimer); volumeAnimTimer = null; }
        if (volumeHideTimer) { clearTimeout(volumeHideTimer); volumeHideTimer = null; }

        clearSpeedMode();
        resetAllBugs();
        unbindHudPositionTracking();

        if (overlay) {
            overlay.className = '';
            if (statusIcon) { statusIcon.textContent = ''; statusIcon.className = ''; }
            if (channelLabel) { channelLabel.textContent = ''; channelLabel.className = ''; }
            if (volumeLabel) { volumeLabel.textContent = ''; volumeLabel.className = ''; }
        }

        var btn = document.getElementById('time-warp-button');
        if (btn) {
            btn.textContent = 'Time Warp';
            btn.style.background = '';
            btn.style.color = '';
        }
    }

    function toggle() {
        if (running) { stop(); return false; }
        start();
        return true;
    }

    return { start: start, stop: stop, toggle: toggle, isRunning: function() { return running; } };
})();
