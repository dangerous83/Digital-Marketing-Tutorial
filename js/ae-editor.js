/* =========================================================================
   DesignQuest — After Effects Workspace Simulator
   A beginner-friendly recreation of the Adobe After Effects workspace:
   menu bar, horizontal toolbar, Project panel, Composition viewer,
   Effects & Presets / Properties panels and the Timeline with layers,
   twirl-down properties, stopwatches, keyframes, current-time indicator.
   Real animation engine: keyframes (linear + Easy Ease), position /
   scale / rotation / opacity / anchor, shape & text layers, typewriter,
   effects (blur, glow, drop shadow, fill), presets, parenting, layer
   timing, playback, undo/redo and video export.
   ========================================================================= */
(function () {
  'use strict';

  let UID = 1;
  const uid = () => 'a' + Date.now().toString(36) + (UID++);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const CMD = IS_MAC ? '⌘' : 'Ctrl+';
  const SHIFT = IS_MAC ? '⇧' : 'Shift+';
  const ALT = IS_MAC ? '⌥' : 'Alt+';
  const DPR = () => window.devicePixelRatio || 1;
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const CAN_FILTER = (() => { try { const g = mkCanvas(2, 2).getContext('2d'); g.filter = 'blur(2px)'; return g.filter === 'blur(2px)'; } catch (e) { return false; } })();

  const FONTS = {
    'Poppins': 'Poppins,sans-serif', 'Montserrat': 'Montserrat,sans-serif', 'Bebas Neue': "'Bebas Neue',Impact,sans-serif",
    'Playfair Display': "'Playfair Display',Georgia,serif", 'Pacifico': 'Pacifico,cursive', 'Lobster': 'Lobster,cursive', 'Roboto Mono': "'Roboto Mono',monospace",
  };
  const fontStack = (f) => FONTS[f] || FONTS.Poppins;
  const LABELS = ['#B53838', '#E4D84C', '#A9CBC7', '#E5BCC9', '#A9A9CA', '#E7C19E', '#B3C7B3', '#677DE0', '#4AA44C', '#8E2C9A', '#E8920D', '#7F452A', '#F46DD6', '#3DA2A5', '#A96CCB', '#1F5BAB'];
  const SWATCHES = ['#FFFFFF', '#000000', '#FF7A59', '#FFC93C', '#19C3B1', '#7C5CFF', '#FF5FA2', '#3B82F6', '#22C55E', '#ED1C24', '#F7931E', '#FCEE21', '#29ABE2', '#662D91', '#1D1B4B', '#FFE5B4'];

  const PROPS = {
    anchor: { name: 'Anchor Point', key: 'A', dim: 2, step: 1, unit: '' },
    position: { name: 'Position', key: 'P', dim: 2, step: 1, unit: '' },
    scale: { name: 'Scale', key: 'S', dim: 2, step: 0.5, unit: '%' },
    rotation: { name: 'Rotation', key: 'R', dim: 1, step: 0.5, unit: '°' },
    opacity: { name: 'Opacity', key: 'T', dim: 1, step: 0.5, unit: '%', min: 0, max: 100 },
  };
  const TRANSFORM = ['anchor', 'position', 'scale', 'rotation', 'opacity'];
  const FX = {
    blur: { name: 'Gaussian Blur', cat: 'Blur & Sharpen', props: { blur: { name: 'Blurriness', v: 20, step: 0.5, min: 0, max: 200 } } },
    shadow: { name: 'Drop Shadow', cat: 'Perspective', props: { dist: { name: 'Distance', v: 12, step: 0.5, min: 0, max: 200 }, soft: { name: 'Softness', v: 18, step: 0.5, min: 0, max: 200 } } },
    glow: { name: 'Glow', cat: 'Stylize', props: { radius: { name: 'Glow Radius', v: 24, step: 0.5, min: 0, max: 300 } }, color: '#FFC93C' },
    fill: { name: 'Fill', cat: 'Generate', props: {}, color: '#FF5FA2' },
  };
  const PRESETS = {
    'fade-in': { name: 'Fade In', icon: '🌅', tip: 'Opacity 0% → 100%' },
    'fade-out': { name: 'Fade Out', icon: '🌒', tip: 'Opacity 100% → 0% at the end' },
    'pop-in': { name: 'Pop In', icon: '💥', tip: 'Scale 0% → 115% → 100%' },
    'slide-in': { name: 'Slide In (from left)', icon: '➡️', tip: 'Position flies in from the left' },
    'spin': { name: 'Spin', icon: '🌀', tip: 'Rotation 0° → 360°' },
    'bounce': { name: 'Bounce Drop', icon: '🏀', tip: 'Falls down and bounces' },
    'typewriter': { name: 'Typewriter', icon: '⌨️', tip: 'Text appears letter by letter (text layers)' },
    'blur-in': { name: 'Blur In', icon: '🌫️', tip: 'Gaussian Blur 40 → 0' },
  };

  /* ---------------------------------------------------------------- tools */
  const TOOLS = {
    select: { name: 'Selection Tool', key: 'V', tip: 'Click a layer in the viewer to select it. Drag to move it.' },
    hand: { name: 'Hand Tool', key: 'H', tip: 'Drag to move around the viewer. (Hold Space!)' },
    zoom: { name: 'Zoom Tool', key: 'Z', tip: 'Click to zoom in, Alt+click to zoom out.' },
    rotate: { name: 'Rotation Tool', key: 'W', tip: 'Drag a layer to rotate it around its anchor point.' },
    anchor: { name: 'Pan Behind (Anchor Point) Tool', key: 'Y', tip: 'Drag to move the anchor point — the center of rotation and scale.' },
    rect: { name: 'Rectangle Tool', key: 'Q', tip: 'Drag in the viewer to draw a rectangle shape layer.' },
    ellipse: { name: 'Ellipse Tool', key: 'Q', tip: 'Drag to draw an ellipse. Hold Shift for a circle.' },
    star: { name: 'Star Tool', key: 'Q', tip: 'Drag to draw a star shape layer.' },
    type: { name: 'Horizontal Type Tool', key: CMD + 'T', tip: 'Click in the viewer and type to make a text layer.' },
  };
  const TOOL_GROUPS = [['select'], ['hand'], ['zoom'], ['rotate'], ['anchor'], ['rect', 'ellipse', 'star'], ['type']];
  const ICON = {
    select: '<path d="M6 3l12.5 9-5.4 1.1 3.3 6.3-2.4 1.2-3.3-6.4L6 18.5z" fill="currentColor"/>',
    hand: '<path d="M8.3 13V6.7a1.4 1.4 0 0 1 2.8 0V12m0-.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3m0-.4V6.4a1.4 1.4 0 0 1 2.8 0v7c0 4.1-2.4 7-6 7-2.4 0-3.9-1.2-5.4-3.4L4.4 13.7a1.3 1.3 0 0 1 2.1-1.5l1.8 2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    rotate: '<path d="M19 12.5a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M18.6 3.6v4.2h-4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    anchor: '<circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-dasharray="2 2" opacity=".6"/>',
    rect: '<rect x="4.5" y="6.5" width="15" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    star: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.1 6-.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    type: '<path d="M5 4.5h14v3.3h-1.4l-.6-1.6h-3.6v12l2 .8v1.5H8.6V19l2-.8v-12H7l-.6 1.6H5z" fill="currentColor"/>',
  };
  const svgIcon = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[k] || ''}</svg>`;
  const STOPWATCH = (on) => `<svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="9" r="5.5" fill="${on ? '#2d8ceb' : 'none'}" stroke="${on ? '#2d8ceb' : '#9a9a9a'}" stroke-width="1.3"/><path d="M8 9V6" stroke="${on ? '#fff' : '#9a9a9a'}" stroke-width="1.3"/><path d="M6.5 2h3" stroke="${on ? '#2d8ceb' : '#9a9a9a'}" stroke-width="1.3"/></svg>`;

  /* ---------------------------------------------------- interpolation */
  const lerp = (a, b, u) => (Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * u) : a + (b - a) * u);
  function ease(u, outEase, inEase) {
    if (outEase && inEase) return u * u * (3 - 2 * u);
    if (outEase) return u * u;            // leaves the first key slowly
    if (inEase) return 1 - (1 - u) * (1 - u); // arrives at the second key slowly
    return u;
  }
  function valueAt(p, t) {
    if (!p.k || !p.k.length) return p.v;
    const k = p.k;
    if (t <= k[0].t) return k[0].v;
    if (t >= k[k.length - 1].t) return k[k.length - 1].v;
    for (let i = 0; i < k.length - 1; i++) {
      const a = k[i], b = k[i + 1];
      if (t >= a.t && t <= b.t) {
        const u = (t - a.t) / (b.t - a.t || 1);
        return lerp(a.v, b.v, ease(u, a.e, b.e));
      }
    }
    return k[k.length - 1].v;
  }
  const fmt = (v, d = 1) => (Array.isArray(v) ? v.map((x) => (+x).toFixed(d).replace(/\.0$/, '')).join(', ') : (+v).toFixed(d).replace(/\.0$/, ''));

  /* ============================================================ editor */
  class AEEditor {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = opts;
      this.tool = 'select';
      this.groupShown = { rect: 'rect' };
      this.time = 0;
      this.playing = false;
      this.sel = new Set();
      this.selKeys = new Set(); // "layerId|propPath|index"
      this.view = { z: 1, x: 0, y: 0, fit: true };
      this.hist = []; this.fut = [];
      this.listeners = []; this.log = [];
      this.rightTab = 'effects';
      this.photos = {};
      this.build();
      this.bind();
      this.reset();
      requestAnimationFrame(() => { this.resize(); });
      if (document.fonts) { document.fonts.ready.then(() => this.renderAll()); document.fonts.addEventListener && document.fonts.addEventListener("loadingdone", () => this.renderAll()); }
    }

    /* ------------------------------------------------------------ events */
    on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((f) => f !== fn); }; }
    emit(type, data = {}) {
      const ev = { type, ...data, t: Date.now() };
      if (type === 'action') { this.log.push(ev); if (this.log.length > 400) this.log.shift(); }
      this.listeners.forEach((f) => { try { f(ev, this); } catch (e) { console.error(e); } });
    }
    act(name, data = {}) { this.emit('action', { name, ...data }); }
    did(name, test) { return this.log.some((e) => e.name === name && (!test || test(e))); }
    clearLog() { this.log = []; }
    isActive() { return this.root.offsetParent !== null; }

    /* ------------------------------------------------------------- build */
    build() {
      const root = document.createElement('div');
      root.className = 'ai ae';
      root.tabIndex = -1;
      root.innerHTML = `
        <div class="ai-menubar">
          <div class="ai-logo ae-logo" title="After Effects">Ae</div>
          <div class="ai-menus"></div>
          <div class="ai-menubar-right"><span class="ae-wsp">Default</span><span class="ae-wsp on">Animation</span><span class="ae-wsp">Effects</span></div>
        </div>
        <div class="ae-toolbar" data-hl="toolbar"></div>
        <div class="ae-main">
          <div class="ae-project" data-hl="project-panel">
            <div class="ai-dtabs"><button class="on">Project</button></div>
            <div class="ae-proj-body"></div>
          </div>
          <div class="ae-center">
            <div class="ai-tabs"><div class="ai-tab active"><span>Composition</span>&nbsp;<b class="ae-compname">Comp 1</b><span class="ai-tab-x">×</span></div></div>
            <div class="ae-viewer" data-hl="viewer"><canvas class="ae-cv"></canvas><div class="ai-textedit" contenteditable="true" spellcheck="false" hidden></div><div class="ai-toast" hidden></div></div>
            <div class="ae-vbar"></div>
          </div>
          <div class="ae-right" data-hl="right-panels">
            <div class="ai-dtabs"><button data-rtab="effects" data-hl="tab-effects">Effects &amp; Presets</button><button data-rtab="properties" data-hl="tab-properties">Properties</button></div>
            <div class="ae-right-body"></div>
            <div class="ae-preview" data-hl="preview-panel"><div class="ae-ptitle">Preview</div><div class="ae-pbtns"><button data-pv="start" title="First frame (Home)">⏮</button><button data-pv="prev" title="Previous frame (Page Up)">⏪</button><button data-pv="play" data-hl="play-btn" title="Play / Stop (Space)">▶</button><button data-pv="next" title="Next frame (Page Down)">⏩</button><button data-pv="end" title="Last frame (End)">⏭</button></div><label class="ps-check ae-loop"><input type="checkbox" checked data-loop> Loop</label></div>
          </div>
        </div>
        <div class="ae-timeline" data-hl="timeline">
          <div class="ae-tl-head"><div class="ai-dtabs"><button class="on">☰ <span class="ae-compname">Comp 1</span></button></div>
            <span class="ae-timecode" data-hl="timecode" title="Current time">0:00:00:00</span><span class="ae-fps"></span>
            <span class="ae-tl-hint">Shortcuts: <kbd>P</kbd> Position · <kbd>S</kbd> Scale · <kbd>R</kbd> Rotation · <kbd>T</kbd> Opacity · <kbd>U</kbd> keyframes · <kbd>Space</kbd> play · <kbd>F9</kbd> Easy Ease</span></div>
          <div class="ae-tl-body"></div>
        </div>
        <input type="file" accept="image/*" class="ps-file" hidden>
        <div class="ai-dropdown" hidden></div>
        <div class="ai-tooltip" hidden></div>
        <div class="ai-pop" hidden></div>
        <div class="ai-dialog-wrap" hidden></div>`;
      this.host.innerHTML = '';
      this.host.appendChild(root);
      const q = (s) => root.querySelector(s);
      this.root = root;
      this.$ = {
        menus: q('.ai-menus'), toolbar: q('.ae-toolbar'), proj: q('.ae-proj-body'), viewer: q('.ae-viewer'), cv: q('.ae-cv'), vbar: q('.ae-vbar'),
        right: q('.ae-right-body'), tl: q('.ae-tl-body'), timecode: q('.ae-timecode'), fps: q('.ae-fps'), dropdown: q('.ai-dropdown'), tooltip: q('.ai-tooltip'),
        pop: q('.ai-pop'), dialog: q('.ai-dialog-wrap'), textedit: q('.ai-textedit'), toast: q('.ai-toast'), file: q('.ps-file'), preview: q('.ae-preview'),
      };
      this.$.wrap = this.$.viewer; this.$.svg = this.$.cv; // coach compatibility
      this.$.menus.innerHTML = ['File', 'Edit', 'Composition', 'Layer', 'Effect', 'Animation', 'View', 'Window', 'Help'].map((n) => `<div class="ai-menu" data-m="${n}" data-hl="menu-${n.toLowerCase()}">${n}</div>`).join('');
      let tb = '';
      TOOL_GROUPS.forEach((g, gi) => {
        const shown = g.length > 1 ? this.groupShown[g[0]] : g[0];
        tb += `<button class="ai-tool${g.length > 1 ? ' has-fly' : ''}" data-tool="${shown}" data-group="${gi}" data-hl="tool-${shown}" aria-label="${TOOLS[shown].name}">${svgIcon(shown)}</button>`;
        if (gi === 2 || gi === 4) tb += '<span class="ae-tsep"></span>';
      });
      this.$.toolbar.innerHTML = `<div class="ae-tools">${tb}</div><span class="ae-tsep"></span><label class="ps-check"><input type="checkbox" checked data-snap> Snapping</label><span class="ae-tool-info"></span>`;
    }

    /* -------------------------------------------------------------- bind */
    bind() {
      const $ = this.$;
      $.toolbar.addEventListener('pointerdown', (e) => { const b = e.target.closest('.ai-tool'); if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { clearTimeout(this._flyT); this._flyT = setTimeout(() => this.openFlyout(b, +b.dataset.group), 380); } });
      ['pointerup', 'pointerleave'].forEach((n) => $.toolbar.addEventListener(n, () => clearTimeout(this._flyT)));
      $.toolbar.addEventListener('contextmenu', (e) => { const b = e.target.closest('.ai-tool'); if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { e.preventDefault(); this.openFlyout(b, +b.dataset.group); } });
      $.toolbar.addEventListener('click', (e) => { const b = e.target.closest('.ai-tool'); if (b && !this._flyOpen) this.setTool(b.dataset.tool); });
      $.toolbar.addEventListener('pointerover', (e) => {
        const b = e.target.closest('.ai-tool');
        if (!b) return this.hideTip();
        const t = TOOLS[b.dataset.tool];
        this.showTip(b, `<b>${t.name}</b> <kbd>${t.key}</kbd><div>${t.tip}</div>${TOOL_GROUPS[+b.dataset.group].length > 1 ? '<em>Hold the mouse down to see hidden tools</em>' : ''}`);
      });
      $.toolbar.addEventListener('pointerout', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ai-tool')) this.hideTip(); });
      $.menus.addEventListener('click', (e) => { const m = e.target.closest('.ai-menu'); if (!m) return; if (this._openMenu === m.dataset.m) this.closeMenu(); else this.openMenu(m); });
      $.menus.addEventListener('pointerover', (e) => { const m = e.target.closest('.ai-menu'); if (m && this._openMenu && this._openMenu !== m.dataset.m) this.openMenu(m); });
      $.dropdown.addEventListener('click', (e) => {
        const it = e.target.closest('.ai-mi');
        if (!it || it.classList.contains('disabled') || it.classList.contains('has-sub')) return;
        const fn = this._menuFns[it.dataset.i]; this.closeMenu();
        if (fn) { fn(); this.act('menu', { item: it.dataset.l }); }
      });
      this.root.querySelector('.ae-right').addEventListener('click', (e) => { const t = e.target.closest('[data-rtab]'); if (t) this.showTab(t.dataset.rtab); });
      $.preview.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pv]'); if (!b) return;
        const a = b.dataset.pv;
        if (a === 'play') this.togglePlay(); if (a === 'start') this.setTime(0, true); if (a === 'end') this.setTime(this.comp.dur, true);
        if (a === 'prev') this.stepFrame(-1); if (a === 'next') this.stepFrame(1);
      });
      $.preview.querySelector('[data-loop]').addEventListener('change', (e) => { this.loop = e.target.checked; });
      this.loop = true;

      const cv = $.cv;
      cv.addEventListener('pointerdown', (e) => this.onDown(e));
      cv.addEventListener('pointermove', (e) => this.onMove(e));
      cv.addEventListener('pointerup', (e) => this.onUp(e));
      cv.addEventListener('pointercancel', (e) => this.onUp(e));
      cv.addEventListener('wheel', (e) => { e.preventDefault(); if (e.ctrlKey || e.altKey || e.metaKey) this.zoomBy(Math.exp(-e.deltaY * 0.004), this.scrPt(e)); else { this.view.fit = false; this.view.x -= e.deltaX; this.view.y -= e.deltaY; this.renderViewer(); } }, { passive: false });
      cv.addEventListener('dblclick', (e) => { const p = this.toComp(e), l = this.hitLayer(p); if (l && l.kind === 'text') { this.setTool('type', true); this.startTextEdit(l); } });
      $.textedit.addEventListener('input', () => { const l = this.layer(this.editingText); if (l) { l.text = $.textedit.innerText.replace(/\n$/, '') || ' '; this.renderViewer(); } });
      $.textedit.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); this.endTextEdit(); } });
      $.file.addEventListener('change', () => {
        const f = $.file.files && $.file.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { const key = 'user-' + uid(); window.PS_PHOTOS = window.PS_PHOTOS || {}; const img = new Image(); img.onload = () => { window.PS_PHOTOS[key] = { src: rd.result, w: img.width, h: img.height, label: f.name, sample: false }; this.photos[key] = img; this.addImageLayer(key); }; img.src = rd.result; };
        rd.readAsDataURL(f); $.file.value = '';
      });
      this._onKey = (e) => this.onKey(e);
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('keyup', (e) => { if (e.key === ' ') this.spaceHand = false; this.altDown = e.altKey; this.updateCursor(); });
      document.addEventListener('pointerdown', (e) => {
        if (!this.root.contains(e.target)) { this.closeMenu(); this.closeFlyout(); this.closePop(); return; }
        if (!e.target.closest('.ai-menu') && !e.target.closest('.ai-dropdown')) this.closeMenu();
        if (!e.target.closest('.ai-flyout')) this.closeFlyout();
        if (!e.target.closest('.ai-pop') && !e.target.closest('[data-pop]')) this.closePop();
        if (this.editingText && !e.target.closest('.ai-textedit')) this.endTextEdit();
      }, true);
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe($.viewer);
      this._ro.observe($.tl);
    }

    /* -------------------------------------------------------------- model */
    layer(id) { return this.comp.layers.find((l) => l.id === id); }
    get layers() { return this.comp.layers; }
    get objs() { return this.comp.layers; }
    selLayers() { return this.comp.layers.filter((l) => this.sel.has(l.id)); }
    prop(l, path) {
      if (TRANSFORM.includes(path)) return l.props[path];
      if (path === 'reveal') return l.props.reveal;
      const [, fid, pn] = path.split(':');
      const f = (l.fx || []).find((x) => x.id === fid);
      return f && f.props[pn];
    }
    propMeta(path) {
      if (PROPS[path]) return PROPS[path];
      if (path === 'reveal') return { name: 'Reveal (Typewriter)', dim: 1, step: 0.5, unit: '%', min: 0, max: 100 };
      const [, fid, pn] = path.split(':');
      for (const l of this.comp.layers) { const f = (l.fx || []).find((x) => x.id === fid); if (f) return { ...FX[f.type].props[pn], dim: 1, unit: '' }; }
      return { name: path, dim: 1, step: 1, unit: '' };
    }
    animatedPaths(l) {
      const out = TRANSFORM.filter((k) => l.props[k].k);
      if (l.props.reveal && l.props.reveal.k) out.push('reveal');
      (l.fx || []).forEach((f) => Object.keys(f.props).forEach((pn) => { if (f.props[pn].k) out.push(`fx:${f.id}:${pn}`); }));
      return out;
    }
    contentSize(l) {
      if (l.kind === 'text') {
        const m = this._mctx || (this._mctx = mkCanvas(1, 1).getContext('2d'));
        m.font = `${l.fweight || 700} ${l.fsize}px ${fontStack(l.font)}`;
        const lines = String(l.text).split('\n');
        return [Math.max(10, ...lines.map((s) => m.measureText(s).width)), l.fsize * 1.2 * lines.length];
      }
      if (l.kind === 'image') { const p = (window.PS_PHOTOS || {})[l.photo]; return l.size || (p ? [p.w, p.h] : [200, 200]); }
      return l.size;
    }
    makeLayer(d) {
      const C = this.comp;
      const l = Object.assign({ id: uid(), name: 'Layer', kind: 'shape', label: LABELS[(C.layers.length * 3 + 7) % LABELS.length], in: 0, out: C.dur, parent: null, visible: true, locked: false, fx: [] }, d);
      if (l.kind === 'shape') Object.assign(l, { shape: l.shape || 'rect', size: l.size || [200, 200], fill: l.fill || '#FF7A59', stroke: l.stroke || 'none', sw: l.sw || 0, radius: l.radius || 0 });
      if (l.kind === 'text') Object.assign(l, { text: l.text || 'Text', font: l.font || 'Poppins', fsize: l.fsize || 80, fweight: l.fweight || 800, color: l.color || '#FFFFFF' });
      if (l.kind === 'solid') Object.assign(l, { size: l.size || [C.w, C.h], fill: l.fill || '#7C5CFF' });
      const sz = this.contentSize(l);
      const P = d.props || {};
      l.props = {
        anchor: { v: P.anchor || [sz[0] / 2, sz[1] / 2], k: null },
        position: { v: P.position || [C.w / 2, C.h / 2], k: null },
        scale: { v: P.scale || [100, 100], k: null },
        rotation: { v: P.rotation || 0, k: null },
        opacity: { v: P.opacity != null ? P.opacity : 100, k: null },
      };
      if (l.kind === 'text') l.props.reveal = { v: P.reveal != null ? P.reveal : 100, k: null };
      // keyframes given as { position: [[t, v, ease], ...] }
      Object.entries(d.keys || {}).forEach(([path, list]) => { const p = l.props[path]; if (p) p.k = list.map(([t, v, e]) => ({ t, v, e: !!e })); });
      (d.effects || []).forEach((t) => this.addFx(l, t, true));
      delete l.keys; delete l.effects;
      return l;
    }
    /** opts: {w,h,dur,bg,name,layers:[defs]} — layers given top-first */
    reset(opts = {}) {
      this.stop();
      this.endTextEdit(true);
      this.comp = { name: opts.name || 'Comp 1', w: opts.w || 960, h: opts.h || 540, dur: opts.dur || 5, fps: 30, bg: opts.bg || '#14142B', layers: [] };
      (opts.layers || []).slice().reverse().forEach((d) => { this.comp.layers.unshift(this.makeLayer(d)); });
      this.sel = new Set(opts.select != null && this.comp.layers[opts.select] ? [this.comp.layers[opts.select].id] : []);
      this.selKeys.clear();
      this.time = opts.time || 0;
      this.hist = []; this.fut = [];
      this.clearLog();
      this.view.fit = true;
      this.setTool(opts.tool || 'select', true);
      this.rightTab = 'effects';
      this.commit(true);
      this.renderAll();
    }

    /* ----------------------------------------------------------- history */
    snapshot() { return JSON.stringify(this.comp, (k, v) => (k[0] === '_' ? undefined : v)); }
    commit(silent) {
      const s = this.snapshot();
      if (this.hist[this.hist.length - 1] === s) return;
      this.hist.push(s); if (this.hist.length > 100) this.hist.shift();
      this.fut = [];
      if (!silent) this.emit('change');
    }
    restore(s) {
      const open = {}; this.comp.layers.forEach((l) => { open[l.id] = { o: l._open, only: l._only }; });
      this.comp = JSON.parse(s);
      this.comp.layers.forEach((l) => { if (open[l.id]) { l._open = open[l.id].o; l._only = open[l.id].only; } });
      this.sel = new Set([...this.sel].filter((id) => this.layer(id)));
      this.selKeys.clear();
      this.renderAll(); this.emit('change');
    }
    undo() { if (this.hist.length < 2) return this.toast('Nothing to undo'); this.fut.push(this.hist.pop()); this.restore(this.hist[this.hist.length - 1]); this.act('undo'); }
    redo() { if (!this.fut.length) return this.toast('Nothing to redo'); const s = this.fut.pop(); this.hist.push(s); this.restore(s); this.act('redo'); }

    /* -------------------------------------------------------------- time */
    fr() { return 1 / this.comp.fps; }
    snapT(t) { return clamp(Math.round(t * this.comp.fps) / this.comp.fps, 0, this.comp.dur); }
    timecode(t) {
      const f = Math.round(t * this.comp.fps), fps = this.comp.fps;
      const s = Math.floor(f / fps), ff = f % fps;
      return `0:00:${String(s).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
    }
    setTime(t, user) {
      this.time = this.snapT(t);
      this.renderViewer(); this.updateTimeUI();
      if (user) this.act('time', { t: this.time });
    }
    stepFrame(n) { this.stop(); this.setTime(this.time + n * this.fr(), true); }
    togglePlay() { if (this.playing) this.stop(true); else this.play(); }
    play() {
      if (this.playing) return;
      if (this.time >= this.comp.dur - this.fr()) this.time = 0;
      this.playing = true;
      this.$.preview.querySelector('[data-pv=play]').textContent = '⏸';
      let last = performance.now();
      const tick = (now) => {
        if (!this.playing) return;
        const dt = (now - last) / 1000; last = now;
        let t = this.time + dt;
        if (t >= this.comp.dur) { if (this.loop && !this._recording) t = t % this.comp.dur; else { t = this.comp.dur; this.time = t; this.renderViewer(); this.updateTimeUI(); this.stop(); return; } }
        this.time = t;
        this.renderViewer(); this.updateTimeUI();
        this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
      this.act('play');
    }
    stop(user) {
      if (!this.playing) return;
      this.playing = false;
      cancelAnimationFrame(this._raf);
      this.time = this.snapT(this.time);
      if (this.$.preview) this.$.preview.querySelector('[data-pv=play]').textContent = '▶';
      this.updateTimeUI();
      if (user) this.act('stop');
    }

    /* ----------------------------------------------------- props & keys */
    setValue(l, path, v, opts = {}) {
      const p = this.prop(l, path);
      if (!p) return;
      const meta = this.propMeta(path);
      if (meta.min != null) v = Array.isArray(v) ? v.map((x) => clamp(x, meta.min, meta.max)) : clamp(v, meta.min, meta.max);
      if (p.k) {
        const t = this.snapT(this.time);
        const i = p.k.findIndex((k) => Math.abs(k.t - t) < 1e-4);
        if (i >= 0) p.k[i].v = clone(v);
        else { p.k.push({ t, v: clone(v), e: false }); p.k.sort((a, b) => a.t - b.t); if (!opts.silent) this.act('keyAdd', { path, layer: l.name, count: p.k.length }); }
      } else p.v = clone(v);
      if (!opts.noRender) this.renderViewer();
      if (!opts.noCommit) { this.commit(); this.renderTimeline(); this.renderRight(); this.act('prop', { path, layer: l.name, animated: !!p.k }); }
    }
    toggleStopwatch(l, path) {
      const p = this.prop(l, path);
      if (!p) return;
      if (p.k) { p.v = valueAt(p, this.time); p.k = null; this.act('stopwatch', { path, on: false, layer: l.name }); }
      else { p.k = [{ t: this.snapT(this.time), v: clone(p.v), e: false }]; this.act('stopwatch', { path, on: true, layer: l.name }); this.act('keyAdd', { path, layer: l.name, count: 1 }); }
      this.commit(); this.renderAll();
    }
    toggleKeyHere(l, path) {
      const p = this.prop(l, path);
      const t = this.snapT(this.time);
      if (!p.k) return this.toggleStopwatch(l, path);
      const i = p.k.findIndex((k) => Math.abs(k.t - t) < 1e-4);
      if (i >= 0) { p.k.splice(i, 1); if (!p.k.length) { p.k = null; } this.act('keyRemove', { path }); }
      else { p.k.push({ t, v: clone(valueAt(p, t)), e: false }); p.k.sort((a, b) => a.t - b.t); this.act('keyAdd', { path, layer: l.name, count: p.k.length }); }
      this.commit(); this.renderAll();
    }
    jumpKey(l, path, dir) {
      const p = this.prop(l, path);
      const ts = l && p && p.k ? p.k.map((k) => k.t) : this.allKeyTimes();
      const t = dir > 0 ? ts.filter((x) => x > this.time + 1e-4).sort((a, b) => a - b)[0] : ts.filter((x) => x < this.time - 1e-4).sort((a, b) => b - a)[0];
      if (t != null) { this.stop(); this.setTime(t, true); this.act('keyJump'); }
    }
    allKeyTimes() {
      const ts = [];
      (this.sel.size ? this.selLayers() : this.comp.layers).forEach((l) => this.animatedPaths(l).forEach((path) => this.prop(l, path).k.forEach((k) => ts.push(k.t))));
      return ts;
    }
    keyObjs(keysSet = this.selKeys) {
      return [...keysSet].map((s) => { const [id, path, i] = s.split('|'); const l = this.layer(id); const p = l && this.prop(l, path); return p && p.k && p.k[+i] ? { l, path, p, k: p.k[+i] } : null; }).filter(Boolean);
    }
    easyEase() {
      const ks = this.keyObjs();
      if (!ks.length) return this.toast('Select some keyframes first (click the ◆ diamonds in the timeline)');
      ks.forEach((o) => { o.k.e = true; });
      this.commit(); this.renderAll();
      this.act('ease', { count: ks.length });
    }
    deleteKeys() {
      const ks = this.keyObjs();
      const byProp = new Map();
      ks.forEach((o) => { if (!byProp.has(o.p)) byProp.set(o.p, []); byProp.get(o.p).push(o.k); });
      byProp.forEach((list, p) => { p.k = p.k.filter((k) => !list.includes(k)); if (!p.k.length) { p.v = list[list.length - 1].v; p.k = null; } });
      this.selKeys.clear();
      this.commit(); this.renderAll(); this.act('keyDelete', { count: ks.length });
    }

    /* -------------------------------------------------------- layer ops */
    selectLayer(id, add, silent) {
      if (!add) this.sel.clear();
      if (id) { if (add && this.sel.has(id)) this.sel.delete(id); else this.sel.add(id); }
      this.renderAll();
      if (!silent) this.act('layerSelect', { lname: id && this.layer(id) ? this.layer(id).name : null });
    }
    addLayer(d, select = true) {
      const l = this.makeLayer(d);
      this.comp.layers.unshift(l);
      if (select) this.sel = new Set([l.id]);
      this.commit(); this.renderAll();
      this.act('layerNew', { kind: l.kind, shape: l.shape });
      return l;
    }
    addSolid() {
      const l = this.addLayer({ kind: 'solid', name: 'Solid ' + (this.comp.layers.filter((x) => x.kind === 'solid').length + 1), fill: '#7C5CFF' });
      this.comp.layers.splice(this.comp.layers.indexOf(l), 1); this.comp.layers.push(l); // solids go to the bottom (backgrounds)
      this.commit(); this.renderAll();
    }
    addImageLayer(key) {
      const p = (window.PS_PHOTOS || {})[key];
      if (!p) return;
      const sc = Math.min(1, (this.comp.w * 0.6) / p.w, (this.comp.h * 0.6) / p.h);
      this.addLayer({ kind: 'image', name: p.label || key, photo: key, props: { scale: [sc * 100, sc * 100] } });
      this.act('place', { photo: key });
    }
    deleteLayers() {
      if (!this.sel.size) return;
      this.comp.layers.forEach((l) => { if (this.sel.has(l.parent)) l.parent = null; });
      this.comp.layers = this.comp.layers.filter((l) => !this.sel.has(l.id));
      this.sel.clear(); this.commit(); this.renderAll(); this.act('layerDelete');
    }
    duplicate() {
      const list = this.selLayers();
      if (!list.length) return this.toast('Select a layer to duplicate');
      const news = list.map((l) => { const n = clone(l); n.id = uid(); n.name = l.name + ' 2'; (n.fx || []).forEach((f) => { f.id = uid(); }); return n; });
      news.forEach((n, i) => this.comp.layers.splice(this.comp.layers.indexOf(list[i]), 0, n));
      this.sel = new Set(news.map((n) => n.id));
      this.commit(); this.renderAll(); this.act('layerDup', { count: news.length });
    }
    setParent(l, pid) {
      if (pid === l.id) return;
      // keep the child where it is on screen
      const before = this.worldMatrix(l, this.time);
      l.parent = pid || null;
      const pm = l.parent ? this.worldMatrix(this.layer(l.parent), this.time) : new DOMMatrix();
      const local = pm.inverse().multiply(before);
      const a = l.props.anchor.v, pos = local.transformPoint(new DOMPoint(a[0], a[1]));
      const sx = Math.hypot(local.a, local.b), sy = Math.hypot(local.c, local.d), rot = (Math.atan2(local.b, local.a) * 180) / Math.PI;
      const conv = (p, v) => { if (!p.k) p.v = v; };
      conv(l.props.position, [pos.x, pos.y]); conv(l.props.scale, [sx * 100, sy * 100]); conv(l.props.rotation, rot);
      this.commit(); this.renderAll();
      this.act('parent', { child: l.name, parent: l.parent ? this.layer(l.parent).name : null });
    }
    moveLayerTime(l, dt) {
      l.in = clamp(l.in + dt, -this.comp.dur, this.comp.dur); l.out = l.out + dt;
      TRANSFORM.concat(['reveal']).forEach((k) => { const p = l.props[k]; if (p && p.k) p.k.forEach((kf) => { kf.t += dt; }); });
      (l.fx || []).forEach((f) => Object.values(f.props).forEach((p) => { if (p.k) p.k.forEach((kf) => { kf.t += dt; }); }));
    }
    centerAnchor(l) {
      const sz = this.contentSize(l), old = l.props.anchor.v, na = [sz[0] / 2, sz[1] / 2];
      const m = this.worldMatrix(l, this.time), p0 = m.transformPoint(new DOMPoint(old[0], old[1])), p1 = m.transformPoint(new DOMPoint(na[0], na[1]));
      l.props.anchor.v = na;
      if (!l.props.position.k) l.props.position.v = [l.props.position.v[0] + (p1.x - p0.x), l.props.position.v[1] + (p1.y - p0.y)];
      this.commit(); this.renderAll(); this.act('anchor', { center: true });
    }
    addFx(l, type, silent) {
      if (!FX[type]) return;
      const f = { id: uid(), type, props: {}, color: FX[type].color };
      Object.entries(FX[type].props).forEach(([k, d]) => { f.props[k] = { v: d.v, k: null }; });
      l.fx = l.fx || []; l.fx.push(f);
      if (!silent) { l._open = true; this.commit(); this.renderAll(); this.act('effect', { fx: type, layer: l.name }); }
      return f;
    }
    removeFx(l, fid) { l.fx = l.fx.filter((f) => f.id !== fid); this.commit(); this.renderAll(); this.act('effectRemove'); }
    applyEffect(type) {
      const ls = this.selLayers();
      if (!ls.length) return this.toast('Select a layer first (click it in the timeline or the viewer)');
      ls.forEach((l) => this.addFx(l, type, true));
      ls.forEach((l) => { l._open = true; });
      this.commit(); this.renderAll();
      this.act('effect', { fx: type, count: ls.length });
    }
    applyPreset(id) {
      const ls = this.selLayers();
      if (!ls.length) return this.toast('Select a layer first, then apply the preset');
      const t0 = this.snapT(this.time), C = this.comp;
      const T = (x) => clamp(Math.round((t0 + x) * C.fps) / C.fps, 0, C.dur);
      let ok = 0;
      ls.forEach((l) => {
        const P = l.props;
        const cur = (k) => clone(valueAt(P[k], this.time));
        if (id === 'fade-in') { P.opacity.k = [{ t: T(0), v: 0, e: false }, { t: T(0.6), v: cur('opacity') || 100, e: true }]; }
        if (id === 'fade-out') { const end = l.out; P.opacity.k = [{ t: clamp(end - 0.6, 0, C.dur), v: cur('opacity') || 100, e: true }, { t: clamp(end - this.fr(), 0, C.dur), v: 0, e: false }]; }
        if (id === 'pop-in') { const s = cur('scale'); P.scale.k = [{ t: T(0), v: [0, 0], e: false }, { t: T(0.35), v: s.map((x) => x * 1.15), e: true }, { t: T(0.55), v: s, e: true }]; }
        if (id === 'slide-in') { const p = cur('position'); const sz = this.contentSize(l); P.position.k = [{ t: T(0), v: [-sz[0], p[1]], e: false }, { t: T(0.8), v: p, e: true }]; }
        if (id === 'spin') { const r = cur('rotation'); P.rotation.k = [{ t: T(0), v: r, e: true }, { t: T(1.2), v: r + 360, e: true }]; }
        if (id === 'bounce') { const p = cur('position'); P.position.k = [{ t: T(0), v: [p[0], p[1] - 260], e: false }, { t: T(0.45), v: p, e: false }, { t: T(0.7), v: [p[0], p[1] - 90], e: true }, { t: T(0.95), v: p, e: false }, { t: T(1.1), v: [p[0], p[1] - 25], e: true }, { t: T(1.25), v: p, e: false }]; }
        if (id === 'typewriter') { if (l.kind !== 'text') return; P.reveal.k = [{ t: T(0), v: 0, e: false }, { t: T(Math.max(0.6, l.text.length * 0.07)), v: 100, e: false }]; }
        if (id === 'blur-in') { const f = this.addFx(l, 'blur', true); f.props.blur.k = [{ t: T(0), v: 40, e: false }, { t: T(0.8), v: 0, e: true }]; }
        l._open = true; ok++;
      });
      if (!ok) return this.toast('Typewriter works on text layers — make one with the Type tool');
      this.commit(); this.renderAll();
      this.act('preset', { id, count: ok });
    }

    /* -------------------------------------------------------- geometry */
    worldMatrix(l, t) {
      const P = l.props, a = valueAt(P.anchor, t), p = valueAt(P.position, t), s = valueAt(P.scale, t), r = valueAt(P.rotation, t);
      let m = new DOMMatrix().translate(p[0], p[1]).rotate(r).scale(s[0] / 100, s[1] / 100).translate(-a[0], -a[1]);
      const par = l.parent && this.layer(l.parent);
      if (par && !this._parentGuard) { this._parentGuard = true; try { m = this.worldMatrix(par, t).multiply(m); } finally { this._parentGuard = false; } }
      return m;
    }
    activeAt(l, t) { return t >= l.in - 1e-6 && t < l.out + 1e-6; }
    hitLayer(p) {
      for (const l of this.comp.layers) {
        if (!l.visible || l.locked || !this.activeAt(l, this.time)) continue;
        const m = this.worldMatrix(l, this.time).inverse(), q = m.transformPoint(new DOMPoint(p.x, p.y)), sz = this.contentSize(l);
        if (q.x >= -6 && q.y >= -6 && q.x <= sz[0] + 6 && q.y <= sz[1] + 6) return l;
      }
      return null;
    }

    /* -------------------------------------------------------- rendering */
    drawContent(g, l, t) {
      const sz = this.contentSize(l);
      const fillFx = (l.fx || []).find((f) => f.type === 'fill');
      const col = (c) => (fillFx ? fillFx.color : c);
      if (l.kind === 'shape') {
        g.beginPath();
        const [w, h] = sz;
        if (l.shape === 'ellipse') g.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        else if (l.shape === 'star') {
          const n = l.points || 5, inner = l.inner || 0.45;
          for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? inner : 1; const x = w / 2 + Math.cos(a) * (w / 2) * rr, y = h / 2 + Math.sin(a) * (h / 2) * rr * 1.05 + h * 0.03; i ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.closePath();
        } else if (g.roundRect && l.radius) g.roundRect(0, 0, w, h, Math.min(l.radius, w / 2, h / 2));
        else g.rect(0, 0, w, h);
        if (l.fill !== 'none') { g.fillStyle = col(l.fill); g.fill(); }
        if (l.stroke !== 'none' && l.sw > 0) { g.shadowColor = 'transparent'; g.lineWidth = l.sw; g.strokeStyle = l.stroke; g.stroke(); }
      } else if (l.kind === 'solid') {
        g.fillStyle = col(l.fill); g.fillRect(0, 0, sz[0], sz[1]);
      } else if (l.kind === 'text') {
        const rev = l.props.reveal ? valueAt(l.props.reveal, t) : 100;
        const full = String(l.text), n = Math.round((full.length * rev) / 100);
        if (n <= 0) return;
        g.font = `${l.fweight || 700} ${l.fsize}px ${fontStack(l.font)}`;
        g.fillStyle = col(l.color); g.textBaseline = 'top';
        full.slice(0, n).split('\n').forEach((line, i) => g.fillText(line, 0, i * l.fsize * 1.2 + l.fsize * 0.08));
        if (l._editing) g.globalAlpha = 0;
      } else if (l.kind === 'image') {
        const img = this.getPhoto(l.photo);
        if (img) g.drawImage(img, 0, 0, sz[0], sz[1]); else { g.fillStyle = '#555'; g.fillRect(0, 0, sz[0], sz[1]); }
      }
    }
    getPhoto(k) {
      if (this.photos[k]) return this.photos[k].complete ? this.photos[k] : null;
      const p = (window.PS_PHOTOS || {})[k];
      if (!p) return null;
      const img = new Image(); img.onload = () => this.renderViewer(); img.src = p.src;
      this.photos[k] = img;
      return null;
    }
    renderFrame(g, t, W, H) {
      const C = this.comp;
      g.save();
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      g.scale(W / C.w, H / C.h);
      for (let i = C.layers.length - 1; i >= 0; i--) {
        const l = C.layers[i];
        if (!l.visible || !this.activeAt(l, t) || l._editing) continue;
        const op = valueAt(l.props.opacity, t) / 100;
        if (op <= 0) continue;
        const m = this.worldMatrix(l, t);
        const fx = (n) => (l.fx || []).find((f) => f.type === n);
        const blur = fx('blur') ? valueAt(fx('blur').props.blur, t) : 0;
        const draw = (ctx) => {
          ctx.save();
          ctx.setTransform(ctx.getTransform().multiply(m));
          const sh = fx('shadow'), gl = fx('glow');
          if (gl) { const r = valueAt(gl.props.radius, t); ctx.shadowColor = gl.color; ctx.shadowBlur = r; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; this.drawContent(ctx, l, t); ctx.shadowBlur = r / 2; }
          if (sh) { const d = valueAt(sh.props.dist, t), s = valueAt(sh.props.soft, t); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = s; ctx.shadowOffsetX = d * 0.7; ctx.shadowOffsetY = d * 0.7; }
          this.drawContent(ctx, l, t);
          ctx.restore();
        };
        g.save();
        g.globalAlpha = op;
        if (blur > 0.3) {
          if (CAN_FILTER) { g.filter = `blur(${blur}px)`; draw(g); g.filter = 'none'; }
          else {
            const k = 1 / (1 + blur / 4), off = mkCanvas(C.w * k, C.h * k), og = off.getContext('2d');
            og.scale(k, k); draw(og);
            g.setTransform(g.getTransform()); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, C.w, C.h);
          }
        } else draw(g);
        g.restore();
      }
      g.restore();
    }
    resize() {
      const r = this.$.viewer.getBoundingClientRect();
      if (r.width) {
        this.W = r.width; this.H = r.height;
        const c = this.$.cv; c.width = r.width * DPR(); c.height = r.height * DPR(); c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
        if (this.view.fit) this.fitView();
        this.renderViewer();
      }
      this.renderTimeline();
    }
    fitView() {
      const C = this.comp, z = Math.min((this.W - 30) / C.w, (this.H - 30) / C.h);
      this.view.z = clamp(z, 0.05, 8); this.view.x = (this.W - C.w * this.view.z) / 2; this.view.y = (this.H - C.h * this.view.z) / 2;
    }
    fit(user) { this.view.fit = true; this.fitView(); this.renderViewer(); if (user) this.act('zoom', { fit: true }); }
    zoomBy(f, at) {
      at = at || { x: this.W / 2, y: this.H / 2 };
      const old = this.view.z, z = clamp(old * f, 0.05, 8);
      this.view.fit = false;
      this.view.x = at.x - ((at.x - this.view.x) / old) * z; this.view.y = at.y - ((at.y - this.view.y) / old) * z; this.view.z = z;
      this.renderViewer(); this.act('zoom', { z, dir: z > old ? 'in' : 'out' });
    }
    toScr(p) { return { x: p.x * this.view.z + this.view.x, y: p.y * this.view.z + this.view.y }; }
    toComp(e) { const r = this.$.cv.getBoundingClientRect(); return { x: (e.clientX - r.left - this.view.x) / this.view.z, y: (e.clientY - r.top - this.view.y) / this.view.z }; }
    scrPt(e) { const r = this.$.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    docToClient(p) { const r = this.$.cv.getBoundingClientRect(), s = this.toScr(p); return { x: r.left + s.x, y: r.top + s.y }; }
    renderViewer() {
      if (!this.W) return;
      const g = this.$.cv.getContext('2d'), d = DPR(), { z, x, y } = this.view, C = this.comp;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.fillStyle = '#1b1b1b'; g.fillRect(0, 0, this.W, this.H);
      g.save(); g.translate(x, y);
      g.beginPath(); g.rect(0, 0, C.w * z, C.h * z); g.clip();
      this.renderFrame(g, this.time, C.w * z, C.h * z);
      g.restore();
      g.strokeStyle = '#000'; g.strokeRect(x - 0.5, y - 0.5, C.w * z + 1, C.h * z + 1);
      // overlays: motion path, selection box, anchor
      this.selLayers().forEach((l) => {
        if (!l.visible || !this.activeAt(l, this.time)) return;
        const pk = l.props.position.k;
        const parentM = l.parent ? this.worldMatrix(this.layer(l.parent), this.time) : new DOMMatrix();
        const S = (pt) => { const q = parentM.transformPoint(new DOMPoint(pt[0], pt[1])); return this.toScr({ x: q.x, y: q.y }); };
        if (pk && pk.length > 1) {
          g.save(); g.strokeStyle = '#d4d4d4'; g.setLineDash([2, 3]); g.beginPath();
          const t0 = pk[0].t, t1 = pk[pk.length - 1].t;
          for (let i = 0; i <= 60; i++) { const tt = t0 + ((t1 - t0) * i) / 60, q = S(valueAt(l.props.position, tt)); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); }
          g.stroke(); g.setLineDash([]);
          pk.forEach((k) => { const q = S(k.v); g.fillStyle = '#fff'; g.strokeStyle = '#2d8ceb'; g.beginPath(); g.rect(q.x - 3.5, q.y - 3.5, 7, 7); g.fill(); g.stroke(); });
          for (let i = 0; i <= 12; i++) { const tt = t0 + ((t1 - t0) * i) / 12, q = S(valueAt(l.props.position, tt)); g.fillStyle = '#d4d4d4'; g.fillRect(q.x - 1, q.y - 1, 2, 2); }
          g.restore();
        }
        const m = this.worldMatrix(l, this.time), sz = this.contentSize(l);
        const cs = [[0, 0], [sz[0], 0], [sz[0], sz[1]], [0, sz[1]]].map(([a, b]) => { const q = m.transformPoint(new DOMPoint(a, b)); return this.toScr({ x: q.x, y: q.y }); });
        g.save(); g.strokeStyle = l.label; g.lineWidth = 1.2; g.beginPath(); cs.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.stroke();
        if (this.tool === 'select') cs.forEach((q) => { g.fillStyle = l.label; g.fillRect(q.x - 4, q.y - 4, 8, 8); });
        const a = l.props.anchor.v ? valueAt(l.props.anchor, this.time) : [0, 0], aq = m.transformPoint(new DOMPoint(a[0], a[1])), A = this.toScr({ x: aq.x, y: aq.y });
        g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.beginPath(); g.arc(A.x, A.y, 5, 0, 7); g.moveTo(A.x - 9, A.y); g.lineTo(A.x + 9, A.y); g.moveTo(A.x, A.y - 9); g.lineTo(A.x, A.y + 9); g.stroke();
        g.restore();
      });
      if (this.drag && this.drag.mode === 'draw' && this.drag.cur) {
        const a = this.toScr(this.drag.s), b = this.toScr(this.drag.cur);
        g.strokeStyle = '#2d8ceb'; g.setLineDash([4, 3]); g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); g.setLineDash([]);
      }
      if (this._hint) { const h = this._hint; g.font = '11px "Source Sans 3",sans-serif'; const w = g.measureText(h.text).width + 14; g.fillStyle = 'rgba(70,70,70,.92)'; g.fillRect(h.x, h.y, w, 20); g.fillStyle = '#fff'; g.fillText(h.text, h.x + 7, h.y + 14); this._hint = null; }
      this.renderVbar();
    }
    renderVbar() {
      this.$.vbar.innerHTML = `<span class="ae-vz" data-hl="viewer-zoom">${Math.round(this.view.z * 100)}%</span><button data-vb="fit" title="Fit (Shift+/)">Fit</button><span class="ae-vtc">${this.timecode(this.time)}</span><span>Full</span><span class="ae-vres">${this.comp.w} × ${this.comp.h} · ${this.comp.fps} fps · ${this.comp.dur}s</span>`;
      this.$.vbar.querySelector('[data-vb=fit]').onclick = () => this.fit(true);
    }

    /* ------------------------------------------------------ pointer */
    onDown(e) {
      if (e.button === 1 || (e.button === 0 && (this.spaceHand || this.tool === 'hand'))) { this.drag = { mode: 'pan', s: this.scrPt(e), v: { ...this.view } }; this.$.cv.setPointerCapture(e.pointerId); return; }
      if (e.button !== 0) return;
      this.closeMenu();
      this.root.focus({ preventScroll: true });
      this.$.cv.setPointerCapture(e.pointerId);
      const p = this.toComp(e);
      if (this.playing) this.stop();
      if (this.tool === 'zoom') return this.zoomBy(e.altKey ? 0.5 : 2, this.scrPt(e));
      if (['rect', 'ellipse', 'star'].includes(this.tool)) { this.drag = { mode: 'draw', s: p, shape: this.tool }; return; }
      if (this.tool === 'type') {
        e.preventDefault();
        const hit = this.hitLayer(p);
        if (hit && hit.kind === 'text') return this.startTextEdit(hit);
        const l = this.makeLayer({ kind: 'text', name: 'Text', text: ' ', fsize: 80 });
        const sz = this.contentSize(l);
        l.props.anchor.v = [0, 0]; l.props.position.v = [p.x, p.y - 80 * 0.7];
        void sz;
        this.comp.layers.unshift(l); this.sel = new Set([l.id]);
        this.renderAll();
        return this.startTextEdit(l, true);
      }
      // selection / rotation / anchor tools
      const sl = this.selLayers()[0];
      if (sl && this.tool === 'select') {
        const m = this.worldMatrix(sl, this.time), sz = this.contentSize(sl), sp = this.scrPt(e);
        const hi = [[0, 0], [sz[0], 0], [sz[0], sz[1]], [0, sz[1]]].findIndex(([a, b]) => { const q = m.transformPoint(new DOMPoint(a, b)), s = this.toScr({ x: q.x, y: q.y }); return Math.hypot(s.x - sp.x, s.y - sp.y) < 8; });
        if (hi >= 0) {
          const a = valueAt(sl.props.anchor, this.time), aq = m.transformPoint(new DOMPoint(a[0], a[1]));
          this.drag = { mode: 'scale', id: sl.id, c: { x: aq.x, y: aq.y }, d0: Math.hypot(p.x - aq.x, p.y - aq.y), s0: clone(valueAt(sl.props.scale, this.time)) };
          return;
        }
      }
      const hit = this.hitLayer(p);
      if (!hit) { this.selectLayer(null, false, !this.sel.size); this.drag = null; return; }
      if (!this.sel.has(hit.id)) this.selectLayer(hit.id, e.shiftKey);
      const l = hit;
      if (this.tool === 'rotate') {
        const m = this.worldMatrix(l, this.time), a = valueAt(l.props.anchor, this.time), aq = m.transformPoint(new DOMPoint(a[0], a[1]));
        this.drag = { mode: 'rotate', id: l.id, c: { x: aq.x, y: aq.y }, a0: Math.atan2(p.y - aq.y, p.x - aq.x), r0: valueAt(l.props.rotation, this.time) };
        return;
      }
      if (this.tool === 'anchor') { this.drag = { mode: 'anchor', id: l.id, s: p, a0: clone(valueAt(l.props.anchor, this.time)), p0: clone(valueAt(l.props.position, this.time)), inv: this.worldMatrix(l, this.time).inverse() }; return; }
      this.drag = { mode: 'move', s: p, items: this.selLayers().filter((x) => !x.locked).map((x) => ({ id: x.id, p0: clone(valueAt(x.props.position, this.time)), pinv: x.parent ? this.worldMatrix(this.layer(x.parent), this.time).inverse() : null })) };
    }
    onMove(e) {
      const d = this.drag;
      if (!d) return;
      const p = this.toComp(e);
      if (d.mode === 'pan') { const s = this.scrPt(e); this.view.fit = false; this.view.x = d.v.x + s.x - d.s.x; this.view.y = d.v.y + s.y - d.s.y; this.renderViewer(); return; }
      if (d.mode === 'draw') {
        let q = p;
        if (e.shiftKey) { const m = Math.max(Math.abs(p.x - d.s.x), Math.abs(p.y - d.s.y)); q = { x: d.s.x + Math.sign(p.x - d.s.x || 1) * m, y: d.s.y + Math.sign(p.y - d.s.y || 1) * m }; }
        d.cur = q; this.renderViewer(); return;
      }
      if (d.mode === 'move') {
        let dx = p.x - d.s.x, dy = p.y - d.s.y;
        if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        d.moved = Math.hypot(dx, dy) > 1;
        d.items.forEach((it) => {
          const l = this.layer(it.id);
          let ddx = dx, ddy = dy;
          if (it.pinv) { const o = it.pinv.transformPoint(new DOMPoint(0, 0)), v = it.pinv.transformPoint(new DOMPoint(dx, dy)); ddx = v.x - o.x; ddy = v.y - o.y; }
          this.setValue(l, 'position', [Math.round(it.p0[0] + ddx), Math.round(it.p0[1] + ddy)], { noCommit: true, noRender: true, silent: true });
        });
        this._hint = { text: `Position: ${fmt(valueAt(this.layer(d.items[0].id).props.position, this.time), 0)}`, x: this.scrPt(e).x + 14, y: this.scrPt(e).y + 14 };
        this.renderViewer(); this.updateValuesUI();
        return;
      }
      if (d.mode === 'scale') {
        const l = this.layer(d.id), k = Math.hypot(p.x - d.c.x, p.y - d.c.y) / (d.d0 || 1);
        this.setValue(l, 'scale', d.s0.map((x) => Math.round(x * k * 10) / 10), { noCommit: true, noRender: true, silent: true });
        d.moved = true; this._hint = { text: `Scale: ${fmt(valueAt(l.props.scale, this.time), 1)}%`, x: this.scrPt(e).x + 14, y: this.scrPt(e).y + 14 };
        this.renderViewer(); this.updateValuesUI(); return;
      }
      if (d.mode === 'rotate') {
        const l = this.layer(d.id);
        let a = d.r0 + ((Math.atan2(p.y - d.c.y, p.x - d.c.x) - d.a0) * 180) / Math.PI;
        if (e.shiftKey) a = Math.round(a / 45) * 45;
        this.setValue(l, 'rotation', Math.round(a * 10) / 10, { noCommit: true, noRender: true, silent: true });
        d.moved = true; this._hint = { text: `Rotation: ${fmt(a, 1)}°`, x: this.scrPt(e).x + 14, y: this.scrPt(e).y + 14 };
        this.renderViewer(); this.updateValuesUI(); return;
      }
      if (d.mode === 'anchor') {
        const l = this.layer(d.id), q0 = d.inv.transformPoint(new DOMPoint(d.s.x, d.s.y)), q1 = d.inv.transformPoint(new DOMPoint(p.x, p.y));
        const na = [d.a0[0] + (q1.x - q0.x), d.a0[1] + (q1.y - q0.y)];
        l.props.anchor.k ? this.setValue(l, 'anchor', na, { noCommit: true, noRender: true, silent: true }) : (l.props.anchor.v = na);
        if (!l.props.position.k) { const pinv = l.parent ? this.worldMatrix(this.layer(l.parent), this.time).inverse() : null; let dx = p.x - d.s.x, dy = p.y - d.s.y; if (pinv) { const o = pinv.transformPoint(new DOMPoint(0, 0)), v = pinv.transformPoint(new DOMPoint(dx, dy)); dx = v.x - o.x; dy = v.y - o.y; } l.props.position.v = [d.p0[0] + dx, d.p0[1] + dy]; }
        d.moved = true; this.renderViewer(); this.updateValuesUI(); return;
      }
    }
    onUp(e) {
      const d = this.drag;
      this.drag = null;
      try { this.$.cv.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!d) return;
      if (d.mode === 'draw') {
        const q = d.cur || d.s, x = Math.min(d.s.x, q.x), y = Math.min(d.s.y, q.y);
        let w = Math.abs(q.x - d.s.x), h = Math.abs(q.y - d.s.y);
        if (w < 4 || h < 4) { w = h = 160; }
        const names = { rect: 'Rectangle', ellipse: 'Ellipse', star: 'Star' };
        const n = this.comp.layers.filter((l) => l.shape === d.shape).length + 1;
        this.addLayer({ kind: 'shape', shape: d.shape, name: `${names[d.shape]} ${n}`, size: [Math.round(w), Math.round(h)], fill: SWATCHES[(n + 1) % 8 + 2], props: { position: [x + w / 2, y + h / 2] } });
        this.act('create', { shape: d.shape });
        return;
      }
      if (['move', 'scale', 'rotate', 'anchor'].includes(d.mode) && d.moved) {
        const l = this.layer(d.id || (d.items && d.items[0].id));
        const path = { move: 'position', scale: 'scale', rotate: 'rotation', anchor: 'anchor' }[d.mode];
        const p = l && this.prop(l, path);
        if (p && p.k) this.act('keyAdd', { path, layer: l.name, count: p.k.length });
        this.commit(); this.renderAll();
        this.act(d.mode === 'move' ? 'move' : d.mode, { layer: l && l.name, path, animated: !!(p && p.k) });
        this.act('prop', { path, layer: l && l.name, animated: !!(p && p.k) });
      }
      if (d.mode === 'pan') this.act('pan');
    }

    /* ------------------------------------------------------- text edit */
    startTextEdit(l, isNew) {
      this.editingText = l.id; this.editingNew = !!isNew; l._editing = true;
      const te = this.$.textedit, m = this.worldMatrix(l, this.time), q = m.transformPoint(new DOMPoint(0, 0)), s = this.toScr({ x: q.x, y: q.y }), sc = valueAt(l.props.scale, this.time)[1] / 100;
      te.hidden = false; te.innerText = l.text.trim() ? l.text : '';
      Object.assign(te.style, { left: s.x + 'px', top: s.y + 'px', fontSize: l.fsize * this.view.z * sc + 'px', fontFamily: fontStack(l.font), fontWeight: l.fweight, color: l.color, lineHeight: 1.2, caretColor: l.color });
      this.renderViewer();
      te.focus();
      setTimeout(() => { te.focus(); if (!isNew) { const r = document.createRange(); r.selectNodeContents(te); const sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r); } }, 0);
      this.act('textEditStart');
    }
    endTextEdit(silent) {
      if (!this.editingText) return;
      const l = this.layer(this.editingText);
      this.editingText = null;
      this.$.textedit.hidden = true;
      if (l) {
        l._editing = false;
        l.text = this.$.textedit.innerText.replace(/\n$/, '');
        if (!l.text.trim()) { this.comp.layers = this.comp.layers.filter((x) => x !== l); this.sel.delete(l.id); }
        else {
          l.name = l.text.split('\n')[0].slice(0, 22);
          if (this.editingNew) { const sz = this.contentSize(l), m0 = this.worldMatrix(l, this.time), p0 = m0.transformPoint(new DOMPoint(0, 0)); l.props.anchor.v = [sz[0] / 2, sz[1] / 2]; const m1 = this.worldMatrix(l, this.time), p1 = m1.transformPoint(new DOMPoint(0, 0)); l.props.position.v = [l.props.position.v[0] + (p0.x - p1.x), l.props.position.v[1] + (p0.y - p1.y)]; }
        }
      }
      this.renderAll();
      if (!silent && l && l.text.trim()) { this.commit(); this.act('type', { text: l.text, isNew: this.editingNew }); }
      if (!silent && this.tool === 'type') this.setTool('select', true); // friendlier for beginners
    }

    /* ------------------------------------------------------ keyboard */
    onKey(e) {
      if (!this.isActive()) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (!this.$.dialog.hidden) return;
      this.altDown = e.altKey;
      const mod = e.metaKey || e.ctrlKey, k = e.key, kk = k.toLowerCase();
      if (k === ' ' && !e.repeat) { e.preventDefault(); this.togglePlay(); return; }
      if (mod) {
        const map = {
          z: () => (e.shiftKey ? this.redo() : this.undo()), y: () => (e.shiftKey ? this.redo() : this.addSolid()), d: () => this.duplicate(),
          k: () => this.compDialog(), t: () => this.setTool('type'), a: () => { this.sel = new Set(this.comp.layers.map((l) => l.id)); this.renderAll(); this.act('selectAll'); },
          arrowleft: () => this.stepFrame(-1), arrowright: () => this.stepFrame(1), home: () => this.selLayers().forEach((l) => this.centerAnchor(l)),
          '=': () => this.zoomBy(1.25), '-': () => this.zoomBy(0.8), m: () => this.exportVideo(),
        };
        if (map[kk]) { e.preventDefault(); map[kk](); }
        return;
      }
      if (k === 'F9') { e.preventDefault(); return this.easyEase(); }
      if (k === 'Home') { e.preventDefault(); return this.setTime(0, true); }
      if (k === 'End') { e.preventDefault(); return this.setTime(this.comp.dur, true); }
      if (k === 'PageUp') { e.preventDefault(); return this.stepFrame(-1); }
      if (k === 'PageDown') { e.preventDefault(); return this.stepFrame(1); }
      if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); if (this.selKeys.size) return this.deleteKeys(); return this.deleteLayers(); }
      if (k === 'Escape') { this.selKeys.clear(); this.renderTimeline(); return; }
      if (kk === 'j') return this.jumpKey(null, null, -1);
      if (kk === 'k') return this.jumpKey(null, null, 1);
      if (k === '[' ) { this.selLayers().forEach((l) => this.moveLayerTime(l, this.time - l.in)); this.commit(); this.renderAll(); this.act('layerTime', { how: 'bracket' }); return; }
      if (k === '?' || (e.shiftKey && k === '/')) return this.fit(true);
      const reveal = { p: 'position', s: 'scale', r: 'rotation', t: 'opacity', a: 'anchor', u: 'U' };
      if (reveal[kk] && !e.shiftKey && !e.altKey) { return this.reveal(reveal[kk]); }
      const toolKeys = { v: 'select', h: 'hand', z: 'zoom', w: 'rotate', y: 'anchor', q: null };
      if (kk in toolKeys) {
        if (kk === 'q') { const g = TOOL_GROUPS[5]; const cur = this.groupShown.rect; this.setTool(this.tool === cur ? g[(g.indexOf(cur) + 1) % g.length] : cur); }
        else this.setTool(toolKeys[kk]);
      }
    }
    reveal(what) {
      const ls = this.sel.size ? this.selLayers() : this.comp.layers;
      ls.forEach((l) => {
        if (what === 'U') l._only = this.animatedPaths(l);
        else l._only = [what];
        l._open = true;
      });
      this.renderTimeline();
      this.act('reveal', { what });
    }

    /* ------------------------------------------------------- tools */
    setTool(t, silent) {
      if (!TOOLS[t]) return;
      if (this.editingText) this.endTextEdit();
      this.tool = t;
      TOOL_GROUPS.forEach((g) => { if (g.length > 1 && g.includes(t)) this.groupShown[g[0]] = t; });
      this.closeFlyout();
      this.$.toolbar.querySelectorAll('.ai-tool').forEach((b) => {
        const g = TOOL_GROUPS[+b.dataset.group];
        if (g.length > 1) { const shown = this.groupShown[g[0]]; if (b.dataset.tool !== shown) { b.dataset.tool = shown; b.dataset.hl = 'tool-' + shown; b.innerHTML = svgIcon(shown); } }
        b.classList.toggle('on', b.dataset.tool === t);
      });
      this.$.toolbar.querySelector('.ae-tool-info').textContent = TOOLS[t].tip;
      this.updateCursor(); this.renderViewer();
      if (!silent) this.act('tool', { tool: t });
    }
    updateCursor() {
      const t = this.spaceHand ? 'hand' : this.tool;
      this.$.cv.style.cursor = { select: 'default', hand: 'grab', zoom: this.altDown ? 'zoom-out' : 'zoom-in', rotate: 'alias', anchor: 'move', rect: 'crosshair', ellipse: 'crosshair', star: 'crosshair', type: 'text' }[t] || 'default';
    }
    openFlyout(btn, gi) {
      this.closeFlyout();
      const r = btn.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'ai-flyout'; f.dataset.hl = 'flyout';
      f.innerHTML = TOOL_GROUPS[gi].map((t) => `<button data-ft="${t}" data-hl="fly-${t}" class="${t === this.tool ? 'on' : ''}">${svgIcon(t, 18)}<span>${TOOLS[t].name}</span><kbd>${TOOLS[t].key}</kbd></button>`).join('');
      f.style.left = (r.left - rr.left) + 'px'; f.style.top = (r.bottom - rr.top + 2) + 'px';
      f.addEventListener('click', (e) => { const b = e.target.closest('[data-ft]'); if (b) { this.setTool(b.dataset.ft); this.act('flyout', { tool: b.dataset.ft }); } });
      this.root.appendChild(f); this._flyOpen = f; this.hideTip();
      this.act('flyoutOpen', { group: gi });
    }
    closeFlyout() { if (this._flyOpen) { this._flyOpen.remove(); setTimeout(() => { this._flyOpen = null; }, 0); } }
    closePop() { if (this.$.pop) this.$.pop.hidden = true; }
    showTab(t) { this.rightTab = t; this.renderRight(); this.act('panel', { tab: t }); }

    /* --------------------------------------------------- panels */
    renderAll() { this.renderViewer(); this.renderTimeline(); this.renderRight(); this.renderProject(); this.emit('select'); }
    renderProject() {
      const P = window.PS_PHOTOS || {};
      const items = Object.entries(P).filter(([, v]) => v.sample || String(v.label || '').length);
      this.$.proj.innerHTML = `<div class="ae-pitem comp"><span class="ae-picon">🎞</span><div><b class="ae-compname">${esc(this.comp.name)}</b><small>${this.comp.w}×${this.comp.h} · ${this.comp.dur}s</small></div></div>
        <div class="ae-psec">Footage <small>(click to add)</small></div>
        ${items.filter(([k]) => k !== 'landscapeDull' && k !== 'apple').map(([k, v]) => `<button class="ae-pitem" data-photo="${k}" data-hl="footage-${k}" title="Add to composition"><img src="${v.src}" alt=""><div><b>${esc(v.label || k)}</b><small>${v.w}×${v.h}</small></div></button>`).join('')}
        <div class="ae-psec">New</div>
        <div class="ae-pnew"><button data-pn="solid" title="${CMD}Y">▬ Solid</button><button data-pn="text">T Text</button><button data-pn="photo">📁 Your image</button></div>`;
      this.$.proj.querySelectorAll('[data-photo]').forEach((b) => b.addEventListener('click', () => this.addImageLayer(b.dataset.photo)));
      this.$.proj.querySelectorAll('[data-pn]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.pn;
        if (a === 'solid') this.addSolid();
        if (a === 'text') { const l = this.addLayer({ kind: 'text', name: 'Hello', text: 'Hello' }); void l; }
        if (a === 'photo') this.$.file.click();
      }));
    }
    renderRight() {
      this.root.querySelectorAll('[data-rtab]').forEach((b) => b.classList.toggle('on', b.dataset.rtab === this.rightTab));
      const b = this.$.right;
      if (this.rightTab === 'effects') {
        const cats = {};
        Object.entries(FX).forEach(([k, f]) => { (cats[f.cat] = cats[f.cat] || []).push([k, f]); });
        b.innerHTML = `<div class="ae-fxsearch">🔍 <span>Effects &amp; Presets</span></div>
          <div class="ae-fxcat" data-hl="presets-list"><div class="ae-fxh">▾ * Animation Presets</div>${Object.entries(PRESETS).map(([k, p]) => `<button class="ae-fxi" data-preset="${k}" data-hl="preset-${k}" title="${esc(p.tip)}"><span>${p.icon}</span>${p.name}</button>`).join('')}</div>
          ${Object.entries(cats).map(([c, list]) => `<div class="ae-fxcat"><div class="ae-fxh">▾ ${c}</div>${list.map(([k, f]) => `<button class="ae-fxi" data-fx="${k}" data-hl="fx-${k}"><span class="ae-fxic">fx</span>${f.name}</button>`).join('')}</div>`).join('')}
          <p class="ps-note" style="padding:6px 10px">Select a layer, then click a preset or effect to apply it at the current time.</p>`;
        b.querySelectorAll('[data-preset]').forEach((x) => x.addEventListener('click', () => this.applyPreset(x.dataset.preset)));
        b.querySelectorAll('[data-fx]').forEach((x) => x.addEventListener('click', () => this.applyEffect(x.dataset.fx)));
        return;
      }
      const l = this.selLayers()[0];
      if (!l) { b.innerHTML = '<div class="ai-pkind">Composition</div><div class="ai-psec"><p class="ps-note">Select a layer to see its properties.</p><div class="ai-btnrow"><button data-c="settings">⚙ Composition Settings</button></div></div>'; b.querySelector('[data-c]').onclick = () => this.compDialog(); return; }
      const sec = (t, inner, hl) => `<div class="ai-psec"${hl ? ` data-hl="${hl}"` : ''}><div class="ai-psec-t">${t}</div>${inner}</div>`;
      let html = `<div class="ai-pkind"><span class="ae-lab" style="background:${l.label}"></span>${esc(l.name)} <small>${l.kind === 'shape' ? 'Shape Layer' : l.kind === 'text' ? 'Text Layer' : l.kind === 'solid' ? 'Solid' : 'Footage'}</small></div>`;
      html += sec('Transform', TRANSFORM.map((k) => `<div class="ai-row ae-prow"><button class="ae-sw" data-sw="${k}" title="Stopwatch">${STOPWATCH(!!l.props[k].k)}</button><label>${PROPS[k].name}</label>${this.scrubHTML(l, k)}</div>`).join(''), 'prop-transform');
      if (l.kind === 'shape' || l.kind === 'solid') html += sec(l.kind === 'shape' ? 'Shape' : 'Solid', `<div class="ai-row"><label>Fill</label><input type="color" data-lp="fill" value="${l.fill === 'none' ? '#ffffff' : l.fill.toLowerCase()}" data-hl="prop-fill"><div class="ae-swatches">${SWATCHES.slice(0, 10).map((c) => `<button data-fillsw="${c}" style="background:${c}"></button>`).join('')}</div></div>
        ${l.kind === 'shape' ? `<div class="ai-row"><label>Size</label><input class="ai-in" type="number" data-lp="w" value="${Math.round(l.size[0])}"><input class="ai-in" type="number" data-lp="h" value="${Math.round(l.size[1])}"></div>
        <div class="ai-row"><label>Stroke</label><input type="color" data-lp="stroke" value="${l.stroke === 'none' ? '#000000' : l.stroke.toLowerCase()}"><input class="ai-in" type="number" min="0" data-lp="sw" value="${l.sw}"><span class="ai-unit">px</span></div>
        ${l.shape === 'rect' ? `<div class="ai-row"><label>Roundness</label><input class="ai-in" type="number" min="0" data-lp="radius" value="${l.radius || 0}"></div>` : ''}` : ''}`, 'prop-shape');
      if (l.kind === 'text') html += sec('Text', `<div class="ai-row"><input class="ai-in" style="width:100%" data-lp="text" value="${esc(l.text)}"></div>
        <div class="ai-row"><select class="ai-sel" data-lp="font">${Object.keys(FONTS).map((f) => `<option${f === l.font ? ' selected' : ''}>${f}</option>`).join('')}</select><input class="ai-in" type="number" min="6" data-lp="fsize" value="${l.fsize}"><span class="ai-unit">px</span></div>
        <div class="ai-row"><label>Color</label><input type="color" data-lp="color" value="${l.color.toLowerCase()}" data-hl="prop-textcolor"><div class="ae-swatches">${SWATCHES.slice(0, 10).map((c) => `<button data-colsw="${c}" style="background:${c}"></button>`).join('')}</div></div>`, 'prop-text');
      if ((l.fx || []).length) html += sec('Effects', l.fx.map((f) => `<div class="ai-row"><span class="ae-fxic">fx</span><label class="wide">${FX[f.type].name}</label>${f.color ? `<input type="color" data-fxc="${f.id}" value="${f.color.toLowerCase()}">` : ''}<button class="ai-ib" data-fxdel="${f.id}" title="Remove effect">✕</button></div>`).join(''));
      html += sec('Layer', `<div class="ai-btnrow"><button data-c="dup">Duplicate (${CMD}D)</button><button data-c="center">Center anchor</button><button data-c="del">Delete</button></div>`);
      b.innerHTML = html;
      this.bindScrubs(b);
      b.querySelectorAll('[data-sw]').forEach((x) => x.addEventListener('click', () => this.toggleStopwatch(l, x.dataset.sw)));
      b.querySelectorAll('[data-lp]').forEach((x) => {
        x.addEventListener('keydown', (e) => e.stopPropagation());
        x.addEventListener('change', () => {
          const k = x.dataset.lp, v = x.value;
          if (k === 'w' || k === 'h') { const i = k === 'w' ? 0 : 1, old = l.size[i]; l.size[i] = Math.max(1, +v); const a = l.props.anchor; if (!a.k) a.v[i] = a.v[i] * (l.size[i] / old); }
          else if (['sw', 'fsize', 'radius'].includes(k)) l[k] = Math.max(0, +v);
          else l[k] = v.toUpperCase ? (k === 'text' || k === 'font' ? v : v.toUpperCase()) : v;
          if (k === 'text') l.name = v.slice(0, 22);
          if (k === 'stroke' && !l.sw) l.sw = 4;
          this.commit(); this.renderAll(); this.act('layerProp', { k, layer: l.name });
        });
      });
      b.querySelectorAll('[data-fillsw]').forEach((x) => x.addEventListener('click', () => { l.fill = x.dataset.fillsw; this.commit(); this.renderAll(); this.act('layerProp', { k: 'fill', layer: l.name }); }));
      b.querySelectorAll('[data-colsw]').forEach((x) => x.addEventListener('click', () => { l.color = x.dataset.colsw; this.commit(); this.renderAll(); this.act('layerProp', { k: 'color', layer: l.name }); }));
      b.querySelectorAll('[data-fxc]').forEach((x) => x.addEventListener('change', () => { const f = l.fx.find((q) => q.id === x.dataset.fxc); f.color = x.value.toUpperCase(); this.commit(); this.renderAll(); this.act('fxColor'); }));
      b.querySelectorAll('[data-fxdel]').forEach((x) => x.addEventListener('click', () => this.removeFx(l, x.dataset.fxdel)));
      b.querySelectorAll('[data-c]').forEach((x) => x.addEventListener('click', () => { const c = x.dataset.c; if (c === 'dup') this.duplicate(); if (c === 'del') this.deleteLayers(); if (c === 'center') this.centerAnchor(l); }));
    }
    /** blue "scrubby" value: drag left/right to change, click to type */
    scrubHTML(l, path) {
      const v = valueAt(this.prop(l, path), this.time), m = this.propMeta(path);
      const parts = Array.isArray(v) ? v : [v];
      return `<span class="ae-vals" data-vals="${l.id}|${path}">${parts.map((x, i) => `<span class="ae-scrub" data-scrub="${l.id}|${path}|${i}" title="Drag left/right or click to type">${fmt(x, path === 'scale' || path === 'rotation' ? 1 : 0)}${m.unit === '%' && (path !== 'scale' || i === parts.length - 1) ? '%' : m.unit === '°' ? '°' : ''}</span>`).join('<i>,</i>')}</span>`;
    }
    bindScrubs(root) {
      root.querySelectorAll('[data-scrub]').forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation();
          const [id, path, idx] = el.dataset.scrub.split('|'), l = this.layer(id), m = this.propMeta(path);
          const start = e.clientX, v0 = clone(valueAt(this.prop(l, path), this.time));
          let moved = false;
          const mv = (ev) => {
            const dx = ev.clientX - start;
            if (Math.abs(dx) > 2) moved = true;
            if (!moved) return;
            const step = (m.step || 1) * (ev.shiftKey ? 10 : 1);
            let nv = clone(v0);
            if (Array.isArray(nv)) { if (path === 'scale' && !ev.altKey) nv = nv.map((x) => x + dx * step); else nv[+idx] += dx * step; } else nv += dx * step;
            nv = Array.isArray(nv) ? nv.map((x) => Math.round(x * 10) / 10) : Math.round(nv * 10) / 10;
            this.setValue(l, path, nv, { noCommit: true, silent: true });
            this.updateValuesUI();
          };
          const up = () => {
            window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
            if (moved) { const p = this.prop(l, path); this.commit(); this.renderAll(); if (p.k) this.act('keyAdd', { path, layer: l.name, count: p.k.length }); this.act('prop', { path, layer: l.name, animated: !!p.k, scrub: true }); return; }
            // click: type a value
            const inp = document.createElement('input');
            inp.className = 'ae-scrub-in'; inp.value = Array.isArray(v0) ? v0[+idx] : v0;
            el.replaceWith(inp); inp.focus(); inp.select();
            const done = (ok) => {
              if (ok) { let nv = clone(v0); const x = parseFloat(inp.value); if (!isNaN(x)) { if (Array.isArray(nv)) { if (path === 'scale') nv = [x, x]; else nv[+idx] = x; } else nv = x; this.setValue(l, path, nv); } }
              this.renderAll();
            };
            inp.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') { inp.blur(); } if (ev.key === 'Escape') { inp.dataset.cancel = 1; inp.blur(); } });
            inp.addEventListener('blur', () => done(!inp.dataset.cancel));
          };
          window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
        });
      });
    }
    updateValuesUI() {
      this.root.querySelectorAll('[data-vals]').forEach((el) => {
        const [id, path] = el.dataset.vals.split('|'), l = this.layer(id);
        if (!l || !this.prop(l, path)) return;
        const v = valueAt(this.prop(l, path), this.time), parts = Array.isArray(v) ? v : [v];
        el.querySelectorAll('[data-scrub]').forEach((s, i) => { const m = this.propMeta(path); s.textContent = fmt(parts[i], path === 'scale' || path === 'rotation' ? 1 : 0) + (m.unit === '%' && (path !== 'scale' || i === parts.length - 1) ? '%' : m.unit === '°' ? '°' : ''); });
      });
    }
    updateTimeUI() {
      this.$.timecode.textContent = this.timecode(this.time);
      const cti = this.$.tl.querySelector('.ae-cti');
      if (cti) cti.style.left = this.tx(this.time) + 'px';
      const vtc = this.$.vbar.querySelector('.ae-vtc'); if (vtc) vtc.textContent = this.timecode(this.time);
      this.updateValuesUI();
      this.$.tl.querySelectorAll('[data-nav]').forEach((n) => { const [id, path] = n.dataset.nav.split('|'), l = this.layer(id), p = l && this.prop(l, path); n.classList.toggle('on', !!(p && p.k && p.k.some((k) => Math.abs(k.t - this.time) < 1e-3))); });
    }

    /* --------------------------------------------------- timeline */
    trackW() { return this._trackW || 600; }
    tx(t) { return 8 + (t / this.comp.dur) * (this.trackW() - 16); }
    tFromX(x) { return ((x - 8) / (this.trackW() - 16)) * this.comp.dur; }
    renderTimeline() {
      const body = this.$.tl, C = this.comp;
      if (!body) return;
      const scroll = body.scrollTop;
      const rows = [];
      const keyRow = (l, path, label, indent) => {
        const p = this.prop(l, path);
        const on = !!p.k, here = on && p.k.some((k) => Math.abs(k.t - this.time) < 1e-3);
        const diamonds = on ? p.k.map((k, i) => { const key = `${l.id}|${path}|${i}`; return `<span class="ae-key${k.e ? ' ease' : ''}${this.selKeys.has(key) ? ' sel' : ''}" data-key="${key}" style="left:${this.tx(k.t)}px" title="${this.timecode(k.t)}${k.e ? ' · Easy Ease' : ''}"></span>`; }).join('') : '';
        rows.push(`<div class="ae-row ae-proprow" data-prow="${l.id}|${path}" data-hl="row-${path}">
          <div class="ae-left" style="padding-left:${indent}px"><span class="ae-kn"><button data-kp="${l.id}|${path}|-1" title="Previous keyframe">◂</button><button class="ae-knav${here ? ' on' : ''}" data-nav="${l.id}|${path}" title="Add/remove keyframe here">◆</button><button data-kp="${l.id}|${path}|1" title="Next keyframe">▸</button></span>
          <button class="ae-sw" data-tsw="${l.id}|${path}" title="Stopwatch: click to animate this property" data-hl="sw-${path}">${STOPWATCH(on)}</button><span class="ae-pname">${label}</span>${this.scrubHTML(l, path)}</div>
          <div class="ae-track">${diamonds}</div></div>`);
      };
      C.layers.forEach((l, idx) => {
        const sel = this.sel.has(l.id);
        const parentOpts = `<option value="">None</option>${C.layers.filter((x) => x.id !== l.id).map((x) => `<option value="${x.id}"${l.parent === x.id ? ' selected' : ''}>${C.layers.indexOf(x) + 1}. ${esc(x.name)}</option>`).join('')}`;
        rows.push(`<div class="ae-row ae-layerrow${sel ? ' sel' : ''}" data-lrow="${l.id}" data-hl="layer-${idx + 1}">
          <div class="ae-left"><button class="ae-eye${l.visible ? '' : ' off'}" data-eye="${l.id}" title="Show/hide">${l.visible ? '👁' : ''}</button><button class="ae-lock${l.locked ? ' on' : ''}" data-lock="${l.id}" title="Lock">${l.locked ? '🔒' : ''}</button>
            <button class="ae-twirl${l._open ? ' open' : ''}" data-twirl="${l.id}" title="Show properties" data-hl="twirl-${idx + 1}">▸</button><span class="ae-lab" style="background:${l.label}"></span><span class="ae-num">${idx + 1}</span>
            <span class="ae-kindic">${l.kind === 'shape' ? '★' : l.kind === 'text' ? 'T' : l.kind === 'solid' ? '▬' : '🖼'}</span><span class="ae-lname">${esc(l.name)}</span>
            <select class="ae-parent" data-parent="${l.id}" title="Parent &amp; Link" data-hl="parent-${idx + 1}">${parentOpts}</select></div>
          <div class="ae-track"><span class="ae-bar" data-bar="${l.id}" style="left:${this.tx(Math.max(0, l.in))}px;width:${Math.max(4, this.tx(Math.min(C.dur, l.out)) - this.tx(Math.max(0, l.in)))}px;background:${l.label}"><i class="ae-trim l" data-trim="${l.id}|in"></i><i class="ae-trim r" data-trim="${l.id}|out"></i></span></div></div>`);
        if (l._open) {
          const only = l._only;
          const show = (path) => !only || only.includes(path);
          if (!only) rows.push(`<div class="ae-row ae-grprow"><div class="ae-left" style="padding-left:58px">▾ Transform <button class="ae-reset" data-resetT="${l.id}">Reset</button></div><div class="ae-track"></div></div>`);
          TRANSFORM.forEach((k) => { if (show(k)) keyRow(l, k, PROPS[k].name, only ? 58 : 72); });
          if (l.props.reveal && (show('reveal'))) { if (!only) rows.push(`<div class="ae-row ae-grprow"><div class="ae-left" style="padding-left:58px">▾ Text</div><div class="ae-track"></div></div>`); keyRow(l, 'reveal', 'Reveal (Typewriter)', only ? 58 : 72); }
          (l.fx || []).forEach((f) => {
            const paths = Object.keys(f.props).map((pn) => `fx:${f.id}:${pn}`).filter(show);
            if (!only) rows.push(`<div class="ae-row ae-grprow"><div class="ae-left" style="padding-left:58px">▾ <span class="ae-fxic">fx</span> ${FX[f.type].name}</div><div class="ae-track"></div></div>`);
            paths.forEach((path) => keyRow(l, path, FX[f.type].props[path.split(':')[2]].name, only ? 58 : 72));
          });
        }
      });
      const W = this.trackW(), secs = [];
      for (let s = 0; s <= C.dur; s += 0.5) secs.push(`<span class="ae-tick${s % 1 ? ' half' : ''}" style="left:${this.tx(s)}px">${s % 1 ? '' : s + 's'}</span>`);
      body.innerHTML = `<div class="ae-row ae-ruler"><div class="ae-left ae-colhead"><span>👁</span><span>🔒</span><span style="width:30px"></span><span>#</span><span class="ae-lname">Layer Name</span><span class="ae-parenth">Parent &amp; Link</span></div><div class="ae-track ae-rtrack" data-hl="time-ruler">${secs.join('')}</div></div>
        <div class="ae-rows">${rows.join('') || '<div class="ae-empty">No layers yet. Draw a shape (Q), click the Type tool, or add footage from the Project panel.</div>'}</div>
        <div class="ae-ctiwrap"><div class="ae-cti" data-hl="cti" style="left:${this.tx(this.time)}px"><span class="ae-ctihead"></span></div></div>`;
      body.scrollTop = scroll;
      const rt = body.querySelector('.ae-rtrack');
      if (rt) { const w = rt.getBoundingClientRect().width; if (w && Math.abs(w - W) > 1) { this._trackW = w; return this.renderTimeline(); } }
      this.positionCTI();
      this.bindTimeline();
      this.updateTimeUI();
    }
    positionCTI() {
      const body = this.$.tl, rt = body.querySelector('.ae-rtrack'), wrap = body.querySelector('.ae-ctiwrap');
      if (!rt || !wrap) return;
      const r = rt.getBoundingClientRect(), br = body.getBoundingClientRect();
      wrap.style.left = (r.left - br.left) + 'px'; wrap.style.width = r.width + 'px';
      wrap.style.height = body.scrollHeight + 'px';
    }
    bindTimeline() {
      const b = this.$.tl;
      this.bindScrubs(b);
      const scrubTime = (e, el) => {
        const r = el.getBoundingClientRect();
        this.stop();
        const go = (ev) => this.setTime(this.tFromX(ev.clientX - r.left));
        go(e);
        const mv = (ev) => go(ev);
        const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); this.act('scrub', { t: this.time }); this.renderTimeline(); this.renderRight(); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      };
      const rt = b.querySelector('.ae-rtrack');
      rt.addEventListener('pointerdown', (e) => { e.preventDefault(); scrubTime(e, rt); });
      const cti = b.querySelector('.ae-cti');
      cti.querySelector('.ae-ctihead').addEventListener('pointerdown', (e) => { e.preventDefault(); scrubTime(e, rt); });
      b.querySelectorAll('[data-lrow]').forEach((r) => r.querySelector('.ae-left').addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('select')) return;
        this.selectLayer(r.dataset.lrow, e.shiftKey || e.ctrlKey || e.metaKey);
      }));
      b.querySelectorAll('[data-twirl]').forEach((x) => x.addEventListener('click', () => { const l = this.layer(x.dataset.twirl); l._open = !l._open || !!l._only; l._only = null; this.renderTimeline(); this.act('twirl', { open: l._open, layer: l.name }); }));
      b.querySelectorAll('[data-eye]').forEach((x) => x.addEventListener('click', () => { const l = this.layer(x.dataset.eye); l.visible = !l.visible; this.commit(); this.renderAll(); this.act('layerVis', { visible: l.visible, lname: l.name }); }));
      b.querySelectorAll('[data-lock]').forEach((x) => x.addEventListener('click', () => { const l = this.layer(x.dataset.lock); l.locked = !l.locked; this.commit(); this.renderAll(); this.act('lock', { on: l.locked }); }));
      b.querySelectorAll('[data-parent]').forEach((x) => { x.addEventListener('keydown', (e) => e.stopPropagation()); x.addEventListener('change', () => this.setParent(this.layer(x.dataset.parent), x.value)); });
      b.querySelectorAll('[data-tsw]').forEach((x) => x.addEventListener('click', () => { const [id, path] = x.dataset.tsw.split('|'); this.toggleStopwatch(this.layer(id), path); }));
      b.querySelectorAll('[data-nav]').forEach((x) => x.addEventListener('click', () => { const [id, path] = x.dataset.nav.split('|'); this.toggleKeyHere(this.layer(id), path); }));
      b.querySelectorAll('[data-kp]').forEach((x) => x.addEventListener('click', () => { const [id, path, d] = x.dataset.kp.split('|'); this.jumpKey(this.layer(id), path, +d); }));
      b.querySelectorAll('[data-resett]').forEach((x) => x.addEventListener('click', () => { const l = this.layer(x.dataset.resett); const sz = this.contentSize(l); l.props.anchor = { v: [sz[0] / 2, sz[1] / 2], k: null }; l.props.scale = { v: [100, 100], k: null }; l.props.rotation = { v: 0, k: null }; l.props.opacity = { v: 100, k: null }; this.commit(); this.renderAll(); this.act('resetTransform'); }));
      // keyframes: select + drag in time
      b.querySelectorAll('[data-key]').forEach((el) => el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const key = el.dataset.key;
        if (e.shiftKey) { this.selKeys.has(key) ? this.selKeys.delete(key) : this.selKeys.add(key); }
        else if (!this.selKeys.has(key)) { this.selKeys.clear(); this.selKeys.add(key); }
        const [lid] = key.split('|');
        if (!this.sel.has(lid)) this.sel = new Set([lid]);
        const objs = this.keyObjs().map((o) => ({ ...o, t0: o.k.t }));
        const startX = e.clientX, track = el.parentNode.getBoundingClientRect();
        let moved = false;
        const mv = (ev) => {
          const dt = ((ev.clientX - startX) / (track.width - 16)) * this.comp.dur;
          if (Math.abs(ev.clientX - startX) > 2) moved = true;
          if (!moved) return;
          objs.forEach((o) => { o.k.t = this.snapT(o.t0 + dt); });
          b.querySelectorAll('[data-key]').forEach((d) => { const [id, path, i] = d.dataset.key.split('|'), l = this.layer(id), p = l && this.prop(l, path); if (p && p.k && p.k[+i]) d.style.left = this.tx(p.k[+i].t) + 'px'; });
          this.renderViewer();
        };
        const up = () => {
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
          if (moved) {
            // re-sort and keep selection pointing at the moved keys
            const moving = objs.map((o) => o.k);
            objs.forEach((o) => o.p.k.sort((a2, b2) => a2.t - b2.t));
            this.selKeys.clear();
            objs.forEach((o) => this.selKeys.add(`${o.l.id}|${o.path}|${o.p.k.indexOf(o.k)}`));
            void moving;
            this.commit(); this.act('keyMove', { count: objs.length });
          } else this.act('keySelect', { count: this.selKeys.size });
          this.renderAll();
        };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      }));
      // layer bars: drag to move in time, edges to trim
      b.querySelectorAll('[data-bar]').forEach((el) => el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const l = this.layer(el.dataset.bar), trim = e.target.dataset.trim, startX = e.clientX, track = el.parentNode.getBoundingClientRect();
        if (!this.sel.has(l.id)) { this.sel = new Set([l.id]); }
        const in0 = l.in, out0 = l.out, snap = this.snapshot();
        let moved = false;
        const mv = (ev) => {
          const dt = this.snapT(Math.abs(((ev.clientX - startX) / (track.width - 16)) * this.comp.dur)) * Math.sign(ev.clientX - startX);
          if (Math.abs(ev.clientX - startX) > 2) moved = true;
          if (!moved) return;
          const fresh = JSON.parse(snap).layers.find((x) => x.id === l.id);
          if (trim) { const which = trim.split('|')[1]; if (which === 'in') l.in = clamp(in0 + dt, 0, l.out - this.fr()); else l.out = clamp(out0 + dt, l.in + this.fr(), this.comp.dur); }
          else { Object.assign(l.props, fresh.props); l.fx = fresh.fx; l.in = in0; l.out = out0; this.moveLayerTime(l, dt); }
          el.style.left = this.tx(Math.max(0, l.in)) + 'px'; el.style.width = Math.max(4, this.tx(Math.min(this.comp.dur, l.out)) - this.tx(Math.max(0, l.in))) + 'px';
          this.renderViewer();
        };
        const up = () => {
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
          if (moved) { this.commit(); this.act('layerTime', { how: trim ? 'trim' : 'move', lname: l.name, in: l.in }); }
          else this.selectLayer(l.id);
          this.renderAll();
        };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      }));
    }

    /* ------------------------------------------------------- menus */
    menuDef() {
      const n = this.sel.size;
      return {
        File: [
          { l: 'Import Your Image…', k: CMD + 'I', f: () => this.$.file.click() },
          '-',
          { l: 'Export', sub: [{ l: 'Video (WebM)…', k: CMD + 'M', f: () => this.exportVideo() }, { l: 'Current Frame as PNG…', f: () => this.exportFrame() }] },
        ],
        Edit: [
          { l: 'Undo', k: CMD + 'Z', f: () => this.undo(), d: this.hist.length < 2 },
          { l: 'Redo', k: SHIFT + CMD + 'Z', f: () => this.redo(), d: !this.fut.length },
          '-',
          { l: 'Duplicate', k: CMD + 'D', f: () => this.duplicate(), d: !n },
          { l: 'Clear', k: 'Del', f: () => (this.selKeys.size ? this.deleteKeys() : this.deleteLayers()), d: !n && !this.selKeys.size },
          { l: 'Select All', k: CMD + 'A', f: () => { this.sel = new Set(this.comp.layers.map((l) => l.id)); this.renderAll(); } },
        ],
        Composition: [
          { l: 'Composition Settings…', k: CMD + 'K', f: () => this.compDialog() },
          '-',
          { l: 'Preview (Play / Stop)', k: 'Space', f: () => this.togglePlay() },
          { l: 'Add to Render Queue (Export Video)', k: CMD + 'M', f: () => this.exportVideo() },
        ],
        Layer: [
          { l: 'New', sub: [{ l: 'Solid…', k: CMD + 'Y', f: () => this.addSolid() }, { l: 'Text', f: () => this.addLayer({ kind: 'text', name: 'Hello', text: 'Hello' }) }, { l: 'Shape Layer (Rectangle)', f: () => this.addLayer({ kind: 'shape', shape: 'rect', name: 'Rectangle 1', size: [240, 160] }) }] },
          '-',
          { l: 'Transform', sub: [{ l: 'Center Anchor Point in Layer Content', k: CMD + ALT + 'Home', f: () => this.selLayers().forEach((l) => this.centerAnchor(l)), d: !n }, { l: 'Reset', f: () => this.selLayers().forEach((l) => { l.props.scale = { v: [100, 100], k: null }; l.props.rotation = { v: 0, k: null }; l.props.opacity = { v: 100, k: null }; this.commit(); this.renderAll(); }), d: !n }] },
          { l: 'Delete Layer', f: () => this.deleteLayers(), d: !n },
        ],
        Effect: Object.entries(FX).map(([k, f]) => ({ l: `${f.cat} › ${f.name}`, f: () => this.applyEffect(k), d: !n })),
        Animation: [
          { l: 'Keyframe Assistant', sub: [{ l: 'Easy Ease', k: 'F9', f: () => this.easyEase(), d: !this.selKeys.size }] },
          { l: 'Apply Animation Preset', sub: Object.entries(PRESETS).map(([k, p]) => ({ l: p.name, f: () => this.applyPreset(k), d: !n })) },
          '-',
          { l: 'Reveal Animated Properties', k: 'U', f: () => this.reveal('U') },
          { l: 'Previous Keyframe', k: 'J', f: () => this.jumpKey(null, null, -1) },
          { l: 'Next Keyframe', k: 'K', f: () => this.jumpKey(null, null, 1) },
        ],
        View: [{ l: 'Zoom In', k: CMD + '=', f: () => this.zoomBy(1.25) }, { l: 'Zoom Out', k: CMD + '-', f: () => this.zoomBy(0.8) }, { l: 'Fit', k: SHIFT + '/', f: () => this.fit(true) }],
        Window: [{ l: 'Effects & Presets', c: this.rightTab === 'effects', f: () => this.showTab('effects') }, { l: 'Properties', c: this.rightTab === 'properties', f: () => this.showTab('properties') }],
        Help: [{ l: 'Keyboard Shortcuts…', f: () => this.emit('help', { what: 'shortcuts' }) }, { l: 'After Effects Help…', f: () => this.emit('help', { what: 'help' }) }],
      };
    }
    openMenu(m) {
      const defs = this.menuDef()[m.dataset.m];
      this._openMenu = m.dataset.m; this._menuFns = [];
      this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.toggle('open', x === m));
      const build = (items) => items.map((it) => {
        if (it === '-') return '<div class="ai-msep"></div>';
        const i = this._menuFns.push(it.f) - 1;
        if (it.sub) return `<div class="ai-mi has-sub${it.d ? ' disabled' : ''}" data-l="${esc(it.l)}"><span class="ck"></span><span class="l">${esc(it.l)}</span><span class="k">▸</span><div class="ai-sub">${build(it.sub)}</div></div>`;
        return `<div class="ai-mi${it.d ? ' disabled' : ''}" data-i="${i}" data-l="${esc(it.l)}"><span class="ck">${it.c ? '✓' : ''}</span><span class="l">${esc(it.l)}</span><span class="k">${it.k || ''}</span></div>`;
      }).join('');
      const dd = this.$.dropdown;
      dd.innerHTML = build(defs); dd.hidden = false;
      const r = m.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      dd.style.left = (r.left - rr.left) + 'px'; dd.style.top = (r.bottom - rr.top) + 'px';
      this.act('menuOpen', { menu: m.dataset.m });
    }
    closeMenu() { if (!this._openMenu) return; this._openMenu = null; this.$.dropdown.hidden = true; this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.remove('open')); }
    compDialog() {
      const C = this.comp, d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="Composition Settings" style="width:330px"><div class="ai-dialog-title">Composition Settings</div><div class="ai-dialog-body">
        <label><span>Name:</span><input type="text" value="${esc(C.name)}" data-c="name" style="width:150px"></label>
        <label><span>Duration:</span><input type="number" min="1" max="20" value="${C.dur}" data-c="dur"> <em>sec</em></label>
        <label><span>Background:</span><input type="color" value="${C.bg.toLowerCase()}" data-c="bg" data-hl="comp-bg" style="width:60px;padding:0"></label>
        <div class="ae-swatches" style="margin-left:78px">${['#14142B', '#000000', '#FFFFFF', '#1D4ED8', '#FFE5B4', '#FF7A59', '#19C3B1', '#7C5CFF'].map((c) => `<button data-bgsw="${c}" style="background:${c}"></button>`).join('')}</div>
        <p class="ps-note" style="margin-top:8px">Size: ${C.w} × ${C.h} px · ${C.fps} frames per second</p></div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">OK</button></div></div>`;
      d.querySelectorAll('[data-bgsw]').forEach((x) => x.addEventListener('click', () => { d.querySelector('[data-c=bg]').value = x.dataset.bgsw.toLowerCase(); }));
      d.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelector('[data-x=ok]').onclick = () => {
        C.name = d.querySelector('[data-c=name]').value || C.name;
        const nd = clamp(+d.querySelector('[data-c=dur]').value || C.dur, 1, 20);
        C.layers.forEach((l) => { if (Math.abs(l.out - C.dur) < 1e-3) l.out = nd; });
        C.dur = nd; C.bg = d.querySelector('[data-c=bg]').value.toUpperCase();
        close(); this.time = Math.min(this.time, C.dur);
        this.commit(); this.root.querySelectorAll('.ae-compname').forEach((x) => { x.textContent = C.name; }); this.renderAll();
        this.act('compSettings', { bg: C.bg, dur: C.dur });
      };
      this.act('dialog', { title: 'Composition Settings' });
    }

    /* ------------------------------------------------------- export */
    download(blob, name) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      if (this.opts.onDownload) this.opts.onDownload(blob, name);
    }
    exportFrame() {
      const C = this.comp, c = mkCanvas(C.w, C.h);
      this.renderFrame(c.getContext('2d'), this.time, C.w, C.h);
      c.toBlob((b) => b && this.download(b, 'frame.png'), 'image/png');
      this.act('export', { format: 'png' });
    }
    exportVideo() {
      const C = this.comp;
      const c = mkCanvas(C.w, C.h);
      if (!c.captureStream || !window.MediaRecorder) { this.toast('Video export is not supported in this browser — exporting a PNG frame instead'); return this.exportFrame(); }
      if (this._recording) return;
      let rec;
      try {
        const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
        rec = new MediaRecorder(c.captureStream(C.fps), type ? { mimeType: type, videoBitsPerSecond: 5e6 } : undefined);
      } catch (e) { this.toast('Could not start the video recorder — exporting a PNG frame instead'); return this.exportFrame(); }
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        this._recording = false; this.root.classList.remove('rendering');
        const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
        this.download(blob, `${C.name.replace(/\W+/g, '-') || 'animation'}.${(rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'}`);
      };
      this._recording = true; this.root.classList.add('rendering');
      this.toast('🎬 Rendering your video… (it plays once in real time)');
      const g = c.getContext('2d'), start = performance.now();
      rec.start(100);
      this.act('export', { format: 'video' });
      const step = (now) => {
        const t = Math.min(C.dur, (now - start) / 1000);
        this.renderFrame(g, t, C.w, C.h);
        this.time = t; this.renderViewer(); this.updateTimeUI();
        if (t < C.dur) requestAnimationFrame(step); else setTimeout(() => rec.stop(), 150);
      };
      requestAnimationFrame(step);
    }
    exportPNG() { this.exportFrame(); }
    snapshotDataURL(cb, w = 480, t) {
      const C = this.comp, c = mkCanvas(w, (w * C.h) / C.w);
      this.renderFrame(c.getContext('2d'), t != null ? t : Math.min(C.dur, Math.max(this.time, C.dur * 0.8)), c.width, c.height);
      cb(c.toDataURL('image/png'));
    }
    saveLocal() { } loadLocal() { return false; } setTemplate() { }
    endTextEditSafe() { this.endTextEdit(); }

    showTip(el, html) { clearTimeout(this._tipT); this._tipT = setTimeout(() => { const t = this.$.tooltip, r = el.getBoundingClientRect(), rr = this.root.getBoundingClientRect(); t.innerHTML = html; t.hidden = false; t.style.left = (r.left - rr.left) + 'px'; t.style.top = (r.bottom - rr.top + 8) + 'px'; }, 450); }
    hideTip() { clearTimeout(this._tipT); if (this.$.tooltip) this.$.tooltip.hidden = true; }
    toast(msg) { const t = this.$.toast; t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(this._toastT); this._toastT = setTimeout(() => { t.hidden = true; }, 3000); }
    hl(name) { return this.root.querySelector(`[data-hl="${name}"]`); }

    /* lesson helpers */
    layerNamed(n) { return this.comp.layers.find((l) => l.name === n); }
    keys(l, path) { const p = l && this.prop(l, path); return (p && p.k) || []; }
    valueAt(p, t) { return valueAt(p, t); }
  }

  window.AEEditor = AEEditor;
  window.AEEditor.TOOLS = TOOLS;
  window.AEEditor.CMD = CMD; window.AEEditor.SHIFT = SHIFT; window.AEEditor.ALT = ALT;
})();
