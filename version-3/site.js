/* Wove Group \u00b7 flat iteration \u00b7 interactions */
(function () {
  'use strict';
  var d = document, html = d.documentElement, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); d.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  function copy(text, done) {
    var ok = function () { toast(done || 'Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text); ok(); });
    else { fallbackCopy(text); ok(); }
  }
  function fallbackCopy(text) { var t = d.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select(); try { d.execCommand('copy'); } catch (e) {} d.body.removeChild(t); }

  /* ---------- open at the top when you arrive from a link ---------- */
  var go = false; try { go = sessionStorage.getItem('wove3-top') === '1'; sessionStorage.removeItem('wove3-top'); } catch (e) {}
  if (go && !location.hash) { var top = function () { scrollTo(0, 0); }; top(); addEventListener('load', function () { top(); setTimeout(top, 60); }); }
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(https?:|mailto:|tel:)/.test(h)) return;
    try { sessionStorage.setItem('wove3-top', '1'); } catch (e) {}
  });

  /* ---------- movement: the device setting, or Less in the settings ---------- */
  var rmq = matchMedia('(prefers-reduced-motion: reduce)');
  function isCalm() { return rmq.matches || html.getAttribute('data-motion') === 'calm'; }
  ['pageswap', 'pagereveal'].forEach(function (n) { addEventListener(n, function (ev) { if (isCalm() && ev.viewTransition) ev.viewTransition.skipTransition(); }); });

  /* ---------- text size (Aa). With the fuller settings switched on, Aa opens them instead ---------- */
  var size = parseInt(store.get('wove3-size') || '1', 10); if (size > 1) html.setAttribute('data-size', String(size));
  function setSize(n) {
    size = Math.max(1, Math.min(3, n)); store.set('wove3-size', String(size));
    if (size > 1) html.setAttribute('data-size', String(size)); else html.removeAttribute('data-size');
    $$('.aa').forEach(function (x) { x.setAttribute('data-step', String(size)); });
  }
  $$('.aa').forEach(function (b) {
    b.setAttribute('data-step', String(size));
    b.addEventListener('click', function () {
      if (html.getAttribute('data-access') === 'b') { if (accEl && accEl.classList.contains('open')) closeAcc(); else openAcc(b); return; }
      setSize(size >= 3 ? 1 : size + 1);
      toast(['', 'Standard text', 'Larger text', 'Largest text'][size]);
    });
  });

  /* ---------- header ---------- */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', scrollY > 8); progress(); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var burger = $('.burger'), mnav = $('.mnav'), mnavClose = null;
  if (burger && mnav) {
    mnavClose = function () { if (mnav.classList.contains('open')) setM(false); };
    var setM = function (open) { mnav.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); d.body.style.overflow = open ? 'hidden' : ''; if (open) { var f = $('a, button', mnav); f && f.focus(); } };
    burger.addEventListener('click', function () { setM(!mnav.classList.contains('open')); });
    $$('[data-close]', mnav).forEach(function (b) { b.addEventListener('click', function () { setM(false); burger.focus(); }); });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && mnav.classList.contains('open')) setM(false); });
  }

  /* ---------- reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  var rvs = $$('[data-rv], [data-rv-kids], .fan, .steps-l');
  rvs.forEach(function (el) {
    if (el.hasAttribute('data-rv-kids')) Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 6)); });
    if (io) io.observe(el); else el.classList.add('in');
  });
  var sweep = function () { rvs.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 0.96) el.classList.add('in'); }); };
  addEventListener('scroll', function () { requestAnimationFrame(sweep); }, { passive: true }); addEventListener('load', sweep);

  /* ---------- designed dropdowns: a pill that opens a short list ---------- */
  $$('[data-dd]').forEach(function (dd) {
    var btn = $('.dd-btn', dd), list = $('.dd-list', dd), opts = $$('[role="option"]', list), lbl = $('.dd-lbl', dd);
    var srch = $('[data-dd-search]', dd);
    function shown() { return opts.filter(function (o) { return !o.hidden && !o.hasAttribute('data-miss'); }); }
    function current() { return opts.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0] || opts[0]; }
    function open() { dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); if (srch) srch.focus(); else current().focus(); }
    function close(back) { if (!dd.classList.contains('open')) return; dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); }
    function name(o) { var t = $('.dd-t', o); return (t || o).textContent; }
    function pick(o, quiet) {
      opts.forEach(function (x) { x.setAttribute('aria-selected', String(x === o)); });
      dd.setAttribute('data-value', o.getAttribute('data-v')); lbl.textContent = name(o);
      dd.classList.toggle('set', o.getAttribute('data-v') !== 'all');
      if (!quiet) { var ev; try { ev = new CustomEvent('ddchange', { bubbles: true }); } catch (e) { ev = d.createEvent('CustomEvent'); ev.initCustomEvent('ddchange', true, false, null); } dd.dispatchEvent(ev); }
    }
    dd.ddPick = function (v) { var o = opts.filter(function (x) { return x.getAttribute('data-v') === v; })[0]; if (o) pick(o, true); return !!o; };
    btn.addEventListener('click', function () { if (dd.classList.contains('open')) close(); else open(); });
    btn.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); open(); } });
    opts.forEach(function (o) {
      o.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('a')) return; pick(o); close(true); });
      o.addEventListener('keydown', function (ev) {
        var k = ev.key, v = shown(), i = v.indexOf(o);
        if (k === 'ArrowDown') { ev.preventDefault(); (v[i + 1] || v[0]).focus(); }
        else if (k === 'ArrowUp') { ev.preventDefault(); (v[i - 1] || v[v.length - 1]).focus(); }
        else if (k === 'Home') { ev.preventDefault(); v[0].focus(); }
        else if (k === 'End') { ev.preventDefault(); v[v.length - 1].focus(); }
        else if (k === 'Enter' || k === ' ') { ev.preventDefault(); pick(o); close(true); }
        else if (k === 'Escape') { ev.preventDefault(); close(true); }
        else if (k === 'Tab') { close(); }
      });
    });
    d.addEventListener('click', function (ev) { if (!dd.contains(ev.target)) close(); });
    /* the client list has a search box: it narrows the list as you type */
    if (srch) {
      srch.addEventListener('input', function () {
        var q = srch.value.trim().toLowerCase();
        opts.forEach(function (o) { if (o.getAttribute('data-v') === 'all' || !q || name(o).toLowerCase().indexOf(q) > -1) o.removeAttribute('data-miss'); else o.setAttribute('data-miss', ''); });
      });
      srch.addEventListener('keydown', function (ev) {
        var v = shown();
        if (ev.key === 'ArrowDown') { ev.preventDefault(); if (v[0]) v[0].focus(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); var f = v.filter(function (o) { return o.getAttribute('data-v') !== 'all'; })[0]; if (f) { pick(f); close(true); } }
        else if (ev.key === 'Escape') { ev.preventDefault(); close(true); }
      });
    }
    /* work.html#clients (the footer's Clients link) opens the client list */
    if (dd.id && location.hash === '#' + dd.id) setTimeout(function () { dd.scrollIntoView({ block: 'center' }); open(); }, 250);
  });

  /* ---------- feeds: impact area tabs and one dropdown, list or grid, show more.
     The filters can never come up empty: each dropdown option shows how many there are for the chosen impact area
     and is left out when there are none, and an impact area with nothing for the chosen team or kind is greyed out. ---------- */
  $$('[data-feed]').forEach(function (feed) {
    var rows = $$('.list > .row', feed), cards = $$('.cards > .card', feed), initial = parseInt(feed.getAttribute('data-initial') || '999', 10), shown = initial;
    var dds = $$('[data-dd]', feed), groups = $$('[data-tabs]', feed);
    var noun = feed.getAttribute('data-noun') || '', more = $('[data-more]', feed), count = $('[data-count]', feed), empty = $('.feed-empty', feed), active = $('[data-active]', feed);
    /* Chip rows are multi-select and combine with AND: a project has to have every chip you pick. 'Everything' clears the row. */
    var picked = {}; groups.forEach(function (g) { picked[g.getAttribute('data-tabs')] = []; });
    function has(el, attr, v) { if (!attr || v === 'all') return true; return (' ' + (el.getAttribute(attr) || '') + ' ').indexOf(' ' + v + ' ') > -1; }
    function state() { var st = {}; for (var k in picked) st[k] = picked[k].slice(); dds.forEach(function (x) { var v = x.getAttribute('data-value') || 'all'; st[x.getAttribute('data-f')] = v === 'all' ? [] : [v]; }); return st; }
    function fits(el, st) { for (var k in st) { for (var i = 0; i < st[k].length; i++) if (!has(el, 'data-' + k, st[k][i])) return false; } return true; }
    function howMany(key, v, add) { var st = state(); st[key] = add ? st[key].concat([v]) : [v]; return rows.filter(function (r) { return fits(r, st); }).length; }
    function counts() {
      dds.forEach(function (x) {
        var key = x.getAttribute('data-f');
        $$('[role="option"]', x).forEach(function (o) {
          var v = o.getAttribute('data-v'); if (v === 'all') return;
          var n = howMany(key, v), c = $('.dd-n', o);
          if (c) c.textContent = ' (' + n + (noun ? ' ' + noun + (n === 1 ? '' : 's') : '') + ')';
          o.hidden = n === 0;
        });
        if (x.getAttribute('data-value') !== 'all' && howMany(key, x.getAttribute('data-value')) === 0 && x.ddPick) x.ddPick('all');
      });
      groups.forEach(function (g) {
        var key = g.getAttribute('data-tabs');
        $$('[data-tv]', g).forEach(function (b) {
          var v = b.getAttribute('data-tv'); if (v === 'all') { b.setAttribute('aria-pressed', String(!picked[key].length)); return; }
          var on = picked[key].indexOf(v) > -1, none = !on && howMany(key, v, true) === 0;
          b.setAttribute('aria-pressed', String(on));
          if (none) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
          b.tabIndex = none ? -1 : 0;
        });
      });
    }
    function showActive() {
      if (!active) return;
      var dd = $('[data-dd][data-f="client"]', feed), v = dd && dd.getAttribute('data-value');
      if (!v || v === 'all') { active.hidden = true; return; }
      var o = $('[data-v="' + v + '"]', dd), nm = $('.dd-t', o).textContent, go = $('.dd-go', o);
      active.innerHTML = 'Showing work for <b></b>' + (go ? ' · <a></a>' : '');
      $('b', active).textContent = nm;
      if (go) { var a = $('a', active); a.href = go.getAttribute('href'); a.textContent = 'See ' + nm + '’s full page →'; }
      active.hidden = false;
    }
    function apply() {
      counts(); showActive();
      var st = state(), n = 0, vis = 0;
      rows.forEach(function (r, i) {
        var ok = fits(r, st), show = ok && n < shown; if (ok) n++;
        r.classList.toggle('hidden-by-filter', !show); if (cards[i]) cards[i].hidden = !show;
        if (show) vis++;
      });
      var first = true; rows.forEach(function (r) { if (!r.classList.contains('hidden-by-filter')) { r.classList.toggle('first', first); first = false; } else r.classList.remove('first'); });
      if (more) more.hidden = vis >= n;
      if (count) count.textContent = n ? ('Showing ' + vis + ' of ' + n) : '';
      if (empty) empty.hidden = n > 0;
    }
    feed.addEventListener('ddchange', function () { shown = initial; apply(); });
    groups.forEach(function (g) {
      var key = g.getAttribute('data-tabs');
      $$('[data-tv]', g).forEach(function (b) { b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') return;
        var v = b.getAttribute('data-tv'), i = picked[key].indexOf(v);
        if (v === 'all') picked[key] = []; else if (i > -1) picked[key].splice(i, 1); else picked[key].push(v);
        shown = initial; apply();
      }); });
    });
    if (more) more.addEventListener('click', function () { shown += 12; apply(); });
    $$('[data-view]', feed).forEach(function (b) { b.addEventListener('click', function () { feed.setAttribute('data-mode', b.getAttribute('data-view')); $$('[data-view]', feed).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    /* presets from the link: work.html?area=public&team=labs&client=circular-ie, wove-mind.html?kind=experiment */
    try {
      var q = new URLSearchParams(location.search);
      groups.forEach(function (g) { var key = g.getAttribute('data-tabs'), v = q.get(key); if (v && $('[data-tv="' + v + '"]', g)) picked[key] = [v]; });
      dds.forEach(function (x) { var v = q.get(x.getAttribute('data-f')); if (v && x.ddPick) x.ddPick(v); });
      if (q.get('view') === 'list' || q.get('view') === 'grid') { feed.setAttribute('data-mode', q.get('view')); $$('[data-view]', feed).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-view') === q.get('view'))); }); }
    } catch (e) {}
    apply();
  });


  /* impact area intro: Read more opens the longer intro in place */
  $$('.ia-more-btn').forEach(function (b) { var m = d.getElementById(b.getAttribute('aria-controls')); b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); m.classList.toggle('open', o); $('.lbl', b).textContent = o ? 'Read less' : 'Read more'; }); });
  /* ---------- a thread of moments (Circular.ie): a row opens in place, its small picture grows into the full one ---------- */
  var mos = $$('[data-mo]');
  function setMo(mo, open) { mo.classList.toggle('open', open); var b = $('.mo-tg', mo); if (b) b.setAttribute('aria-expanded', String(open)); }
  mos.forEach(function (mo) {
    var b = $('.mo-tg', mo); if (!b) return;
    b.addEventListener('click', function () {
      var open = !mo.classList.contains('open'), go = function () { setMo(mo, open); };
      var calm = html.getAttribute('data-motion') === 'calm' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (d.startViewTransition && !calm) d.startViewTransition(go); else go();
    });
  });
  function moFromHash() { if (!location.hash) return; var hm = d.getElementById(location.hash.slice(1)); if (hm && hm.hasAttribute('data-mo')) setMo(hm, true); }
  if (mos.length) { moFromHash(); addEventListener('hashchange', moFromHash); }

  /* ---------- people grid: pick a team ---------- */
  var ppl = $('[data-people]');
  if (ppl) {
    var pTitle = $('[data-ppl-title]', ppl), pCount = $('[data-ppl-count]', ppl);
    $$('[data-team-pick]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-team-pick'), n = 0, first = true; $$('[data-team-pick]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('.person', ppl).forEach(function (p) { var ok = k === 'all' || p.getAttribute('data-team') === k; p.hidden = !ok; if (ok) n++; });
        $$('.pn', ppl).forEach(function (p) { var ok = k === 'all' || p.getAttribute('data-team') === k; p.hidden = !ok; p.classList.toggle('first', ok && first); if (ok) first = false; });
        if (pTitle) pTitle.textContent = b.textContent; if (pCount) pCount.textContent = n + (n === 1 ? ' person' : ' people');
      });
    });
    $$('[data-ppl-view]', ppl).forEach(function (b) { b.addEventListener('click', function () { ppl.setAttribute('data-mode', b.getAttribute('data-ppl-view')); $$('[data-ppl-view]', ppl).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
  }

  /* ---------- contact: who to talk to from the link ---------- */
  try {
    var to = new URLSearchParams(location.search).get('to'), pick = to && $('[data-pick="' + to + '"]');
    if (pick) setTimeout(function () { pick.click(); }, 0);
  } catch (e) {}

  /* ---------- open bio, republish, share ---------- */
  d.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-bio], [data-share], [data-copy], [data-copy-from], .proto > button, [data-pick]');
    if (!t) return;
    if (t.hasAttribute('data-bio')) {
      var more = t.closest('.author-end').querySelector('.more'), open = !more.classList.contains('open');
      more.classList.toggle('open', open); t.setAttribute('aria-expanded', String(open)); t.querySelector('.lbl').textContent = open ? 'Close bio' : 'Open bio';
    } else if (t.hasAttribute('data-share')) {
      var kind = t.getAttribute('data-share');
      if (kind === 'copy') copy(location.href.split('#')[0], 'Link copied');
      else if (kind === 'print') { toast('Opening print'); try { window.print(); } catch (e) {} }
      else if (kind === 'republish') { var p = d.getElementById(t.getAttribute('aria-controls')); var o = !p.classList.contains('open'); p.classList.toggle('open', o); t.setAttribute('aria-expanded', String(o)); if (o) setTimeout(function () { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60); }
    } else if (t.hasAttribute('data-copy')) copy(t.getAttribute('data-copy'), 'Copied');
    else if (t.hasAttribute('data-copy-from')) { var src = d.getElementById(t.getAttribute('data-copy-from')); copy(src.value || src.textContent, 'Text copied'); }
    else if (t.hasAttribute('data-pick')) { var g = t.parentNode; $$('[data-pick]', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); }); var hid = $('input[name="to"]', g.closest('form')); if (hid) hid.value = t.getAttribute('data-pick'); }
    else if (t.matches('.proto > button')) { var pr = t.parentNode, op = !pr.classList.contains('open'); pr.classList.toggle('open', op); t.setAttribute('aria-expanded', String(op)); }
  });

  /* ---------- reading progress ---------- */
  var bar = $('.progress span'), art = $('[data-progress]');
  function progress() {
    if (!bar || !art) return;
    var r = art.getBoundingClientRect(), h = r.height - innerHeight * 0.6, done = Math.min(1, Math.max(0, (-r.top + innerHeight * 0.2) / Math.max(1, h)));
    bar.style.width = (done * 100).toFixed(1) + '%';
  }

  /* ---------- forms ---------- */
  $$('form[data-email]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var i = $('input[type="email"]', f), s = $('.status', f);
      if (!i.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value)) { s.textContent = 'That email address doesn\u2019t look right.'; i.focus(); return; }
      s.textContent = 'Thanks. You\u2019re on the list, and the first one comes at the start of next month.'; i.value = ''; toast('Signed up');
    });
  });
  $$('form[data-contact]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var bad = false;
      $$('[required]', f).forEach(function (i) { var w = i.closest('.field'), v = i.value.trim(), ok = v && (i.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)); w.classList.toggle('bad', !ok); if (!ok && !bad) { bad = true; i.focus(); } });
      if (bad) return;
      var who = ($('input[name="to"]', f) || {}).value || 'any', pk = $('[data-pick="' + who + '"]', f), first = who === 'any' || !pk ? 'Someone' : pk.textContent.trim(), done = $('.done', f.parentNode);
      f.hidden = true; if (done) { done.hidden = false; $('p', done).textContent = first + ' will reply within two working days. If it\u2019s urgent, ring +353 1 677 5020.'; done.setAttribute('tabindex', '-1'); done.focus(); }
    });
  });

  /* ---------- home strip: drifts on its own, drags, pauses when you point at it ---------- */
  $$('.strip').forEach(function (strip) {
    var track = $('.track', strip), half = 0, paused = false, drag = null, raf, last = 0;
    function measure() { half = track.scrollWidth / 2; }
    function tick(now) {
      if (!paused && !drag && !isCalm()) { strip.scrollLeft += (now - last) * 0.03; }
      last = now;
      if (half && strip.scrollLeft >= half) strip.scrollLeft -= half; else if (strip.scrollLeft < 0) strip.scrollLeft += half;
      raf = requestAnimationFrame(tick);
    }
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    strip.addEventListener('pointerenter', function () { paused = true; }); strip.addEventListener('pointerleave', function () { paused = false; });
    var stopClick = false;
    strip.addEventListener('pointerdown', function (ev) { if (ev.pointerType !== 'mouse' || ev.button) return; drag = { x: ev.clientX, left: strip.scrollLeft, moved: false, id: ev.pointerId }; });
    strip.addEventListener('pointermove', function (ev) {
      if (!drag) return; var dx = ev.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; strip.classList.add('dragging'); try { strip.setPointerCapture(drag.id); } catch (e) {} }
      if (drag.moved) strip.scrollLeft = drag.left - dx;
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { strip.addEventListener(n, function () { if (drag && drag.moved) { stopClick = true; setTimeout(function () { stopClick = false; }, 0); } drag = null; strip.classList.remove('dragging'); }); });
    strip.addEventListener('click', function (ev) { if (stopClick) { ev.preventDefault(); ev.stopPropagation(); } }, true);
    strip.addEventListener('focusin', function () { paused = true; }); strip.addEventListener('focusout', function () { paused = false; });
    last = performance.now(); raf = requestAnimationFrame(tick);
  });

  /* ---------- menu B, after Sapiens ---------- */
  var closeB = function () {}, refreshB = function () {}, closeC = function () {};
  var hbBar = $('[data-hb-bar]'), hbBtn = $('.hb-menu'), hbSheet = $('.hb-sheet');
  if (hbBar && hbBtn && hbSheet) {
    var cur = $('.hb-cur', hbBar), opts = $$('.hb-opts a', hbBar), lbl = $('[data-hb-label]', hbBar), lastFocus = null;
    var count = function () { hbBar.style.setProperty('--n', opts.filter(function (a) { return !a.hidden; }).length); };
    count();
    var showBar = function () { var on = html.getAttribute('data-menu') === 'b' && (scrollY > 120 || html.classList.contains('hb-open')); hbBar.classList.toggle('show', on); cur.tabIndex = on ? 0 : -1; $('.logo', hbBar).tabIndex = on ? 0 : -1; if (!on) setSwitch(false); };
    var setSwitch = function (open) { hbBar.classList.toggle('open', open); cur.setAttribute('aria-expanded', String(open)); opts.forEach(function (a) { a.tabIndex = open ? 0 : -1; }); };
    opts.forEach(function (a) { a.tabIndex = -1; });
    cur.addEventListener('click', function () { setSwitch(!hbBar.classList.contains('open')); });
    d.addEventListener('click', function (ev) { if (hbBar.classList.contains('open') && !ev.target.closest('[data-hb-bar]')) setSwitch(false); });
    var setSheet = function (open) {
      html.classList.toggle('hb-open', open); hbBtn.setAttribute('aria-expanded', String(open)); hbBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); hbSheet.setAttribute('aria-hidden', String(!open));
      d.body.style.overflow = open ? 'hidden' : ''; setSwitch(false); showBar();
      if (open) { lastFocus = d.activeElement; setTimeout(function () { var f = $('.hb-main a', hbSheet); f && f.focus({ preventScroll: true }); }, 120); } else if (lastFocus) { lastFocus.focus({ preventScroll: true }); }
    };
    hbBtn.addEventListener('click', function () { setSheet(!html.classList.contains('hb-open')); });
    $$('[data-hb-close]').forEach(function (x) { x.addEventListener('click', function () { setSheet(false); }); });
    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { if (html.classList.contains('hb-open')) setSheet(false); else if (hbBar.classList.contains('open')) { setSwitch(false); cur.focus(); } }
      if (ev.key === 'Tab' && html.classList.contains('hb-open')) {
        var f = [hbBtn].concat($$('a, button', hbSheet)); var i = f.indexOf(d.activeElement);
        if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); }
      }
    });
    addEventListener('scroll', showBar, { passive: true }); showBar();
    /* Home: the bar says which part of the page you are in, and quietly changes as you pass from one to the next */
    var areas = $$('[data-area]');
    if (areas.length && 'IntersectionObserver' in window) {
      var setLabel = function (t) { if (lbl.textContent === t) return; lbl.classList.add('swap'); setTimeout(function () { lbl.textContent = t; lbl.classList.remove('swap'); }, 200);
        opts.forEach(function (o) { o.hidden = o.textContent === t; }); count(); };
      var aio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) setLabel(en.target.getAttribute('data-area')); }); }, { rootMargin: '-45% 0px -50% 0px' });
      areas.forEach(function (a) { aio.observe(a); });
    }
    closeB = function () { if (html.classList.contains('hb-open')) setSheet(false); }; refreshB = showBar;
  }

  /* ---------- search over every page, person, team, theme, client and piece ---------- */
  var norm = function (x) { return String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }, idxWait = [];
  function loadIndex(cb) {
    if (window.WOVE_INDEX) { cb && cb(); return; } if (cb) idxWait.push(cb); if ($('script[data-index]')) return;
    var sc = d.createElement('script'); sc.src = 'search-index.js'; sc.setAttribute('data-index', ''); sc.onload = function () { idxWait.splice(0).forEach(function (f) { f(); }); }; d.head.appendChild(sc);
  }
  function fillResults(raw, list, none) {
    var q = norm(raw.trim()), words = q.split(/\s+/).filter(Boolean);
    list.textContent = ''; none.textContent = ''; none.className = 'hc-none';
    if (!words.length) return false;
    if (!window.WOVE_INDEX) { none.textContent = 'Looking\u2026'; return true; }
    var hits = [];
    window.WOVE_INDEX.forEach(function (it, i) {
      var t = norm(it[0]), hay = t + ' ' + norm(it[1]) + ' ' + norm(it[3]);
      if (!words.every(function (w) { return hay.indexOf(w) > -1; })) return;
      var sc = (t.indexOf(q) === 0 ? 8 : 0) + (t.split(/\W+/).some(function (w) { return w.indexOf(words[0]) === 0; }) ? 4 : 0) + (words.every(function (w) { return t.indexOf(w) > -1; }) ? 2 : 0) + (i < 40 ? 1 : 0);
      hits.push([sc, i, it]);
    });
    hits.sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; });
    hits.slice(0, 8).forEach(function (h) {
      var li = d.createElement('li'), a = d.createElement('a'), t = d.createElement('span'), k = d.createElement('span');
      a.href = h[2][2]; t.className = 't'; t.textContent = h[2][0]; k.className = 'k'; k.textContent = h[2][1];
      a.appendChild(t); a.appendChild(k); li.appendChild(a); list.appendChild(li);
    });
    if (!hits.length) none.textContent = 'Nothing for \u201c' + raw.trim() + '\u201d. Try a person, a client or a theme.';
    else { none.className = 'hc-none sr-only'; none.textContent = hits.length + (hits.length === 1 ? ' result' : ' results'); }
    return true;
  }
  function searchKeys(input, list) {
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { var f = $('a', list); if (f) { ev.preventDefault(); location.href = f.getAttribute('href'); } }
      if (ev.key === 'ArrowDown') { var g = $('a', list); if (g) { ev.preventDefault(); g.focus(); } }
    });
    list.addEventListener('keydown', function (ev) {
      var as = $$('a', list), i = as.indexOf(d.activeElement); if (i < 0) return;
      if (ev.key === 'ArrowUp') { ev.preventDefault(); if (as[i - 1]) as[i - 1].focus(); else input.focus(); }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (as[i + 1]) as[i + 1].focus(); }
    });
  }
  $$('[data-find]').forEach(function (f) {
    var input = $('input', f), list = $('.find-res', f), none = $('.hc-none', f);
    var run = function () { fillResults(input.value, list, none); };
    input.addEventListener('focus', function () { loadIndex(run); }, { once: true });
    input.addEventListener('input', function () { loadIndex(run); run(); });
    searchKeys(input, list);
  });

  /* ---------- menu C, closer to the real Sapiens bar ---------- */
  var hc = $('.hc');
  if (hc) {
    var hcBtn = $('.hc-menu', hc), hcPop = $('#hc-pop'), hcLast = null, sw = $$('.hc-sw a', hc);
    var find = $('#hc-find'), sBtn = $('.hc-search', hc), sIn = $('input', find), sList = $('.hc-res ul', find), sNone = $('.hc-none', find);
    var setPop = function (open) {
      if (open) setFind(false);
      html.classList.toggle('hc-open', open); hcBtn.setAttribute('aria-expanded', String(open)); hcPop.setAttribute('aria-hidden', String(!open));
      hcBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); $('.lbl', hcBtn).textContent = open ? 'Close' : 'Menu';
      d.body.style.overflow = open ? 'hidden' : '';
      if (open) { hcLast = d.activeElement; setTimeout(function () { hcPop.focus({ preventScroll: true }); }, 60); }
      else if (hcLast) { hcLast.focus({ preventScroll: true }); hcLast = null; }
    };
    hcBtn.addEventListener('click', function () { setPop(!html.classList.contains('hc-open')); });
    $$('[data-hc-close]', hc).forEach(function (x) { x.addEventListener('click', function () { setPop(false); setFind(false); }); });
    /* the pill swaps over before the page changes, so you see it move */
    sw.forEach(function (a) {
      a.addEventListener('click', function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return;
        if (a.getAttribute('aria-current') === 'page') { ev.preventDefault(); return; }
        ev.preventDefault();
        sw.forEach(function (x) { x.classList.remove('on'); if (x === a) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
        try { sessionStorage.setItem('wove3-top', '1'); } catch (e) {}
        setTimeout(function () { location.href = a.getAttribute('href'); }, isCalm() ? 0 : 200);
      });
    });
    /* Home: the pill follows the part of the page you are in */
    var hareas = $$('[data-area]');
    if (hareas.length && 'IntersectionObserver' in window && !sw.some(function (a) { return a.hasAttribute('aria-current'); })) {
      var mark = function (t) { sw.forEach(function (a) { a.classList.toggle('on', a.textContent === t); }); };
      var hio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) mark(en.target.getAttribute('data-area')); }); }, { rootMargin: '-45% 0px -50% 0px' });
      hareas.forEach(function (a) { hio.observe(a); });
      addEventListener('scroll', function () { if (scrollY < innerHeight * 0.4) mark(''); }, { passive: true });
    }
    /* search sits bottom left, as on Sapiens */
    var render = function () { find.classList.toggle('has', fillResults(sIn.value, sList, sNone)); };
    var setFind = function (open) {
      if (open) { if (html.classList.contains('hc-open')) setPop(false); loadIndex(render); }
      html.classList.toggle('hc-finding', open); sBtn.setAttribute('aria-expanded', String(open)); find.setAttribute('aria-hidden', String(!open));
      if (open) setTimeout(function () { sIn.focus({ preventScroll: true }); }, 40);
      else { if (find.contains(d.activeElement)) sBtn.focus({ preventScroll: true }); sIn.value = ''; render(); }
    };
    sBtn.addEventListener('click', function () { setFind(true); });
    $('.hc-fx', find).addEventListener('click', function () { setFind(false); });
    sIn.addEventListener('input', render);
    searchKeys(sIn, sList);
    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { if (html.classList.contains('hc-open')) setPop(false); if (html.classList.contains('hc-finding')) setFind(false); }
      if (ev.key === 'Tab' && html.classList.contains('hc-open')) {
        var f = [hcBtn].concat($$('a, button', hcPop)), i = f.indexOf(d.activeElement), n = f.length;
        ev.preventDefault(); f[i < 0 ? (ev.shiftKey ? n - 1 : 1) : (i + (ev.shiftKey ? -1 : 1) + n) % n].focus();
      }
    });
    closeC = function () { if (html.classList.contains('hc-open')) setPop(false); if (html.classList.contains('hc-finding')) setFind(false); };
  }

  /* ---------- the panel switches: menu A, B or C; Aa alone or the fuller settings ---------- */
  function pickMenu(v) {
    if (v === 'b' || v === 'c') html.setAttribute('data-menu', v); else html.removeAttribute('data-menu');
    store.set('wove3-menu', v); closeB(); closeC(); closeAcc(); refreshB();
    $$('[data-menu-pick]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-menu-pick') === v)); });
  }
  $$('[data-menu-pick]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-menu-pick') === (html.getAttribute('data-menu') || 'a'))); b.addEventListener('click', function () { pickMenu(b.getAttribute('data-menu-pick')); }); });
  function pickAccess(v) {
    if (v === 'b') html.setAttribute('data-access', 'b'); else html.removeAttribute('data-access');
    store.set('wove3-access', v); closeAcc(); accApply();
    $$('[data-access-pick]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-access-pick') === v)); });
  }
  $$('[data-access-pick]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-access-pick') === (html.getAttribute('data-access') || 'a'))); b.addEventListener('click', function () { pickAccess(b.getAttribute('data-access-pick')); }); });

  /* ---------- accessibility settings (option B), after Pallas Projects. Saved on this device only ---------- */
  var accEl = $('#acc'), accTrig = null;
  var ACC_KEYS = ['motion', 'pics', 'cursor', 'contrast', 'font', 'links'], ACC_DEF = { size: '1', motion: 'full', pics: 'colour', cursor: 'std', contrast: 'std', font: 'std', links: 'plain' };
  function accGet() { var o = {}; try { o = JSON.parse(store.get('wove3-a11y') || '{}') || {}; } catch (e) {} return o; }
  function loadEasy() { if ($('link[data-easy]')) return; var l = d.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-easy', ''); l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'; d.head.appendChild(l); }
  function accApply() {
    var on = html.getAttribute('data-access') === 'b', st = accGet();
    ACC_KEYS.forEach(function (k) { var v = on && st[k] && st[k] !== ACC_DEF[k] ? st[k] : null; if (v) html.setAttribute('data-' + k, v); else html.removeAttribute('data-' + k); });
    if (on && st.font === 'easy') loadEasy();
    $$('.aa').forEach(function (b) { b.setAttribute('aria-label', on ? 'Accessibility settings' : 'Text size'); if (on) { b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', String(!!(accEl && accEl.classList.contains('open')))); } else { b.removeAttribute('aria-haspopup'); b.removeAttribute('aria-expanded'); } });
    paintAcc(); bitmapSync();
  }
  function paintAcc() {
    var st = accGet(); st.size = String(size);
    $$('[data-acc]').forEach(function (b) { var k = b.getAttribute('data-acc'); b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === (st[k] || ACC_DEF[k]))); });
    var changed = size > 1 || ACC_KEYS.some(function (k) { return st[k] && st[k] !== ACC_DEF[k]; });
    $$('[data-acc-reset]').forEach(function (r) { r.hidden = !changed; });
  }
  function placeAcc() {
    if (!accEl || !accEl.classList.contains('open')) return;
    if (innerWidth <= 640) { accEl.style.left = accEl.style.top = accEl.style.right = ''; return; }
    var r = accTrig ? accTrig.getBoundingClientRect() : null;
    var w = accEl.offsetWidth, h = accEl.offsetHeight, left, top;
    if (!r || !r.width) { left = innerWidth - w - 16; top = 84; }
    else {
      left = r.left + r.width / 2 < innerWidth / 2 ? r.left : r.right - w;
      top = r.bottom + 10; if (top + h > innerHeight - 16) top = Math.max(16, r.top - h - 10);
    }
    accEl.style.right = 'auto'; accEl.style.left = Math.max(16, Math.min(innerWidth - w - 16, left)) + 'px'; accEl.style.top = Math.max(16, top) + 'px';
  }
  function openAcc(t) {
    if (!accEl) return;
    var inMenu = t.closest('.hb-sheet, .hc-pop, .mnav');
    if (inMenu) {
      var anchor = inMenu.closest('.hc') ? $('.hc-menu') : inMenu.closest('.hb') ? $('.hb-menu') : $('.burger');
      closeB(); closeC(); if (mnavClose) mnavClose(); t = anchor || t;
    }
    accTrig = t; accEl.classList.add('open'); accEl.setAttribute('aria-hidden', 'false'); html.classList.add('acc-open');
    $$('.aa').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    placeAcc(); setTimeout(function () { var f = $('[aria-pressed="true"]', accEl); f && f.focus({ preventScroll: true }); }, 60);
  }
  function closeAcc() {
    if (!accEl || !accEl.classList.contains('open')) return;
    accEl.classList.remove('open'); accEl.setAttribute('aria-hidden', 'true'); html.classList.remove('acc-open');
    $$('.aa').forEach(function (b) { if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false'); });
    if (accEl.contains(d.activeElement) && accTrig && accTrig.getClientRects().length) accTrig.focus({ preventScroll: true });
  }
  if (accEl) {
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-acc]');
      if (b) {
        var k = b.getAttribute('data-acc'), v = b.getAttribute('data-v');
        if (k === 'size') setSize(+v); else { var st = accGet(); if (v === ACC_DEF[k]) delete st[k]; else st[k] = v; store.set('wove3-a11y', JSON.stringify(st)); }
        accApply(); placeAcc(); return;
      }
      if (ev.target.closest('[data-acc-reset]')) { store.set('wove3-a11y', '{}'); setSize(1); accApply(); placeAcc(); toast('Back to the standard settings'); return; }
      if (ev.target.closest('[data-acc-close]')) { closeAcc(); return; }
      if (accEl.classList.contains('open') && !accEl.contains(ev.target) && !ev.target.closest('.aa')) closeAcc();
    });
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && accEl.classList.contains('open')) closeAcc(); });
    addEventListener('resize', placeAcc);
  }

  /* ---------- dotted pictures: each photo redrawn in ink dots on paper (Atkinson dithering), only when chosen ---------- */
  var bitIO = null, bitCache = {};
  function atkinson(img, w, h) {
    var p = img.data, n = w * h, g = new Float32Array(n), hist = new Uint32Array(256), i, v, lo, hi, acc;
    for (i = 0; i < n; i++) { v = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2]; g[i] = v; hist[v | 0]++; }
    for (lo = 0, acc = 0; lo < 255 && (acc += hist[lo]) < n * 0.005; lo++);
    for (hi = 255, acc = 0; hi > 0 && (acc += hist[hi]) < n * 0.005; hi--);
    var span = Math.max(1, hi - lo);
    for (i = 0; i < n; i++) { v = (g[i] - lo) / span; v = v < 0 ? 0 : v > 1 ? 1 : v; g[i] = (0.06 + 0.86 * v) * 255; }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      i = y * w + x; var old = g[i], nv = old < 128 ? 0 : 255, err = (old - nv) / 8; g[i] = nv;
      if (x + 1 < w) g[i + 1] += err; if (x + 2 < w) g[i + 2] += err;
      if (y + 1 < h) { if (x > 0) g[i + w - 1] += err; g[i + w] += err; if (x + 1 < w) g[i + w + 1] += err; }
      if (y + 2 < h) g[i + 2 * w] += err;
    }
    for (i = 0; i < n; i++) { var ink = g[i] < 128; p[i * 4] = ink ? 17 : 250; p[i * 4 + 1] = ink ? 17 : 249; p[i * 4 + 2] = ink ? 17 : 246; p[i * 4 + 3] = 255; }
  }
  function dither(im) {
    if (html.getAttribute('data-pics') !== 'bitmap' || im.hasAttribute('data-bit')) return;
    var put = function (u) { if (html.getAttribute('data-pics') !== 'bitmap') return; if (!im.getAttribute('data-orig')) im.setAttribute('data-orig', im.getAttribute('src')); im.src = u; im.setAttribute('data-bit', ''); };
    var go = function () {
      var nw = im.naturalWidth, nh = im.naturalHeight; if (!nw || im.hasAttribute('data-bit')) return;
      var r = im.getBoundingClientRect(), W = r.width, H = r.height; if (W < 120 && H < 120) return;
      if (im.closest('.spot')) W = Math.max(W, H * 1.4);
      var fit = getComputedStyle(im).objectFit, sc = fit === 'cover' ? Math.max(W / nw, H / nh) : fit === 'contain' ? Math.min(W / nw, H / nh) : W / nw;
      sc = Math.min(1, sc);
      var cw = Math.max(1, Math.round(nw * sc)), ch = Math.max(1, Math.round(nh * sc)), key = im.getAttribute('src') + '|' + cw;
      if (bitCache[key]) { put(bitCache[key]); return; }
      var c = d.createElement('canvas'); c.width = cw; c.height = ch; var x = c.getContext('2d', { willReadFrequently: true }), data;
      x.drawImage(im, 0, 0, cw, ch);
      try { data = x.getImageData(0, 0, cw, ch); } catch (e) { return; }
      atkinson(data, cw, ch); x.putImageData(data, 0, 0);
      c.toBlob(function (b) { if (!b) return; var u = URL.createObjectURL(b); bitCache[key] = u; put(u); }, 'image/png');
    };
    if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true });
  }
  function bitmapSync() {
    var on = html.getAttribute('data-pics') === 'bitmap', imgs = $$('main img');
    if (!on) {
      if (bitIO) { bitIO.disconnect(); bitIO = null; }
      imgs.forEach(function (im) { var o = im.getAttribute('data-orig'); if (o) { im.src = o; im.removeAttribute('data-orig'); } im.removeAttribute('data-bit'); });
      return;
    }
    if (!('IntersectionObserver' in window)) { imgs.forEach(dither); return; }
    if (!bitIO) bitIO = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { bitIO.unobserve(en.target); dither(en.target); } }); }, { rootMargin: '700px 0px' });
    imgs.forEach(function (im) { if (!im.hasAttribute('data-bit')) bitIO.observe(im); });
  }
  accApply();

  /* ---------- follow this page: leave an email, hear when something is added (saved on this device; nothing is sent) ---------- */
  function follows() { try { return JSON.parse(store.get('wove3-follow') || '{}') || {}; } catch (e) { return {}; } }
  $$('[data-follow]').forEach(function (f) {
    var key = f.getAttribute('data-follow'), btn = $('.fbtn', f), lbl = $('.lbl', btn), base = lbl.textContent, box = $('.follow-form', f), form = $('form', f), on = $('.on', f), input = $('input', f), st = $('.status', f);
    var paint = function () { var em = follows()[key]; f.classList.toggle('is-on', !!em); lbl.textContent = em ? 'Following' : base; form.hidden = !!em; on.hidden = !em; if (em) $('[data-follow-email]', f).textContent = em; };
    btn.addEventListener('click', function () { var o = !box.classList.contains('open'); box.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o && !form.hidden) setTimeout(function () { input.focus({ preventScroll: true }); }, 250); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); var v = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { st.textContent = 'That email address doesn\u2019t look right.'; input.focus(); return; }
      var all = follows(); all[key] = v; store.set('wove3-follow', JSON.stringify(all)); st.textContent = ''; paint(); toast('Following');
    });
    $('[data-unfollow]', f).addEventListener('click', function () { var all = follows(); delete all[key]; store.set('wove3-follow', JSON.stringify(all)); paint(); toast('Stopped following'); input.focus({ preventScroll: true }); });
    paint();
  });

  /* ---------- announcements, after Sapiens: one small card, closed for good once you close it ---------- */
  var annEl = $('.ann');
  function annGone() { try { return JSON.parse(store.get('wove3-ann') || '[]') || []; } catch (e) { return []; } }
  function annShow() {
    if (!annEl || annGone().indexOf(annEl.getAttribute('data-ann')) > -1) return;
    annEl.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { annEl.classList.add('show'); }); });
  }
  if (annEl) {
    setTimeout(annShow, isCalm() ? 0 : 900);
    $('.ann-x', annEl).addEventListener('click', function () {
      var g = annGone(); g.push(annEl.getAttribute('data-ann')); store.set('wove3-ann', JSON.stringify(g));
      annEl.classList.remove('show'); setTimeout(function () { annEl.hidden = true; }, isCalm() ? 0 : 350);
    });
  }
  $$('[data-ann-reset]').forEach(function (b) { b.addEventListener('click', function () { store.set('wove3-ann', '[]'); annShow(); toast(annEl ? 'Showing the announcement again' : 'Home and Labs will show theirs again'); }); });

  /* ---------- meet the people: point at a face and it takes the room (after wennergren.org); press on touch ---------- */
  $$('[data-spot]').forEach(function (spot) {
    var pics = $$('.pic', spot), metas = $$('.meta', spot), hover = matchMedia('(hover: hover)').matches;
    function activate(i) {
      if (spot.getAttribute('data-active') === String(i)) return;
      spot.setAttribute('data-active', String(i));
      pics.forEach(function (p, k) { p.classList.toggle('on', k === i); p.setAttribute('aria-pressed', String(k === i)); });
      metas.forEach(function (m, k) { m.classList.toggle('on', k === i); });
    }
    pics.forEach(function (p, i) {
      if (hover) p.addEventListener('pointerenter', function () { activate(i); });
      p.addEventListener('click', function () { activate(i); });
      p.addEventListener('focus', function () { activate(i); });
    });
  });

  /* ---------- diagrams: numbers count, wires draw, bars grow ---------- */
  $$('.draw, .stats').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
  if (io) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) {
      if (!en.isIntersecting) return; var t = en.target; cio.unobserve(t);
      var end = +t.getAttribute('data-countup'), t0 = performance.now(), dur = 1200;
      if (isCalm()) return;
      var step = function (now) { var k = Math.min(1, (now - t0) / dur); t.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      t.textContent = '0'; requestAnimationFrame(step);
    }); }, { rootMargin: '0px 0px -10% 0px' });
    $$('[data-countup]').forEach(function (d) { cio.observe(d); });
  }
  $$('.connect').forEach(function (c) {
    $$('li[data-i]', c).forEach(function (li) {
      var p = $('path[data-i="' + li.getAttribute('data-i') + '"]', c);
      li.addEventListener('pointerenter', function () { c.classList.add('is-hover'); li.classList.add('is-lit'); p && p.classList.add('is-lit'); });
      li.addEventListener('pointerleave', function () { c.classList.remove('is-hover'); li.classList.remove('is-lit'); p && p.classList.remove('is-lit'); });
    });
    var svg = $('svg', c), end = $('.end', c);
    function lay() {
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var e = end.getBoundingClientRect(), ey = e.top + e.height / 2 - r.top, w = r.width;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + r.height);
      $$('li[data-i]', c).forEach(function (li) {
        var p = $('path[data-i="' + li.getAttribute('data-i') + '"]', c), b = $('span', li).getBoundingClientRect(), yy = b.top + b.height / 2 - r.top;
        p.setAttribute('d', 'M0 ' + yy.toFixed(1) + ' C ' + (w * .45).toFixed(1) + ' ' + yy.toFixed(1) + ', ' + (w * .5).toFixed(1) + ' ' + ey.toFixed(1) + ', ' + w.toFixed(1) + ' ' + ey.toFixed(1));
        try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (err) {}
      });
    }
    lay(); if ('ResizeObserver' in window) new ResizeObserver(lay).observe(c);
  });
})();
