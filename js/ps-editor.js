/* =========================================================================
   DesignQuest — Photoshop Workspace Simulator
   A browser-based, beginner-friendly recreation of the Adobe Photoshop
   workspace: menu bar, options bar, toolbar (with hidden-tool flyouts),
   rulers, document window, Color / Swatches / Properties / Adjustments /
   Layers / History panels.
   Real pixel editing on <canvas>: layers (opacity, blend modes, styles),
   selections (marquee, lasso, magic wand) with marching ants, brush,
   eraser, clone stamp, spot healing, paint bucket, gradient, type,
   crop, free transform, adjustments, filters, history and export.
   ========================================================================= */
(function () {
  'use strict';

  let UID = 1;
  const uid = () => 'L' + Date.now().toString(36) + (UID++);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const CMD = IS_MAC ? '⌘' : 'Ctrl+';
  const SHIFT = IS_MAC ? '⇧' : 'Shift+';
  const ALT = IS_MAC ? '⌥' : 'Alt+';
  const DPR = () => window.devicePixelRatio || 1;

  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const cloneCanvas = (src) => { const c = mkCanvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); return c; };
  const ctx2d = (c) => c.getContext('2d', { willReadFrequently: true });
  const hexRgb = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgbHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();

  const FONTS = {
    'Poppins': 'Poppins,sans-serif',
    'Montserrat': 'Montserrat,sans-serif',
    'Bebas Neue': "'Bebas Neue',Impact,sans-serif",
    'Playfair Display': "'Playfair Display',Georgia,serif",
    'Pacifico': 'Pacifico,cursive',
    'Lobster': 'Lobster,cursive',
    'Roboto Mono': "'Roboto Mono',monospace",
    'Myriad Pro': "'Myriad Pro','Source Sans 3','Segoe UI',Arial,sans-serif",
  };
  const fontStack = (f) => FONTS[f] || FONTS.Poppins;

  const BLENDS = [
    ['normal', 'Normal', 'source-over'], ['multiply', 'Multiply', 'multiply'], ['screen', 'Screen', 'screen'],
    ['overlay', 'Overlay', 'overlay'], ['soft-light', 'Soft Light', 'soft-light'], ['darken', 'Darken', 'darken'],
    ['lighten', 'Lighten', 'lighten'], ['difference', 'Difference', 'difference'], ['color', 'Color', 'color'], ['luminosity', 'Luminosity', 'luminosity'],
  ];
  const blendOp = (b) => (BLENDS.find((x) => x[0] === b) || BLENDS[0])[2];

  const SWATCHES = ['#000000', '#FFFFFF', '#808080', '#C0C0C0', '#ED1C24', '#F15A24', '#F7931E', '#FBB03B', '#FCEE21', '#8CC63F',
    '#39B54A', '#00A99D', '#29ABE2', '#0071BC', '#2E3192', '#662D91', '#93278F', '#ED1E79', '#FFD6E0', '#FFE5B4',
    '#C9F2C7', '#BDE0FE', '#E4C1F9', '#FF7A59', '#FFC93C', '#19C3B1', '#7C5CFF', '#FF5FA2', '#754C24', '#3B2416'];

  /* ---------------------------------------------------------------- tools */
  const TOOLS = {
    move: { name: 'Move Tool', key: 'V', tip: 'Drag to move the selected layer. Turn on Auto-Select to grab any layer you click.' },
    marquee: { name: 'Rectangular Marquee Tool', key: 'M', tip: 'Drag to select a rectangle. Hold Shift to add, Alt to subtract.' },
    ellipse: { name: 'Elliptical Marquee Tool', key: 'M', tip: 'Drag to select an oval or circle.' },
    lasso: { name: 'Lasso Tool', key: 'L', tip: 'Draw freehand around something to select it.' },
    wand: { name: 'Magic Wand Tool', key: 'W', tip: 'Click to select all pixels with a similar color.' },
    crop: { name: 'Crop Tool', key: 'C', tip: 'Drag the edges to cut away the outside of your photo. Press Enter to finish.' },
    eyedropper: { name: 'Eyedropper Tool', key: 'I', tip: 'Click the photo to pick a color.' },
    heal: { name: 'Spot Healing Brush Tool', key: 'J', tip: 'Paint over a spot or scratch — it disappears!' },
    brush: { name: 'Brush Tool', key: 'B', tip: 'Paint with the foreground color. Change size with [ and ].' },
    clone: { name: 'Clone Stamp Tool', key: 'S', tip: 'Alt+click to pick a source, then paint to copy those pixels.' },
    eraser: { name: 'Eraser Tool', key: 'E', tip: 'Erase pixels to see through the layer.' },
    gradient: { name: 'Gradient Tool', key: 'G', tip: 'Drag a line to fill with a smooth blend of two colors.' },
    bucket: { name: 'Paint Bucket Tool', key: 'G', tip: 'Click to fill similar colors with the foreground color.' },
    type: { name: 'Horizontal Type Tool', key: 'T', tip: 'Click on the photo and type. Press Esc when done.' },
    hand: { name: 'Hand Tool', key: 'H', tip: 'Drag to move around. (Hold Space for a shortcut!)' },
    zoom: { name: 'Zoom Tool', key: 'Z', tip: 'Click to zoom in. Alt+click to zoom out.' },
  };
  const TOOL_GROUPS = [['move'], ['marquee', 'ellipse'], ['lasso'], ['wand'], ['crop'], ['eyedropper'], ['heal'], ['brush'], ['clone'], ['eraser'], ['gradient', 'bucket'], ['type'], ['hand'], ['zoom']];

  const ICON = {
    move: '<path d="M12 2.5v19M2.5 12h19" stroke="currentColor" stroke-width="1.4"/><path d="M12 2.5l-2.5 3h5zM12 21.5l-2.5-3h5zM2.5 12l3-2.5v5zM21.5 12l-3-2.5v5z" fill="currentColor"/><path d="M13.5 9l6 4.2-2.6.6 1.6 3-1.2.6-1.6-3-2.2 1.7z" fill="currentColor"/>',
    marquee: '<rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2"/>',
    lasso: '<path d="M7 15c-3.5-1.5-3.5-6 1-8s11-1.5 11 3-6 6-10 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 15c0 2-1 3.5-3 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    wand: '<path d="M4 20L15 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M17 3v4M15 5h4M20.5 8.5v2.5M19.2 9.8h2.6M11 3.5v2M10 4.5h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    crop: '<path d="M7 3v14h14M3 7h14v14" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    eyedropper: '<path d="M18.9 5.1a2.3 2.3 0 0 0-3.2 0l-2.4 2.4-1-1-1.5 1.5 1 1-6.6 6.6-.6 3.6 3.6-.6 6.6-6.6 1 1 1.5-1.5-1-1 2.4-2.4a2.3 2.3 0 0 0 0-3.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    heal: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-40 12 12)" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="9" width="6" height="6" transform="rotate(-40 12 12)" fill="currentColor" opacity=".55"/>',
    brush: '<path d="M19.6 3.6c-1 0-6.6 6-8.6 8.6l1.9 1.9c2.6-2 8.6-7.6 8.6-8.6 0-1-.9-1.9-1.9-1.9z" fill="currentColor"/><path d="M9.9 13.4c-2 0-3.4 1.5-3.4 3.4 0 1.1-.8 2-2 2.5 2.6 1.1 7.2.6 7.6-3.4z" fill="currentColor"/>',
    clone: '<path d="M9.5 3.5h5v4l2 4h-9l2-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><rect x="5" y="11.5" width="14" height="4" rx="1" fill="currentColor"/><path d="M6 18h12v2.5H6z" fill="currentColor"/>',
    eraser: '<path d="M14.5 4.5l5 5-9 9H6l-2.5-2.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.5 16l4.5 4.5M9 10l5 5" stroke="currentColor" stroke-width="1.6"/><path d="M12 20.5h8" stroke="currentColor" stroke-width="1.6"/>',
    gradient: '<defs><linearGradient id="psg" x1="0" x2="1"><stop offset="0" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><rect x="3.5" y="6" width="17" height="12" fill="url(#psg)" stroke="currentColor" stroke-width="1.3"/>',
    bucket: '<path d="M5 11l6-6 7 7-6 6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 11h13" stroke="currentColor" stroke-width="1.6"/><path d="M19.5 15s-1.8 2.2-1.8 3.3a1.8 1.8 0 0 0 3.6 0c0-1.1-1.8-3.3-1.8-3.3z" fill="currentColor"/>',
    type: '<path d="M5 4.5h14v3.3h-1.4l-.6-1.6h-3.6v12l2 .8v1.5H8.6V19l2-.8v-12H7l-.6 1.6H5z" fill="currentColor"/>',
    hand: '<path d="M8.3 13V6.7a1.4 1.4 0 0 1 2.8 0V12m0-.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3m0-.4V6.4a1.4 1.4 0 0 1 2.8 0v7c0 4.1-2.4 7-6 7-2.4 0-3.9-1.2-5.4-3.4L4.4 13.7a1.3 1.3 0 0 1 2.1-1.5l1.8 2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const svgIcon = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[k] || ''}</svg>`;

  /* ================================================== pixel helpers */
  function boxBlur(src, dst, w, h, r) {
    // horizontal then vertical sliding window on RGBA
    const tmp = new Float32Array(w * h * 4);
    const div = r * 2 + 1;
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 4; c++) {
        let acc = 0;
        for (let k = -r; k <= r; k++) acc += src[(y * w + clamp(k, 0, w - 1)) * 4 + c];
        for (let x = 0; x < w; x++) {
          tmp[(y * w + x) * 4 + c] = acc / div;
          acc += src[(y * w + Math.min(x + r + 1, w - 1)) * 4 + c] - src[(y * w + Math.max(x - r, 0)) * 4 + c];
        }
      }
    }
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 4; c++) {
        let acc = 0;
        for (let k = -r; k <= r; k++) acc += tmp[(clamp(k, 0, h - 1) * w + x) * 4 + c];
        for (let y = 0; y < h; y++) {
          dst[(y * w + x) * 4 + c] = acc / div;
          acc += tmp[(Math.min(y + r + 1, h - 1) * w + x) * 4 + c] - tmp[(Math.max(y - r, 0) * w + x) * 4 + c];
        }
      }
    }
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (!s) { const v = l * 255; return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  /** apply an adjustment to an ImageData (returns new data array) */
  function adjustData(id, kind, p) {
    const s = id.data, out = new Uint8ClampedArray(s.length), w = id.width, h = id.height;
    if (kind === 'blur') {
      const r = Math.max(1, Math.round(p.radius / 2));
      let a = new Float32Array(s), b = new Float32Array(s.length);
      for (let i = 0; i < 3; i++) { boxBlur(a, b, w, h, r); [a, b] = [b, a]; }
      out.set(a);
      return out;
    }
    if (kind === 'sharpen') {
      const amt = (p.amount || 50) / 100;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const v = s[i + c];
          const n = (s[((y * w) + Math.max(x - 1, 0)) * 4 + c] + s[((y * w) + Math.min(x + 1, w - 1)) * 4 + c] + s[((Math.max(y - 1, 0) * w) + x) * 4 + c] + s[((Math.min(y + 1, h - 1) * w) + x) * 4 + c]) / 4;
          out[i + c] = v + (v - n) * 2 * amt;
        }
        out[i + 3] = s[i + 3];
      }
      return out;
    }
    if (kind === 'mosaic') {
      const cs = Math.max(2, Math.round(p.size || 12));
      for (let by = 0; by < h; by += cs) for (let bx = 0; bx < w; bx += cs) {
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let y = by; y < Math.min(by + cs, h); y++) for (let x = bx; x < Math.min(bx + cs, w); x++) { const i = (y * w + x) * 4; r += s[i]; g += s[i + 1]; b += s[i + 2]; a += s[i + 3]; n++; }
        for (let y = by; y < Math.min(by + cs, h); y++) for (let x = bx; x < Math.min(bx + cs, w); x++) { const i = (y * w + x) * 4; out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = a / n; }
      }
      return out;
    }
    if (kind === 'noise') {
      const amt = p.amount || 20;
      for (let i = 0; i < s.length; i += 4) { const n = (Math.random() - 0.5) * amt * 2.55; out[i] = s[i] + n; out[i + 1] = s[i + 1] + n; out[i + 2] = s[i + 2] + n; out[i + 3] = s[i + 3]; }
      return out;
    }
    const cf = kind === 'bc' ? (259 * (p.contrast * 2.55 + 255)) / (255 * (259 - p.contrast * 2.55)) : 1;
    for (let i = 0; i < s.length; i += 4) {
      let r = s[i], g = s[i + 1], b = s[i + 2];
      if (kind === 'bc') {
        r = cf * (r + p.brightness - 128) + 128; g = cf * (g + p.brightness - 128) + 128; b = cf * (b + p.brightness - 128) + 128;
      } else if (kind === 'hsl') {
        let [hh, ss, ll] = rgb2hsl(r, g, b);
        hh = (hh + p.hue / 360 + 1) % 1;
        ss = clamp(ss * (1 + p.sat / 100), 0, 1);
        ll = p.light > 0 ? ll + (1 - ll) * (p.light / 100) : ll * (1 + p.light / 100);
        [r, g, b] = hsl2rgb(hh, ss, ll);
      } else if (kind === 'bw') {
        const v = 0.299 * r + 0.587 * g + 0.114 * b; r = g = b = v;
      } else if (kind === 'invert') {
        r = 255 - r; g = 255 - g; b = 255 - b;
      } else if (kind === 'warm') {
        r += p.amount * 0.6; b -= p.amount * 0.6;
      }
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = s[i + 3];
    }
    return out;
  }

  /* ============================================================ editor */
  class PSEditor {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = opts;
      this.doc = { w: 1000, h: 700 };
      this.layers = [];
      this.activeId = null;
      this.maskCanvas = null;
      this.segs = [];
      this.fg = '#000000'; this.bg = '#FFFFFF';
      this.o = { size: 30, hardness: 0.7, opacity: 100, tolerance: 32, contiguous: true, sampleAll: false, autoSelect: true, font: 'Poppins', fsize: 72, fweight: 700, selMode: 'new', ratio: 'free', healSize: 40 };
      this.tool = 'move';
      this.groupShown = { marquee: 'marquee', gradient: 'gradient' };
      this.view = { z: 1, x: 0, y: 0 };
      this.hist = []; this.hi = -1;
      this.listeners = []; this.log = [];
      this.flags = { rulers: true };
      this.tabs = { a: 'color', b: 'properties', c: 'layers' };
      this.photos = {};
      this.comp = mkCanvas(1, 1);
      this.preloadPhotos();
      this.watchFonts();
      this.build();
      this.bind();
      this.reset();
      requestAnimationFrame(() => { this.resize(); this.fit(); });
      this._ants = setInterval(() => { if (this.segs.length && this.isActive()) { this.antPhase = ((this.antPhase || 0) + 1) % 8; this.drawOverlay(); } }, 140);
    }

    /* ------------------------------------------------------------ events */
    on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((f) => f !== fn); }; }
    emit(type, data = {}) {
      const ev = { type, ...data, t: Date.now() };
      if (type === 'action') { this.log.push(ev); if (this.log.length > 300) this.log.shift(); }
      this.listeners.forEach((f) => { try { f(ev, this); } catch (e) { console.error(e); } });
    }
    act(name, data = {}) { this.emit('action', { name, ...data }); }
    did(name, test) { return this.log.some((e) => e.name === name && (!test || test(e))); }
    clearLog() { this.log = []; }
    isActive() { return this.root.offsetParent !== null; }

    /* ------------------------------------------------------------ photos */
    preloadPhotos() {
      const P = window.PS_PHOTOS || {};
      Object.entries(P).forEach(([k, v]) => {
        const img = new Image();
        img.onload = () => { this.photos[k] = img; (this._waiting || []).filter((w) => w.k === k).forEach((w) => w.fn(img)); };
        img.src = v.src;
        this.photos[k] = null;
      });
      this._waiting = [];
    }
    withPhoto(k, fn) {
      const img = this.photos[k];
      if (img && img.complete && img.naturalWidth) fn(img);
      else this._waiting.push({ k, fn });
    }
    photoLoaded() { this.dirtyAll(); clearTimeout(this._plT); this._plT = setTimeout(() => this.renderPanels(), 30); }
    /** web fonts load late: redraw type layers when they arrive */
    watchFonts() {
      if (!document.fonts) return;
      Object.keys(FONTS).forEach((f) => { [400, 700, 900].forEach((w) => document.fonts.load(`${w} 40px "${f}"`).catch(() => {})); });
      const redo = () => { let any = false; this.layers.forEach((l) => { if (l.kind === 'text' && !l._editing) { this.renderText(l); any = true; } }); if (any) { this.dirtyAll(); this.renderPanels(); } };
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', redo);
      document.fonts.ready.then(redo);
    }
    photoSize(k) { const p = (window.PS_PHOTOS || {})[k]; return p ? { w: p.w, h: p.h } : { w: 1000, h: 700 }; }

    /* ------------------------------------------------------------- build */
    build() {
      const root = document.createElement('div');
      root.className = 'ai ps';
      root.tabIndex = -1;
      root.innerHTML = `
        <div class="ai-menubar">
          <div class="ai-logo ps-logo" title="Photoshop">Ps</div>
          <div class="ai-menus"></div>
          <div class="ai-menubar-right"><span class="ai-workspace">Essentials <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2.5l3 3 3-3" stroke="currentColor" fill="none"/></svg></span></div>
        </div>
        <div class="ai-ctrlbar ps-options" data-hl="options-bar"></div>
        <div class="ai-main">
          <div class="ai-toolbar" data-hl="toolbar"></div>
          <div class="ai-doc">
            <div class="ai-tabs"><div class="ai-tab active"><span class="ps-tab-name">photo.psd</span> <span class="ai-tab-zoom">@ 100% (RGB/8)</span><span class="ai-tab-x">×</span></div></div>
            <div class="ai-stage">
              <div class="ai-ruler-corner"></div>
              <canvas class="ai-ruler ai-ruler-h"></canvas>
              <canvas class="ai-ruler ai-ruler-v"></canvas>
              <div class="ai-canvas-wrap" data-hl="canvas">
                <canvas class="ps-view"></canvas>
                <canvas class="ps-ov"></canvas>
                <div class="ai-textedit" contenteditable="true" spellcheck="false" hidden></div>
                <div class="ai-toast" hidden></div>
              </div>
            </div>
            <div class="ai-status"></div>
          </div>
          <div class="ai-dock ps-dock" data-hl="panels">
            <div class="ai-dockgroup ps-dock-a">
              <div class="ai-dtabs"><button data-tab="color" data-hl="tab-color">Color</button><button data-tab="swatches" data-hl="tab-swatches">Swatches</button></div>
              <div class="ai-dbody ps-body-a"></div>
            </div>
            <div class="ai-dockgroup ps-dock-b">
              <div class="ai-dtabs"><button data-tab="properties" data-hl="tab-properties">Properties</button><button data-tab="adjustments" data-hl="tab-adjustments">Adjustments</button></div>
              <div class="ai-dbody ps-body-b"></div>
            </div>
            <div class="ai-dockgroup ps-dock-c">
              <div class="ai-dtabs"><button data-tab="layers" data-hl="tab-layers">Layers</button><button data-tab="history" data-hl="tab-history">History</button></div>
              <div class="ai-dbody ps-body-c"></div>
            </div>
          </div>
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
        menus: q('.ai-menus'), opts: q('.ps-options'), toolbar: q('.ai-toolbar'), stage: q('.ai-stage'), wrap: q('.ai-canvas-wrap'),
        view: q('.ps-view'), ov: q('.ps-ov'), rh: q('.ai-ruler-h'), rv: q('.ai-ruler-v'), status: q('.ai-status'), tabZoom: q('.ai-tab-zoom'),
        tabName: q('.ps-tab-name'), dock: q('.ps-dock'), bodyA: q('.ps-body-a'), bodyB: q('.ps-body-b'), bodyC: q('.ps-body-c'),
        dropdown: q('.ai-dropdown'), tooltip: q('.ai-tooltip'), pop: q('.ai-pop'), dialog: q('.ai-dialog-wrap'), textedit: q('.ai-textedit'),
        toast: q('.ai-toast'), file: q('.ps-file'),
      };
      this.$.svg = this.$.view; // compatibility with the lesson coach
      this.$.menus.innerHTML = ['File', 'Edit', 'Image', 'Layer', 'Select', 'Filter', 'View', 'Window', 'Help'].map((n) => `<div class="ai-menu" data-m="${n}" data-hl="menu-${n.toLowerCase()}">${n}</div>`).join('');
      this.buildToolbar();
    }
    buildToolbar() {
      let html = '<div class="ai-tools">';
      TOOL_GROUPS.forEach((g, gi) => {
        const shown = g.length > 1 ? this.groupShown[g[0]] : g[0];
        html += `<button class="ai-tool${g.length > 1 ? ' has-fly' : ''}" data-tool="${shown}" data-group="${gi}" data-hl="tool-${shown}" aria-label="${TOOLS[shown].name}">${svgIcon(shown)}</button>`;
        if (gi === 0 || gi === 5 || gi === 11) html += '<div class="ai-tool-sep"></div>';
      });
      html += `</div><div class="ps-colors" data-hl="colors">
          <button class="ps-sw ps-bg" data-hl="bg-color" title="Background color"></button>
          <button class="ps-sw ps-fg" data-hl="fg-color" title="Foreground color"></button>
          <button class="ps-swap" title="Swap colors (X)">⇄</button>
          <button class="ps-def" title="Default colors (D)"><span></span><span></span></button>
          <input type="color" class="ps-pick" tabindex="-1" aria-hidden="true">
        </div>`;
      this.$.toolbar.innerHTML = html;
    }

    /* -------------------------------------------------------------- bind */
    bind() {
      const $ = this.$;
      $.toolbar.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('.ai-tool');
        if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { clearTimeout(this._flyT); this._flyT = setTimeout(() => this.openFlyout(b, +b.dataset.group), 380); }
      });
      ['pointerup', 'pointerleave'].forEach((n) => $.toolbar.addEventListener(n, () => clearTimeout(this._flyT)));
      $.toolbar.addEventListener('contextmenu', (e) => { const b = e.target.closest('.ai-tool'); if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { e.preventDefault(); this.openFlyout(b, +b.dataset.group); } });
      $.toolbar.addEventListener('click', (e) => {
        const b = e.target.closest('.ai-tool');
        if (b) { if (!this._flyOpen) this.setTool(b.dataset.tool); return; }
        if (e.target.closest('.ps-fg')) return this.pickColor('fg');
        if (e.target.closest('.ps-bg')) return this.pickColor('bg');
        if (e.target.closest('.ps-swap')) return this.swapColors();
        if (e.target.closest('.ps-def')) return this.defaultColors();
      });
      $.toolbar.addEventListener('pointerover', (e) => {
        const b = e.target.closest('.ai-tool');
        if (!b) return this.hideTip();
        const t = TOOLS[b.dataset.tool];
        this.showTip(b, `<b>${t.name}</b>${t.key ? ` <kbd>${t.key}</kbd>` : ''}<div>${t.tip}</div>${TOOL_GROUPS[+b.dataset.group].length > 1 ? '<em>Hold the mouse down to see hidden tools</em>' : ''}`);
      });
      $.toolbar.addEventListener('pointerout', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ai-tool')) this.hideTip(); });
      const pick = $.toolbar.querySelector('.ps-pick');
      pick.addEventListener('input', () => { this.setColor(this._pickSlot, pick.value.toUpperCase(), true); });
      pick.addEventListener('change', () => { this.setColor(this._pickSlot, pick.value.toUpperCase()); });

      $.menus.addEventListener('click', (e) => { const m = e.target.closest('.ai-menu'); if (!m) return; if (this._openMenu === m.dataset.m) this.closeMenu(); else this.openMenu(m); });
      $.menus.addEventListener('pointerover', (e) => { const m = e.target.closest('.ai-menu'); if (m && this._openMenu && this._openMenu !== m.dataset.m) this.openMenu(m); });
      $.dropdown.addEventListener('click', (e) => {
        const it = e.target.closest('.ai-mi');
        if (!it || it.classList.contains('disabled') || it.classList.contains('has-sub')) return;
        const fn = this._menuFns[it.dataset.i];
        this.closeMenu();
        if (fn) { fn(); this.act('menu', { item: it.dataset.l }); }
      });
      $.dock.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) this.showTab(t.dataset.tab); });

      const cv = $.ov;
      cv.addEventListener('pointerdown', (e) => this.onDown(e));
      cv.addEventListener('pointermove', (e) => this.onMove(e));
      cv.addEventListener('pointerup', (e) => this.onUp(e));
      cv.addEventListener('pointercancel', (e) => this.onUp(e));
      cv.addEventListener('pointerleave', () => { this.mouse = null; this.drawOverlay(); this.renderRulers(); });
      cv.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      cv.addEventListener('dblclick', (e) => { if (this.tool === 'move') { const l = this.activeLayer(); if (l && l.kind === 'text') { this.setTool('type', true); this.startTextEdit(l); } } });

      $.textedit.addEventListener('input', () => { const l = this.layerById(this.editingText); if (l) { l.text = $.textedit.innerText.replace(/\n$/, ''); this.renderText(l); this.requestRender(); } });
      $.textedit.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); this.endTextEdit(); } });
      $.textedit.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });

      $.file.addEventListener('change', () => {
        const f = $.file.files && $.file.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { const img = new Image(); img.onload = () => this.openImage(img, f.name, this._fileMode); img.src = rd.result; };
        rd.readAsDataURL(f);
        $.file.value = '';
      });

      this._onKey = (e) => this.onKey(e);
      this._onKeyUp = (e) => { if (e.key === ' ') { this.spaceHand = false; this.updateCursor(); } this.altDown = e.altKey; this.updateCursor(); };
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('keyup', this._onKeyUp);
      document.addEventListener('pointerdown', (e) => {
        if (!this.root.contains(e.target)) { this.closeMenu(); this.closeFlyout(); this.closePop(); return; }
        if (!e.target.closest('.ai-menu') && !e.target.closest('.ai-dropdown')) this.closeMenu();
        if (!e.target.closest('.ai-flyout')) this.closeFlyout();
        if (!e.target.closest('.ai-pop') && !e.target.closest('[data-pop]')) this.closePop();
        if (this.editingText && !e.target.closest('.ai-textedit') && !e.target.closest('.ps-options') && !e.target.closest('.ai-dock')) this.endTextEdit();
      }, true);
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe($.stage);
    }

    /* -------------------------------------------------------------- model */
    layerById(id) { return this.layers.find((l) => l.id === id); }
    activeLayer() { return this.layerById(this.activeId) || this.layers[this.layers.length - 1]; }
    get objs() { return this.layers.filter((l) => !l.bg); } // for the platform's "is it empty?" checks
    newPixelLayer(name, w, h, x = 0, y = 0) {
      return { id: uid(), name, kind: 'pixel', canvas: mkCanvas(w || this.doc.w, h || this.doc.h), x, y, visible: true, opacity: 1, blend: 'normal', fx: {} };
    }
    /** reset the document. opts: {w,h,photo,bgColor,layers:[{photo|text|fill,...}],fg,bg,tool,name} */
    reset(opts = {}) {
      this.endTextEdit(true);
      this.cancelTransform(true);
      this.crop = null;
      const ps = opts.photo ? this.photoSize(opts.photo) : null;
      this.doc = { w: opts.w || (ps && ps.w) || 1000, h: opts.h || (ps && ps.h) || 700 };
      this.layers = [];
      const bgL = this.newPixelLayer('Background');
      bgL.bg = true;
      const g = bgL.canvas.getContext('2d');
      g.fillStyle = opts.bgColor || '#FFFFFF'; g.fillRect(0, 0, this.doc.w, this.doc.h);
      if (opts.photo) this.withPhoto(opts.photo, (img) => { g.drawImage(img, 0, 0, this.doc.w, this.doc.h); this.photoLoaded(); });
      this.layers.push(bgL);
      (opts.layers || []).forEach((d) => this.addLayerFromDef(d));
      this.activeId = (this.layers[opts.active != null ? opts.active : this.layers.length - 1] || bgL).id;
      this.maskCanvas = null; this.segs = []; this._maskData = null;
      this.fg = opts.fg || '#000000'; this.bg = opts.bgc || '#FFFFFF';
      this.$.tabName.textContent = (opts.name || 'photo') + '.psd';
      this.tabs = { a: 'color', b: 'properties', c: 'layers' };
      this.hist = []; this.hi = -1;
      this.clearLog();
      this.setTool(opts.tool || 'move', true);
      this.commit('Open', true);
      this.fit();
      this.renderAll();
    }
    addLayerFromDef(d) {
      let l;
      if (d.photo) {
        const s = this.photoSize(d.photo), sc = d.scale || 1;
        l = this.newPixelLayer(d.name || 'Layer ' + this.layers.length, s.w * sc, s.h * sc, d.x || 0, d.y || 0);
        this.withPhoto(d.photo, (img) => { l.canvas.getContext('2d').drawImage(img, 0, 0, l.canvas.width, l.canvas.height); l._bounds = null; this.photoLoaded(); });
      } else if (d.text != null) {
        l = { id: uid(), name: d.text.slice(0, 24), kind: 'text', text: d.text, font: d.font || 'Poppins', size: d.size || 72, weight: d.weight || 700, color: d.color || '#FFFFFF', align: d.align || 'left', x: d.x || 0, y: d.y || 0, visible: true, opacity: 1, blend: 'normal', fx: d.fx || {} };
        this.renderText(l);
      } else {
        l = this.newPixelLayer(d.name || 'Layer ' + this.layers.length, d.w, d.h, d.x || 0, d.y || 0);
        if (d.fill) { const g = l.canvas.getContext('2d'); g.fillStyle = d.fill; if (d.ellipse) { g.beginPath(); g.ellipse(l.canvas.width / 2, l.canvas.height / 2, l.canvas.width / 2, l.canvas.height / 2, 0, 0, 7); g.fill(); } else g.fillRect(0, 0, l.canvas.width, l.canvas.height); }
      }
      Object.assign(l, { opacity: d.opacity != null ? d.opacity : 1, blend: d.blend || 'normal', visible: d.visible !== false });
      if (d.fx) l.fx = { ...d.fx };
      this.layers.push(l);
      return l;
    }
    openImage(img, name, mode) {
      if (mode === 'place') {
        const sc = Math.min(1, (this.doc.w * 0.8) / img.width, (this.doc.h * 0.8) / img.height);
        const l = this.newPixelLayer((name || 'Photo').replace(/\.[^.]+$/, ''), img.width * sc, img.height * sc, (this.doc.w - img.width * sc) / 2, (this.doc.h - img.height * sc) / 2);
        l.canvas.getContext('2d').drawImage(img, 0, 0, l.canvas.width, l.canvas.height);
        this.layers.push(l); this.activeId = l.id;
        this.commit('Place'); this.renderAll();
        this.act('place');
        return;
      }
      const sc = Math.min(1, 1600 / Math.max(img.width, img.height));
      const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
      this.reset({ w, h, name: (name || 'photo').replace(/\.[^.]+$/, '') });
      this.layers[0].canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      this.hist = []; this.hi = -1; this.commit('Open');
      this.renderAll();
      this.act('open');
    }

    /* ----------------------------------------------------------- history */
    snapshot() {
      return { w: this.doc.w, h: this.doc.h, active: this.activeId, mask: this.maskCanvas, layers: this.layers.map((l) => ({ ...l, fx: { ...l.fx } })) };
    }
    commit(name, silent) {
      this.hist = this.hist.slice(0, this.hi + 1);
      this.layers.forEach((l) => { l.frozen = true; });
      this.hist.push({ name, s: this.snapshot() });
      if (this.hist.length > 40) this.hist.shift();
      this.hi = this.hist.length - 1;
      if (!silent) this.emit('change');
      this.renderHistory();
    }
    restore(i) {
      const st = this.hist[i];
      if (!st) return;
      this.hi = i;
      const s = st.s;
      this.doc = { w: s.w, h: s.h };
      this.layers = s.layers.map((l) => ({ ...l, fx: { ...l.fx }, frozen: true }));
      this.activeId = s.active;
      this.setMask(s.mask, true);
      this.crop = null;
      this.renderAll();
      this.emit('change');
    }
    undo() { if (this.editingText) this.endTextEdit(); if (this.xf) return this.cancelTransform(); if (this.hi <= 0) return this.toast('Nothing to undo'); this.restore(this.hi - 1); this.act('undo'); }
    redo() { if (this.hi >= this.hist.length - 1) return this.toast('Nothing to redo'); this.restore(this.hi + 1); this.act('redo'); }
    /** make a layer's pixels safe to modify (copy-on-write for history) */
    editable(l) {
      if (l.kind === 'text') { this.rasterize(l, true); }
      if (l.frozen) { l.canvas = cloneCanvas(l.canvas); l.frozen = false; }
      l._bounds = null; l._strokeFx = null;
      return l;
    }
    rasterize(l, silent) {
      if (l.kind !== 'text') return;
      l.kind = 'pixel';
      l.canvas = cloneCanvas(l.canvas);
      l.frozen = false;
      if (!silent) { this.commit('Rasterize Type'); this.renderAll(); }
      this.toast('Type layer was rasterized (turned into pixels)');
    }
    /** grow a layer canvas so it covers the given doc rect */
    ensureCovers(l, r) {
      const x1 = Math.min(l.x, r.x), y1 = Math.min(l.y, r.y);
      const x2 = Math.max(l.x + l.canvas.width, r.x + r.w), y2 = Math.max(l.y + l.canvas.height, r.y + r.h);
      if (x1 === l.x && y1 === l.y && x2 === l.x + l.canvas.width && y2 === l.y + l.canvas.height) return;
      const c = mkCanvas(x2 - x1, y2 - y1);
      c.getContext('2d').drawImage(l.canvas, l.x - x1, l.y - y1);
      l.canvas = c; l.x = x1; l.y = y1; l.frozen = false;
    }
    contentBounds(l) {
      if (l._bounds && l._boundsOf === l.canvas) return l._bounds;
      const c = l.canvas, w = c.width, h = c.height;
      let d;
      try { d = ctx2d(c).getImageData(0, 0, w, h).data; } catch (e) { return { x: l.x, y: l.y, w, h }; }
      let x1 = w, y1 = h, x2 = -1, y2 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
      const b = x2 < 0 ? null : { x: l.x + x1, y: l.y + y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
      l._bounds = b; l._boundsOf = c;
      return b;
    }

    /* ------------------------------------------------------------- text */
    renderText(l) {
      const lines = String(l.text || ' ').split('\n');
      const m = mkCanvas(1, 1).getContext('2d');
      const font = `${l.weight || 700} ${l.size}px ${fontStack(l.font)}`;
      m.font = font;
      const lw = lines.map((s) => m.measureText(s || ' ').width);
      const W = Math.ceil(Math.max(...lw, 4) + l.size * 0.3), lh = l.size * 1.22, H = Math.ceil(lh * lines.length + l.size * 0.3);
      const c = mkCanvas(W, H), g = c.getContext('2d');
      g.font = font; g.fillStyle = l.color; g.textBaseline = 'top';
      lines.forEach((s, i) => {
        const x = l.align === 'center' ? (W - lw[i]) / 2 : l.align === 'right' ? W - lw[i] - l.size * 0.15 : l.size * 0.15;
        g.fillText(s, x, i * lh + l.size * 0.12);
      });
      l.canvas = c; l.frozen = false; l._bounds = null; l._strokeFx = null;
      if (l.kind === 'text') l.name = (l.text || 'Text').split('\n')[0].slice(0, 24) || 'Text';
    }
    startTextEdit(l, isNew) {
      this.editingText = l.id; this.editingNew = !!isNew;
      const te = this.$.textedit, z = this.view.z;
      te.hidden = false; te.innerText = l.text;
      const s = this.toScr({ x: l.x, y: l.y });
      Object.assign(te.style, { left: s.x + l.size * 0.15 * z + 'px', top: s.y + l.size * 0.05 * z + 'px', fontSize: l.size * z + 'px', fontFamily: fontStack(l.font), fontWeight: l.weight, color: l.color, lineHeight: 1.22, textAlign: l.align || 'left' });
      te.style.caretColor = l.color;
      l._editing = true;
      this.requestRender();
      te.focus();
      setTimeout(() => { te.focus(); if (!isNew) { const r = document.createRange(); r.selectNodeContents(te); const sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r); } }, 0);
      this.act('textEditStart');
    }
    endTextEdit(silent) {
      if (!this.editingText) return;
      const l = this.layerById(this.editingText);
      this.editingText = null;
      this.$.textedit.hidden = true;
      if (l) {
        l._editing = false;
        l.text = this.$.textedit.innerText.replace(/\n$/, '');
        if (!l.text.trim()) { this.layers = this.layers.filter((x) => x !== l); this.activeId = (this.layers[this.layers.length - 1] || {}).id; }
        else this.renderText(l);
      }
      this.renderAll();
      if (!silent && l && l.text.trim()) { this.commit('Type Layer'); this.act('type', { text: l.text, isNew: this.editingNew }); }
    }

    /* ---------------------------------------------------------- selection */
    setMask(mc, silent) {
      this.maskCanvas = mc || null;
      this.segs = [];
      this._maskData = null;
      if (mc) {
        const w = mc.width, h = mc.height, d = ctx2d(mc).getImageData(0, 0, w, h).data;
        const A = new Uint8Array(w * h);
        let any = false;
        for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 127) { A[i] = 1; any = true; }
        if (!any) { this.maskCanvas = null; }
        else {
          this._maskData = A;
          const segs = [];
          for (let y = 0; y <= h; y++) {
            let run = -1;
            for (let x = 0; x <= w; x++) {
              const a = x < w && y < h ? A[y * w + x] : 0, b = x < w && y > 0 ? A[(y - 1) * w + x] : 0;
              const edge = x < w && a !== b;
              if (edge && run < 0) run = x;
              if (!edge && run >= 0) { segs.push([run, y, x, y]); run = -1; }
            }
          }
          for (let x = 0; x <= w; x++) {
            let run = -1;
            for (let y = 0; y <= h; y++) {
              const a = y < h && x < w ? A[y * w + x] : 0, b = y < h && x > 0 ? A[y * w + x - 1] : 0;
              const edge = y < h && a !== b;
              if (edge && run < 0) run = y;
              if (!edge && run >= 0) { segs.push([x, run, x, y]); run = -1; }
            }
          }
          this.segs = segs;
        }
      }
      if (!silent) this.drawOverlay();
      this.renderOptions();
    }
    /** combine a new shape selection with the current one */
    applySelection(draw, mode, kind) {
      const w = this.doc.w, h = this.doc.h;
      const shape = mkCanvas(w, h), g = shape.getContext('2d');
      g.fillStyle = '#fff';
      draw(g);
      let out;
      if (mode === 'new' || !this.maskCanvas) out = mode === 'sub' ? null : shape;
      else {
        out = cloneCanvas(this.maskCanvas);
        const o = out.getContext('2d');
        o.globalCompositeOperation = mode === 'add' ? 'source-over' : mode === 'sub' ? 'destination-out' : 'destination-in';
        o.drawImage(shape, 0, 0);
      }
      this.setMask(out);
      this.commit(kind === 'wand' ? 'Magic Wand' : kind === 'lasso' ? 'Lasso' : kind === 'ellipse' ? 'Elliptical Marquee' : 'Rectangular Marquee');
      this.act('select', { kind, mode, has: !!this.maskCanvas });
    }
    selectAll() { this.applySelection((g) => g.fillRect(0, 0, this.doc.w, this.doc.h), 'new', 'all'); }
    deselect() { if (!this.maskCanvas) return; this.setMask(null); this.commit('Deselect'); this.act('deselect'); }
    invertSelection() {
      const w = this.doc.w, h = this.doc.h, c = mkCanvas(w, h), g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      if (this.maskCanvas) { g.globalCompositeOperation = 'destination-out'; g.drawImage(this.maskCanvas, 0, 0); }
      this.setMask(c); this.commit('Inverse'); this.act('invert');
    }
    selMode(e) { return e.shiftKey && e.altKey ? 'int' : e.shiftKey ? 'add' : e.altKey ? 'sub' : this.o.selMode; }
    magicWand(p, mode) {
      const w = this.doc.w, h = this.doc.h;
      let src;
      if (this.o.sampleAll) { this.compose(); src = this.comp; }
      else { const l = this.activeLayer(); src = mkCanvas(w, h); src.getContext('2d').drawImage(l.canvas, l.x, l.y); }
      const d = ctx2d(src).getImageData(0, 0, w, h).data;
      const sx = Math.floor(p.x), sy = Math.floor(p.y);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
      const i0 = (sy * w + sx) * 4, r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2], a0 = d[i0 + 3];
      const tol = this.o.tolerance;
      const like = (i) => Math.abs(d[i] - r0) <= tol && Math.abs(d[i + 1] - g0) <= tol && Math.abs(d[i + 2] - b0) <= tol && Math.abs(d[i + 3] - a0) <= tol;
      const mc = mkCanvas(w, h), mg = mc.getContext('2d'), id = mg.createImageData(w, h), o = id.data;
      if (this.o.contiguous) {
        const seen = new Uint8Array(w * h), stack = [sy * w + sx];
        seen[sy * w + sx] = 1;
        while (stack.length) {
          const k = stack.pop();
          o[k * 4] = o[k * 4 + 1] = o[k * 4 + 2] = o[k * 4 + 3] = 255;
          const x = k % w, y = (k / w) | 0;
          const nb = [x > 0 ? k - 1 : -1, x < w - 1 ? k + 1 : -1, y > 0 ? k - w : -1, y < h - 1 ? k + w : -1];
          for (const n of nb) if (n >= 0 && !seen[n]) { seen[n] = 1; if (like(n * 4)) stack.push(n); }
        }
      } else {
        for (let k = 0; k < w * h; k++) if (like(k * 4)) o[k * 4] = o[k * 4 + 1] = o[k * 4 + 2] = o[k * 4 + 3] = 255;
      }
      mg.putImageData(id, 0, 0);
      this.applySelection((g) => g.drawImage(mc, 0, 0), mode, 'wand');
    }
    /** clip a canvas (in layer coords) to the selection */
    clipToSelection(c, l) {
      if (!this.maskCanvas) return c;
      const g = c.getContext('2d');
      g.save(); g.globalCompositeOperation = 'destination-in'; g.drawImage(this.maskCanvas, -l.x, -l.y); g.restore();
      return c;
    }

    /* --------------------------------------------------- layer commands */
    selectLayer(id, silent) { if (!this.layerById(id)) return; this.activeId = id; this.renderAll(); if (!silent) this.act('layerSelect', { id, lname: this.layerById(id).name }); }
    addLayer() {
      const l = this.newPixelLayer('Layer ' + this.layers.length);
      const i = this.layers.indexOf(this.activeLayer());
      this.layers.splice(i + 1, 0, l); this.activeId = l.id;
      this.commit('New Layer'); this.renderAll(); this.act('layerNew');
    }
    deleteLayer() {
      const l = this.activeLayer();
      if (!l || this.layers.length < 2) return this.toast('You need at least one layer');
      const i = this.layers.indexOf(l);
      this.layers.splice(i, 1);
      this.activeId = (this.layers[Math.max(0, i - 1)] || this.layers[0]).id;
      this.commit('Delete Layer'); this.renderAll(); this.act('layerDelete');
    }
    duplicateLayer() {
      const l = this.activeLayer();
      const sel = this.maskCanvas && l.kind === 'pixel';
      let n;
      if (sel) {
        const c = cloneCanvas(l.canvas);
        this.clipToSelection(c, l);
        n = { ...l, id: uid(), name: 'Layer ' + this.layers.length, canvas: c, bg: false, frozen: false, fx: {} };
      } else n = { ...l, id: uid(), name: l.name + ' copy', canvas: cloneCanvas(l.canvas), bg: false, frozen: false, fx: { ...l.fx } };
      this.layers.splice(this.layers.indexOf(l) + 1, 0, n);
      this.activeId = n.id;
      this.commit(sel ? 'Layer Via Copy' : 'Duplicate Layer'); this.renderAll();
      this.act('layerDup', { viaCopy: sel });
    }
    moveLayerOrder(dir) {
      const l = this.activeLayer(), i = this.layers.indexOf(l);
      let j = dir === 'up' ? i + 1 : dir === 'down' ? i - 1 : dir === 'top' ? this.layers.length - 1 : this.layers.findIndex((x) => !x.bg);
      if (l.bg) return this.toast('The Background layer is locked. Double-click it in Layers to unlock it.');
      j = clamp(j, 0, this.layers.length - 1);
      if (this.layers[j] && this.layers[j].bg) return this.toast('Layers cannot go below the locked Background');
      if (j === i) return;
      this.layers.splice(i, 1); this.layers.splice(j, 0, l);
      this.commit('Arrange'); this.renderAll(); this.act('layerOrder', { dir });
    }
    reorderTo(id, targetIdx) {
      const l = this.layerById(id);
      if (!l || l.bg) return;
      const i = this.layers.indexOf(l);
      this.layers.splice(i, 1);
      let j = clamp(targetIdx > i ? targetIdx - 1 : targetIdx, 0, this.layers.length);
      if (this.layers[0] && this.layers[0].bg && j === 0) j = 1;
      this.layers.splice(j, 0, l);
      this.commit('Arrange'); this.renderAll(); this.act('layerOrder', { drag: true });
    }
    unlockBackground() {
      const l = this.layers.find((x) => x.bg);
      if (!l) return;
      l.bg = false; l.name = 'Layer 0';
      this.commit('Convert to Layer'); this.renderAll(); this.act('unlockBg');
    }
    setLayerProp(k, v, opts = {}) {
      const l = this.activeLayer();
      if (!l) return;
      if (l.bg && (k === 'opacity' || k === 'blend')) return this.toast('The Background is locked. Double-click it in Layers to unlock it.');
      l[k] = v;
      this.dirtyAll();
      if (!opts.noCommit) { this.commit(k === 'opacity' ? 'Opacity Change' : k === 'blend' ? 'Blending Change' : 'Layer Properties'); this.renderPanels(); this.act(k === 'opacity' ? 'layerOpacity' : k === 'blend' ? 'layerBlend' : 'layerProp', { k, v }); }
    }
    toggleVisible(id) {
      const l = this.layerById(id);
      l.visible = !l.visible;
      this.commit(l.visible ? 'Show Layer' : 'Hide Layer'); this.renderAll();
      this.act('layerVis', { visible: l.visible, lname: l.name });
    }
    renameLayer(id, name) { const l = this.layerById(id); if (!l || !name) return; l.name = name.slice(0, 40); this.commit('Rename Layer'); this.renderAll(); this.act('layerRename', { name }); }
    toggleFx(kind) {
      const l = this.activeLayer();
      if (!l || l.bg) return this.toast('Layer styles cannot go on the locked Background. Unlock it first!');
      const on = !l.fx[kind];
      l.fx = { ...l.fx, [kind]: on };
      if (kind === 'stroke' && on) l.fx.strokeColor = l.fx.strokeColor || (l.kind === 'text' && /^#0{6}$/i.test(l.color) ? '#FFFFFF' : '#000000');
      l._strokeFx = null;
      this.commit(on ? (kind === 'shadow' ? 'Drop Shadow' : 'Stroke') : 'Clear Layer Style'); this.renderAll();
      this.act('fx', { kind, on });
    }
    mergeDown() {
      const l = this.activeLayer(), i = this.layers.indexOf(l);
      if (i <= 0) return this.toast('There is no layer below to merge into');
      const below = this.layers[i - 1];
      this.editable(below);
      const r = { x: Math.min(below.x, l.x), y: Math.min(below.y, l.y), w: 0, h: 0 };
      r.w = Math.max(below.x + below.canvas.width, l.x + l.canvas.width) - r.x; r.h = Math.max(below.y + below.canvas.height, l.y + l.canvas.height) - r.y;
      this.ensureCovers(below, r);
      const g = below.canvas.getContext('2d');
      this.drawLayer(g, l, -below.x, -below.y);
      this.layers.splice(i, 1); this.activeId = below.id;
      this.commit('Merge Down'); this.renderAll(); this.act('merge');
    }
    flatten() {
      this.compose();
      const l = this.newPixelLayer('Background');
      l.bg = true;
      const g = l.canvas.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, this.doc.w, this.doc.h); g.drawImage(this.comp, 0, 0);
      this.layers = [l]; this.activeId = l.id;
      this.commit('Flatten Image'); this.renderAll(); this.act('flatten');
    }
    flip(axis) {
      const l = this.activeLayer();
      if (l.kind === 'text') this.rasterize(l, true);
      this.editable(l);
      const c = mkCanvas(l.canvas.width, l.canvas.height), g = c.getContext('2d');
      g.translate(axis === 'x' ? c.width : 0, axis === 'y' ? c.height : 0); g.scale(axis === 'x' ? -1 : 1, axis === 'y' ? -1 : 1);
      g.drawImage(l.canvas, 0, 0);
      l.canvas = c;
      if (!l.bg) { if (axis === 'x') l.x = this.doc.w - l.x - c.width; else l.y = this.doc.h - l.y - c.height; }
      this.commit(axis === 'x' ? 'Flip Horizontal' : 'Flip Vertical'); this.renderAll(); this.act('flip', { axis });
    }

    /* ------------------------------------------------------ pixel commands */
    fillSelection(color, how = 'edit') {
      const l = this.activeLayer();
      if (!l) return;
      this.editable(l);
      this.ensureCovers(l, { x: 0, y: 0, w: this.doc.w, h: this.doc.h });
      const c = mkCanvas(l.canvas.width, l.canvas.height), g = c.getContext('2d');
      g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
      this.clipToSelection(c, l);
      l.canvas.getContext('2d').drawImage(c, 0, 0);
      this.commit('Fill'); this.renderAll(); this.act('fill', { how, color });
    }
    clearSelection() {
      const l = this.activeLayer();
      if (!this.maskCanvas) return this.toast('Make a selection first, then press Delete to remove those pixels');
      if (l.bg) return this.fillSelection(this.bg, 'clear');
      this.editable(l);
      const g = l.canvas.getContext('2d');
      g.save(); g.globalCompositeOperation = 'destination-out'; g.drawImage(this.maskCanvas, -l.x, -l.y); g.restore();
      this.commit('Clear'); this.renderAll(); this.act('delete');
    }
    copy(cut) {
      const l = this.activeLayer();
      const c = cloneCanvas(l.canvas);
      this.clipToSelection(c, l);
      this.clip = { canvas: c, x: l.x, y: l.y };
      if (cut) this.clearSelection();
      this.toast(cut ? 'Cut' : 'Copied');
      this.act(cut ? 'cut' : 'copy');
    }
    paste() {
      if (!this.clip) return;
      const l = { ...this.newPixelLayer('Layer ' + this.layers.length, 1, 1), canvas: cloneCanvas(this.clip.canvas), x: this.clip.x, y: this.clip.y };
      this.layers.splice(this.layers.indexOf(this.activeLayer()) + 1, 0, l); this.activeId = l.id;
      this.commit('Paste'); this.renderAll(); this.act('paste');
    }
    /** run an adjustment/filter on the active layer (inside the selection if there is one) */
    applyAdjust(kind, p, preview) {
      const l = this.activeLayer();
      if (!l) return;
      if (l.kind === 'text' && !preview) this.rasterize(l, true);
      const src = preview ? this._adjOrig : (this._adjOrig || l.canvas);
      const w = src.width, h = src.height;
      const id = ctx2d(src).getImageData(0, 0, w, h);
      const res = adjustData(id, kind, p);
      if (this.maskCanvas) {
        const m = mkCanvas(w, h), mg = ctx2d(m);
        mg.drawImage(this.maskCanvas, -l.x, -l.y);
        const md = mg.getImageData(0, 0, w, h).data, s = id.data;
        for (let i = 0; i < res.length; i += 4) { const a = md[i + 3] / 255; if (a < 1) for (let c = 0; c < 4; c++) res[i + c] = s[i + c] + (res[i + c] - s[i + c]) * a; }
      }
      const out = mkCanvas(w, h);
      out.getContext('2d').putImageData(new ImageData(res, w, h), 0, 0);
      if (preview) { this._adjPreview = { id: l.id, canvas: out }; this.dirtyAll(); return; }
      l.canvas = out; l.frozen = false; l._bounds = null; l._strokeFx = null;
      this._adjOrig = null; this._adjPreview = null;
      const names = { bc: 'Brightness/Contrast', hsl: 'Hue/Saturation', bw: 'Black & White', invert: 'Invert', blur: 'Gaussian Blur', sharpen: 'Sharpen', mosaic: 'Mosaic', noise: 'Add Noise', warm: 'Photo Filter' };
      this.commit(names[kind] || 'Adjustment'); this.renderAll();
      this.act(['blur', 'sharpen', 'mosaic', 'noise'].includes(kind) ? 'filter' : 'adjust', { kind, p, sel: !!this.maskCanvas });
    }
    adjustDialog(kind) {
      const l = this.activeLayer();
      if (!l) return;
      if (l.kind === 'text') return this.toast('Adjustments work on pixels. Select a photo layer in the Layers panel.');
      const defs = {
        bc: ['Brightness/Contrast', [['brightness', 'Brightness', -150, 150, 0], ['contrast', 'Contrast', -50, 100, 0]]],
        hsl: ['Hue/Saturation', [['hue', 'Hue', -180, 180, 0], ['sat', 'Saturation', -100, 100, 0], ['light', 'Lightness', -100, 100, 0]]],
        blur: ['Gaussian Blur', [['radius', 'Radius (px)', 1, 40, 6]]],
        mosaic: ['Mosaic', [['size', 'Cell Size', 2, 60, 14]]],
        noise: ['Add Noise', [['amount', 'Amount (%)', 1, 100, 20]]],
        warm: ['Photo Filter (Warm)', [['amount', 'Density', -100, 100, 35]]],
      };
      if (!defs[kind]) return this.applyAdjust(kind, {});
      const [title, fields] = defs[kind];
      this._adjOrig = l.canvas;
      const d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog ps-adj" role="dialog" aria-label="${title}"><div class="ai-dialog-title">${title}</div><div class="ai-dialog-body">
        ${fields.map(([k, n, mn, mx, v]) => `<div class="ps-slider"><div><span>${n}</span><input type="number" min="${mn}" max="${mx}" value="${v}" data-n="${k}"></div><input type="range" min="${mn}" max="${mx}" value="${v}" data-k="${k}" class="ps-range-${k}"></div>`).join('')}
        <label class="ps-prev"><input type="checkbox" checked data-prev> Preview</label></div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">OK</button></div></div>`;
      const vals = () => { const p = {}; fields.forEach(([k]) => { p[k] = parseFloat(d.querySelector(`[data-k="${k}"]`).value); }); return p; };
      let t;
      const preview = () => { clearTimeout(t); t = setTimeout(() => { const pv = d.querySelector('[data-prev]'); if (!pv || !this._adjOrig) return; if (pv.checked) this.applyAdjust(kind, vals(), true); else { this._adjPreview = null; this.dirtyAll(); } }, 30); };
      d.querySelectorAll('[data-k]').forEach((r) => r.addEventListener('input', () => { d.querySelector(`[data-n="${r.dataset.k}"]`).value = r.value; preview(); }));
      d.querySelectorAll('[data-n]').forEach((n) => { n.addEventListener('keydown', (e) => e.stopPropagation()); n.addEventListener('change', () => { d.querySelector(`[data-k="${n.dataset.n}"]`).value = n.value; preview(); }); });
      d.querySelector('[data-prev]').addEventListener('change', preview);
      const close = () => { clearTimeout(t); d.hidden = true; d.innerHTML = ''; this._adjPreview = null; this._adjOrig = null; this.dirtyAll(); };
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelector('[data-x=ok]').onclick = () => { clearTimeout(t); const p = vals(); this._adjPreview = null; d.hidden = true; d.innerHTML = ''; this.applyAdjust(kind, p); this._adjOrig = null; };
      preview();
      this.act('dialog', { title });
    }

    /* --------------------------------------------------- free transform */
    startTransform() {
      const l = this.activeLayer();
      if (!l) return;
      if (l.bg) return this.toast('The Background is locked. Double-click it in Layers to unlock it first.');
      const b = l.kind === 'text' ? { x: l.x, y: l.y, w: l.canvas.width, h: l.canvas.height } : this.contentBounds(l);
      if (!b) return this.toast('This layer is empty');
      if (this.tool === 'crop') this.setTool('move', true);
      this.xf = { id: l.id, b, cx: b.x + b.w / 2, cy: b.y + b.h / 2, sx: 1, sy: 1, rot: 0, tx: 0, ty: 0 };
      this.renderOptions(); this.requestRender();
      this.act('transformStart');
    }
    cancelTransform(silent) { if (!this.xf) return; this.xf = null; if (!silent) { this.renderOptions(); this.requestRender(); } }
    commitTransform() {
      const x = this.xf;
      if (!x) return;
      const l = this.layerById(x.id);
      this.xf = null;
      if (x.sx === 1 && x.sy === 1 && !x.rot && !x.tx && !x.ty) { this.renderAll(); return; }
      if (l.kind === 'text' && !x.rot) {
        const k = (Math.abs(x.sx) + Math.abs(x.sy)) / 2;
        const cx = x.cx + x.tx, cy = x.cy + x.ty;
        l.size = Math.max(4, l.size * k);
        this.renderText(l);
        l.x = cx - l.canvas.width / 2; l.y = cy - l.canvas.height / 2;
      } else {
        if (l.kind === 'text') this.rasterize(l, true);
        const pts = [[x.b.x, x.b.y], [x.b.x + x.b.w, x.b.y], [x.b.x + x.b.w, x.b.y + x.b.h], [x.b.x, x.b.y + x.b.h]].map(([px, py]) => this.xfPt(x, px, py));
        const minx = Math.floor(Math.min(...pts.map((p) => p.x))), miny = Math.floor(Math.min(...pts.map((p) => p.y)));
        const maxx = Math.ceil(Math.max(...pts.map((p) => p.x))), maxy = Math.ceil(Math.max(...pts.map((p) => p.y)));
        const c = mkCanvas(maxx - minx, maxy - miny), g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.translate(-minx, -miny);
        this.applyXf(g, x);
        g.drawImage(l.canvas, l.x, l.y);
        l.canvas = c; l.x = minx; l.y = miny; l.frozen = false; l._bounds = null; l._strokeFx = null;
      }
      this.commit('Free Transform'); this.renderAll();
      this.act('transform', { sx: x.sx, sy: x.sy, rot: x.rot });
    }
    applyXf(g, x) {
      g.translate(x.cx + x.tx, x.cy + x.ty);
      g.rotate((x.rot * Math.PI) / 180);
      g.scale(x.sx, x.sy);
      g.translate(-x.cx, -x.cy);
    }
    xfPt(x, px, py) {
      const a = (x.rot * Math.PI) / 180, dx = (px - x.cx) * x.sx, dy = (py - x.cy) * x.sy;
      return { x: x.cx + x.tx + dx * Math.cos(a) - dy * Math.sin(a), y: x.cy + x.ty + dx * Math.sin(a) + dy * Math.cos(a) };
    }
    xfCorners() {
      const x = this.xf, b = x.b;
      return [[b.x, b.y], [b.x + b.w / 2, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h / 2], [b.x + b.w, b.y + b.h], [b.x + b.w / 2, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y + b.h / 2]].map(([px, py]) => this.xfPt(x, px, py));
    }

    /* ---------------------------------------------------------------- crop */
    startCrop() {
      const w = this.doc.w, h = this.doc.h;
      this.crop = { x: 0, y: 0, w, h };
      this.applyRatio();
      this.requestRender();
    }
    applyRatio() {
      const c = this.crop;
      if (!c) return;
      const r = { '1:1': 1, '4:5': 4 / 5, '16:9': 16 / 9, '3:2': 3 / 2, '9:16': 9 / 16 }[this.o.ratio];
      if (!r) return;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      let w = c.w, h = w / r;
      if (h > c.h) { h = c.h; w = h * r; }
      w = Math.min(w, this.doc.w); h = Math.min(h, this.doc.h);
      c.w = w; c.h = h; c.x = clamp(cx - w / 2, 0, this.doc.w - w); c.y = clamp(cy - h / 2, 0, this.doc.h - h);
    }
    commitCrop() {
      const c = this.crop;
      if (!c) return;
      const r = { x: Math.round(c.x), y: Math.round(c.y), w: Math.max(1, Math.round(c.w)), h: Math.max(1, Math.round(c.h)) };
      this.crop = null;
      if (r.x === 0 && r.y === 0 && r.w === this.doc.w && r.h === this.doc.h) { this.setTool('move', true); return; }
      this.layers.forEach((l) => {
        if (l.bg) {
          const n = mkCanvas(r.w, r.h);
          n.getContext('2d').drawImage(l.canvas, -r.x, -r.y);
          l.canvas = n; l.frozen = false;
        } else { l.x -= r.x; l.y -= r.y; }
        l._bounds = null;
      });
      this.doc = { w: r.w, h: r.h };
      this.setMask(null, true);
      this.commit('Crop');
      this.setTool('move', true);
      this.fit();
      this.renderAll();
      this.act('crop', { w: r.w, h: r.h, ratio: this.o.ratio });
    }

    /* -------------------------------------------------------------- colors */
    setColor(slot, c, live) {
      this[slot] = c;
      const l = this.activeLayer();
      if (slot === 'fg' && l && l.kind === 'text' && this.tool === 'type' && !live) { l.color = c; this.renderText(l); this.commit('Text Color'); this.dirtyAll(); }
      this.renderColors();
      if (!live) { this.renderPanels(); this.act('color', { slot, c }); }
    }
    pickColor(slot) {
      this._pickSlot = slot;
      const p = this.$.toolbar.querySelector('.ps-pick');
      p.value = this[slot].toLowerCase();
      try { p.showPicker ? p.showPicker() : p.click(); } catch (e) { p.click(); }
      this.act('colorPick', { slot });
    }
    swapColors() { [this.fg, this.bg] = [this.bg, this.fg]; this.renderColors(); this.renderPanels(); this.act('swap'); }
    defaultColors() { this.fg = '#000000'; this.bg = '#FFFFFF'; this.renderColors(); this.renderPanels(); this.act('defaultColors'); }
    sampleColor(p) {
      this.compose();
      const x = clamp(Math.floor(p.x), 0, this.doc.w - 1), y = clamp(Math.floor(p.y), 0, this.doc.h - 1);
      const d = ctx2d(this.comp).getImageData(x, y, 1, 1).data;
      return d[3] < 10 ? null : rgbHex(d[0], d[1], d[2]);
    }

    /* --------------------------------------------------------------- view */
    resize() {
      const r = this.$.wrap.getBoundingClientRect();
      if (!r.width) return;
      this.W = r.width; this.H = r.height;
      [this.$.view, this.$.ov].forEach((c) => { c.width = r.width * DPR(); c.height = r.height * DPR(); c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; });
      if (!this._fitted) { this.fit(); this._fitted = true; }
      this.requestRender();
    }
    fit(user) {
      if (!this.W) return;
      const z = Math.min((this.W - 60) / this.doc.w, (this.H - 60) / this.doc.h);
      this.view.z = clamp(z, 0.02, 64);
      this.view.x = (this.W - this.doc.w * this.view.z) / 2;
      this.view.y = (this.H - this.doc.h * this.view.z) / 2;
      this.requestRender(true);
      if (user) this.act('zoom', { z: this.view.z, fit: true });
    }
    zoomTo(z, at) {
      at = at || { x: this.W / 2, y: this.H / 2 };
      const old = this.view.z;
      z = clamp(z, 0.02, 64);
      const dx = (at.x - this.view.x) / old, dy = (at.y - this.view.y) / old;
      this.view.z = z; this.view.x = at.x - dx * z; this.view.y = at.y - dy * z;
      this.requestRender(true);
      this.act('zoom', { z, dir: z > old ? 'in' : 'out' });
    }
    zoomBy(f, at) { this.zoomTo(this.view.z * f, at); }
    toScr(p) { return { x: p.x * this.view.z + this.view.x, y: p.y * this.view.z + this.view.y }; }
    toDoc(e) { const r = this.$.ov.getBoundingClientRect(); return { x: (e.clientX - r.left - this.view.x) / this.view.z, y: (e.clientY - r.top - this.view.y) / this.view.z }; }
    scrPt(e) { const r = this.$.ov.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    docToClient(p) { const r = this.$.ov.getBoundingClientRect(), s = this.toScr(p); return { x: r.left + s.x, y: r.top + s.y }; }

    /* ------------------------------------------------------------ render */
    dirtyAll() { this._dirty = true; this.requestRender(); }
    requestRender(viewOnly) {
      if (!viewOnly) this._dirty = true;
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        if (this._dirty) { this.compose(); this._dirty = false; }
        this.drawView(); this.drawOverlay(); this.renderRulers(); this.renderStatus();
      });
    }
    renderAll() { this.dirtyAll(); this.renderPanels(); this.renderOptions(); this.renderColors(); this.renderToolbarState(); this.emit('select'); }
    strokeFxCanvas(l) {
      const s = Math.max(1, Math.round(l.fx.strokeSize || 6)), col = l.fx.strokeColor || '#000000';
      const key = l.canvas.width + 'x' + l.canvas.height + col + s;
      if (l._strokeFx && l._strokeFx.src === l.canvas && l._strokeFx.key === key) return l._strokeFx.c;
      const tint = mkCanvas(l.canvas.width, l.canvas.height), tg = tint.getContext('2d');
      tg.fillStyle = col; tg.fillRect(0, 0, tint.width, tint.height);
      tg.globalCompositeOperation = 'destination-in'; tg.drawImage(l.canvas, 0, 0);
      const c = mkCanvas(tint.width + s * 2, tint.height + s * 2), g = c.getContext('2d');
      const n = Math.max(12, s * 3);
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.drawImage(tint, s + Math.cos(a) * s, s + Math.sin(a) * s); }
      for (let r = s - 1; r > 0; r -= 2) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.drawImage(tint, s + Math.cos(a) * r, s + Math.sin(a) * r); }
      l._strokeFx = { src: l.canvas, key, c };
      return c;
    }
    /** draw one layer (with styles) onto a context at an offset */
    drawLayer(g, l, ox = 0, oy = 0, srcOverride) {
      const src = srcOverride || l.canvas;
      g.save();
      g.globalAlpha = l.opacity;
      g.globalCompositeOperation = blendOp(l.blend);
      const shadow = () => { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 18; g.shadowOffsetX = 10; g.shadowOffsetY = 10; };
      if (l.fx && l.fx.stroke) {
        const sc = this.strokeFxCanvas(srcOverride ? { ...l, canvas: src, _strokeFx: null } : l), s = Math.round(l.fx.strokeSize || 6);
        if (l.fx.shadow) shadow();
        g.drawImage(sc, l.x + ox - s, l.y + oy - s);
        g.shadowColor = 'transparent';
        g.drawImage(src, l.x + ox, l.y + oy);
      } else {
        if (l.fx && l.fx.shadow) shadow();
        g.drawImage(src, l.x + ox, l.y + oy);
      }
      g.restore();
    }
    compose() {
      const { w, h } = this.doc;
      if (this.comp.width !== w || this.comp.height !== h) { this.comp.width = w; this.comp.height = h; }
      const g = this.comp.getContext('2d');
      g.clearRect(0, 0, w, h);
      this.layers.forEach((l) => {
        if (!l.visible || l._editing) return;
        let src = null;
        if (this._adjPreview && this._adjPreview.id === l.id) src = this._adjPreview.canvas;
        if (this.stroke && this.stroke.id === l.id) src = this.strokePreview(l);
        if (this.xf && this.xf.id === l.id) {
          g.save(); this.applyXf(g, this.xf); this.drawLayer(g, l, 0, 0, src); g.restore();
          return;
        }
        this.drawLayer(g, l, 0, 0, src);
      });
    }
    drawView() {
      if (!this.W) return;
      const c = this.$.view, g = c.getContext('2d'), d = DPR(), { z, x, y } = this.view, { w, h } = this.doc;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.fillStyle = '#232323'; g.fillRect(0, 0, this.W, this.H);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x + 3, y + 3, w * z, h * z);
      // checkerboard (transparency)
      if (!this._checker) {
        const p = mkCanvas(16, 16), pg = p.getContext('2d');
        pg.fillStyle = '#fff'; pg.fillRect(0, 0, 16, 16); pg.fillStyle = '#cdcdcd'; pg.fillRect(0, 0, 8, 8); pg.fillRect(8, 8, 8, 8);
        this._checker = g.createPattern(p, 'repeat');
      }
      g.save(); g.beginPath(); g.rect(x, y, w * z, h * z); g.clip();
      g.fillStyle = this._checker; g.fillRect(x, y, w * z, h * z);
      g.imageSmoothingEnabled = z < 2;
      g.imageSmoothingQuality = 'high';
      g.drawImage(this.comp, x, y, w * z, h * z);
      if (z >= 8) { // pixel grid
        g.strokeStyle = 'rgba(128,128,128,.35)'; g.lineWidth = 1; g.beginPath();
        const x0 = Math.max(0, Math.floor(-x / z)), x1 = Math.min(w, Math.ceil((this.W - x) / z)), y0 = Math.max(0, Math.floor(-y / z)), y1 = Math.min(h, Math.ceil((this.H - y) / z));
        for (let i = x0; i <= x1; i++) { const sx = Math.round(x + i * z) + 0.5; g.moveTo(sx, y + y0 * z); g.lineTo(sx, y + y1 * z); }
        for (let j = y0; j <= y1; j++) { const sy = Math.round(y + j * z) + 0.5; g.moveTo(x + x0 * z, sy); g.lineTo(x + x1 * z, sy); }
        g.stroke();
      }
      g.restore();
      this.$.tabZoom.textContent = `@ ${Math.round(z * 100)}% (${esc(this.activeLayer() ? this.activeLayer().name : 'Layer')}, RGB/8)`;
    }
    drawOverlay() {
      if (!this.W) return;
      const c = this.$.ov, g = c.getContext('2d'), d = DPR(), z = this.view.z;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, this.W, this.H);
      const S = (p) => this.toScr(p);
      // marching ants
      if (this.segs.length && !this.crop) {
        g.save(); g.lineWidth = 1;
        g.beginPath();
        this.segs.forEach(([x1, y1, x2, y2]) => { const a = S({ x: x1, y: y1 }), b = S({ x: x2, y: y2 }); g.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5); g.lineTo(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5); });
        g.strokeStyle = '#fff'; g.stroke();
        g.setLineDash([4, 4]); g.lineDashOffset = this.antPhase || 0; g.strokeStyle = '#000'; g.stroke();
        g.restore();
      }
      const dr = this.drag;
      // marquee / lasso previews
      if (dr && (dr.mode === 'marquee' || dr.mode === 'ellipse') && dr.cur) {
        const a = S(dr.s), b = S(dr.cur);
        g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#000'; g.lineWidth = 1; g.beginPath();
        if (dr.mode === 'ellipse') g.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, 7);
        else g.rect(Math.min(a.x, b.x) + 0.5, Math.min(a.y, b.y) + 0.5, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        g.stroke(); g.lineDashOffset = 4; g.strokeStyle = '#fff'; g.stroke(); g.restore();
        this.hintBox(`W: ${Math.round(Math.abs(dr.cur.x - dr.s.x))} px\nH: ${Math.round(Math.abs(dr.cur.y - dr.s.y))} px`);
      }
      if (dr && dr.mode === 'lasso' && dr.pts.length > 1) {
        g.save(); g.strokeStyle = '#000'; g.setLineDash([4, 4]); g.beginPath();
        dr.pts.forEach((p, i) => { const s = S(p); i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y); });
        g.stroke(); g.lineDashOffset = 4; g.strokeStyle = '#fff'; g.stroke(); g.restore();
      }
      if (dr && dr.mode === 'gradient' && dr.cur) {
        const a = S(dr.s), b = S(dr.cur);
        g.save(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.strokeStyle = '#000'; g.lineWidth = 1; g.stroke();
        [a, b].forEach((p, i) => { g.fillStyle = i ? this.bg : this.fg; g.strokeStyle = '#000'; g.fillRect(p.x - 5, p.y - 5, 10, 10); g.strokeRect(p.x - 5.5, p.y - 5.5, 11, 11); });
        g.restore();
      }
      // crop
      if (this.crop) {
        const cr = this.crop, a = S({ x: cr.x, y: cr.y }), b = S({ x: cr.x + cr.w, y: cr.y + cr.h }), o = S({ x: 0, y: 0 }), e = S({ x: this.doc.w, y: this.doc.h });
        g.save();
        g.fillStyle = 'rgba(0,0,0,.55)';
        g.beginPath(); g.rect(o.x, o.y, e.x - o.x, e.y - o.y); g.rect(a.x, a.y, b.x - a.x, b.y - a.y); g.fill('evenodd');
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(a.x + 0.5, a.y + 0.5, b.x - a.x, b.y - a.y);
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath();
        for (let i = 1; i < 3; i++) { const xx = a.x + ((b.x - a.x) * i) / 3, yy = a.y + ((b.y - a.y) * i) / 3; g.moveTo(xx, a.y); g.lineTo(xx, b.y); g.moveTo(a.x, yy); g.lineTo(b.x, yy); }
        g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 4;
        const L = 16;
        [[a.x, a.y, 1, 1], [b.x, a.y, -1, 1], [b.x, b.y, -1, -1], [a.x, b.y, 1, -1]].forEach(([px, py, sx, sy]) => { g.beginPath(); g.moveTo(px + sx * L, py); g.lineTo(px, py); g.lineTo(px, py + sy * L); g.stroke(); });
        [[(a.x + b.x) / 2, a.y, 'h'], [(a.x + b.x) / 2, b.y, 'h'], [a.x, (a.y + b.y) / 2, 'v'], [b.x, (a.y + b.y) / 2, 'v']].forEach(([px, py, o2]) => { g.beginPath(); if (o2 === 'h') { g.moveTo(px - 9, py); g.lineTo(px + 9, py); } else { g.moveTo(px, py - 9); g.lineTo(px, py + 9); } g.stroke(); });
        g.restore();
        this.hintBox(`${Math.round(cr.w)} × ${Math.round(cr.h)} px`, { x: b.x - 4, y: b.y + 8 });
      }
      // free transform
      if (this.xf) {
        const P = this.xfCorners().map(S);
        g.save(); g.strokeStyle = '#2d9cff'; g.lineWidth = 1; g.beginPath();
        [0, 2, 4, 6].forEach((i, k) => (k ? g.lineTo(P[i].x, P[i].y) : g.moveTo(P[i].x, P[i].y)));
        g.closePath(); g.stroke();
        P.forEach((p) => { g.fillStyle = '#fff'; g.fillRect(p.x - 4, p.y - 4, 8, 8); g.strokeRect(p.x - 4.5, p.y - 4.5, 9, 9); });
        const ct = S({ x: this.xf.cx + this.xf.tx, y: this.xf.cy + this.xf.ty });
        g.beginPath(); g.arc(ct.x, ct.y, 4, 0, 7); g.stroke();
        g.restore();
      }
      // brush cursor
      if (this.mouse && ['brush', 'eraser', 'clone', 'heal'].includes(this.tool) && !this.spaceHand) {
        const r = ((this.tool === 'heal' ? this.o.healSize : this.o.size) / 2) * z, m = this.mouseScr;
        g.save(); g.beginPath(); g.arc(m.x, m.y, Math.max(r, 1.5), 0, 7);
        g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 1; g.stroke();
        if (this.tool === 'clone' && this.cloneSrc) {
          const s = S(this.cloneOffset && this.drag ? { x: this.mouse.x + this.cloneOffset.x, y: this.mouse.y + this.cloneOffset.y } : this.cloneSrc);
          g.beginPath(); g.moveTo(s.x - 6, s.y); g.lineTo(s.x + 6, s.y); g.moveTo(s.x, s.y - 6); g.lineTo(s.x, s.y + 6); g.stroke();
        }
        g.restore();
      }
      if (this._hint) { this.drawHint(g, this._hint); this._hint = null; }
    }
    hintBox(text, at) { this._hint = { text, at: at || (this.mouseScr ? { x: this.mouseScr.x + 16, y: this.mouseScr.y + 14 } : { x: 10, y: 10 }) }; }
    drawHint(g, h) {
      const lines = h.text.split('\n');
      g.save(); g.font = '11px "Source Sans 3", sans-serif';
      const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 14;
      g.fillStyle = 'rgba(80,80,80,.92)'; g.fillRect(h.at.x, h.at.y, w, lines.length * 14 + 8);
      g.fillStyle = '#fff'; lines.forEach((l, i) => g.fillText(l, h.at.x + 7, h.at.y + 15 + i * 14));
      g.restore();
    }
    renderRulers() {
      if (!this.flags.rulers || !this.W) return;
      const dpr = DPR();
      const draw = (cv, horiz) => {
        const len = horiz ? this.W : this.H, th = 18;
        cv.width = (horiz ? len : th) * dpr; cv.height = (horiz ? th : len) * dpr;
        cv.style.width = (horiz ? len : th) + 'px'; cv.style.height = (horiz ? th : len) + 'px';
        const c = cv.getContext('2d');
        c.scale(dpr, dpr);
        c.fillStyle = '#323232'; c.fillRect(0, 0, horiz ? len : th, horiz ? th : len);
        c.strokeStyle = '#8a8a8a'; c.fillStyle = '#b8b8b8'; c.font = '9px "Source Sans 3", sans-serif';
        const z = this.view.z, off = horiz ? this.view.x : this.view.y;
        const step = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000].find((s) => s * z >= 60) || 2000;
        const start = Math.floor(-off / z / step) * step, end = (len - off) / z;
        c.beginPath();
        for (let v = start; v <= end; v += step / 10) {
          const p = Math.round(v * z + off) + 0.5, major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
          const t = major ? th : 4;
          if (horiz) { c.moveTo(p, th); c.lineTo(p, th - t); } else { c.moveTo(th, p); c.lineTo(th - t, p); }
          if (major) { const lbl = String(Math.round(v)); if (horiz) c.fillText(lbl, p + 3, 9); else { c.save(); c.translate(9, p + 3); c.rotate(-Math.PI / 2); c.fillText(lbl, -c.measureText(lbl).width - 3, 0); c.restore(); } }
        }
        c.stroke();
        if (this.mouseScr && this.mouse) { const mp = horiz ? this.mouseScr.x : this.mouseScr.y; c.strokeStyle = '#2d9cff'; c.beginPath(); if (horiz) { c.moveTo(mp + 0.5, 0); c.lineTo(mp + 0.5, th); } else { c.moveTo(0, mp + 0.5); c.lineTo(th, mp + 0.5); } c.stroke(); }
      };
      draw(this.$.rh, true); draw(this.$.rv, false);
    }
    renderStatus() {
      const z = Math.round(this.view.z * 100);
      const m = this.mouse ? `X: ${Math.round(this.mouse.x)}  Y: ${Math.round(this.mouse.y)}` : '';
      this.$.status.innerHTML = `<span class="ps-zoomv" data-hl="zoom-value">${z}%</span><span>${this.doc.w} px × ${this.doc.h} px (72 ppi)</span><span class="ai-st-tool">${TOOLS[this.tool].name.replace(' Tool', '')}</span><span class="ai-st-pos">${m}</span>`;
    }

    /* ---------------------------------------------------------- tools */
    setTool(t, silent) {
      if (!TOOLS[t]) return;
      if (this.editingText) this.endTextEdit();
      if (this.xf && t !== 'move') this.commitTransform();
      if (this.crop && t !== 'crop') { this.crop = null; }
      this.tool = t;
      TOOL_GROUPS.forEach((g) => { if (g.length > 1 && g.includes(t)) this.groupShown[g[0]] = t; });
      if (t === 'crop' && !this.crop) this.startCrop();
      this.closeFlyout();
      this.renderToolbarState(); this.renderOptions(); this.updateCursor(); this.requestRender(true); this.renderStatus();
      if (!silent) this.act('tool', { tool: t });
    }
    updateCursor() {
      const t = this.spaceHand ? 'hand' : this.tool;
      const map = { move: 'move', marquee: 'crosshair', ellipse: 'crosshair', lasso: 'crosshair', wand: 'crosshair', crop: 'crosshair', eyedropper: 'crosshair', heal: 'none', brush: 'none', clone: this.altDown ? 'copy' : 'none', eraser: 'none', gradient: 'crosshair', bucket: 'crosshair', type: 'text', hand: this.drag && this.drag.mode === 'pan' ? 'grabbing' : 'grab', zoom: this.altDown ? 'zoom-out' : 'zoom-in' };
      this.$.ov.style.cursor = map[t] || 'default';
    }
    openFlyout(btn, gi) {
      this.closeFlyout();
      const r = btn.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'ai-flyout'; f.dataset.hl = 'flyout';
      f.innerHTML = TOOL_GROUPS[gi].map((t) => `<button data-ft="${t}" data-hl="fly-${t}" class="${t === this.tool ? 'on' : ''}">${svgIcon(t, 18)}<span>${TOOLS[t].name}</span>${TOOLS[t].key ? `<kbd>${TOOLS[t].key}</kbd>` : ''}</button>`).join('');
      f.style.left = (r.right - rr.left + 2) + 'px'; f.style.top = (r.top - rr.top) + 'px';
      f.addEventListener('click', (e) => { const b = e.target.closest('[data-ft]'); if (b) { this.setTool(b.dataset.ft); this.act('flyout', { tool: b.dataset.ft }); } });
      this.root.appendChild(f);
      this._flyOpen = f; this.hideTip();
      this.act('flyoutOpen', { group: gi });
    }
    closeFlyout() { if (this._flyOpen) { this._flyOpen.remove(); setTimeout(() => { this._flyOpen = null; }, 0); } }
    closePop() { if (this.$.pop) this.$.pop.hidden = true; }

    /* -------------------------------------------------------- pointer */
    onDown(e) {
      this.closeMenu(); this.closePop();
      if (e.button === 1 || (e.button === 0 && (this.spaceHand || this.tool === 'hand'))) {
        this.drag = { mode: 'pan', s: this.scrPt(e), v: { ...this.view } };
        this.$.ov.setPointerCapture(e.pointerId); this.updateCursor();
        return;
      }
      if (e.button !== 0) return;
      this.$.ov.setPointerCapture(e.pointerId);
      this.root.focus({ preventScroll: true });
      const p = this.toDoc(e), mode = this.selMode(e);
      if (this.xf) return this.downTransform(p, e);
      const l = this.activeLayer();
      switch (this.tool) {
        case 'zoom': return this.zoomBy(e.altKey ? 0.5 : 2, this.scrPt(e));
        case 'move': {
          let tgt = l;
          if (this.o.autoSelect) {
            for (let i = this.layers.length - 1; i >= 0; i--) {
              const L = this.layers[i];
              if (!L.visible || L.bg) continue;
              const lx = Math.floor(p.x - L.x), ly = Math.floor(p.y - L.y);
              if (lx < 0 || ly < 0 || lx >= L.canvas.width || ly >= L.canvas.height) continue;
              if (ctx2d(L.canvas).getImageData(lx, ly, 1, 1).data[3] > 20) { tgt = L; break; }
            }
            if (tgt !== l) this.selectLayer(tgt.id, true);
          }
          if (tgt.bg) { this.toast('The Background layer is locked 🔒 — double-click it in the Layers panel to unlock it.'); this.act('moveLocked'); return; }
          this.drag = { mode: 'move', s: p, id: tgt.id, x0: tgt.x, y0: tgt.y };
          return;
        }
        case 'marquee': case 'ellipse':
          this.drag = { mode: this.tool, s: p, selMode: mode };
          return;
        case 'lasso': this.drag = { mode: 'lasso', pts: [p], selMode: mode }; return;
        case 'wand': return this.magicWand(p, mode);
        case 'crop': return this.downCrop(p);
        case 'eyedropper': {
          const c = this.sampleColor(p);
          if (c) { this.setColor(e.altKey ? 'bg' : 'fg', c); this.act('eyedropper', { c }); }
          return;
        }
        case 'brush': case 'eraser': case 'clone': case 'heal': return this.startStroke(p, e);
        case 'bucket': return this.bucketFill(p);
        case 'gradient': this.drag = { mode: 'gradient', s: p }; return;
        case 'type': {
          e.preventDefault();
          // click on an existing text layer → edit it
          for (let i = this.layers.length - 1; i >= 0; i--) {
            const L = this.layers[i];
            if (L.kind === 'text' && L.visible && p.x >= L.x && p.y >= L.y && p.x <= L.x + L.canvas.width && p.y <= L.y + L.canvas.height) { this.activeId = L.id; this.renderAll(); return this.startTextEdit(L); }
          }
          const t = { id: uid(), kind: 'text', text: '', font: this.o.font, size: this.o.fsize, weight: this.o.fweight, color: this.fg, align: 'left', x: p.x - this.o.fsize * 0.15, y: p.y - this.o.fsize * 0.9, visible: true, opacity: 1, blend: 'normal', fx: {}, name: 'Text' };
          this.renderText(t);
          this.layers.splice(this.layers.indexOf(l) + 1, 0, t);
          this.activeId = t.id;
          this.renderAll();
          return this.startTextEdit(t, true);
        }
      }
    }
    downTransform(p) {
      const P = this.xfCorners().map((q) => this.toScr(q)), sp = this.toScr(p);
      const hi = P.findIndex((q) => Math.hypot(q.x - sp.x, q.y - sp.y) < 9);
      const x = this.xf;
      if (hi >= 0) { this.drag = { mode: 'xfScale', h: hi, x0: { ...x } }; return; }
      // inside?
      const inside = this.pointInPoly(sp, [P[0], P[2], P[4], P[6]]);
      if (inside) { this.drag = { mode: 'xfMove', s: p, x0: { ...x } }; return; }
      const c = { x: x.cx + x.tx, y: x.cy + x.ty };
      this.drag = { mode: 'xfRotate', a0: Math.atan2(p.y - c.y, p.x - c.x), x0: { ...x } };
    }
    pointInPoly(p, poly) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    }
    downCrop(p) {
      const c = this.crop;
      if (!c) return this.startCrop();
      const sp = this.toScr(p), a = this.toScr({ x: c.x, y: c.y }), b = this.toScr({ x: c.x + c.w, y: c.y + c.h });
      const near = (v, t) => Math.abs(v - t) < 12;
      const hx = near(sp.x, a.x) ? -1 : near(sp.x, b.x) ? 1 : 0, hy = near(sp.y, a.y) ? -1 : near(sp.y, b.y) ? 1 : 0;
      const inX = sp.x > a.x - 12 && sp.x < b.x + 12, inY = sp.y > a.y - 12 && sp.y < b.y + 12;
      if ((hx || hy) && inX && inY) { this.drag = { mode: 'cropEdge', hx, hy, c0: { ...c } }; return; }
      if (sp.x > a.x && sp.x < b.x && sp.y > a.y && sp.y < b.y) { this.drag = { mode: 'cropMove', s: p, c0: { ...c } }; return; }
      this.drag = { mode: 'cropNew', s: p };
    }

    onMove(e) {
      const p = this.toDoc(e);
      this.mouse = p; this.mouseScr = this.scrPt(e);
      const d = this.drag;
      if (!d) {
        if (this.xf) {
          const P = this.xfCorners().map((q) => this.toScr(q)), sp = this.mouseScr;
          const hi = P.findIndex((q) => Math.hypot(q.x - sp.x, q.y - sp.y) < 9);
          this.$.ov.style.cursor = hi >= 0 ? (hi % 4 === 0 ? 'nwse-resize' : hi % 4 === 2 ? 'nesw-resize' : hi % 4 === 1 ? 'ns-resize' : 'ew-resize') : this.pointInPoly(sp, [P[0], P[2], P[4], P[6]]) ? 'move' : 'alias';
        }
        this.drawOverlay(); this.renderRulers(); this.renderStatus();
        return;
      }
      switch (d.mode) {
        case 'pan': { const s = this.scrPt(e); this.view.x = d.v.x + s.x - d.s.x; this.view.y = d.v.y + s.y - d.s.y; d.moved = true; this.requestRender(true); break; }
        case 'move': {
          const l = this.layerById(d.id);
          let dx = p.x - d.s.x, dy = p.y - d.s.y;
          if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
          l.x = Math.round(d.x0 + dx); l.y = Math.round(d.y0 + dy);
          d.moved = Math.hypot(dx, dy) > 1;
          this.dirtyAll();
          break;
        }
        case 'marquee': case 'ellipse': {
          let q = p;
          if (e.shiftKey && d.selMode !== 'add') { const m = Math.max(Math.abs(p.x - d.s.x), Math.abs(p.y - d.s.y)); q = { x: d.s.x + Math.sign(p.x - d.s.x || 1) * m, y: d.s.y + Math.sign(p.y - d.s.y || 1) * m }; }
          d.cur = q; this.drawOverlay(); break;
        }
        case 'lasso': d.pts.push(p); this.drawOverlay(); break;
        case 'gradient': d.cur = e.shiftKey ? this.snap45(d.s, p) : p; this.drawOverlay(); break;
        case 'stroke': this.continueStroke(p); break;
        case 'cropEdge': {
          const c = this.crop, c0 = d.c0;
          let x1 = c0.x, y1 = c0.y, x2 = c0.x + c0.w, y2 = c0.y + c0.h;
          if (d.hx < 0) x1 = clamp(p.x, 0, x2 - 4); if (d.hx > 0) x2 = clamp(p.x, x1 + 4, this.doc.w);
          if (d.hy < 0) y1 = clamp(p.y, 0, y2 - 4); if (d.hy > 0) y2 = clamp(p.y, y1 + 4, this.doc.h);
          Object.assign(c, { x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
          const r = { '1:1': 1, '4:5': 0.8, '16:9': 16 / 9, '3:2': 1.5, '9:16': 9 / 16 }[this.o.ratio];
          if (r) { if (d.hx) c.h = Math.min(c.w / r, this.doc.h - c.y); else c.w = Math.min(c.h * r, this.doc.w - c.x); if (d.hy < 0) c.y = y2 - c.h; if (d.hx < 0) c.x = x2 - c.w; }
          d.moved = true; this.drawOverlay(); break;
        }
        case 'cropMove': { const c = this.crop; c.x = clamp(d.c0.x + p.x - d.s.x, 0, this.doc.w - c.w); c.y = clamp(d.c0.y + p.y - d.s.y, 0, this.doc.h - c.h); d.moved = true; this.drawOverlay(); break; }
        case 'cropNew': {
          const x1 = clamp(Math.min(d.s.x, p.x), 0, this.doc.w), y1 = clamp(Math.min(d.s.y, p.y), 0, this.doc.h);
          const x2 = clamp(Math.max(d.s.x, p.x), 0, this.doc.w), y2 = clamp(Math.max(d.s.y, p.y), 0, this.doc.h);
          this.crop = { x: x1, y: y1, w: Math.max(4, x2 - x1), h: Math.max(4, y2 - y1) };
          if (this.o.ratio !== 'free') this.applyRatio();
          d.moved = true; this.drawOverlay(); break;
        }
        case 'xfMove': { const x = this.xf; x.tx = d.x0.tx + p.x - d.s.x; x.ty = d.x0.ty + p.y - d.s.y; d.moved = true; this.dirtyAll(); break; }
        case 'xfRotate': {
          const x = this.xf, c = { x: x.cx + x.tx, y: x.cy + x.ty };
          let a = d.x0.rot + ((Math.atan2(p.y - c.y, p.x - c.x) - d.a0) * 180) / Math.PI;
          if (e.shiftKey) a = Math.round(a / 15) * 15;
          x.rot = a; d.moved = true; this.hintBox(`${Math.round(a)}°`); this.dirtyAll(); break;
        }
        case 'xfScale': {
          const x = this.xf, x0 = d.x0, h = d.h;
          // local coords relative to centre (unrotated)
          const a = (-x0.rot * Math.PI) / 180, c = { x: x0.cx + x0.tx, y: x0.cy + x0.ty };
          const lx = (p.x - c.x) * Math.cos(a) - (p.y - c.y) * Math.sin(a), ly = (p.x - c.x) * Math.sin(a) + (p.y - c.y) * Math.cos(a);
          const hw = x0.b.w / 2, hh = x0.b.h / 2;
          const hxs = [-1, 0, 1, 1, 1, 0, -1, -1][h], hys = [-1, -1, -1, 0, 1, 1, 1, 0][h];
          let sx = hxs ? (lx / (hxs * hw)) : x0.sx, sy = hys ? (ly / (hys * hh)) : x0.sy;
          // proportional by default on corners (like modern Photoshop); Shift = free
          if (hxs && hys && !e.shiftKey) { const s = Math.max(Math.abs(sx), Math.abs(sy)); sx = s * Math.sign(sx || 1); sy = s * Math.sign(sy || 1); }
          x.sx = Math.abs(sx) < 0.02 ? 0.02 : sx; x.sy = Math.abs(sy) < 0.02 ? 0.02 : sy;
          d.moved = true; this.hintBox(`W: ${Math.round(Math.abs(x.sx) * 100)}%\nH: ${Math.round(Math.abs(x.sy) * 100)}%`); this.dirtyAll(); break;
        }
      }
      this.renderRulers();
    }
    snap45(a, p) { const dx = p.x - a.x, dy = p.y - a.y, ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), L = Math.hypot(dx, dy); return { x: a.x + Math.cos(ang) * L, y: a.y + Math.sin(ang) * L }; }

    onUp(e) {
      const d = this.drag;
      this.drag = null;
      try { this.$.ov.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!d) return;
      switch (d.mode) {
        case 'pan': if (d.moved) this.act('pan'); this.updateCursor(); break;
        case 'move': if (d.moved) { const l = this.layerById(d.id); this.commit('Move'); this.renderPanels(); this.act('move', { id: d.id, lname: l.name, dx: l.x - d.x0, dy: l.y - d.y0 }); } break;
        case 'marquee': case 'ellipse': {
          if (!d.cur || Math.abs(d.cur.x - d.s.x) < 2 || Math.abs(d.cur.y - d.s.y) < 2) { if (d.selMode === 'new') this.deselect(); break; }
          const x = Math.min(d.s.x, d.cur.x), y = Math.min(d.s.y, d.cur.y), w = Math.abs(d.cur.x - d.s.x), h = Math.abs(d.cur.y - d.s.y);
          this.applySelection((g) => { if (d.mode === 'ellipse') { g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 7); g.fill(); } else g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }, d.selMode, d.mode);
          break;
        }
        case 'lasso':
          if (d.pts.length > 3) this.applySelection((g) => { g.beginPath(); d.pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); g.fill(); }, d.selMode, 'lasso');
          break;
        case 'gradient': if (d.cur && Math.hypot(d.cur.x - d.s.x, d.cur.y - d.s.y) > 3) this.gradientFill(d.s, d.cur); break;
        case 'stroke': this.endStroke(); break;
        case 'cropEdge': case 'cropMove': case 'cropNew': this.act('cropAdjust'); this.renderOptions(); break;
        case 'xfMove': case 'xfRotate': case 'xfScale': this.renderOptions(); break;
      }
      this.drawOverlay();
    }
    onWheel(e) {
      e.preventDefault();
      if (e.ctrlKey || e.altKey || e.metaKey) this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey && !e.altKey ? 0.01 : 0.002)), this.scrPt(e));
      else { this.view.x -= e.shiftKey ? e.deltaY : e.deltaX; this.view.y -= e.shiftKey ? 0 : e.deltaY; this.requestRender(true); clearTimeout(this._panT); this._panT = setTimeout(() => this.act('pan', { wheel: true }), 200); }
    }

    /* ---------------------------------------------------- painting */
    dabSprite(size, hard, color) {
      const key = size + '|' + hard + '|' + color;
      if (this._dab && this._dab.key === key) return this._dab.c;
      const s = Math.max(1, Math.ceil(size)), c = mkCanvas(s + 2, s + 2), g = c.getContext('2d'), r = s / 2;
      const [R, G, B] = hexRgb(color);
      const grd = g.createRadialGradient(r + 1, r + 1, Math.max(0, r * hard - 0.01), r + 1, r + 1, r);
      grd.addColorStop(0, `rgba(${R},${G},${B},1)`); grd.addColorStop(1, `rgba(${R},${G},${B},0)`);
      g.fillStyle = hard >= 0.99 ? `rgb(${R},${G},${B})` : grd;
      g.beginPath(); g.arc(r + 1, r + 1, r, 0, 7); g.fill();
      this._dab = { key, c };
      return c;
    }
    startStroke(p, e) {
      const l = this.activeLayer();
      if (!l) return;
      if (!l.visible) return this.toast('This layer is hidden 👁 — turn it on in the Layers panel to paint on it.');
      if (this.tool === 'clone' && e.altKey) { this.cloneSrc = { x: p.x, y: p.y }; this.cloneOffset = null; this.toast('Source set! Now paint where you want the copy.'); this.act('cloneSource'); return; }
      if (this.tool === 'clone' && !this.cloneSrc) { this.toast('First hold Alt (Option on Mac) and click to choose what to copy'); return; }
      if (l.kind === 'text') this.rasterize(l, true);
      this.editable(l);
      if (this.tool !== 'heal') this.ensureCovers(l, { x: 0, y: 0, w: this.doc.w, h: this.doc.h });
      const buf = mkCanvas(l.canvas.width, l.canvas.height);
      const st = { id: l.id, tool: this.tool, buf, last: p, size: this.tool === 'heal' ? this.o.healSize : this.o.size, hard: this.tool === 'heal' ? 0.5 : this.o.hardness, op: this.tool === 'heal' ? 1 : this.o.opacity / 100 };
      if (this.tool === 'clone') {
        if (!this.cloneOffset) this.cloneOffset = { x: this.cloneSrc.x - p.x, y: this.cloneSrc.y - p.y };
        st.src = mkCanvas(this.doc.w, this.doc.h);
        st.src.getContext('2d').drawImage(l.canvas, l.x, l.y);
      }
      this.stroke = st;
      this.drag = { mode: 'stroke' };
      this.dabAt(p);
      this.dirtyAll();
    }
    dabAt(p) {
      const st = this.stroke, l = this.layerById(st.id), g = st.buf.getContext('2d');
      const s = st.size, x = p.x - l.x - s / 2 - 1, y = p.y - l.y - s / 2 - 1;
      if (st.tool === 'clone') {
        const spr = this.dabSprite(s, st.hard, '#000000'), c = mkCanvas(spr.width, spr.height), cg = c.getContext('2d');
        cg.drawImage(st.src, -(p.x + this.cloneOffset.x - s / 2 - 1), -(p.y + this.cloneOffset.y - s / 2 - 1));
        cg.globalCompositeOperation = 'destination-in'; cg.drawImage(spr, 0, 0);
        g.drawImage(c, x, y);
      } else {
        g.drawImage(this.dabSprite(s, st.hard, st.tool === 'brush' ? this.fg : st.tool === 'eraser' && l.bg ? this.bg : '#000000'), x, y);
      }
    }
    continueStroke(p) {
      const st = this.stroke;
      if (!st) return;
      const d = Math.hypot(p.x - st.last.x, p.y - st.last.y), step = Math.max(1, st.size * 0.15);
      if (d < step) { this.drawOverlay(); return; }
      const n = Math.floor(d / step);
      for (let i = 1; i <= n; i++) this.dabAt({ x: st.last.x + ((p.x - st.last.x) * i) / n, y: st.last.y + ((p.y - st.last.y) * i) / n });
      st.last = p; st.moved = true;
      this.dirtyAll();
    }
    strokePreview(l) {
      const st = this.stroke;
      const c = cloneCanvas(l.canvas), g = c.getContext('2d');
      const b = this.maskCanvas ? this.clipToSelection(cloneCanvas(st.buf), l) : st.buf;
      if (st.tool === 'heal') { g.globalAlpha = 0.45; g.drawImage(b, 0, 0); return c; }
      g.globalAlpha = st.op;
      g.globalCompositeOperation = st.tool === 'eraser' && !l.bg ? 'destination-out' : 'source-over';
      g.drawImage(b, 0, 0);
      return c;
    }
    endStroke() {
      const st = this.stroke;
      this.stroke = null;
      if (!st) return;
      const l = this.layerById(st.id);
      const b = this.maskCanvas ? this.clipToSelection(st.buf, l) : st.buf;
      if (st.tool === 'heal') this.healArea(l, b, st.size);
      else {
        const g = l.canvas.getContext('2d');
        g.save(); g.globalAlpha = st.op;
        g.globalCompositeOperation = st.tool === 'eraser' && !l.bg ? 'destination-out' : 'source-over';
        g.drawImage(b, 0, 0); g.restore();
      }
      l._bounds = null; l._strokeFx = null;
      const names = { brush: 'Brush Tool', eraser: 'Eraser', clone: 'Clone Stamp', heal: 'Spot Healing Brush' };
      this.commit(names[st.tool]); this.renderAll();
      this.act('paint', { tool: st.tool, size: st.size, hard: st.hard, op: st.op, color: this.fg, layer: l.name, bg: !!l.bg });
    }
    /** content-aware-ish fill: grow surrounding pixels inward, add a little grain */
    healArea(l, buf, size = 30) {
      const W = l.canvas.width, H = l.canvas.height;
      const bd = ctx2d(buf).getImageData(0, 0, W, H).data;
      let x1 = W, y1 = H, x2 = -1, y2 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bd[(y * W + x) * 4 + 3] > 10) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
      if (x2 < 0) return;
      const grow = Math.max(3, Math.round(size * 0.3)), pad = grow + 4;
      x1 = Math.max(0, x1 - pad); y1 = Math.max(0, y1 - pad); x2 = Math.min(W - 1, x2 + pad); y2 = Math.min(H - 1, y2 + pad);
      const w = x2 - x1 + 1, h = y2 - y1 + 1;
      const g = ctx2d(l.canvas), id = g.getImageData(x1, y1, w, h), px = id.data, orig = new Uint8ClampedArray(px);
      const A = new Float32Array(w * h), known = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = bd[((y + y1) * W + x + x1) * 4 + 3] / 255; A[y * w + x] = a; known[y * w + x] = a > 0.02 ? 0 : 1; }
      // grow the area a little so we sample clean pixels, not the dark rim of the spot
      const ring = new Uint8Array(w * h);
      for (let it = 0; it < grow; it++) {
        const add = [];
        for (let k = 0; k < w * h; k++) if (known[k]) { const x = k % w, y = (k / w) | 0; if ((x > 0 && !known[k - 1]) || (x < w - 1 && !known[k + 1]) || (y > 0 && !known[k - w]) || (y < h - 1 && !known[k + w])) add.push(k); }
        add.forEach((k) => { known[k] = 0; ring[k] = 1; });
      }
      const q = [], inq = new Uint8Array(w * h);
      for (let k = 0; k < w * h; k++) if (!known[k]) {
        const x = k % w, y = (k / w) | 0;
        if ((x > 0 && known[k - 1]) || (x < w - 1 && known[k + 1]) || (y > 0 && known[k - w]) || (y < h - 1 && known[k + w])) { q.push(k); inq[k] = 1; }
      }
      let qi = 0;
      while (qi < q.length) {
        const k = q[qi++], x = k % w, y = (k / w) | 0;
        let r = 0, gg = 0, b = 0, a = 0, n = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const kk = yy * w + xx;
          if (!known[kk]) continue;
          const wt = 1 / (dx * dx + dy * dy + 0.5);
          r += px[kk * 4] * wt; gg += px[kk * 4 + 1] * wt; b += px[kk * 4 + 2] * wt; a += px[kk * 4 + 3] * wt; n += wt;
        }
        if (n) { const nz = (Math.random() - 0.5) * 6; px[k * 4] = r / n + nz; px[k * 4 + 1] = gg / n + nz; px[k * 4 + 2] = b / n + nz; px[k * 4 + 3] = a / n; }
        known[k] = 1;
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([xx, yy]) => { if (xx < 0 || yy < 0 || xx >= w || yy >= h) return; const kk = yy * w + xx; if (!known[kk] && !inq[kk]) { inq[kk] = 1; q.push(kk); } });
      }
      // feather with the soft brush edge
      for (let k = 0; k < w * h; k++) { const a = A[k] > 0.02 ? Math.min(1, 0.45 + A[k] * 1.2) : ring[k] ? 0.45 : 0; for (let c = 0; c < 4; c++) px[k * 4 + c] = orig[k * 4 + c] + (px[k * 4 + c] - orig[k * 4 + c]) * a; }
      g.putImageData(id, x1, y1);
    }
    bucketFill(p) {
      const l = this.activeLayer();
      if (l.kind === 'text') this.rasterize(l, true);
      this.editable(l);
      this.ensureCovers(l, { x: 0, y: 0, w: this.doc.w, h: this.doc.h });
      const W = l.canvas.width, H = l.canvas.height, g = ctx2d(l.canvas), id = g.getImageData(0, 0, W, H), d = id.data;
      const sx = Math.floor(p.x - l.x), sy = Math.floor(p.y - l.y);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
      const i0 = (sy * W + sx) * 4, r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2], a0 = d[i0 + 3], tol = this.o.tolerance;
      const [R, G, B] = hexRgb(this.fg);
      const mk = this._maskData, mw = this.doc.w;
      const inSel = (x, y) => { if (!mk) return true; const X = x + l.x, Y = y + l.y; return X >= 0 && Y >= 0 && X < mw && Y < this.doc.h && mk[Y * mw + X]; };
      if (!inSel(sx, sy)) return this.toast('Click inside your selection to fill it');
      const seen = new Uint8Array(W * H), st = [sy * W + sx];
      seen[sy * W + sx] = 1;
      const like = (i) => Math.abs(d[i] - r0) <= tol && Math.abs(d[i + 1] - g0) <= tol && Math.abs(d[i + 2] - b0) <= tol && Math.abs(d[i + 3] - a0) <= tol;
      let count = 0;
      while (st.length) {
        const k = st.pop(), x = k % W, y = (k / W) | 0;
        d[k * 4] = R; d[k * 4 + 1] = G; d[k * 4 + 2] = B; d[k * 4 + 3] = 255; count++;
        [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([xx, yy]) => { if (xx < 0 || yy < 0 || xx >= W || yy >= H) return; const kk = yy * W + xx; if (seen[kk]) return; seen[kk] = 1; if (like(kk * 4) && inSel(xx, yy)) st.push(kk); });
      }
      g.putImageData(id, 0, 0);
      this.commit('Paint Bucket'); this.renderAll();
      this.act('fill', { how: 'bucket', color: this.fg, count });
    }
    gradientFill(a, b) {
      const l = this.activeLayer();
      if (l.kind === 'text') this.rasterize(l, true);
      this.editable(l);
      this.ensureCovers(l, { x: 0, y: 0, w: this.doc.w, h: this.doc.h });
      const c = mkCanvas(l.canvas.width, l.canvas.height), g = c.getContext('2d');
      const gr = g.createLinearGradient(a.x - l.x, a.y - l.y, b.x - l.x, b.y - l.y);
      gr.addColorStop(0, this.fg); gr.addColorStop(1, this.bg);
      g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      this.clipToSelection(c, l);
      const lg = l.canvas.getContext('2d');
      lg.save(); lg.globalAlpha = this.o.opacity / 100; lg.drawImage(c, 0, 0); lg.restore();
      this.commit('Gradient'); this.renderAll();
      this.act('fill', { how: 'gradient' });
    }

    /* -------------------------------------------------------- keyboard */
    onKey(e) {
      if (!this.isActive()) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (!this.$.dialog.hidden) { if (e.key === 'Escape') this.$.dialog.querySelector('[data-x=cancel]')?.click(); if (e.key === 'Enter') this.$.dialog.querySelector('[data-x=ok]')?.click(); return; }
      this.altDown = e.altKey;
      const mod = e.metaKey || e.ctrlKey, k = e.key, kk = k.toLowerCase();
      if (k === ' ' && !e.repeat) { this.spaceHand = true; this.updateCursor(); e.preventDefault(); return; }
      if (k === 'Alt') { this.updateCursor(); return; }
      if (k === 'Enter') { if (this.xf) { e.preventDefault(); return this.commitTransform(); } if (this.crop) { e.preventDefault(); return this.commitCrop(); } }
      if (k === 'Escape') { if (this.xf) return this.cancelTransform(); if (this.crop) { this.crop = null; this.setTool('move', true); return; } this.closeMenu(); this.closeFlyout(); return; }
      if (mod) {
        const map = {
          z: () => (e.shiftKey ? this.redo() : this.undo()), y: () => this.redo(),
          a: () => this.selectAll(), d: () => this.deselect(), i: () => (e.shiftKey ? this.invertSelection() : this.applyAdjust('invert', {})),
          j: () => this.duplicateLayer(), t: () => this.startTransform(), e: () => (e.shiftKey ? this.flatten() : this.mergeDown()),
          n: () => (e.shiftKey ? this.addLayer() : null), c: () => this.copy(), x: () => this.copy(true), v: () => this.paste(),
          u: () => this.adjustDialog('hsl'), l: () => this.adjustDialog('bc'), ']': () => this.moveLayerOrder('up'), '[': () => this.moveLayerOrder('down'),
          '=': () => this.zoomBy(1.25), '+': () => this.zoomBy(1.25), '-': () => this.zoomBy(0.8), 0: () => this.fit(true), 1: () => this.zoomTo(1),
          r: () => { this.flags.rulers = !this.flags.rulers; this.root.classList.toggle('no-rulers', !this.flags.rulers); this.resize(); },
          backspace: () => this.fillSelection(this.bg), delete: () => this.fillSelection(this.bg),
        };
        const code = e.code === 'Digit0' ? 0 : e.code === 'Digit1' ? 1 : kk;
        if (map[code]) { e.preventDefault(); map[code](); }
        return;
      }
      if (e.altKey && (k === 'Backspace' || k === 'Delete')) { e.preventDefault(); return this.fillSelection(this.fg); }
      if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); return this.clearSelection(); }
      if (k.startsWith('Arrow') && this.tool === 'move') {
        e.preventDefault();
        const l = this.activeLayer(); if (!l || l.bg) return;
        const s = e.shiftKey ? 10 : 1;
        l.x += k === 'ArrowLeft' ? -s : k === 'ArrowRight' ? s : 0; l.y += k === 'ArrowUp' ? -s : k === 'ArrowDown' ? s : 0;
        this.dirtyAll(); clearTimeout(this._nudgeT); this._nudgeT = setTimeout(() => { this.commit('Nudge'); this.act('move', { nudge: true }); }, 250);
        return;
      }
      if (k === '[' || k === ']') { const key = this.tool === 'heal' ? 'healSize' : 'size'; this.o[key] = clamp(Math.round(this.o[key] * (k === ']' ? 1.2 : 0.83)), 1, 500); this.renderOptions(); this.drawOverlay(); this.act('brushSize', { size: this.o[key] }); return; }
      if (kk === 'x') return this.swapColors();
      if (kk === 'd') return this.defaultColors();
      if (/^[0-9]$/.test(k) && ['brush', 'eraser', 'clone'].includes(this.tool)) { this.o.opacity = k === '0' ? 100 : +k * 10; this.renderOptions(); return; }
      const g = TOOL_GROUPS.find((gr) => TOOLS[gr[0]].key && TOOLS[gr[0]].key.toLowerCase() === kk);
      if (g && !e.altKey) {
        if (e.shiftKey && g.length > 1) { const cur = this.groupShown[g[0]]; this.setTool(g[(g.indexOf(cur) + 1) % g.length]); }
        else this.setTool(g.length > 1 ? this.groupShown[g[0]] : g[0]);
      }
    }

    /* ---------------------------------------------------------- menus */
    menuDef() {
      const l = this.activeLayer() || {}, sel = !!this.maskCanvas;
      return {
        File: [
          { l: 'New…', k: CMD + 'N', f: () => this.newDialog() },
          { l: 'Open Your Photo…', k: CMD + 'O', f: () => { this._fileMode = 'open'; this.$.file.click(); } },
          { l: 'Place Your Photo…', f: () => { this._fileMode = 'place'; this.$.file.click(); } },
          { l: 'Place Sample', sub: Object.keys(window.PS_PHOTOS || {}).filter((k) => (window.PS_PHOTOS[k] || {}).sample).map((k) => ({ l: window.PS_PHOTOS[k].label || k, f: () => this.placeSample(k) })) },
          '-',
          { l: 'Export', sub: [{ l: 'Export As PNG…', f: () => this.exportImage('png') }, { l: 'Export As JPG…', f: () => this.exportImage('jpeg') }] },
        ],
        Edit: [
          { l: `Undo ${this.hi > 0 ? this.hist[this.hi].name : ''}`, k: CMD + 'Z', f: () => this.undo(), d: this.hi <= 0 },
          { l: 'Redo', k: SHIFT + CMD + 'Z', f: () => this.redo(), d: this.hi >= this.hist.length - 1 },
          '-',
          { l: 'Cut', k: CMD + 'X', f: () => this.copy(true), d: !sel },
          { l: 'Copy', k: CMD + 'C', f: () => this.copy() },
          { l: 'Paste', k: CMD + 'V', f: () => this.paste(), d: !this.clip },
          { l: 'Clear', k: 'Del', f: () => this.clearSelection(), d: !sel },
          '-',
          { l: 'Fill with Foreground', k: ALT + '⌫', f: () => this.fillSelection(this.fg) },
          { l: 'Fill with Background', k: CMD + '⌫', f: () => this.fillSelection(this.bg) },
          '-',
          { l: 'Free Transform', k: CMD + 'T', f: () => this.startTransform(), d: l.bg },
          { l: 'Transform', sub: [{ l: 'Flip Horizontal', f: () => this.flip('x') }, { l: 'Flip Vertical', f: () => this.flip('y') }] },
        ],
        Image: [
          { l: 'Adjustments', sub: [
            { l: 'Brightness/Contrast…', f: () => this.adjustDialog('bc') },
            { l: 'Hue/Saturation…', k: CMD + 'U', f: () => this.adjustDialog('hsl') },
            { l: 'Black & White', f: () => this.applyAdjust('bw', {}) },
            { l: 'Photo Filter (Warm)…', f: () => this.adjustDialog('warm') },
            { l: 'Invert', k: CMD + 'I', f: () => this.applyAdjust('invert', {}) },
          ] },
          '-',
          { l: 'Crop to Selection', f: () => { if (!this.maskCanvas) return this.toast('Make a selection first'); const s = this.segs; const xs = s.flatMap((q) => [q[0], q[2]]), ys = s.flatMap((q) => [q[1], q[3]]); this.crop = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; this.commitCrop(); }, d: !sel },
          { l: 'Flatten Image', f: () => this.flatten() },
        ],
        Layer: [
          { l: 'New Layer', k: SHIFT + CMD + 'N', f: () => this.addLayer() },
          { l: sel ? 'Layer Via Copy' : 'Duplicate Layer', k: CMD + 'J', f: () => this.duplicateLayer() },
          { l: 'Delete Layer', f: () => this.deleteLayer() },
          '-',
          { l: 'Layer Style', sub: [{ l: 'Drop Shadow…', c: l.fx && l.fx.shadow, f: () => this.toggleFx('shadow') }, { l: 'Stroke…', c: l.fx && l.fx.stroke, f: () => this.toggleFx('stroke') }] },
          { l: 'Arrange', sub: [{ l: 'Bring to Front', k: SHIFT + CMD + ']', f: () => this.moveLayerOrder('top') }, { l: 'Bring Forward', k: CMD + ']', f: () => this.moveLayerOrder('up') }, { l: 'Send Backward', k: CMD + '[', f: () => this.moveLayerOrder('down') }, { l: 'Send to Back', f: () => this.moveLayerOrder('bottom') }] },
          '-',
          { l: 'Rasterize Type', f: () => this.rasterize(l), d: l.kind !== 'text' },
          { l: 'Merge Down', k: CMD + 'E', f: () => this.mergeDown() },
          { l: 'Flatten Image', f: () => this.flatten() },
        ],
        Select: [
          { l: 'All', k: CMD + 'A', f: () => this.selectAll() },
          { l: 'Deselect', k: CMD + 'D', f: () => this.deselect(), d: !sel },
          { l: 'Inverse', k: SHIFT + CMD + 'I', f: () => this.invertSelection(), d: !sel },
        ],
        Filter: [
          { l: 'Blur', sub: [{ l: 'Gaussian Blur…', f: () => this.adjustDialog('blur') }] },
          { l: 'Sharpen', sub: [{ l: 'Sharpen', f: () => this.applyAdjust('sharpen', { amount: 60 }) }] },
          { l: 'Pixelate', sub: [{ l: 'Mosaic…', f: () => this.adjustDialog('mosaic') }] },
          { l: 'Noise', sub: [{ l: 'Add Noise…', f: () => this.adjustDialog('noise') }] },
        ],
        View: [
          { l: 'Zoom In', k: CMD + '+', f: () => this.zoomBy(1.25) },
          { l: 'Zoom Out', k: CMD + '-', f: () => this.zoomBy(0.8) },
          { l: 'Fit on Screen', k: CMD + '0', f: () => this.fit(true) },
          { l: '100%', k: CMD + '1', f: () => this.zoomTo(1) },
          '-',
          { l: 'Rulers', k: CMD + 'R', c: this.flags.rulers, f: () => { this.flags.rulers = !this.flags.rulers; this.root.classList.toggle('no-rulers', !this.flags.rulers); this.resize(); } },
        ],
        Window: [
          { l: 'Adjustments', c: this.tabs.b === 'adjustments', f: () => this.showTab('adjustments') },
          { l: 'Color', c: this.tabs.a === 'color', f: () => this.showTab('color') },
          { l: 'History', c: this.tabs.c === 'history', f: () => this.showTab('history') },
          { l: 'Layers', k: 'F7', c: this.tabs.c === 'layers', f: () => this.showTab('layers') },
          { l: 'Properties', c: this.tabs.b === 'properties', f: () => this.showTab('properties') },
          { l: 'Swatches', c: this.tabs.a === 'swatches', f: () => this.showTab('swatches') },
        ],
        Help: [
          { l: 'Keyboard Shortcuts…', f: () => this.emit('help', { what: 'shortcuts' }) },
          { l: 'Photoshop Help…', f: () => this.emit('help', { what: 'help' }) },
        ],
      };
    }
    openMenu(m) {
      const defs = this.menuDef()[m.dataset.m];
      this._openMenu = m.dataset.m; this._menuFns = [];
      this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.toggle('open', x === m));
      const build = (items) => items.map((it) => {
        if (it === '-') return '<div class="ai-msep"></div>';
        const i = this._menuFns.push(it.f) - 1;
        if (it.sub) return `<div class="ai-mi has-sub${it.d || !it.sub.length ? ' disabled' : ''}" data-l="${esc(it.l)}"><span class="ck"></span><span class="l">${it.l}</span><span class="k">▸</span><div class="ai-sub">${build(it.sub)}</div></div>`;
        return `<div class="ai-mi${it.d ? ' disabled' : ''}" data-i="${i}" data-l="${esc(it.l.trim())}"><span class="ck">${it.c ? '✓' : ''}</span><span class="l">${esc(it.l)}</span><span class="k">${it.k || ''}</span></div>`;
      }).join('');
      const dd = this.$.dropdown;
      dd.innerHTML = build(defs); dd.hidden = false;
      const r = m.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      dd.style.left = (r.left - rr.left) + 'px'; dd.style.top = (r.bottom - rr.top) + 'px';
      dd.dataset.hl = 'dropdown-' + m.dataset.m.toLowerCase();
      this.act('menuOpen', { menu: m.dataset.m });
    }
    closeMenu() { if (!this._openMenu) return; this._openMenu = null; this.$.dropdown.hidden = true; this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.remove('open')); }
    newDialog() {
      this.dialog('New Document', [['Width', 1080], ['Height', 1080]], (v) => { this.reset({ w: clamp(Math.round(v[0]), 16, 3000), h: clamp(Math.round(v[1]), 16, 3000), name: 'Untitled-1' }); this.act('new'); });
    }
    dialog(title, fields, onOk) {
      const d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="${title}"><div class="ai-dialog-title">${title}</div><div class="ai-dialog-body">${fields.map((f, i) => `<label><span>${f[0]}:</span><input type="number" value="${f[1]}" data-i="${i}"> <em>px</em></label>`).join('')}</div><div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">Create</button></div></div>`;
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      const ok = () => { const v = [...d.querySelectorAll('input')].map((i) => parseFloat(i.value) || 0); close(); onOk(v); };
      d.querySelector('[data-x=ok]').onclick = ok; d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(); }));
    }
    placeSample(k) {
      const s = this.photoSize(k), sc = Math.min(1, (this.doc.w * 0.6) / s.w, (this.doc.h * 0.6) / s.h);
      const l = this.addLayerFromDef({ photo: k, name: (window.PS_PHOTOS[k] || {}).label || k, scale: sc, x: Math.round((this.doc.w - s.w * sc) / 2), y: Math.round((this.doc.h - s.h * sc) / 2) });
      this.layers.splice(this.layers.indexOf(l), 1);
      this.layers.splice(this.layers.indexOf(this.activeLayer()) + 1, 0, l);
      this.activeId = l.id;
      this.commit('Place Embedded'); this.renderAll(); this.act('place', { sample: k });
    }
    showTab(t) {
      if (['color', 'swatches'].includes(t)) this.tabs.a = t; else if (['properties', 'adjustments'].includes(t)) this.tabs.b = t; else this.tabs.c = t;
      this.renderPanels(); this.act('panel', { tab: t });
    }

    /* ------------------------------------------------------ export */
    download(blob, name) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      if (this.opts.onDownload) this.opts.onDownload(blob, name);
    }
    exportImage(fmt = 'png') {
      this.compose();
      const c = mkCanvas(this.doc.w, this.doc.h), g = c.getContext('2d');
      if (fmt === 'jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
      g.drawImage(this.comp, 0, 0);
      c.toBlob((b) => b && this.download(b, `my-photo.${fmt === 'jpeg' ? 'jpg' : 'png'}`), 'image/' + fmt, 0.92);
      this.act('export', { format: fmt });
    }
    exportPNG() { this.exportImage('png'); }
    snapshotDataURL(cb, w = 400) {
      this.compose();
      const c = mkCanvas(w, (w * this.doc.h) / this.doc.w), g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(this.comp, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/png'));
    }
    saveLocal() { /* playground autosave is not used for photos (large) */ }
    loadLocal() { return false; }
    setTemplate() { /* not used in Photoshop lessons */ }
    commitIfChanged() { }

    /* ------------------------------------------------------ panels */
    renderPanels() {
      this.$.dock.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', Object.values(this.tabs).includes(b.dataset.tab)));
      if (this.tabs.a === 'color') this.renderColorPanel(); else this.renderSwatches();
      if (this.tabs.b === 'properties') this.renderProperties(); else this.renderAdjustments();
      if (this.tabs.c === 'layers') this.renderLayers(); else this.renderHistory();
    }
    renderColorPanel() {
      const b = this.$.bodyA, [r, g, bl] = hexRgb(this.fg);
      b.innerHTML = `<div class="ps-colorpanel"><div class="ps-cchips"><button class="ps-cchip fg" style="background:${this.fg}" data-c="fg" title="Foreground"></button><button class="ps-cchip bg" style="background:${this.bg}" data-c="bg" title="Background"></button></div>
        <div class="ps-cright"><div class="ai-spectrum ps-spec" title="Click to pick the foreground color"></div>
        <div class="ai-row"><label>#</label><input class="ai-in" value="${this.fg.slice(1)}" maxlength="6" data-hex><span class="ai-unit">R ${r} G ${g} B ${bl}</span></div></div></div>`;
      b.querySelectorAll('[data-c]').forEach((x) => x.addEventListener('click', () => this.pickColor(x.dataset.c)));
      b.querySelector('.ps-spec').addEventListener('click', (e) => {
        const rc = e.currentTarget.getBoundingClientRect(), h = ((e.clientX - rc.left) / rc.width) * 360, l = clamp(1 - (e.clientY - rc.top) / rc.height, 0.04, 0.96);
        const [R, G, B] = hsl2rgb(h / 360, 0.9, l);
        this.setColor('fg', rgbHex(R, G, B));
      });
      const hx = b.querySelector('[data-hex]');
      hx.addEventListener('keydown', (e) => e.stopPropagation());
      hx.addEventListener('change', () => { if (/^[0-9a-f]{6}$/i.test(hx.value)) this.setColor('fg', '#' + hx.value.toUpperCase()); });
    }
    renderSwatches() {
      const b = this.$.bodyA;
      b.innerHTML = `<div class="ai-swgrid ps-swgrid">${SWATCHES.map((c) => `<button class="ai-sw${c === this.fg ? ' on' : ''}" data-sw="${c}" title="${c}" style="background:${c}"></button>`).join('')}</div><div class="ps-hintline">Click = foreground · Alt+click = background</div>`;
      b.querySelectorAll('[data-sw]').forEach((x) => x.addEventListener('click', (e) => this.setColor(e.altKey ? 'bg' : 'fg', x.dataset.sw)));
    }
    renderProperties() {
      const b = this.$.bodyB, l = this.activeLayer();
      if (!l) { b.innerHTML = ''; return; }
      const sec = (t, inner, hl) => `<div class="ai-psec"${hl ? ` data-hl="${hl}"` : ''}><div class="ai-psec-t">${t}</div>${inner}</div>`;
      let html = `<div class="ai-pkind">${l.kind === 'text' ? '🅣 Type Layer' : l.bg ? '🔒 Background' : '🖼 Pixel Layer'} ${l.bg ? '' : `<span class="ps-lname">${esc(l.name)}</span>`}</div>`;
      if (l.bg) html += sec('Background', '<p class="ps-note">The Background is locked: you can\'t move it or make it transparent.</p><div class="ai-btnrow"><button data-cmd="unlock" data-hl="prop-unlock">🔓 Unlock layer</button></div>');
      if (l.kind === 'text') html += sec('Character', `
        <div class="ai-row"><select class="ai-sel wide" data-k="font">${Object.keys(FONTS).map((f) => `<option${f === l.font ? ' selected' : ''}>${f}</option>`).join('')}</select></div>
        <div class="ai-row"><select class="ai-sel" data-k="weight">${[[400, 'Regular'], [700, 'Bold'], [900, 'Black']].map(([w, n]) => `<option value="${w}"${+l.weight === w ? ' selected' : ''}>${n}</option>`).join('')}</select><label>T</label><input class="ai-in" type="number" min="4" data-k="size" value="${Math.round(l.size)}"><span class="ai-unit">px</span></div>
        <div class="ai-row"><label>Color</label><input type="color" data-k="color" value="${l.color.toLowerCase()}"><div class="ai-btnrow" style="flex:1">${['left', 'center'].map((a) => `<button data-talign="${a}" class="${(l.align || 'left') === a ? 'on' : ''}">${a === 'left' ? 'Left' : 'Center'}</button>`).join('')}</div></div>`, 'prop-character');
      const bb = l.kind === 'text' ? { x: l.x, y: l.y, w: l.canvas.width, h: l.canvas.height } : (this.contentBounds(l) || { x: 0, y: 0, w: 0, h: 0 });
      html += sec('Transform', `<div class="ai-row"><label>X</label><input class="ai-in" disabled value="${Math.round(bb.x)} px"><label>Y</label><input class="ai-in" disabled value="${Math.round(bb.y)} px"></div><div class="ai-row"><label>W</label><input class="ai-in" disabled value="${Math.round(bb.w)} px"><label>H</label><input class="ai-in" disabled value="${Math.round(bb.h)} px"></div>
        <div class="ai-btnrow"><button data-cmd="transform" data-hl="prop-transform">⤡ Free Transform</button><button data-cmd="flipx">⇋ Flip</button></div>`);
      if (!l.bg) html += sec('Layer Style', `<div class="ai-btnrow"><button data-cmd="shadow" class="${l.fx.shadow ? 'on' : ''}" data-hl="prop-shadow">☁ Drop Shadow</button><button data-cmd="stroke" class="${l.fx.stroke ? 'on' : ''}" data-hl="prop-stroke">◯ Stroke</button></div>
        ${l.fx.stroke ? `<div class="ai-row" style="margin-top:8px"><label>Stroke</label><input type="color" data-k="strokeColor" value="${(l.fx.strokeColor || '#000000').toLowerCase()}"><input class="ai-in" type="number" min="1" max="40" data-k="strokeSize" value="${l.fx.strokeSize || 6}"><span class="ai-unit">px</span></div>` : ''}`, 'prop-style');
      html += sec('Quick Actions', `<div class="ai-btnrow"><button data-cmd="dup">Duplicate (${CMD}J)</button>${this.maskCanvas ? '<button data-cmd="deselect">Deselect</button><button data-cmd="inverse">Inverse</button>' : '<button data-cmd="selectall">Select All</button>'}</div>`);
      b.innerHTML = html;
      this.bindPanel(b);
    }
    renderAdjustments() {
      const b = this.$.bodyB;
      const A = [['bc', '☀', 'Brightness/Contrast'], ['hsl', '🌈', 'Hue/Saturation'], ['bw', '◐', 'Black & White'], ['warm', '🔥', 'Photo Filter'], ['invert', '⬛', 'Invert']];
      const F = [['blur', '💧', 'Gaussian Blur'], ['sharpen', '🔺', 'Sharpen'], ['mosaic', '▦', 'Mosaic'], ['noise', '✦', 'Add Noise']];
      b.innerHTML = `<div class="ai-psec"><div class="ai-psec-t">Adjustments</div><div class="ps-adjgrid">${A.map(([k, i, n]) => `<button data-adj="${k}" data-hl="adj-${k}" title="${n}"><span>${i}</span><small>${n}</small></button>`).join('')}</div></div>
        <div class="ai-psec"><div class="ai-psec-t">Filters</div><div class="ps-adjgrid">${F.map(([k, i, n]) => `<button data-adj="${k}" data-hl="adj-${k}" title="${n}"><span>${i}</span><small>${n}</small></button>`).join('')}</div></div>
        <p class="ps-note" style="padding:0 12px">Works on the selected layer${this.maskCanvas ? ' — <b>only inside your selection</b>' : ''}.</p>`;
      b.querySelectorAll('[data-adj]').forEach((x) => x.addEventListener('click', () => { const k = x.dataset.adj; if (k === 'sharpen') this.applyAdjust('sharpen', { amount: 60 }); else this.adjustDialog(k); }));
    }
    bindPanel(b) {
      b.querySelectorAll('[data-k]').forEach((inp) => {
        const k = inp.dataset.k;
        inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
        inp.addEventListener('change', () => {
          const l = this.activeLayer();
          if (k === 'strokeColor' || k === 'strokeSize') { l.fx = { ...l.fx, [k]: k === 'strokeSize' ? clamp(+inp.value, 1, 40) : inp.value }; l._strokeFx = null; this.commit('Layer Style'); this.renderAll(); this.act('fxEdit', { k }); return; }
          if (l.kind !== 'text') return;
          l[k] = k === 'size' ? Math.max(4, +inp.value) : k === 'weight' ? +inp.value : k === 'color' ? inp.value.toUpperCase() : inp.value;
          this.renderText(l); this.commit('Character'); this.renderAll(); this.act('textProp', { k, v: l[k] });
        });
      });
      b.querySelectorAll('[data-talign]').forEach((x) => x.addEventListener('click', () => { const l = this.activeLayer(); l.align = x.dataset.talign; this.renderText(l); this.commit('Paragraph'); this.renderAll(); this.act('textProp', { k: 'align' }); }));
      b.querySelectorAll('[data-cmd]').forEach((x) => x.addEventListener('click', () => {
        const m = { unlock: () => this.unlockBackground(), transform: () => this.startTransform(), flipx: () => this.flip('x'), shadow: () => this.toggleFx('shadow'), stroke: () => this.toggleFx('stroke'), dup: () => this.duplicateLayer(), deselect: () => this.deselect(), inverse: () => this.invertSelection(), selectall: () => this.selectAll() };
        m[x.dataset.cmd] && m[x.dataset.cmd]();
      }));
    }
    renderLayers() {
      if (this.tabs.c !== 'layers') return;
      const b = this.$.bodyC, a = this.activeLayer() || {};
      const rows = this.layers.slice().reverse().map((l) => `
        <div class="ps-lrow${l.id === a.id ? ' sel' : ''}" data-lid="${l.id}" draggable="${l.bg ? 'false' : 'true'}">
          <button class="ps-eye${l.visible ? '' : ' off'}" data-eye="${l.id}" title="Show/hide layer">${l.visible ? '👁' : ''}</button>
          <span class="ps-thumb${l.kind === 'text' ? ' txt' : ''}">${l.kind === 'text' ? 'T' : `<canvas data-th="${l.id}" width="40" height="30"></canvas>`}</span>
          <span class="ps-lname" title="Double-click to rename">${l.bg ? '<i>Background</i>' : esc(l.name)}</span>
          ${l.fx.shadow || l.fx.stroke ? '<span class="ps-fxb" title="Layer style">fx</span>' : ''}
          ${l.bg ? '<span class="ps-lock" title="Locked — double-click to unlock">🔒</span>' : ''}
        </div>${l.fx.shadow || l.fx.stroke ? `<div class="ps-fxrow">${l.fx.stroke ? '<span>◯ Stroke</span>' : ''}${l.fx.shadow ? '<span>☁ Drop Shadow</span>' : ''}</div>` : ''}`).join('');
      b.innerHTML = `<div class="ps-ltop"><select class="ai-sel" data-blend data-hl="blend-mode" title="Blend mode">${BLENDS.map(([k, n]) => `<option value="${k}"${a.blend === k ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <label>Opacity:</label><input class="ai-in ps-opn" type="number" min="0" max="100" value="${Math.round((a.opacity || 0) * 100)}" data-op data-hl="layer-opacity">%</div>
        <div class="ps-ltop2"><input type="range" min="0" max="100" value="${Math.round((a.opacity || 0) * 100)}" data-opr></div>
        <div class="ps-layers" data-hl="layers-list">${rows}</div>
        <div class="ps-lfoot"><button data-lcmd="fx" title="Add a layer style" data-hl="layer-fx">fx</button><button data-lcmd="adj" title="Adjustments">◐</button><button data-lcmd="new" title="Create a new layer" data-hl="layer-new">＋</button><button data-lcmd="dup" title="Duplicate layer">⧉</button><button data-lcmd="del" title="Delete layer" data-hl="layer-delete">🗑</button></div>`;
      b.querySelectorAll('[data-th]').forEach((c) => {
        const l = this.layerById(c.dataset.th), g = c.getContext('2d');
        const s = Math.min(40 / this.doc.w, 30 / this.doc.h);
        g.drawImage(l.canvas, (40 - this.doc.w * s) / 2 + l.x * s, (30 - this.doc.h * s) / 2 + l.y * s, l.canvas.width * s, l.canvas.height * s);
      });
      b.querySelectorAll('[data-lid]').forEach((r) => {
        r.addEventListener('click', (e) => { if (e.target.closest('[data-eye]')) return; this.selectLayer(r.dataset.lid); });
        r.addEventListener('dblclick', () => {
          const l = this.layerById(r.dataset.lid);
          if (l.bg) return this.unlockBackground();
          const nm = r.querySelector('.ps-lname');
          const inp = document.createElement('input'); inp.className = 'ai-in ps-rename'; inp.value = l.name;
          nm.replaceWith(inp); inp.focus(); inp.select();
          const done = () => this.renameLayer(l.id, inp.value.trim());
          inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = l.name; inp.blur(); } });
          inp.addEventListener('blur', done);
        });
        r.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', r.dataset.lid); r.classList.add('dragging'); });
        r.addEventListener('dragend', () => r.classList.remove('dragging'));
        r.addEventListener('dragover', (e) => { e.preventDefault(); r.classList.add('dropto'); });
        r.addEventListener('dragleave', () => r.classList.remove('dropto'));
        r.addEventListener('drop', (e) => { e.preventDefault(); r.classList.remove('dropto'); const id = e.dataTransfer.getData('text/plain'); const t = this.layerById(r.dataset.lid); if (id && id !== t.id) this.reorderTo(id, this.layers.indexOf(t) + 1); });
      });
      b.querySelectorAll('[data-eye]').forEach((x) => x.addEventListener('click', () => this.toggleVisible(x.dataset.eye)));
      b.querySelector('[data-blend]').addEventListener('change', (e) => this.setLayerProp('blend', e.target.value));
      const opn = b.querySelector('[data-op]'), opr = b.querySelector('[data-opr]');
      opn.addEventListener('keydown', (e) => e.stopPropagation());
      opn.addEventListener('change', () => this.setLayerProp('opacity', clamp(+opn.value, 0, 100) / 100));
      opr.addEventListener('input', () => { opn.value = opr.value; this.setLayerProp('opacity', +opr.value / 100, { noCommit: true }); });
      opr.addEventListener('change', () => this.setLayerProp('opacity', +opr.value / 100));
      b.querySelectorAll('[data-lcmd]').forEach((x) => x.addEventListener('click', (e) => {
        const c = x.dataset.lcmd;
        if (c === 'new') this.addLayer(); if (c === 'del') this.deleteLayer(); if (c === 'dup') this.duplicateLayer();
        if (c === 'adj') this.showTab('adjustments');
        if (c === 'fx') this.fxMenu(x);
      }));
    }
    fxMenu(btn) {
      const pop = this.$.pop, l = this.activeLayer();
      pop.hidden = false;
      pop.innerHTML = `<div class="ai-pop-t">Layer Style</div><div class="ps-fxmenu"><button data-f="shadow">${l.fx.shadow ? '✓ ' : ''}Drop Shadow…</button><button data-f="stroke">${l.fx.stroke ? '✓ ' : ''}Stroke…</button></div>`;
      const r = btn.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      pop.style.left = Math.min(r.left - rr.left, rr.width - 240) + 'px'; pop.style.top = (r.top - rr.top - 110) + 'px';
      pop.querySelectorAll('[data-f]').forEach((x) => x.addEventListener('click', () => { this.closePop(); this.toggleFx(x.dataset.f); }));
      this.act('fxMenu');
    }
    renderHistory() {
      if (this.tabs.c !== 'history') return;
      const b = this.$.bodyC;
      b.innerHTML = `<div class="ps-history" data-hl="history-list">${this.hist.map((h, i) => `<div class="ps-hrow${i === this.hi ? ' cur' : ''}${i > this.hi ? ' future' : ''}" data-h="${i}"><span class="ps-hi">${i === 0 ? '🖼' : '▸'}</span>${esc(h.name)}</div>`).join('')}</div><div class="ps-lfoot"><span class="ps-hintline">Click a step to go back in time ⏪</span></div>`;
      b.querySelectorAll('[data-h]').forEach((r) => r.addEventListener('click', () => { this.restore(+r.dataset.h); this.renderHistory(); this.act('history', { i: +r.dataset.h }); }));
      const cur = b.querySelector('.cur'); cur && cur.scrollIntoView({ block: 'nearest' });
    }
    renderColors() {
      const tb = this.$.toolbar;
      tb.querySelector('.ps-fg').style.background = this.fg;
      tb.querySelector('.ps-bg').style.background = this.bg;
    }
    renderToolbarState() {
      this.$.toolbar.querySelectorAll('.ai-tool').forEach((b) => {
        const g = TOOL_GROUPS[+b.dataset.group];
        if (g.length > 1) { const shown = this.groupShown[g[0]]; if (b.dataset.tool !== shown) { b.dataset.tool = shown; b.dataset.hl = 'tool-' + shown; b.innerHTML = svgIcon(shown); b.setAttribute('aria-label', TOOLS[shown].name); } }
        b.classList.toggle('on', b.dataset.tool === this.tool);
      });
    }
    renderOptions() {
      const t = this.tool, o = this.o, el = this.$.opts;
      const icon = `<span class="ps-oicon">${svgIcon(t, 18)}</span><span class="ai-c-sep"></span>`;
      const slider = (k, label, min, max, unit = '', step = 1) => `<span class="ai-c-item ps-oitem"><span>${label}:</span><input class="ai-num" type="number" min="${min}" max="${max}" step="${step}" value="${k === 'hardness' ? Math.round(o[k] * 100) : o[k]}" data-o="${k}"><span>${unit}</span><input type="range" class="ps-orange" min="${min}" max="${max}" step="${step}" value="${k === 'hardness' ? Math.round(o[k] * 100) : o[k]}" data-or="${k}"></span>`;
      const selModes = `<span class="ps-selmodes" data-hl="sel-modes">${[['new', '▢', 'New selection'], ['add', '⊞', 'Add to selection (Shift)'], ['sub', '⊟', 'Subtract from selection (Alt)'], ['int', '⧈', 'Intersect']].map(([k, i, n]) => `<button data-selmode="${k}" class="${o.selMode === k ? 'on' : ''}" title="${n}">${i}</button>`).join('')}</span>`;
      let html = icon;
      if (this.xf) html += `<span class="ps-xfinfo">Free Transform — drag corners to resize, outside to rotate, inside to move</span><span class="ai-c-spacer"></span><button class="ps-ok cancel" data-xf="cancel" title="Cancel (Esc)">⊘</button><button class="ps-ok" data-xf="ok" data-hl="xf-commit" title="Commit (Enter)">✓</button>`;
      else if (t === 'move') html += `<label class="ps-check" data-hl="auto-select"><input type="checkbox" data-ob="autoSelect"${o.autoSelect ? ' checked' : ''}> Auto-Select Layer</label><span class="ai-c-sep"></span><button class="ps-obtn" data-oc="transform">⤡ Free Transform (${CMD}T)</button>`;
      else if (t === 'marquee' || t === 'ellipse' || t === 'lasso') html += selModes + `<span class="ai-c-sep"></span><span class="ps-hintline">${t === 'lasso' ? 'Draw around the thing you want' : 'Drag on the photo'} · Shift = add · Alt = subtract</span>`;
      else if (t === 'wand') html += selModes + '<span class="ai-c-sep"></span>' + slider('tolerance', 'Tolerance', 0, 255) + `<label class="ps-check"><input type="checkbox" data-ob="contiguous"${o.contiguous ? ' checked' : ''}> Contiguous</label><label class="ps-check"><input type="checkbox" data-ob="sampleAll"${o.sampleAll ? ' checked' : ''}> Sample All Layers</label>`;
      else if (t === 'brush' || t === 'eraser') html += slider('size', 'Size', 1, 300, 'px') + slider('hardness', 'Hardness', 0, 100, '%') + slider('opacity', 'Opacity', 1, 100, '%');
      else if (t === 'clone') html += slider('size', 'Size', 1, 300, 'px') + slider('hardness', 'Hardness', 0, 100, '%') + `<span class="ps-hintline">${this.cloneSrc ? '✓ Source set — now paint!' : 'Hold <b>Alt</b> and click to set the source'}</span>`;
      else if (t === 'heal') html += slider('healSize', 'Size', 4, 200, 'px') + '<span class="ps-hintline">Paint over spots and blemishes — Content-Aware</span>';
      else if (t === 'bucket') html += slider('tolerance', 'Tolerance', 0, 255);
      else if (t === 'gradient') html += `<span class="ps-gradprev" style="background:linear-gradient(90deg,${this.fg},${this.bg})"></span><span class="ps-hintline">Foreground → Background · drag on the photo</span>` + slider('opacity', 'Opacity', 1, 100, '%');
      else if (t === 'crop') html += `<select class="ai-sel ps-ratio" data-ratio data-hl="crop-ratio">${[['free', 'Ratio (free)'], ['1:1', '1 : 1 (Square)'], ['4:5', '4 : 5 (Portrait)'], ['16:9', '16 : 9 (Wide)'], ['3:2', '3 : 2'], ['9:16', '9 : 16 (Story)']].map(([k, n]) => `<option value="${k}"${o.ratio === k ? ' selected' : ''}>${n}</option>`).join('')}</select><span class="ps-hintline">Drag the edges · drag inside to move</span><span class="ai-c-spacer"></span><button class="ps-ok cancel" data-crop="cancel" title="Cancel (Esc)">⊘</button><button class="ps-ok" data-crop="ok" data-hl="crop-commit" title="Commit crop (Enter)">✓</button>`;
      else if (t === 'type') html += `<select class="ai-sel" data-of="font" style="max-width:150px">${Object.keys(FONTS).map((f) => `<option${f === o.font ? ' selected' : ''}>${f}</option>`).join('')}</select><span class="ai-c-item"><input class="ai-num" type="number" min="4" value="${o.fsize}" data-o="fsize"> px</span><select class="ai-sel" data-of="fweight" style="max-width:100px"><option value="400"${o.fweight === 400 ? ' selected' : ''}>Regular</option><option value="700"${o.fweight === 700 ? ' selected' : ''}>Bold</option><option value="900"${o.fweight === 900 ? ' selected' : ''}>Black</option></select><span class="ps-hintline">Color = foreground color · Esc to finish</span>`;
      else if (t === 'eyedropper') html += '<span class="ps-hintline">Click = foreground color · Alt+click = background color</span>';
      else if (t === 'zoom') html += '<span class="ps-hintline">Click to zoom in · Alt+click to zoom out</span><span class="ai-c-sep"></span><button class="ps-obtn" data-oc="fit">Fit Screen</button><button class="ps-obtn" data-oc="100">100%</button>';
      else if (t === 'hand') html += '<button class="ps-obtn" data-oc="fit">Fit Screen</button><button class="ps-obtn" data-oc="100">100%</button>';
      el.innerHTML = html;
      el.querySelectorAll('[data-o]').forEach((i) => {
        i.addEventListener('keydown', (e) => e.stopPropagation());
        i.addEventListener('change', () => { const k = i.dataset.o; o[k] = k === 'hardness' ? clamp(+i.value, 0, 100) / 100 : +i.value; this.renderOptions(); this.act('option', { k, v: o[k] }); });
      });
      el.querySelectorAll('[data-or]').forEach((i) => i.addEventListener('input', () => { const k = i.dataset.or; o[k] = k === 'hardness' ? +i.value / 100 : +i.value; el.querySelector(`[data-o="${k}"]`).value = i.value; this.drawOverlay(); }));
      el.querySelectorAll('[data-or]').forEach((i) => i.addEventListener('change', () => this.act('option', { k: i.dataset.or, v: o[i.dataset.or] })));
      el.querySelectorAll('[data-ob]').forEach((i) => i.addEventListener('change', () => { o[i.dataset.ob] = i.checked; this.act('option', { k: i.dataset.ob, v: i.checked }); }));
      el.querySelectorAll('[data-of]').forEach((i) => i.addEventListener('change', () => { const k = i.dataset.of; o[k] = k === 'fweight' ? +i.value : i.value; const l = this.activeLayer(); if (l && l.kind === 'text') { l[k === 'fweight' ? 'weight' : 'font'] = o[k]; this.renderText(l); this.commit('Character'); this.renderAll(); this.act('textProp', { k }); } }));
      el.querySelectorAll('[data-selmode]').forEach((x) => x.addEventListener('click', () => { o.selMode = x.dataset.selmode; this.renderOptions(); }));
      const ratio = el.querySelector('[data-ratio]');
      if (ratio) ratio.addEventListener('change', () => { o.ratio = ratio.value; if (!this.crop) this.startCrop(); this.crop = { x: 0, y: 0, w: this.doc.w, h: this.doc.h }; this.applyRatio(); this.requestRender(true); this.act('cropRatio', { ratio: o.ratio }); });
      el.querySelectorAll('[data-crop]').forEach((x) => x.addEventListener('click', () => { if (x.dataset.crop === 'ok') this.commitCrop(); else { this.crop = null; this.setTool('move', true); } }));
      el.querySelectorAll('[data-xf]').forEach((x) => x.addEventListener('click', () => (x.dataset.xf === 'ok' ? this.commitTransform() : this.cancelTransform())));
      el.querySelectorAll('[data-oc]').forEach((x) => x.addEventListener('click', () => { const c = x.dataset.oc; if (c === 'transform') this.startTransform(); if (c === 'fit') this.fit(true); if (c === '100') this.zoomTo(1); }));
      const fs = el.querySelector('[data-o="fsize"]');
      if (fs) fs.addEventListener('change', () => { const l = this.activeLayer(); if (l && l.kind === 'text') { l.size = o.fsize; this.renderText(l); this.commit('Character'); this.renderAll(); this.act('textProp', { k: 'size' }); } });
    }

    showTip(el, html) {
      clearTimeout(this._tipT);
      this._tipT = setTimeout(() => { const t = this.$.tooltip, r = el.getBoundingClientRect(), rr = this.root.getBoundingClientRect(); t.innerHTML = html; t.hidden = false; t.style.left = (r.right - rr.left + 8) + 'px'; t.style.top = (r.top - rr.top) + 'px'; }, 450);
    }
    hideTip() { clearTimeout(this._tipT); if (this.$.tooltip) this.$.tooltip.hidden = true; }
    toast(msg) {
      const t = this.$.toast;
      t.textContent = msg; t.hidden = false;
      t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
      clearTimeout(this._toastT); this._toastT = setTimeout(() => { t.hidden = true; }, 3000);
    }
    hl(name) { return this.root.querySelector(`[data-hl="${name}"]`); }

    /* lesson helpers */
    layerNamed(n) { return this.layers.find((l) => l.name === n); }
    hasMask() { return !!this.maskCanvas; }
    maskArea() { if (!this._maskData) return 0; let n = 0; const A = this._maskData; for (let i = 0; i < A.length; i++) n += A[i]; return n / A.length; }
  }

  window.PSEditor = PSEditor;
  window.PSEditor.TOOLS = TOOLS;
  window.PSEditor.CMD = CMD; window.PSEditor.SHIFT = SHIFT; window.PSEditor.ALT = ALT;
})();
