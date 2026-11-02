/* Wove Group · version 3 sketch · interactions */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var fine = matchMedia('(hover:hover) and (pointer:fine)');
  var calm = function () { return html.getAttribute('data-motion') === 'calm' || (matchMedia('(prefers-reduced-motion: reduce)').matches && html.getAttribute('data-motion') !== 'full'); };

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); d.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------- settings (kept on this device) ---------- */
  var KEY = 'wove3-set';
  var DEF = { size: '1', lh: 'std', colour: 'std', links: 'plain', motion: 'full' };
  var ATTR = { size: 'data-size', lh: 'data-lh', colour: 'data-colour', links: 'data-links', motion: 'data-motion' };
  function getSet() { var o = {}; try { o = JSON.parse(store.get(KEY) || '{}') || {}; } catch (e) {} return o; }
  function apply() {
    var st = getSet();
    Object.keys(DEF).forEach(function (k) { var v = st[k] && st[k] !== DEF[k] ? st[k] : null; if (v) html.setAttribute(ATTR[k], v); else html.removeAttribute(ATTR[k]); });
    $$('[data-set]').forEach(function (b) { var k = b.getAttribute('data-set'); b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === (st[k] || DEF[k]))); });
    var changed = Object.keys(DEF).some(function (k) { return st[k] && st[k] !== DEF[k]; });
    $$('[data-set-reset]').forEach(function (r) { r.disabled = !changed; r.style.opacity = changed ? '' : '.5'; });
  }
  apply();

  /* ---------- menu and accessibility panel ---------- */
  var menuBtn = $('.menu-btn'), menu = $('#menu'), acc = $('#acc'), scrim = $('.scrim'), lastFocus = null;
  function trap(ev, box, first) {
    if (ev.key !== 'Tab') return;
    var f = [first].concat($$('a[href], button:not([disabled]), input, select, textarea', box)).filter(function (x) { return x && x.offsetParent !== null; });
    var i = f.indexOf(d.activeElement), n = f.length; if (!n) return;
    ev.preventDefault(); f[i < 0 ? (ev.shiftKey ? n - 1 : 0) : (i + (ev.shiftKey ? -1 : 1) + n) % n].focus();
  }
  function openMenu() {
    if (!menu) return; closeAcc(true);
    lastFocus = d.activeElement; html.classList.add('menu-open'); menu.hidden = false; menu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); $('.lbl', menuBtn).textContent = 'Close';
    setTimeout(function () { var a = $('a', menu); a && a.focus({ preventScroll: true }); }, 60);
  }
  function closeMenu(keepFocus) {
    if (!menu || !html.classList.contains('menu-open')) return;
    html.classList.remove('menu-open'); menu.setAttribute('aria-hidden', 'true'); setTimeout(function () { if (!html.classList.contains('menu-open')) menu.hidden = true; }, 350);
    menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Menu'); $('.lbl', menuBtn).textContent = 'Menu';
    if (!keepFocus && lastFocus) { lastFocus.focus({ preventScroll: true }); lastFocus = null; }
  }
  function openAcc() {
    if (!acc) return; var from = d.activeElement; closeMenu(true); if (!lastFocus) lastFocus = from;
    html.classList.add('acc-open'); acc.hidden = false; acc.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close accessibility settings'); $('.lbl', menuBtn).textContent = 'Close';
    setTimeout(function () { var f = $('[aria-pressed="true"]', acc); f && f.focus({ preventScroll: true }); }, 60);
  }
  function closeAcc(keepFocus) {
    if (!acc || !html.classList.contains('acc-open')) return;
    html.classList.remove('acc-open'); acc.setAttribute('aria-hidden', 'true'); setTimeout(function () { if (!html.classList.contains('acc-open')) acc.hidden = true; }, 350);
    menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Menu'); $('.lbl', menuBtn).textContent = 'Menu';
    if (!keepFocus && lastFocus) { lastFocus.focus({ preventScroll: true }); lastFocus = null; }
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { if (html.classList.contains('menu-open') || html.classList.contains('acc-open')) { closeMenu(); closeAcc(); } else openMenu(); });
    scrim && scrim.addEventListener('click', function () { closeMenu(); closeAcc(); });
    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { closeMenu(); closeAcc(); }
      if (html.classList.contains('menu-open')) trap(ev, menu, menuBtn);
      else if (html.classList.contains('acc-open')) trap(ev, acc, menuBtn);
    });
    d.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-open-acc]'); if (t) { ev.preventDefault(); openAcc(); return; }
      if (ev.target.closest('[data-close-acc]')) { closeAcc(); return; }
      var b = ev.target.closest('[data-set]');
      if (b) { var k = b.getAttribute('data-set'), v = b.getAttribute('data-v'), st = getSet(); if (v === DEF[k]) delete st[k]; else st[k] = v; store.set(KEY, JSON.stringify(st)); apply(); return; }
      if (ev.target.closest('[data-set-reset]')) { store.set(KEY, '{}'); apply(); toast('Back to the standard settings'); return; }
    });
  }

  /* ---------- a picture follows the pointer along a text list ---------- */
  if (fine.matches && $$('[data-peek]').length) {
    var pf = null, tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false, flip = 1;
    var ensure = function () { if (pf) return pf; pf = d.createElement('div'); pf.className = 'peek'; pf.setAttribute('aria-hidden', 'true'); pf.innerHTML = '<div class="pf"><img alt=""></div>'; d.body.appendChild(pf); return pf; };
    var loop = function () { x += (tx - x) * .18; y += (ty - y) * .18; pf.style.transform = 'translate(' + x + 'px,' + y + 'px)'; if (on || Math.abs(tx - x) > .5) raf = requestAnimationFrame(loop); else raf = 0; };
    var place = function (e) { tx = e.clientX + 18; ty = e.clientY - 200; if (tx + 236 > innerWidth) tx = e.clientX - 238; if (ty < 8) ty = e.clientY + 28; };
    $$('[data-peek]').forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (calm()) return; var p = ensure(); $('img', p).src = el.getAttribute('data-peek'); flip = -flip; p.style.setProperty('--r', (flip * 2) + 'deg'); place(e); if (!on) { x = tx; y = ty; } on = true; p.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); });
      el.addEventListener('pointermove', place);
      el.addEventListener('pointerleave', function () { on = false; pf && pf.classList.remove('on'); });
    });
    addEventListener('scroll', function () { if (on) { on = false; pf && pf.classList.remove('on'); } }, { passive: true });
  }

  /* ---------- reveal on scroll ---------- */
  var rv = $$('[data-rv]');
  if (rv.length && 'IntersectionObserver' in window && !calm()) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); else io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- prototype panel ---------- */
  var proto = $('.proto');
  if (proto) {
    var pb = $('.proto > button');
    pb.addEventListener('click', function () { var o = proto.classList.toggle('open'); pb.setAttribute('aria-expanded', String(o)); });
    d.addEventListener('click', function (ev) { if (!proto.contains(ev.target) && proto.classList.contains('open')) { proto.classList.remove('open'); pb.setAttribute('aria-expanded', 'false'); } });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && proto.classList.contains('open')) { proto.classList.remove('open'); pb.setAttribute('aria-expanded', 'false'); pb.focus(); } });
  }

  /* ---------- dropdown filters (Work) ---------- */
  var dds = $$('.dd');
  function closeDds(except) { dds.forEach(function (x) { if (x !== except) { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); } }); }
  dds.forEach(function (dd) {
    var btn = $('.pill', dd), list = $('ul', dd), key = dd.getAttribute('data-filter'), label = btn.getAttribute('data-any');
    btn.addEventListener('click', function () { var o = !dd.classList.contains('open'); closeDds(dd); dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) { var s = $('[aria-selected="true"]', list) || $('button', list); s && s.focus(); } });
    list.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      $$('button', list).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      var v = b.getAttribute('data-v'); $('.lbl', btn).textContent = v ? b.textContent : label; btn.classList.toggle('on', !!v);
      dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); filterWork(); if (window.applyMind) window.applyMind();
    });
    list.addEventListener('keydown', function (ev) {
      var bs = $$('button', list), i = bs.indexOf(d.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    });
  });
  if (dds.length) { d.addEventListener('click', function (ev) { if (!ev.target.closest('.dd')) closeDds(); }); d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeDds(); }); }
  function filterWork() {
    var grid = $('[data-work]'); if (!grid) return;
    var want = {}; dds.forEach(function (dd) { var s = $('[aria-selected="true"]', dd); var v = s && s.getAttribute('data-v'); if (v) want[dd.getAttribute('data-filter')] = v; });
    var n = 0;
    $$('.ptile', grid).forEach(function (t) {
      var ok = Object.keys(want).every(function (k) { return (t.getAttribute('data-' + k) || '').split(' ').indexOf(want[k]) >= 0; });
      t.hidden = !ok; if (ok) n++;
    });
    var c = $('[data-work-count]'); if (c) c.textContent = n + (n === 1 ? ' project' : ' projects');
  }

  /* ---------- people: faces or names ---------- */
  var pv = $('[data-people-view]');
  if (pv) {
    $$('button', pv).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', pv).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var names = b.getAttribute('data-v') === 'names';
        var g = $('[data-people-grid]'), l = $('[data-people-list]');
        if (g) g.hidden = names; if (l) l.hidden = !names;
      });
    });
  }

  /* ---------- list or grid (client and project pages) ---------- */
  $$('[data-list-view]').forEach(function (v) {
    $$('button', v).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', v).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var grid = b.getAttribute('data-v') === 'grid', sec = v.closest('section') || d;
        var l = $('[data-list]', sec), g = $('[data-grid]', sec); if (l) l.hidden = grid; if (g) g.hidden = !grid;
      });
    });
  });
  /* ---------- Wove Mind: topic pills and kind filter ---------- */
  var topics = $('[data-topics]');
  if (topics) {
    var applyMind = function () {
      var on = $('[aria-pressed="true"]', topics), topic = on ? on.getAttribute('data-topic') : 'all';
      var kindDd = $('.dd[data-filter="kind"] [aria-selected="true"]'), kind = kindDd ? kindDd.getAttribute('data-v') : null;
      var n = 0;
      $$('.ptile[data-topic]').forEach(function (t) { var ok = (topic === 'all' || (t.getAttribute('data-topic') || '').split(' ').indexOf(topic) >= 0) && (!kind || t.getAttribute('data-kind') === kind); t.hidden = !ok; if (ok) n++; });
      var c = $('[data-mind-count]'); if (c) c.textContent = 'Showing ' + n + ' of 30';
    };
    topics.addEventListener('click', function (ev) { var b = ev.target.closest('.pill[data-topic]'); if (!b) return; $$('.pill[data-topic]', topics).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); applyMind(); });
    window.applyMind = applyMind;
  }

  /* ---------- small actions ---------- */
  d.addEventListener('click', function (ev) {
    var c = ev.target.closest('[data-copy]');
    if (c) { var t = c.getAttribute('data-copy'); if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Copied ' + t); }, function () { toast(t); }); else toast(t); return; }
    if (ev.target.closest('[data-more]')) { ev.preventDefault(); toast('Only these projects are in this sketch'); return; }
    if (ev.target.closest('[data-follow]')) { ev.preventDefault(); toast('Following is not wired up in this sketch'); return; }
  });
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var em = $('input[type="email"]', f), st = $('[role="status"]', f);
      if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { if (st) st.textContent = 'Check the email address.'; em.focus(); return; }
      if (st) st.textContent = f.getAttribute('data-done') || 'Thanks. Nothing is sent from this sketch.'; else toast(f.getAttribute('data-done') || 'Thanks. Nothing is sent from this sketch.');
    });
  });
  /* choice pills in the contact form */
  $$('.choice .opts').forEach(function (g) { g.addEventListener('click', function (ev) { var b = ev.target.closest('.pill'); if (!b) return; $$('.pill', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
  /* arrive at the top when a nav link was used */
  window.toast = toast;
})();
