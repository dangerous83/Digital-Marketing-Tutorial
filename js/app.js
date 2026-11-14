/* =========================================================================
   DesignQuest Academy — platform logic
   Router · progress & XP · lesson coach · spotlight · ghost cursor ·
   confetti · sound · modals · playground · certificate
   ========================================================================= */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COURSES = window.DQCourses;
  const AI = COURSES[0];
  const XP_STEP = 10, XP_QUIZ = 15, XP_LESSON = 50, XP_PER_LEVEL = 150;
  const PRAISE = ['Awesome! 🎉', 'You nailed it! 🔥', 'Great job! ⭐', 'Wow, like a pro! 😎', 'Perfect! 💯', 'Super! Keep going! 🚀', 'Designer skills unlocked! ✨', 'Yes! That\'s it! 🙌'];
  const CHEER = ['You can do it! 💪', 'Take your time 😊', 'Try the 💡 Hint if you get stuck!', 'Press 👀 Show me to watch it first.'];

  /* ------------------------------------------------------------ storage */
  const KEY = 'dq-progress-v1';
  const P = (() => {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { d = {}; }
    return Object.assign({ xp: 0, done: {}, steps: {}, quiz: {}, badges: {}, name: '', sound: true, last: null }, d);
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* storage unavailable */ } };

  /* ------------------------------------------------------------- editor */
  // one workspace per app: 'ai' = Illustrator simulator, 'ps' = Photoshop simulator
  const EDITORS = {};
  let ed = null, edKind = 'ai';
  function editor(kind = 'ai') {
    if (!EDITORS[kind]) {
      const host = document.createElement('div');
      host.className = 'ed-host';
      host.style.cssText = 'position:absolute;inset:0;';
      $('#playerHost').appendChild(host);
      const E = kind === 'ps' ? window.PSEditor : kind === 'ae' ? window.AEEditor : window.AIEditor;
      const e = new E(host, {});
      e._host = host;
      e.on(onEditorEvent);
      e.on(onEditorHelp);
      e.opts.confirm = ask;
      e.opts.onDownload = showExport;
      EDITORS[kind] = e;
    }
    return EDITORS[kind];
  }
  function mountEditor(host, kind = 'ai') {
    const e = editor(kind);
    Object.values(EDITORS).forEach((x) => { if (x !== e && x._host.parentNode) x._host.remove(); });
    if (e._host.parentNode !== host) host.appendChild(e._host);
    ed = e; edKind = kind;
    window.dqEditor = e; // handy for teachers/debugging
    requestAnimationFrame(() => { e.resize(); });
    return e;
  }
  const courseById = (id) => COURSES.find((c) => c.id === id) || AI;
  const courseOfLesson = (id) => COURSES.find((c) => c.lessons.some((l) => l.id === id));
  const appName = (c) => c.name.replace('Adobe ', '');

  /* --------------------------------------------------------------- XP */
  function level() { return Math.floor(P.xp / XP_PER_LEVEL) + 1; }
  function renderXP(bump) {
    $('#navLevel').textContent = 'Lv ' + level();
    $('#navXp').textContent = P.xp;
    $('#navXpBar').style.width = ((P.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 + '%';
    if (bump) { const p = $('.xp-pill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
  }
  function addXP(n, at) {
    const before = level();
    P.xp += n; save(); renderXP(true);
    const f = $('#xpFloat');
    f.textContent = `+${n} XP`;
    const x = at ? at.x : innerWidth / 2, y = at ? at.y : innerHeight / 2;
    f.style.left = x - 40 + 'px'; f.style.top = y - 20 + 'px';
    f.hidden = false; f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    clearTimeout(addXP._t); addXP._t = setTimeout(() => { f.hidden = true; }, 1300);
    if (level() > before) setTimeout(() => { say(`LEVEL UP! You are now level ${level()} 🎉`, 3500); sound('level'); confetti(innerWidth - 160, 40, 90); }, 700);
  }

  /* -------------------------------------------------------------- sound */
  let actx = null;
  function sound(kind) {
    if (!P.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { ok: [660, 990], quiz: [523, 784], wrong: [220, 180], level: [523, 659, 784, 1047], done: [523, 659, 784, 1047, 1319] }[kind] || [660];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
        o.type = kind === 'wrong' ? 'square' : 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.04 : 0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) { /* audio unavailable */ }
  }
  $('#soundBtn').addEventListener('click', () => { P.sound = !P.sound; save(); $('#soundBtn').textContent = P.sound ? '🔊' : '🔇'; if (P.sound) sound('ok'); });
  $('#soundBtn').textContent = P.sound ? '🔊' : '🔇';

  /* ----------------------------------------------------------- confetti */
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = 0;
  function confetti(x, y, n = 60, spread = 1) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const cols = ['#FF7A59', '#7C5CFF', '#19C3B1', '#FFC93C', '#FF5FA2', '#3B82F6', '#fff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 8) * spread;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, s: 5 + Math.random() * 7, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 90 + Math.random() * 50, shape: i % 3 });
    }
    if (!raf) tick();
  }
  function tick() {
    cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0);
    parts.forEach((p) => {
      p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life / 30); cx.fillStyle = p.c;
      if (p.shape === 0) cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else if (p.shape === 1) { cx.beginPath(); cx.arc(0, 0, p.s / 2.4, 0, 7); cx.fill(); }
      else { cx.beginPath(); cx.moveTo(0, -p.s / 2); cx.lineTo(p.s / 2, p.s / 2); cx.lineTo(-p.s / 2, p.s / 2); cx.fill(); }
      cx.restore();
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* -------------------------------------------------------------- modal */
  function modal(html, opts = {}) {
    const w = $('#modal'), box = $('#modalBox');
    box.className = 'modal' + (opts.wide ? ' wide' : '');
    box.innerHTML = `<button class="modal-x" aria-label="Close">×</button>${html}`;
    w.hidden = false;
    box.querySelector('.modal-x').onclick = closeModal;
    w.onclick = (e) => { if (e.target === w) closeModal(); };
    setTimeout(() => { const f = box.querySelector('[autofocus]') || box.querySelector('.btn'); f && f.focus(); }, 50);
    return box;
  }
  /** in-page confirmation (browser confirm() popups are blocked in some hosts) */
  function ask(msg, yesLabel, onYes) {
    const box = modal(`<div class="big-badge">🤔</div><h2>Are you sure?</h2><p>${esc(msg)}</p>
      <div class="modal-btns"><button class="btn btn-soft" data-no>Cancel</button><button class="btn btn-primary" data-yes>${esc(yesLabel || 'Yes')}</button></div>`);
    box.querySelector('[data-no]').onclick = closeModal;
    box.querySelector('[data-yes]').onclick = () => { closeModal(); onYes(); };
  }
  /** show exported files on screen too, in case the browser blocks downloads */
  function showExport(blob, name) {
    const url = URL.createObjectURL(blob);
    const box = modal(`<div class="big-badge">🎉</div><h2>Your file is ready!</h2>
      <p>If the download didn't start, <b style="color:#fff">right-click</b> (or long-press) the ${/^video/.test(blob.type) ? 'video' : 'picture'} and choose <b style="color:#fff">${/^video/.test(blob.type) ? 'Save video as' : 'Save image'}</b>.</p>
      <div class="modal-img" style="max-width:480px;background:#fff">${/^video/.test(blob.type) ? `<video src="${url}" controls autoplay loop muted playsinline style="width:100%;display:block"></video>` : `<img src="${url}" alt="${esc(name)}">`}</div>
      <div class="modal-btns"><button class="btn btn-primary" data-ok>Done</button></div>`);
    box.querySelector('[data-ok]').onclick = closeModal;
  }
  function closeModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  function shortcutsModal(which) {
    const C = window.AIEditor.CMD, S = window.AIEditor.SHIFT, A = window.AIEditor.ALT;
    const g = (t, rows) => `<div class="sc-group"><h3>${t}</h3>${rows.map(([a, b]) => `<div class="sc-row"><span>${a}</span><span>${b.split(' ').map((k) => `<kbd>${esc(k)}</kbd>`).join(' ')}</span></div>`).join('')}</div>`;
    const kind = typeof which === 'string' ? which : (document.body.classList.contains('in-player') ? edKind : (location.hash.includes('photoshop') ? 'ps' : location.hash.includes('aftereffects') ? 'ae' : 'ai'));
    const tabs = `<div class="sc-tabs"><button class="btn ${kind === 'ai' ? 'btn-primary' : 'btn-soft'}" data-sck="ai">Illustrator</button><button class="btn ${kind === 'ps' ? 'btn-primary' : 'btn-soft'}" data-sck="ps">Photoshop</button><button class="btn ${kind === 'ae' ? 'btn-primary' : 'btn-soft'}" data-sck="ae">After Effects</button></div>`;
    if (kind === 'ae') {
      const box = modal(`<h2>⌨️ After Effects shortcuts</h2>${tabs}<p>After Effects is all about the keyboard — these will make you fast!</p>
      <div class="sc-grid">
        ${g('Show properties', [['Position', 'P'], ['Scale', 'S'], ['Rotation', 'R'], ['Opacity', 'T'], ['Anchor Point', 'A'], ['All keyframes', 'U']])}
        ${g('Time', [['Play / Stop', 'Space'], ['First / last frame', 'Home End'], ['Next / previous frame', 'PgDn PgUp'], ['Previous / next keyframe', 'J K'], ['Move layer start here', '[']])}
        ${g('Keyframes', [['Easy Ease', 'F9'], ['Select more', 'Shift click'], ['Delete keyframe', 'Del']])}
        ${g('Tools', [['Selection', 'V'], ['Hand', 'H'], ['Zoom', 'Z'], ['Rotation', 'W'], ['Pan Behind (anchor)', 'Y'], ['Shapes', 'Q'], ['Type', C + 'T']])}
        ${g('Layers & Comp', [['Duplicate layer', C + 'D'], ['New Solid', C + 'Y'], ['Comp Settings', C + 'K'], ['Undo', C + 'Z'], ['Export video', C + 'M']])}
      </div>`, { wide: true });
      box.querySelectorAll('[data-sck]').forEach((b) => b.onclick = () => shortcutsModal(b.dataset.sck));
      return;
    }
    if (kind === 'ps') {
      const box = modal(`<h2>⌨️ Photoshop shortcuts</h2>${tabs}<p>Learn the tool letters first — pros barely use the mouse for tools!</p>
      <div class="sc-grid">
        ${g('Tools', [['Move', 'V'], ['Marquee', 'M'], ['Lasso', 'L'], ['Magic Wand', 'W'], ['Crop', 'C'], ['Eyedropper', 'I'], ['Spot Healing', 'J'], ['Brush', 'B'], ['Clone Stamp', 'S'], ['Eraser', 'E'], ['Gradient / Bucket', 'G'], ['Type', 'T'], ['Hand (hold)', 'Space'], ['Zoom', 'Z']])}
        ${g('Edit', [['Undo', C + 'Z'], ['Redo', S + C + 'Z'], ['Free Transform', C + 'T'], ['Copy', C + 'C'], ['Paste', C + 'V'], ['Fill with foreground', A + '⌫'], ['Delete pixels', 'Del']])}
        ${g('Select', [['Select All', C + 'A'], ['Deselect', C + 'D'], ['Inverse', S + C + 'I'], ['Add to selection', 'Shift'], ['Subtract', A.replace('+', '')]])}
        ${g('Layers', [['New layer', S + C + 'N'], ['Duplicate / Via Copy', C + 'J'], ['Merge Down', C + 'E'], ['Bring forward', C + ']'], ['Send backward', C + '['], ['Nudge (Move tool)', '← ↑ → ↓']])}
        ${g('Brush & Color', [['Smaller / bigger brush', '[ ]'], ['Opacity 10–100%', '1 … 0'], ['Swap colors', 'X'], ['Default colors', 'D'], ['Hue/Saturation', C + 'U'], ['Invert', C + 'I'], ['Fit on screen', C + '0']])}
      </div>`, { wide: true });
      box.querySelectorAll('[data-sck]').forEach((b) => b.onclick = () => shortcutsModal(b.dataset.sck));
      return;
    }
    const box = modal(`<h2>⌨️ Keyboard shortcuts</h2>${tabs}<p>Pros use shortcuts to work fast. Start with the tools — one letter each!</p>
      <div class="sc-grid">
        ${g('Tools', [['Selection', 'V'], ['Direct Selection', 'A'], ['Pen', 'P'], ['Type', 'T'], ['Line Segment', '\\'], ['Rectangle', 'M'], ['Ellipse', 'L'], ['Paintbrush', 'B'], ['Pencil', 'N'], ['Rotate', 'R'], ['Eyedropper', 'I'], ['Hand (hold)', 'Space'], ['Zoom', 'Z']])}
        ${g('Edit', [['Undo', C + 'Z'], ['Redo', S + C + 'Z'], ['Copy', C + 'C'], ['Paste', C + 'V'], ['Duplicate', C + 'D'], ['Delete', 'Del'], ['Select All', C + 'A'], ['Deselect', S + C + 'A']])}
        ${g('Object', [['Group', C + 'G'], ['Ungroup', S + C + 'G'], ['Bring to Front', S + C + ']'], ['Send to Back', S + C + '['], ['Lock', C + '2'], ['Hide', C + '3'], ['Nudge', '← ↑ → ↓']])}
        ${g('Color & View', [['Fill ⇄ Stroke', 'X'], ['Swap colors', S + 'X'], ['Default colors', 'D'], ['None', '/'], ['Fit artboard', C + '0'], ['Zoom in', C + '+'], ['Outline mode', C + 'Y'], ['Rulers', C + 'R']])}
        ${g('While drawing', [['Perfect square / circle', 'Shift'], ['Draw from center', A.replace('+', '')], ['Finish pen path', 'Enter'], ['Duplicate while moving', A.replace('+', '') + ' drag']])}
      </div>`, { wide: true });
    box.querySelectorAll('[data-sck]').forEach((b) => b.onclick = () => shortcutsModal(b.dataset.sck));
  }
  $$('[data-open="shortcuts"]').forEach((b) => b.addEventListener('click', () => shortcutsModal()));

  /* ------------------------------------------------------------- mascot */
  let sayT;
  function say(text, ms = 2600, cheer) {
    const m = $('#mascot');
    $('#mascotSay').textContent = text;
    m.classList.add('talk');
    if (cheer) { m.classList.remove('cheer'); void m.offsetWidth; m.classList.add('cheer'); }
    clearTimeout(sayT);
    sayT = setTimeout(() => m.classList.remove('talk'), ms);
  }

  /* ============================================================ ROUTER */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    let page = 'home', a, b, m;
    if (h.includes('/')) [page, a, b] = h.split('/'); // old-style links
    else if ((m = h.match(/^course-(.+)$/))) { page = 'course'; a = m[1]; }
    else if ((m = h.match(/^lesson-(.+?)(?:-s(\d+))?$/))) { page = 'lesson'; a = m[1]; b = m[2]; }
    else if (h === 'playground' || h === 'playground-photoshop' || h === 'playground-aftereffects') { page = 'playground'; a = h === 'playground' ? 'illustrator' : h.replace('playground-', ''); }
    leavePlayer();
    closeModal();
    $$('.view').forEach((v) => { v.hidden = true; });
    $$('.nav-links a').forEach((l) => l.classList.toggle('on', l.dataset.nav === (page || 'home')));
    document.body.classList.remove('in-player');
    if (page === 'course') return showCourse(a || 'illustrator');
    if (page === 'lesson') return showLesson(a, parseInt(b, 10) || 0);
    if (page === 'playground') return showPlayground(a || 'illustrator');
    showHome();
  }
  window.addEventListener('hashchange', route);

  /* ============================================================== HOME */
  function lessonProgress(c) {
    const total = c.lessons.length, done = c.lessons.filter((l) => P.done[l.id]).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }
  function nextLesson(c) { return c.lessons.find((l) => !P.done[l.id]) || c.lessons[0]; }

  function showHome() {
    $('#view-home').hidden = false;
    window.scrollTo(0, 0);
    document.title = 'DesignQuest Academy';
    const pr = lessonProgress(AI);
    $('#heroStart').textContent = pr.done ? (pr.done === pr.total ? 'Review Illustrator →' : 'Continue learning →') : 'Start learning Illustrator →';
    $('#courseGrid').innerHTML = COURSES.map((c) => {
      const p = lessonProgress(c);
      const open = c.status === 'open';
      return `<a class="course-card${open ? '' : ' soon'}" href="#course-${c.id}">
        <div class="cc-img"><img src="${c.img}" alt="" loading="lazy">${open ? '' : '<span class="soon-badge">🔒 Coming soon</span>'}
          <span class="cc-app" style="background:${c.bg};color:${c.color};border-color:${c.color}">${c.short}</span></div>
        <div class="cc-body"><h3>${c.name}</h3><span class="cc-tag">${c.tag}</span>
          ${open ? `<div class="cc-meta"><div class="cc-progress"><i style="width:${p.pct}%"></i></div><span>${p.done}/${p.total} lessons</span></div>
          <span class="btn btn-primary cc-cta">${p.done ? 'Continue' : 'Start course'} →</span>` : '<div class="cc-meta"><span>Coming soon 🎨</span></div>'}
        </div></a>`;
    }).join('');
    renderBadges($('#badgeShelf'));
  }
  function renderBadges(el) {
    el.innerHTML = COURSES.filter((c) => c.lessons.length).map((c) => `<div class="badge-group"><h3 class="badge-course"><span class="cc-mini" style="background:${c.bg};color:${c.color};border-color:${c.color}">${c.short}</span>${c.name}</h3><div class="badge-row">${c.lessons.map((l) => `<div class="badge${P.badges[l.id] ? ' got' : ''}" title="${P.badges[l.id] ? 'Earned!' : 'Finish “' + esc(l.title) + '” to earn'}"><span class="bi">${l.badge.icon}</span><div class="bn">${l.badge.name}</div></div>`).join('')}</div></div>`).join('');
  }

  /* ============================================================ COURSE */
  function showCourse(id) {
    const c = COURSES.find((x) => x.id === id) || AI;
    $('#view-course').hidden = false;
    window.scrollTo(0, 0);
    document.title = `${c.name} · DesignQuest`;
    const p = lessonProgress(c);
    const R = 40, L = 2 * Math.PI * R;
    $('#courseHead').innerHTML = `<span class="ch-app" style="background:${c.bg};color:${c.color};border-color:${c.color}">${c.short}</span>
      <div class="ch-text"><h1>${c.name}</h1><p>${c.status === 'open' ? `${c.lessons.length} playful lessons · ${c.goal || 'from zero to hero'}` : 'Coming soon!'}</p></div>
      ${c.status === 'open' ? `<div class="ring"><svg width="92" height="92"><circle cx="46" cy="46" r="${R}" stroke="rgba(255,255,255,.1)" stroke-width="9" fill="none"/><circle cx="46" cy="46" r="${R}" stroke="url(#rg)" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - p.pct / 100)}"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#19C3B1"/><stop offset="1" stop-color="#22C55E"/></linearGradient></defs></svg><b>${p.pct}%</b><small>complete</small></div>
      <a class="btn btn-primary btn-lg" href="#lesson-${(P.last && c.lessons.some((l) => l.id === P.last.lesson) && !P.done[P.last.lesson]) ? P.last.lesson + '-s' + P.last.step : nextLesson(c).id}">${p.done ? 'Continue →' : 'Start lesson 1 →'}</a>` : ''}`;
    if (c.status !== 'open') {
      $('#roadmap').innerHTML = `<div class="rm-item" style="justify-content:center"><div class="rm-card" style="width:min(640px,100%)"><div class="rm-img"><img src="${c.img}" alt="Photo editing course coming soon"></div><div class="rm-info"><small>Coming soon</small><h3>Photoshop course is on its way! 📸</h3><p>Layers, selections, retouching and photo magic — built the same playful, hands-on way. Finish the Illustrator course to be ready!</p><div style="margin-top:14px"><a class="btn btn-primary" href="#course-illustrator">Go to Illustrator →</a></div></div></div></div>`;
      $('#courseExtras').innerHTML = '';
      return;
    }
    const nxt = nextLesson(c);
    $('#roadmap').innerHTML = c.lessons.map((l, i) => {
      const done = !!P.done[l.id], isNext = !done && l === nxt;
      const st = (P.steps[l.id] || []).length;
      return `<div class="rm-item${done ? ' done' : ''}${isNext ? ' next' : ''}">
        <span class="rm-node">${done ? '✓' : i + 1}</span>
        <a class="rm-card" href="#lesson-${l.id}">
          <div class="rm-img"><img src="${l.img}" alt="" loading="lazy"><span class="rm-status">${done ? '✓ Completed' : isNext ? '▶ Up next' : `${l.badge.icon} ${l.badge.name}`}</span></div>
          <div class="rm-info"><small>Lesson ${i + 1}${l.final ? ' · Final project' : ''}</small><h3>${l.title}</h3><p>${l.sub}</p>
            <div class="rm-meta"><span>⏱ ${l.mins} min</span><span>🧩 ${l.steps.length} steps</span><span>⭐ ${l.steps.length * XP_STEP + XP_LESSON} XP</span></div>
            <div class="rm-steps"><i style="width:${Math.round((st / l.steps.length) * 100)}%"></i></div></div>
        </a></div>`;
    }).join('');
    $('#courseExtras').innerHTML = `
      <a class="extra-card" href="#${c.id === 'illustrator' ? 'playground' : 'playground-' + c.id}"><span class="ei">${{ photoshop: '📷', aftereffects: '🎬' }[c.id] || '🎨'}</span><div><h3>${appName(c)} Playground</h3><p>${{ photoshop: 'Edit any photo — even your own — with all the tools.', aftereffects: 'Animate anything you like with all the tools + presets.' }[c.id] || 'Free drawing with all the tools + fun challenges.'}</p></div></a>
      <button class="extra-card" type="button" data-open="shortcuts"><span class="ei">⌨️</span><div><h3>Shortcut cheat sheet</h3><p>All the keys pros use, on one page.</p></div></button>
      <button class="extra-card" type="button" id="resetProgress"><span class="ei">♻️</span><div><h3>Reset my progress</h3><p>Start the course again from zero.</p></div></button>`;
    $('#courseExtras [data-open="shortcuts"]').onclick = () => shortcutsModal(c.editor || 'ai');
    $('#resetProgress').onclick = () => {
      ask('Reset all XP, badges and lesson progress?', 'Reset', () => {
        Object.assign(P, { xp: 0, done: {}, steps: {}, quiz: {}, badges: {}, last: null }); save(); renderXP(); showCourse(c.id);
      });
    };
  }

  /* ============================================================ PLAYER */
  const S = { lesson: null, li: 0, si: 0, done: false, ghosting: false };
  let spotTimer = 0;

  function showLesson(id, si) {
    const course = courseOfLesson(id);
    if (!course) { location.hash = '#course-illustrator'; return; }
    const li = course.lessons.findIndex((l) => l.id === id);
    document.body.classList.add('in-player');
    $('#view-player').hidden = false;
    const kind = course.editor || 'ai';
    const fresh = S.lesson !== course.lessons[li] || edKind !== kind || !ed;
    mountEditor($('#playerHost'), kind);
    ed.opts.storageKey = null;
    const lesson = course.lessons[li];
    S.lesson = lesson; S.li = li; S.course = course;
    document.title = `${lesson.title} · DesignQuest`;
    $('#view-player .coach-back').href = `#course-${course.id}`;
    $('#coachLessonNum').textContent = `${appName(course)} · Lesson ${li + 1} of ${course.lessons.length}`;
    $('#coachLessonTitle').textContent = lesson.title;
    if (fresh || si === 0) { ed.setTemplate(null); lesson.setup && lesson.setup(ed); }
    goStep(Math.min(si, lesson.steps.length - 1), true);
    maybeSmallScreen();
    spotTimer = setInterval(updateSpot, 220);
  }
  function leavePlayer() {
    clearInterval(spotTimer);
    hideSpot();
    $('#ghost').hidden = true;
    S.ghosting = false;
    if (ed) { ed.endTextEdit && ed.endTextEdit(); ed.closeMenu(); ed.closePop(); ed.closeFlyout(); }
  }

  function stepKey() { return S.lesson.id; }
  function stepWasDone(i) { return (P.steps[stepKey()] || []).includes(i); }

  function goStep(i, initial) {
    const L = S.lesson;
    S.si = i;
    const step = L.steps[i];
    S.done = !step.task && !step.quiz;
    P.last = { lesson: L.id, step: i }; save();
    if (!initial) try { history.replaceState(null, '', `#lesson-${L.id}-s${i}`); } catch (e) { /* frame may block */ }
    if (step.setup) step.setup(ed); else if (!initial) ed.setTemplate(null);
    ed.clearLog();
    renderStep();
    if (S.done) markStep(i, false);
  }

  function renderStep() {
    const L = S.lesson, i = S.si, step = L.steps[i];
    $('#coachProgress').innerHTML = L.steps.map((s, k) => `<i class="${k === i ? 'cur' : stepWasDone(k) ? 'done' : ''}" data-k="${k}" title="Step ${k + 1}: ${esc(s.title.replace(/<[^>]+>/g, ''))}"></i>`).join('');
    $$('#coachProgress i').forEach((d) => d.addEventListener('click', () => goStep(+d.dataset.k)));
    let html = `<div class="step-anim"><span class="step-count">Step ${i + 1} of ${L.steps.length}</span><h2>${step.title}</h2>`;
    if (i === 0) html += `<div class="lesson-hero"><img src="${L.img}" alt=""></div>`;
    if (step.demo && window.DQDemos.has(step.demo)) html += `<div class="demo">${window.DQDemos.get(step.demo)}</div>`;
    if (step.body) html += `<div class="coach-text">${step.body}</div>`;
    if (step.task) {
      html += `<div class="mission${S.done ? ' done' : ''}" id="mission">
        <div class="mission-h">🎯 Your mission <span class="st" id="missionSt">${S.done ? '✓ Done!' : '<i class="dot"></i> Waiting…'}</span></div>
        <p>${step.task.text}</p>
        <div class="mission-btns">${step.task.hint ? '<button type="button" id="hintBtn">💡 Hint</button>' : ''}${step.ghost ? '<button type="button" id="ghostBtn">👀 Show me</button>' : ''}</div>
        <div id="hintBox"></div></div>`;
    }
    if (step.quiz) {
      const q = step.quiz;
      html += `<div class="quiz" id="quiz"><p class="quiz-q">❓ ${q.q}</p>${q.options.map((o, k) => `<button type="button" class="quiz-opt" data-k="${k}"><span class="qi">${'ABC'[k]}</span>${o}</button>`).join('')}<div class="quiz-fb" id="quizFb"></div></div>`;
    }
    html += '</div>';
    const body = $('#coachBody');
    body.innerHTML = html;
    body.scrollTop = 0;
    const hb = $('#hintBtn');
    if (hb) hb.onclick = () => { $('#hintBox').innerHTML = `<div class="hint">💡 ${step.task.hint}</div>`; };
    const gb = $('#ghostBtn');
    if (gb) gb.onclick = () => runGhost(step.ghost);
    $$('.quiz-opt').forEach((b) => b.addEventListener('click', () => answerQuiz(+b.dataset.k, b)));
    updateFoot();
    updateSpot();
    if (step.task && !S.done) setTimeout(() => say(i === 0 ? 'Let\'s start! 🚀' : CHEER[Math.floor(Math.random() * CHEER.length)], 2600), 400);
  }

  function updateFoot() {
    const L = S.lesson, last = S.si === L.steps.length - 1;
    const nb = $('#nextBtn');
    nb.disabled = !S.done;
    nb.textContent = last ? (L.final ? 'Finish course 🏆' : 'Finish lesson 🎉') : 'Next →';
    nb.classList.toggle('ready', S.done && !!(L.steps[S.si].task || L.steps[S.si].quiz));
    $('#prevBtn').style.visibility = S.si ? 'visible' : 'hidden';
    $('#skipBtn').hidden = S.done;
  }

  function markStep(i, award, xp = XP_STEP) {
    const arr = P.steps[stepKey()] = P.steps[stepKey()] || [];
    const first = !arr.includes(i);
    if (first) arr.push(i);
    save();
    const dot = $(`#coachProgress i[data-k="${i}"]`);
    if (dot && i !== S.si) dot.classList.add('done');
    if (award && first) {
      const r = ($('#mission') || $('#quiz') || $('#nextBtn')).getBoundingClientRect();
      addXP(xp, { x: r.left + r.width / 2, y: r.top });
    }
  }

  function completeStep() {
    if (S.done) return;
    S.done = true;
    const m = $('#mission');
    if (m) { m.classList.add('done'); $('#missionSt').innerHTML = '✓ Done!'; }
    markStep(S.si, true);
    sound('ok');
    const r = (m || $('#coach')).getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + 20, 46);
    say(PRAISE[Math.floor(Math.random() * PRAISE.length)], 2600, true);
    updateFoot();
    hideSpot();
  }

  function answerQuiz(k, btn) {
    const q = S.lesson.steps[S.si].quiz;
    if (S.done) return;
    if (k === q.answer) {
      btn.classList.add('right');
      $$('.quiz-opt').forEach((b) => { b.disabled = true; });
      $('#quizFb').innerHTML = `✅ ${q.explain}`;
      S.done = true;
      markStep(S.si, true, XP_QUIZ);
      sound('quiz');
      const r = btn.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top, 40);
      say(PRAISE[Math.floor(Math.random() * PRAISE.length)], 2400, true);
      updateFoot();
    } else {
      btn.classList.add('wrong'); btn.disabled = true;
      $('#quizFb').textContent = '🤔 Not quite — try another answer!';
      sound('wrong');
    }
  }

  function onEditorEvent(ev, src) {
    if (src && src !== ed) return;
    if (!S.lesson || $('#view-player').hidden) return;
    const step = S.lesson.steps[S.si];
    if (!step || !step.task || S.done || S.ghosting) return;
    if (ev.type !== 'action' && ev.type !== 'change') return;
    let ok = false;
    try { ok = step.task.check(ed); } catch (e) { console.error(e); }
    if (ok) completeStep();
  }

  $('#nextBtn').addEventListener('click', () => {
    const L = S.lesson;
    if (!S.done) return;
    if (S.si < L.steps.length - 1) goStep(S.si + 1);
    else finishLesson();
  });
  $('#prevBtn').addEventListener('click', () => { if (S.si > 0) goStep(S.si - 1); });
  $('#skipBtn').addEventListener('click', () => {
    const L = S.lesson;
    if (S.si < L.steps.length - 1) goStep(S.si + 1); else finishLesson();
  });
  $('#coachCollapse').addEventListener('click', () => toggleCoach(false));
  $('#coachReopen').addEventListener('click', () => toggleCoach(true));
  function toggleCoach(show) {
    $('#view-player .player').classList.toggle('coach-hidden', !show);
    $('#coachReopen').hidden = show;
    setTimeout(() => ed && ed.resize(), 320);
  }

  function finishLesson() {
    const L = S.lesson, first = !P.done[L.id];
    P.done[L.id] = true;
    P.badges[L.id] = true;
    save();
    if (first) addXP(XP_LESSON);
    sound('done');
    confetti(innerWidth / 2, innerHeight / 3, 140, 1.4);
    setTimeout(() => confetti(innerWidth / 4, innerHeight / 2, 70), 300);
    setTimeout(() => confetti((innerWidth * 3) / 4, innerHeight / 2, 70), 500);
    if (L.final) return certificateModal(S.course);
    const next = S.course.lessons[S.li + 1];
    const stepsDone = (P.steps[L.id] || []).length;
    const box = modal(`<div class="big-badge">${L.badge.icon}</div>
      <h2>Lesson complete!</h2>
      <p>You earned the <b style="color:#fff">${L.badge.name}</b> badge. ${['Amazing work!', 'You\'re getting really good at this!', 'Designers everywhere are proud of you!'][S.li % 3]}</p>
      <div class="modal-stats"><div><b>${stepsDone}/${L.steps.length}</b><span>steps done</span></div><div><b>${P.xp}</b><span>total XP</span></div><div><b>Lv ${level()}</b><span>your level</span></div></div>
      <div class="modal-btns"><a class="btn btn-soft" href="#course-${S.course.id}" data-close>Back to course</a>${next ? `<a class="btn btn-primary" href="#lesson-${next.id}" data-close>Next: ${esc(next.title)} →</a>` : ''}</div>`);
    $$('[data-close]', box).forEach((a) => a.addEventListener('click', closeModal));
  }

  /* --------------------------------------------------------- certificate */
  function certificateModal(course) {
    S.certCourse = course || AI;
    const other = COURSES.find((c) => c !== S.certCourse && c.status === 'open' && c.lessons.some((l) => !P.done[l.id]));
    ed.snapshotDataURL((art) => {
      const box = modal(`<div class="big-badge">🏆</div><h2>You finished the course!</h2>
        <p>You are now a certified <b style="color:#fff">${appName(S.certCourse)} Explorer</b>. Type your name for your certificate:</p>
        <input class="name-input" id="certName" maxlength="40" placeholder="Your name" value="${esc(P.name)}" autofocus>
        <img class="cert-preview" id="certImg" alt="Your certificate">
        <p style="font-size:13px;margin:-6px 0 14px">Tip: if the button doesn't download, right-click the certificate → <b style="color:#fff">Save image</b>.</p>
        <div class="modal-btns"><button class="btn btn-primary" id="certDl">⬇ Download certificate</button>${other ? `<a class="btn btn-good" href="#course-${other.id}" data-close>Next: ${other.name} →</a>` : ''}<a class="btn btn-soft" href="#home" data-close>Home</a></div>`, { wide: false });
      const draw = () => {
        P.name = $('#certName').value.trim(); save();
        drawCertificate(P.name || 'Awesome Designer', art, (url) => { $('#certImg').src = url; $('#certDl').dataset.url = url; });
      };
      $('#certName').addEventListener('input', () => { clearTimeout(draw._t); draw._t = setTimeout(draw, 250); });
      $('#certDl').onclick = () => { const a = document.createElement('a'); a.href = $('#certDl').dataset.url; a.download = 'DesignQuest-certificate.png'; a.click(); };
      $$('[data-close]', box).forEach((a) => a.addEventListener('click', closeModal));
      draw();
    }, 520);
  }
  function drawCertificate(name, art, cb) {
    const W = 1600, H = 1100, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1d1b4b'); bg.addColorStop(1, '#2a1640');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const border = g.createLinearGradient(0, 0, W, 0);
    ['#FF7A59', '#FF5FA2', '#7C5CFF', '#19C3B1'].forEach((col, i) => border.addColorStop(i / 3, col));
    g.strokeStyle = border; g.lineWidth = 18; g.strokeRect(40, 40, W - 80, H - 80);
    g.fillStyle = '#fff'; g.fillRect(70, 70, W - 140, H - 140);
    // confetti dots
    const cols = ['#FF7A59', '#7C5CFF', '#19C3B1', '#FFC93C', '#FF5FA2'];
    for (let i = 0; i < 60; i++) { g.fillStyle = cols[i % 5]; g.globalAlpha = 0.18; g.beginPath(); g.arc(90 + ((i * 263) % (W - 180)), 90 + ((i * 151) % 120) + (i % 2 ? H - 330 : 0), 6 + (i % 4) * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    g.textAlign = 'center';
    g.fillStyle = '#FF7A59'; g.font = '700 30px Poppins, sans-serif'; g.fillText('DESIGNQUEST ACADEMY', W / 2 - 220, 200);
    g.fillStyle = '#1d1b2e'; g.font = '800 76px Poppins, sans-serif'; g.fillText('Certificate', W / 2 - 220, 300);
    g.fillStyle = '#7a7896'; g.font = '500 32px Poppins, sans-serif'; g.fillText('of completion — proudly presented to', W / 2 - 220, 370);
    g.fillStyle = '#7C5CFF'; g.font = '400 92px Pacifico, cursive';
    let fs = 92; while (g.measureText(name).width > 820 && fs > 40) { fs -= 4; g.font = `400 ${fs}px Pacifico, cursive`; }
    g.fillText(name, W / 2 - 220, 500);
    g.strokeStyle = '#e4e2f2'; g.lineWidth = 3; g.beginPath(); g.moveTo(220, 535); g.lineTo(W - 660, 535); g.stroke();
    g.fillStyle = '#1d1b2e'; g.font = '600 34px Poppins, sans-serif'; g.fillText(`for completing the ${(S.certCourse || AI).name} Basics course`, W / 2 - 220, 610);
    g.fillStyle = '#7a7896'; g.font = '400 26px Poppins, sans-serif'; g.fillText((S.certCourse || AI).skills || '', W / 2 - 220, 660);
    g.font = '56px serif';
    (S.certCourse || AI).lessons.forEach((l, i) => { g.fillText(l.badge.icon, 250 + i * 88, 790); });
    g.fillStyle = '#7a7896'; g.font = '500 24px Poppins, sans-serif';
    g.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), 380, 930);
    g.fillText('Nibby · Head Coach', W - 900, 930);
    g.strokeStyle = '#1d1b2e'; g.lineWidth = 2; g.beginPath(); g.moveTo(260, 890); g.lineTo(500, 890); g.moveTo(W - 1020, 890); g.lineTo(W - 780, 890); g.stroke();
    g.fillStyle = '#7C5CFF'; g.font = '400 40px Pacifico, cursive'; g.fillText('Nibby', W - 900, 880);
    // art frame
    const fx = W - 560, fy = 210, fw = 420, fh = 315;
    g.fillStyle = '#f4f3fb'; g.fillRect(fx - 16, fy - 16, fw + 32, fh + 72);
    g.fillStyle = '#7a7896'; g.font = '600 22px Poppins, sans-serif'; g.fillText('My final project', fx + fw / 2, fy + fh + 40);
    const finish = () => { cb(c.toDataURL('image/png')); };
    if (art) {
      const img = new Image();
      img.onload = () => { g.drawImage(img, fx, fy, fw, fh); finish(); };
      img.onerror = finish;
      img.src = art;
    } else finish();
  }

  /* ----------------------------------------------------------- spotlight */
  function findHl(name) {
    if (!ed) return null;
    if (/^[[.#]/.test(name)) return ed.root.querySelector(name);
    return ed.root.querySelector(`[data-hl="${name}"]`);
  }
  function hideSpot() { $('#spot').hidden = true; }
  function updateSpot() {
    if (!S.lesson || $('#view-player').hidden) return hideSpot();
    const step = S.lesson.steps[S.si];
    if (S.done || !step || !step.hl || S.ghosting || !$('#modal').hidden) return hideSpot();
    let el = null;
    for (const h of step.hl) { const e = findHl(h); if (e && e.getBoundingClientRect().width) { el = e; break; } }
    if (!el) return hideSpot();
    const r = el.getBoundingClientRect(), sp = $('#spot'), pad = 4;
    if (r.bottom < 0 || r.top > innerHeight) return hideSpot();
    sp.hidden = false;
    Object.assign(sp.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    sp.classList.toggle('left', r.left > innerWidth * 0.62);
    sp.classList.toggle('below', r.width > 240 && r.left <= innerWidth * 0.62 ? false : r.top < 50);
    $('.spot-label', sp).textContent = step.hlLabel || (r.height > 300 ? 'Look here' : 'Click here');
  }

  /* -------------------------------------------------------- ghost cursor */
  async function runGhost(script) {
    if (S.ghosting || !script) return;
    S.ghosting = true;
    hideSpot();
    const g = $('#ghost'), key = $('.ghost-key', g);
    const wr = ed.$.wrap.getBoundingClientRect();
    let pos = { x: wr.left + wr.width / 2, y: wr.top + wr.height / 2 };
    g.style.transition = 'none';
    g.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    g.hidden = false;
    await sleep(60);
    g.style.transition = '';
    const moveTo = async (p, ms = 750) => { g.style.transitionDuration = ms + 'ms'; g.style.transform = `translate(${p.x}px, ${p.y}px)`; pos = p; await sleep(ms + 60); };
    const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    say('Watch me! 👀', 2000);
    try {
      for (const a of script) {
        if (!S.ghosting) break;
        if (a.el) {
          let el = findHl(a.el), tries = 0;
          while (!el && a.wait && tries++ < 15) { await sleep(100); el = findHl(a.el); }
          if (el) await moveTo(center(el));
          S._ghostEl = el;
        }
        if (a.doc) await moveTo(ed.docToClient({ x: a.doc[0], y: a.doc[1] }));
        if (a.click) {
          g.classList.remove('click'); void g.offsetWidth; g.classList.add('click');
          const el = S._ghostEl;
          if (el && el.classList.contains('ai-menu')) ed.openMenu(el);
          S._ghostEl = null;
          await sleep(500);
        }
        if (a.hold) {
          g.classList.remove('hold'); void g.offsetWidth; g.classList.add('hold');
          await sleep(500);
          const el = S._ghostEl;
          if (el && el.classList.contains('ai-tool')) ed.openFlyout(el, +el.dataset.group);
          await sleep(500);
        }
        if (a.drag) {
          const p1 = ed.docToClient({ x: a.drag[0][0], y: a.drag[0][1] }), p2 = ed.docToClient({ x: a.drag[1][0], y: a.drag[1][1] });
          await moveTo(p1);
          if (a.key) { key.textContent = 'hold ' + a.key; key.hidden = false; }
          g.classList.add('dragging');
          await moveTo(p2, 1300);
          g.classList.remove('dragging');
          key.hidden = true;
          await sleep(250);
        }
      }
      await sleep(700);
    } finally {
      const aborted = !S.ghosting; // leaving the lesson stops the demo
      g.hidden = true;
      key.hidden = true;
      S.ghosting = false;
      ed.closeMenu(); ed.closeFlyout();
      if (!aborted) say('Now you try! 😊', 2400);
      updateSpot();
    }
  }

  /* ------------------------------------------------------------ playground */
  const CHALLENGES = [
    { e: '🏠', t: 'Draw a house', d: 'Rectangle walls, a Polygon roof (3 sides!), rectangle door and windows.', tips: ['Polygon tool → click once → set Sides to 3 for a triangle roof.', 'Use Align to center the door.', 'Group the whole house with ' + window.AIEditor.CMD + 'G.'] },
    { e: '🙂', t: 'Emoji face', d: 'A big yellow circle, two eyes and a Pen-tool smile.', tips: ['Shift + Ellipse for perfect circles.', 'Pen tool: click, then click + drag to make the smile curve.', 'Stroke only, Fill None for the smile.'] },
    { e: '🌸', t: 'Flower power', d: 'Petals made from ellipses rotated around a center.', tips: ['Draw one ellipse petal, then Alt + drag to duplicate it.', 'Rotate each copy a little (R tool or rotate box in Properties).', 'Put a circle in the middle and Bring to Front.'] },
    { e: '🤖', t: 'Robot buddy', d: 'Rounded rectangles for the body, circles for eyes, a line antenna.', tips: ['Corner radius makes friendly robots!', 'Use the Line tool (\\) with Shift for a straight antenna.', 'Try a gradient on the body.'] },
    { e: '🌙', t: 'Night sky', d: 'A moon made with Minus Front, plus stars of different sizes.', tips: ['Two circles → select both → Pathfinder › Minus Front.', 'Star tool: drag to draw, then copy and paste more.', 'A dark rectangle background — lock it with ' + window.AIEditor.CMD + '2.'] },
    { e: '🪧', t: 'Name poster', d: 'Your name in a big fun font on a gradient background.', tips: ['Type tool → type → pick Bebas Neue or Pacifico.', 'Gradient swatch on a big rectangle, Send to Back.', 'Add a Drop Shadow to the text.'] },
  ];
  const PS_CHALLENGES = [
    { e: '📷', t: 'Edit your own photo', d: 'Open a photo from your computer and make it look amazing.', tips: ['File › Open Your Photo…', 'Brightness/Contrast + Hue/Saturation to make it pop.', 'Crop it to a square for Instagram (C, ratio 1:1).'] },
    { e: '🎈', t: 'Balloon cut-out', d: 'Cut the balloon out of the sky and put it on the beach.', tips: ['File › Place Sample › Hot Air Balloon.', 'Magic Wand on the sky → Select › Inverse → ' + window.PSEditor.CMD + 'J.', 'Delete the old balloon layer and Free Transform the cut-out.'] },
    { e: '🦩', t: 'Flamingo party', d: 'Fill the beach with flamingos of different sizes.', tips: ['File › Place Sample › Flamingo.', window.PSEditor.CMD + 'J to duplicate, then ' + window.PSEditor.CMD + 'T to resize and rotate.', 'Flip one with Edit › Transform › Flip Horizontal.'] },
    { e: '🌈', t: 'Pop-art colors', d: 'Crazy colors with Hue/Saturation and the Mosaic filter.', tips: ['Select half the photo with the Marquee.', 'Hue/Saturation → move Hue a lot.', 'Filter › Pixelate › Mosaic for a pixel-art look.'] },
    { e: '⚫', t: 'One color pop', d: 'Everything black & white except one object.', tips: ['Select the object (Lasso or Magic Wand).', 'Select › Inverse.', 'Image › Adjustments › Black & White.'] },
    { e: '🪧', t: 'Social media post', d: 'A square post with a bold title and a sticker.', tips: ['Crop 1:1.', 'Type tool + Bebas Neue + Stroke style.', 'Paint a circle sticker on a new layer with the Brush.'] },
  ];
  const AE_CHALLENGES = [
    { e: '🏀', t: 'Bouncing ball', d: 'Make a ball fall and bounce 3 times, getting smaller each time.', tips: ['Draw a circle (Q → Ellipse, Shift).', 'Try the Bounce Drop preset, then change the keyframes.', 'Select all keyframes and press F9.'] },
    { e: '🪐', t: 'Solar system', d: 'Planets orbiting a sun using parenting.', tips: ['Sun in the middle: animate Rotation 0° → 360°.', 'Planets: set their Parent to the Sun.', 'Add Glow to the sun!'] },
    { e: '🎉', t: 'Party title', d: 'A title that pops, spins and glows.', tips: ['Type your text.', 'Pop In + Spin presets.', 'Effect › Glow with a bright color.'] },
    { e: '🌅', t: 'Sunrise scene', d: 'The sun rises behind hills while the sky changes.', tips: ['Composition Settings → dark blue background.', 'Big orange circle: animate Position up.', 'Rectangle hills on top (layer order!).'] },
    { e: '🦩', t: 'Flamingo flight', d: 'Make the flamingo photo fly across the screen.', tips: ['Click Flamingo in the Project panel.', 'Animate Position along a curve with 3+ keyframes.', 'Add Rotation wiggles and Easy Ease.'] },
    { e: '📺', t: 'Channel intro', d: 'A 5-second intro for your own channel.', tips: ['Logo shape + Pop In.', 'Channel name + Typewriter.', 'File › Export › Video to share it!'] },
  ];
  function showPlayground(courseId = 'illustrator') {
    const isPS = courseId === 'photoshop', isAE = courseId === 'aftereffects';
    const kind = isPS ? 'ps' : isAE ? 'ae' : 'ai';
    document.body.classList.add('in-player');
    $('#view-playground').hidden = false;
    document.title = (isPS ? 'Photoshop' : isAE ? 'After Effects' : 'Illustrator') + ' Playground · DesignQuest';
    mountEditor($('#playHost'), kind);
    S.lesson = null;
    if (isPS) ed.reset({ photo: 'landscape', name: 'my-photo' });
    else if (isAE) ed.reset({ bg: '#14142B', layers: [{ kind: 'text', name: 'Animate me!', text: 'Animate me!', fsize: 80, props: { position: [480, 270] }, keys: { scale: [[0, [0, 0]], [0.4, [115, 115], 1], [0.6, [100, 100], 1]] } }] });
    else {
      ed.opts.storageKey = null;
      ed.reset();
      ed.opts.storageKey = 'dq-playground';
      ed.loadLocal();
    }
    ed.fit();
    const list = isPS ? PS_CHALLENGES : isAE ? AE_CHALLENGES : CHALLENGES;
    let open = -1;
    const render = () => {
      $('#playBody').innerHTML = `<div class="pg-switch"><a class="btn ${kind === 'ai' ? 'btn-primary' : 'btn-soft'}" href="#playground">✏️ Ai</a><a class="btn ${isPS ? 'btn-primary' : 'btn-soft'}" href="#playground-photoshop">📷 Ps</a><a class="btn ${isAE ? 'btn-primary' : 'btn-soft'}" href="#playground-aftereffects">🎬 Ae</a></div>
        <p class="coach-text" style="margin-top:4px">${isPS ? 'Edit any photo you like — try <b>File › Open Your Photo</b> to use your own! Need ideas? Pick a challenge:' : isAE ? 'Animate anything! Press <b>Space</b> to play, use the <b>stopwatch</b> ⏱ to make keyframes, or try the presets. Need ideas? Pick a challenge:' : 'Draw anything you like! Your work is <b>saved automatically</b> in this browser. Need ideas? Pick a challenge:'}</p>
        ${list.map((c, i) => `<button type="button" class="challenge${open === i ? ' on' : ''}" data-i="${i}"><span class="ce">${c.e}</span><span><h4>${c.t}</h4><p>${c.d}</p>${open === i ? `<ul class="coach-text" style="margin:8px 0 0;padding-left:18px;font-size:12.5px">${c.tips.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}</span></button>`).join('')}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-soft" id="pgClear" type="button">🧹 Clear</button><button class="btn btn-primary" id="pgExport" type="button">⬇ ${isAE ? 'Export Video' : 'Export PNG'}</button><button class="btn btn-soft" type="button" data-open="shortcuts">⌨️ Shortcuts</button></div>`;
      $$('#playBody .challenge').forEach((b) => b.addEventListener('click', () => { open = open === +b.dataset.i ? -1 : +b.dataset.i; render(); }));
      $('#pgClear').onclick = () => { const clear = () => { if (isPS) ed.reset({ w: 1000, h: 700, name: 'Untitled-1' }); else if (isAE) ed.reset({ bg: '#14142B' }); else { ed.reset(); ed.saveLocal(); } }; if (!ed.objs.length && kind === 'ai') clear(); else ask(isPS ? 'Start over with an empty white canvas?' : isAE ? 'Start over with an empty composition?' : 'Clear the whole artboard?', 'Clear', clear); };
      $('#pgExport').onclick = () => (isAE ? ed.exportVideo() : ed.exportPNG());
      $('#playBody [data-open="shortcuts"]').onclick = () => shortcutsModal(kind);
    };
    render();
    maybeSmallScreen();
  }

  /* ----------------------------------------------------------- helpers */
  let smallDismissed = false;
  function maybeSmallScreen() {
    if (smallDismissed || innerWidth >= 760) return;
    $('#smallScreen').hidden = false;
  }
  $('#smallScreenOk').addEventListener('click', () => { smallDismissed = true; $('#smallScreen').hidden = true; });

  window.addEventListener('resize', () => { if (!$('#view-player').hidden) updateSpot(); });

  // editor "Help" menu
  function onEditorHelp(ev, src) {
    if (ev.type !== 'help') return;
    if (ev.what === 'shortcuts') shortcutsModal(src instanceof window.PSEditor ? 'ps' : src instanceof window.AEEditor ? 'ae' : 'ai');
    else modal(`<div class="big-badge">🖋️</div><h2>Need help?</h2><p>Hover any tool to see what it does. In lessons, use the <b>💡 Hint</b> and <b>👀 Show me</b> buttons in the coach panel.</p><div class="modal-btns"><button class="btn btn-primary" data-x>Got it!</button></div>`).querySelector('[data-x]').onclick = closeModal;
  }

  /* --------------------------------------------------------------- boot */
  renderXP();
  route();
})();
