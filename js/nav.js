/* Shared page selector. To add a page, add one line to PAGES below.
   File paths are written from the site root (pages inside html/ set
   <base href="../"> so the same path works from every page).
   Every page calls SITE_NAV.build(containerElement, 'pageId', language). */
(function () {
  'use strict';

  var PAGES = [
    { id: 'home',     file: 'index.html',         en: 'Home',       ca: 'Inici' },
    { id: 'messages', file: 'html/messages.html', en: 'I was here', ca: 'Hi vaig ser aquí' },
    { id: 'staff',    file: 'html/staff.html',    en: 'Staff',      ca: 'Personal' },
    { id: 'sites',    file: 'html/sites.html',    en: 'More',       ca: 'Més' }
  ];

  function detectLanguage() {
    var requested = new URLSearchParams(location.search).get('lang');
    var saved = null;
    try { saved = localStorage.getItem('chambersCatLanguage'); } catch (_) {}
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    var device = langs.some(function (l) { return /^ca(?:-|$)/i.test(l); }) ? 'ca' : 'en';
    var language = requested === 'ca' || requested === 'en' ? requested : (saved === 'ca' || saved === 'en' ? saved : device);
    if (requested === 'ca' || requested === 'en') {
      try { localStorage.setItem('chambersCatLanguage', language); } catch (_) {}
    }
    return language;
  }

  function build(container, currentId, language) {
    language = language || window.SITE_LANGUAGE || window.PAGE_LANGUAGE || 'en';
    container.setAttribute('aria-label', language === 'ca' ? 'Pàgines' : 'Pages');
    container.replaceChildren();
    PAGES.forEach(function (page) {
      var label = page[language] || page.en;
      var item;
      if (page.id === currentId) {
        item = document.createElement('span');
        item.setAttribute('aria-current', 'page');
      } else {
        item = document.createElement('a');
        item.href = page.file + '?lang=' + language;
      }
      item.textContent = label;
      container.append(item);
    });

    // The cat button: switches the whole site to Catalan (and back to English).
    var file = location.pathname;
    var toggle = document.createElement('a');
    var target = language === 'ca' ? 'en' : 'ca';
    toggle.className = 'lang-toggle';
    toggle.href = file + '?lang=' + target;
    toggle.textContent = language === 'ca' ? 'eng' : 'cat';
    toggle.title = language === 'ca' ? 'Switch to English' : 'Canvia al català';
    container.append(toggle);
  }

  // The browser-tab title can't be styled with css, so keep it lowercase here.
  (function keepTitleLowercase() {
    function lower() {
      var lowered = document.title.toLowerCase();
      if (document.title !== lowered) document.title = lowered;
    }
    function watch() {
      var titleElement = document.querySelector('title');
      if (titleElement) new MutationObserver(lower).observe(titleElement, { childList: true, characterData: true, subtree: true });
      lower();
    }
    if (document.querySelector('title')) watch();
    else document.addEventListener('DOMContentLoaded', watch);
  })();

  window.SITE_NAV = { pages: PAGES, build: build, language: detectLanguage() };
})();
