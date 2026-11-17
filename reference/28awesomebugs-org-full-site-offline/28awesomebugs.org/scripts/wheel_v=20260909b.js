


const AwesomeWheel = (() => {
    'use strict';

    const STORAGE_BREAK  = '28bugs_wheelBreak';
    const STORAGE_ROLLS  = '28bugs_wheelRolls';
    const STORAGE_SESSION = '28bugs_wheelSession';
    const STORAGE_WHEEL_FIX = '28bugs_wheelFixTokens';
    const RARE_GOOD_CHANCE = 0.06;
    const OUTCOME_DELAY_MS = 1500;
    const SESSION_STALE_MS = 30 * 60 * 1000;

    const IMMERSIVE_OUTCOMES = new Set([
        'alien', 'ocean', 'walk_mode', 'meteor', 'googly', 'time_warp',
        'death', 'war', 'famine', 'pestilence', 'wicked', 'pipe_bomb'
    ]);

    
    const OPTION_POOL = [
        { id:'lose_all',   label:'Lose all money',   color:'#B71C1C', desc:'Lose all coins',        bad:true },
        { id:'lose_50',    label:'Lose 50% money',   color:'#D32F2F', desc:'Lose half your coins',  bad:true },
        { id:'lose_25',    label:'Lose 25% money',   color:'#E53935', desc:'Lose 25% of coins',     bad:true },
        { id:'lose_1',     label:'-$1',             color:'#C62828', desc:'Lose 1 coin',           bad:true },
        { id:'lose_100',   label:'-$100',           color:'#D32F2F', desc:'Lose 100 coins',        bad:true },
        { id:'lose_1000',  label:'-$1,000',         color:'#E53935', desc:'Lose 1,000 coins',      bad:true },
        { id:'lose_500',   label:'-$500',           color:'#EF5350', desc:'Lose 500 coins',        bad:true },
        { id:'lose_5000',  label:'-$5,000',         color:'#FF5252', desc:'Lose 5,000 coins',      bad:true },
        { id:'lose_50000', label:'-$50K',           color:'#FF1744', desc:'Lose 50,000 coins',     bad:true },
        { id:'lose_500000',label:'-$500K',          color:'#D50000', desc:'Lose 500,000 coins',    bad:true },
        { id:'win_1',      label:'+$1',             color:'#1B5E20', desc:'Win 1 coin' },
        { id:'win_100',    label:'+$100',           color:'#2E7D32', desc:'Win 100 coins' },
        { id:'win_1000',   label:'+$1,000',         color:'#388E3C', desc:'Win 1,000 coins' },
        { id:'win_500',    label:'+$500',           color:'#2E7D32', desc:'Win 500 coins' },
        { id:'win_5000',   label:'+$5,000',         color:'#388E3C', desc:'Win 5,000 coins' },
        { id:'win_50000',  label:'+$50K',           color:'#43A047', desc:'Win 50,000 coins' },
        { id:'win_500000', label:'+$500K',          color:'#4CAF50', desc:'Win 500,000 coins' },
        { id:'lucky_tag',  label:'Lucky tag',       color:'#F9A825', desc:'Gain the Lucky tag' },
        { id:'wheel_fix',  label:'Wheel Fix',       color:'#D84315', desc:'Stored wheel repair token earned' },
        { id:'terminal_override', label:'Override', color:'#6A1B9A', desc:'All encryption key fragments obtained', rare:true },
        { id:'alien',      label:'Alien invasion',  color:'#7B1FA2', desc:'I crush the alien' },
        { id:'ocean',      label:'Flood',           color:'#0288D1', desc:'A pipe burst sorry' },
        { id:'walk_mode',  label:'Bugtopia',        color:'#00897B', desc:'Get it its like miitopia' },
        { id:'meteor',     label:'Meteor shower',   color:'#EF6C00', desc:'Meteor shower' },
        { id:'googly',     label:'Goog eye',        color:'#C2185B', desc:'Googly eyes yay' },
        { id:'time_warp',  label:'Click',           color:'#303F9F', desc:'Click by Adam Sandler' },
        { id:'pipe_bomb',  label:'A gift :)',       color:'#37474F', desc:'A gift from 29',       bad:true },
        { id:'death',      label:'DEATH',           color:'#1a1a1a', desc:'Swift and indiscriminate Death',  bad:true },
        { id:'famine',     label:'FAMINE',          color:'#3e2723', desc:'Curse of Famine', bad:true },
        { id:'pestilence', label:'PESTILENCE',      color:'#556b2f', desc:'Plague of Locusts', bad:true },
        { id:'war',        label:'WAR',             color:'#ce4343', desc:'War without end', bad:true },
        { id:'wicked',     label:'Something Wicked',color:'#2c0033', desc:'Something wicked this way comes', bad:true },
        { id:'key_alpha',  label:'Key Fragment α',  color:'#8B0000', desc:'Encryption key fragment α obtained' },
        { id:'key_beta',   label:'Key Fragment β',  color:'#8B0000', desc:'Encryption key fragment β obtained' },
        { id:'key_gamma',  label:'Key Fragment γ',  color:'#8B0000', desc:'Encryption key fragment γ obtained' }
    ];

    function addWinCoins(amount) {
        if (typeof GameCoins !== 'undefined') GameCoins.addCoins(amount);
    }

    function loseFixedCoins(amount) {
        if (typeof GameCoins === 'undefined') return;
        const current = GameCoins.getCoins();
        const loss = Math.min(Math.max(0, Math.floor(amount)), current);
        if (loss > 0) GameCoins.spendCoins(loss);
    }

    function getWheelFixTokens() {
        try {
            const n = parseInt(localStorage.getItem(STORAGE_WHEEL_FIX) || '0', 10);
            return Number.isFinite(n) && n > 0 ? n : 0;
        } catch (e) { return 0; }
    }

    function setWheelFixTokens(count) {
        const n = Math.max(0, Math.floor(count));
        try { localStorage.setItem(STORAGE_WHEEL_FIX, String(n)); } catch (e) {}
        if (typeof AccountSync !== 'undefined' && AccountSync.touchLocalSave) {
            AccountSync.touchLocalSave();
        }
        updateWheelFixButton();
    }

    function addWheelFixToken(delta) {
        setWheelFixTokens(getWheelFixTokens() + Math.max(0, Math.floor(delta)));
        try {
            if (typeof AccountSync !== 'undefined' && AccountSync.isLoggedIn && AccountSync.isLoggedIn()) {
                AccountSync.saveProgress().catch(function () {});
            }
        } catch (e) {}
    }

    
    const OUTCOMES = {
        lose_all()   { if (typeof GameCoins !== 'undefined') GameCoins.setCoins(0); },
        lose_50()    { if (typeof GameCoins !== 'undefined') GameCoins.spendCoins(GameCoins.getCoinsBig ? GameCoins.getCoinsBig() / 2n : Math.floor(GameCoins.getCoins() * 0.5)); },
        lose_25()    { if (typeof GameCoins !== 'undefined') GameCoins.spendCoins(GameCoins.getCoinsBig ? GameCoins.getCoinsBig() / 4n : Math.floor(GameCoins.getCoins() * 0.25)); },
        lose_1()     { loseFixedCoins(1); },
        lose_100()   { loseFixedCoins(100); },
        lose_1000()  { loseFixedCoins(1000); },
        lose_500()   { loseFixedCoins(500); },
        lose_5000()  { loseFixedCoins(5000); },
        lose_50000() { loseFixedCoins(50000); },
        lose_500000(){ loseFixedCoins(500000); },
        win_1()      { addWinCoins(1); },
        win_100()    { addWinCoins(100); },
        win_1000()   { addWinCoins(1000); },
        win_500()    { addWinCoins(500); },
        win_5000()   { addWinCoins(5000); },
        win_50000()  { addWinCoins(50000); },
        win_500000() { addWinCoins(500000); },
        lucky_tag()  {
            try {
                var count = parseInt(localStorage.getItem('28bugs_luckyTagCount') || '0', 10);
                count++;
                localStorage.setItem('28bugs_luckyTagCount', count.toString());
                localStorage.setItem('28bugs_luckyTag', Date.now().toString());
            } catch(e){}
            try {
                if (typeof AccountSync !== 'undefined' && AccountSync.isLoggedIn && AccountSync.isLoggedIn()) {
                    AccountSync.saveProgress().then(function(result) {
                        if (result && result.success && result.tags && AccountSync.getUser()) {
                            AccountSync.getUser().tags = result.tags;
                        }
                    }).catch(function(){});
                }
            } catch(e){}
        },
        alien()      { if (window.WalkMode && window.WalkMode.startAlienInvasion) window.WalkMode.startAlienInvasion(); },
        ocean()      { if (window.WalkMode && window.WalkMode.toggleOcean) window.WalkMode.toggleOcean(); },
        walk_mode()  { if (window.WalkMode && window.WalkMode.enable) window.WalkMode.enable(); },
        meteor()     { if (window.MeteorShower && window.MeteorShower.start) window.MeteorShower.start(); },
        googly()     { if (window.GooglyEyes && window.GooglyEyes.toggle) window.GooglyEyes.toggle(); },
        time_warp()  { if (window.TimeWarp && window.TimeWarp.start) window.TimeWarp.start(); },
        death()      { if (window.Horsemen && window.Horsemen.death) window.Horsemen.death(); },
        war()        { if (window.Horsemen && window.Horsemen.war) window.Horsemen.war(); },
        famine()     { if (window.Horsemen && window.Horsemen.famine) window.Horsemen.famine(); },
        pestilence() { if (window.Horsemen && window.Horsemen.pestilence) window.Horsemen.pestilence(); },
        wicked()     { if (window.Horsemen && window.Horsemen.wicked) window.Horsemen.wicked(); },
        pipe_bomb()  {
            if (window.BombDefusal && window.BombDefusal.startRandom) {
                window.BombDefusal.startRandom(3, 60);
            }
        },
        key_alpha()  { if (window.PanopTerminal) window.PanopTerminal.grantKey('alpha'); },
        key_beta()   { if (window.PanopTerminal) window.PanopTerminal.grantKey('beta'); },
        key_gamma()  { if (window.PanopTerminal) window.PanopTerminal.grantKey('gamma'); },
        terminal_override() {
            if (window.PanopTerminal && window.PanopTerminal.grantAllKeys) {
                window.PanopTerminal.grantAllKeys();
            }
        },
        wheel_fix() { addWheelFixToken(1); }
    };

    
    const NUM_SLICES = 6;
    const TWO_PI  = Math.PI * 2;
    const HALF_PI = Math.PI * 0.5;
    const LOCK_SPEED = 7.5;
    const STOP_SPEED = 0.2;
    const REPAIR_MS  = 30 * 1000;
    const GOOD_BAD_RATIOS = [[4,2],[3,3],[2,4],[1,5],[0,6]];

    
    let activeSlices = [];
    let rollCount    = 0;
    let wheelBroken  = false;
    let breakAnim    = null;
    let breakStartTime = null;

    let viewW, viewH, ppm, physW, physH, physCX, timeStep;
    let canvasEl, ctx;
    let statusEl, resultEl, spinBtnEl, fixBtnEl;
    let world, wheel, arrow, mouseBody, mouseConstraint;
    let locked = false;
    let stopTimer = 0;
    let particles = [];
    let _rafId = null;
    let _initialized = false;
    let _closeModal = null;
    let _outcomeTimer = null;
    let pendingWinner = null;
    let pendingSince = 0;
    let lastImmersiveEffectDesc = '';
    let effectIndicatorEl = null;
    let _sessionSaveTimer = null;

    
    function getOptionById(id) {
        return OPTION_POOL.find(o => o.id === id) || null;
    }

    function slicesToIds(slices) {
        return slices.map(s => s.id);
    }

    function idsToSlices(ids) {
        if (!Array.isArray(ids) || ids.length !== NUM_SLICES) return null;
        const out = [];
        for (let i = 0; i < ids.length; i++) {
            const opt = getOptionById(ids[i]);
            if (!opt) return null;
            out.push(opt);
        }
        return out;
    }

    function isImmersiveOutcome(id) {
        return IMMERSIVE_OUTCOMES.has(id);
    }

    function clearWheelSession() {
        try { localStorage.removeItem(STORAGE_SESSION); } catch (e) {}
    }

    function saveWheelSession(extra) {
        if (wheelBroken) {
            clearWheelSession();
            return;
        }
        const data = {
            sliceIds: slicesToIds(activeSlices),
            rollCount: rollCount,
            locked: locked,
            stopTimer: stopTimer,
            wheelAngle: wheel && wheel.body ? wheel.body.angle : 0,
            wheelAngularVelocity: wheel && wheel.body ? wheel.body.angularVelocity : 0,
            arrowAngle: arrow && arrow.body ? arrow.body.angle : 0,
            arrowAngularVelocity: arrow && arrow.body ? arrow.body.angularVelocity : 0,
            pendingWinnerId: pendingWinner ? pendingWinner.id : null,
            pendingSince: pendingSince || null,
            outcomeApplied: false,
            savedAt: Date.now()
        };
        if (extra) {
            Object.keys(extra).forEach(function (key) { data[key] = extra[key]; });
        }
        try { localStorage.setItem(STORAGE_SESSION, JSON.stringify(data)); } catch (e) {}
    }

    function loadWheelSession() {
        try {
            const raw = localStorage.getItem(STORAGE_SESSION);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || !Array.isArray(data.sliceIds)) return null;
            const age = Date.now() - (data.savedAt || 0);
            if (age > SESSION_STALE_MS) {
                if (data.pendingWinnerId && !data.outcomeApplied) return data;
                clearWheelSession();
                return null;
            }
            return data;
        } catch (e) { return null; }
    }

    function queueSessionSave() {
        if (_sessionSaveTimer) return;
        _sessionSaveTimer = setTimeout(function () {
            _sessionSaveTimer = null;
            saveWheelSession();
        }, 120);
    }

    function ensureEffectIndicator() {
        if (effectIndicatorEl) return effectIndicatorEl;
        effectIndicatorEl = document.getElementById('wheel-effect-indicator');
        return effectIndicatorEl;
    }

    function updateEffectIndicator() {
        const el = ensureEffectIndicator();
        const btn = document.getElementById('awesome-wheel-btn');
        const active = isTimedEffectActive();
        if (btn) btn.classList.toggle('wheel-effect-active', active);
        if (!el) return;
        if (active) {
            el.hidden = false;
            el.textContent = lastImmersiveEffectDesc
                ? 'Wheel effect: ' + lastImmersiveEffectDesc
                : 'Wheel effect active on the playfield';
        } else {
            el.hidden = true;
            el.textContent = '';
            lastImmersiveEffectDesc = '';
        }
    }

    function applyPendingOutcome() {
        if (!pendingWinner) return;
        const winner = pendingWinner;
        saveWheelSession({ pendingWinnerId: winner.id, outcomeApplied: true, pendingSince: pendingSince });

        if (OUTCOMES[winner.id]) OUTCOMES[winner.id]();
        if (typeof GameCoins !== 'undefined' && GameCoins.updateCoinDisplay) GameCoins.updateCoinDisplay();

        pendingWinner = null;
        pendingSince = 0;
        randomizeSlices();
        clearWheelSession();

        if (isImmersiveOutcome(winner.id)) {
            lastImmersiveEffectDesc = winner.desc;
            if (_closeModal) _closeModal();
            updateEffectIndicator();
        } else {
            if (statusEl) statusEl.textContent = 'Spin again when ready!';
            if (resultEl) resultEl.textContent = winner.desc;
        }
        updateSpinButtonState();
    }

    function schedulePendingOutcome(winner) {
        if (_outcomeTimer) {
            clearTimeout(_outcomeTimer);
            _outcomeTimer = null;
        }
        pendingWinner = winner;
        pendingSince = Date.now();
        saveWheelSession({
            pendingWinnerId: winner.id,
            outcomeApplied: false,
            pendingSince: pendingSince
        });
        if (resultEl) resultEl.textContent = winner.desc;
        _outcomeTimer = setTimeout(function () {
            _outcomeTimer = null;
            applyPendingOutcome();
        }, OUTCOME_DELAY_MS);
    }

    function restorePendingOutcomeFromSession(session) {
        const winner = getOptionById(session.pendingWinnerId);
        if (!winner) {
            clearWheelSession();
            return false;
        }
        pendingWinner = winner;
        pendingSince = session.pendingSince || session.savedAt || Date.now();
        locked = false;
        stopTimer = 0;
        if (canvasEl) canvasEl.classList.remove('spinning');
        if (resultEl) resultEl.textContent = winner.desc;
        const elapsed = Date.now() - pendingSince;
        const delay = Math.max(0, OUTCOME_DELAY_MS - elapsed);
        if (_outcomeTimer) clearTimeout(_outcomeTimer);
        _outcomeTimer = setTimeout(function () {
            _outcomeTimer = null;
            applyPendingOutcome();
        }, delay);
        return true;
    }

    function restoreSpinFromSession(session) {
        if (!wheel || !wheel.body || !arrow || !arrow.body) return false;
        locked = true;
        stopTimer = session.stopTimer || 0;
        wheel.body.angle = session.wheelAngle || 0;
        wheel.body.angularVelocity = session.wheelAngularVelocity || 0;
        arrow.body.angle = session.arrowAngle || 0;
        arrow.body.angularVelocity = session.arrowAngularVelocity || 0;
        if (canvasEl) canvasEl.classList.add('spinning');
        return true;
    }

    function restoreWheelSession() {
        const session = loadWheelSession();
        if (!session || wheelBroken) return false;

        const slices = idsToSlices(session.sliceIds);
        if (slices) activeSlices = slices;
        if (typeof session.rollCount === 'number') rollCount = session.rollCount;

        if (session.pendingWinnerId && !session.outcomeApplied) {
            return restorePendingOutcomeFromSession(session);
        }

        if (session.locked && Math.abs(session.wheelAngularVelocity || 0) > STOP_SPEED) {
            return restoreSpinFromSession(session);
        }

        clearWheelSession();
        return false;
    }

    function bindSessionPersistence() {
        function persistNow() { saveWheelSession(); }
        window.addEventListener('beforeunload', persistNow);
        window.addEventListener('pagehide', persistNow);
    }

    function sessionNeedsModal() {
        const session = loadWheelSession();
        if (!session || wheelBroken) return false;
        if (session.pendingWinnerId && !session.outcomeApplied) return true;
        return !!(session.locked && Math.abs(session.wheelAngularVelocity || 0) > STOP_SPEED);
    }

    
    function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    
    function randomizeSlices() {
        const ratioIdx = Math.min(rollCount, GOOD_BAD_RATIOS.length - 1);
        const [numGood, numBad] = GOOD_BAD_RATIOS[ratioIdx];

        const goodNormal = shuffleArray(OPTION_POOL.filter(o => !o.bad && !o.rare));
        const goodRare   = OPTION_POOL.filter(o => !o.bad && o.rare);
        const badPool    = shuffleArray(OPTION_POOL.filter(o =>  o.bad));

        let goodPicks = goodNormal.slice(0, numGood);
        while (goodPicks.length < numGood) {
            const remaining = shuffleArray(goodNormal.filter(o => !goodPicks.includes(o)));
            if (!remaining.length) break;
            goodPicks.push(remaining[0]);
        }

        if (goodRare.length && numGood > 0 && Math.random() < RARE_GOOD_CHANCE) {
            const rarePick = goodRare[Math.floor(Math.random() * goodRare.length)];
            const replaceIdx = Math.floor(Math.random() * goodPicks.length);
            goodPicks[replaceIdx] = rarePick;
        }

        let picked = goodPicks.concat(badPool.slice(0, numBad));
        
        while (picked.length < NUM_SLICES) {
            const remaining = shuffleArray(OPTION_POOL.filter(o => !picked.includes(o)));
            if (!remaining.length) break;
            picked.push(remaining[0]);
        }

        activeSlices = shuffleArray(picked);
        saveWheelSession();
    }

    function updateWheelFixButton() {
        if (!fixBtnEl) fixBtnEl = document.getElementById('wheel-fix-btn');
        if (!fixBtnEl) return;
        const tokens = getWheelFixTokens();
        const show = wheelBroken && tokens > 0;
        fixBtnEl.style.display = show ? 'inline-block' : 'none';
        fixBtnEl.textContent = 'Use Wheel Fix (' + tokens + ')';
        fixBtnEl.disabled = !show;
    }

    function useWheelFix() {
        if (!wheelBroken || getWheelFixTokens() < 1) return;
        setWheelFixTokens(getWheelFixTokens() - 1);
        repairWheel();
        if (typeof AccountSync !== 'undefined' && AccountSync.isLoggedIn && AccountSync.isLoggedIn()) {
            AccountSync.saveProgress().catch(function () {});
        }
    }

    
    function initPhysics() {
        world = new p2.World();
        world.solver.iterations = 100;
        world.solver.tolerance  = 0;

        const arrowMat = new p2.Material();
        const pinMat   = new p2.Material();
        world.addContactMaterial(new p2.ContactMaterial(arrowMat, pinMat, {
            friction: 0.0,
            restitution: 0.5
        }));

        const minDim = Math.min(viewW, viewH);
        const wheelRadiusPx = Math.min(8 * ppm, Math.max(90, minDim * 0.38));
        const topPaddingPx = Math.max(16, minDim * 0.06);
        const wR = wheelRadiusPx / ppm;
        const wX = physCX;
        const wY = physH - ((wheelRadiusPx + topPaddingPx) / ppm);
        const aX = wX,     aY = wY + wR + 0.625;
        const pinDist = Math.max(2.2, wR * 0.92);
        const pinRadius = Math.max(0.12, Math.min(0.22, wR * 0.04));
        const pinCount = (wR < 5) ? 18 : 24;

        wheel = new Wheel(wX, wY, wR, NUM_SLICES, pinCount, pinRadius, pinDist, pinMat);
        arrow = new Arrow(aX, aY, 0.5, 1.5, arrowMat);

        mouseBody = new p2.Body();
        world.addBody(mouseBody);
    }

    
    function getPhysCoord(e) {
        const r = canvasEl.getBoundingClientRect();
        const scaleX = viewW / r.width;
        const scaleY = viewH / r.height;
        return {
            x: (e.clientX - r.left) * scaleX / ppm,
            y: physH - (e.clientY - r.top) * scaleY / ppm
        };
    }

    function onMouseMove(e) {
        const p = getPhysCoord(e);
        mouseBody.position[0] = p.x;
        mouseBody.position[1] = p.y;
    }

    function onMouseDown(e) {
        if (locked || wheelBroken) return;
        if (isTimedEffectActive()) {
            if (statusEl) statusEl.textContent = "Can't use wheel while an effect is active";
            return;
        }
        if (world.hitTest(mouseBody.position, [wheel.body])[0]) {
            mouseConstraint = new p2.RevoluteConstraint(mouseBody, wheel.body, {
                worldPivot: mouseBody.position,
                collideConnected: false
            });
            world.addConstraint(mouseConstraint);
        }
    }

    function onMouseUp() {
        if (mouseConstraint) {
            world.removeConstraint(mouseConstraint);
            mouseConstraint = null;

            if (isTimedEffectActive()) {
                if (statusEl) statusEl.textContent = "Can't use wheel while an effect is active";
                return;
            }

            if (!locked && !wheelBroken && Math.abs(wheel.body.angularVelocity) > LOCK_SPEED) {
                
                if (rollCount >= 3 && Math.random() < (rollCount - 2) * 0.25) {
                    triggerBreak();
                    updateSpinButtonState();
                    return;
                }
                locked = true;
                stopTimer = 0;
                canvasEl.classList.add('spinning');
                if (statusEl) statusEl.textContent = '';
                if (resultEl) resultEl.textContent = '';
                updateSpinButtonState();
                saveWheelSession();
            }
        }
    }

    
    function update() {
        if (!locked && !wheelBroken && isTimedEffectActive() && statusEl) {
            statusEl.textContent = "Can't use wheel while an effect is active";
        }
        updateSpinButtonState();

        if (!wheelBroken) {
            world.step(timeStep * 0.5);
            world.step(timeStep * 0.5);
        }

        
        if (arrow && !wheelBroken) {
            if (arrow.body.angle > HALF_PI) {
                arrow.body.angle = HALF_PI;
                arrow.body.angularVelocity = Math.min(0, arrow.body.angularVelocity);
            } else if (arrow.body.angle < -HALF_PI) {
                arrow.body.angle = -HALF_PI;
                arrow.body.angularVelocity = Math.max(0, arrow.body.angularVelocity);
            }
        }

        if (locked) {
            queueSessionSave();
            if (Math.abs(wheel.body.angularVelocity) < STOP_SPEED) {
                stopTimer += timeStep;
                if (arrow.hasStopped() || stopTimer > 3.0) {
                    locked = false;
                    canvasEl.classList.remove('spinning');
                    wheel.body.angularVelocity = 0;
                    updateSpinButtonState();

                    const idx    = wheel.getWinningIndex();
                    const winner = activeSlices[idx];
                    if (statusEl) statusEl.textContent  = '';

                    rollCount++;
                    saveRollCount();
                    try {
                        var lifetimeSpins = parseInt(localStorage.getItem('28bugs_stat_wheel_spins') || '0', 10);
                        localStorage.setItem('28bugs_stat_wheel_spins', String(lifetimeSpins + 1));
                    } catch(e) {}
                    spawnParticles();
                    schedulePendingOutcome(winner);
                }
            } else {
                stopTimer = 0;
            }
        }

        
        if (breakAnim && !breakAnim.offScreen) {
            breakAnim.vy += 400 * timeStep;
            breakAnim.px += breakAnim.vx * timeStep;
            breakAnim.py += breakAnim.vy * timeStep;
            breakAnim.angle += breakAnim.angVel * timeStep;
            if (breakAnim.px < -300 || breakAnim.px > viewW + 300 || breakAnim.py > viewH + 300) {
                breakAnim.offScreen = true;
            }
        }

        
        if (wheelBroken && breakAnim && breakAnim.offScreen && breakStartTime) {
            if (Date.now() - breakStartTime >= REPAIR_MS) {
                repairWheel();
            }
        }
        updateWheelFixButton();
        updateEffectIndicator();

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].complete) particles.splice(i, 1);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, viewW, viewH);
        if (wheelBroken) {
            if (breakAnim && !breakAnim.offScreen) drawBreakingWheel();
            if (breakAnim && breakAnim.offScreen)  drawRepairTimer();
            arrow.draw();
        } else {
            wheel.draw();
            arrow.draw();
        }
        for (let i = 0; i < particles.length; i++) particles[i].draw();
    }

    function loop() {
        update();
        draw();
        _rafId = requestAnimationFrame(loop);
    }

    function isTimedEffectActive() {
        var horsemenActive   = !!(window.Horsemen && window.Horsemen.isAnyActive && window.Horsemen.isAnyActive());
        var timeWarpActive   = !!(window.TimeWarp && window.TimeWarp.isRunning && window.TimeWarp.isRunning());
        var meteorActive     = !!(window.MeteorShower && window.MeteorShower.isActive && window.MeteorShower.isActive());
        var bombActive       = !!window._activeBombGame;
        var panopticonActive = !!(window.PanopticonBoss && window.PanopticonBoss.isActive && window.PanopticonBoss.isActive());
        var sisyphusActive   = !!(window.SisyphusBoss && window.SisyphusBoss.isActive && window.SisyphusBoss.isActive());
        return horsemenActive || timeWarpActive || meteorActive || bombActive || panopticonActive || sisyphusActive;
    }

    function updateSpinButtonState() {
        if (!spinBtnEl) return;
        spinBtnEl.disabled = locked || wheelBroken || isTimedEffectActive();
    }

    function spinWheel() {
        if (locked || wheelBroken) return;
        if (isTimedEffectActive()) {
            if (statusEl) statusEl.textContent = "Can't use wheel while an effect is active";
            return;
        }
        if (!wheel || !wheel.body) return;

        const dir = Math.random() < 0.5 ? -1 : 1;
        const speed = LOCK_SPEED + 4 + Math.random() * 12;
        wheel.body.angularVelocity = dir * speed;

        if (rollCount >= 3 && Math.random() < (rollCount - 2) * 0.25) {
            triggerBreak();
            updateSpinButtonState();
            return;
        }

        locked = true;
        stopTimer = 0;
        canvasEl.classList.add('spinning');
        if (statusEl) statusEl.textContent = '';
        if (resultEl) resultEl.textContent = '';
        updateSpinButtonState();
        saveWheelSession();
    }

    function drawWheelLabel(ctx, text, x, y) {
        const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        for (let o = 0; o < offsets.length; o++) {
            ctx.fillText(text, x + offsets[o][0], y + offsets[o][1]);
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
    }

    
    function Wheel(x, y, radius, numSegs, numPins, pinRadius, pinDist, pinMat) {
        this.x = x; this.y = y;
        this.radius      = radius;
        this.numSegments = numSegs;
        this.numPins     = numPins;
        this.pinRadius   = pinRadius;
        this.pinDistance  = pinDist;
        this.pX = x * ppm;
        this.pY = (physH - y) * ppm;
        this.pRadius     = radius * ppm;
        this.pPinRadius  = pinRadius * ppm;
        this.pPinPositions = [];
        this.deltaPI = TWO_PI / numSegs;
        this.createBody();
        this.createPins(pinMat);
    }

    Wheel.prototype = {
        createBody() {
            this.body = new p2.Body({ mass: 1, position: [this.x, this.y] });
            this.body.angularDamping = 0.0;
            const shape = new p2.Circle(this.radius);
            shape.sensor = true;
            this.body.addShape(shape);

            const axis = new p2.Body({ position: [this.x, this.y] });
            const lock = new p2.LockConstraint(this.body, axis);
            lock.collideConnected = false;

            world.addBody(this.body);
            world.addBody(axis);
            world.addConstraint(lock);
        },

        createPins(mat) {
            for (let i = 0; i < this.numPins; i++) {
                const a  = i / this.numPins * TWO_PI;
                const px = Math.cos(a) * this.pinDistance;
                const py = Math.sin(a) * this.pinDistance;
                const pin = new p2.Circle(this.pinRadius);
                pin.material = mat;
                this.body.addShape(pin, [px, py]);
                this.pPinPositions.push([px * ppm, -py * ppm]);
            }
        },

        getWinningIndex() {
            const raw  = -HALF_PI + this.body.angle;
            const norm = ((raw % TWO_PI) + TWO_PI) % TWO_PI;
            return Math.floor(norm / this.deltaPI) % this.numSegments;
        },

        draw() {
            ctx.save();
            ctx.translate(Math.round(this.pX), Math.round(this.pY));

            
            ctx.beginPath();
            ctx.fillStyle = '#DAA520';
            ctx.arc(0, 0, this.pRadius + 16, 0, TWO_PI);
            ctx.fill();

            
            ctx.save();
            ctx.rotate(-this.body.angle);

            
            for (let i = 0; i < this.numSegments; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, this.pRadius, i * this.deltaPI, (i + 1) * this.deltaPI);
                ctx.closePath();
                ctx.fillStyle = activeSlices[i] ? activeSlices[i].color : '#555';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            for (let i = 0; i < this.numSegments; i++) {
                const sa = i * this.deltaPI;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(sa) * this.pRadius, Math.sin(sa) * this.pRadius);
                ctx.stroke();
            }

            
            ctx.font = 'bold 15px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            for (let i = 0; i < this.numSegments; i++) {
                if (!activeSlices[i]) continue;
                const midA = (i + 0.5) * this.deltaPI;
                const txt  = activeSlices[i].label;
                let dist = this.pRadius * 0.58;

                ctx.save();
                ctx.rotate(midA);
                const normA = ((midA % TWO_PI) + TWO_PI) % TWO_PI;
                if (normA > HALF_PI && normA < HALF_PI * 3) {
                    ctx.rotate(Math.PI);
                    dist = -dist;
                }

                const tx = Math.round(dist);

                const words = txt.split(' ');
                if (words.length > 1 && ctx.measureText(txt).width > this.pRadius * 0.48) {
                    drawWheelLabel(ctx, words[0], tx, -9);
                    drawWheelLabel(ctx, words.slice(1).join(' '), tx, 9);
                } else {
                    drawWheelLabel(ctx, txt, tx, 0);
                }
                ctx.restore();
            }

            
            ctx.fillStyle = '#2c1810';
            for (let i = 0; i < this.pPinPositions.length; i++) {
                ctx.beginPath();
                ctx.arc(this.pPinPositions[i][0], this.pPinPositions[i][1], this.pPinRadius, 0, TWO_PI);
                ctx.fill();
            }

            ctx.restore(); 

            
            ctx.beginPath();
            ctx.fillStyle = '#DAA520';
            ctx.arc(0, 0, 20, 0, TWO_PI);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = '#B8860B';
            ctx.arc(0, 0, 10, 0, TWO_PI);
            ctx.fill();

            ctx.restore(); 
        }
    };

    
    function Arrow(x, y, w, h, mat) {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.pX = x * ppm;
        this.pY = (physH - y) * ppm;
        this.verts  = [];
        this.pVerts = [];
        this.createBody(mat);
    }

    Arrow.prototype = {
        createBody(mat) {
            this.body = new p2.Body({ mass: 0.2, position: [this.x, this.y] });
            this.body.angularDamping = 0.3;

            this.verts[0] = [0,             this.h *  0.25];
            this.verts[1] = [-this.w * 0.5, 0];
            this.verts[2] = [0,            -this.h *  0.75];
            this.verts[3] = [ this.w * 0.5, 0];

            for (let i = 0; i < 4; i++) {
                this.pVerts[i] = [this.verts[i][0] * ppm, -this.verts[i][1] * ppm];
            }

            const shape = new p2.Convex(this.verts);
            shape.material = mat;
            this.body.addShape(shape);

            const axis = new p2.Body({ position: [this.x, this.y] });
            const rev  = new p2.RevoluteConstraint(this.body, axis, { worldPivot: [this.x, this.y] });
            rev.collideConnected = false;

            const left  = new p2.Body({ position: [this.x - 2, this.y] });
            const right = new p2.Body({ position: [this.x + 2, this.y] });
            const lc = new p2.DistanceConstraint(this.body, left,  { localAnchorA: [-this.w * 2, this.h * 0.25], collideConnected: false });
            const rc = new p2.DistanceConstraint(this.body, right, { localAnchorA: [ this.w * 2, this.h * 0.25], collideConnected: false });
            lc.setStiffness(120); lc.setRelaxation(3);
            rc.setStiffness(120); rc.setRelaxation(3);

            world.addBody(this.body);
            world.addBody(axis);
            world.addConstraint(rev);
            world.addConstraint(lc);
            world.addConstraint(rc);
        },

        hasStopped() {
            const aVel   = Math.abs(this.body.angularVelocity);
            const aAngle = Math.abs(this.body.angle % TWO_PI);
            return aVel < 0.5 && (aAngle < 0.1 || (TWO_PI - aAngle) < 0.1);
        },

        draw() {
            ctx.save();
            ctx.translate(this.pX, this.pY);
            ctx.rotate(-this.body.angle);
            ctx.fillStyle = '#2c1810';
            ctx.beginPath();
            ctx.moveTo(this.pVerts[0][0], this.pVerts[0][1]);
            ctx.lineTo(this.pVerts[1][0], this.pVerts[1][1]);
            ctx.lineTo(this.pVerts[2][0], this.pVerts[2][1]);
            ctx.lineTo(this.pVerts[3][0], this.pVerts[3][1]);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    };

    
    function triggerBreak() {
        if (_outcomeTimer) {
            clearTimeout(_outcomeTimer);
            _outcomeTimer = null;
        }
        pendingWinner = null;
        pendingSince = 0;
        clearWheelSession();
        wheelBroken = true;
        locked = false;
        canvasEl.classList.remove('spinning');

        const dir = Math.random() < 0.5 ? -1 : 1;
        breakAnim = {
            px: wheel.pX, py: wheel.pY,
            vx: dir * 300, vy: -150,
            angle: wheel.body.angle,
            angVel: dir * 8,
            pRadius: wheel.pRadius,
            pPinRadius: wheel.pPinRadius,
            pPinPositions: wheel.pPinPositions,
            deltaPI: wheel.deltaPI,
            numSegments: wheel.numSegments,
            offScreen: false
        };

        world.removeBody(wheel.body);
        arrow.body.angle = 0;
        arrow.body.angularVelocity = 0;

        breakStartTime = Date.now();
        saveBreakState();

        if (statusEl) statusEl.textContent = '';
        if (resultEl) resultEl.textContent = '';
        updateSpinButtonState();
        updateWheelFixButton();
    }

    function drawStand() {
        const px = physCX * ppm;
        const py = (physH - (8 + 4)) * ppm;
        const pRadius = 8 * ppm;

        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(-10, 0, 20, pRadius + 60);
        ctx.beginPath();
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 4;
        ctx.arc(0, 0, 20, 0, TWO_PI); ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = '#B8860B';
        ctx.arc(0, 0, 10, 0, TWO_PI); ctx.fill();
        ctx.restore();
    }

    function drawBreakingWheel() {
        ctx.save();
        ctx.translate(breakAnim.px, breakAnim.py);
        ctx.beginPath();
        ctx.fillStyle = '#DAA520';
        ctx.arc(0, 0, breakAnim.pRadius + 16, 0, TWO_PI); ctx.fill();

        ctx.save();
        ctx.rotate(-breakAnim.angle);
        for (let i = 0; i < breakAnim.numSegments; i++) {
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.arc(0, 0, breakAnim.pRadius, i * breakAnim.deltaPI, (i + 1) * breakAnim.deltaPI);
            ctx.closePath();
            ctx.fillStyle = activeSlices[i] ? activeSlices[i].color : '#555';
            ctx.fill();
        }
        ctx.fillStyle = '#2c1810';
        for (let j = 0; j < breakAnim.pPinPositions.length; j++) {
            ctx.beginPath();
            ctx.arc(breakAnim.pPinPositions[j][0], breakAnim.pPinPositions[j][1], breakAnim.pPinRadius, 0, TWO_PI);
            ctx.fill();
        }
        ctx.restore();

        ctx.beginPath(); ctx.fillStyle = '#DAA520';
        ctx.arc(0, 0, 20, 0, TWO_PI); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = '#B8860B';
        ctx.arc(0, 0, 10, 0, TWO_PI); ctx.fill();
        ctx.restore();
    }

    function drawRepairTimer() {
        const elapsed   = Date.now() - breakStartTime;
        const remaining = Math.max(0, REPAIR_MS - elapsed);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;

        const bx = viewW * 0.08, by = viewH * 0.32;
        const bw = viewW * 0.84, bh = viewH * 0.34;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.moveTo(bx + 12, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, 12);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, 12);
        ctx.arcTo(bx, by + bh, bx, by, 12);
        ctx.arcTo(bx, by, bx + bw, by, 12);
        ctx.closePath(); ctx.fill();

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillText('Wheel Under Repair', viewW * 0.5, by + bh * 0.22);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 52px monospace';
        ctx.fillText(timeStr, viewW * 0.5, by + bh * 0.5);
        ctx.fillStyle = '#aaa'; ctx.font = '15px Arial, sans-serif';
        ctx.fillText("It'll take some time to put it back together\u2026", viewW * 0.5, by + bh * 0.78);
        ctx.restore();

        if (statusEl) statusEl.textContent = '';
    }

    function repairWheel() {
        if (_outcomeTimer) {
            clearTimeout(_outcomeTimer);
            _outcomeTimer = null;
        }
        pendingWinner = null;
        pendingSince = 0;
        clearWheelSession();
        wheelBroken = false;
        breakAnim = null;
        breakStartTime = null;
        rollCount = 0;
        clearBreakState();
        saveRollCount();

        initPhysics();
        randomizeSlices();

        if (statusEl) statusEl.textContent = 'Drag or click Spin!';
        if (resultEl) resultEl.textContent = '';
        updateSpinButtonState();
        updateWheelFixButton();
    }

    function saveBreakState() {
        try { localStorage.setItem(STORAGE_BREAK, JSON.stringify({ time: breakStartTime, rollCount })); } catch(e){}
    }
    function clearBreakState() {
        try { localStorage.removeItem(STORAGE_BREAK); } catch(e){}
    }
    function saveRollCount() {
        try { localStorage.setItem(STORAGE_ROLLS, rollCount.toString()); } catch(e){}
    }
    function loadRollCount() {
        try { const v = localStorage.getItem(STORAGE_ROLLS); if (v) rollCount = parseInt(v, 10) || 0; } catch(e){}
    }

    function checkSavedBreak() {
        try {
            const saved = localStorage.getItem(STORAGE_BREAK);
            if (!saved) return;
            const data = JSON.parse(saved);
            const elapsed = Date.now() - data.time;
            if (elapsed < REPAIR_MS) {
                wheelBroken = true;
                breakStartTime = data.time;
                rollCount = data.rollCount;
                breakAnim = { offScreen: true };
                world.removeBody(wheel.body);
                arrow.body.angle = 0;
                arrow.body.angularVelocity = 0;
                if (statusEl) statusEl.textContent = '';
            } else {
                clearBreakState();
                rollCount = 0;
                saveRollCount();
            }
        } catch(e) { clearBreakState(); }
    }

    
    function spawnParticles() {
        for (let i = 0; i < 200; i++) {
            const p0 = { x: viewW * 0.5, y: viewH * 0.5 - 64 };
            const p1 = { x: viewW * 0.5, y: 0 };
            const p2_ = { x: Math.random() * viewW, y: Math.random() * viewH * 0.5 };
            const p3  = { x: Math.random() * viewW, y: viewH + 64 };
            particles.push(new Particle(p0, p1, p2_, p3));
        }
    }

    function Particle(p0, p1, p2_, p3) {
        this.p0 = p0; this.p1 = p1; this.p2 = p2_; this.p3 = p3;
        this.x = 0; this.y = 0; this.r = 0; this.sy = 0;
        this.time = 0;
        this.duration = 3 + Math.random() * 2;
        this.color = 'hsl(' + Math.floor(Math.random() * 360) + ',100%,60%)';
        this.w = 10; this.h = 7;
        this.complete = false;
    }
    Particle.prototype = {
        update() {
            this.time = Math.min(this.duration, this.time + timeStep);
            const f  = easeOutCubic(this.time, 0, 1, this.duration);
            const pt = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);
            const dx = pt.x - this.x, dy = pt.y - this.y;
            this.r  = Math.atan2(dy, dx) + HALF_PI;
            this.sy = Math.sin(Math.PI * f * 10);
            this.x  = pt.x; this.y = pt.y;
            this.complete = (this.time === this.duration);
        },
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.r);
            ctx.scale(1, this.sy);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);
            ctx.restore();
        }
    };

    function easeOutCubic(t, b, c, d) {
        t /= d; t--;
        return c * (t * t * t + 1) + b;
    }

    function cubeBezier(p0, c0, c1, p1, t) {
        const nt = 1 - t;
        return {
            x: nt*nt*nt*p0.x + 3*nt*nt*t*c0.x + 3*nt*t*t*c1.x + t*t*t*p1.x,
            y: nt*nt*nt*p0.y + 3*nt*nt*t*c0.y + 3*nt*t*t*c1.y + t*t*t*p1.y
        };
    }

    
    function devReset() {
        if (_rafId) cancelAnimationFrame(_rafId);
        if (_outcomeTimer) {
            clearTimeout(_outcomeTimer);
            _outcomeTimer = null;
        }
        pendingWinner = null;
        pendingSince = 0;
        clearWheelSession();
        wheelBroken = false;
        breakAnim = null;
        breakStartTime = null;
        rollCount = 0;
        locked = false;
        stopTimer = 0;
        particles = [];
        clearBreakState();
        saveRollCount();
        initPhysics();
        randomizeSlices();
        if (statusEl) statusEl.textContent = 'Wheel reset! Drag or click Spin!';
        if (resultEl) resultEl.textContent = '';
        canvasEl.classList.remove('spinning');
        updateSpinButtonState();
        updateWheelFixButton();
        _rafId = requestAnimationFrame(loop);
    }

    function initWheelEngine() {
        if (_initialized) return;

        canvasEl  = document.getElementById('wheel-canvas');
        if (!canvasEl) return;
        ctx       = canvasEl.getContext('2d');
        statusEl  = document.getElementById('wheel-status');
        resultEl  = document.getElementById('wheel-result');

        const parent = canvasEl.parentElement;
        const widthCap = Math.max(220, (parent ? parent.clientWidth - 32 : 500));
        const viewportH = window.visualViewport && window.visualViewport.height
            ? window.visualViewport.height
            : window.innerHeight;
        const heightCap = Math.max(220, viewportH - 260);
        const size = Math.min(widthCap, heightCap, 500);
        const dpr = window.devicePixelRatio || 1;
        viewW = size; viewH = size;
        canvasEl.width  = size * dpr;
        canvasEl.height = size * dpr;
        canvasEl.style.width  = size + 'px';
        canvasEl.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        ppm    = 24;
        physW  = viewW / ppm;
        physH  = viewH / ppm;
        physCX = physW * 0.5;
        timeStep = 1 / 60;

        canvasEl.addEventListener('mousemove', onMouseMove);
        canvasEl.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup',   onMouseUp);
        canvasEl.addEventListener('touchmove', function(e) {
            e.preventDefault(); onMouseMove(e.touches[0]);
        }, { passive: false });
        canvasEl.addEventListener('touchstart', function(e) {
            e.preventDefault(); onMouseMove(e.touches[0]); onMouseDown(e.touches[0]);
        }, { passive: false });
        canvasEl.addEventListener('touchend', function() { onMouseUp(); });

        loadRollCount();
        initPhysics();
        checkSavedBreak();

        let restored = false;
        if (!wheelBroken) restored = restoreWheelSession();
        if (!restored && !wheelBroken) randomizeSlices();

        bindSessionPersistence();
        if (!wheelBroken && statusEl && !pendingWinner && !locked) {
            statusEl.textContent = 'Drag or click Spin!';
        }
        _rafId = requestAnimationFrame(loop);
        _initialized = true;
        updateSpinButtonState();
        updateWheelFixButton();
        updateEffectIndicator();
    }

    function initWheelModal() {
        const modal    = document.getElementById('awesome-wheel-modal');
        const openBtn  = document.getElementById('awesome-wheel-btn');
        const closeBtn = document.getElementById('awesome-wheel-close');
        if (!modal) return;

        function openModal() {
            modal.style.display = 'block';
            spinBtnEl = document.getElementById('wheel-spin-btn');
            fixBtnEl = document.getElementById('wheel-fix-btn');
            initWheelEngine();
            updateSpinButtonState();
            updateWheelFixButton();
            updateEffectIndicator();
        }

        function closeModal() {
            modal.style.display = 'none';
        }
        _closeModal = closeModal;

        if (openBtn)  openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        
        let backdropMouseDown = false;
        modal.addEventListener('mousedown', e => { backdropMouseDown = (e.target === modal); });
        modal.addEventListener('mouseup', e => {
            if (backdropMouseDown && e.target === modal) closeModal();
            backdropMouseDown = false;
        });

        spinBtnEl = document.getElementById('wheel-spin-btn');
        if (spinBtnEl) spinBtnEl.addEventListener('click', spinWheel);
        fixBtnEl = document.getElementById('wheel-fix-btn');
        if (fixBtnEl) fixBtnEl.addEventListener('click', useWheelFix);

        if (sessionNeedsModal()) openModal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWheelModal);
    } else {
        initWheelModal();
    }

    return {
        devReset,
        spinWheel,
        OPTION_POOL,
        get rollCount() { return rollCount; },
        get wheelBroken() { return wheelBroken; }
    };
})();
