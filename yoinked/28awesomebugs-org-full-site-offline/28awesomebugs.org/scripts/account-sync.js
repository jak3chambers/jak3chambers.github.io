


const AccountSync = (() => {
  const IS_LOCAL_PAGE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = (typeof window.__API_BASE === 'string' && window.__API_BASE.trim())
    ? window.__API_BASE.trim().replace(/\/$/, '')
    : (IS_LOCAL_PAGE ? 'http://localhost:3000' : 'https://api.28awesomebugs.org');
  // Absolute URLs include local API (http://localhost:3000). Only block sessions when a
  // local page points at a non-local API host (cookies won't match after reload).
  function isLocalHostname(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }
  const API_HOSTNAME = (function () {
    try {
      return new URL(API_BASE, window.location.href).hostname;
    } catch (_) {
      return '';
    }
  })();
  const BLOCK_CROSS_ENV_SESSION = IS_LOCAL_PAGE && !!API_HOSTNAME && !isLocalHostname(API_HOSTNAME);

  
  // Keep in sync with DONOTUPLOAD/progress-routes.js ALLOWED_SAVE_KEYS
  const SAVE_KEYS = [
    '28bugs_gameCoins',
    '28bugs_simPurchases',
    '28bugs_featureToggles',
    '28bugs_purchasedThemes',
    '28bugs_activeTheme',
    '28bugs_musicPurchases',
    '28bugs_musicCurrentKey',
    '28bugs_musicPlaying',
    '28bugs_musicShuffle',
    '28bugs_musicRepeatMode',
    '28bugs_musicKeepPlay',
    '28bugs_musicTime',
    '28bugs_musicShuffleAllow',
    '28bugs_musicVolume',
    '28bugs_bgPurchases',
    '28bugs_bgCurrentKey',
    '28bugs_selectedBiome',
    '28bugs_fishRecords',
    '28bugs_equipment_owned',
    '28bugs_equipped_rod',
    '28bugs_equipped_line',
    '28bugs_equipped_hook',
    '28bugs_fishing_upgrades',
    '28bugs_fishing_uncap_purchased',
    '28bugs_fishing_uncap_active',
    '28bugs_fishing_bait',
    '28bugs_equipped_bait',
    '28bugs_fishing_prestige',
    '28bugs_fishing_daily_log',
    '28bugs_fishing_hourly_bonus',
    '28bugs_fishing_settings',
    '28bugs_compass_owned',
    '28bugs_hardmode_enabled',
    '28bugs_hardmode_unlocked',
    '28bugs_hardmode_first_toggled',
    '28bugs_hardmode_bobbers_owned',
    '28bugs_hardmode_equipped_bobber',
    '28bugs_hardmode_upgrades',
    '28bugs_hardmode_bait',
    '28bugs_hardmode_equipped_bait',
    '28bugs_hardmode_welcome_suppressed',
    '28bugs_wish_expires',
    '28bugs_wish_amount',
    '28bugs_manualTimeValue',
    '28bugs_speedBoost',
    '28bugs_luckyCharm',
    '28bugs_luckyTagCount',
    '28bugs_wheelFixTokens',
    '28bugs_vipAccess',
    '28bugs_hasVisitedGames',
    '28bugs_playground',
    '28bugs_playground_state',
    '28bugs_builder_presets',
    '28bugs_show_handles',
    '28bugs_buddyShopOwned',
    '28bugs_inventory',
    '28bugs_habitat_w',
    '28bugs_habitat_h',
    '28bugs_panel_collapsed',
    '28bugs_inspector_w',
    '28bugs_soundSettings',
    '28bugs_leashSettings',
    '28bugs_faqNoShow',
    '28bugs_playdate_history',
    '28bugs_ringProfitUncapped',
    '28bugs_ringProfitWarningAcknowledged',
    '28bugs_nuke_count',
    '28bugs_visited_pages',
    'bugPetCustomized',
    'bugPetName',
    'bugPetBackstory',
    'bugPetBirthday',
    'bugPetIcon',
    '28bugs_bugPurchases',
    '28bugs_secretTacoClaimed',
    '28bugs_simFeedbackSent',
    '28bugs_maxSingleBet',
    '28bugs_supporters',
    '28bugs_supporters_names',
    '28bugs_haters',
    '28bugs_haters_names',
    '28bugs_memorialData',
    'simulacrum_run_save',
    'simulacrum_global_save',
    'simulacrumSettings',
    '28bugs_devMode',
    '28bugs_tetrisBestScore',
    '28bugs_datingCoupons',
    '28bugs_stock_portfolio',
    '28bugs_hardmode_records',
    
    '28bugs_tetris_best_normal',
    '28bugs_tetris_best_sprint',
    '28bugs_tetris_best_ultra',
    '28bugs_tetris_best_dig',
    '28bugs_tetris_best_swarm',
    '28bugs_tetris_best_perfection',
    
    '28bugs_bugsweeper_best_easy',
    '28bugs_bugsweeper_best_medium',
    '28bugs_bugsweeper_best_hard',
    
    '28bugs_stat_showcase',
    
    '28bugs_stat_wheel_spins',
    '28bugs_stat_rocks_added',
    '28bugs_stat_blackjack_wins',
    '28bugs_stat_bugrace_wins',
    '28bugs_stat_highlow_wins',
    '28bugs_stat_poker_wins',
    '28bugs_stat_solitaire_wins',
    '28bugs_stat_roulette_wins',
    '28bugs_stat_money_won',
    '28bugs_stat_money_lost',
    '28bugs_buggle_endless',
    '28bugs_buggle_dist',
    '28bugs_buggle_local_stats',
    '28bugs_poker_casinoId',
    '28bugs_poker_playerStack',
    '28bugs_poker_dealerIndex',
    '28bugs_poker_cpuStacks',
    '28bugs_poker_handState',

    '28bugs_bugos_dollars',
    '28bugs_bugos_accountLedger',
    '28bugs_bugos_mail',
    '28bugs_bugos_storeOwned',
    '28bugs_bugos_friendboxBuddy',
  ];

  const SAVE_KEYS_SET = new Set(SAVE_KEYS);

  let _currentUser = null;
  let _dirty = false;
  let _saveTimer = null;
  let _visibilityListener = null;
  let _unloadListener = null;
  let _lastSaveSnapshot = null;
  let _pendingDeletedKeys = [];
  let _knownSavedAt = null;
  let _conflictPromptOpen = false;

  const SESSION_HINT_KEY = '28bugs_has_session';
  const LOCAL_MODIFIED_KEY = '28bugs_localModifiedAt';
  const LAST_SYNC_KEY = '28bugs_lastSyncTime';
  const CLOUD_SAVED_AT_KEY = '28bugs_cloudSavedAt';
  // Keep in sync with DONOTUPLOAD/progress-routes.js MAX_SAVE_BYTES
  const MAX_SAVE_PAYLOAD_BYTES = 512 * 1024;

  const BULKY_SAVE_KEYS = [
    '28bugs_playground_state',
    '28bugs_builder_presets',
    '28bugs_playdate_history',
    'simulacrum_run_save',
    '28bugs_playground',
    '28bugs_inventory',
    '28bugs_bugos_mail',
  ];

  const BULKY_SAVE_LABELS = {
    '28bugs_playground_state': 'Playground builder layout',
    '28bugs_builder_presets': 'Playground builder presets',
    '28bugs_playdate_history': 'Playdate history',
    'simulacrum_run_save': 'Simulacrum run in progress',
    '28bugs_playground': 'Bug Buddy save',
    '28bugs_inventory': 'Bug Buddy inventory',
    '28bugs_bugos_mail': 'BugOS mailbox',
  };

  // High-water marks only - never put spendable wallets here (Math.max undoes spends).
  const MERGE_MAX_INT = new Set([
    '28bugs_wish_amount',
    '28bugs_wish_expires',
    '28bugs_manualTimeValue',
    '28bugs_nuke_count',
    '28bugs_maxSingleBet',
    '28bugs_luckyTagCount',
    '28bugs_wheelFixTokens',
    '28bugs_tetrisBestScore',
    '28bugs_tetris_best_normal',
    '28bugs_tetris_best_ultra',
    '28bugs_tetris_best_swarm',
    '28bugs_tetris_best_perfection',
    '28bugs_bugsweeper_best_easy',
    '28bugs_bugsweeper_best_medium',
    '28bugs_bugsweeper_best_hard',
    '28bugs_stat_wheel_spins',
    '28bugs_stat_rocks_added',
    '28bugs_stat_blackjack_wins',
    '28bugs_stat_bugrace_wins',
    '28bugs_stat_highlow_wins',
    '28bugs_stat_poker_wins',
    '28bugs_stat_solitaire_wins',
    '28bugs_stat_roulette_wins',
    '28bugs_stat_money_won',
    '28bugs_stat_money_lost',
  ]);

  const SPENDABLE_WALLETS = new Set([
    '28bugs_gameCoins',
    '28bugs_bugos_dollars',
  ]);

  const MERGE_MIN_INT = new Set([
    '28bugs_tetris_best_sprint',
    '28bugs_tetris_best_dig',
  ]);

  // Keep in sync with DONOTUPLOAD/progress-routes.js ALLOWED_SAVE_KEY_PREFIXES
  const DYNAMIC_KEY_PREFIXES = [
    '28bugs_buggle_',
  ];

  function isServerSyncKey(key) {
    if (!key || typeof key !== 'string') return false;
    if (SAVE_KEYS_SET.has(key)) return true;
    return DYNAMIC_KEY_PREFIXES.some(function (prefix) { return key.startsWith(prefix); });
  }

  function getDynamicKeys() {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && isServerSyncKey(k) && !SAVE_KEYS_SET.has(k)) {
          keys.push(k);
        }
      }
    } catch (_) {}
    return keys;
  }

  function getAllSyncKeys(local, cloud) {
    const keys = new Set(SAVE_KEYS);
    for (const k of getDynamicKeys()) keys.add(k);
    if (local) {
      for (const k of Object.keys(local)) {
        if (isServerSyncKey(k)) keys.add(k);
      }
    }
    if (cloud) {
      for (const k of Object.keys(cloud)) {
        if (isServerSyncKey(k)) keys.add(k);
      }
    }
    return keys;
  }

  const MERGE_JSON_OR = new Set([
    '28bugs_simPurchases',
    '28bugs_featureToggles',
    '28bugs_musicPurchases',
    '28bugs_bgPurchases',
    '28bugs_bugPurchases',
    '28bugs_buddyShopOwned',
    '28bugs_fishing_upgrades',
    '28bugs_secretTacoClaimed',
    '28bugs_simFeedbackSent',
    '28bugs_speedBoost',
    '28bugs_luckyCharm',
    '28bugs_vipAccess',
    '28bugs_hasVisitedGames',
    '28bugs_fishing_uncap_purchased',
    '28bugs_fishing_uncap_active',
    '28bugs_fishing_bait',
    '28bugs_fishing_prestige',
    '28bugs_fishing_daily_log',
    '28bugs_fishing_hourly_bonus',
    '28bugs_fishing_settings',
    '28bugs_hardmode_upgrades',
    '28bugs_hardmode_bait',
    '28bugs_ringProfitUncapped',
    '28bugs_ringProfitWarningAcknowledged',
    '28bugs_devMode',
  ]);

  function parseIntSafe(val) {
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function mergeJsonOr(a, b) {
    try {
      const A = JSON.parse(a || '{}') || {};
      const B = JSON.parse(b || '{}') || {};
      const out = Object.assign({}, B, A);
      for (const key of Object.keys(B)) {
        if (typeof B[key] === 'boolean') out[key] = !!(A[key] || B[key]);
      }
      for (const key of Object.keys(A)) {
        if (typeof A[key] === 'boolean') out[key] = !!(A[key] || B[key]);
      }
      return JSON.stringify(out);
    } catch {
      return a || b;
    }
  }

  function mergeThemeArray(a, b) {
    try {
      const A = JSON.parse(a || '[]') || [];
      const B = JSON.parse(b || '[]') || [];
      return JSON.stringify(Array.from(new Set([].concat(A, B))));
    } catch {
      return a || b;
    }
  }

  function parseOwnedIdList(raw) {
    try {
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => typeof id === 'string' && id);
      }
      if (parsed && typeof parsed === 'object') {
        const ids = [];
        for (const key of Object.keys(parsed)) {
          const v = parsed[key];
          if (typeof v === 'string' && v) ids.push(v);
          else if (v && !/^\d+$/.test(key)) ids.push(key);
        }
        return ids;
      }
    } catch {}
    return [];
  }

  function mergeOwnedIdList(a, b) {
    return JSON.stringify(Array.from(new Set(parseOwnedIdList(a).concat(parseOwnedIdList(b)))));
  }

  function mergeBugosMail(a, b) {
    try {
      const A = JSON.parse(a || '{}') || {};
      const B = JSON.parse(b || '{}') || {};
      const byId = Object.create(null);
      function ingest(data) {
        const messages = Array.isArray(data.messages) ? data.messages : [];
        for (let i = 0; i < messages.length; i++) {
          const mail = messages[i];
          if (!mail || !mail.id) continue;
          const prev = byId[mail.id];
          if (!prev || (Number(mail.at) || 0) >= (Number(prev.at) || 0)) {
            byId[mail.id] = mail;
          }
        }
      }
      ingest(A);
      ingest(B);
      return JSON.stringify({
        seeded: !!(A.seeded || B.seeded),
        messages: Object.keys(byId).map(function(id) { return byId[id]; })
      });
    } catch {
      return a || b;
    }
  }

  function mergeFishRecords(a, b) {
    try {
      const A = JSON.parse(a || '{}') || {};
      const B = JSON.parse(b || '{}') || {};
      const out = Object.assign({}, A);
      for (const [id, rec] of Object.entries(B)) {
        if (!out[id]) {
          out[id] = rec;
          continue;
        }
        out[id] = Object.assign({}, out[id], rec, {
          numberCaught: Math.max(parseIntSafe(out[id].numberCaught), parseIntSafe(rec.numberCaught)),
        });
      }
      return JSON.stringify(out);
    } catch {
      return a || b;
    }
  }

  function mergeProgressData(local, cloud) {
    const localModified = parseIntSafe(localStorage.getItem(LOCAL_MODIFIED_KEY));
    const lastSync = parseIntSafe(localStorage.getItem(LAST_SYNC_KEY));
    const preferLocal = localModified > lastSync;
    const merged = {};

    for (const key of getAllSyncKeys(local, cloud)) {
      const lv = local[key];
      const cv = cloud[key];
      if (lv == null && cv == null) continue;
      if (lv == null) {
        // Respect intentional local deletions - cloud sync was restoring cleared data.
        if (preferLocal) continue;
        merged[key] = cv;
        continue;
      }
      if (cv == null) { merged[key] = lv; continue; }
      if (lv === cv) { merged[key] = lv; continue; }

      if (SPENDABLE_WALLETS.has(key)) {
        // Spendable wallets - never Math.max (that undoes spends).
        merged[key] = preferLocal ? lv : cv;
      } else if (MERGE_MAX_INT.has(key)) {
        merged[key] = preferLocal
          ? lv
          : String(Math.max(parseIntSafe(lv), parseIntSafe(cv)));
      } else if (MERGE_MIN_INT.has(key)) {
        const a = parseIntSafe(lv);
        const b = parseIntSafe(cv);
        if (a <= 0) merged[key] = String(b);
        else if (b <= 0) merged[key] = String(a);
        else merged[key] = String(Math.min(a, b));
      } else if (MERGE_JSON_OR.has(key)) {
        merged[key] = mergeJsonOr(lv, cv);
      } else if (key === '28bugs_purchasedThemes') {
        merged[key] = mergeThemeArray(lv, cv);
      } else if (key === '28bugs_equipment_owned' || key === '28bugs_hardmode_bobbers_owned') {
        merged[key] = mergeOwnedIdList(lv, cv);
      } else if (key === '28bugs_bugos_storeOwned') {
        // Grants union; intentional uninstalls win when local is newer.
        merged[key] = preferLocal ? lv : mergeThemeArray(lv, cv);
      } else if (key === '28bugs_bugos_mail') {
        merged[key] = preferLocal ? lv : mergeBugosMail(lv, cv);
      } else if (key === '28bugs_fishRecords' || key === '28bugs_hardmode_records') {
        merged[key] = mergeFishRecords(lv, cv);
      } else if (preferLocal) {
        merged[key] = lv;
      } else if (String(lv).length !== String(cv).length) {
        merged[key] = String(lv).length > String(cv).length ? lv : cv;
      } else {
        merged[key] = lv;
      }
    }
    return merged;
  }

  function getLocalSaveData() {
    const data = {};
    for (const key of SAVE_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
    for (const key of getDynamicKeys()) {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
    return data;
  }

  function applyProgressData(data, options = {}) {
    const replaceSyncKeys = !!options.replaceSyncKeys;
    if (replaceSyncKeys) {
      const incoming = new Set(Object.keys(data || {}));
      const existing = getLocalSaveData();
      for (const key of Object.keys(existing)) {
        if (!incoming.has(key)) {
          try {
            localStorage.removeItem(key);
          } catch (_) {}
        }
      }
    }
    for (const [key, value] of Object.entries(data || {})) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('[AccountSync] Could not apply save key ' + key + ':', e);
      }
    }
  }

  function touchLocalSave() {
    try {
      localStorage.setItem(LOCAL_MODIFIED_KEY, Date.now().toString());
    } catch (e) {
      console.warn('[AccountSync] Could not update local modified timestamp:', e);
    }
    markDirty();
  }

  function hasLocalProgress() {
    return Object.keys(getLocalSaveData()).length > 0;
  }

  function isLocalDirty() {
    const lastSync = parseIntSafe(localStorage.getItem(LAST_SYNC_KEY));
    const localModified = parseIntSafe(localStorage.getItem(LOCAL_MODIFIED_KEY));
    if (!localModified) return false;
    if (!lastSync) return true;
    return localModified > lastSync;
  }

  function rememberCloudSavedAt(savedAt) {
    if (!savedAt || typeof savedAt !== 'string') return;
    _knownSavedAt = savedAt;
    try {
      localStorage.setItem(CLOUD_SAVED_AT_KEY, savedAt);
    } catch (_) {}
  }

  /** Advance the conflict watermark after a server write outside /progress/save (e.g. FriendBox). */
  function acknowledgeCloudSavedAt(savedAt) {
    rememberCloudSavedAt(savedAt);
  }

  function getKnownSavedAt() {
    if (_knownSavedAt) return _knownSavedAt;
    try {
      return localStorage.getItem(CLOUD_SAVED_AT_KEY);
    } catch (_) {
      return null;
    }
  }

  function notifyProgressSynced() {
    try {
      window.dispatchEvent(new CustomEvent('28bugs-progress-synced'));
    } catch (_) {}
  }

  function applySaveResult(result) {
    if (!result || !result.success) return;
    if (result.tags && _currentUser) {
      _currentUser.tags = result.tags;
    }
    try {
      window.dispatchEvent(new CustomEvent('28bugs-tags-updated', {
        detail: {
          tags: result.tags || (_currentUser && _currentUser.tags) || [],
          awarded: result.awarded || [],
          removed: result.removed || [],
        },
      }));
    } catch (_) {}
  }

  function computeSaveData() {
    const data = {};
    for (const key of SAVE_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
    for (const key of getDynamicKeys()) {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
    }
    return JSON.stringify(data);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getSaveSizeReport() {
    const keys = [];
    let total = 0;
    const allKeys = SAVE_KEYS.concat(getDynamicKeys());
    for (const key of allKeys) {
      const val = localStorage.getItem(key);
      if (val === null) continue;
      const bytes = new Blob([val]).size;
      total += bytes;
      keys.push({ key, label: BULKY_SAVE_LABELS[key] || key, bytes });
    }
    keys.sort((a, b) => b.bytes - a.bytes);
    return { total, keys };
  }

  function queueSaveKeyDeletion(key) {
    if (!isServerSyncKey(key)) return;
    if (_pendingDeletedKeys.indexOf(key) === -1) _pendingDeletedKeys.push(key);
  }

  function removeSaveKeys(keys) {
    const removed = [];
    for (const key of keys) {
      if (!isServerSyncKey(key)) continue;
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          removed.push(key);
          queueSaveKeyDeletion(key);
        }
      } catch (_) {}
    }
    if (removed.length) touchLocalSave();
    return removed;
  }

  function wireValue(key, value) {
    if (typeof SaveCompress !== 'undefined' && SaveCompress.compressForTransfer) {
      return SaveCompress.compressForTransfer(key, value);
    }
    return value;
  }

  function unwiredValue(key, value) {
    if (typeof SaveCompress !== 'undefined' && SaveCompress.decompressFromTransfer) {
      return SaveCompress.decompressFromTransfer(key, value);
    }
    return value;
  }

  function normalizeCloudData(cloud) {
    const out = {};
    for (const [key, value] of Object.entries(cloud || {})) {
      out[key] = unwiredValue(key, value);
    }
    return out;
  }

  function estimatePayloadBytes(data) {
    if (typeof SaveCompress !== 'undefined' && SaveCompress.estimatePayloadBytes) {
      return SaveCompress.estimatePayloadBytes(data);
    }
    return Object.entries(data).reduce((sum, [k, v]) => sum + k.length + String(v).length, 0);
  }

  function tooLargeSaveResult(payloadBytes) {
    const report = getSaveSizeReport();
    const top = report.keys.slice(0, 3).map((k) => BULKY_SAVE_LABELS[k.key] || k.key).join(', ');
    return {
      success: false,
      error: 'Save data too large (' + formatBytes(payloadBytes) + ' of ' + formatBytes(MAX_SAVE_PAYLOAD_BYTES) + ' max). '
        + 'Open Profile → Cloud Save and use "Trim bulky data & save" to free space'
        + (top ? ' (largest: ' + top + ').' : '.'),
      tooLarge: true,
      payloadBytes,
      sizeReport: report,
    };
  }

  function buildSavePayload(options = {}) {
    const exclude = new Set(options.excludeKeys || []);
    const skipCompress = !!options.skipCompress;
    const data = {};
    for (const key of getAllSyncKeys()) {
      if (exclude.has(key)) continue;
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = skipCompress ? val : wireValue(key, val);
    }
    return data;
  }

  function resetLocalModifiedAfterCloudOverwrite() {
    const t = Date.now().toString();
    localStorage.setItem(LAST_SYNC_KEY, t);
    localStorage.setItem(LOCAL_MODIFIED_KEY, t);
  }

  function detectSaveConflict(local, cloud, savedAt) {
    const lastSync = parseIntSafe(localStorage.getItem(LAST_SYNC_KEY));
    const localModified = parseIntSafe(localStorage.getItem(LOCAL_MODIFIED_KEY));
    if (!lastSync || !localModified) return false;
    if (JSON.stringify(local) === JSON.stringify(cloud)) return false;
    const localChanged = localModified > lastSync;
    let cloudChanged = false;
    if (savedAt) {
      const cloudTs = Date.parse(savedAt);
      if (Number.isFinite(cloudTs)) cloudChanged = cloudTs > lastSync;
    }
    return localChanged && cloudChanged;
  }

  function ensureConflictModal() {
    var modal = document.getElementById('save-conflict-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'save-conflict-modal';
    modal.className = 'modal';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.innerHTML =
      '<div class="modal-content" style="max-width:420px;text-align:left">' +
        '<h2 style="margin:0 0 8px 0">Save Conflict</h2>' +
        '<p style="margin:0 0 12px 0">This device and the cloud both have newer progress. Choose which copy to keep.</p>' +
        '<p style="margin:0 0 4px 0;font-size:0.9em">Local changed: <span id="conflict-local-date">Unknown</span></p>' +
        '<p style="margin:0 0 16px 0;font-size:0.9em">Cloud saved: <span id="conflict-cloud-date">Unknown</span></p>' +
        '<div class="save-conflict-options" style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button type="button" id="conflict-use-local" class="save-conflict-btn auth-btn">Keep this device</button>' +
          '<button type="button" id="conflict-use-cloud" class="save-conflict-btn auth-btn">Load cloud save</button>' +
        '</div>' +
        '<p style="margin:12px 0 0 0;font-size:0.85em;opacity:0.8">You must choose - closing without a choice keeps local data and does not load cloud.</p>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }

  function promptSaveConflict(savedAt) {
    return new Promise(function(resolve) {
      if (_conflictPromptOpen) {
        resolve('abort');
        return;
      }
      var modal = ensureConflictModal();
      _conflictPromptOpen = true;
      var localEl = document.getElementById('conflict-local-date');
      var cloudEl = document.getElementById('conflict-cloud-date');
      var localModified = parseIntSafe(localStorage.getItem(LOCAL_MODIFIED_KEY));
      if (localEl) {
        localEl.textContent = localModified
          ? new Date(localModified).toLocaleString()
          : 'Unknown';
      }
      if (cloudEl) {
        cloudEl.textContent = savedAt
          ? new Date(savedAt).toLocaleString()
          : 'Unknown';
      }
      var localBtn = document.getElementById('conflict-use-local');
      var cloudBtn = document.getElementById('conflict-use-cloud');
      function cleanup() {
        if (localBtn) localBtn.removeEventListener('click', onLocal);
        if (cloudBtn) cloudBtn.removeEventListener('click', onCloud);
        modal.removeEventListener('click', onBackdrop);
        _conflictPromptOpen = false;
      }
      function finish(choice) {
        cleanup();
        modal.style.display = 'none';
        resolve(choice);
      }
      function onLocal() { finish('local'); }
      function onCloud() { finish('cloud'); }
      function onBackdrop(e) {
        if (e.target === modal) finish('abort');
      }
      if (localBtn) localBtn.addEventListener('click', onLocal);
      if (cloudBtn) cloudBtn.addEventListener('click', onCloud);
      modal.addEventListener('click', onBackdrop);
      modal.style.display = 'block';
    });
  }

  function parsePlaygroundBuddy(value) {
    if (!value || typeof value !== 'string') return null;
    const raw = unwiredValue('28bugs_playground', value);
    try {
      const buddy = JSON.parse(raw);
      return (buddy && buddy.name) ? buddy : null;
    } catch (_) {
      return null;
    }
  }

  async function loadCloudPlaygroundBuddy() {
    const result = await loadProgress({ readOnly: true });
    if (!result.success || !result.data) {
      return { buddy: null, savedAt: result.savedAt || null };
    }
    return {
      buddy: parsePlaygroundBuddy(result.data['28bugs_playground']),
      savedAt: result.savedAt || null,
    };
  }

  function estimateWireSaveBytes() {
    return estimatePayloadBytes(buildSavePayload());
  }

  async function checkSession() {
    if (BLOCK_CROSS_ENV_SESSION) {
      _currentUser = null;
      localStorage.removeItem(SESSION_HINT_KEY);
      return null;
    }
    try {
      const res = await fetch(API_BASE + '/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        _currentUser = null;
        localStorage.removeItem(SESSION_HINT_KEY);
        return null;
      }
      const data = await res.json();
      _currentUser = data.success ? data.user : null;
      if (!_currentUser) localStorage.removeItem(SESSION_HINT_KEY);
      return _currentUser;
    } catch { _currentUser = null; return null; }
  }

  async function signup(username, password, email) {
    const body = { username, password };
    if (email) body.email = email;
    const res = await fetch(API_BASE + '/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      _currentUser = data.user;
      localStorage.setItem(SESSION_HINT_KEY, '1');
      startAutoSave(30000);
      data.cloudSync = await loadCloudOnAuth({ reason: 'signup' });
    }
    return data;
  }

  async function login(username, password) {
    const res = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      _currentUser = data.user;
      localStorage.setItem(SESSION_HINT_KEY, '1');
      startAutoSave(30000);
      data.cloudSync = await loadCloudOnAuth({ reason: 'login' });
    }
    return data;
  }

  async function logout() {
    const res = await fetch(API_BASE + '/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    _currentUser = null;
    localStorage.removeItem(SESSION_HINT_KEY);
    stopAutoSave();
    return res.json();
  }

  async function postSavePayload(data, deletedKeys, force) {
    const res = await fetch(API_BASE + '/api/progress/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        data,
        deletedKeys,
        knownSavedAt: getKnownSavedAt() || undefined,
        force: !!force,
      })
    });
    return res;
  }

  async function saveProgress(options = {}) {
    if (!_currentUser) return { success: false, error: 'Not logged in' };
    const data = buildSavePayload(options);
    const payloadBytes = estimatePayloadBytes(data);
    if (payloadBytes > MAX_SAVE_PAYLOAD_BYTES) {
      return tooLargeSaveResult(payloadBytes);
    }
    const extraDeleted = Array.isArray(options.deletedKeys) ? options.deletedKeys : [];
    const deletedKeys = Array.from(new Set(
      _pendingDeletedKeys.concat(extraDeleted).filter(isServerSyncKey)
    ));
    let force = !!options.force;

    async function handleResponse(res) {
      if (res.status === 401) {
        _currentUser = null;
        localStorage.removeItem(SESSION_HINT_KEY);
        stopAutoSave();
        return { success: false, error: 'Session expired' };
      }
      if (res.status === 409) {
        const errBody = await res.json().catch(() => ({}));
        if (errBody.serverSavedAt) rememberCloudSavedAt(errBody.serverSavedAt);
        return {
          success: false,
          conflict: true,
          error: errBody.error || 'Cloud save is newer than this device.',
          serverSavedAt: errBody.serverSavedAt || null,
        };
      }
      if (res.status === 413) {
        return tooLargeSaveResult(payloadBytes);
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 400 && errBody.error && /size|large/i.test(errBody.error)) {
          return tooLargeSaveResult(payloadBytes);
        }
        return { success: false, error: errBody.error || `Save failed (HTTP ${res.status}).` };
      }
      const result = await res.json();
      if (result.success) {
        _dirty = false;
        _lastSaveSnapshot = computeSaveData();
        // Confirmed sync time only - do not clear localModified (that hides real edits).
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        if (result.savedAt) rememberCloudSavedAt(result.savedAt);
        if (deletedKeys.length) {
          _pendingDeletedKeys = _pendingDeletedKeys.filter(function(k) {
            return deletedKeys.indexOf(k) === -1;
          });
        }
        applySaveResult(result);
      }
      return result;
    }

    let res = await postSavePayload(data, deletedKeys, force);
    let result = await handleResponse(res);
    if (result.conflict && !force && isLocalDirty()) {
      force = true;
      res = await postSavePayload(data, deletedKeys, true);
      result = await handleResponse(res);
    }
    return result;
  }

  async function trimBulkySaveAndSync(keys = BULKY_SAVE_KEYS) {
    const removed = removeSaveKeys(keys);
    if (!removed.length) {
      return { success: false, error: 'No bulky save data found to remove.' };
    }
    const result = await saveProgress({ force: true });
    return Object.assign({ removed }, result);
  }

  async function loadProgress(options = {}) {
    if (!_currentUser) return { success: false, error: 'Not logged in' };
    const res = await fetch(API_BASE + '/api/progress/load', { credentials: 'include' });
    if (!res.ok) return { success: false, error: `Load failed (HTTP ${res.status}).` };
    const result = await res.json();
    if (result.success && result.data) {
      const cloud = normalizeCloudData(result.data);
      result.data = cloud;
      if (result.savedAt) rememberCloudSavedAt(result.savedAt);
      if (!options.readOnly) {
        if (options.merge) {
          const local = getLocalSaveData();
          applyProgressData(mergeProgressData(local, cloud));
        } else if (options.overwriteLocal) {
          applyProgressData(cloud, { replaceSyncKeys: true });
        } else {
          for (const [key, value] of Object.entries(cloud)) {
            if (localStorage.getItem(key) === null) {
              localStorage.setItem(key, value);
            }
          }
        }
        if (options.overwriteLocal || options.merge) {
          _lastSaveSnapshot = computeSaveData();
          if (options.overwriteLocal) {
            resetLocalModifiedAfterCloudOverwrite();
          } else {
            localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
          }
        }
      }
    }
    return result;
  }

  async function hydrateIfEmpty() {
    if (!_currentUser) return { success: false, error: 'Not logged in' };
    if (hasLocalProgress()) {
      return { success: true, action: 'skipped_has_local' };
    }
    try {
      const result = await loadProgress({ readOnly: true });
      if (!result.success) return result;
      const cloud = result.data || {};
      if (!Object.keys(cloud).length) {
        return { success: true, action: 'empty' };
      }
      applyProgressData(cloud, { replaceSyncKeys: true });
      _lastSaveSnapshot = computeSaveData();
      resetLocalModifiedAfterCloudOverwrite();
      if (result.savedAt) rememberCloudSavedAt(result.savedAt);
      notifyProgressSynced();
      if (typeof location !== 'undefined') location.reload();
      return { success: true, action: 'hydrated' };
    } catch (err) {
      console.warn('[AccountSync] hydrateIfEmpty failed:', err);
      return { success: false, error: String(err) };
    }
  }

  async function loadCloudOnAuth(options = {}) {
    if (!_currentUser) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch(API_BASE + '/api/progress/load', { credentials: 'include' });
      if (!res.ok) return { success: false, error: `Load failed (HTTP ${res.status}).` };
      const result = await res.json();
      const cloud = normalizeCloudData((result.success && result.data) ? result.data : {});
      const local = getLocalSaveData();
      const hasCloud = Object.keys(cloud).length > 0;
      const hasLocal = Object.keys(local).length > 0;
      if (result.savedAt) rememberCloudSavedAt(result.savedAt);

      if (!hasCloud && hasLocal) {
        const saveResult = await saveProgress({ force: true });
        notifyProgressSynced();
        return Object.assign({ action: 'uploaded_local' }, saveResult);
      }
      if (!hasLocal && hasCloud) {
        applyProgressData(cloud, { replaceSyncKeys: true });
        _lastSaveSnapshot = computeSaveData();
        resetLocalModifiedAfterCloudOverwrite();
        notifyProgressSynced();
        if (typeof location !== 'undefined') location.reload();
        return { success: true, action: 'loaded_cloud' };
      }
      if (!hasCloud && !hasLocal) {
        return { success: true, action: 'empty' };
      }

      const lastSync = parseIntSafe(localStorage.getItem(LAST_SYNC_KEY));
      const localModified = parseIntSafe(localStorage.getItem(LOCAL_MODIFIED_KEY));
      const localDirty = !lastSync || localModified > lastSync;
      let cloudDirty = false;
      if (result.savedAt) {
        const cloudTs = Date.parse(result.savedAt);
        if (Number.isFinite(cloudTs)) {
          cloudDirty = !lastSync || cloudTs > lastSync;
        } else if (!lastSync) {
          cloudDirty = true;
        }
      }

      const localJson = JSON.stringify(local);
      const cloudJson = JSON.stringify(cloud);
      if (localJson === cloudJson) {
        _lastSaveSnapshot = computeSaveData();
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        notifyProgressSynced();
        return { success: true, action: 'unchanged' };
      }

      if ((localDirty && cloudDirty) || (!localDirty && !cloudDirty)) {
        const choice = await promptSaveConflict(result.savedAt);
        if (choice === 'local') {
          const saveResult = await saveProgress({ force: true });
          notifyProgressSynced();
          return Object.assign({ action: 'conflict_local' }, saveResult);
        }
        if (choice === 'cloud') {
          applyProgressData(cloud, { replaceSyncKeys: true });
          _lastSaveSnapshot = computeSaveData();
          resetLocalModifiedAfterCloudOverwrite();
          notifyProgressSynced();
          if (typeof location !== 'undefined') location.reload();
          return { success: true, action: 'conflict_cloud' };
        }
        return {
          success: false,
          action: 'conflict_aborted',
          error: 'Conflict unresolved - local data kept, cloud not loaded.',
        };
      }

      if (cloudDirty && !localDirty) {
        applyProgressData(cloud, { replaceSyncKeys: true });
        _lastSaveSnapshot = computeSaveData();
        resetLocalModifiedAfterCloudOverwrite();
        notifyProgressSynced();
        if (typeof location !== 'undefined') location.reload();
        return { success: true, action: 'loaded_cloud' };
      }

      const saveResult = await saveProgress({ force: true });
      notifyProgressSynced();
      return Object.assign({ action: 'kept_local' }, saveResult);
    } catch (err) {
      console.warn('[AccountSync] loadCloudOnAuth failed:', err);
      return { success: false, error: String(err) };
    }
  }

  // Backward-compatible alias: auth-time load only (no merge-on-navigation).
  async function syncOnPageLoad() {
    return loadCloudOnAuth({ reason: 'legacy_syncOnPageLoad' });
  }

  function markDirty() { _dirty = true; }

  function startAutoSave(intervalMs) {
    stopAutoSave();

    const interval = intervalMs || 30 * 1000;

    if (_lastSaveSnapshot === null) {
      _lastSaveSnapshot = computeSaveData();
    }

    _saveTimer = setInterval(() => {
      if (_currentUser) {
        const snapshot = computeSaveData();
        if (snapshot !== _lastSaveSnapshot) {
          saveProgress().catch(err => console.error('[AccountSync] Auto-save failed:', err));
        }
      }
    }, interval);

    _visibilityListener = () => {
      if (document.hidden && _currentUser) {
        const snapshot = computeSaveData();
        if (snapshot !== _lastSaveSnapshot) {
          saveProgress().catch(err => console.warn('[AccountSync] Page-hide save failed:', err));
        }
      }
    };
    document.addEventListener('visibilitychange', _visibilityListener);

    _unloadListener = () => {
      if (!_currentUser) return;
      const snapshot = computeSaveData();
      if (snapshot === _lastSaveSnapshot) return;
      const data = buildSavePayload();
      if (estimatePayloadBytes(data) > MAX_SAVE_PAYLOAD_BYTES) return;
      const deletedKeys = _pendingDeletedKeys.filter(isServerSyncKey);
      const body = JSON.stringify({
        data,
        deletedKeys,
        knownSavedAt: getKnownSavedAt() || undefined,
        force: isLocalDirty(),
      });
      try {
        fetch(API_BASE + '/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: body,
        }).catch(function () {});
      } catch (_) {}
    };
    window.addEventListener('beforeunload', _unloadListener);
  }

  function stopAutoSave() {
    if (_saveTimer) {
      clearInterval(_saveTimer);
      _saveTimer = null;
    }
    if (_visibilityListener) {
      document.removeEventListener('visibilitychange', _visibilityListener);
      _visibilityListener = null;
    }
    if (_unloadListener) {
      window.removeEventListener('beforeunload', _unloadListener);
      _unloadListener = null;
    }
  }

  function getUser() { return _currentUser; }
  function isLoggedIn() { return !!_currentUser; }

  function prepareAuthIdentifierFields() {
    ['login-username', 'forgot-username'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('maxlength', '254');
    });
  }

  async function initializeOnPageLoad() {
    prepareAuthIdentifierFields();
    if (!localStorage.getItem(SESSION_HINT_KEY)) return;
    if (BLOCK_CROSS_ENV_SESSION) {
      localStorage.removeItem(SESSION_HINT_KEY);
      return;
    }
    try {
      const user = await checkSession();
      if (user) {
        startAutoSave(30000);
        const hyd = await hydrateIfEmpty();
        if (!hyd || hyd.action !== 'hydrated') notifyProgressSynced();
      } else {
        notifyProgressSynced();
      }
    } catch (err) {
      console.warn('[AccountSync] Initialization failed:', err);
    }
  }

  return {
    SAVE_KEYS,
    BULKY_SAVE_KEYS,
    BULKY_SAVE_LABELS,
    MAX_SAVE_PAYLOAD_BYTES,
    checkSession,
    signup,
    login,
    logout,
    saveProgress,
    trimBulkySaveAndSync,
    removeSaveKeys,
    getSaveSizeReport,
    formatBytes,
    estimateWireSaveBytes,
    loadProgress,
    loadCloudPlaygroundBuddy,
    parsePlaygroundBuddy,
    syncOnPageLoad,
    loadCloudOnAuth,
    hydrateIfEmpty,
    mergeProgressData,
    touchLocalSave,
    markDirty,
    startAutoSave,
    stopAutoSave,
    getUser,
    isLoggedIn,
    applySaveResult,
    acknowledgeCloudSavedAt,
    initializeOnPageLoad,
  };
})();


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AccountSync.initializeOnPageLoad());
} else {
  AccountSync.initializeOnPageLoad();
}
