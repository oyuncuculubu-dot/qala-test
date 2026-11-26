/* TikFinity AZ — connect a widget page to the local studio.
 *
 * Same origin (http://127.0.0.1:4000/widgets/...): relative /events and /ws.
 * Remote (https://*.github.io/... , file://, or ?host=/?studio=/?server=):
 *   talks to the local app at http://127.0.0.1:4000 (override with ?host=).
 * Chromium treats 127.0.0.1 as potentially trustworthy, so ws:// and http://
 * loopback from an https page are allowed. Prefer WebSocket, fall back to SSE.
 *
 * Query: ?host=127.0.0.1:4000   ?host=192.168.1.64   ?studio=http://127.0.0.1:4000
 *        ?server=...            ?port=4000
 */
(function (root) {
  'use strict';

  function qs() {
    try { return new URLSearchParams(root.location.search); }
    catch (_) { return new URLSearchParams(); }
  }

  function parseTarget(raw, portFallback) {
    raw = String(raw || '').trim();
    if (!raw) return null;
    try {
      if (/^wss?:\/\//i.test(raw)) {
        var wu = new URL(raw);
        // wss:// hosts (e.g. trycloudflare tunnel) use the default 443; only force a port for plain ws://
        if (!wu.port && wu.protocol === 'ws:') wu.port = portFallback || '4000';
        var httpProto = wu.protocol === 'wss:' ? 'https:' : 'http:';
        var path = /\/ws\/?$/i.test(wu.pathname) ? wu.pathname.replace(/\/$/, '') : '/ws';
        return { http: httpProto + '//' + wu.host, ws: wu.protocol + '//' + wu.host + path };
      }
      if (!/^https?:\/\//i.test(raw)) raw = 'http://' + raw;
      var u = new URL(raw);
      // https:// hosts (e.g. trycloudflare tunnel) use the default 443; only force a port for plain http://
      if (!u.port && u.protocol === 'http:') u.port = portFallback || '4000';
      var wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return { http: u.origin, ws: wsProto + '//' + u.host + '/ws' };
    } catch (_) {
      return null;
    }
  }

  function resolve() {
    var q = qs();
    var raw = (q.get('host') || q.get('studio') || q.get('server') || '').trim();
    var port = q.get('port') || '4000';
    var hostName = '';
    try { hostName = root.location.hostname || ''; } catch (_) {}
    var proto = '';
    try { proto = root.location.protocol || ''; } catch (_) {}
    var remote = proto === 'file:' || /\.github\.io$/i.test(hostName) || !!raw;
    var parsed = parseTarget(raw, port);
    if (parsed) return { remote: true, http: parsed.http, ws: parsed.ws };
    // GitHub Pages without ?host: use the permanent GameCamp address (Cloudflare, never changes).
    if (!raw && /\.github\.io$/i.test(hostName)) {
      return { remote: true, http: 'https://widget.gamecamplive.com', ws: 'wss://widget.gamecamplive.com/ws' };
    }
    if (remote) {
      return {
        remote: true,
        http: 'http://127.0.0.1:' + port,
        ws: 'ws://127.0.0.1:' + port + '/ws'
      };
    }
    var loc = root.location;
    var wsProto = proto === 'https:' ? 'wss:' : 'ws:';
    return {
      remote: false,
      http: '',
      ws: wsProto + '//' + loc.host + '/ws'
    };
  }

  function connect(onPayload, opts) {
    opts = opts || {};
    var S = resolve();
    var es = null, socket = null, timer = null, stopped = false;
    var delay = 800;
    var preferWs = opts.preferWs !== false;

    function emitOpen() { if (opts.onOpen) try { opts.onOpen(); } catch (_) {} }
    function emitClose() { if (opts.onClose) try { opts.onClose(); } catch (_) {} }

    function stopTransports() {
      if (es) { try { es.close(); } catch (_) {} es = null; }
      if (socket) {
        try { socket.onclose = null; socket.onerror = null; socket.onmessage = null; socket.close(); } catch (_) {}
        socket = null;
      }
    }

    function schedule(nextWs) {
      if (stopped || timer) return;
      timer = setTimeout(function () {
        timer = null;
        start(nextWs);
      }, delay);
      delay = Math.min(delay * 2, 8000);
    }

    function handle(raw) {
      var p = raw;
      if (typeof raw === 'string') {
        try { p = JSON.parse(raw); } catch (_) { return; }
      }
      if (!p) return;
      if (p.data && typeof p.data === 'string') {
        try { p = Object.assign({}, p, { data: JSON.parse(p.data) }); } catch (_) {}
      }
      try { onPayload(p); } catch (_) {}
    }

    function startWs() {
      stopTransports();
      try { socket = new WebSocket(S.ws); }
      catch (_) { return startSse(); }
      socket.onopen = function () { delay = 800; emitOpen(); };
      socket.onmessage = function (ev) { handle(ev.data); };
      socket.onerror = function () { try { socket.close(); } catch (_) {} };
      socket.onclose = function () {
        socket = null;
        emitClose();
        schedule(false);
      };
    }

    function startSse() {
      stopTransports();
      var url = S.http + '/events';
      try { es = new EventSource(url); }
      catch (_) { return schedule(true); }
      es.onopen = function () { delay = 800; emitOpen(); };
      es.onmessage = function (ev) { handle(ev.data); };
      es.addEventListener('gift', function (ev) { handle(ev.data); });
      es.onerror = function () {
        if (es && es.readyState === 2) {
          try { es.close(); } catch (_) {}
          es = null;
          emitClose();
          schedule(true);
        }
      };
    }

    function start(useWs) {
      if (stopped) return;
      if (useWs === false) startSse();
      else if (preferWs) startWs();
      else startSse();
    }

    start(preferWs);

    return {
      target: S,
      stop: function () {
        stopped = true;
        if (timer) { clearTimeout(timer); timer = null; }
        stopTransports();
      }
    };
  }

  root.StudioConnect = { resolve: resolve, connect: connect };
})(window);
