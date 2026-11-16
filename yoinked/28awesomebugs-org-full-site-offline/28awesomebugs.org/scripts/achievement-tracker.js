(function() {
  'use strict';

  const VISITED_PAGES_KEY = '28bugs_visited_pages';
  const NUKE_COUNT_KEY = '28bugs_nuke_count';
  const LAST_CHECK_KEY = '28bugs_last_achievement_check';
  const CHECK_INTERVAL = 60 * 1000;

  function applyTagUpdates(result) {
    if (typeof AccountSync !== 'undefined' && AccountSync.applySaveResult) {
      AccountSync.applySaveResult(result);
    } else if (!result || !result.success) {
      return;
    } else if (result.tags && typeof AccountSync !== 'undefined') {
      const user = AccountSync.getUser();
      if (user) user.tags = result.tags;
    }
    if (result && result.success && result.awarded && result.awarded.length > 0 && typeof showNotification === 'function') {
      showNotification('Achievement unlocked: ' + result.awarded.join(', '));
    }
  }

  async function syncProgressAndTags(force) {
    if (typeof AccountSync === 'undefined') return;

    if (!AccountSync.isLoggedIn()) {
      try {
        await AccountSync.checkSession();
      } catch (e) {
        return;
      }
    }
    if (!AccountSync.isLoggedIn()) return;

    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0', 10);
    if (!force && now - lastCheck < CHECK_INTERVAL) return;

    try {
      const saveResult = await AccountSync.saveProgress();
      applyTagUpdates(saveResult);
      localStorage.setItem(LAST_CHECK_KEY, String(now));
    } catch (e) {
      console.warn('Error syncing progress for tag checks:', e);
    }
  }

  function trackPageVisit() {
    const pageName = getPageName();
    if (!pageName) return;

    let isNewVisit = false;
    try {
      const visited = JSON.parse(localStorage.getItem(VISITED_PAGES_KEY) || '[]');
      if (!visited.includes(pageName)) {
        visited.push(pageName);
        localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify(visited));
        isNewVisit = true;
      }
    } catch (e) {
      console.warn('Error tracking page visit:', e);
    }

    syncProgressAndTags(isNewVisit);
  }

  function getPageName() {
    const path = window.location.pathname.toLowerCase();

    if (path.includes('/index')) return 'index';
    if (path.includes('/playground')) return 'playground';
    if (path.includes('/fishing')) return 'fishing';
    if (path.includes('/games')) return 'games';
    if (path.includes('/forum')) return 'forum';
    if (path.includes('/education')) return 'education';
    if (path === '/' || path === '') return 'index';

    const match = path.match(/\/([^/]+)\.html?$/);
    return match ? match[1] : null;
  }

  window.trackNukeUsage = function() {
    try {
      const count = parseInt(localStorage.getItem(NUKE_COUNT_KEY) || '0', 10);
      localStorage.setItem(NUKE_COUNT_KEY, String(count + 1));
    } catch (e) {
      console.warn('Error tracking nuke usage:', e);
    }
    syncProgressAndTags(true);
  };

  async function checkAchievements(force) {
    await syncProgressAndTags(!!force);
  }

  document.addEventListener('DOMContentLoaded', trackPageVisit);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncProgressAndTags(false);
    }
  });

  window.AchievementTracker = {
    trackNukeUsage: window.trackNukeUsage,
    checkAchievements: checkAchievements,
    getPageName: getPageName,
    getVisitedPages: () => {
      try {
        return JSON.parse(localStorage.getItem(VISITED_PAGES_KEY) || '[]');
      } catch {
        return [];
      }
    },
    getNukeCount: () => {
      try {
        return parseInt(localStorage.getItem(NUKE_COUNT_KEY) || '0', 10);
      } catch {
        return 0;
      }
    }
  };
})();
