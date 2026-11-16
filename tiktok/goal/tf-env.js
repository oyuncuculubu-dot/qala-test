/* GameCamp — environment shim for GitHub Pages overlays.
 * Remote (https://*.github.io/..., file://, or ?host=): talks to the local
 * app at http://127.0.0.1:4000 (override with ?host= / ?studio= / ?server=).
 * Prefers StudioConnect (WebSocket + SSE fallback) when available.
 */
(function (root) {
  'use strict';
  var qs = new URLSearchParams(root.location.search);
  var hostName = '';
  try { hostName = root.location.hostname || ''; } catch (_) {}
  var raw = (qs.get('host') || qs.get('studio') || qs.get('server') || '').trim();
  var remote = root.location.protocol === 'file:' || /\.github\.io$/i.test(hostName) || !!raw;
  var port = qs.get('port') || '4000';
  var API = '';
  if (raw) {
    try {
      var u = raw;
      if (!/^https?:\/\//i.test(u) && !/^wss?:\/\//i.test(u)) u = 'http://' + u;
      var parsed = new URL(u);
      if (!parsed.port) parsed.port = port;
      API = parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
        ? ((parsed.protocol === 'wss:' ? 'https:' : 'http:') + '//' + parsed.host)
        : parsed.origin;
    } catch (_) { API = 'http://127.0.0.1:' + port; }
  } else if (remote) {
    API = 'http://127.0.0.1:' + port;
  }
  function asset(u) {
    if (!u) return u;
    u = String(u);
    if (u.charAt(0) === '/' && u.indexOf('/assets/') === 0) return u.replace(/^\//, '');
    return u;
  }
  function loadState(onState, onData) {
    return fetch(API + '/api/state', { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (d) { if (onState) onState(d); else onData(d); return true; });
  }
  function connect(onData, opts) {
    opts = opts || {};
    if (opts.noLive) { loadState(opts.onState, onData).catch(function () {}); return; }
    loadState(opts.onState, onData).catch(function () {});
    if (root.StudioConnect) {
      root.StudioConnect.connect(function (p) { try { onData(p); } catch (_) {} }, {
        onOpen: opts.onOpen,
        onClose: opts.onClose
      });
      return;
    }
    var es = null, timer = null, delay = 1000;
    function schedule() {
      if (timer) return;
      timer = setTimeout(function () { timer = null; start(); }, delay);
      delay = Math.min(delay * 2, 10000);
    }
    function start() {
      if (es) { try { es.close(); } catch (_) {} es = null; }
      loadState(opts.onState, onData).catch(function () {});
      if (typeof EventSource !== 'function') return;
      try { es = new EventSource(API + '/events'); } catch (_) { return schedule(); }
      es.onopen = function () { delay = 1000; };
      es.onmessage = function (ev) { try { onData(JSON.parse(ev.data)); } catch (_) {} };
      es.onerror = function () { if (es && es.readyState === 2) { es = null; schedule(); } };
    }
    start();
  }
  root.TF = { remote: remote, API: API, asset: asset, connect: connect };
})(window);
