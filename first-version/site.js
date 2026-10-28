(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'calm';
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const vt = (fn) => (document.startViewTransition && !reduce()) ? document.startViewTransition(fn) : fn();
  const pageId = ($('main') && $('main').dataset.page) || '';

  /* Toast */
  const toast = (msg) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2400);
  };
  const copy = async (v, label) => {
    try { await navigator.clipboard.writeText(v); toast(label || ('Copied ' + v)); return true; }
    catch (e) { toast('Copy did not work here. The text is ' + v); return false; }
  };

  /* Header: hides on the way down, returns on the way up. Long reads get a reading line. */
  const header = $('.site-header');
  let lastY = scrollY, maxRead = 0;
  const art = $('[data-progress]');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    const busy = document.body.classList.contains('menu-open') || $('.panel.is-open');
    if (!busy && y > 420 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 420) header.classList.remove('is-hidden');
    lastY = y;
    if (art) {
      const r = art.getBoundingClientRect();
      const total = Math.max(1, r.height - innerHeight * .6);
      const p = Math.min(1, Math.max(0, -r.top / total));
      const bar = $('.progress span');
      if (bar) { bar.style.setProperty('--p', p.toFixed(4)); $('.progress').setAttribute('aria-valuenow', Math.round(p * 100)); }
      if (p > maxRead) maxRead = p;
    }
  };
  /* On a page with a coloured band at the top, the header wears the same colour until you scroll past the band */
  const band = $('.band-head, .page-intro.tinted');
  const bandCheck = () => { if (band) header.classList.toggle('past-band', band.getBoundingClientRect().bottom <= header.offsetHeight + 2); };
  addEventListener('scroll', () => { onScroll(); bandCheck(); }, { passive: true }); onScroll(); bandCheck();
  /* Focus rings only for the keyboard: a mouse click doesn't leave a ring behind */
  addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'mouse'; }, true);
  addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) document.documentElement.dataset.input = 'kb'; }, true);

  /* Reading memory (on this device only): cards show how far you got (after WePresent) */
  const readMap = () => { try { return JSON.parse(store.get('wove1-read') || '{}'); } catch (e) { return {}; } };
  if (art && pageId) {
    const save = () => { const m = readMap(); if ((m[pageId] || 0) < maxRead) { m[pageId] = +maxRead.toFixed(2); store.set('wove1-read', JSON.stringify(m)); } };
    addEventListener('pagehide', save); addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
    setInterval(save, 4000);
  }
  /* Nav: a hairline glides to whatever you point at (a quiet nod to aad's sliding highlight) */
  const navList = $('.nav-list');
  const ind = $('.nav-ind');
  /* the line only follows the pointer; the page you're on is shown in bold, with no line under it */
  const home = () => $('.nav-item[aria-expanded="true"]', navList);
  const moveTo = (el) => {
    if (!ind) return;
    if (!el) { ind.style.opacity = 0; return; }
    const a = el.getBoundingClientRect(), b = navList.getBoundingClientRect();
    ind.style.width = (el.querySelector('.txt') || el).getBoundingClientRect().width + 'px';
    ind.style.transform = `translateX(${a.left - b.left}px)`;
    ind.style.opacity = 1;
  };
  if (navList && ind) {
    $$('.nav-item', navList).forEach(el => { el.addEventListener('pointerenter', () => moveTo(el)); el.addEventListener('focus', () => moveTo(el)); });
    navList.addEventListener('pointerleave', () => moveTo(home()));
    navList.addEventListener('focusout', (e) => { if (!navList.contains(e.relatedTarget)) moveTo(home()); });
    requestAnimationFrame(() => { ind.style.transition = 'none'; moveTo(home()); requestAnimationFrame(() => ind.style.transition = ''); });
  }

  /* Panels under the header (Our work, Thinking, Search, Reading settings) */
  $$('.panel').forEach(p => $$('.stg', p).forEach((el, i) => el.style.setProperty('--i', Math.min(i, 14))));
  const scrim = $('.scrim');
  let openBtn = null, openPanelEl = null, closeT = null, openT = null;
  const closePanel = (focusBack) => {
    if (!openPanelEl) return;
    openPanelEl.classList.remove('is-open');
    $$(`[aria-controls="${openPanelEl.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    scrim && scrim.classList.remove('is-on');
    const b = openBtn; openBtn = null; openPanelEl = null;
    if (focusBack && b) b.focus();
    moveTo(home());
  };
  /* the accessibility list lines up under the word that opened it, as on Pallas */
  const placeA11y = () => {
    const p = $('#p-a11y'); if (!p || !p.classList.contains('is-open')) return;
    const btn = $$('[aria-controls="p-a11y"]').find(x => x.offsetParent);
    const w = $('.wrap', p), list = $('.a11y-list', p), cs = getComputedStyle(w);
    const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const left = w.getBoundingClientRect().left + parseFloat(cs.paddingLeft) * z;
    const right = w.getBoundingClientRect().right - parseFloat(cs.paddingRight) * z;
    const room = (right - left) / z - list.offsetWidth;
    const x = btn ? (btn.getBoundingClientRect().left - left) / z : 0;
    list.style.setProperty('--ax', Math.max(0, Math.min(x, room)) + 'px');
  };
  addEventListener('resize', () => placeA11y());
  const openPanel = (btn) => {
    const p = document.getElementById(btn.getAttribute('aria-controls'));
    if (openPanelEl === p) return;
    if (openPanelEl) { openPanelEl.classList.remove('is-open'); $$(`[aria-controls="${openPanelEl.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false')); }
    p.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
    scrim && scrim.classList.add('is-on'); header.classList.remove('is-hidden');
    openBtn = btn; openPanelEl = p; moveTo(home());
    if (p.id === 'p-a11y') placeA11y();
    const f = $('[data-autofocus]', p); if (f) setTimeout(() => f.focus(), 60);
  };
  $$('[data-panel]').forEach(btn => {
    const p = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => (openPanelEl === p ? closePanel() : openPanel(btn)));
    if (btn.hasAttribute('data-hover')) {
      btn.addEventListener('pointerenter', () => { if (!fine.matches) return; if (openPanelEl && !openPanelEl.matches('#p-work, #p-think')) return; clearTimeout(closeT); clearTimeout(openT); openT = setTimeout(() => openPanel(btn), openPanelEl ? 0 : 90); });
      btn.addEventListener('pointerleave', () => { clearTimeout(openT); if (!fine.matches || !openPanelEl || !openPanelEl.matches('#p-work, #p-think')) return; closeT = setTimeout(() => closePanel(), 240); });
      p.addEventListener('pointerenter', () => clearTimeout(closeT));
      p.addEventListener('pointerleave', () => { if (!fine.matches) return; closeT = setTimeout(() => closePanel(), 240); });
    }
    p.addEventListener('focusout', (e) => { if (openPanelEl === p && !p.contains(e.relatedTarget) && !(e.relatedTarget && e.relatedTarget.getAttribute('aria-controls') === p.id)) closePanel(); });
  });
  scrim && scrim.addEventListener('click', () => closePanel());
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openPanelEl) { closePanel(true); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) && $('#p-search')) {
      e.preventDefault(); const b = $$('[aria-controls="p-search"]').find(x => x.offsetParent) || $('[aria-controls="p-search"]'); openPanel(b);
    }
  });

  /* Our work panel B: the preview follows the theme you point at, and the panel takes on a wash of its colour */
  const wpb = $('.wp-b');
  if (wpb) {
    const panel = wpb.closest('.panel');
    const pick = (a) => {
      $$('.t-list a', wpb).forEach(x => x.classList.toggle('is-active', x === a));
      $$('.pv', wpb).forEach(x => x.classList.toggle('is-on', x.dataset.t === a.dataset.t));
      if (!wpb.hidden) panel.style.backgroundColor = a.dataset.wash;
    };
    $$('.t-list a', wpb).forEach(a => { a.addEventListener('pointerenter', () => pick(a)); a.addEventListener('focus', () => pick(a)); });
  }
  /* Prototype options: menu version, page colour */
  const setOpt = (key, v) => {
    if (key === 'menu') {
      $$('[data-wp]').forEach(el => el.hidden = el.dataset.wp !== v);
      const pw = $('#p-work'); if (pw && v === 'a') pw.style.backgroundColor = '';
      if (pw && v === 'b') { const a = $('.t-list a.is-active'); if (a) pw.style.backgroundColor = a.dataset.wash; }
    }
    if (key === 'pagecolour') root.dataset.pagecolour = v;
    $$(`[data-opt="${key}"]`).forEach(b => b.setAttribute('aria-pressed', b.dataset.val === v));
    store.set('wove1-' + key, v);
  };
  setOpt('menu', store.get('wove1-menu') || 'b');
  setOpt('pagecolour', store.get('wove1-pagecolour') || 'theme');
  $$('[data-opt]').forEach(b => b.addEventListener('click', () => setOpt(b.dataset.opt, b.dataset.val)));

  /* Accessibility (after Pallas): plain switches, each showing whether it is on. Saved on this device only. */
  const SIZES = ['md', 'lg', 'xl'], SIZE_NAMES = { md: 'Standard', lg: 'Larger', xl: 'Largest' };
  const DEFAULTS = { text: 'md', contrast: 'std', motion: 'full', links: 'plain' };
  const a11y = () => { let s = {}; try { s = JSON.parse(store.get('wove1-a11y') || '{}'); } catch (e) {} for (const k in DEFAULTS) if (s[k] === DEFAULTS[k]) delete s[k]; return s; };
  const loadEasy = () => { if ($('link[data-easy]')) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.easy = ''; l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'; document.head.append(l); };
  const paintA11y = () => {
    const s = a11y();
    $$('[data-set]').forEach(b => { const on = s[b.dataset.set] === b.dataset.on; b.setAttribute('aria-pressed', on); const st = $('.st', b); if (st) st.textContent = on ? 'On' : 'Off'; });
    const size = s.text || 'md';
    $$('[data-size-label]').forEach(l => l.textContent = SIZE_NAMES[size]);
    $$('[data-size]').forEach(b => { const d = +b.dataset.size; b.setAttribute('aria-disabled', (d < 0 && size === 'md') || (d > 0 && size === 'xl')); });
    $$('.a11y-opts .reset').forEach(r => r.hidden = !Object.keys(s).length);
  };
  const saveA11y = (s) => {
    store.set('wove1-a11y', JSON.stringify(s));
    ['text', 'contrast', 'grey', 'font', 'motion', 'links'].forEach(k => { if (s[k]) root.dataset[k] = s[k]; else delete root.dataset[k]; });
    if (s.font === 'easy') loadEasy();
    paintA11y();
    requestAnimationFrame(() => placeA11y());
  };
  $$('[data-set]').forEach(b => b.addEventListener('click', () => { const s = a11y(), k = b.dataset.set; if (s[k] === b.dataset.on) delete s[k]; else s[k] = b.dataset.on; saveA11y(s); }));
  $$('[data-size]').forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') === 'true') return;
    const s = a11y(); const v = SIZES[Math.max(0, Math.min(2, SIZES.indexOf(s.text || 'md') + +b.dataset.size))];
    if (v === 'md') delete s.text; else s.text = v; saveA11y(s);
  }));
  $$('[data-a11y-reset]').forEach(b => b.addEventListener('click', () => { saveA11y({}); toast('Back to the standard settings'); }));
  saveA11y(a11y());

  /* Search: every page, person, theme and client, as you type */
  const sp = $('#p-search');
  if (sp && window.WOVE_INDEX) {
    const input = $('input', sp), out = $('.sr-groups', sp), meta = $('.sr-meta', sp), empty = $('.sr-empty', sp);
    const IDX = window.WOVE_INDEX;
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const hi = (s, q) => { const i = norm(s).indexOf(q); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
    let active = -1;
    const run = () => {
      const q = norm(input.value.trim());
      active = -1;
      if (!q) { out.innerHTML = ''; empty.hidden = false; meta.textContent = ''; return; }
      empty.hidden = true;
      const words = q.split(/\s+/);
      const hits = IDX.map(it => { const hay = norm(it.t + ' ' + (it.s || '') + ' ' + (it.x || '')); let sc = 0; for (const w of words) { if (!hay.includes(w)) return null; sc += norm(it.t).includes(w) ? 3 : 1; } return [sc, it]; }).filter(Boolean).sort((a, b) => b[0] - a[0]).map(x => x[1]);
      meta.textContent = hits.length ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : 'Nothing found. Try a theme, a client or a name.';
      const groups = {};
      hits.slice(0, 24).forEach(h => (groups[h.g] = groups[h.g] || []).push(h));
      out.innerHTML = Object.entries(groups).map(([g, items]) => `<div class="sr-group"><h3 class="label">${esc(g)}</h3><ul>${items.map(it => `<li><a class="sr-item" href="${it.h}"${it.c ? ` style="--c:${it.c}"` : ''}><span class="th">${it.i ? `<img src="${it.i}" alt="" loading="lazy">` : ''}</span><span><b>${hi(it.t, words[0])}</b><small>${esc(it.s || '')}</small></span>${ARROW}</a></li>`).join('')}</ul></div>`).join('');
    };
    const ARROW = '<svg class="arrow" viewBox="0 0 18 14" aria-hidden="true"><path class="s" d="M2 7h11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path class="h" d="M9.5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    input.addEventListener('input', run);
    input.addEventListener('keydown', (e) => {
      const items = $$('.sr-item', out); if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((x, i) => x.classList.toggle('is-active', i === active)); items[active].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') { e.preventDefault(); (items[Math.max(0, active)]).click(); }
    });
    $$('[data-try]', sp).forEach(b => b.addEventListener('click', () => { input.value = b.dataset.try; run(); input.focus(); }));
    $$('form', sp).forEach(f => f.addEventListener('submit', (e) => e.preventDefault()));
  }

  /* Mobile menu */
  const mm = $('.mm'), burger = $('.burger');
  if (mm && burger) {
    $$('.mm-list > li', mm).forEach((li, i) => li.style.setProperty('--i', i));
    const open = () => { closePanel(); mm.classList.add('is-open'); mm.removeAttribute('inert'); burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); document.body.style.overflow = 'hidden'; setTimeout(() => $('.close', mm).focus(), 60); };
    const close = (back = true) => { mm.classList.remove('is-open'); mm.setAttribute('inert', ''); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); document.body.style.overflow = ''; if (back) burger.focus(); };
    burger.addEventListener('click', open);
    $('.close', mm).addEventListener('click', () => close());
    mm.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('a,button', mm).filter(x => x.offsetParent);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    $$('.mm-row[aria-controls]', mm).forEach(b => b.addEventListener('click', () => {
      const s = document.getElementById(b.getAttribute('aria-controls'));
      const on = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', on); s.classList.toggle('is-open', on);
    }));
    $$('[data-talk], [data-open-a11y], [aria-controls="p-search"]', mm).forEach(a => a.addEventListener('click', () => close(false)));
  }

  /* Talk to us dialog */
  /* Talk to someone: every Talk button goes to the contact page, which picks that person in the form */
  $$('[data-talk]').forEach(el => el.addEventListener('click', () => store.sset('wove1-to', el.dataset.talk || '')));

  /* Copy buttons */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.dataset.copy)));

  /* Email sign-ups (prototype: nothing is sent) */
  $$('form[data-email]').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('input', f), st = $('.status', f);
    if (!inp.value || !inp.checkValidity()) { st.textContent = 'Enter an email address like name@example.ie.'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    inp.removeAttribute('aria-invalid');
    st.textContent = 'Thanks. In the real site this would sign ' + inp.value + ' up. Nothing was sent.';
    inp.value = '';
  }));

  /* Theme picker: tabs that tint the whole band */
  $$('[data-picker]').forEach(band => {
    const tabs = $$('[role="tab"]', band);
    const select = (tab, focus) => {
      tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; const p = document.getElementById(t.getAttribute('aria-controls')); p.hidden = !on; if (on && !reduce()) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); } });
      band.style.setProperty('--band', tab.dataset.c); band.style.setProperty('--band-ink', tab.dataset.ink);
      band.classList.toggle('on-dark', tab.dataset.ink === '#FAF9F6');
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key; let n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0]; if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    /* arriving at what-we-do.html#strategy opens the Strategy tab */
    const h = location.hash.slice(1), t = h && tabs.find(x => x.getAttribute('aria-controls') === h);
    if (t) { select(t); setTimeout(() => band.scrollIntoView({ block: 'start' }), 50); }
  });

  /* Rows and accordions that open */
  $$('.team-btn').forEach(b => b.addEventListener('click', () => {
    const team = b.closest('.team'); const on = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', on); team.classList.toggle('is-open', on);
  }));
  $$('[data-acc]').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', on); document.getElementById(b.getAttribute('aria-controls')).classList.toggle('is-open', on);
  }));

  /* Home B: a team named in the sentence lights its column, and the other way round */
  $$('[data-woven]').forEach(w => {
    const light = (k, on) => $$(`[data-team="${k}"]`, w).forEach(x => x.classList.toggle('is-lit', on));
    $$('[data-team]', w).forEach(el => {
      ['pointerenter', 'focusin'].forEach(ev => el.addEventListener(ev, () => light(el.dataset.team, true)));
      ['pointerleave', 'focusout'].forEach(ev => el.addEventListener(ev, () => light(el.dataset.team, false)));
    });
  });

  /* What if: point at another question to preview it in the headline */
  $$('[data-whatif]').forEach(box => {
    const h = $('h2', box); const orig = h.textContent; let t;
    const swap = (txt) => { clearTimeout(t); if (h.textContent === txt) return; h.classList.add('is-swapping'); t = setTimeout(() => { h.textContent = txt; h.classList.remove('is-swapping'); }, reduce() ? 0 : 220); };
    $$('[data-q]', box).forEach(a => {
      ['pointerenter', 'focus'].forEach(ev => a.addEventListener(ev, () => swap(a.dataset.q)));
      ['pointerleave', 'blur'].forEach(ev => a.addEventListener(ev, () => swap(orig)));
    });
  });

  /* Mixed grid (after Leah's Wove Mind frame): each card drops into the shortest column, in reading order */
  const mCols = () => innerWidth >= 900 ? 3 : innerWidth >= 600 ? 2 : 1;
  const layout = (m) => {
    if (!m._items) return;
    if (m.hidden || !m.offsetParent) { m._dirty = true; return; }
    const n = mCols(), cols = [];
    for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'm-col'; cols.push(c); }
    m.replaceChildren(...cols); m.classList.add('is-laid'); m._n = n; m._dirty = false;
    const gap = parseFloat(getComputedStyle(cols[0]).rowGap) || 0, h = new Array(n).fill(0);
    m._items.forEach(it => {
      if (it.hidden) { cols[n - 1].append(it); return; }
      const k = h.indexOf(Math.min(...h)); cols[k].append(it); h[k] += it.offsetHeight + gap;
    });
  };
  const masonries = $$('[data-masonry]');
  masonries.forEach(m => { m._items = [...m.children]; layout(m); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => masonries.forEach(m => layout(m)));
  let mT; addEventListener('resize', () => { clearTimeout(mT); mT = setTimeout(() => masonries.forEach(m => { if (m._n !== mCols() || m._dirty) layout(m); }), 120); });

  /* Lists: sort, and switch between views with a smooth hand-off */
  $$('[data-list]').forEach(wrap => {
    const sortSel = $('select', wrap);
    sortSel && sortSel.addEventListener('change', () => vt(() => {
      $$('[data-sortable]', wrap).forEach(list => {
        const key = sortSel.value;
        const cmp = (a, b) => key === 'old' ? a.dataset.d.localeCompare(b.dataset.d) : key === 'seq' ? (+a.dataset.s - +b.dataset.s) : key === 'seqd' ? (+b.dataset.s - +a.dataset.s) : b.dataset.d.localeCompare(a.dataset.d);
        if (list._items) { list._items.sort(cmp); layout(list); return; }
        const rows = [...list.children].filter(r => r.dataset.d);
        rows.sort(cmp); rows.forEach(r => list.append(r));
      });
    }));
    $$('[data-view]', wrap).forEach(b => b.addEventListener('click', () => vt(() => {
      $$('[data-view]', wrap).forEach(x => x.setAttribute('aria-pressed', x === b));
      $$('[data-pane]', wrap).forEach(p => p.hidden = p.dataset.pane !== b.dataset.view);
      $$('[data-masonry]', wrap).forEach(m => { if (!m.hidden) layout(m); });
    })));
  });

  /* Wove Mind: filter by topic and by kind, load more, all in the mixed grid */
  $$('[data-feed]').forEach(sec => {
    const m = $('[data-masonry]', sec); if (!m || !m._items) return;
    const cards = m._items, step = +sec.dataset.initial || 12;
    const btns = $$('[data-f]', sec), kindSel = $('select[data-kind]', sec), more = $('[data-more]', sec), live = $('[data-live]', sec), empty = $('.feed-empty', sec);
    let shown = step, topic = 'all', kind = 'all';
    const fits = (c) => (topic === 'all' || (c.dataset.t || '').split(' ').includes(topic)) && (kind === 'all' || c.dataset.k === kind);
    const render = (animate) => {
      let n = 0;
      cards.forEach(c => { const ok = fits(c); const vis = ok && n < shown; if (ok) n++; const was = !c.hidden; c.hidden = !vis;
        if (vis && (!was || animate) && !reduce()) { c.classList.remove('is-new'); void c.offsetWidth; c.classList.add('is-new'); } });
      layout(m);
      const visible = cards.filter(c => !c.hidden).length;
      if (empty) empty.hidden = n > 0;
      if (more) more.hidden = visible >= n;
      if (live) live.textContent = n ? `Showing ${visible} of ${n}` : '';
    };
    btns.forEach(b => b.addEventListener('click', () => { topic = b.dataset.f; btns.forEach(x => x.setAttribute('aria-pressed', x === b)); shown = step; render(true); }));
    const kbtns = $$('[data-fk]', sec);
    kbtns.forEach(b => b.addEventListener('click', () => { kind = b.dataset.fk; kbtns.forEach(x => x.setAttribute('aria-pressed', x === b)); shown = step; render(true); }));
    kindSel && kindSel.addEventListener('change', () => { kind = kindSel.value; shown = step; render(true); });
    more && more.addEventListener('click', () => { const before = new Set(cards.filter(c => !c.hidden)); shown += step; render(); const first = cards.find(c => !c.hidden && !before.has(c)); if (first) first.focus({ preventScroll: true }); });
    render();
  });

  /* Team pages: the Right now card cycles through what the team is interested in */
  $$('[data-cycle]').forEach(ul => { const lis = [...ul.children]; if (lis.length < 2 || reduce()) return; let i = 0; setInterval(() => { lis[i].classList.remove('is-on'); i = (i + 1) % lis.length; lis[i].classList.add('is-on'); }, 2800); });

  /* Where to start: one answer open at a time */
  $$('[data-start-wrap]').forEach(w => { const btns = $$('[data-start]', w);
    btns.forEach(b => b.addEventListener('click', () => vt(() => { btns.forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.start-panel', w).forEach(p => p.hidden = p.id !== 'sp-' + b.dataset.start); }))); });

  /* People page: filter by team, and grid or name index */
  $$('[data-people]').forEach(sec => {
    const btns = $$('[data-team-f]', sec), live = $('[data-live]', sec);
    const items = $$('[data-team]', sec);
    btns.forEach(b => b.addEventListener('click', () => vt(() => {
      const f = b.dataset.teamF;
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      items.forEach(it => it.hidden = !(f === 'all' || it.dataset.team === f));
      const n = $$('[data-pane="grid"] [data-team]', sec).filter(x => !x.hidden).length;
      if (live) live.textContent = `Showing ${n} ${n === 1 ? 'person' : 'people'}`;
    })));
  });

  /* Home: one person at a time, with the next two waiting (after Wenner-Gren) */
  $$('[data-pf]').forEach(pf => {
    const cards = $$('.pf-card', pf.parentElement.querySelector('.pf-all'));
    const slots = ['a', 'b', 'c'].map(k => $('.pf-slot.' + k, pf));
    const live = $('[data-pf-live]', pf.parentElement);
    let i = 0;
    const show = (n, focus) => {
      i = (n + cards.length) % cards.length;
      const put = () => {
        slots.forEach((s, k) => { const c = cards[(i + k) % cards.length]; s.replaceChildren(c); $$('a,button', c).forEach(x => x.tabIndex = k === 0 ? 0 : -1); const pick = $('.pf-pick', c); if (pick) pick.tabIndex = k === 0 ? -1 : 0; });
      };
      if (document.startViewTransition && !reduce()) document.startViewTransition(put); else put();
      if (live) live.textContent = `${i + 1} of ${cards.length}: ${cards[i].dataset.name}`;
      const cnt = $('.pf-count', pf.parentElement); if (cnt) cnt.textContent = `${String(i + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      if (focus) setTimeout(() => { const l = $('.pf-slot.a .nm a', pf); l && l.focus(); }, 650);
    };
    cards.forEach((c, k) => { const b = $('.pf-pick', c); b && b.addEventListener('click', () => show(cards.indexOf(c), true)); });
    $$('[data-pf-step]', pf.parentElement).forEach(b => b.addEventListener('click', () => show(i + +b.dataset.pfStep)));
    pf.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
    show(0);
  });

  /* A picture follows the pointer along a text list (after WePresent and Sapiens) */
  if (fine.matches) {
    let pfEl = null, tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false, flip = 1;
    const ensure = () => { if (pfEl) return pfEl; pfEl = document.createElement('div'); pfEl.className = 'peek-float'; pfEl.setAttribute('aria-hidden', 'true'); pfEl.innerHTML = '<div class="pf"><img alt=""></div>'; document.body.append(pfEl); return pfEl; };
    const loop = () => { x += (tx - x) * .18; y += (ty - y) * .18; pfEl.style.transform = `translate(${x}px, ${y}px)`; if (on || Math.abs(tx - x) > .5) raf = requestAnimationFrame(loop); else raf = 0; };
    const seen = new Set();
    $$('[data-peeks]').forEach(box => box.addEventListener('pointerenter', () => $$('[data-peek]', box).forEach(x => { if (!seen.has(x.dataset.peek)) { seen.add(x.dataset.peek); const im = new Image(); im.src = x.dataset.peek; } }), { once: true }));
    $$('[data-peek]').forEach(el => {
      el.addEventListener('pointerenter', (e) => {
        const p = ensure(); const img = $('img', p); img.src = el.dataset.peek; flip = -flip;
        p.style.setProperty('--r', (flip * 3) + 'deg');
        tx = e.clientX + 16; ty = e.clientY - 215; if (!on) { x = tx; y = ty; }
        on = true; p.classList.add('is-on'); if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener('pointermove', (e) => { tx = e.clientX + 16; ty = e.clientY - 215; if (tx + 240 > innerWidth) tx = e.clientX - 236; if (ty < 8) ty = e.clientY + 32; });
      el.addEventListener('pointerleave', () => { on = false; pfEl && pfEl.classList.remove('is-on'); });
    });
    addEventListener('scroll', () => { if (on) { on = false; pfEl && pfEl.classList.remove('is-on'); } }, { passive: true });
  }

  /* Abbey: point at a group to follow its line to the joined-up experience */
  $$('.connect').forEach(c => {
    $$('li[data-i]', c).forEach(li => {
      const p = $(`path[data-i="${li.dataset.i}"]`, c);
      li.addEventListener('pointerenter', () => { c.classList.add('is-hover'); li.classList.add('is-lit'); p && p.classList.add('is-lit'); });
      li.addEventListener('pointerleave', () => { c.classList.remove('is-hover'); li.classList.remove('is-lit'); p && p.classList.remove('is-lit'); });
    });
    const svg = $('svg', c), end = $('.end', c);
    const lay = () => {
      const r = svg.getBoundingClientRect(); if (!r.width) return;
      const e = end.getBoundingClientRect(), ey = e.top + e.height / 2 - r.top, w = r.width;
      svg.setAttribute('viewBox', `0 0 ${w} ${r.height}`);
      $$('li[data-i]', c).forEach(li => {
        const p = $(`path[data-i="${li.dataset.i}"]`, c), b = $('span', li).getBoundingClientRect();
        const yy = b.top + b.height / 2 - r.top;
        p.setAttribute('d', `M0 ${yy.toFixed(1)} C ${(w * .45).toFixed(1)} ${yy.toFixed(1)}, ${(w * .5).toFixed(1)} ${ey.toFixed(1)}, ${w.toFixed(1)} ${ey.toFixed(1)}`);
        try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (err) {}
      });
    };
    lay(); if ('ResizeObserver' in window) new ResizeObserver(lay).observe(c);
  });

  /* Footnotes: the marker and its margin note light each other */
  $$('[data-fn]').forEach(m => {
    const n = document.getElementById(m.dataset.fn); if (!n) return;
    const on = (v) => { m.classList.toggle('is-lit', v); n.classList.toggle('is-lit', v); };
    [m, n].forEach(el => { el.addEventListener('pointerenter', () => on(true)); el.addEventListener('pointerleave', () => on(false)); });
    m.addEventListener('focus', () => on(true)); m.addEventListener('blur', () => on(false));
  });

  /* Things arrive once as you reach them: diagrams draw, numbers count, blocks rise */
  if (!reduce() && 'IntersectionObserver' in window) {
    const below = (el) => el.getBoundingClientRect().top > innerHeight * .92;
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (!e.isIntersecting) return;
      const t = e.target; io.unobserve(t);
      if (t.classList.contains('draw')) t.classList.add('is-drawing');
      if (t.classList.contains('rv')) t.classList.add('is-in');
      if (t.hasAttribute('data-count')) {
        const end = +t.dataset.count, t0 = performance.now(), dur = 1200;
        const step = (now) => { const k = Math.min(1, (now - t0) / dur); const v = Math.round(end * (1 - Math.pow(1 - k, 3))); t.textContent = v; if (k < 1) requestAnimationFrame(step); };
        t.textContent = '0'; requestAnimationFrame(step);
      }
    }), { rootMargin: '0px 0px -10% 0px' });
    $$('.draw').forEach(d => { if (below(d)) io.observe(d); });
    $$('[data-count]').forEach(d => { if (below(d)) io.observe(d); });
    const groups = new Map();
    $$('[data-rv] > *, .rv-me').forEach(el => {
      if (!below(el)) return;
      const g = el.parentElement; const n = groups.get(g) || 0; groups.set(g, n + 1);
      el.classList.add('rv'); el.style.setProperty('--d', (Math.min(n, 5) * 70) + 'ms'); io.observe(el);
    });
  }

  /* A picture you click grows into the next page's picture (cross-page view transition) */
  const clearMorph = () => $$('[style*="view-transition-name: morph"]').forEach(el => el.style.viewTransitionName = '');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const href = a.getAttribute('href'); if (!/^[\w-]+\.html(#[\w-]+)?$/.test(href)) return;
    store.sset('wove1-top', '1');
    clearMorph();
    if (href.includes('#')) { store.sset('wove1-morph', ''); return; }
    let src = a.closest('[data-morph-src]') || a.querySelector('[data-morph-src]');
    if (!src) src = a.closest('[data-morph-wrap]')?.querySelector('[data-morph-src]');
    if (src && !reduce()) { src.style.viewTransitionName = 'morph'; store.sset('wove1-morph', href.replace('.html', '')); }
    else store.sset('wove1-morph', '');
  });
  addEventListener('pageshow', (e) => { if (e.persisted) clearMorph(); });

  /* Share (after WePresent and Sapiens): a small pill that stays with you on a post */
  $$('.share').forEach(sh => {
    const b = $('button', sh);
    b.addEventListener('click', () => { const on = !sh.classList.contains('is-open'); sh.classList.toggle('is-open', on); b.setAttribute('aria-expanded', on); });
    $$('[data-share-copy]', sh).forEach(x => x.addEventListener('click', () => { copy(x.dataset.shareCopy, 'Link copied'); sh.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('click', (e) => { if (!sh.contains(e.target)) { sh.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && sh.classList.contains('is-open')) { sh.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
  });

  /* Contact form: checks as you go, then a thank-you (prototype: nothing is sent) */
  $$('form[data-contact]').forEach(f => {
    const to = store.sget('wove1-to'); if (to) { const r = $(`input[name="to"][value="${to}"]`, f); if (r) r.checked = true; }
    const check = (el) => {
      const err = document.getElementById(el.getAttribute('aria-describedby')?.split(' ').find(x => x.endsWith('-err')));
      let msg = '';
      if (el.required && !el.value.trim()) msg = el.dataset.need || 'Fill this in';
      else if (el.type === 'email' && el.value && !el.checkValidity()) msg = 'Enter an email address like name@example.ie';
      el.toggleAttribute('aria-invalid', !!msg); if (msg) el.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg; return !msg;
    };
    $$('[required]', f).forEach(el => el.addEventListener('blur', () => { if (el.value) check(el); }));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = $$('[required]', f).filter(el => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      const name = ($('[name="name"]', f).value || '').split(' ')[0];
      const who = $('input[name="to"]:checked', f);
      const done = $('.done', f.parentElement);
      $('h2', done).textContent = `Thanks${name ? ', ' + name : ''}. We\u2019ll be in touch.`;
      $('p', done).textContent = (who && who.value !== 'any' ? `${who.dataset.first} will` : 'Someone from the studio will') + ' reply within two working days. This is a prototype, so nothing was sent.';
      f.hidden = true; done.hidden = false; done.focus();
    });
  });

  /* Prototype switcher */
  const proto = $('.proto');
  if (proto) {
    const b = $('button', proto);
    b.addEventListener('click', () => { const on = !proto.classList.contains('is-open'); proto.classList.toggle('is-open', on); b.setAttribute('aria-expanded', on); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && proto.classList.contains('is-open')) { proto.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
    document.addEventListener('click', (e) => { if (!proto.contains(e.target)) { proto.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  }
})();
