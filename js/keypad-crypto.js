/* ===========================================================
   keypad-crypto.js - hides keypad codes so they can't be read in the page source.
   Used by js/keypad.js (to open a secret code) and tools/encrypt-codes.html
   (to make one). You shouldn't need to edit this file.

   How it works: the code someone types is turned into a key (PBKDF2-SHA256,
   250,000 rounds, so every guess is slow). That key is used two ways:
     - a fingerprint ("id") to find the matching entry, and
     - an AES-GCM key that unlocks what the code does.
   The page only ever contains the fingerprint and scrambled data, never the
   code or what it does. Without the right code the data can't be opened.
   =========================================================== */
(function (root) {
  'use strict';

  var subtle = root.crypto && root.crypto.subtle;
  var encoder = new TextEncoder();
  var decoder = new TextDecoder();

  // same tidy-up as the plain codes: lowercase, no accents, single spaces
  function normalize(text) {
    return String(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function toBase64(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
    return btoa(text);
  }
  function fromBase64(base64) {
    var text = atob(base64);
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return bytes;
  }
  function toHex(bytes) {
    var text = '';
    for (var i = 0; i < bytes.length; i++) text += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return text;
  }
  function randomSalt() { return toBase64(root.crypto.getRandomValues(new Uint8Array(16))); }

  // code -> { id, keyBytes }
  function derive(code, saltBase64, iterations) {
    return subtle.importKey('raw', encoder.encode(normalize(code)), 'PBKDF2', false, ['deriveBits'])
      .then(function (base) {
        return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(saltBase64), iterations: iterations }, base, 512);
      })
      .then(function (bits) {
        var bytes = new Uint8Array(bits);
        return { keyBytes: bytes.slice(0, 32), id: toHex(bytes.slice(32)) };
      });
  }

  // make one scrambled entry: what = the plain object ({ say: "...", image: "..." })
  function encryptEntry(code, what, saltBase64, iterations) {
    return derive(code, saltBase64, iterations).then(function (derived) {
      return subtle.importKey('raw', derived.keyBytes, 'AES-GCM', false, ['encrypt']).then(function (key) {
        var iv = root.crypto.getRandomValues(new Uint8Array(12));
        return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encoder.encode(JSON.stringify(what))).then(function (data) {
          return { id: derived.id, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
        });
      });
    });
  }

  // try a typed code against the scrambled list -> the plain object, or null
  function unlock(secrets, code) {
    if (!subtle || !secrets || !secrets.entries || !secrets.entries.length) return Promise.resolve(null);
    return derive(code, secrets.salt, secrets.iterations).then(function (derived) {
      var entry = null;
      for (var i = 0; i < secrets.entries.length; i++) if (secrets.entries[i].id === derived.id) { entry = secrets.entries[i]; break; }
      if (!entry) return null;
      return subtle.importKey('raw', derived.keyBytes, 'AES-GCM', false, ['decrypt']).then(function (key) {
        return subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(entry.iv) }, key, fromBase64(entry.data));
      }).then(function (buffer) {
        return JSON.parse(decoder.decode(buffer));
      });
    }).catch(function () { return null; });
  }

  root.KeypadCrypto = {
    available: !!subtle,
    iterations: 250000,
    normalize: normalize,
    randomSalt: randomSalt,
    encryptEntry: encryptEntry,
    unlock: unlock
  };
})(typeof window !== 'undefined' ? window : globalThis);
