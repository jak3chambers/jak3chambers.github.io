/* Tiny Firestore client (plain fetch, no libraries) shared by the messages and staff pages.
   Needs config/firebase-config.js loaded first. If it is empty, SiteDB.enabled is false and the
   pages keep using the visitor's own browser storage.

   Collections used:
     messages   doc id = the name (lowercased)    { name, body, createdAt }
     adoptions  doc id = mudkip number            { owner, name, until }
     votes      doc id = YYYY-MM_employeeNumber   { count }   (employee of the month)
*/
(function () {
  'use strict';

  var cfg = window.FIREBASE_CONFIG || {};
  var enabled = !!(cfg.projectId && cfg.apiKey);
  var fsHost = cfg.firestoreHost || 'https://firestore.googleapis.com';
  var authHost = cfg.authHost || 'https://identitytoolkit.googleapis.com';
  var root = fsHost + '/v1/projects/' + encodeURIComponent(cfg.projectId || '') + '/databases/(default)/documents';
  var TOKEN_KEY = 'siteDbOwnerToken';

  /* ---- word filter (client side only; the rules cannot do this) ---- */
  var blockedTerms = [
    'nigger', 'nigga', 'kike', 'chink', 'gook', 'spic', 'wetback', 'beaner',
    'raghead', 'towelhead', 'sandnigger', 'faggot', 'fag', 'dyke', 'tranny',
    'coon', 'retard', 'retarded', 'maricon'
  ];
  var blockedSlurs = new RegExp('(?:^|[^a-z0-9])(?:' + blockedTerms.map(function (term) {
    return term.split('').map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('[^a-z0-9]*');
  }).join('|') + ')(?=$|[^a-z0-9])', 'i');
  function isBlocked(text) {
    var normalized = String(text).normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
      .replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't');
    return blockedSlurs.test(normalized);
  }

  /* "  Jake  " and "jake" are the same name */
  function nameKey(name) {
    return String(name).normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  /* Firestore document ids cannot contain "/" and cannot be "." or ".." */
  function docId(name) {
    var id = nameKey(name).replace(/[\/.]/g, '_').slice(0, 60);
    return id || '_';
  }

  /* ---- Firestore REST value encoding ---- */
  function encodeFields(obj) {
    var fields = {};
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      fields[k] = typeof v === 'number' ? { integerValue: String(Math.round(v)) } : { stringValue: String(v) };
    });
    return { fields: fields };
  }
  function decodeDoc(doc) {
    var out = { id: decodeURIComponent(doc.name.split('/').pop()) };
    var fields = doc.fields || {};
    Object.keys(fields).forEach(function (k) {
      var v = fields[k];
      out[k] = 'integerValue' in v ? Number(v.integerValue) : ('stringValue' in v ? v.stringValue : null);
    });
    return out;
  }

  function ownerToken() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
      if (saved && saved.token && saved.exp > Date.now()) return saved.token;
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
    return null;
  }

  function request(method, path, body, withToken) {
    var headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    var token = withToken ? ownerToken() : null;
    if (token) headers.Authorization = 'Bearer ' + token;
    var url = root + path + (path.indexOf('?') < 0 ? '?' : '&') + 'key=' + encodeURIComponent(cfg.apiKey);
    return fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (response) {
        if (response.ok) return response.json();
        return response.json().catch(function () { return {}; }).then(function (data) {
          var error = new Error((data.error && data.error.message) || ('HTTP ' + response.status));
          error.status = response.status;
          throw error;
        });
      });
  }

  function list(collection, orderBy) {
    var query = '?pageSize=300' + (orderBy ? '&orderBy=' + encodeURIComponent(orderBy) : '');
    return request('GET', '/' + collection + query).then(function (data) {
      return (data.documents || []).map(decodeDoc);
    });
  }
  /* Only succeeds when the document does not exist yet (the rules and the precondition both enforce it). */
  function create(collection, id, data) {
    return request('PATCH', '/' + collection + '/' + encodeURIComponent(id) + '?currentDocument.exists=false', encodeFields(data));
  }
  /* Create or overwrite (the rules decide when overwriting is allowed). */
  function upsert(collection, id, data) {
    return request('PATCH', '/' + collection + '/' + encodeURIComponent(id), encodeFields(data));
  }
  /* Owner only: needs a successful login() first. */
  function remove(collection, id) {
    return request('DELETE', '/' + collection + '/' + encodeURIComponent(id), null, true);
  }

  /* Add +1 / -1 to an integer field of one or more documents in a single request.
     changes = [{ collection: 'votes', id: '2026-11_2', field: 'count', delta: 1 }, ...]
     Creates the document when it does not exist yet. */
  function increment(changes) {
    var prefix = 'projects/' + cfg.projectId + '/databases/(default)/documents/';
    var body = { writes: changes.map(function (c) {
      return { transform: {
        document: prefix + c.collection + '/' + c.id,
        fieldTransforms: [{ fieldPath: c.field, increment: { integerValue: String(c.delta) } }]
      } };
    }) };
    return fetch(fsHost + '/v1/projects/' + encodeURIComponent(cfg.projectId) + '/databases/(default)/documents:commit?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (response) {
      if (response.ok) return response.json();
      var error = new Error('HTTP ' + response.status);
      error.status = response.status;
      throw error;
    });
  }

  function login(email, password) {
    return fetch(authHost + '/v1/accounts:signInWithPassword?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.idToken) throw new Error((data.error && data.error.message) || 'login failed');
        try {
          sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
            token: data.idToken,
            exp: Date.now() + (Number(data.expiresIn) || 3600) * 1000 - 60000
          }));
        } catch (_) {}
        return true;
      });
    });
  }
  function logout() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (_) {} }

  window.SiteDB = {
    enabled: enabled,
    isBlocked: isBlocked,
    nameKey: nameKey,
    docId: docId,
    list: list,
    create: create,
    upsert: upsert,
    remove: remove,
    increment: increment,
    login: login,
    logout: logout,
    isOwner: function () { return !!ownerToken(); }
  };
})();
