


(function () {
    'use strict';

    
    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    
    var BLOOD_TYPES  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
                        'Bug+', 'Bug-', 'Z+', 'Z-', 'Hemolymph', '???', 'G+',
                        'Green', '30', 'Type F', 'Glaggle', 'None'];
    var GENRES       = ['Horror', 'Comedy', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller',
                        'Documentary', 'Musical', 'Western', 'Noir', 'Action', 'Drama',
                        'Slice of Life', 'Isekai', 'Mecha', 'Lo-Fi', 'Polka',
                        'Ambient Screaming', 'Smooth Jazz', 'Elevator Music'];
    var CLASSES      = ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Bard', 'Ranger',
                        'Paladin', 'Warlock', 'Monk', 'Barbarian', 'Druid', 'Sorcerer',
                        'Artificer', 'Bug Knight', 'Jester', 'Accountant', 'NPC',
                        'Boss', 'Side Character', 'Protagonist'];
    var TEXTURES     = ['Smooth', 'Crunchy', 'Fuzzy', 'Slimy', 'Velvety', 'Scaly',
                        'Leathery', 'Glossy', 'Matte', 'Gritty', 'Rubbery', 'Papery',
                        'Wet Cardboard', 'Memory Foam', 'Sandpaper', 'Buttery',
                        'Holographic', 'Corduroy', 'Like a Warm Towel', 'Unsettling', 'Beautiful'];

    
    


    var SESSION_START = Date.now();

    function timeDrift(rng, period) {
        
        
        var phase = rng() * Math.PI * 2;
        var elapsed = (Date.now() - SESSION_START) / 1000;
        var slow = (Math.sin(elapsed / period + phase) + 1) / 2;
        
        var fast = Math.sin(elapsed * 7.3 + phase) * 0.004
                 + Math.sin(elapsed * 13.7 + phase * 1.3) * 0.002
                 + Math.sin(elapsed * 23.1 + phase * 0.7) * 0.001;
        return Math.max(0, Math.min(1, slow + fast));
    }

    function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

    function getAllBugNames() {
        if (window.BugRoster && window.BugRoster.length) {
            return window.BugRoster.map(function (b) { return b.name; });
        }
        return window.BugData ? window.BugData.bugNames : ['Unknown Bug'];
    }

    var STAT_POOL = [
        {
            key: 'bloodType', label: 'Blood Type',
            gen: function (rng) { return { value: pick(BLOOD_TYPES, rng), display: pick(BLOOD_TYPES, rng) }; }
        },
        {
            key: 'love', label: 'Love', timeVarying: true,
            gen: function (rng) {
                var v = timeDrift(rng, 47) * 999 + 1;
                return { value: v, display: v.toFixed(2) };
            }
        },
        {
            key: 'comfort', label: 'Comfort', timeVarying: true,
            gen: function (rng, bugEl) {
                var inverse = rng() < 0.5;
                var bugSize = bugEl ? bugEl.offsetWidth || 75 : 75;
                var threshold = bugSize * 2;
                var nearby = 0;
                var bugs = document.querySelectorAll('.bug');
                if (bugEl && bugs.length) {
                    var rect = bugEl.getBoundingClientRect();
                    var cx = rect.left + rect.width / 2;
                    var cy = rect.top + rect.height / 2;
                    bugs.forEach(function (b) {
                        if (b === bugEl) return;
                        var r = b.getBoundingClientRect();
                        var dx = (r.left + r.width / 2) - cx;
                        var dy = (r.top  + r.height / 2) - cy;
                        if (Math.sqrt(dx * dx + dy * dy) <= threshold) nearby++;
                    });
                }
                var ratio = Math.min(nearby / Math.max(bugs.length - 1, 1), 1);
                var raw = inverse ? (1 - ratio) : ratio;
                var v = Math.round(raw * 999) + 1;
                return { value: v, display: v };
            }
        },
        {
            key: 'temperature', label: 'Temperature',
            gen: function (rng) {
                var v = 80 + rng() * 40;
                return { value: v, display: v.toFixed(1) + ' \u00B0F' };
            }
        },
        {
            key: 'genre', label: 'Genre',
            gen: function (rng) { return { value: pick(GENRES, rng), display: pick(GENRES, rng) }; }
        },
        {
            key: 'class', label: 'Class',
            gen: function (rng) { return { value: pick(CLASSES, rng), display: pick(CLASSES, rng) }; }
        },
        {
            key: 'orbulous', label: 'Orbulous',
            gen: function (rng) { var v = rng() < 0.5; return { value: v, display: v ? 'Yes' : 'No' }; }
        },
        {
            key: 'texture', label: 'Texture',
            gen: function (rng) { return { value: pick(TEXTURES, rng), display: pick(TEXTURES, rng) }; }
        },
        {
            key: 'enemy', label: 'Enemy',
            gen: function (rng, bugEl) {
                var names = getAllBugNames();
                var own = bugEl ? bugEl.dataset.bugName : '';
                var filtered = names.filter(function (n) { return n !== own; });
                if (!filtered.length) filtered = names;
                return { value: pick(filtered, rng), display: pick(filtered, rng) };
            }
        },
        {
            key: 'friend', label: 'Friend',
            gen: function (rng, bugEl) {
                var names = getAllBugNames();
                var own = bugEl ? bugEl.dataset.bugName : '';
                var filtered = names.filter(function (n) { return n !== own; });
                if (!filtered.length) filtered = names;
                return { value: pick(filtered, rng), display: pick(filtered, rng) };
            }
        },
        {
            key: 'lover', label: 'Lover',
            gen: function (rng, bugEl) {
                var names = getAllBugNames();
                var own = bugEl ? bugEl.dataset.bugName : '';
                var filtered = names.filter(function (n) { return n !== own; });
                if (!filtered.length) filtered = names;
                return { value: pick(filtered, rng), display: pick(filtered, rng) };
            }
        },
        {
            key: 'family', label: 'Family',
            gen: function (rng) { var v = Math.floor(rng() * 101); return { value: v, display: String(v) }; }
        },
        {
            key: 'iq', label: 'IQ',
            gen: function (rng) {
                var v = rng() < 0.005 ? 530000 : Math.floor(rng() * 181);
                return { value: v, display: v.toLocaleString() };
            }
        },
        {
            key: 'value', label: 'Value',
            gen: function (rng) {
                var v = Math.floor(rng() * 1000501) - 500;
                return { value: v, display: v.toLocaleString() };
            }
        },
        {
            key: 'caliber', label: 'Caliber',
            gen: function (rng) {
                var useDecimal = rng() < 0.5;
                var v = 3 + rng() * 17;
                var display = useDecimal ? v.toFixed(1) : Math.round(v).toString();
                return { value: v, display: display + ' mm' };
            }
        },
        {
            key: 'liquidity', label: 'Liquidity', timeVarying: true,
            gen: function (rng) {
                var v = timeDrift(rng, 61) * 100;
                return { value: v, display: v.toFixed(2) + '%' };
            }
        },
        {
            key: 'anger', label: 'Anger', timeVarying: true,
            gen: function (rng) {
                var v = timeDrift(rng, 37) * 100;
                return { value: v, display: v.toFixed(2) + '%' };
            }
        },
        {
            key: 'ambitions', label: 'Ambitions',
            gen: function (rng) { var v = rng() < 0.5; return { value: v, display: v ? 'Yes' : 'No' }; }
        },
        {
            key: 'fear', label: 'Fear', timeVarying: true,
            gen: function (rng, bugEl) {
                
                var fearless = rng() < 0.03;
                if (fearless) {
                    
                    if (bugEl && bugEl._velocity) {
                        var spd = Math.sqrt(bugEl._velocity.x * bugEl._velocity.x +
                                            bugEl._velocity.y * bugEl._velocity.y);
                        if (spd > 8) return { value: true, display: 'Yes' };
                    }
                    return { value: false, display: 'No' };
                }
                
                var v = timeDrift(rng, 29) > 0.5;
                return { value: v, display: v ? 'Yes' : 'No' };
            }
        }
    ];

    
    var bugStatMap = new WeakMap();

    function ensureStats(bugEl) {
        var entry = bugStatMap.get(bugEl);
        if (entry) return entry;

        
        var seed;
        if (bugEl.dataset.bugSeed) {
            seed = parseInt(bugEl.dataset.bugSeed, 10);
        } else {
            var raw = (bugEl.dataset.bugName || '') + (bugEl.src || '') + bugEl.offsetLeft;
            seed = 0;
            for (var i = 0; i < raw.length; i++) seed = ((seed << 5) - seed + raw.charCodeAt(i)) | 0;
        }

        var rng = mulberry32(seed);

        
        var count = 3 + Math.floor(rng() * 3);                       
        var available = STAT_POOL.slice();
        var chosen = [];
        for (var c = 0; c < count && available.length; c++) {
            var idx = Math.floor(rng() * available.length);
            chosen.push(available.splice(idx, 1)[0]);
        }

        entry = { seed: seed, stats: chosen };
        bugStatMap.set(bugEl, entry);
        return entry;
    }

    
    function genStat(entry, stat, bugEl) {
        var subSeed = (entry.seed * 31 + stat.key.length) | 0;
        var subRng = mulberry32(subSeed);
        return stat.gen(subRng, bugEl);
    }

    
    


    function getStatsForBug(bugEl) {
        var entry = ensureStats(bugEl);
        return entry.stats.map(function (stat) {
            var result = genStat(entry, stat, bugEl);
            return { key: stat.key, label: stat.label, display: result.display,
                     timeVarying: !!stat.timeVarying };
        });
    }

    
    var _raf = null;
    var _liveBugEl = null;
    var _liveContainer = null;

    function tickLive() {
        if (!_liveBugEl || !_liveContainer) return;
        var entry = bugStatMap.get(_liveBugEl);
        if (!entry) return;

        entry.stats.forEach(function (stat) {
            if (!stat.timeVarying) return;
            var result = genStat(entry, stat, _liveBugEl);
            var span = _liveContainer.querySelector('[data-stat-key="' + stat.key + '"]');
            if (span) {
                span.lastChild.textContent = ' ' + result.display;
            }
        });

        _raf = requestAnimationFrame(tickLive);
    }

    function startLiveUpdate(bugEl, container) {
        stopLiveUpdate();
        _liveBugEl = bugEl;
        _liveContainer = container;
        _raf = requestAnimationFrame(tickLive);
    }

    function stopLiveUpdate() {
        if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
        _liveBugEl = null;
        _liveContainer = null;
    }

    window.BugMiscStats = {
        getStatsForBug: getStatsForBug,
        startLiveUpdate: startLiveUpdate,
        stopLiveUpdate: stopLiveUpdate
    };
})();
