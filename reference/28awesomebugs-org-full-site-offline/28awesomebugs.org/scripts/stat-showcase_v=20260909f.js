



var StatShowcase = (function() {
  'use strict';

  var SHOWCASE_KEY = '28bugs_stat_showcase';
  var SLOT_COSTS = [0, 10000, 100000, 1000000, 1000000000]; 

  var STATS = [
    { id: 'tetris_normal',     label: 'Tetris Normal Best'     },
    { id: 'tetris_sprint',     label: 'Tetris Sprint Best'     },
    { id: 'tetris_ultra',      label: 'Tetris Ultra Best'      },
    { id: 'tetris_dig',        label: 'Tetris Dig Best'        },
    { id: 'tetris_swarm',      label: 'Tetris Swarm Best'      },
    { id: 'tetris_perfection', label: 'Tetris Perfection Best' },
    { id: 'fish_caught',       label: 'Total Fish Caught'      },
    { id: 'post_likes',        label: 'Post Likes'             },
    { id: 'total_messages',    label: 'Total Messages'         },
    { id: 'tag_count',         label: 'Tags Unlocked'          },
    { id: 'nukes_launched',    label: 'Nukes Launched'         },
    { id: 'wheel_spins',       label: 'Wheel of Awesome Spins' },
    { id: 'pet_info',          label: 'Bug Buddy'              },
    { id: 'bugs_killed',       label: 'Bugs Killed'            },
    { id: 'rocks_added',       label: 'Rocks Added to Pile'    },
    { id: 'blackjack_wins',    label: 'Bugjack Wins'           },
    { id: 'bugrace_wins',      label: 'Bug Racing Wins'        },
    { id: 'highlow_wins',      label: 'High/Low Wins'          },
    { id: 'poker_wins',        label: 'Poker Wins'             },
    { id: 'solitaire_wins',    label: 'Solitaire Wins'         },
    { id: 'roulette_wins',     label: 'Roulette Wins'          },
    { id: 'money_won',         label: 'Total Money Won'        },
    { id: 'money_lost',        label: 'Total Money Bet'        },
    { id: 'buggle_wins',       label: 'Buggle Total Wins'      },
    { id: 'buggle_streak',     label: 'Buggle Best Streak'     },
    { id: 'buggle_played',     label: 'Buggle Puzzles Played'  },
  ];

  function formatMs(ms) {
    if (!ms || ms <= 0) return '-';
    var totalSec = Math.floor(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    var hun = Math.floor((ms % 1000) / 10);
    return (m > 0 ? m + ':' + String(s).padStart(2, '0') : s) + '.' + String(hun).padStart(2, '0');
  }

  function loadConfig() {
    try {
      var raw = localStorage.getItem(SHOWCASE_KEY);
      if (raw) {
        var cfg = JSON.parse(raw);
        if (cfg && typeof cfg.slots === 'number' && Array.isArray(cfg.selected)) {
          return cfg;
        }
      }
    } catch(e) {}
    return { slots: 1, selected: [null] };
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(SHOWCASE_KEY, JSON.stringify(cfg));
    } catch(e) {}
  }

  function getStatValue(statId, progress, serverStats) {
    progress = progress || {};
    serverStats = serverStats || {};
    function pRaw(key) { return progress[key] || null; }
    function pInt(key) { return parseInt(pRaw(key) || '0', 10); }

    switch(statId) {
      case 'total_coins':
        return (typeof window.formatCoinAmount === 'function'
          ? window.formatCoinAmount(pRaw('28bugs_gameCoins') || '0')
          : pInt('28bugs_gameCoins').toLocaleString()) + ' coins';
      case 'tetris_normal':
        return pInt('28bugs_tetris_best_normal').toLocaleString();
      case 'tetris_sprint':
        return formatMs(pInt('28bugs_tetris_best_sprint'));
      case 'tetris_ultra':
        return pInt('28bugs_tetris_best_ultra').toLocaleString();
      case 'tetris_dig':
        return formatMs(pInt('28bugs_tetris_best_dig'));
      case 'tetris_swarm':
        return formatMs(pInt('28bugs_tetris_best_swarm'));
      case 'tetris_perfection':
        return pInt('28bugs_tetris_best_perfection').toLocaleString();
      case 'fish_caught':
        if (typeof serverStats.fishCaughtTotal === 'number') {
          return serverStats.fishCaughtTotal.toLocaleString();
        }
        var rec = pRaw('28bugs_fishRecords');
        if (rec) {
          try {
            var obj = JSON.parse(rec);
            var total = Object.keys(obj).reduce(function(sum, k) {
              return sum + (obj[k] && typeof obj[k].numberCaught === 'number' ? obj[k].numberCaught : 0);
            }, 0);
            return total.toLocaleString();
          } catch(e) {}
        }
        return '0';
      case 'post_likes':
        return (serverStats.totalPostLikes || 0).toLocaleString();
      case 'total_messages':
        return (serverStats.totalMessages || 0).toLocaleString();
      case 'tag_count':
        return (serverStats.tagCount || 0).toLocaleString();
      case 'nukes_launched':
        return pInt('28bugs_nuke_count').toLocaleString();
      case 'wheel_spins':
        return pInt('28bugs_stat_wheel_spins').toLocaleString();
      case 'pet_info':
        if (serverStats.buddyName) {
          return serverStats.buddyName + ' (Lv.\u00a0' + (serverStats.buddyLevel || 1) + ')';
        }
        var pg = pRaw('28bugs_playground');
        if (pg) {
          try {
            var buddy = JSON.parse(pg);
            if (buddy && buddy.name) {
              return buddy.name + ' (Lv.\u00a0' + (buddy.level || 1) + ')';
            }
          } catch(e) {}
        }
        return '-';
      case 'bugs_killed':
        if (typeof serverStats.bugsKilledCount === 'number') {
          return serverStats.bugsKilledCount.toLocaleString();
        }
        var mem = pRaw('28bugs_memorialData');
        if (mem) {
          try { return JSON.parse(mem).length.toLocaleString(); } catch(e) {}
        }
        return '0';
      case 'rocks_added':
        return pInt('28bugs_stat_rocks_added').toLocaleString();
      case 'blackjack_wins':
        return pInt('28bugs_stat_blackjack_wins').toLocaleString();
      case 'bugrace_wins':
        return pInt('28bugs_stat_bugrace_wins').toLocaleString();
      case 'highlow_wins':
        return pInt('28bugs_stat_highlow_wins').toLocaleString();
      case 'poker_wins':
        return pInt('28bugs_stat_poker_wins').toLocaleString();
      case 'solitaire_wins':
        return pInt('28bugs_stat_solitaire_wins').toLocaleString();
      case 'roulette_wins':
        return pInt('28bugs_stat_roulette_wins').toLocaleString();
      case 'money_won':
        return pInt('28bugs_stat_money_won').toLocaleString() + ' coins';
      case 'money_lost':
        return pInt('28bugs_stat_money_lost').toLocaleString() + ' coins';
      case 'buggle_wins':
        return (serverStats.buggleTotalWins || 0).toLocaleString();
      case 'buggle_streak':
        return (serverStats.buggleLongestStreak || 0) + (serverStats.buggleLongestStreak === 1 ? ' day' : ' days');
      case 'buggle_played':
        return (serverStats.bugglePlayed || 0).toLocaleString();
      default:
        return '-';
    }
  }

  
  function renderPublic(container, showcaseRaw, progress, serverStats) {
    if (!container) return;
    container.innerHTML = '';

    var showcaseConfig = null;
    if (typeof showcaseRaw === 'string') {
      try { showcaseConfig = JSON.parse(showcaseRaw); } catch(e) {}
    } else if (showcaseRaw && typeof showcaseRaw === 'object') {
      showcaseConfig = showcaseRaw;
    }

    var active = showcaseConfig && Array.isArray(showcaseConfig.selected)
      ? showcaseConfig.selected.filter(function(s) { return !!s; })
      : [];

    var header = document.createElement('div');
    header.className = 'showcase-pub-header';
    header.textContent = 'Showcase';
    container.appendChild(header);

    if (active.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'showcase-pub-empty';
      empty.textContent = 'No stats selected yet.';
      container.appendChild(empty);
      container.style.display = '';
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'showcase-pub-grid';
    active.forEach(function(statId) {
      var stat = STATS.find(function(s) { return s.id === statId; });
      if (!stat) return;
      var card = document.createElement('div');
      card.className = 'showcase-pub-card';

      var label = document.createElement('div');
      label.className = 'showcase-pub-card-label';
      label.textContent = stat.label;

      var value = document.createElement('div');
      value.className = 'showcase-pub-card-value';
      value.textContent = getStatValue(statId, progress, serverStats);

      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    });
    container.appendChild(grid);
    container.style.display = '';
  }

  
  function renderEditor(slotsContainer, buyContainer) {
    if (!slotsContainer || !buyContainer) return;
    var cfg = loadConfig();

    
    while (cfg.selected.length < cfg.slots) cfg.selected.push(null);
    cfg.selected = cfg.selected.slice(0, cfg.slots);

    slotsContainer.innerHTML = '';
    for (var i = 0; i < cfg.slots; i++) {
      (function(idx) {
        var wrap = document.createElement('div');
        wrap.className = 'showcase-slot-row';

        var slotLabel = document.createElement('span');
        slotLabel.className = 'showcase-slot-label';
        slotLabel.textContent = 'Slot ' + (idx + 1) + (idx === 0 ? ' (Free)' : '');

        var sel = document.createElement('select');
        sel.className = 'showcase-stat-select auth-input';

        var emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '- None -';
        sel.appendChild(emptyOpt);

        STATS.forEach(function(stat) {
          var opt = document.createElement('option');
          opt.value = stat.id;
          opt.textContent = stat.label;
          if (cfg.selected[idx] === stat.id) opt.selected = true;
          sel.appendChild(opt);
        });

        sel.addEventListener('change', function() {
          var c = loadConfig();
          while (c.selected.length < c.slots) c.selected.push(null);
          c.selected[idx] = sel.value || null;
          saveConfig(c);
          if (typeof AccountSync !== 'undefined' && AccountSync.markDirty) AccountSync.markDirty();
        });

        wrap.appendChild(slotLabel);
        wrap.appendChild(sel);
        slotsContainer.appendChild(wrap);
      })(i);
    }

    
    buyContainer.innerHTML = '';
    for (var j = cfg.slots; j < SLOT_COSTS.length; j++) {
      (function(slotIdx) {
        var cost = SLOT_COSTS[slotIdx];
        var btn = document.createElement('button');
        btn.className = 'auth-btn showcase-buy-btn';
        btn.textContent = 'Unlock Slot ' + (slotIdx + 1) + ' - ' + cost.toLocaleString() + ' coins';
        btn.addEventListener('click', function() {
          var coins = typeof GameCoins !== 'undefined' ? GameCoins.getCoins() : 0;
          if (coins < cost) {
            alert('Not enough coins! You need ' + cost.toLocaleString() + ' coins.');
            return;
          }
          if (!confirm('Spend ' + cost.toLocaleString() + ' coins to unlock Slot ' + (slotIdx + 1) + '?')) return;
          if (typeof GameCoins !== 'undefined') GameCoins.spendCoins(cost);
          var c = loadConfig();
          c.slots = slotIdx + 1;
          while (c.selected.length < c.slots) c.selected.push(null);
          saveConfig(c);
          if (typeof AccountSync !== 'undefined' && AccountSync.markDirty) AccountSync.markDirty();
          renderEditor(slotsContainer, buyContainer);
        });
        buyContainer.appendChild(btn);
      })(j);
    }

    if (cfg.slots >= SLOT_COSTS.length) {
      var maxEl = document.createElement('p');
      maxEl.className = 'showcase-max-msg';
      maxEl.textContent = 'All showcase slots unlocked!';
      buyContainer.appendChild(maxEl);
    }

    
    var saveWrap = document.createElement('div');
    saveWrap.style.cssText = 'margin-top:10px;display:flex;align-items:center;gap:10px';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'auth-btn';
    saveBtn.textContent = 'Save Showcase';
    var saveStatus = document.createElement('span');
    saveStatus.style.cssText = 'font-size:0.85em;color:var(--ink-muted,#6b7280)';
    saveBtn.addEventListener('click', function() {
      saveBtn.disabled = true;
      saveStatus.textContent = 'Saving...';
      if (typeof AccountSync !== 'undefined' && AccountSync.saveProgress) {
        AccountSync.saveProgress().then(function(result) {
          saveBtn.disabled = false;
          if (result && result.success) {
            saveStatus.textContent = 'Saved!';
            if (result.awarded && result.awarded.length && typeof showNotification === 'function') {
              showNotification('Achievement unlocked: ' + result.awarded.join(', '));
            }
          } else {
            saveStatus.textContent = result && result.error ? result.error : 'Error saving.';
          }
          setTimeout(function() { saveStatus.textContent = ''; }, 3000);
        }).catch(function() {
          saveBtn.disabled = false;
          saveStatus.textContent = 'Error saving.';
          setTimeout(function() { saveStatus.textContent = ''; }, 3000);
        });
      } else {
        saveBtn.disabled = false;
        saveStatus.textContent = 'Not logged in.';
        setTimeout(function() { saveStatus.textContent = ''; }, 3000);
      }
    });
    saveWrap.appendChild(saveBtn);
    saveWrap.appendChild(saveStatus);
    slotsContainer.appendChild(saveWrap);
  }

  
  function init() {
    var toggle = document.querySelector('[data-section="showcase-section"]');
    if (!toggle) return;
    var initialized = false;
    toggle.addEventListener('click', function() {
      if (!initialized) {
        initialized = true;
        var slotsContainer = document.getElementById('showcase-slots-container');
        var buyContainer = document.getElementById('showcase-buy-slots');
        renderEditor(slotsContainer, buyContainer);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    renderPublic: renderPublic,
    renderEditor: renderEditor,
    getStatValue: getStatValue,
    loadConfig: loadConfig,
    STATS: STATS,
  };
})();
