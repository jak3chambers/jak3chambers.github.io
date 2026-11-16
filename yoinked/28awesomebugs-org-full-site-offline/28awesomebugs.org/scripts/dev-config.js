
(function () {
  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!isLocal) return;

  var PROD = 'https://api.28awesomebugs.org';
  var LOCAL = 'http://localhost:3000';

  var _fetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.startsWith(PROD)) {
      url = LOCAL + url.slice(PROD.length);
    }
    return _fetch(url, opts);
  };

  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === 'string' && url.startsWith(PROD)) {
      url = LOCAL + url.slice(PROD.length);
    }
    return _open.apply(this, arguments);
  };
})();
