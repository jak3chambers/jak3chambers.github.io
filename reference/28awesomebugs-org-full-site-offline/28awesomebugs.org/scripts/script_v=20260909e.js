document.addEventListener("DOMContentLoaded", () => {
    if (window.__BUGS_APP_INIT__) return;
    window.__BUGS_APP_INIT__ = true;

    if (!window.BugData || !window.BugUI || !window.BugSettings || !window.BugWelcome) {
        console.error("Required scripts not loaded. Make sure to include all required script files before script.js");
        return;
    }

    const header = document.querySelector("header");
    if (header) {
        header.addEventListener("wheel", (e) => {
            
            const needsScroll = header.scrollWidth > header.clientWidth;
            
            if (needsScroll) {
                e.preventDefault();
                e.stopPropagation();
                
                
                const scrollSpeed = e.deltaY;
                header.scrollLeft += scrollSpeed;
            }
        }, { passive: false });
    }

    const container = document.querySelector(".bugs-container");
    const bugs = Array.from(container ? container.querySelectorAll(".bug") : []);
    const freezeButton = document.getElementById("toggle-freeze");
    const spinButton = document.getElementById("toggle-spin");
    const feedbackButton = document.getElementById("feedback-button");
    const awesomeModeButton = document.getElementById("awesome-mode");
    const dropNukeButton = document.getElementById("drop-nuke");
    const createButton = document.getElementById("create-button");
    const destroyButton = document.getElementById("destroy-button");
    const greenButton = document.getElementById("green-button"); 
    const rockButton = document.getElementById("spawn-rock-button");
    const evilModeButton = document.getElementById("evil-mode-button");
    const devModeButton = document.getElementById("devmode-button");

    const evilLaughAudio = new Audio("src/evil-laugh.mp3");
    evilLaughAudio.preload = "none";
    const evilLightningAudio = new Audio("src/lightning.mp3");
    evilLightningAudio.preload = "none";
    const hellChantAudio = new Audio("src/hell.wav");
    hellChantAudio.preload = "none";
    const impChatterAudio = new Audio("src/imp.mp3");
    impChatterAudio.preload = "none";
    const evilDoubleLaughAudio = new Audio("src/evilevillaugh.mp3");
    evilDoubleLaughAudio.preload = "none";

    const SIM_PURCHASE_STORAGE_KEY = '28bugs_simPurchases';
    const simShopCatalog = [
        {
            key: 'trueForm',
            buttonId: 'gross-mode-btn',
            name: 'True Form',
            description: 'Toggle the bugs\' secret gross form.',
            price: 1000,
            location: 'Simulation Tray'
        },
        {
            key: 'mikeMode',
            buttonId: 'toggle-spin',
            name: 'Mike Mode',
            description: 'Unlock audio-reactive chaos.',
            price: 100,
            location: 'Simulation Tray'
        },
        {
            key: 'nuke',
            buttonId: 'drop-nuke',
            name: 'Nuke',
            description: 'Add the Nuke button back to the tray.',
            price: 1,
            location: 'Simulation Tray'
        },
        {
            key: 'set28',
            buttonId: 'set-28-button',
            name: 'Set to 28',
            description: 'Instantly normalize the number of bugs.',
            price: 280,
            location: 'Simulation Tray'
        },
        {
            key: 'greenButton',
            buttonId: 'green-button',
            name: 'Green Button',
            description: 'Unlock the mysterious green filter.',
            price: 5000,
            location: 'Simulation Tray'
        },

        {
            key: 'rockButton',
            buttonId: 'spawn-rock-button',
            name: 'Rock',
            description: 'Drop heavy rocks into the playground.',
            price: 250,
            location: 'Simulation Tray'
        },
        {
            key: 'evilMode',
            buttonId: 'evil-mode-button',
            name: 'Evil Mode',
            description: 'Summon horns, laughter, and lightning.',
            price: 666,
            location: 'Simulation Tray'
        }
    ];

    window.SimShopCatalogData = simShopCatalog.map(function(entry) {
        return Object.assign({}, entry);
    });

    let simPurchases = {};
    let evilFireBackdropEl = null;
    let savedPurchases = null;
    try { savedPurchases = JSON.parse(localStorage.getItem(SIM_PURCHASE_STORAGE_KEY)); } catch (_) {}
    if (savedPurchases && typeof savedPurchases === 'object') {
        simPurchases = savedPurchases;
    }

    function persistSimPurchases() {
        localStorage.setItem(SIM_PURCHASE_STORAGE_KEY, JSON.stringify(simPurchases));
    }

    function isSimFeatureUnlocked(key) {
        return !!simPurchases[key];
    }

    function updateSimFeatureVisibility() {
        simShopCatalog.forEach(function(entry) {
            if (!entry.buttonId) return;
            const targetBtn = document.getElementById(entry.buttonId);
            if (targetBtn) {
                const unlocked = isSimFeatureUnlocked(entry.key);
                const enabled = window.ShopFeatureToggle ? window.ShopFeatureToggle.isEnabled(entry.key) : true;
                targetBtn.style.display = (unlocked && enabled) ? '' : 'none';
            }
        });
    }

    function updateHornAttachment(entry, bugSizeOverride) {
        if (!entry || !entry.horns) return;
        const bugSize = bugSizeOverride || getBugSize();
        entry.horns.style.width = `${bugSize * 0.85}px`;
        entry.horns.style.left = `${entry.x + bugSize / 2}px`;
        entry.horns.style.top = `${entry.y - bugSize * 0.45 + 25}px`;
        entry.horns.style.transform = 'translate(-50%, -50%)';
    }

    function ensureEvilHorns(entry) {
        if (!entry || !entry.element || entry.horns) return;
        if (!container) return;
        const horns = document.createElement('img');
        horns.src = 'src/horns.png';
        horns.alt = '';
        horns.draggable = false;
        horns.className = 'evil-horns';
        container.appendChild(horns);
        entry.horns = horns;
        updateHornAttachment(entry);
    }

    function removeEvilHorns(entry) {
        if (!entry || !entry.horns) return;
        entry.horns.remove();
        entry.horns = null;
    }

    function applyEvilAura(entry) {
        if (!entry || !entry.element) return;
        entry.element.classList.add('bug-evil');
        ensureEvilHorns(entry);
    }

    function clearEvilAura(entry) {
        if (!entry || !entry.element) return;
        entry.element.classList.remove('bug-evil');
        removeEvilHorns(entry);
    }

    function ensureEvilFireBackdrop() {
        if (evilFireBackdropEl && evilFireBackdropEl.isConnected) return;
        const fireEl = document.createElement('div');
        fireEl.className = 'evil-fire-backdrop';
        fireEl.setAttribute('aria-hidden', 'true');
        evilFireBackdropEl = fireEl;
        const firstChild = document.body.firstChild;
        if (firstChild) {
            document.body.insertBefore(fireEl, firstChild);
        } else {
            document.body.appendChild(fireEl);
        }
    }

    function removeEvilFireBackdrop() {
        if (!evilFireBackdropEl) return;
        evilFireBackdropEl.remove();
        evilFireBackdropEl = null;
    }

    function stopEvilAudio() {
        [evilLaughAudio, evilLightningAudio, hellChantAudio, impChatterAudio, evilDoubleLaughAudio].forEach(function(audio) {
            audio.pause();
            audio.currentTime = 0;
        });
        evilLoopTimers.forEach(function(timerId) {
            clearInterval(timerId);
        });
        evilLoopTimers = [];
    }

    function queueEvilLoop(audio, intervalMs) {
        const trigger = function() {
            audio.currentTime = 0;
            audio.play().catch(function() {});
        };
        trigger();
        evilLoopTimers.push(setInterval(trigger, intervalMs));
    }

    function setEvilModeState(active) {
        evilModeActive = active;
        document.body.classList.toggle('evilized', active);
        bugData.forEach(function(entry) {
            if (active) {
                applyEvilAura(entry);
            } else {
                clearEvilAura(entry);
            }
        });
        if (active) {
            ensureEvilFireBackdrop();
            stopEvilAudio();
            
            try {
                if (window.BackgroundMusic && typeof window.BackgroundMusic.pauseOverlay === 'function') {
                    window.BackgroundMusic.pauseOverlay();
                } else if (window.BackgroundMusic && typeof window.BackgroundMusic.pause === 'function') {
                    window.BackgroundMusic.pause();
                }
            } catch (e) {}
            try {
                document.querySelectorAll('#music-shop-btn').forEach(function(btn){
                    if (!btn) return;
                    
                    if (!btn.hasAttribute('data-disabled-by-evil')) {
                        btn.setAttribute('data-disabled-by-evil', '1');
                    }
                    try { btn.disabled = true; } catch(_) { btn.setAttribute('aria-disabled', 'true'); }
                    try { btn.title = 'Music disabled while Evil Mode is active'; } catch(_) {}
                });
            } catch (e) {}
            evilLaughAudio.currentTime = 0;
            evilLaughAudio.play().catch(function() {});
            evilLightningAudio.currentTime = 0;
            evilLightningAudio.play().catch(function() {});
            queueEvilLoop(hellChantAudio, 60000);
            queueEvilLoop(impChatterAudio, 20000);
            queueEvilLoop(evilDoubleLaughAudio, 15000);
        } else {
            removeEvilFireBackdrop();
            stopEvilAudio();
            
            try {
                document.querySelectorAll('#music-shop-btn').forEach(function(btn){
                    if (!btn) return;
                    if (btn.getAttribute('data-disabled-by-evil') === '1') {
                        try { btn.disabled = false; } catch(_) { btn.removeAttribute('aria-disabled'); }
                        btn.removeAttribute('data-disabled-by-evil');
                        try { btn.title = ''; } catch(_) {}
                    }
                });
            } catch (e) {}
            try {
                if (window.BackgroundMusic && typeof window.BackgroundMusic.resumeOverlay === 'function') {
                    window.BackgroundMusic.resumeOverlay();
                }
            } catch (e) {}
        }
    }

    let draggingBug = null;
    let dragPointerId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let dragTargetX = 0;
    let dragTargetY = 0;
    let dragPointerLastX = 0;
    let dragPointerLastY = 0;
    let dragPointerLastTime = 0;
    let dragReleaseVX = 0;
    let dragReleaseVY = 0;
    const DRAG_PULL_STRENGTH = 0.25;
    const DRAG_PULL_MAX = 12;
    const DRAG_DAMPING = 0.9;
    const DRAG_SLACK = 12;
    
    const DRAG_HISTORY_SIZE = 8;
    const DRAG_HISTORY_MAX_AGE = 200; 
    let dragHistory = []; 
    let throwCapOverride = null;

    function handleBugPointerDown(event) {
        if (!window._dragModeOn) return;
        if (!container) return;
        const target = event.target.closest('.bug');
        if (!target) return;
        const bugRecord = bugData.find(function(entry) {
            return entry.element === target;
        });
        if (!bugRecord) return;
        const rect = container.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        dragOffsetX = pointerX - bugRecord.x;
        dragOffsetY = pointerY - bugRecord.y;
        draggingBug = bugRecord;
        dragPointerId = event.pointerId;
        dragTargetX = bugRecord.x;
        dragTargetY = bugRecord.y;
        dragPointerLastX = pointerX;
        dragPointerLastY = pointerY;
        dragPointerLastTime = performance.now();
        dragReleaseVX = 0;
        dragReleaseVY = 0;
        dragHistory = [{ x: pointerX, y: pointerY, t: dragPointerLastTime }];
        if (target.setPointerCapture) target.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function handleBugPointerMove(event) {
        if (!draggingBug || dragPointerId !== event.pointerId) return;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const bugSize = getBugSize();
        const playfield = getPlayfield();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        let nextX = pointerX - dragOffsetX;
        let nextY = pointerY - dragOffsetY;
        nextX = Math.min(Math.max(0, nextX), Math.max(0, playfield.width - bugSize));
        nextY = Math.min(Math.max(0, nextY), Math.max(0, playfield.height - bugSize));
        dragTargetX = nextX;
        dragTargetY = nextY;
        const now = performance.now();
        
        dragHistory.push({ x: pointerX, y: pointerY, t: now });
        
        if (dragHistory.length > DRAG_HISTORY_SIZE) dragHistory.shift();
        dragPointerLastX = pointerX;
        dragPointerLastY = pointerY;
        dragPointerLastTime = now;
        event.preventDefault();
    }

    function stopBugPointerDrag(event) {
        if (!draggingBug) return;
        if (event && dragPointerId !== event.pointerId) return;
        if (draggingBug.element && dragPointerId !== null && draggingBug.element.releasePointerCapture) {
            draggingBug.element.releasePointerCapture(dragPointerId);
        }
        
        const now = performance.now();
        
        while (dragHistory.length > 1 && now - dragHistory[0].t > DRAG_HISTORY_MAX_AGE) {
            dragHistory.shift();
        }
        let throwVX = 0;
        let throwVY = 0;
        if (dragHistory.length >= 2) {
            const oldest = dragHistory[0];
            const newest = dragHistory[dragHistory.length - 1];
            const dt = Math.max(16, newest.t - oldest.t);
            throwVX = (newest.x - oldest.x) / dt;
            throwVY = (newest.y - oldest.y) / dt;
        }
        const throwScale = 16;
        const throwCap = 35;
        let nextDX = throwVX * throwScale;
        let nextDY = throwVY * throwScale;
        const cap = throwCapOverride || throwCap;
        let throwSpeed = Math.sqrt(nextDX * nextDX + nextDY * nextDY);
        if (throwSpeed > cap) {
            nextDX = (nextDX / throwSpeed) * cap;
            nextDY = (nextDY / throwSpeed) * cap;
        }
        draggingBug.dx = nextDX;
        draggingBug.dy = nextDY;
        
        draggingBug._thrownAt = performance.now();
        dragPointerLastTime = 0;
        draggingBug = null;
        dragPointerId = null;
    }

    if (container) {
        container.addEventListener('pointerdown', handleBugPointerDown, { passive: false });
    }
    document.addEventListener('pointermove', handleBugPointerMove, { passive: false });
    document.addEventListener('pointerup', stopBugPointerDrag, { passive: false });
    document.addEventListener('pointercancel', stopBugPointerDrag, { passive: false });

    function setSimFeatureState(key, value) {
        simPurchases[key] = value;
        persistSimPurchases();
    }

    function setBulkSimPurchases(map) {
        simPurchases = Object.assign({}, map);
        persistSimPurchases();
        updateSimFeatureVisibility();
    }

    function unlockSimFeature(key) {
        if (!simPurchases[key]) {
            simPurchases[key] = true;
            persistSimPurchases();
        }
        updateSimFeatureVisibility();
    }

    window.SimFeatureUnlock = {
        unlock: unlockSimFeature,
        isUnlocked: isSimFeatureUnlocked,
        refresh: updateSimFeatureVisibility,
        setState: setSimFeatureState,
        setAll: setBulkSimPurchases,
        getPurchases: function() { return Object.assign({}, simPurchases); }
    };

    updateSimFeatureVisibility();

    if (devModeButton) {
        devModeButton.addEventListener('click', function(event) {
            event.preventDefault();
            const purchases = Object.assign({}, simPurchases);
            simShopCatalog.forEach(function(entry) {
                if (!purchases[entry.key]) {
                    purchases[entry.key] = true;
                }
            });
            setBulkSimPurchases(purchases);
            if (typeof window.CustomEvent === 'function') {
                window.dispatchEvent(new CustomEvent('simshop:devmode'));
            } else {
                const evt = document.createEvent('Event');
                evt.initEvent('simshop:devmode', true, true);
                window.dispatchEvent(evt);
            }
        });
    }

    if (evilModeButton) {
        evilModeButton.addEventListener('click', function(event) {
            event.stopPropagation();
            setEvilModeState(!evilModeActive);
        });
    }

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            window.BugSettings.showSettingsMenu();
        });
    }

    
    let rockObstacleEl = null;
    let rockCollisionData = null;
    let rockCenterX = null;
    const ROCK_DIAMETER = 120;
    const ROCK_RADIUS = ROCK_DIAMETER / 2;

    
    const playfieldEl = document.querySelector('.bugs-container');
    const headerEl = document.querySelector('header');
    let cachedPlayW = (playfieldEl ? playfieldEl.clientWidth : window.innerWidth);
    let cachedPlayH = (playfieldEl ? playfieldEl.clientHeight : window.innerHeight);
    let cachedHeaderH = 0;
    function getPlayfield() {
        
        cachedHeaderH = headerEl ? headerEl.offsetHeight : 0;
        return { el: playfieldEl, width: cachedPlayW, height: cachedPlayH, headerHeight: cachedHeaderH };
    }

    let gravityEnabled = true;
    let animationRunning = true;
    let awesomeModeEnabled = false;
    let evilModeActive = false;
    let evilLoopTimers = [];
    const BUG_SIZE_DESKTOP = 75;
    const BUG_SIZE_MOBILE = 55;
    let _isDesktopFlag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isDesktop = () => _isDesktopFlag;
    const getBugSize = () => (_isDesktopFlag ? BUG_SIZE_DESKTOP : BUG_SIZE_MOBILE);
    let deletedBugs = [];
    try { deletedBugs = JSON.parse(localStorage.getItem('28bugs_memorialData')) || []; } catch(_) {}
    window.deletedBugs = deletedBugs;

    const { el: initField, width: initW, height: initH } = getPlayfield();
    const initBugSize = getBugSize();
    let _nextBugUid = 1;
    const bugData = bugs.map((bug) => ({
        element: bug,
        x: Math.random() * Math.max(0, initW - initBugSize),
        y: Math.max(cachedHeaderH, Math.random() * Math.max(0, initH - initBugSize)),
        dx: (Math.random() - 0.5) * 5,
        dy: (Math.random() - 0.5) * 5,
        mass: 1,
        radius: initBugSize / 2,
        drag: 0.995,
        hat: null,
        horns: null,
        _uid: _nextBugUid++
    }));

    const { settings } = window.BugSettings;

    
    
    
    
    function initRockObstacle(forceReposition = false, dropX = null, dropY = null) {
        if (!playfieldEl) return;
        if (!rockObstacleEl) {
            rockObstacleEl = document.createElement('img');
            rockObstacleEl.id = 'rock-obstacle';
            rockObstacleEl.className = 'rock-obstacle';
            rockObstacleEl.src = 'src/rock.png';
            rockObstacleEl.alt = '';
            rockObstacleEl.width = ROCK_DIAMETER;
            rockObstacleEl.height = ROCK_DIAMETER;
            rockObstacleEl.setAttribute('aria-hidden', 'true');
            rockObstacleEl.draggable = false;
            playfieldEl.appendChild(rockObstacleEl);
        }

        const bugSize = getBugSize();
        const { width: playW, height: playH } = getPlayfield();
        
        const bottomLimit = playH;

        
        if (typeof dropX === 'number' && !isNaN(dropX)) {
            rockCenterX = Math.min(Math.max(ROCK_RADIUS, dropX), Math.max(ROCK_RADIUS, playW - ROCK_RADIUS));
        } else if (rockCenterX === null || forceReposition) {
            const minCenter = ROCK_RADIUS + 20;
            const maxCenter = Math.max(minCenter, playW - ROCK_RADIUS - 20);
            const span = Math.max(1, maxCenter - minCenter);
            rockCenterX = Math.min(Math.max(ROCK_RADIUS, minCenter + Math.random() * span), playW - ROCK_RADIUS);
        } else {
            rockCenterX = Math.min(Math.max(ROCK_RADIUS, rockCenterX), Math.max(ROCK_RADIUS, playW - ROCK_RADIUS));
        }

        
        let rockTop;
        if (typeof dropY === 'number' && !isNaN(dropY)) {
            
            rockTop = Math.round(Math.min(Math.max(0, dropY - ROCK_RADIUS), Math.max(0, playH - ROCK_DIAMETER)));
        } else {
            
            rockTop = Math.max(0, (bottomLimit - ROCK_DIAMETER));
        }

        const rockLeft = Math.round(rockCenterX - ROCK_RADIUS);
        rockObstacleEl.style.left = `${rockLeft}px`;
        rockObstacleEl.style.top = `${rockTop}px`;

        rockCollisionData = {
            x: rockCenterX,
            y: rockTop + ROCK_RADIUS,
            r: ROCK_RADIUS
        };
    }

    function resolveRockCollision(bug) {
        if (!rockCollisionData) return;
        const bugRadius = bug.radius;
        const bugCenterX = bug.x + bugRadius;
        const bugCenterY = bug.y + bugRadius;
        const dx = bugCenterX - rockCollisionData.x;
        const dy = bugCenterY - rockCollisionData.y;
        const minDist = bugRadius + rockCollisionData.r;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist) return;
        let dist;
        if (distSq === 0) {
            dist = 0.001;
        } else {
            dist = Math.sqrt(distSq);
        }
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        bug.x += nx * overlap;
        bug.y += ny * overlap;
        const dot = bug.dx * nx + bug.dy * ny;
        if (dot < 0) {
            const restitution = 0.7;
            bug.dx -= (1 + restitution) * dot * nx;
            bug.dy -= (1 + restitution) * dot * ny;
        }
    }

    
    let gridCellSize = 0;
    let gridCols = 0;
    let gridRows = 0;
    let grid = [];     
    const checkedPairs = new Set();

    function buildGrid(playW, playH, bugSize) {
        gridCellSize = bugSize + 2; 
        gridCols = Math.max(1, Math.ceil(playW / gridCellSize));
        gridRows = Math.max(1, Math.ceil(playH / gridCellSize));
        const total = gridCols * gridRows;
        
        if (grid.length !== total) {
            grid = new Array(total);
            for (let i = 0; i < total; i++) grid[i] = [];
        } else {
            for (let i = 0; i < total; i++) grid[i].length = 0;
        }
    }

    function insertGrid(bug) {
        const col = Math.min(gridCols - 1, Math.max(0, (bug.x / gridCellSize) | 0));
        const row = Math.min(gridRows - 1, Math.max(0, (bug.y / gridCellSize) | 0));
        grid[row * gridCols + col].push(bug);
    }

    function getGridNeighbors(bug) {
        const col = Math.min(gridCols - 1, Math.max(0, (bug.x / gridCellSize) | 0));
        const row = Math.min(gridRows - 1, Math.max(0, (bug.y / gridCellSize) | 0));
        const neighbors = [];
        for (let r = Math.max(0, row - 1); r <= Math.min(gridRows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(gridCols - 1, col + 1); c++) {
                const cell = grid[r * gridCols + c];
                for (let k = 0; k < cell.length; k++) {
                    if (cell[k] !== bug) neighbors.push(cell[k]);
                }
            }
        }
        return neighbors;
    }

    function updatePositions() {
        if (!animationRunning && !draggingBug) return;

    const playW = cachedPlayW;
    const playH = cachedPlayH;
    const bugSize = getBugSize();
    
    const bottomLimit = playH;
    
    const speedCapEnabled = settings.speedCapEnabled;
    const maxSpeedSetting = settings.maxSpeed;
    const gravityForceSetting = settings.gravity;
    const frictionSetting = settings.friction;

        
        buildGrid(playW, playH, bugSize);
        for (let i = 0; i < bugData.length; i++) insertGrid(bugData[i]);
        checkedPairs.clear();

        for (let i = 0; i < bugData.length; i++) {
            let bug = bugData[i];
            const beingDragged = draggingBug === bug;

            const isStuck = !beingDragged && (bug.x < -bugSize || bug.x > playW + bugSize ||
                            bug.y < -bugSize || bug.y > playH + bugSize);
            if (isStuck) {
                bug.x = (playW / 2) + (Math.random() - 0.5) * 100;
                bug.y = (playH / 2) + (Math.random() - 0.5) * 100;
                bug.dx = (Math.random() - 0.5) * 5;
                bug.dy = (Math.random() - 0.5) * 5;
            }

            if (!beingDragged && speedCapEnabled) {
                const maxSpeed = maxSpeedSetting;
                const speedSq = bug.dx * bug.dx + bug.dy * bug.dy;
                const maxSpeedSq = maxSpeed * maxSpeed;
                if (speedSq > maxSpeedSq) {
                    const currentSpeed = Math.sqrt(speedSq);
                    const scaleFactor = maxSpeed / currentSpeed;
                    bug.dx *= scaleFactor;
                    bug.dy *= scaleFactor;
                }
            }

            if (beingDragged) {
                const clampedTargetX = Math.min(Math.max(0, dragTargetX), Math.max(0, playW - bugSize));
                const clampedTargetY = Math.min(Math.max(0, dragTargetY + DRAG_SLACK), Math.max(0, playH - bugSize));
                const dxTarget = clampedTargetX - bug.x;
                const dyTarget = clampedTargetY - bug.y;
                const distSqTarget = dxTarget * dxTarget + dyTarget * dyTarget;
                if (distSqTarget > 0.000001) {
                    const dist = Math.sqrt(distSqTarget);
                    const pull = Math.min(DRAG_PULL_MAX, dist * DRAG_PULL_STRENGTH);
                    bug.dx += (dxTarget / dist) * pull;
                    bug.dy += (dyTarget / dist) * pull;
                }
                bug.dx *= DRAG_DAMPING;
                bug.dy *= DRAG_DAMPING;
            }

            const _sm = window.__bugSpeedMultiplier || 1;
            bug.x += bug.dx * _sm;
            bug.y += bug.dy * _sm;

            if (gravityEnabled) {
                const gravityForce = gravityForceSetting;
                bug.dy += gravityForce;
                bug.dx *= bug.drag;
                bug.dy *= bug.drag;
            }

            const shouldApplyJitter = Math.random() < 0.1;
            const jitter = shouldApplyJitter ? (Math.random() - 0.5) * 0.5 : 0;

            const bSize = bug.radius * 2;

            if (bug.x < 0) {
                bug.x = 0;
                bug.dx = Math.abs(bug.dx) * (mikeModePhysics ? 0.9 : 1);
                bug.dy += jitter;
            } else if (bug.x + bSize > playW) {
                bug.x = Math.max(0, playW - bSize);
                bug.dx = -Math.abs(bug.dx) * (mikeModePhysics ? 0.9 : 1);
                bug.dy += jitter;
            }

            const topBound = cachedHeaderH;
            if (bug.y < topBound) {
                bug.y = topBound;
                bug.dy = Math.abs(bug.dy) * (mikeModePhysics ? 0.9 : 1);
                bug.dx += jitter;
            } else if (bug.y + bSize > bottomLimit) {
                bug.y = Math.max(0, bottomLimit - bSize);
                bug.dy = -Math.abs(bug.dy) * (mikeModePhysics ? 0.7 : 0.3);
                bug.dx += jitter;
            }

            if (bug.x <= 2) {
                bug.x = 2;
                bug.dx = Math.abs(bug.dx) + 0.5;
            } else if (bug.x >= playW - bSize - 2) {
                bug.x = playW - bSize - 2;
                bug.dx = -Math.abs(bug.dx) - 0.5;
            }
            const minTopEdge = Math.max(2, cachedHeaderH);
            if (bug.y <= minTopEdge) {
                bug.y = minTopEdge;
                bug.dy = Math.abs(bug.dy) + 0.5;
            } else if (bug.y >= (bottomLimit - bSize) - 2) {
                bug.y = (bottomLimit - bSize) - 2;
                bug.dy = -Math.abs(bug.dy) - 0.5;
            }

            
            const neighbors = getGridNeighbors(bug);
            for (let n = 0; n < neighbors.length; n++) {
                const other = neighbors[n];
                
                const a = bug._uid, b = other._uid;
                const pairKey = a < b ? a * 100000 + b : b * 100000 + a;
                if (checkedPairs.has(pairKey)) continue;
                checkedPairs.add(pairKey);
                handleBugCollision(bug, other);
            }

            resolveRockCollision(bug);

            if (mikeModePhysics) {
                const mikeFriction = Math.max(frictionSetting, 0.99);
                bug.dx *= mikeFriction;
                bug.dy *= mikeFriction;
            } else {
                bug.dx *= frictionSetting;
                bug.dy *= frictionSetting;
                
                const minMovement = 0.05;
                if (Math.abs(bug.dx) < minMovement && Math.abs(bug.dy) < minMovement && Math.random() < 0.1) {
                    bug.dx += (Math.random() - 0.5) * 0.2;
                    bug.dy += (Math.random() - 0.5) * 0.2;
                }
            }

            bug.element.style.transform = `translate3d(${bug.x}px, ${bug.y}px, 0)`;

            if (bug.hat) {
                
                const actualBugWidth = parseInt(bug.element.style.width) || bugSize;
                const hatSize = 50;
                bug.hat.style.left = `${bug.x + actualBugWidth / 2}px`;
                bug.hat.style.top = `${bug.y - actualBugWidth / 2 + hatSize}px`;
                bug.hat.style.transform = `translate(-50%, -100%)`;
            }

            if (bug.horns) {
                updateHornAttachment(bug, bugSize);
            }
        }

        requestAnimationFrame(updatePositions);
    }

    function handleBugCollision(bug, otherBug) {
        const combinedRadius = bug.radius + otherBug.radius;
        const dx = bug.x - otherBug.x;
        const dy = bug.y - otherBug.y;
        const distSq = dx * dx + dy * dy;
        const minDist = combinedRadius + 1;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq) {
            if (distSq === 0) {
                bug.x += 2;
                bug.y += 2;
                return;
            }
            const distance = Math.sqrt(distSq);

            const nx = dx / distance;
            const ny = dy / distance;

            const relativeVelocityX = bug.dx - otherBug.dx;
            const relativeVelocityY = bug.dy - otherBug.dy;
            const dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

            if (dotProduct > 0) return;

            const coefficientOfRestitution = settings.bounciness;
            const impulse = (2 * dotProduct) / (bug.mass + otherBug.mass);

            const maxImpulse = 40;
            const clampedImpulse = Math.min(impulse, maxImpulse);

            bug.dx -= clampedImpulse * otherBug.mass * nx * coefficientOfRestitution;
            bug.dy -= clampedImpulse * otherBug.mass * ny * coefficientOfRestitution;

            otherBug.dx += clampedImpulse * bug.mass * nx * coefficientOfRestitution;
            otherBug.dy += clampedImpulse * bug.mass * ny * coefficientOfRestitution;

            const overlap = combinedRadius - distance + 1;
            const correction = overlap / 1.8;

            bug.x += nx * correction;
            bug.y += ny * correction;

            otherBug.x -= nx * correction;
            otherBug.y -= ny * correction;

            if (Math.random() < 0.2) {
                bug.dx += (Math.random() - 0.5) * 0.3;
                bug.dy += (Math.random() - 0.5) * 0.3;
                otherBug.dx += (Math.random() - 0.5) * 0.3;
                otherBug.dy += (Math.random() - 0.5) * 0.3;
            }
        }
    }

    document.body.addEventListener('click', (event) => {
        const infoBox = document.getElementById('bugInfoBox');
        if (infoBox && infoBox.style.display !== 'none' && !infoBox.contains(event.target)) {
            if (window.BugUI && typeof BugUI.closeBugInfo === 'function') {
                BugUI.closeBugInfo();
            } else {
                infoBox.style.display = 'none';
            }
        }
    });


    freezeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        animationRunning = !animationRunning;
        freezeButton.textContent = animationRunning ? "Freeze Bugs" : "Unfreeze Bugs";

        if (animationRunning) {
            requestAnimationFrame(updatePositions);
        }
    });

    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let isAudioActive = false;
    let audioDataArray = null;
    let lastVolumeSpike = 0;
    let mikeModePhysics = false;
    const volumeBarContainer = document.getElementById('volume-bar-container');
    const volumeBarFill = document.getElementById('volume-bar-fill');

    function startAudioReactive() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                
                analyser.fftSize = 128; 
                analyser.smoothingTimeConstant = 0.8;
                const bufferLength = analyser.frequencyBinCount;
                audioDataArray = new Uint8Array(bufferLength);
                
                microphone.connect(analyser);
                isAudioActive = true;
                
                spinButton.textContent = "Mike mode off :(";
                volumeBarContainer.style.display = 'block';
                mikeModePhysics = true;
                processAudio();
            })
            .catch(err => {
                console.log('Microphone access denied:', err);
                alert('Microphone access denied. The audio reactive mode needs microphone permission to work.');
            });
    }

    function stopAudioReactive() {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        isAudioActive = false;
        mikeModePhysics = false;
        spinButton.textContent = "Mike mode";
        volumeBarContainer.style.display = 'none';
        volumeBarFill.style.width = '0%';
    }

    function processAudio() {
        if (!isAudioActive || !analyser) return;

        analyser.getByteFrequencyData(audioDataArray);
        

        let sum = 0;
        for (let i = 0; i < audioDataArray.length; i++) {
            sum += audioDataArray[i] * audioDataArray[i];
        }
        const rms = Math.sqrt(sum / audioDataArray.length);
        const volume = Math.min(rms / 128, 1);
        

        volumeBarFill.style.width = `${volume * 100}%`;
        
        const currentTime = Date.now();
        

        if (volume > 0.15 && currentTime - lastVolumeSpike > 150) {
            lastVolumeSpike = currentTime;
            
            const intensity = volume;
            const baseVelocity = settings.maxSpeed * 0.3;
            const maxVelocity = settings.maxSpeed * 0.8;

            bugData.forEach(bug => {
                const angle = Math.random() * Math.PI * 2;
                const velocityMagnitude = baseVelocity + (Math.random() * (maxVelocity - baseVelocity) * intensity);
                

                bug.dx = Math.cos(angle) * velocityMagnitude;
                bug.dy = Math.sin(angle) * velocityMagnitude;

            });
        }

        if (isAudioActive) {
            requestAnimationFrame(processAudio);
        }
    }

    function showMikeModeModal() {
        const mikeModeModal = document.createElement("div");
        mikeModeModal.className = "modal";
        mikeModeModal.style.display = "block";
        
        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        
        const closeButton = document.createElement("span");
        closeButton.className = "close-button";
        closeButton.innerHTML = "&times;";
        closeButton.addEventListener("click", () => mikeModeModal.remove());
        
        const checkboxContainer = document.createElement("div");
        checkboxContainer.style.textAlign = "center";
        checkboxContainer.style.marginBottom = "15px";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "dont-show-mike-modal";
        
        const checkboxLabel = document.createElement("label");
        checkboxLabel.htmlFor = "dont-show-mike-modal";
        checkboxLabel.textContent = "Don't show this again";
        checkboxLabel.style.marginLeft = "5px";
        checkboxLabel.style.fontSize = "14px";
        checkboxLabel.style.color = "#666";
        checkboxLabel.style.cursor = "pointer";
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);
        
        const modalTitle = document.createElement("h2");
        modalTitle.textContent = "Mike Mode";
        modalTitle.style.textAlign = "center";
        modalTitle.style.marginBottom = "15px";
        modalTitle.style.fontSize = "24px";
        modalTitle.style.marginTop = "10px";
        
        const description = document.createElement("div");
        description.innerHTML = `
            <p style="margin-bottom: 12px; line-height: 1.4;">
                <strong>Mike Mode</strong> makes it so you can entertain the bugs with noise and stuff
            </p>
            <p style="margin-bottom: 12px; line-height: 1.4;">
                When activated, the bugs will react to sounds in real-time:
            </p>
            <ul style="margin: 12px 0 12px 20px; line-height: 1.4;">
                <li>Loud sounds make the bugs go nuts and bonkers</li>
                <li>Quiet sounds are boring for the bugs</li>
                <li>It does not matter where you are right now, scream at the top of your lungs so the bugs move around</li>
                <li>If anybody complains about you yelling, you can direct them to my email :) smile</li>
                <li>Don't forget! Change the max speed of the bugs in settings if you wanna break them.</li>
            </ul>
            <div style="position: relative; margin: 20px 0; display: flex; align-items: center;">
                <div style="flex: 1; padding-right: 8px;">
                    <p style="margin: 0; line-height: 1.4; font-size: 16px; color: #333;">
                        ha ha no its not this guy don't worry :) smile
                    </p>
                </div>
                <div style="position: relative; width: 60px; height: 20px; flex: 0 0 60px;">
                    <!-- Arrow tail (meets head perfectly at head's base) -->
                    <div style="position: absolute; top: 50%; left: 0; right: 12px; height: 4px; background-color: #ff0000; transform: translateY(-50%);"></div>
                    <!-- Arrow head (touches the image perfectly) -->
                    <div style="position: absolute; top: 50%; right: 0; width: 0; height: 0; border-left: 12px solid #ff0000; border-top: 8px solid transparent; border-bottom: 8px solid transparent; transform: translateY(-50%);"></div>
                </div>
                <img src="src/Mike.png" alt="Mike" style="width: 80px; height: 80px; flex-shrink: 0; display: block;" />
            </div>
            <p style="margin-bottom: 12px; line-height: 1.4;">
                <strong>Privacy:</strong> Your audio is processed locally and never recorded or sent anywhere.
            </p>
            <p style="margin-bottom: 15px; line-height: 1.4; font-size: 14px; color: #666;">
                Little fun side note: You'll need to grant microphone permission when prompted by your browser.
            </p>
        `;
        
        const buttonContainer = document.createElement("div");
        buttonContainer.style.textAlign = "center";
        buttonContainer.style.marginTop = "15px";
        
        const activateButton = document.createElement("button");
        activateButton.textContent = "Activate Mike Mode";
        activateButton.className = "modal-button primary";
        activateButton.style.padding = "10px 20px";
        activateButton.style.fontSize = "16px";
        activateButton.style.marginRight = "10px";
        activateButton.style.cursor = "pointer";
        activateButton.style.backgroundColor = "#2196f3";
        activateButton.style.color = "white";
        activateButton.style.border = "none";
        activateButton.style.borderRadius = "5px";
        
        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.className = "modal-button secondary";
        cancelButton.style.padding = "10px 20px";
        cancelButton.style.fontSize = "16px";
        cancelButton.style.cursor = "pointer";
        cancelButton.style.backgroundColor = "#666";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "5px";
        
        activateButton.addEventListener("click", () => {
            if (checkbox.checked) {
                localStorage.setItem("28bugs_hideMikeModeModal", "true");
            }
            mikeModeModal.remove();
            startAudioReactive();
        });
        
        cancelButton.addEventListener("click", () => {
            if (checkbox.checked) {
                localStorage.setItem("28bugs_hideMikeModeModal", "true");
            }
            mikeModeModal.remove();
        });
        
        buttonContainer.appendChild(activateButton);
        buttonContainer.appendChild(cancelButton);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(checkboxContainer);
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(description);
        modalContent.appendChild(buttonContainer);
        
        mikeModeModal.appendChild(modalContent);
        document.body.appendChild(mikeModeModal);
        
        
        mikeModeModal.addEventListener("click", (e) => {
            if (e.target === mikeModeModal) {
                mikeModeModal.remove();
            }
        });
    }

    spinButton.addEventListener("click", (event) => {
        event.stopPropagation();
        
        if (!isAudioActive) {
            
            const hideMikeModeModal = localStorage.getItem("28bugs_hideMikeModeModal");
            if (!hideMikeModeModal) {
                showMikeModeModal();
            } else {
                startAudioReactive();
            }
        } else {
            stopAudioReactive();
        }
    });

    awesomeModeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        awesomeModeEnabled = !awesomeModeEnabled;
        awesomeModeButton.textContent = awesomeModeEnabled ? "Boring Mode" : "Awesome Mode";

        if (awesomeModeEnabled) {
            
            if (window.__awesomeInterval__) clearInterval(window.__awesomeInterval__);
            window.__awesomeInterval__ = setInterval(() => {
                for (let i = 0; i < bugData.length; i++) {
                    const b = bugData[i];
                    b.dx = (Math.random() - 0.5) * 20;
                    b.dy = (Math.random() - 0.5) * 20;
                }
            }, 50);
        } else {
            if (window.__awesomeInterval__) {
                clearInterval(window.__awesomeInterval__);
                window.__awesomeInterval__ = null;
            }
            for (let i = 0; i < bugData.length; i++) {
                const b = bugData[i];
                b.dx = (Math.random() - 0.5) * 5;
                b.dy = (Math.random() - 0.5) * 5;
            }
        }
    });

    if (greenButton) {
        let greenModeEnabled = document.body.classList.contains('greenified');
        const updateGreenButtonText = () => {
            greenButton.textContent = greenModeEnabled ? "Normal Colors" : "Green Button";
        };
        updateGreenButtonText();
        greenButton.addEventListener("click", (event) => {
            event.stopPropagation();
            greenModeEnabled = !greenModeEnabled;
            document.body.classList.toggle('greenified', greenModeEnabled);
            updateGreenButtonText();
        });
    }

    const tray = document.querySelector(".button-tray");
    const groupPrimary = tray?.querySelector(".button-group.primary") || tray;
    const groupActions = tray?.querySelector(".button-group.actions") || tray;
    const groupNav = document.querySelector(".button-group.nav") || tray;

    
    (function initHeaderToggle() {
        const toggle = document.getElementById('header-toggle');
        const header = document.querySelector('header');
        if (!toggle || !header) return;
        toggle.addEventListener('click', function() {
            header.classList.toggle('header-collapsed');
        });
        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });
    })();

    
    function createBugInternal() {
        const { width: playW, height: playH } = getPlayfield();
        const bugSize = getBugSize();
        const bottomMaxY = isDesktop() ? Math.max(0, playH - 2 * bugSize) : Math.max(0, playH - bugSize);
        const randomImage = BugData.getRandomBugImage();

        const newBug = document.createElement("img");
        newBug.src = randomImage;
        newBug.classList.add("bug");
        newBug.style.position = "absolute";
        newBug.style.width = `${bugSize}px`;
        newBug.style.height = `${bugSize}px`;
        newBug.style.pointerEvents = "auto";

    const x = Math.random() * Math.max(0, playW - bugSize);
    const y = Math.random() * bottomMaxY;
    newBug.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        const bugsContainer = document.querySelector(".bugs-container");
        bugsContainer.appendChild(newBug);

        const newBugData = {
            element: newBug,
            x,
            y,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            mass: 1,
            radius: bugSize / 2,
            drag: 0.995,
            hat: null,
            horns: null,
            _uid: _nextBugUid++
        };
        bugData.push(newBugData);

        BugUI.assignBugProperties(newBug, newBugData);
        if (evilModeActive) {
            applyEvilAura(newBugData);
        }
    }

    function setBugCount(targetCount) {
        const current = Array.from(document.querySelectorAll('.bug'));

        
        if (window.BugSettings && BugSettings.settings) {
            BugSettings.settings.bugCapacity = Math.max(BugSettings.settings.bugCapacity || 0, targetCount);
        }

        if (current.length > targetCount) {
            const toRemove = current.length - targetCount;
            for (let i = 0; i < toRemove; i++) {
                const el = current[current.length - 1 - i]; 
                const idx = bugData.findIndex(b => b.element === el);
                if (idx !== -1) {
                    removeEvilHorns(bugData[idx]);
                    try { removeHat(bugData[idx]); } catch (_) {}
                    bugData.splice(idx, 1);
                }
                el.remove();
            }
        } else if (current.length < targetCount) {
            const toAdd = targetCount - current.length;
            for (let i = 0; i < toAdd; i++) {
                createBugInternal();
            }
        }
        updateBugCounter();
    }

    
    if (groupPrimary) {
        const set28Btn = document.createElement('button');
        set28Btn.id = 'set-28-button';
        set28Btn.textContent = '28';
        set28Btn.title = 'Set bugs to 28';
        groupPrimary.appendChild(set28Btn);
        set28Btn.addEventListener('click', (e) => { e.stopPropagation(); setBugCount(28); });
        updateSimFeatureVisibility();
    }

    function updateBugCounter() {
        const currentBugCount = document.querySelectorAll(".bug").length;
    }
    updateBugCounter();

    function destroyRandomBug(event) {
        if (event) event.stopPropagation();
        const remainingBugs = document.querySelectorAll(".bug");

        if (remainingBugs.length > 0) {
            const bug = remainingBugs[Math.floor(Math.random() * remainingBugs.length)];
            const bugIndex = bugData.findIndex(b => b.element === bug);
            if (bugIndex === -1) return;

            deletedBugs = [];
            try { deletedBugs = JSON.parse(localStorage.getItem('28bugs_memorialData')) || []; } catch(_) {}
            window.deletedBugs = deletedBugs;

            const newMemorial = {
                name: bug.dataset.bugName,
                story: bug.dataset.bugStory,
                birthday: bug.dataset.bugBirthday,
                deathDate: BugData.generateDeathDate(),
                causeOfDeath: BugData.getRandomDeathMessage()
            };
            deletedBugs.push(newMemorial);
            localStorage.setItem('28bugs_memorialData', JSON.stringify(deletedBugs));

            const explosion = document.createElement("img");
            
            
            if (explosionGifBytes) {
                try {
                    const blob = new Blob([explosionGifBytes], { type: 'image/gif' });
                    const url = URL.createObjectURL(blob);
                    explosion.src = url;
                    
                    explosion._objUrl = url;
                } catch (e) {
                    explosion.src = "src/coolexplosion.gif?cb=" + Date.now() + Math.random();
                }
            } else {
                
                explosion.src = "src/coolexplosion.gif?cb=" + Date.now() + Math.random();
            }
            explosion.style.position = "absolute";
            explosion.style.width = "100px";
            explosion.style.height = "100px";
            explosion.style.pointerEvents = "none";

            const bugRect = bug.getBoundingClientRect();
            const bugSize = getBugSize();
            explosion.style.left = `${bugRect.left + bugSize / 2}px`;
            explosion.style.top = `${bugRect.top + bugSize / 2 - 50}px`;
            explosion.style.transform = "translate(-50%, -50%)";

            const explosionSound = new Audio("src/deltarune-explosion.mp3");
            explosionSound.volume = 0.25;
            explosionSound.play();

            const bugsContainer = document.querySelector(".bugs-container");
            bugsContainer.appendChild(explosion);

            removeEvilHorns(bugData[bugIndex]);
            
            try { removeHat(bugData[bugIndex]); } catch (_) {}
            bug.remove();
            bugData.splice(bugIndex, 1);

            setTimeout(() => {
                try {
                    if (explosion && explosion._objUrl) {
                        
                        URL.revokeObjectURL(explosion._objUrl);
                        explosion._objUrl = null;
                    }
                } catch (e) {}
                explosion.remove();
            }, 1500);

            updateBugCounter();
        } else {
            alert("No more bugs. They had families and will be missed.");
        }
    }

    if (destroyButton) destroyButton.addEventListener("click", destroyRandomBug);

    function executeNuke() {
        dropNukeButton.disabled = true;

        
        if (typeof AchievementTracker !== 'undefined' && AchievementTracker.trackNukeUsage) {
            AchievementTracker.trackNukeUsage();
        }

        const nuke = document.createElement("img");
        nuke.src = "src/nuke.png";
        nuke.style.position = "absolute";
        nuke.style.width = "160px";
        nuke.style.height = "80px";
        nuke.style.left = `50%`;
        nuke.style.top = `-80px`;
        nuke.style.transform = "translateX(-50%) rotate(-90deg)";
        nuke.style.transition = "top 1s linear";

        const bugsContainer = document.querySelector(".bugs-container");
        bugsContainer.appendChild(nuke);

        setTimeout(() => {
            nuke.style.top = `${window.innerHeight - 80}px`;
        }, 100);

        setTimeout(() => {
            const explosionGif = document.createElement("img");
            
            if (nukeGifBytes) {
                try {
                    const blob = new Blob([nukeGifBytes], { type: 'image/gif' });
                    const url = URL.createObjectURL(blob);
                    explosionGif.src = url;
                    explosionGif._objUrl = url;
                } catch (e) {
                    explosionGif.src = "src/Nuke.gif?cb=" + Date.now() + Math.random();
                }
            } else {
                explosionGif.src = "src/Nuke.gif?cb=" + Date.now() + Math.random();
            }
            explosionGif.style.position = "fixed";
            explosionGif.style.top = "0";
            explosionGif.style.left = "0";
            explosionGif.style.width = "100%";
            explosionGif.style.height = "100%";
            explosionGif.style.zIndex = "1000";
            explosionGif.style.pointerEvents = "none";

            document.body.appendChild(explosionGif);

            deletedBugs = [];
            try { deletedBugs = JSON.parse(localStorage.getItem('28bugs_memorialData')) || []; } catch(_) {}
            window.deletedBugs = deletedBugs;

            document.querySelectorAll(".bug").forEach(bug => {
                const newMemorial = {
                    name: bug.dataset.bugName,
                    story: bug.dataset.bugStory,
                    birthday: bug.dataset.bugBirthday,
                    deathDate: BugData.generateDeathDate(),
                    causeOfDeath: BugData.getRandomDeathMessage()
                };
                
                deletedBugs.push(newMemorial);
            });
            
            localStorage.setItem('28bugs_memorialData', JSON.stringify(deletedBugs));

            bugData.forEach(removeEvilHorns);
            bugData.forEach(removeHat);
            document.querySelectorAll(".bug").forEach(bug => bug.remove());
            bugData.length = 0;

            updateBugCounter();

            setTimeout(() => {
                try {
                    if (explosionGif && explosionGif._objUrl) {
                        URL.revokeObjectURL(explosionGif._objUrl);
                        explosionGif._objUrl = null;
                    }
                } catch (e) {}
                explosionGif.remove();
                dropNukeButton.disabled = false;
            }, 2805);

            nuke.remove();
        }, 1000);
    }

    dropNukeButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        modal.style.zIndex = "2000";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.fontFamily = "'Comic Sans MS', 'Comic Sans', cursive";

        const modalContent = document.createElement("div");
        modalContent.style.backgroundColor = "#fff";
        modalContent.style.padding = "30px";
        modalContent.style.borderRadius = "15px";
        modalContent.style.maxWidth = "500px";
        modalContent.style.textAlign = "center";
        modalContent.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
        modalContent.style.border = "3px solid #ff4444";

        const warningIcon = document.createElement("div");
        warningIcon.textContent = "";
        warningIcon.style.fontSize = "60px";
        warningIcon.style.marginBottom = "20px";

        const title = document.createElement("h2");
        title.textContent = "NUCLEAR WARNING";
        title.style.color = "#ff4444";
        title.style.marginBottom = "20px";
        title.style.fontSize = "24px";

        const message = document.createElement("p");
        message.innerHTML = `<strong> THINK ABOUT WHAT YOU'RE DOING </strong><br><br>
                            You are about to commit bug genocide. These innocent creatures have names, families, and dreams.<br><br>
                            Each bug has a life. A story they've lived. They live and breathe just like we do. They trust you to protect them, not to destroy them all in a nuclear holocaust.<br><br>
                            This action cannot be undone, and mass genocide like this will have at least most of the UN condemn you. You need to think this through before doing it. Genuinely I have no idea why you would in the first place <br><br>
                            <strong>Are you really sure you want to do this?</strong>`;
        message.style.marginBottom = "25px";
        message.style.lineHeight = "1.6";
        message.style.color = "#333";

        const countdownDiv = document.createElement("div");
        countdownDiv.style.fontSize = "48px";
        countdownDiv.style.fontWeight = "bold";
        countdownDiv.style.color = "#ff4444";
        countdownDiv.style.marginBottom = "20px";
        countdownDiv.textContent = "5";

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "15px";
        buttonContainer.style.justifyContent = "center";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel (Save the bugs!)";
        cancelButton.style.padding = "12px 24px";
        cancelButton.style.fontSize = "16px";
        cancelButton.style.backgroundColor = "#4CAF50";
        cancelButton.style.color = "white";
        cancelButton.style.border = "none";
        cancelButton.style.borderRadius = "8px";
        cancelButton.style.cursor = "pointer";
        cancelButton.style.fontFamily = "inherit";

        const nukeButton = document.createElement("button");
        nukeButton.textContent = "Deploy Nuclear Weapon";
        nukeButton.style.padding = "12px 24px";
        nukeButton.style.fontSize = "16px";
        nukeButton.style.backgroundColor = "#ccc";
        nukeButton.style.color = "#666";
        nukeButton.style.border = "none";
        nukeButton.style.borderRadius = "8px";
        nukeButton.style.cursor = "not-allowed";
        nukeButton.style.fontFamily = "inherit";
        nukeButton.disabled = true;

        modalContent.appendChild(warningIcon);
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(countdownDiv);
        modalContent.appendChild(buttonContainer);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(nukeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownDiv.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                countdownDiv.textContent = "0";
                nukeButton.disabled = false;
                nukeButton.style.backgroundColor = "#ff4444";
                nukeButton.style.color = "white";
                nukeButton.style.cursor = "pointer";
                countdownDiv.style.color = "#4CAF50";
                countdownDiv.textContent = "✓";
            }
        }, 1000);

        cancelButton.addEventListener("click", () => {
            clearInterval(countdownInterval);
            modal.remove();
        });

        nukeButton.addEventListener("click", () => {
            clearInterval(countdownInterval);
            modal.remove();
            executeNuke();
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                clearInterval(countdownInterval);
                modal.remove();
            }
        });
    });

    function createRandomBug(event) {
        if (event) event.stopPropagation();

        if (document.querySelectorAll(".bug").length >= settings.bugCapacity) {
            alert(`Why would you want any more bugs? ${settings.bugCapacity + 1} is too many. Your greed sickens me`);
            return;
        }

    const { width: playW, height: playH } = getPlayfield();
    const bugSize = getBugSize();
    const bottomMaxY = isDesktop() ? Math.max(0, playH - 2 * bugSize) : Math.max(0, playH - bugSize);
        const randomImage = BugData.getRandomBugImage();

        const newBug = document.createElement("img");
        newBug.src = randomImage;
        newBug.classList.add("bug");
        newBug.style.position = "absolute";
        newBug.style.width = `${bugSize}px`;
        newBug.style.height = `${bugSize}px`;
        newBug.style.pointerEvents = "auto";

    const x = Math.random() * Math.max(0, playW - bugSize);
    const y = Math.random() * bottomMaxY;
    newBug.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        const bugsContainer = document.querySelector(".bugs-container");
        bugsContainer.appendChild(newBug);

        const uniqueSeed = Math.floor(Math.random() * 0x7FFFFFFF);
        const newBugData = {
            element: newBug,
            x,
            y,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            mass: 1,
            radius: bugSize / 2,
            drag: 0.995,
            hat: null,
            horns: null,
            bugSeed: uniqueSeed,
            _uid: _nextBugUid++
        };
        newBug.dataset.bugSeed = uniqueSeed;
        bugData.push(newBugData);

        BugUI.assignBugProperties(newBug, newBugData);
        if (evilModeActive) {
            applyEvilAura(newBugData);
        }

        updateBugCounter();
    }

    if (createButton) createButton.addEventListener("click", createRandomBug);

    if (rockButton) {
        rockButton.addEventListener("click", function(event) {
            event.stopPropagation();
            
            rockCenterX = null; 
            initRockObstacle(true, null, null);
            rockButton.disabled = true;
        });
    }

    const fiendsLink = document.createElement("a");
    fiendsLink.textContent = "Fiends";
    fiendsLink.href = "fiends.html";
    fiendsLink.className = "nav-btn";
    groupNav.appendChild(fiendsLink);

    const fansLink = document.createElement("a");
    fansLink.textContent = "Fans";
    fansLink.href = "fans.html";
    fansLink.className = "nav-btn";
    groupNav.appendChild(fansLink);

    const memorialButton = document.createElement("button");
    memorialButton.textContent = "Memorial Wall";
    groupActions.appendChild(memorialButton);
    memorialButton.addEventListener("click", () => { BugUI.showMemorialWall(deletedBugs); });

    
    let hatButton = document.getElementById('hat-button');
    if (!hatButton) {
        hatButton = document.createElement('button');
        hatButton.id = 'hat-button';
        hatButton.textContent = 'Hats On';
        
        if (groupPrimary) {
            groupPrimary.appendChild(hatButton);
        } else {
            document.body.appendChild(hatButton);
        }
    }

    let hatsEnabled = false;
    Object.defineProperty(window, 'hatsEnabled', {
        get() { return hatsEnabled; },
        set(v) { hatsEnabled = v; }
    });
    window.ensureHat = ensureHat;

    
    window._dragModeOn = true;
    const dragModeBtn = document.getElementById('drag-mode-button');
    if (dragModeBtn) {
        dragModeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window._dragModeOn = !window._dragModeOn;
            dragModeBtn.textContent = window._dragModeOn ? 'Drag Mode On' : 'Drag Mode Off';
        });
    }

    
    const infoModeBtn = document.getElementById('info-mode-button');
    if (infoModeBtn) {
        infoModeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const s = (window.BugSettings && window.BugSettings.settings) || {};
            s.bugInfoEnabled = !s.bugInfoEnabled;
            infoModeBtn.textContent = s.bugInfoEnabled ? 'Info On' : 'Info Off';
        });
    }

    const timeWarpBtn = document.getElementById('time-warp-button');
    if (timeWarpBtn) {
        timeWarpBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.TimeWarp) {
                var on = window.TimeWarp.toggle();
                timeWarpBtn.textContent = on ? 'Time Warp OFF' : 'Time Warp';
                timeWarpBtn.style.background = on ? '#6A1B9A' : '';
                timeWarpBtn.style.color = on ? '#fff' : '';
            }
        });
    }
    let partyAudio = null;
    let partyEffectRunning = false; 
    let confettiImgEl = null;
    const CONFETTI_DURATION_MS = 4000; 

    
    
    
    let explosionGifBytes = null;
    let nukeGifBytes = null;
    function preloadExplosionGifs() {
        try {
            fetch('src/coolexplosion.gif')
                .then(r => r.arrayBuffer())
                .then(buf => { explosionGifBytes = buf; })
                .catch(() => { explosionGifBytes = null; });
        } catch (e) { explosionGifBytes = null; }

        try {
            fetch('src/Nuke.gif')
                .then(r => r.arrayBuffer())
                .then(buf => { nukeGifBytes = buf; })
                .catch(() => { nukeGifBytes = null; });
        } catch (e) { nukeGifBytes = null; }
    }
    
    preloadExplosionGifs();

    function ensurePartyAudio() {
        if (!partyAudio) {
            partyAudio = new Audio('src/party.mp3');
            partyAudio.preload = 'auto';
        }
        return partyAudio;
    }

    function playPartyEffectOnce() {
        if (partyEffectRunning) return; 
        partyEffectRunning = true;
        
        const audio = ensurePartyAudio();
        try { audio.currentTime = 0; audio.play().catch(()=>{}); } catch(_) {}
        
        confettiImgEl = document.createElement('img');
        confettiImgEl.src = 'src/confetti.gif?cb=' + Date.now();
        confettiImgEl.alt = '';
        confettiImgEl.style.position = 'fixed';
        confettiImgEl.style.top = '0';
        confettiImgEl.style.left = '0';
        confettiImgEl.style.width = '100%';
        confettiImgEl.style.height = '100%';
        confettiImgEl.style.objectFit = 'cover';
        confettiImgEl.style.pointerEvents = 'none';
        confettiImgEl.style.zIndex = '9999';
        confettiImgEl.style.opacity = '0';
        confettiImgEl.style.transition = 'opacity .35s ease-in';
        document.body.appendChild(confettiImgEl);
        requestAnimationFrame(() => { confettiImgEl && (confettiImgEl.style.opacity = '1'); });
        
        setTimeout(() => stopPartyEffect(false), CONFETTI_DURATION_MS);
    }

    function stopPartyEffect(resetFlag = true) {
        if (confettiImgEl) {
            confettiImgEl.style.transition = 'opacity .3s ease-out';
            confettiImgEl.style.opacity = '0';
            const toRemove = confettiImgEl;
            confettiImgEl = null;
            setTimeout(() => { toRemove && toRemove.remove(); }, 300);
        }
        if (partyAudio) { try { partyAudio.pause(); } catch(_) {} }
        if (resetFlag) partyEffectRunning = false; else partyEffectRunning = false; 
    }

    function ensureHat(entry) {
        if (!entry || !entry.element || entry.hat) return;
        const hat = document.createElement('img');
        hat.src = 'src/bug-hat.png';
        hat.alt = '';
        hat.className = 'bug-hat';
        hat.draggable = false;
        hat.style.position = 'absolute';
        hat.style.pointerEvents = 'none';
        hat.style.width = '50px';
        hat.style.height = '50px';
        const bugsContainer = document.querySelector('.bugs-container');
        if (bugsContainer) bugsContainer.appendChild(hat);
        entry.hat = hat;
        
    }

    function removeHat(entry) {
        if (!entry || !entry.hat) return;
        entry.hat.remove();
        entry.hat = null;
    }

    function applyHats() {
        bugData.forEach(ensureHat);
    }

    function clearHats() {
        bugData.forEach(removeHat);
    }

    hatButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hatsEnabled = !hatsEnabled;
        if (hatsEnabled) {
            applyHats();
            hatButton.textContent = 'Hats Off';
            playPartyEffectOnce(); 
        } else {
            clearHats();
            hatButton.textContent = 'Hats On';
            stopPartyEffect(); 
        }
    });

    function recomputeLayoutMetrics() {
        if (playfieldEl) {
            cachedPlayW = playfieldEl.clientWidth;
            cachedPlayH = playfieldEl.clientHeight;
        } else {
            cachedPlayW = window.innerWidth;
            cachedPlayH = window.innerHeight;
        }
        cachedHeaderH = headerEl ? headerEl.offsetHeight : 0;
        _isDesktopFlag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    function recomputePlayfieldLayout() {
        recomputeLayoutMetrics();
        const playW = cachedPlayW;
        const playH = cachedPlayH;
        const bugSize = getBugSize();
        const bottomMaxY = isDesktop() ? Math.max(0, playH - 2 * bugSize) : Math.max(0, playH - bugSize);

        bugData.forEach(bug => {
            bug.x = Math.min(Math.max(bug.x, 0), Math.max(0, playW - bugSize));
            bug.y = Math.min(Math.max(bug.y, 0), bottomMaxY);
            bug.element.style.transform = `translate3d(${bug.x}px, ${bug.y}px, 0)`;
        });

        refreshBoundsOverlay();
        if (rockObstacleEl) initRockObstacle();
    }

    window.addEventListener('resize', () => {
        recomputePlayfieldLayout();
    });

    window.addEventListener('orientationchange', () => {
        recomputeLayoutMetrics();
        if (rockObstacleEl) initRockObstacle(true);
    });

    function refreshBoundsOverlay() {

    }

    bugs.forEach(bug => {
        BugUI.assignBugProperties(bug, null);
    });

    
    recomputeLayoutMetrics();
    bugData.forEach(bug => {
        if (bug.y < cachedHeaderH) {
            bug.y = cachedHeaderH + Math.random() * 50;
        }
    });

    if (window.BugWelcome.shouldShowWelcome()) {
        window.BugWelcome.showWelcomePopup();
    }

    const infoButton = document.createElement("button");
    infoButton.textContent = "Info";
    infoButton.id = "info-button";
    groupActions.appendChild(infoButton);
    infoButton.addEventListener("click", () => { window.BugWelcome.showWelcomePopup(); });

    const grossModeBtn = document.getElementById('gross-mode-btn');
    if (grossModeBtn) {
        grossModeBtn.addEventListener('click', function() {
            document.body.classList.toggle('gross-mode');
            if (document.body.classList.contains('gross-mode')) {
                this.textContent = "Fake Form";
                applyRandomGrossVariant();
                startGrossPopups();
                enableGrossClickSounds();
            } else {
                this.textContent = "True Form";
                removeGrossVariant();
                stopGrossPopups();
                removeAllGrossPopups();
                disableGrossClickSounds();
            }
        });
    }

    let grossPopupInterval = null;
    const grossPopupMessages = [
        "Congratulations! You are the 1,000,000th visitor!",
        "WARNING: 28 awesome bugs detected! haha just a little joke we like to do here",
        "You have won a free bug! ",
        "This site uses cookies. And bugs. just another little joke we do here at 28awesomebugs.org",
        "Install Bugafee™ for an awesomer experience.",
        "Add more bugs?",
        "Big bug dot org",
        "Did you know? I keep a lot of information about you when you visit this site.",
        "Errmmmm its behind me, isn't it?",
        "Awesomesauce :)",
        "You are being watched by bugs.",
        "Please rotate your device. Thank youuuuuu",
        "Error 28: aweosmefbugs.,org",
        "I have your credit card information by the way",
        "If you give me a dollar I will add malware to the site",
        "ERmmmm ill take 1 bug please!",
        "I Didn't order a bug! ha ha just a little joke we like to do here",
        "Ouuughhhh my tummy hurts",
        "Bug Tuah! :) just another joke we like to do here haha",
        "29 not awesome mammals! Heh... calm down liberal... just some dark humor...",
        "Gen Z is trying to cancel bugs....",
        "Remember. Don't take breaks, your time on this site is limited",
        "Pregnancy test dot com!",
        "Joshua Bugmar",
        "I have access to your webcam by the way",
        "Yeah please keep pressing the X button please",
        "By the way your carbon footprint really do matter",
        "Sign up for a free bug! ha ha just kidding :)",
        "Whats your favorite number? Mines 28!! :)",
        "Sign up for a free bug. Smile :)",
        "You should give into all of your addictions",
        "The government has your best interest in mind always :)",
        "Whatever you do, do NOT look up 40% cops",
        "Google, show me cool pictures of bugs please!",
        "Click me to go to 300awesomebugs.gov!",
        "Click me to make this website government sponsored",
        "Please dont stop clicking me oughhhh",
        "I have a bug to show you! :) smile",
        "ha ha you should eat a bug :)",
        "I will be there when you stop breathing",
        "Dude you should totally play Hylics its literally the best game ever",
        "Can you dos a abacksflips.?",
        "What would happen if i threw a bug at the wall at 100 miles per hour like would it explode or something idk",
        "Male pregnancy is real",
        "I like to watch you when you sleep",
        "Uh oh sorry i don't know how to make this go away",
        "Dude this is like orbos oddessey -guy who has only played orbos oddessey",
        "MANUAL BREATHING MANUAL BLINKING",
        "OHHHH PLEASE DONT SQUISH ME IM JUST A LITTLE BUGGGG OOOOOOUGHHH",
        "Don't tell anyone bug dot com. I have a bug to show you :)",
        "achtundzwanzigste awesome bugs! ",
        "Man if there were only a website where you could see 28 awesome bugs",
        "Good morning everybuggy! :) smile",
        "uyg3riouhwg 3oyuG#UYHvb9ouhrv32oihvohqqqqqhmk,nmnncffkl,///",
        "Man someone oughta take this website out back and put it down like a dog",
        "Ha ha it smells like burnt popcorn in here",
        "Calm down bug we're your friends :)",
        "Put your fist in your mouth NOW",
        "I know the address of the person who made this site",
        "type BUG for a free prize! ok im sorry that was a lie",
        "THIS IS NOT A DRILL OR A JOKE!!! hi :) smile",
        "WATCH OUT THERE ARE BUGOIDS ON THE SCREEN!"
    ];

    function createGrossPopup() {
        const popup = document.createElement('div');
        popup.className = 'gross-popup';
        popup.style.position = 'fixed';
        popup.style.zIndex = 99999;
        popup.style.background = '#fff700';
        popup.style.color = '#ff00c8';
        popup.style.border = '4px solid #ff00c8';
        popup.style.boxShadow = '0 0 20px #ff00c8, 0 0 10px #fffb00 inset';
        popup.style.fontFamily = '"Papyrus", "Comic Sans MS", "Impact", cursive, fantasy';
        popup.style.fontSize = '1.1em';
        popup.style.padding = '18px 28px 18px 18px';
        popup.style.borderRadius = '0';
        popup.style.maxWidth = '320px';
        popup.style.minWidth = '180px';
        popup.style.pointerEvents = 'auto';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.gap = '10px';

        popup.style.top = Math.floor(Math.random() * 60 + 10) + '%';
        popup.style.left = Math.floor(Math.random() * 60 + 10) + '%';

        popup.textContent = grossPopupMessages[Math.floor(Math.random() * grossPopupMessages.length)];

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖';
        closeBtn.style.marginLeft = 'auto';
        closeBtn.style.background = '#ff00c8';
        closeBtn.style.color = '#fff700';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.2em';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '2px 8px';
        closeBtn.style.borderRadius = '0';
        closeBtn.addEventListener('click', () => popup.remove());

        popup.appendChild(closeBtn);
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 50000);
    }

    function startGrossPopups() {
        if (grossPopupInterval) return;
        createGrossPopup();
        grossPopupInterval = setInterval(() => {
            if (document.body.classList.contains('gross-mode')) {
                createGrossPopup();
            }
        }, 800 + Math.random() * 3000);
    }

    function stopGrossPopups() {
        if (grossPopupInterval) {
            clearInterval(grossPopupInterval);
            grossPopupInterval = null;
        }
    }

    function removeAllGrossPopups() {
        document.querySelectorAll('.gross-popup').forEach(p => p.remove());
    }

    
    let _grossVariantStyleEl = null;
    let _grossVariantClass = null;
    let _grossVariantInlineRecords = {}; 
    let _grossAutoRevertTimer = null;

    function removeGrossVariant() {
        
        const cls = _grossVariantClass;
        if (cls) {
            document.body.classList.remove(cls);
            _grossVariantClass = null;
        }

        if (_grossVariantStyleEl && _grossVariantStyleEl.parentNode) {
            _grossVariantStyleEl.parentNode.removeChild(_grossVariantStyleEl);
            _grossVariantStyleEl = null;
        }
        
        document.querySelectorAll('#gross-variant-style').forEach(el => el.remove());


        if (_grossAutoRevertTimer) {
            clearTimeout(_grossAutoRevertTimer);
            _grossAutoRevertTimer = null;
        }

        if (cls && _grossVariantInlineRecords[cls]) {
            const recs = _grossVariantInlineRecords[cls];
            recs.forEach(({node, prevStyle}) => {
                try {
                    if (!node) return;
                    if (prevStyle === null || prevStyle === undefined) {
                        node.removeAttribute('style');
                    } else {
                        node.setAttribute('style', prevStyle);
                    }
                } catch (e) {
                    
                }
            });
            delete _grossVariantInlineRecords[cls];
        }

        
        document.querySelectorAll('.bug').forEach(b => {
            b.style.removeProperty('width');
            b.style.removeProperty('height');
            b.style.removeProperty('opacity');
            b.style.removeProperty('filter');
            b.style.removeProperty('border');
            b.style.removeProperty('clip-path');
            b.style.removeProperty('image-rendering');
            b.style.removeProperty('animation');
        });
    }
    function applyRandomGrossVariant(seed, saveToStorage = true) {
        removeGrossVariant();
        const usedSeed = (typeof seed === 'number' && !isNaN(seed)) ? seed : Math.floor(Math.random() * 1000000);
        const id = `gvar-${usedSeed}`;
        const cls = `gross-variant-${id}`;
        _grossVariantClass = cls;
        document.body.classList.add(cls);

        
        try {
            if (saveToStorage) {
                localStorage.setItem('28bugs_grossVariantSeed', String(usedSeed));
                localStorage.setItem('28bugs_grossVariantAppliedAt', String(Date.now()));
            }
        } catch (e) {}

        
        function createSeededRng(s) {
            let _s = s >>> 0;
            return function() {
                _s = (_s * 1664525 + 1013904223) >>> 0;
                return _s / 0x100000000;
            };
        }
        const rng = createSeededRng(usedSeed);
        const pick = (arr) => arr[Math.floor(rng() * arr.length)];

        
        const bgOptions = [
            `repeating-linear-gradient(45deg, #ff0088 0 20px, #ffee00 20px 40px, #00ffee 40px 60px)`,
            `radial-gradient(circle at 20% 30%, #ffb3c6 0 10%, transparent 10%), radial-gradient(circle at 80% 70%, #b3ffef 0 8%, transparent 8%), linear-gradient(90deg,#ff00c8,#ffff00)`,
            `linear-gradient(120deg, #6600ff, #ff0066)`,
            `conic-gradient(from 90deg at 50% 50%, #ff00c8, #00ffea, #fff700, #ff00c8)`,
            `repeating-radial-gradient(circle at 50% 50%, #fffb00 0 8px, #ff00c8 8px 16px)`,
            `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23ff00c8"/><circle cx="100" cy="100" r="40" fill="%2300ffea"/></svg>') center/contain repeat`,
            `linear-gradient(90deg,#000000,#ffcc00)`
        ];

        const fontOptions = [
            `"Balsamiq Sans", "Patrick Hand", "Architects Daughter", cursive, fantasy`,
            `"Courier New", monospace`,
            `"Times New Roman", serif`,
            `Impact, "Franklin Gothic Medium", "Arial Black", sans-serif`,
            `"Comic Sans MS", "Papyrus", cursive`,
            `"Lucida Console", Monaco, monospace`,
            `"Verdana", Geneva, sans-serif`
        ];

        const clipOptions = [
            `circle(50% at 50% 50%)`,
            `ellipse(60% 40% at 50% 50%)`,
            `polygon(50% 0%, 0% 100%, 100% 100%)`, 
            `polygon(50% 0%, 65% 25%, 100% 30%, 80% 50%, 90% 80%, 50% 65%, 10% 80%, 20% 50%, 0% 30%, 35% 25%)`, 
            `inset(10% 5% 10% 5% round 10% 50% 10% 50%)`,
            `polygon(0% 0%, 100% 0%, 100% 70%, 0% 100%)`
        ];

        const filterOptions = [
            `none`,
            `blur(0px) saturate(1.2) hue-rotate(0deg) contrast(1.2)`,
            `blur(1.5px) saturate(2) hue-rotate(90deg) contrast(1.5)`,
            `grayscale(1) contrast(1.1) brightness(0.9)`,
            `sepia(0.8) saturate(1.5) hue-rotate(-30deg)`,
            `contrast(2) saturate(2) blur(0.8px)`
        ];

        const sizeOptions = [
            {w: 40, h: 40},
            {w: 75, h: 75},
            {w: 140, h: 60},
            {w: 60, h: 140},
            {w: 110, h: 40},
            {w: 200, h: 30},
            {w: 30, h: 200}
        ];

        const borderOptions = [
            `5px dashed #ff00c8`,
            `6px double #00ffea`,
            `4px solid #fff700`,
            `8px groove #6600ff`,
            `3px dotted #00aa77`,
            `10px outset #000000`
        ];

        const mixBlend = ["normal","multiply","screen","difference","overlay","darken","lighten"];

        const textShadowOptions = [
            `2px 2px 0 #00ffea`,
            `4px 4px 0 #ff00c8`,
            `1px 1px 0 #000`,
            `0 0 10px #ff00c8`
        ];

        const letterSpacingOptions = ["0px","2px","6px","12px","-1px"];

        const fontSizeOptions = ["0.7em","1em","1.2em","1.6em","2.4em","3em","4em"];

        const cursorOptions = ["default","crosshair","help","cell","pointer","progress"];

        const imageRenderingOptions = ["auto","crisp-edges","pixelated"];

        const zIndexOptions = ["1","10","100","9999","2147483647"];

        
        const bg = pick(bgOptions);
        const font = pick(fontOptions);
        const clip = pick(clipOptions);
        const filt = pick(filterOptions);
        const size = pick(sizeOptions);
        const border = pick(borderOptions);
        const blend = pick(mixBlend);
        const textShadow = pick(textShadowOptions);
        const letterSpacing = pick(letterSpacingOptions);
        const fontSize = pick(fontSizeOptions);
        const cursor = pick(cursorOptions);
        const imageRendering = pick(imageRenderingOptions);
        const zIndex = pick(zIndexOptions);

        const noBlur = (rng() < 0.25);
        const bugOpacity = Math.max(0.35, (0.6 + rng() * 0.4)).toFixed(2); 

        
        const css = `
            body.gross-mode.${cls} {
                background: ${bg} !important;
                color: #000000 !important;
                font-family: ${font} !important;
                filter: ${noBlur ? 'none' : filt} !important;
                transition: none !important;
            }

            body.gross-mode.${cls} .button-tray, body.gross-mode.${cls} .button-group {
                background: ${pick(bgOptions)} !important;
                border-color: #000 !important;
            }

            

            body.gross-mode.${cls} .bug {
                clip-path: ${clip} !important;
                width: ${size.w}px !important;
                height: ${size.h}px !important;
                filter: ${noBlur ? 'none' : filt} !important;
                opacity: ${bugOpacity} !important;
                border: ${border} !important;
                mix-blend-mode: ${blend} !important;
                object-fit: cover !important;
                transition: none !important;
                image-rendering: ${imageRendering} !important;
            }

            

            @keyframes gross-filter-${id} {
                0% { filter: ${noBlur ? 'none' : filt}; opacity: ${bugOpacity}; }
                50% { filter: hue-rotate(${Math.floor(Math.random()*120-60)}deg) saturate(2) blur(${noBlur?0:1}px); opacity: ${Math.max(0.4, bugOpacity - 0.1)}; }
                100% { filter: ${noBlur ? 'none' : filt}; opacity: ${bugOpacity}; }
            }

            body.gross-mode.${cls} .bug {
                animation: gross-filter-${id} ${2 + Math.random()*3}s infinite ease-in-out;
            }

            

            body.gross-mode.${cls} .gross-popup,
            body.gross-mode.${cls} .modal,
            body.gross-mode.${cls} .feedback-form,
            body.gross-mode.${cls} .game-notification {
                background: ${pick(bgOptions)} !important;
                color: ${pick(['#000','#fff','#ff00c8','#00ffea'])} !important;
                border: 6px solid ${pick(['#ff00c8','#00ffea','#fff700','#6600ff'])} !important;
                box-shadow: none !important;
                font-family: ${pick(fontOptions)} !important;
                letter-spacing: ${letterSpacing} !important;
                text-shadow: ${textShadow} !important;
            }

            body.gross-mode.${cls} header {
                background: ${pick(bgOptions)} !important;
                color: ${pick(['#000','#fff','#ff00c8'])} !important;
                border-bottom: 8px dashed ${pick(['#ff00c8','#00ffea','#fff700'])} !important;
            }

            body.gross-mode.${cls} button, body.gross-mode.${cls} .button-tray button, body.gross-mode.${cls} a.nav-btn {
                background: ${pick(bgOptions)} !important;
                color: ${pick(['#000','#fff','#ff00c8','#00ffea'])} !important;
                border: 4px double ${pick(['#00ffea','#ff00c8','#fff700'])} !important;
                font-family: ${pick(fontOptions)} !important;
                text-transform: uppercase !important;
                animation: gross-blink-${id} ${1 + Math.random()*2}s infinite steps(2,end);
                letter-spacing: ${letterSpacing} !important;
                font-size: ${fontSize} !important;
                cursor: ${cursor} !important;
            }

            @keyframes gross-blink-${id} {
                0% { opacity: 1; }
                50% { opacity: 0.4; }
                100% { opacity: 1; }
            }

            body.gross-mode.${cls} a {
                text-decoration: underline wavy ${pick(['#ff00c8','#00ffea','#fff700'])} !important;
                color: ${pick(['#ff00c8','#00ffea','#fff700','#000'])} !important;
                font-weight: 900 !important;
                text-shadow: ${textShadow} !important;
            }

            body.gross-mode.${cls} input, body.gross-mode.${cls} textarea, body.gross-mode.${cls} select {
                background: ${pick(['#fff700','#ff00c8','#00ffea'])} !important;
                color: ${pick(['#000','#fff'])} !important;
                border: 5px dashed ${pick(['#000','#ff00c8','#00ffea'])} !important;
                font-family: ${pick(fontOptions)} !important;
                letter-spacing: ${letterSpacing} !important;
                font-size: ${fontSize} !important;
            }
            
            

            body.gross-mode.${cls} .gross-popup { z-index: ${zIndex} !important; }
            body.gross-mode.${cls} .feedback-form { z-index: ${zIndex} !important; }
            body.gross-mode.${cls} header { z-index: ${parseInt(zIndex)+10} !important; }
        `;

    const el = document.createElement('style');
    el.id = 'gross-variant-style';
    el.type = 'text/css';
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
    _grossVariantStyleEl = el;

    _grossVariantInlineRecords[cls] = [];


        const inlineTargets = [
            'header', '.brand', '.site-branding', '.button-group', '.button-tray button', 'a', 'p', 'h1', 'h2', 'h3', '.gross-popup', '.feedback-form'
        ];

        inlineTargets.forEach(sel => {
            const nodes = Array.from(document.querySelectorAll(sel));
            nodes.forEach(node => {
                if (rng() > 0.28) return; 
                try {
                    const recs = _grossVariantInlineRecords[cls];
                    
                    const already = recs.find(r => r.node === node);
                    if (!already) {
                        const prevStyle = node.getAttribute && node.getAttribute('style');
                        recs.push({ node: node, prevStyle: prevStyle });
                    }

                    const applyImportant = (n, prop, val) => {
                        try { n.style.setProperty(prop, val, 'important'); } catch (e) {}
                    };

                    
                    applyImportant(node, 'font-family', pick(fontOptions));
                    applyImportant(node, 'color', pick(['#000','#fff','#ff00c8','#00ffea']));
                    applyImportant(node, 'background', pick(bgOptions));
                    applyImportant(node, 'border', pick(borderOptions));
                    applyImportant(node, 'letter-spacing', pick(letterSpacingOptions));
                    applyImportant(node, 'text-shadow', pick(textShadowOptions));
                    
                    if (!node.classList.contains('bug')) {
                        if (rng() < 0.35) {
                            applyImportant(node, 'transform', `rotate(${Math.floor(rng()*40-20)}deg) skew(${Math.floor(rng()*20-10)}deg)`);
                            applyImportant(node, 'display', 'inline-block');
                        }
                    }
                    if (rng() < 0.2) {
                        applyImportant(node, 'font-size', pick(fontSizeOptions));
                        applyImportant(node, 'cursor', pick(cursorOptions));
                    }
                } catch (e) {}
            });
        });

        
        try {
            const autoSec = parseInt(localStorage.getItem('28bugs_grossAutoRevertSeconds') || '0', 10);
            if (!isNaN(autoSec) && autoSec > 0) {
                if (_grossAutoRevertTimer) clearTimeout(_grossAutoRevertTimer);
                _grossAutoRevertTimer = setTimeout(() => {
                    document.body.classList.remove('gross-mode');
                    removeGrossVariant();
                    stopGrossPopups();
                    removeAllGrossPopups();
                    disableGrossClickSounds();
                    const btn = document.getElementById('gross-mode-btn');
                    if (btn) btn.textContent = 'True Form';
                }, autoSec * 1000);
            }
        } catch (e) {}
    }

    

    const grossSounds = [
        "src/sounds/Alarmed Chicken.wav",
        "src/sounds/cavalry.mp3",
        "src/sounds/Angry Cat.wav",
        "src/sounds/Angry Donkey.wav",
        "src/sounds/Caw.wav",
        "src/sounds/Chicken 1.wav",
        "src/sounds/Chicken 2.wav",
        "src/sounds/Chicken 3.wav",
        "src/sounds/Chopping Wood.wav",
        "src/sounds/Coconuts.wav",
        "src/sounds/Crow 1.wav",
        "src/sounds/Crow 2.wav",
        "src/sounds/Crow 3.wav",
        "src/sounds/Crunchy bite.wav",
        "src/sounds/Donkey.wav",
        "src/sounds/Door Slam.wav",
        "src/sounds/Eagle.wav",
        "src/sounds/EEnE Baby Gasp 1.wav",
        "src/sounds/EEnE Bell Ring 1.wav",
        "src/sounds/EEnE Bell Ring 3.wav",
        "src/sounds/EEnE Bongo Run 2 lower.wav",
        "src/sounds/EEnE Computer - Button Press 2.wav",
        "src/sounds/EEnE Cougar Snarl.wav",
        "src/sounds/EEnE Elephant 3.wav",
        "src/sounds/EEnE Fart 3.wav",
        "src/sounds/EEnE Fart 7.wav",
        "src/sounds/EEnE Gun - Cock 1.wav",
        "src/sounds/EEnE Honk 1.wav",
        "src/sounds/EEnE Impact 1.wav",
        "src/sounds/EEnE Impact 2.wav",
        "src/sounds/EEnE Impact 11.wav",
        "src/sounds/EEnE Impact 15 Metal.wav",
        "src/sounds/EEnE Kiss.wav",
        "src/sounds/EEnE Knuckle Crack 2.wav",
        "src/sounds/EEnE Monkey - Scream.wav",
        "src/sounds/EEnE Monkey - Shriek.wav",
        "src/sounds/EEnE Pop Up 1.wav",
        "src/sounds/EEnE Rooster 1.wav",
        "src/sounds/EEnE Rustle 1.wav",
        "src/sounds/EEnE Shear.wav",
        "src/sounds/EEnE Spit Out and Hit.wav",
        "src/sounds/EEnE Sword 1.wav",
        "src/sounds/EEnE Telephone Hang Up.wav",
        "src/sounds/EEnE Twang 2.wav",
        "src/sounds/EEnE Twinkle Toes 1.wav",
        "src/sounds/EEnE Walking - Shoe Squeaking.wav",
        "src/sounds/EEnE Waving Straw FX 2 long.wav",
        "src/sounds/EEnE Whoosh 2.wav",
        "src/sounds/Gargling.wav",
        "src/sounds/Good Looking Lady.wav",
        "src/sounds/Hello.wav",
        "src/sounds/Impact that lands you in hospital.wav",
        "src/sounds/Impact.wav",
        "src/sounds/Japanese Sneeze.wav",
        "src/sounds/Looking both ways.wav",
        "src/sounds/Lumber.wav",
        "src/sounds/Measuring Tape.wav",
        "src/sounds/Monkey Scream.wav",
        "src/sounds/Owl.wav",
        "src/sounds/Phone Ringing.wav",
        "src/sounds/Phone Slam.wav",
        "src/sounds/Pig Squeal.wav",
        "src/sounds/Popped Bottle.wav",
        "src/sounds/Quick Dash.wav",
        "src/sounds/Rawr.wav",
        "src/sounds/Reverb Door SLam.wav",
        "src/sounds/Runaway Vehicle .wav",
        "src/sounds/Rusty Spring.wav",
        "src/sounds/Screech.wav",
        "src/sounds/SKRRT.wav",
        "src/sounds/Slam.wav",
        "src/sounds/Slap.wav",
        "src/sounds/Slide Whistle Up.wav",
        "src/sounds/Smack.wav",
        "src/sounds/Spring.wav",
        "src/sounds/Startled Monkey.wav",
        "src/sounds/Stuffed Animal.wav",
        "src/sounds/Sturdy Squeaks.wav",
        "src/sounds/Subawula.wav",
        "src/sounds/Turned Off.wav",
        "src/sounds/Twiddling Fingers aka Bird Chirp.wav",
        "src/sounds/Typewriter.wav",
        "src/sounds/Wet shoes.wav",
        "src/sounds/WRONG.wav"
    ];

    function playRandomGrossSound() {
        if (!document.body.classList.contains('gross-mode')) return;
        if (grossSounds.length === 0) return;
        const sound = grossSounds[Math.floor(Math.random() * grossSounds.length)];
        const audio = new Audio(sound);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }

    let grossClickListener = null;

    function enableGrossClickSounds() {
        if (grossClickListener) return;
        grossClickListener = function(e) {
            if (e.button === 2) return;
            playRandomGrossSound();
        };
        document.addEventListener('mousedown', grossClickListener, true);
        document.addEventListener('touchstart', grossClickListener, true);
    }

    function disableGrossClickSounds() {
        if (!grossClickListener) return;
        document.removeEventListener('mousedown', grossClickListener, true);
        document.removeEventListener('touchstart', grossClickListener, true);
        grossClickListener = null;
    }

    requestAnimationFrame(updatePositions);
    window.updateHornAttachment = updateHornAttachment;
    window.BugSim={burst:function(){for(let i=0;i<bugData.length;i++){const b=bugData[i];b.dx=(Math.random()-0.5)*25;b.dy=(Math.random()-0.5)*25;}},invert:function(){for(let i=0;i<bugData.length;i++){const b=bugData[i];b.dy=-b.dy;b.dx=-b.dx*0.5;}},slow:function(){settings.maxSpeed=Math.max(1,settings.maxSpeed*0.5);},boost:function(){settings.maxSpeed=settings.maxSpeed*1.5;},scatter:function(){for(let i=0;i<bugData.length;i++){const b=bugData[i];b.x=Math.random()*cachedPlayW;b.y=Math.random()*cachedPlayH;b.element.style.transform=`translate3d(${b.x}px,${b.y}px,0)`;}},gravityToggle:function(){gravityEnabled=!gravityEnabled;},getBugData:function(){return bugData;},killBug:function(index, cause){if(index<0||index>=bugData.length)return;var entry=bugData[index];var bug=entry.element;var memorials=[];try{memorials=JSON.parse(localStorage.getItem('28bugs_memorialData'))||[];}catch(_){}memorials.push({name:bug.dataset.bugName,story:bug.dataset.bugStory,birthday:bug.dataset.bugBirthday,deathDate:BugData.generateDeathDate(),causeOfDeath:(typeof BugData!=='undefined'&&BugData.getRandomDeathMessage)?BugData.getRandomDeathMessage():'Natural causes'});localStorage.setItem('28bugs_memorialData',JSON.stringify(memorials));removeEvilHorns(entry);try{removeHat(entry);}catch(_){}bug.remove();bugData.splice(index,1);updateBugCounter();},silentClearBugs:function(targetCount){for(var i=bugData.length-1;i>=targetCount;i--){var entry=bugData[i];removeEvilHorns(entry);try{removeHat(entry);}catch(_){}entry.element.remove();bugData.splice(i,1);}updateBugCounter();},_getAnimationRunning:function(){return animationRunning;},_setAnimationRunning:function(v){animationRunning=v;},_requestUpdate:function(){if(animationRunning)requestAnimationFrame(updatePositions);},spawnBug:function(){createBugInternal();},setThrowCap:function(v){throwCapOverride=v;},clearThrowCap:function(){throwCapOverride=null;},recomputePlayfieldLayout:recomputePlayfieldLayout,getDraggingBug:function(){return draggingBug;}};

    
    var meteorBtn = document.getElementById('meteor-test-btn');
    if (meteorBtn) {
        meteorBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.MeteorShower) window.MeteorShower.start();
        });
    }

    
    var googlyBtn = document.getElementById('googly-eyes-btn');
    if (googlyBtn) {
        googlyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.GooglyEyes) {
                var on = window.GooglyEyes.toggle();
                googlyBtn.textContent = on ? 'Googly Eyes Off' : 'Googly Eyes';
            }
        });
    }

    
    var walkBtn = document.getElementById('walk-mode-btn');
    if (walkBtn) {
        walkBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.WalkMode) {
                var on = window.WalkMode.toggle();
                walkBtn.textContent = on ? 'Walk Mode Off' : 'Walk Mode';
            }
        });
    }

    
    var oceanBtn = document.getElementById('ocean-btn');
    if (oceanBtn) {
        oceanBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!window.WalkMode) return;
            var on = window.WalkMode.toggleOcean();
            oceanBtn.textContent = on ? 'Drain' : 'Ocean';
        });
    }

    
    var alienBtn = document.getElementById('alien-invasion-btn');
    if (alienBtn) {
        alienBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!window.WalkMode) return;
            window.WalkMode.startAlienInvasion();
        });
    }

    
    var deathBtn = document.getElementById('horseman-death-btn');
    if (deathBtn) {
        deathBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.Horsemen && window.Horsemen.death) window.Horsemen.death();
        });
    }
    var warBtn = document.getElementById('horseman-war-btn');
    if (warBtn) {
        warBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.Horsemen && window.Horsemen.war) window.Horsemen.war();
        });
    }
    var famineBtn = document.getElementById('horseman-famine-btn');
    if (famineBtn) {
        famineBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.Horsemen && window.Horsemen.famine) window.Horsemen.famine();
        });
    }
    var pestBtn = document.getElementById('horseman-pestilence-btn');
    if (pestBtn) {
        pestBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.Horsemen && window.Horsemen.pestilence) window.Horsemen.pestilence();
        });
    }
    var wickedBtn = document.getElementById('something-wicked-btn');
    if (wickedBtn) {
        wickedBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.Horsemen && window.Horsemen.wicked) window.Horsemen.wicked();
        });
    }
    var panopBtn = document.getElementById('panopticon-btn');
    if (panopBtn) {
        panopBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.PanopticonBoss && window.PanopticonBoss.start) window.PanopticonBoss.start();
        });
    }
    var sisyphusBtn = document.getElementById('sisyphus-btn');
    if (sisyphusBtn) {
        sisyphusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.SisyphusBoss && window.SisyphusBoss.start) window.SisyphusBoss.start();
        });
    }
});
