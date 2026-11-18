/* ===========================================================
   keypad.js - the lock button on the home page: the keypad window, the
   screws, the letter keyboard, and running codes.

   You shouldn't need to edit this file:
     - what each code does:  config/keypad-codes.js (plain codes anyone can read in the source)
     - secret codes:         tools/encrypt-codes.html makes config/keypad-secrets.js (scrambled)
     - the words on the keypad (labels, both languages): SITE_CONFIG in index.html
   =========================================================== */
(function () {
  'use strict';

  var LABELS = window.SITE_CONFIG || {};
  var CONFIG = window.KEYPAD_CONFIG || {};
  var lang = window.SITE_LANGUAGE === 'ca' ? 'ca' : 'en';

  function $(id) { return document.getElementById(id); }
  var openButton = $('lock-btn');
  var dialog = $('keypad-dialog');
  if (!openButton || !dialog) return;

  var form = $('keypad-form');
  var entry = $('keypad-entry');
  var letters = $('letter-keyboard');
  var status = $('keypad-status');
  var resultDialog = $('keypad-result');
  var unlocked = false;   // true once both screws are out and the letter keyboard has unfolded

  // text can be "hello" or { en: "hello", ca: "hola" }
  function t(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.en || '';
  }
  // codes are compared lowercase, without accents, with spaces tidied up
  function normalize(text) {
    return String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* ---------- labels ---------- */
  dialog.setAttribute('aria-label', LABELS.keypadLabel || 'Keypad');
  $('keypad-title').textContent = LABELS.keypadLabel || 'Keypad';
  entry.setAttribute('aria-label', LABELS.entryLabel || 'Entry');
  $('keypad-keys').setAttribute('aria-label', LABELS.numberKeysLabel || 'Number keys');
  $('keypad-enter').textContent = LABELS.enterLabel || 'Enter';
  $('keypad-screws').setAttribute('aria-label', LABELS.screwsLabel || 'Keypad screws');
  document.querySelector('.keypad-screw[data-side="left"]').setAttribute('aria-label', LABELS.leftScrewLabel || 'Remove left screw');
  document.querySelector('.keypad-screw[data-side="right"]').setAttribute('aria-label', LABELS.rightScrewLabel || 'Remove right screw');
  document.querySelectorAll('[data-action="backspace"]').forEach(function (button) {
    button.setAttribute('aria-label', LABELS.backspaceLabel || 'Backspace');
  });
  letters.querySelector('[data-action="space"]').textContent = LABELS.spaceLabel || 'Space';
  letters.querySelector('[data-action="space"]').setAttribute('aria-label', LABELS.spaceLabel || 'Space');
  $('keypad-close').setAttribute('aria-label', LABELS.closeLabel || 'Close');
  $('result-close').setAttribute('aria-label', LABELS.closeLabel || 'Close');
  $('result-ok').textContent = LABELS.okLabel || 'OK';
  resultDialog.setAttribute('aria-label', LABELS.keypadLabel || 'Keypad');

  /* ---------- open / close ---------- */
  openButton.addEventListener('click', function (event) {
    event.preventDefault();
    status.textContent = '';
    dialog.showModal();
    entry.focus();
  });
  $('keypad-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', function () { entry.value = ''; status.textContent = ''; });
  $('result-close').addEventListener('click', function () { resultDialog.close(); });
  $('result-ok').addEventListener('click', function () { resultDialog.close(); });
  resultDialog.addEventListener('click', function (event) { if (event.target === resultDialog) resultDialog.close(); });

  /* ---------- typing ---------- */
  function insertText(text) {
    var start = entry.selectionStart == null ? entry.value.length : entry.selectionStart;
    var end = entry.selectionEnd == null ? entry.value.length : entry.selectionEnd;
    entry.setRangeText(text, start, end, 'end');
    entry.focus();
    checkAuto();
  }
  function backspace() {
    var start = entry.selectionStart == null ? entry.value.length : entry.selectionStart;
    var end = entry.selectionEnd == null ? entry.value.length : entry.selectionEnd;
    var from = start === end && start > 0 ? start - 1 : start;
    entry.setRangeText('', from, end, 'end');
    entry.focus();
  }

  // Until the keypad is unfolded the box takes DIGITS ONLY, however they arrive:
  // physical keys, paste, drag-and-drop, phone keyboards.
  entry.addEventListener('keydown', function (event) {
    if (!unlocked && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && /\D/.test(event.key)) {
      event.preventDefault();
    }
    var button = null;
    if (/^[0-9]$/.test(event.key)) button = document.querySelector('#keypad-keys [data-digit="' + event.key + '"]');
    else if (event.key === 'Backspace') button = document.querySelector(unlocked ? '#letter-keyboard [data-action="backspace"]' : '#keypad-keys [data-action="backspace"]');
    else if (event.key === 'Enter') button = $('keypad-enter');
    else if (unlocked && /^[a-z]$/i.test(event.key)) button = letters.querySelector('[data-letter="' + event.key.toLowerCase() + '"]');
    else if (unlocked && event.key === ' ') button = letters.querySelector('[data-action="space"]');
    flashKey(button);
  });
  entry.addEventListener('beforeinput', function (event) {
    if (unlocked || (event.inputType && event.inputType.indexOf('delete') === 0)) return;
    var data = event.data;
    if (data == null && event.dataTransfer) data = event.dataTransfer.getData('text');
    if (data != null && /\D/.test(data)) event.preventDefault();
  });
  entry.addEventListener('input', function () {
    if (!unlocked && /\D/.test(entry.value)) entry.value = entry.value.replace(/\D/g, '');
    checkAuto();
  });

  function flashKey(button) {
    if (!button) return;
    clearTimeout(button._flashTimer);
    button.classList.remove('physical-pressed');
    void button.offsetWidth;
    button.classList.add('physical-pressed');
    button._flashTimer = setTimeout(function () { button.classList.remove('physical-pressed'); }, 140);
  }

  document.querySelectorAll('#keypad-keys [data-digit]').forEach(function (button) {
    button.addEventListener('click', function () { insertText(button.dataset.digit); });
  });
  document.querySelector('#keypad-keys [data-action="backspace"]').addEventListener('click', backspace);
  letters.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button || !unlocked) return;
    if (button.dataset.letter) insertText(button.dataset.letter);
    else if (button.dataset.action === 'space') insertText(' ');
    else if (button.dataset.action === 'backspace') backspace();
  });

  /* ---------- the screws: both out = the letter keyboard unfolds ---------- */
  document.querySelectorAll('.keypad-screw').forEach(function (screw) {
    screw.addEventListener('click', function () {
      screw.classList.add('removed');
      screw.disabled = true;
      if (!document.querySelector('.keypad-screw:not(.removed)')) {
        unlocked = true;
        form.classList.add('keyboard-unlocked');
        letters.removeAttribute('inert');
        letters.setAttribute('aria-hidden', 'false');
        entry.focus();
      }
    });
  });

  /* ---------- codes ---------- */
  var codeTable = {};
  (CONFIG.codes || []).forEach(function (item) {
    if (!item) return;
    var list = item.codes || (item.code != null ? [item.code] : []);
    list.forEach(function (code) {
      var key = normalize(code);
      if (!key) return;
      if (codeTable[key] && window.console) console.warn('[keypad] the code "' + code + '" is listed twice; the later one wins');
      codeTable[key] = item;
    });
  });

  function say(text, seconds) {
    if (window.mascot && window.mascot.say) window.mascot.say(text, seconds);
    else show({ message: text });   // no mascot on screen: show it in a window instead
  }

  function show(options) {
    var image = $('result-image');
    var text = $('result-text');
    var message = [t(options.caption), t(options.message)].filter(Boolean);
    $('result-title').textContent = t(options.title) || LABELS.keypadLabel || 'Keypad';
    if (options.image) {
      image.src = options.image;
      image.alt = t(options.caption);
      image.hidden = false;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
    }
    // with a picture, "caption" goes under it; "message" is extra text under that
    text.textContent = message.join('\n');
    text.hidden = !message.length;
    if (!resultDialog.open) resultDialog.showModal();
    $('result-ok').focus();
  }

  function startDownload(url, filename) {
    var link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function perform(item) {
    if (item.keepOpen !== true && dialog.open) dialog.close();
    if (item.say) say(t(item.say), item.sayForSeconds);
    if (item.image || item.message) show({ image: item.image, caption: item.caption, message: item.message, title: item.title });
    if (item.download) startDownload(item.download, item.filename || String(item.download).split('/').pop());
    if (item.downloadText && item.downloadText.text != null) {
      var url = URL.createObjectURL(new Blob([t(item.downloadText.text)], { type: 'text/plain;charset=utf-8' }));
      startDownload(url, item.downloadText.filename || 'download.txt');
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }
    if (item.sound) {
      try { var audio = new Audio(item.sound); var playing = audio.play(); if (playing && playing.catch) playing.catch(function () {}); } catch (_) {}
    }
    if (typeof item.run === 'function') {
      try { item.run({ say: say, show: show }); } catch (error) { if (window.console) console.error('[keypad] run() failed:', error); }
    }
    if (item.link) {
      if (item.newTab) window.open(item.link, '_blank', 'noopener');
      else window.location.href = item.link;
    }
  }

  function checkAuto() {
    var item = codeTable[normalize(entry.value)];
    if (item && item.auto === true) perform(item);
  }

  function noMatch() {
    status.textContent = t(CONFIG.noMatchMessage);
    entry.value = '';
    entry.classList.remove('shake');
    void entry.offsetWidth;
    entry.classList.add('shake');
    entry.focus();
  }

  var checking = false;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var key = normalize(entry.value);
    if (!key || checking) return;
    var item = codeTable[key];
    if (item) { perform(item); return; }
    // not a plain code: try the hidden ones (config/keypad-secrets.js). Checking is
    // deliberately slow (a quarter of a second or so) so guessing is slow too.
    var secrets = window.KEYPAD_SECRETS;
    if (secrets && secrets.entries && secrets.entries.length && window.KeypadCrypto) {
      checking = true;
      status.textContent = '…';
      window.KeypadCrypto.unlock(secrets, key).then(function (hidden) {
        checking = false;
        if (hidden) perform(hidden); else noMatch();
      });
      return;
    }
    noMatch();
  });
})();
