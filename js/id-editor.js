/* =========================================================================
   DesignQuest — InDesign Workspace Simulator
   A beginner-friendly recreation of the Adobe InDesign workspace: menu bar,
   control panel, toolbar, pages on a pasteboard with margin / column / bleed
   guides, Properties / Pages / Paragraph Styles / Swatches panels.
   Real layout engine: text frames with word wrap, columns, overset text and
   threading, paragraph styles, placeholder text, graphic frames with photos
   (fit / fill / move content), shapes, text wrap, master pages with
   automatic page numbers, preview mode, undo/redo and PDF export.
   ========================================================================= */
(function () {
  'use strict';

  let UID = 1;
  const uid = () => 'i' + Date.now().toString(36) + (UID++);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const CMD = IS_MAC ? '⌘' : 'Ctrl+';
  const SHIFT = IS_MAC ? '⇧' : 'Shift+';
  const ALT = IS_MAC ? '⌥' : 'Alt+';
  const DPR = () => window.devicePixelRatio || 1;
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const PAGE_GAP = 48;
  const PN = '<#>'; // current page number marker

  const FONTS = {
    'Minion Pro': "'Playfair Display',Georgia,serif", 'Myriad Pro': "'Source Sans 3','Segoe UI',Arial,sans-serif", 'Poppins': 'Poppins,sans-serif',
    'Montserrat': 'Montserrat,sans-serif', 'Bebas Neue': "'Bebas Neue',Impact,sans-serif", 'Playfair Display': "'Playfair Display',Georgia,serif",
    'Pacifico': 'Pacifico,cursive', 'Roboto Mono': "'Roboto Mono',monospace",
  };
  const fontStack = (f) => FONTS[f] || FONTS['Minion Pro'];
  const SWATCHES = [['[None]', 'none'], ['[Paper]', '#FFFFFF'], ['[Black]', '#000000'], ['Red', '#ED1C24'], ['Orange', '#F7931E'], ['Yellow', '#FCEE21'], ['Green', '#39B54A'],
    ['Cyan', '#29ABE2'], ['Blue', '#2E3192'], ['Magenta', '#EC008C'], ['Purple', '#662D91'], ['Coral', '#FF7A59'], ['Sun', '#FFC93C'], ['Teal', '#19C3B1'], ['Violet', '#7C5CFF'],
    ['Pink', '#FF5FA2'], ['Navy', '#1D1B4B'], ['Cream', '#FFF4E0'], ['Grey', '#808080'], ['Mint', '#C9F2C7']];
  const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque.';
  const DEFAULT_STYLES = () => ({
    'Basic Paragraph': { font: 'Minion Pro', size: 12, leading: 14.4, color: '#000000', align: 'left', weight: 400, spaceAfter: 6 },
  });

  /* ---------------------------------------------------------------- tools */
  const TOOLS = {
    select: { name: 'Selection Tool', key: 'V', tip: 'Click a frame to select it. Drag to move. Drag the handles to resize. Click the red ⊞ out-port to flow text.' },
    direct: { name: 'Direct Selection Tool', key: 'A', tip: 'Move the PHOTO inside its frame (crop / reposition the picture).' },
    type: { name: 'Type Tool', key: 'T', tip: 'Drag to draw a text frame, then type. Click in a text frame to edit it.' },
    line: { name: 'Line Tool', key: '\\', tip: 'Drag to draw a straight line. Shift for perfect angles.' },
    frame: { name: 'Rectangle Frame Tool', key: 'F', tip: 'Draw an empty picture frame (with an ✕). Then File › Place a photo into it.' },
    eframe: { name: 'Ellipse Frame Tool', key: '', tip: 'Draw a round picture frame.' },
    rect: { name: 'Rectangle Tool', key: 'M', tip: 'Draw a colored rectangle (for backgrounds, boxes and bars).' },
    ellipse: { name: 'Ellipse Tool', key: 'L', tip: 'Draw an ellipse. Hold Shift for a circle.' },
    hand: { name: 'Hand Tool', key: 'H', tip: 'Drag to scroll around. (Hold Space!)' },
    zoom: { name: 'Zoom Tool', key: 'Z', tip: 'Click to zoom in, Alt+click to zoom out.' },
  };
  const TOOL_GROUPS = [['select'], ['direct'], ['type'], ['line'], ['frame', 'eframe'], ['rect', 'ellipse'], ['hand'], ['zoom']];
  const ICON = {
    select: '<path d="M6 3l12.5 9-5.4 1.1 3.3 6.3-2.4 1.2-3.3-6.4L6 18.5z" fill="currentColor"/>',
    direct: '<path d="M6 3l12.5 9-5.4 1.1 3.3 6.3-2.4 1.2-3.3-6.4L6 18.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    type: '<path d="M5 4.5h14v3.3h-1.4l-.6-1.6h-3.6v12l2 .8v1.5H8.6V19l2-.8v-12H7l-.6 1.6H5z" fill="currentColor"/>',
    line: '<path d="M5 19L19 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    frame: '<rect x="4.5" y="5.5" width="15" height="13" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 5.5l15 13M19.5 5.5l-15 13" stroke="currentColor" stroke-width="1"/>',
    eframe: '<ellipse cx="12" cy="12" rx="8" ry="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.3 7.4l11.4 9.2M17.7 7.4L6.3 16.6" stroke="currentColor" stroke-width="1"/>',
    rect: '<rect x="4.5" y="6.5" width="15" height="11" fill="currentColor" opacity=".9"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6" fill="currentColor" opacity=".9"/>',
    hand: '<path d="M8.3 13V6.7a1.4 1.4 0 0 1 2.8 0V12m0-.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3m0-.4V6.4a1.4 1.4 0 0 1 2.8 0v7c0 4.1-2.4 7-6 7-2.4 0-3.9-1.2-5.4-3.4L4.4 13.7a1.3 1.3 0 0 1 2.1-1.5l1.8 2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const svgIcon = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[k] || ''}</svg>`;

  /* ============================================================ editor */
  class IDEditor {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = opts;
      this.tool = 'select';
      this.groupShown = { frame: 'frame', rect: 'rect' };
      this.sel = new Set();
      this.view = { z: 1, x: 0, y: 0 };
      this.hist = []; this.fut = [];
      this.listeners = []; this.log = [];
      this.tab = 'properties';
      this.slot = 'fill';
      this.textMode = false; // "formatting affects text"
      this.preview = false;
      this.photos = {};
      this.build();
      this.bind();
      this.reset();
      requestAnimationFrame(() => this.resize());
      if (document.fonts) { document.fonts.ready.then(() => this.render()); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', () => this.render()); }
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
      root.className = 'ai id';
      root.tabIndex = -1;
      root.innerHTML = `
        <div class="ai-menubar"><div class="ai-logo id-logo" title="InDesign">Id</div><div class="ai-menus"></div>
          <div class="ai-menubar-right"><span class="ai-workspace">Essentials <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2.5l3 3 3-3" stroke="currentColor" fill="none"/></svg></span></div></div>
        <div class="ai-ctrlbar id-control" data-hl="control-panel"></div>
        <div class="ai-main">
          <div class="ai-toolbar" data-hl="toolbar"></div>
          <div class="ai-doc">
            <div class="ai-tabs"><div class="ai-tab active"><span class="id-docname">Untitled-1.indd</span> <span class="ai-tab-zoom">@ 100%</span><span class="ai-tab-x">×</span></div></div>
            <div class="ai-stage"><div class="ai-ruler-corner"></div><canvas class="ai-ruler ai-ruler-h"></canvas><canvas class="ai-ruler ai-ruler-v"></canvas>
              <div class="ai-canvas-wrap" data-hl="canvas"><canvas class="id-cv"></canvas><div class="ai-textedit id-te" contenteditable="true" spellcheck="false" hidden></div><div class="ai-toast" hidden></div></div></div>
            <div class="ai-status"></div>
          </div>
          <div class="ai-dock id-dock" data-hl="panels">
            <div class="ai-dockgroup id-dock-a"><div class="ai-dtabs"><button data-tab="properties" data-hl="tab-properties">Properties</button><button data-tab="pages" data-hl="tab-pages">Pages</button><button data-tab="styles" data-hl="tab-styles">¶ Styles</button></div><div class="ai-dbody id-body-a"></div></div>
            <div class="ai-dockgroup id-dock-b"><div class="ai-dtabs"><button class="on" data-hl="tab-swatches">Swatches</button></div><div class="ai-dbody id-body-b"></div></div>
          </div>
        </div>
        <input type="file" accept="image/*" class="ps-file" hidden>
        <div class="ai-dropdown" hidden></div><div class="ai-tooltip" hidden></div><div class="ai-pop" hidden></div><div class="ai-dialog-wrap" hidden></div>`;
      this.host.innerHTML = '';
      this.host.appendChild(root);
      const q = (s) => root.querySelector(s);
      this.root = root;
      this.$ = {
        menus: q('.ai-menus'), ctrl: q('.id-control'), toolbar: q('.ai-toolbar'), stage: q('.ai-stage'), wrap: q('.ai-canvas-wrap'), cv: q('.id-cv'),
        rh: q('.ai-ruler-h'), rv: q('.ai-ruler-v'), status: q('.ai-status'), tabZoom: q('.ai-tab-zoom'), docname: q('.id-docname'), dock: q('.id-dock'),
        bodyA: q('.id-body-a'), bodyB: q('.id-body-b'), dropdown: q('.ai-dropdown'), tooltip: q('.ai-tooltip'), pop: q('.ai-pop'), dialog: q('.ai-dialog-wrap'),
        te: q('.id-te'), toast: q('.ai-toast'), file: q('.ps-file'),
      };
      this.$.svg = this.$.cv;
      this.$.menus.innerHTML = ['File', 'Edit', 'Layout', 'Type', 'Object', 'View', 'Window', 'Help'].map((n) => `<div class="ai-menu" data-m="${n}" data-hl="menu-${n.toLowerCase()}">${n}</div>`).join('');
      let html = '<div class="ai-tools">';
      TOOL_GROUPS.forEach((g, gi) => {
        const shown = g.length > 1 ? this.groupShown[g[0]] : g[0];
        html += `<button class="ai-tool${g.length > 1 ? ' has-fly' : ''}" data-tool="${shown}" data-group="${gi}" data-hl="tool-${shown}" aria-label="${TOOLS[shown].name}">${svgIcon(shown)}</button>`;
        if (gi === 1 || gi === 5) html += '<div class="ai-tool-sep"></div>';
      });
      html += `</div><div class="ai-fs" data-hl="fillstroke"><div class="ai-fs-squares"><button class="ai-fs-sq ai-fs-stroke" data-slot="stroke" title="Stroke (X)"><i></i></button><button class="ai-fs-sq ai-fs-fill" data-slot="fill" title="Fill (X)"><i></i></button></div>
        <div class="id-fmt" data-hl="format-toggle"><button data-fmt="0" title="Formatting affects container (frame)">▢</button><button data-fmt="1" title="Formatting affects text">T</button></div>
        <button class="id-preview" data-hl="preview-btn" title="Preview mode (W)">👁</button></div>`;
      this.$.toolbar.innerHTML = html;
    }

    /* -------------------------------------------------------------- bind */
    bind() {
      const $ = this.$;
      $.toolbar.addEventListener('pointerdown', (e) => { const b = e.target.closest('.ai-tool'); if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { clearTimeout(this._flyT); this._flyT = setTimeout(() => this.openFlyout(b, +b.dataset.group), 380); } });
      ['pointerup', 'pointerleave'].forEach((n) => $.toolbar.addEventListener(n, () => clearTimeout(this._flyT)));
      $.toolbar.addEventListener('contextmenu', (e) => { const b = e.target.closest('.ai-tool'); if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { e.preventDefault(); this.openFlyout(b, +b.dataset.group); } });
      $.toolbar.addEventListener('click', (e) => {
        const b = e.target.closest('.ai-tool');
        if (b) { if (!this._flyOpen) this.setTool(b.dataset.tool); return; }
        const sq = e.target.closest('.ai-fs-sq'); if (sq) { this.slot = sq.dataset.slot; this.renderToolbarState(); this.renderSwatches(); this.act('slot', { slot: this.slot }); return; }
        const f = e.target.closest('[data-fmt]'); if (f) { this.textMode = f.dataset.fmt === '1'; this.renderToolbarState(); this.act('formatTarget', { text: this.textMode }); return; }
        if (e.target.closest('.id-preview')) this.togglePreview();
      });
      $.toolbar.addEventListener('pointerover', (e) => { const b = e.target.closest('.ai-tool'); if (!b) return this.hideTip(); const t = TOOLS[b.dataset.tool]; this.showTip(b, `<b>${t.name}</b>${t.key ? ` <kbd>${t.key}</kbd>` : ''}<div>${t.tip}</div>${TOOL_GROUPS[+b.dataset.group].length > 1 ? '<em>Hold the mouse down to see hidden tools</em>' : ''}`); });
      $.toolbar.addEventListener('pointerout', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ai-tool')) this.hideTip(); });
      $.menus.addEventListener('click', (e) => { const m = e.target.closest('.ai-menu'); if (!m) return; if (this._openMenu === m.dataset.m) this.closeMenu(); else this.openMenu(m); });
      $.menus.addEventListener('pointerover', (e) => { const m = e.target.closest('.ai-menu'); if (m && this._openMenu && this._openMenu !== m.dataset.m) this.openMenu(m); });
      $.dropdown.addEventListener('click', (e) => { const it = e.target.closest('.ai-mi'); if (!it || it.classList.contains('disabled') || it.classList.contains('has-sub')) return; const fn = this._menuFns[it.dataset.i]; this.closeMenu(); if (fn) { fn(); this.act('menu', { item: it.dataset.l }); } });
      $.dock.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) this.showTab(t.dataset.tab); });
      const cv = $.cv;
      cv.addEventListener('pointerdown', (e) => this.onDown(e));
      cv.addEventListener('pointermove', (e) => this.onMove(e));
      cv.addEventListener('pointerup', (e) => this.onUp(e));
      cv.addEventListener('pointercancel', (e) => this.onUp(e));
      cv.addEventListener('dblclick', (e) => { const p = this.toDoc(e), hit = this.hitItem(p); if (hit && hit.type === 'text') { this.setTool('type', true); this.startEdit(hit); } else if (hit && (hit.type === 'image' || hit.frame)) { this.setTool('direct', true); } });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); if (e.ctrlKey || e.altKey || e.metaKey) this.zoomBy(Math.exp(-e.deltaY * 0.004), this.scrPt(e)); else { this.view.x -= e.deltaX; this.view.y -= e.deltaY; this.render(); } }, { passive: false });
      $.te.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); this.endEdit(); } });
      $.te.addEventListener('input', () => { this._teDirty = true; });
      $.te.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
      $.file.addEventListener('change', () => {
        const f = $.file.files && $.file.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { const key = 'user-' + uid(); const img = new Image(); img.onload = () => { window.PS_PHOTOS = window.PS_PHOTOS || {}; window.PS_PHOTOS[key] = { src: rd.result, w: img.width, h: img.height, label: f.name, sample: false }; this.photos[key] = img; this.placePhoto(key); }; img.src = rd.result; };
        rd.readAsDataURL(f); $.file.value = '';
      });
      this._onKey = (e) => this.onKey(e);
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('keyup', (e) => { if (e.key === ' ') { this.spaceHand = false; this.updateCursor(); } });
      document.addEventListener('pointerdown', (e) => {
        if (!this.root.contains(e.target)) { this.closeMenu(); this.closeFlyout(); this.closePop(); return; }
        if (!e.target.closest('.ai-menu') && !e.target.closest('.ai-dropdown')) this.closeMenu();
        if (!e.target.closest('.ai-flyout')) this.closeFlyout();
        if (!e.target.closest('.ai-pop') && !e.target.closest('[data-pop]')) this.closePop();
        if (this.editing && !e.target.closest('.id-te') && !e.target.closest('.ai-dock') && !e.target.closest('.id-control') && !e.target.closest('.ai-dropdown') && !e.target.closest('.ai-menu')) this.endEdit();
      }, true);
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe($.stage);
    }

    /* -------------------------------------------------------------- model */
    get objs() { return this.doc.items.filter((i) => i.page !== 'A'); }
    get layers() { return this.doc.items; }
    item(id) { return this.doc.items.find((i) => i.id === id); }
    selItems() { return this.doc.items.filter((i) => this.sel.has(i.id)); }
    story(it) { const h = this.chainHead(it); return this.doc.stories[h.story]; }
    chainHead(it) { let h = it, guard = 0; while (h.prev && guard++ < 50) h = this.item(h.prev) || h; return h; }
    chain(it) { const out = []; let f = this.chainHead(it), guard = 0; while (f && guard++ < 50) { out.push(f); f = f.next ? this.item(f.next) : null; } return out; }
    styleOf(p) { const s = this.doc.styles[p.style] || this.doc.styles['Basic Paragraph']; return { ...this.doc.styles['Basic Paragraph'], ...s, ...(p.ov || {}) }; }
    makeItem(d) {
      const it = Object.assign({ id: uid(), page: 0, type: 'rect', x: 72, y: 72, w: 200, h: 120, fill: 'none', stroke: 'none', sw: 1, wrap: false }, d);
      if (it.type === 'text') {
        Object.assign(it, { cols: it.cols || 1, inset: it.inset != null ? it.inset : 0, next: null, prev: null });
        if (!it.story) { const sid = uid(); this.doc.stories[sid] = { paras: (d.paras || [{ text: d.text || '', style: d.style || 'Basic Paragraph' }]).map((p) => (typeof p === 'string' ? { text: p, style: 'Basic Paragraph' } : { style: 'Basic Paragraph', ...p })) }; it.story = sid; }
        delete it.paras; delete it.text; delete it.style;
      }
      if (it.type === 'image') Object.assign(it, { photo: it.photo || null, ix: it.ix || 0, iy: it.iy || 0, is: it.is || 1, ellipse: !!it.ellipse });
      return it;
    }
    /** opts: {w,h,pages,margins,cols,gutter,styles,items,master:[items],name} */
    reset(opts = {}) {
      this.endEdit(true);
      this.doc = {
        name: opts.name || 'Untitled-1', w: opts.w || 595, h: opts.h || 842, margins: opts.margins || { t: 36, b: 36, l: 36, r: 36 }, cols: opts.cols || 1, gutter: opts.gutter || 12, bleed: 9,
        pages: Array.from({ length: opts.pages || 1 }, () => ({ id: uid(), master: 'A' })), styles: { ...DEFAULT_STYLES(), ...(opts.styles || {}) }, stories: {}, items: [],
      };
      (opts.master || []).forEach((d) => this.doc.items.push(this.makeItem({ ...d, page: 'A' })));
      const byName = {};
      (opts.items || []).forEach((d) => { const it = this.makeItem(d); this.doc.items.push(it); if (d.name) byName[d.name] = it; });
      (opts.items || []).forEach((d) => { if (d.threadTo && byName[d.name] && byName[d.threadTo]) this.linkFrames(byName[d.name], byName[d.threadTo], true); });
      this.sel = new Set(opts.select != null && this.doc.items.filter((i) => i.page !== 'A')[opts.select] ? [this.doc.items.filter((i) => i.page !== 'A')[opts.select].id] : []);
      this.masterMode = false; this.preview = false; this.textMode = false;
      this.$.docname.textContent = this.doc.name + '.indd';
      this.hist = []; this.fut = []; this.clearLog();
      this.tab = opts.tab || 'properties';
      this.setTool(opts.tool || 'select', true);
      this.commit(true);
      this._fitted = false; this.fit();
      this.renderAll();
    }

    /* ----------------------------------------------------------- history */
    snapshot() { return JSON.stringify(this.doc); }
    commit(silent) { const s = this.snapshot(); if (this.hist[this.hist.length - 1] === s) return; this.hist.push(s); if (this.hist.length > 100) this.hist.shift(); this.fut = []; if (!silent) this.emit('change'); }
    restore(s) { this.doc = JSON.parse(s); this.sel = new Set([...this.sel].filter((id) => this.item(id))); this.renderAll(); this.emit('change'); }
    undo() { if (this.editing) this.endEdit(); if (this.hist.length < 2) return this.toast('Nothing to undo'); this.fut.push(this.hist.pop()); this.restore(this.hist[this.hist.length - 1]); this.act('undo'); }
    redo() { if (!this.fut.length) return this.toast('Nothing to redo'); const s = this.fut.pop(); this.hist.push(s); this.restore(s); this.act('redo'); }

    /* ---------------------------------------------------- geometry */
    pageTop(i) { return i === 'A' ? 0 : i * (this.doc.h + PAGE_GAP); }
    visiblePages() { return this.masterMode ? ['A'] : this.doc.pages.map((_, i) => i); }
    pageAt(p) {
      for (const i of this.visiblePages()) { const t = this.pageTop(i); if (p.y >= t - PAGE_GAP / 2 && p.y < t + this.doc.h + PAGE_GAP / 2) return i; }
      return this.masterMode ? 'A' : clamp(Math.floor(p.y / (this.doc.h + PAGE_GAP)), 0, this.doc.pages.length - 1);
    }
    abs(it) { return { x: it.x, y: it.y + this.pageTop(it.page), w: it.w, h: it.h }; }
    itemsOn(page) { return this.doc.items.filter((i) => i.page === page); }
    hitItem(p) {
      const page = this.pageAt(p), list = this.itemsOn(page).slice().reverse();
      for (const it of list) {
        const a = this.abs(it), pad = 4 / this.view.z;
        if (it.type === 'line') { const d = this.distSeg(p, { x: a.x, y: a.y }, { x: a.x + a.w, y: a.y + a.h }); if (d < 6 / this.view.z) return it; continue; }
        if (p.x >= a.x - pad && p.y >= a.y - pad && p.x <= a.x + a.w + pad && p.y <= a.y + a.h + pad) return it;
      }
      return null;
    }
    distSeg(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1; const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L, 0, 1); return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)); }
    norm(it) { if (it.type === 'line') return; if (it.w < 0) { it.x += it.w; it.w = -it.w; } if (it.h < 0) { it.y += it.h; it.h = -it.h; } }

    /* ------------------------------------------------------- text engine */
    font(st) { return `${st.weight || 400} ${st.size}px ${fontStack(st.font)}`; }
    /** lay out a whole threaded story → {frames: {id: lines[]}, overset} */
    layoutStory(head) {
      const frames = this.chain(head), story = this.doc.stories[head.story];
      const out = { frames: {}, overset: false };
      frames.forEach((f) => { out.frames[f.id] = []; });
      if (!story) return out;
      const m = this._mctx || (this._mctx = mkCanvas(1, 1).getContext('2d'));
      let fi = 0, col = 0, y = 0;
      const geom = (f) => { const inset = f.inset || 0, iw = f.w - inset * 2, cols = Math.max(1, f.cols || 1), g = this.doc.gutter; const cw = (iw - g * (cols - 1)) / cols; return { inset, cw, cols, g, ih: f.h - inset * 2 }; };
      const obstacles = (f) => this.doc.items.filter((o) => o.wrap && o.id !== f.id && (o.page === f.page || o.page === 'A') && !frames.includes(o)).map((o) => ({ x: o.x - 8, y: o.y - 8, w: o.w + 16, h: o.h + 16 }));
      const segmentsFor = (f, colX, cw, ly, lh) => {
        let segs = [[colX, colX + cw]];
        obstacles(f).forEach((o) => {
          if (o.y > ly + lh || o.y + o.h < ly) return;
          const ns = [];
          segs.forEach(([a, b]) => { if (o.x >= b || o.x + o.w <= a) ns.push([a, b]); else { if (o.x > a) ns.push([a, o.x]); if (o.x + o.w < b) ns.push([o.x + o.w, b]); } });
          segs = ns;
        });
        return segs.filter(([a, b]) => b - a >= 24);
      };
      const slot = (lh) => {
        while (fi < frames.length) {
          const f = frames[fi], gm = geom(f);
          const fitsFirst = y === 0 && lh <= gm.ih * 1.4; // let a big first line squeeze in (friendlier for beginners)
          if (y + lh > gm.ih + 0.01 && !fitsFirst) { col++; y = 0; if (col >= gm.cols) { col = 0; fi++; } continue; }
          const colX = f.x + gm.inset + col * (gm.cw + gm.g), ly = f.y + gm.inset + y;
          const segs = segmentsFor(f, colX, gm.cw, ly, lh);
          if (!segs.length) { y += lh; continue; }
          const r = { f, segs, ly };
          return r;
        }
        return null;
      };
      for (let pi = 0; pi < story.paras.length; pi++) {
        const para = story.paras[pi], st = this.styleOf(para), lh = st.leading || st.size * 1.2;
        m.font = this.font(st);
        const words = String(para.text).split(/(\s+)/).filter((w) => w.length);
        let wi = 0;
        if (!words.length) { const s = slot(lh); if (!s) { out.overset = true; return out; } y += lh; continue; }
        while (wi < words.length) {
          const s = slot(lh);
          if (!s) { out.overset = true; return out; }
          for (const [a, b] of s.segs) {
            const width = b - a;
            let line = '', lw = 0; const lineWords = [];
            while (wi < words.length) {
              const w = words[wi], ww = m.measureText(w).width;
              if (!line && /^\s+$/.test(w)) { wi++; continue; }
              if (lw + ww > width && line) break;
              if (lw + ww > width && !line) { // very long word: hard break
                let cut = w.length; while (cut > 1 && m.measureText(w.slice(0, cut)).width > width) cut--;
                lineWords.push(w.slice(0, cut)); words[wi] = w.slice(cut); line += w.slice(0, cut); lw = m.measureText(line).width; break;
              }
              line += w; lw += ww; lineWords.push(w); wi++;
            }
            const trimmed = line.replace(/\s+$/, '');
            const last = wi >= words.length;
            out.frames[s.f.id].push({ x: a, y: s.ly, w: width, text: trimmed, st, last, page: s.f.page, base: s.ly + st.size * 0.85 + (lh - st.size * 1.2) / 2 + st.size * 0.1 });
            if (wi >= words.length) break;
          }
          y += lh;
        }
        y += st.spaceAfter || 0;
      }
      return out;
    }
    layoutAll() {
      const res = {};
      this.doc.items.forEach((it) => { if (it.type === 'text' && !it.prev) { const L = this.layoutStory(it); Object.assign(res, L.frames); this.chain(it).forEach((f) => { f._overset = L.overset; }); } });
      this._layout = res;
      return res;
    }

    /* ------------------------------------------------------- rendering */
    getPhoto(k) {
      if (this.photos[k]) return this.photos[k].complete && this.photos[k].naturalWidth ? this.photos[k] : null;
      const p = (window.PS_PHOTOS || {})[k]; if (!p) return null;
      const img = new Image(); img.onload = () => this.render(); img.src = p.src; this.photos[k] = img; return null;
    }
    drawItem(g, it, pageNum, topY, forExport) {
      const x = it.x, y = it.y + topY, w = it.w, h = it.h;
      g.save();
      if (it.type === 'line') {
        g.strokeStyle = it.stroke === 'none' ? '#000' : it.stroke; g.lineWidth = Math.max(0.5, it.sw);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.stroke(); g.restore(); return;
      }
      const shape = () => { g.beginPath(); if (it.type === 'ellipse' || it.ellipse) g.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); else g.rect(x, y, w, h); };
      if (it.fill !== 'none') { shape(); g.fillStyle = it.fill; g.fill(); }
      if (it.type === 'image') {
        const img = it.photo && this.getPhoto(it.photo);
        if (img) {
          g.save(); shape(); g.clip();
          const iw = img.naturalWidth * it.is, ih = img.naturalHeight * it.is;
          g.drawImage(img, x + it.ix, y + it.iy, iw, ih);
          g.restore();
        } else if (!forExport && !this.preview) {
          g.strokeStyle = '#7f9fff'; g.lineWidth = 0.75 / this.view.z; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke();
        }
      }
      if (it.type === 'text') {
        const lines = (this._layout || {})[it.id] || [];
        if (!(this.editing && this.chain(this.item(this.editing)).includes(it))) {
          lines.forEach((ln) => {
            g.font = this.font(ln.st); g.fillStyle = ln.st.color || '#000'; g.textBaseline = 'alphabetic';
            const txt = ln.text.split(PN).join(pageNum);
            const tw = g.measureText(txt).width;
            const ly = ln.base + topY; // layout is page-relative
            if (ln.st.align === 'justify' && !ln.last && txt.includes(' ')) {
              const words = txt.split(' '), gap = (ln.w - words.reduce((a, s) => a + g.measureText(s).width, 0)) / (words.length - 1);
              let cx = ln.x; words.forEach((s) => { g.fillText(s, cx, ly); cx += g.measureText(s).width + gap; });
            } else {
              const lx = ln.st.align === 'center' ? ln.x + (ln.w - tw) / 2 : ln.st.align === 'right' ? ln.x + ln.w - tw : ln.x;
              g.fillText(txt, lx, ly);
            }
          });
        }
      }
      if (it.stroke !== 'none' && it.sw > 0) { shape(); g.strokeStyle = it.stroke; g.lineWidth = it.sw; g.stroke(); }
      g.restore();
    }
    drawPage(g, page, topY, forExport) {
      const D = this.doc, num = page === 'A' ? 'A' : String(page + 1);
      g.fillStyle = '#FFFFFF'; g.fillRect(0, topY, D.w, D.h);
      if (page !== 'A') this.itemsOn('A').forEach((it) => this.drawItem(g, { ...it, page }, num, topY, forExport));
      this.itemsOn(page).forEach((it) => this.drawItem(g, it, num, topY, forExport));
    }
    render() {
      if (!this.W) return;
      this.layoutAll();
      const g = this.$.cv.getContext('2d'), d = DPR(), { z, x, y } = this.view, D = this.doc;
      g.setTransform(d, 0, 0, d, 0, 0);
      g.fillStyle = this.preview ? '#1e1e1e' : '#3a3a3a'; g.fillRect(0, 0, this.W, this.H);
      g.save(); g.translate(x, y); g.scale(z, z);
      this.visiblePages().forEach((page) => {
        const top = this.pageTop(page);
        if (!this.preview) { g.strokeStyle = '#ff3b3b'; g.lineWidth = 0.6 / z; g.strokeRect(-D.bleed, top - D.bleed, D.w + D.bleed * 2, D.h + D.bleed * 2); }
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(3 / z, top + 3 / z, D.w, D.h);
        g.save(); g.beginPath(); g.rect(this.preview ? 0 : -D.bleed, top - (this.preview ? 0 : D.bleed), D.w + (this.preview ? 0 : D.bleed * 2), D.h + (this.preview ? 0 : D.bleed * 2)); g.clip();
        this.drawPage(g, page, top, false);
        g.restore();
        if (!this.preview) {
          const M = D.margins, cw = (D.w - M.l - M.r - D.gutter * (D.cols - 1)) / D.cols;
          g.lineWidth = 0.75 / z;
          g.strokeStyle = '#d63bd6'; g.strokeRect(M.l, top + M.t, D.w - M.l - M.r, D.h - M.t - M.b);
          g.strokeStyle = '#8a5cf6';
          for (let c = 1; c < D.cols; c++) { const cx = M.l + c * cw + (c - 1) * D.gutter; g.beginPath(); g.moveTo(cx, top + M.t); g.lineTo(cx, top + D.h - M.b); g.moveTo(cx + D.gutter, top + M.t); g.lineTo(cx + D.gutter, top + D.h - M.b); g.stroke(); }
          // frame edges
          this.itemsOn(page).forEach((it) => {
            if (it.type === 'line') return;
            g.strokeStyle = it.type === 'text' ? 'rgba(80,140,255,.55)' : 'rgba(80,140,255,.35)';
            g.lineWidth = 0.6 / z; g.strokeRect(it.x, it.y + top, it.w, it.h);
          });
          g.fillStyle = '#c9c9c9'; g.font = `${11 / z}px "Source Sans 3",sans-serif`;
          g.fillText(page === 'A' ? 'A-Master' : `Page ${page + 1}`, 0, top - 14 / z);
        }
      });
      // selection, ports, threads
      if (!this.preview) {
        const items = this.selItems().filter((it) => this.visiblePages().includes(it.page));
        items.forEach((it) => {
          const a = this.abs(it);
          g.lineWidth = 1 / z; g.strokeStyle = '#2d7cff';
          if (it.type === 'line') { g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + a.w, a.y + a.h); g.stroke(); [[a.x, a.y], [a.x + a.w, a.y + a.h]].forEach(([hx, hy]) => { g.fillStyle = '#fff'; g.fillRect(hx - 3.5 / z, hy - 3.5 / z, 7 / z, 7 / z); g.strokeRect(hx - 3.5 / z, hy - 3.5 / z, 7 / z, 7 / z); }); return; }
          if (this.tool === 'direct' && it.type === 'image' && it.photo) {
            const img = this.getPhoto(it.photo);
            if (img) { g.strokeStyle = '#c87b00'; g.strokeRect(a.x + it.ix, a.y + it.iy, img.naturalWidth * it.is, img.naturalHeight * it.is); }
          }
          g.strokeStyle = '#2d7cff'; g.strokeRect(a.x, a.y, a.w, a.h);
          this.handles(a).forEach(([hx, hy]) => { g.fillStyle = '#fff'; g.fillRect(hx - 3.5 / z, hy - 3.5 / z, 7 / z, 7 / z); g.strokeRect(hx - 3.5 / z, hy - 3.5 / z, 7 / z, 7 / z); });
          if (it.type === 'image' && it.photo) { const cx = a.x + a.w / 2, cy = a.y + a.h / 2; g.beginPath(); g.arc(cx, cy, 9 / z, 0, 7); g.arc(cx, cy, 4 / z, 0, 7); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2 / z; g.stroke(); }
        });
        // text ports on all text frames of visible pages
        this.doc.items.filter((it) => it.type === 'text' && this.visiblePages().includes(it.page)).forEach((it) => {
          if (!this.sel.has(it.id) && !it._overset && !(this.threadFrom)) return;
          const a = this.abs(it), s = 8 / z;
          const inP = { x: a.x + 14 / z, y: a.y }, outP = { x: a.x + a.w - 14 / z, y: a.y + a.h };
          [inP, outP].forEach((pt, i) => {
            g.fillStyle = '#fff'; g.strokeStyle = '#2d7cff'; g.lineWidth = 1 / z;
            g.fillRect(pt.x - s / 2, pt.y - s / 2, s, s); g.strokeRect(pt.x - s / 2, pt.y - s / 2, s, s);
            const linked = i === 0 ? it.prev : it.next;
            if (i === 1 && it._overset && !it.next) { g.strokeStyle = '#e00'; g.lineWidth = 1.4 / z; g.beginPath(); g.moveTo(pt.x - s / 3, pt.y); g.lineTo(pt.x + s / 3, pt.y); g.moveTo(pt.x, pt.y - s / 3); g.lineTo(pt.x, pt.y + s / 3); g.stroke(); g.strokeStyle = '#e00'; g.strokeRect(pt.x - s / 2, pt.y - s / 2, s, s); }
            else if (linked) { g.fillStyle = '#2d7cff'; g.beginPath(); g.moveTo(pt.x - s / 4, pt.y - s / 3); g.lineTo(pt.x + s / 3, pt.y); g.lineTo(pt.x - s / 4, pt.y + s / 3); g.fill(); }
          });
          if (this.sel.has(it.id) && it.next) { const n = this.item(it.next); if (n && this.visiblePages().includes(n.page)) { const b = this.abs(n); g.strokeStyle = '#2d7cff'; g.setLineDash([4 / z, 3 / z]); g.beginPath(); g.moveTo(outP.x, outP.y); g.lineTo(b.x + 14 / z, b.y); g.stroke(); g.setLineDash([]); } }
        });
      }
      if (this.drag && this.drag.mode === 'draw' && this.drag.cur) {
        const d0 = this.drag; g.strokeStyle = '#2d7cff'; g.lineWidth = 1 / z; g.setLineDash([4 / z, 3 / z]);
        if (d0.kind === 'line') { g.beginPath(); g.moveTo(d0.s.x, d0.s.y); g.lineTo(d0.cur.x, d0.cur.y); g.stroke(); } else g.strokeRect(d0.s.x, d0.s.y, d0.cur.x - d0.s.x, d0.cur.y - d0.s.y);
        g.setLineDash([]);
      }
      g.restore();
      if (this.threadFrom) { g.fillStyle = 'rgba(45,124,255,.9)'; g.font = '12px "Source Sans 3",sans-serif'; const m = this.mouseScr || { x: 20, y: 20 }; g.fillText('¶ loaded text — click a frame (or empty space) to flow it', m.x + 14, m.y + 22); }
      if (this.placing) { g.fillStyle = 'rgba(45,124,255,.9)'; g.font = '12px "Source Sans 3",sans-serif'; const m = this.mouseScr || { x: 20, y: 20 }; g.fillText('🖼 click inside a frame — or on the page — to place the photo', m.x + 14, m.y + 22); }
      if (this._hint) { const h = this._hint; g.font = '11px "Source Sans 3",sans-serif'; const tw = g.measureText(h.text).width + 14; g.fillStyle = 'rgba(70,70,70,.92)'; g.fillRect(h.x, h.y, tw, 20); g.fillStyle = '#fff'; g.fillText(h.text, h.x + 7, h.y + 14); this._hint = null; }
      this.$.tabZoom.textContent = `@ ${Math.round(z * 100)}%${this.masterMode ? ' [A-Master]' : ''}${this.preview ? ' [Preview]' : ''}`;
      this.renderRulers(); this.renderStatus();
    }
    handles(a) { return [[a.x, a.y], [a.x + a.w / 2, a.y], [a.x + a.w, a.y], [a.x + a.w, a.y + a.h / 2], [a.x + a.w, a.y + a.h], [a.x + a.w / 2, a.y + a.h], [a.x, a.y + a.h], [a.x, a.y + a.h / 2]]; }
    renderRulers() {
      if (!this.W) return;
      const dpr = DPR();
      const draw = (cv, horiz) => {
        const len = horiz ? this.W : this.H, th = 18;
        cv.width = (horiz ? len : th) * dpr; cv.height = (horiz ? th : len) * dpr; cv.style.width = (horiz ? len : th) + 'px'; cv.style.height = (horiz ? th : len) + 'px';
        const c = cv.getContext('2d'); c.scale(dpr, dpr);
        c.fillStyle = '#323232'; c.fillRect(0, 0, horiz ? len : th, horiz ? th : len);
        c.strokeStyle = '#8a8a8a'; c.fillStyle = '#b8b8b8'; c.font = '9px "Source Sans 3", sans-serif';
        const z = this.view.z, off = horiz ? this.view.x : this.view.y;
        const step = [6, 12, 36, 72, 144, 288].find((s) => s * z >= 50) || 288;
        const start = Math.floor(-off / z / step) * step, end = (len - off) / z;
        c.beginPath();
        for (let v = start; v <= end; v += step / 6) {
          const p = Math.round(v * z + off) + 0.5, major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
          if (horiz) { c.moveTo(p, th); c.lineTo(p, th - (major ? th : 4)); } else { c.moveTo(th, p); c.lineTo(th - (major ? th : 4), p); }
          if (major) { const lbl = String(Math.round(v)); if (horiz) c.fillText(lbl, p + 3, 9); else { c.save(); c.translate(9, p + 3); c.rotate(-Math.PI / 2); c.fillText(lbl, -c.measureText(lbl).width - 3, 0); c.restore(); } }
        }
        c.stroke();
      };
      draw(this.$.rh, true); draw(this.$.rv, false);
    }
    renderStatus() {
      const pg = this.masterMode ? 'A-Master' : String(this.currentPage() + 1);
      this.$.status.innerHTML = `<span class="ps-zoomv">${Math.round(this.view.z * 100)}%</span><span class="ai-st-ab">◂ <b>${pg}</b> ▸</span><span>${this.doc.pages.length} page${this.doc.pages.length > 1 ? 's' : ''} · ${this.doc.w} × ${this.doc.h} pt</span><span class="ai-st-tool">${TOOLS[this.tool].name.replace(' Tool', '')}</span>${this.anyOverset() ? '<span class="id-overset" title="Some text does not fit">● Overset text</span>' : '<span class="id-noerr">● No errors</span>'}`;
    }
    anyOverset() { return this.doc.items.some((i) => i.type === 'text' && i._overset && !i.next); }
    currentPage() { const cy = (this.H / 2 - this.view.y) / this.view.z; return clamp(Math.floor(cy / (this.doc.h + PAGE_GAP)), 0, this.doc.pages.length - 1); }

    /* --------------------------------------------------------- view */
    resize() {
      const r = this.$.wrap.getBoundingClientRect();
      if (!r.width) return;
      this.W = r.width; this.H = r.height;
      const c = this.$.cv; c.width = r.width * DPR(); c.height = r.height * DPR(); c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      if (!this._fitted) { this.fit(); this._fitted = true; }
      this.render();
    }
    fit(user, page) {
      if (!this.W) return;
      const D = this.doc, z = Math.min((this.W - 80) / D.w, (this.H - 70) / D.h);
      this.view.z = clamp(z, 0.05, 8);
      const top = this.pageTop(page != null ? page : this.masterMode ? 'A' : 0);
      this.view.x = (this.W - D.w * this.view.z) / 2; this.view.y = (this.H - D.h * this.view.z) / 2 - top * this.view.z;
      this.render();
      if (user) this.act('zoom', { fit: true });
    }
    goToPage(i) { this.masterMode = false; this.fit(false, i); this.renderAll(); this.act('pageSelect', { i }); }
    zoomBy(f, at) { at = at || { x: this.W / 2, y: this.H / 2 }; const old = this.view.z, z = clamp(old * f, 0.05, 12); this.view.x = at.x - ((at.x - this.view.x) / old) * z; this.view.y = at.y - ((at.y - this.view.y) / old) * z; this.view.z = z; this.render(); this.act('zoom', { z, dir: z > old ? 'in' : 'out' }); }
    toScr(p) { return { x: p.x * this.view.z + this.view.x, y: p.y * this.view.z + this.view.y }; }
    toDoc(e) { const r = this.$.cv.getBoundingClientRect(); return { x: (e.clientX - r.left - this.view.x) / this.view.z, y: (e.clientY - r.top - this.view.y) / this.view.z }; }
    scrPt(e) { const r = this.$.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    /** page-1 coordinates → client (for the coach's ghost cursor) */
    docToClient(p) { const r = this.$.cv.getBoundingClientRect(), s = this.toScr({ x: p.x, y: p.y + this.pageTop(this.masterMode ? 'A' : this.currentPage()) }); return { x: r.left + s.x, y: r.top + s.y }; }
    togglePreview() { this.preview = !this.preview; this.render(); this.renderToolbarState(); this.act('preview', { on: this.preview }); }

    /* ------------------------------------------------------ pointer */
    onDown(e) {
      if (e.button === 1 || (e.button === 0 && (this.spaceHand || this.tool === 'hand'))) { this.drag = { mode: 'pan', s: this.scrPt(e), v: { ...this.view } }; this.$.cv.setPointerCapture(e.pointerId); return; }
      if (e.button !== 0) return;
      this.closeMenu(); this.root.focus({ preventScroll: true });
      this.$.cv.setPointerCapture(e.pointerId);
      const p = this.toDoc(e), page = this.pageAt(p), top = this.pageTop(page);
      const hit = this.hitItem(p);
      if (this.placing) {
        const key = this.placing; this.placing = null;
        if (hit && (hit.type === 'image' || hit.type === 'rect' || hit.type === 'ellipse')) { this.putPhotoIn(hit, key); return; }
        const ph = (window.PS_PHOTOS || {})[key], sc = Math.min(1, (this.doc.w * 0.5) / ph.w);
        const it = this.makeItem({ type: 'image', page, x: p.x, y: p.y - top, w: ph.w * sc, h: ph.h * sc, photo: key, is: sc });
        this.doc.items.push(it); this.sel = new Set([it.id]); this.commit(); this.renderAll(); this.act('place', { photo: key, into: false });
        return;
      }
      if (this.threadFrom) {
        const src = this.item(this.threadFrom); this.threadFrom = null;
        if (hit && hit.type === 'text' && hit !== src) { this.linkFrames(src, hit); return; }
        const it = this.makeItem({ type: 'text', page, x: p.x, y: p.y - top, w: src.w, h: Math.min(src.h, this.doc.h - (p.y - top) - 20), story: 'tmp' });
        it.story = null; delete it.story;
        this.doc.items.push(it); this.linkFrames(src, it);
        return;
      }
      if (this.tool === 'zoom') return this.zoomBy(e.altKey ? 0.5 : 2, this.scrPt(e));
      if (['type', 'line', 'frame', 'eframe', 'rect', 'ellipse'].includes(this.tool)) {
        if (this.tool === 'type' && hit && hit.type === 'text') { e.preventDefault(); this.sel = new Set([hit.id]); return this.startEdit(hit, false, { x: e.clientX, y: e.clientY }); }
        this.drag = { mode: 'draw', kind: this.tool, s: p, page };
        return;
      }
      // selection: handles / ports first
      const sl = this.selItems()[0];
      if (sl && this.tool === 'select') {
        const a = this.abs(sl), sp = this.scrPt(e);
        if (sl.type === 'text') {
          const op = this.toScr({ x: a.x + a.w - 14 / this.view.z, y: a.y + a.h });
          if (Math.hypot(op.x - sp.x, op.y - sp.y) < 8) { this.threadFrom = sl.id; this.toast('Loaded text ¶ — now click another text frame, or click on the page to make a new one.'); this.act('portClick'); this.render(); return; }
        }
        const hs = sl.type === 'line' ? [[a.x, a.y], [a.x + a.w, a.y + a.h]] : this.handles(a);
        const hi = hs.findIndex(([hx, hy]) => { const s = this.toScr({ x: hx, y: hy }); return Math.hypot(s.x - sp.x, s.y - sp.y) < 7; });
        if (hi >= 0) { this.drag = { mode: 'resize', id: sl.id, h: hi, o: clone(sl), s: p, line: sl.type === 'line' }; return; }
      }
      if (this.tool === 'direct' && hit && hit.type === 'image' && hit.photo) { this.sel = new Set([hit.id]); this.drag = { mode: 'content', id: hit.id, s: p, ix: hit.ix, iy: hit.iy }; this.renderAll(); return; }
      if (!hit) { if (this.sel.size) { this.sel.clear(); this.renderAll(); } return; }
      if (e.shiftKey) { this.sel.has(hit.id) ? this.sel.delete(hit.id) : this.sel.add(hit.id); }
      else if (!this.sel.has(hit.id)) this.sel = new Set([hit.id]);
      this.renderAll();
      this.act('select', { kind: hit.type });
      this.drag = { mode: 'move', s: p, items: this.selItems().map((i) => ({ id: i.id, x: i.x, y: i.y })) };
    }
    onMove(e) {
      const p = this.toDoc(e);
      this.mouseScr = this.scrPt(e);
      const d = this.drag;
      if (!d) { if (this.threadFrom || this.placing) this.render(); return; }
      if (d.mode === 'pan') { const s = this.scrPt(e); this.view.x = d.v.x + s.x - d.s.x; this.view.y = d.v.y + s.y - d.s.y; this.render(); return; }
      if (d.mode === 'draw') {
        let q = p;
        if (e.shiftKey) { if (d.kind === 'line') { const dx = p.x - d.s.x, dy = p.y - d.s.y, a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), L = Math.hypot(dx, dy); q = { x: d.s.x + Math.cos(a) * L, y: d.s.y + Math.sin(a) * L }; } else { const m = Math.max(Math.abs(p.x - d.s.x), Math.abs(p.y - d.s.y)); q = { x: d.s.x + Math.sign(p.x - d.s.x || 1) * m, y: d.s.y + Math.sign(p.y - d.s.y || 1) * m }; } }
        d.cur = q; this._hint = { text: `W: ${Math.round(Math.abs(q.x - d.s.x))} pt  H: ${Math.round(Math.abs(q.y - d.s.y))} pt`, x: this.mouseScr.x + 14, y: this.mouseScr.y + 14 }; this.render(); return;
      }
      if (d.mode === 'move') {
        let dx = p.x - d.s.x, dy = p.y - d.s.y;
        if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
        // snap to margins / page center
        const first = this.item(d.items[0].id);
        if (first && first.type !== 'line') {
          const M = this.doc.margins, tol = 5 / this.view.z, nx = d.items[0].x + dx, ny = d.items[0].y + dy;
          const xs = [M.l, this.doc.w - M.r - first.w, (this.doc.w - first.w) / 2, 0, this.doc.w - first.w], ys = [M.t, this.doc.h - M.b - first.h, (this.doc.h - first.h) / 2, 0, this.doc.h - first.h];
          const bx = xs.find((v) => Math.abs(v - nx) < tol), by = ys.find((v) => Math.abs(v - ny) < tol);
          if (bx != null) dx = bx - d.items[0].x; if (by != null) dy = by - d.items[0].y;
        }
        d.moved = Math.hypot(dx, dy) > 0.5;
        d.items.forEach((o) => { const it = this.item(o.id); it.x = Math.round((o.x + dx) * 2) / 2; it.y = Math.round((o.y + dy) * 2) / 2; });
        this._hint = { text: `X: ${Math.round(first.x)} pt  Y: ${Math.round(first.y)} pt`, x: this.mouseScr.x + 14, y: this.mouseScr.y + 14 };
        this.render(); return;
      }
      if (d.mode === 'resize') {
        const it = this.item(d.id), o = d.o, dx = p.x - d.s.x, dy = p.y - d.s.y;
        if (d.line) { if (d.h === 0) { it.x = o.x + dx; it.y = o.y + dy; it.w = o.w - dx; it.h = o.h - dy; } else { it.w = o.w + dx; it.h = o.h + dy; } }
        else {
          const hx = [-1, 0, 1, 1, 1, 0, -1, -1][d.h], hy = [-1, -1, -1, 0, 1, 1, 1, 0][d.h];
          let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
          if (hx < 0) x1 += dx; if (hx > 0) x2 += dx; if (hy < 0) y1 += dy; if (hy > 0) y2 += dy;
          if (e.shiftKey && hx && hy) { const r = o.w / o.h; const nw = Math.abs(x2 - x1); const nh = nw / r; if (hy < 0) y1 = y2 - nh; else y2 = y1 + nh; }
          it.x = Math.min(x1, x2); it.y = Math.min(y1, y2); it.w = Math.max(4, Math.abs(x2 - x1)); it.h = Math.max(4, Math.abs(y2 - y1));
          if (it.type === 'image' && e.ctrlKey && it.photo) { const k = it.w / o.w; it.is = o.is * k; it.ix = o.ix * k; it.iy = o.iy * k; }
        }
        d.moved = true; this._hint = { text: `W: ${Math.round(it.w)} pt  H: ${Math.round(it.h)} pt`, x: this.mouseScr.x + 14, y: this.mouseScr.y + 14 };
        this.render(); return;
      }
      if (d.mode === 'content') { const it = this.item(d.id); it.ix = d.ix + (p.x - d.s.x); it.iy = d.iy + (p.y - d.s.y); d.moved = true; this.render(); }
    }
    onUp(e) {
      const d = this.drag;
      this.drag = null;
      try { this.$.cv.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!d) return;
      if (d.mode === 'draw') {
        const q = d.cur || d.s, top = this.pageTop(d.page);
        let w = q.x - d.s.x, h = q.y - d.s.y;
        const tiny = Math.abs(w) < 4 && Math.abs(h) < 4;
        if (tiny && d.kind === 'line') return this.render();
        if (tiny && d.kind === 'type') { this.toast('Drag to draw a text frame (or click inside an existing one)'); return this.render(); }
        if (tiny) { w = d.kind === 'type' ? 220 : 160; h = d.kind === 'type' ? 120 : 120; }
        const base = { page: d.page, x: d.s.x, y: d.s.y - top, w, h };
        let it;
        if (d.kind === 'line') it = this.makeItem({ ...base, type: 'line', stroke: '#000000', sw: 2 });
        else if (d.kind === 'type') it = this.makeItem({ ...base, type: 'text', text: '' });
        else if (d.kind === 'frame' || d.kind === 'eframe') it = this.makeItem({ ...base, type: 'image', ellipse: d.kind === 'eframe' });
        else it = this.makeItem({ ...base, type: d.kind === 'ellipse' ? 'ellipse' : 'rect', fill: '#FFC93C' });
        this.norm(it);
        this.doc.items.push(it);
        this.sel = new Set([it.id]);
        if (d.kind === 'type') { this.renderAll(); this.startEdit(it, true); return; }
        this.commit(); this.renderAll();
        this.act('create', { kind: d.kind, frame: it.type === 'image' });
        return;
      }
      if (d.mode === 'move' && d.moved) { this.commit(); this.renderAll(); this.act('move'); return; }
      if (d.mode === 'resize' && d.moved) { const it = this.item(d.id); this.norm(it); this.commit(); this.renderAll(); this.act('resize'); return; }
      if (d.mode === 'content' && d.moved) { this.commit(); this.renderAll(); this.act('contentMove'); return; }
      if (d.mode === 'pan') this.act('pan');
      this.render();
    }

    /* ------------------------------------------------------- text editing */
    paraCss(p) { const s = this.styleOf(p); return `font:${s.weight || 400} ${s.size * this.view.z}px ${fontStack(s.font)};line-height:${(s.leading || s.size * 1.2) * this.view.z}px;color:${s.color};text-align:${s.align === 'justify' ? 'justify' : s.align};margin:0 0 ${(s.spaceAfter || 0) * this.view.z}px 0;min-height:${(s.leading || s.size * 1.2) * this.view.z}px`; }
    startEdit(it, isNew, at) {
      const head = this.chainHead(it);
      this.editing = head.id; this.editingNew = !!isNew;
      const st = this.doc.stories[head.story], te = this.$.te, a = this.abs(head), s = this.toScr(a);
      te.hidden = false;
      te.innerHTML = st.paras.map((p) => `<div data-style="${esc(p.style)}" data-ov='${esc(JSON.stringify(p.ov || {}))}' style="${this.paraCss(p)}">${esc(p.text) || '<br>'}</div>`).join('') || `<div data-style="Basic Paragraph" style="${this.paraCss({ style: 'Basic Paragraph' })}"><br></div>`;
      Object.assign(te.style, { left: s.x + (head.inset || 0) * this.view.z + 'px', top: s.y + (head.inset || 0) * this.view.z + 'px', width: Math.max(40, (head.w - (head.inset || 0) * 2) * this.view.z) + 'px', minHeight: head.h * this.view.z + 'px', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,.92)', outline: '1px solid #2d7cff' });
      this.render();
      te.focus();
      setTimeout(() => {
        te.focus();
        let r = null;
        if (at && document.caretRangeFromPoint) r = document.caretRangeFromPoint(at.x, at.y);
        else if (at && document.caretPositionFromPoint) { const cp = document.caretPositionFromPoint(at.x, at.y); if (cp) { r = document.createRange(); r.setStart(cp.offsetNode, cp.offset); } }
        if (!r || !te.contains(r.startContainer)) { r = document.createRange(); r.selectNodeContents(te); r.collapse(false); }
        const sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r);
      }, 0);
      this.renderAll(true);
      this.act('editStart');
    }
    readEditor() {
      const te = this.$.te, paras = [];
      let lastStyle = 'Basic Paragraph', lastOv = {};
      const push = (text, style, ov) => { paras.push({ text, style: style || lastStyle, ov: ov || lastOv }); lastStyle = style || lastStyle; lastOv = ov || lastOv; };
      te.childNodes.forEach((n) => {
        if (n.nodeType === 3) { if (n.textContent.trim() || !paras.length) n.textContent.split('\n').forEach((t) => push(t)); return; }
        if (n.nodeName === 'BR') return;
        let ov = null; try { ov = n.dataset && n.dataset.ov ? JSON.parse(n.dataset.ov) : null; } catch (e) { ov = null; }
        n.innerText.replace(/\n$/, '').split('\n').forEach((t) => push(t, n.dataset ? n.dataset.style : null, ov));
      });
      if (!paras.length) paras.push({ text: '', style: 'Basic Paragraph', ov: {} });
      return paras;
    }
    caretPara() {
      const sel = window.getSelection(); if (!sel || !sel.anchorNode) return null;
      let n = sel.anchorNode; while (n && n.parentNode !== this.$.te) n = n.parentNode;
      return n && n.nodeType === 1 ? n : null;
    }
    endEdit(silent) {
      if (!this.editing) return;
      const head = this.item(this.editing);
      this.editing = null;
      const te = this.$.te;
      if (head) {
        const paras = this.readEditor();
        this.doc.stories[head.story].paras = paras;
      }
      te.hidden = true; te.innerHTML = '';
      this.renderAll();
      if (!silent && head && this.item(head.id)) { this.commit(); this.act('type', { isNew: this.editingNew, text: this.doc.stories[head.story].paras.map((p) => p.text).join('\n') }); }
      if (!silent && this.tool === 'type') this.setTool('select', true);
    }

    /* ------------------------------------------------------- commands */
    linkFrames(a, b, silent) {
      if (!a || !b || a === b) return;
      if (this.chain(b).includes(a)) return this.toast('Those frames are already linked');
      // b gives up its own story (appending its text to the chain's story)
      const story = this.doc.stories[this.chainHead(a).story];
      if (b.story && this.doc.stories[b.story] && b.story !== story) { const extra = this.doc.stories[b.story].paras.filter((p) => p.text.trim()); story.paras.push(...extra); delete this.doc.stories[b.story]; }
      delete b.story;
      if (a.next) { const old = this.item(a.next); if (old) old.prev = null; }
      a.next = b.id; b.prev = a.id;
      if (!silent) { this.sel = new Set([b.id]); this.commit(); this.renderAll(); this.act('thread'); }
    }
    unthread(it) { if (!it.next) return; const n = this.item(it.next); if (n) { n.prev = null; const sid = uid(); this.doc.stories[sid] = { paras: [{ text: '', style: 'Basic Paragraph' }] }; n.story = sid; } it.next = null; this.commit(); this.renderAll(); this.act('unthread'); }
    deleteSel() {
      if (!this.sel.size) return;
      this.selItems().forEach((it) => {
        if (it.type === 'text') {
          const prev = it.prev && this.item(it.prev), next = it.next && this.item(it.next);
          if (prev) prev.next = next ? next.id : null;
          if (next) { next.prev = prev ? prev.id : null; if (!prev) next.story = it.story; }
        }
      });
      this.doc.items = this.doc.items.filter((i) => !this.sel.has(i.id));
      this.sel.clear(); this.commit(); this.renderAll(); this.act('delete');
    }
    duplicate() {
      const list = this.selItems(); if (!list.length) return;
      const news = list.map((it) => { const n = clone(it); n.id = uid(); n.x += 12; n.y += 12; if (n.type === 'text') { n.prev = null; n.next = null; const sid = uid(); this.doc.stories[sid] = clone(this.story(it)); n.story = sid; } return n; });
      this.doc.items.push(...news); this.sel = new Set(news.map((n) => n.id)); this.commit(); this.renderAll(); this.act('duplicate');
    }
    arrange(how) {
      const sel = this.selItems(); if (!sel.length) return;
      const rest = this.doc.items.filter((i) => !this.sel.has(i.id));
      this.doc.items = how === 'front' ? rest.concat(sel) : sel.concat(rest);
      this.commit(); this.renderAll(); this.act('arrange', { how });
    }
    applySwatch(c) {
      const sel = this.selItems();
      if (this.editing || this.textMode) {
        const target = this.editing ? null : sel.filter((i) => i.type === 'text');
        if (this.editing) { const d = this.caretPara(); if (d) { const ov = { ...JSON.parse(d.dataset.ov || '{}'), color: c === 'none' ? '#000000' : c }; d.dataset.ov = JSON.stringify(ov); d.style.color = ov.color; } this.act('fill', { target: 'text', c }); return; }
        target.forEach((it) => this.story(it).paras.forEach((p) => { p.ov = { ...(p.ov || {}), color: c === 'none' ? '#000000' : c }; }));
        if (target.length) { this.commit(); this.renderAll(); this.act('fill', { target: 'text', c }); return; }
      }
      if (!sel.length) return this.toast('Select a frame first, then click a swatch');
      sel.forEach((it) => { if (it.type === 'line') it.stroke = c === 'none' ? '#000000' : c; else it[this.slot] = c; if (this.slot === 'stroke' && c !== 'none' && !it.sw) it.sw = 1; });
      this.commit(); this.renderAll(); this.act('fill', { target: this.slot, c });
    }
    /** change a character/paragraph property. While typing: the caret paragraph. Otherwise: every paragraph in the selected stories */
    setTextProp(k, v) {
      if (this.editing) {
        const d = this.caretPara() || this.$.te.firstChild;
        if (d && d.dataset) { const ov = { ...JSON.parse(d.dataset.ov || '{}'), [k]: v }; d.dataset.ov = JSON.stringify(ov); d.setAttribute('style', this.paraCss({ style: d.dataset.style, ov })); }
        this.act(['align', 'spaceAfter'].includes(k) ? 'paraProp' : 'charProp', { k, v });
        return;
      }
      const texts = this.selItems().filter((i) => i.type === 'text');
      if (!texts.length) return this.toast('Select a text frame first');
      const seen = new Set();
      texts.forEach((it) => { const s = this.story(it); if (seen.has(s)) return; seen.add(s); s.paras.forEach((p) => { p.ov = { ...(p.ov || {}), [k]: v }; if (k === 'size' && !(p.ov.leadingSet)) p.ov.leading = Math.round(v * 1.2 * 10) / 10; }); });
      this.commit(); this.renderAll();
      this.act(['align', 'spaceAfter'].includes(k) ? 'paraProp' : 'charProp', { k, v });
    }
    fillPlaceholder() {
      let it = this.selItems().find((i) => i.type === 'text');
      if (this.editing) { const head = this.item(this.editing); this.endEdit(true); it = head; }
      if (!it) return this.toast('Select (or click into) a text frame first');
      const story = this.story(it), st = story.paras[story.paras.length - 1] || { style: 'Basic Paragraph' };
      const add = LOREM.split('. ').reduce((acc, s, i) => { const k = Math.floor(i / 4); (acc[k] = acc[k] || []).push(s); return acc; }, []).map((ss) => ({ text: ss.join('. ').replace(/\.?$/, '.'), style: st.style, ov: st.ov || {} }));
      if (story.paras.length === 1 && !story.paras[0].text.trim()) story.paras = add; else story.paras.push(...add);
      this.commit(); this.renderAll(); this.act('placeholder');
    }
    insertPageNumber() {
      if (!this.editing) {
        const it = this.selItems().find((i) => i.type === 'text');
        if (!it) return this.toast('Click into a text frame with the Type tool first');
        const s = this.story(it); s.paras[s.paras.length - 1].text += PN;
      } else { document.execCommand('insertText', false, PN); }
      if (!this.editing) { this.commit(); this.renderAll(); }
      this.act('pageNumber', { master: this.masterMode });
    }
    placePhoto(key) {
      const target = this.selItems().find((i) => i.type === 'image' || i.type === 'rect' || i.type === 'ellipse');
      if (target) return this.putPhotoIn(target, key);
      this.placing = key;
      this.toast('Click inside a frame — or on the page — to place the photo');
      this.render();
    }
    putPhotoIn(it, key) {
      if (it.type !== 'image') { it.type = 'image'; it.ellipse = it.ellipse || false; it.fill = 'none'; }
      Object.assign(it, { photo: key, ix: 0, iy: 0, is: 1 });
      this.fitting(it, 'fill', true);
      this.sel = new Set([it.id]); this.commit(); this.renderAll(); this.act('place', { photo: key, into: true });
    }
    fitting(it, how, silent) {
      it = it || this.selItems().find((i) => i.type === 'image');
      if (!it || !it.photo) return this.toast('Select a frame with a photo in it');
      const p = (window.PS_PHOTOS || {})[it.photo]; if (!p) return;
      const sx = it.w / p.w, sy = it.h / p.h;
      if (how === 'fill') it.is = Math.max(sx, sy); if (how === 'fit') it.is = Math.min(sx, sy);
      if (how === 'frame') { it.w = p.w * it.is; it.h = p.h * it.is; it.ix = 0; it.iy = 0; }
      else { it.ix = (it.w - p.w * it.is) / 2; it.iy = (it.h - p.h * it.is) / 2; }
      if (!silent) { this.commit(); this.renderAll(); this.act('fit', { how }); }
    }
    align(how) {
      const sel = this.selItems(); if (!sel.length) return this.toast('Select something to align');
      const D = this.doc, M = D.margins;
      const toPage = this.alignTo !== 'margins';
      const T = toPage ? { x: 0, y: 0, w: D.w, h: D.h } : { x: M.l, y: M.t, w: D.w - M.l - M.r, h: D.h - M.t - M.b };
      sel.forEach((it) => {
        if (how === 'left') it.x = T.x; if (how === 'hcenter') it.x = T.x + (T.w - it.w) / 2; if (how === 'right') it.x = T.x + T.w - it.w;
        if (how === 'top') it.y = T.y; if (how === 'vcenter') it.y = T.y + (T.h - it.h) / 2; if (how === 'bottom') it.y = T.y + T.h - it.h;
      });
      this.commit(); this.renderAll(); this.act('align', { how, to: toPage ? 'page' : 'margins' });
    }
    addPage() { this.doc.pages.push({ id: uid(), master: 'A' }); this.commit(); this.renderAll(); this.act('pageAdd', { n: this.doc.pages.length }); }
    deletePage() {
      if (this.doc.pages.length < 2) return this.toast('A document needs at least one page');
      const i = this.currentPage();
      this.doc.items = this.doc.items.filter((it) => it.page !== i).map((it) => { if (typeof it.page === 'number' && it.page > i) it.page--; return it; });
      this.doc.pages.splice(i, 1); this.commit(); this.renderAll(); this.act('pageDelete');
    }
    editMaster(on) { this.endEdit(); this.masterMode = on; this.sel.clear(); this._fitted = true; this.fit(false); this.renderAll(); this.act(on ? 'masterEdit' : 'pageSelect', { i: 0 }); }

    /* ------------------------------------------------------- styles */
    newStyle() {
      let src = null;
      if (this.editing) { const d = this.caretPara(); if (d) src = { style: d.dataset.style, ov: JSON.parse(d.dataset.ov || '{}') }; }
      else { const it = this.selItems().find((i) => i.type === 'text'); if (it) src = this.story(it).paras[0]; }
      const base = src ? this.styleOf(src) : this.styleOf({ style: 'Basic Paragraph' });
      const n = Object.keys(this.doc.styles).length;
      this.styleDialog(`Paragraph Style ${n}`, base, (name, props) => {
        this.doc.styles[name] = props;
        // the paragraph it was made from now uses the style
        if (this.editing) { const d = this.caretPara(); if (d) { d.dataset.style = name; d.dataset.ov = '{}'; d.setAttribute('style', this.paraCss({ style: name })); } }
        else { const it = this.selItems().find((i) => i.type === 'text'); if (it) { const p = this.story(it).paras[0]; p.style = name; p.ov = {}; } }
        this.commit(); this.renderAll(); this.act('styleNew', { sname: name });
      }, true);
    }
    applyStyle(name) {
      if (this.editing) {
        const d = this.caretPara(); if (!d) return this.toast('Click inside a paragraph first');
        d.dataset.style = name; d.dataset.ov = '{}'; d.setAttribute('style', this.paraCss({ style: name }));
        this.act('styleApply', { sname: name }); return;
      }
      const texts = this.selItems().filter((i) => i.type === 'text');
      if (!texts.length) return this.toast('Select a text frame (or click into a paragraph) first');
      texts.forEach((it) => this.story(it).paras.forEach((p) => { p.style = name; p.ov = {}; }));
      this.commit(); this.renderAll(); this.act('styleApply', { sname: name });
    }
    editStyle(name) {
      const s = this.doc.styles[name];
      this.styleDialog(name, s, (nn, props) => { this.doc.styles[name] = props; this.commit(); this.renderAll(); this.act('styleEdit', { sname: name }); }, false);
    }
    styleDialog(name, s, onOk, canRename) {
      const d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="Paragraph Style Options" style="width:360px"><div class="ai-dialog-title">Paragraph Style Options</div><div class="ai-dialog-body id-sdlg">
        <label><span>Style Name:</span><input type="text" data-s="name" value="${esc(name)}" ${canRename ? '' : 'disabled'} style="width:170px"></label>
        <label><span>Font:</span><select data-s="font">${Object.keys(FONTS).map((f) => `<option${f === s.font ? ' selected' : ''}>${f}</option>`).join('')}</select></label>
        <label><span>Style:</span><select data-s="weight">${[[400, 'Regular'], [600, 'Semibold'], [700, 'Bold'], [900, 'Black']].map(([w, n]) => `<option value="${w}"${+s.weight === w ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <label><span>Size:</span><input type="number" min="4" max="300" data-s="size" value="${s.size}"> <em>pt</em></label>
        <label><span>Leading:</span><input type="number" min="4" max="400" data-s="leading" value="${s.leading || Math.round(s.size * 1.2)}"> <em>pt</em></label>
        <label><span>Color:</span><input type="color" data-s="color" value="${(s.color || '#000000').toLowerCase()}" style="width:60px;padding:0"></label>
        <label><span>Alignment:</span><select data-s="align">${['left', 'center', 'right', 'justify'].map((a) => `<option${a === s.align ? ' selected' : ''}>${a}</option>`).join('')}</select></label>
        <label><span>Space After:</span><input type="number" min="0" max="200" data-s="spaceAfter" value="${s.spaceAfter || 0}"> <em>pt</em></label></div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">OK</button></div></div>`;
      d.querySelectorAll('input,select').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelector('[data-x=ok]').onclick = () => {
        const v = (k) => d.querySelector(`[data-s="${k}"]`).value;
        const nm = (v('name') || name).trim();
        const props = { font: v('font'), weight: +v('weight'), size: +v('size') || 12, leading: +v('leading') || Math.round((+v('size') || 12) * 1.2), color: v('color').toUpperCase(), align: v('align'), spaceAfter: +v('spaceAfter') || 0 };
        close(); onOk(nm, props);
      };
      this.act('dialog', { title: 'Paragraph Style Options' });
    }
    marginsDialog() {
      const D = this.doc, M = D.margins, d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="Margins and Columns" style="width:330px"><div class="ai-dialog-title">Margins and Columns</div><div class="ai-dialog-body">
        ${[['t', 'Top'], ['b', 'Bottom'], ['l', 'Left'], ['r', 'Right']].map(([k, n]) => `<label><span>${n}:</span><input type="number" min="0" max="300" data-m="${k}" value="${M[k]}"> <em>pt</em></label>`).join('')}
        <label><span>Columns:</span><input type="number" min="1" max="6" data-m="cols" value="${D.cols}"></label>
        <label><span>Gutter:</span><input type="number" min="0" max="72" data-m="gutter" value="${D.gutter}"> <em>pt</em></label></div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">OK</button></div></div>`;
      d.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelector('[data-x=ok]').onclick = () => { const v = (k) => +d.querySelector(`[data-m="${k}"]`).value; D.margins = { t: v('t'), b: v('b'), l: v('l'), r: v('r') }; D.cols = clamp(Math.round(v('cols')) || 1, 1, 6); D.gutter = v('gutter'); close(); this.commit(); this.renderAll(); this.act('margins', { cols: D.cols }); };
      this.act('dialog', { title: 'Margins and Columns' });
    }
    placeDialog() {
      const P = window.PS_PHOTOS || {}, d = this.$.dialog;
      const list = Object.entries(P).filter(([k, v]) => k !== 'landscapeDull' && (v.sample || k.startsWith('user-') || k === 'apple'));
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="Place" style="width:440px"><div class="ai-dialog-title">Place (${CMD}D)</div><div class="ai-dialog-body"><p class="ps-note">Choose a photo. ${this.selItems().some((i) => i.type === 'image') ? 'It goes <b>into the selected frame</b>.' : 'Then click on the page (or inside a frame).'}</p>
        <div class="id-placegrid">${list.map(([k, v]) => `<button data-ph="${k}" data-hl="place-${k}" title="${esc(v.label || k)}"><img src="${v.src}" alt=""><span>${esc(v.label || k)}</span></button>`).join('')}<button data-ph="__own"><span class="id-own">📁</span><span>Your own photo…</span></button></div></div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button></div></div>`;
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelectorAll('[data-ph]').forEach((b) => b.addEventListener('click', () => { close(); if (b.dataset.ph === '__own') this.$.file.click(); else this.placePhoto(b.dataset.ph); }));
      this.act('dialog', { title: 'Place' });
    }

    /* ------------------------------------------------------- keyboard */
    onKey(e) {
      if (!this.isActive()) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (!this.$.dialog.hidden) { if (e.key === 'Escape') this.$.dialog.querySelector('[data-x=cancel]')?.click(); return; }
      const mod = e.metaKey || e.ctrlKey, k = e.key, kk = k.toLowerCase();
      if (k === ' ' && !e.repeat) { this.spaceHand = true; this.updateCursor(); e.preventDefault(); return; }
      if (k === 'Escape') { this.threadFrom = null; this.placing = null; this.closeMenu(); this.render(); return; }
      if (mod) {
        const map = { z: () => (e.shiftKey ? this.redo() : this.undo()), d: () => this.placeDialog(), a: () => { this.sel = new Set(this.itemsOn(this.masterMode ? 'A' : this.currentPage()).map((i) => i.id)); this.renderAll(); }, e: () => this.exportPDF(), ']': () => this.arrange('front'), '[': () => this.arrange('back'), '=': () => this.zoomBy(1.25), '-': () => this.zoomBy(0.8), 0: () => this.fit(true, this.currentPage()) };
        const code = e.code === 'Digit0' ? 0 : kk;
        if (e.altKey && kk === 'd') { e.preventDefault(); return this.duplicate(); }
        if (map[code]) { e.preventDefault(); map[code](); }
        return;
      }
      if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); return this.deleteSel(); }
      if (k.startsWith('Arrow') && this.sel.size) { e.preventDefault(); const s = e.shiftKey ? 10 : 1; this.selItems().forEach((it) => { it.x += k === 'ArrowLeft' ? -s : k === 'ArrowRight' ? s : 0; it.y += k === 'ArrowUp' ? -s : k === 'ArrowDown' ? s : 0; }); this.render(); clearTimeout(this._nT); this._nT = setTimeout(() => { this.commit(); this.renderAll(); this.act('move', { nudge: true }); }, 250); return; }
      if (kk === 'w') return this.togglePreview();
      if (kk === 'x') { this.slot = this.slot === 'fill' ? 'stroke' : 'fill'; this.renderToolbarState(); this.renderSwatches(); return; }
      const map = { v: 'select', a: 'direct', t: 'type', '\\': 'line', f: 'frame', m: 'rect', l: 'ellipse', h: 'hand', z: 'zoom' };
      if (map[kk]) this.setTool(map[kk]);
    }

    /* ------------------------------------------------------- tools */
    setTool(t, silent) {
      if (!TOOLS[t]) return;
      if (this.editing && t !== 'type') this.endEdit();
      this.tool = t;
      TOOL_GROUPS.forEach((g) => { if (g.length > 1 && g.includes(t)) this.groupShown[g[0]] = t; });
      this.closeFlyout(); this.renderToolbarState(); this.updateCursor(); this.render(); this.renderStatusSafe();
      if (!silent) this.act('tool', { tool: t });
    }
    renderStatusSafe() { if (this.doc) this.renderStatus(); }
    updateCursor() { const t = this.spaceHand ? 'hand' : this.tool; this.$.cv.style.cursor = { select: 'default', direct: 'default', type: 'text', hand: 'grab', zoom: 'zoom-in' }[t] || 'crosshair'; }
    openFlyout(btn, gi) {
      this.closeFlyout();
      const r = btn.getBoundingClientRect(), rr = this.root.getBoundingClientRect(), f = document.createElement('div');
      f.className = 'ai-flyout'; f.dataset.hl = 'flyout';
      f.innerHTML = TOOL_GROUPS[gi].map((t) => `<button data-ft="${t}" data-hl="fly-${t}" class="${t === this.tool ? 'on' : ''}">${svgIcon(t, 18)}<span>${TOOLS[t].name}</span>${TOOLS[t].key ? `<kbd>${TOOLS[t].key}</kbd>` : ''}</button>`).join('');
      f.style.left = (r.right - rr.left + 2) + 'px'; f.style.top = (r.top - rr.top) + 'px';
      f.addEventListener('click', (e) => { const b = e.target.closest('[data-ft]'); if (b) { this.setTool(b.dataset.ft); this.act('flyout', { tool: b.dataset.ft }); } });
      this.root.appendChild(f); this._flyOpen = f; this.hideTip(); this.act('flyoutOpen', { group: gi });
    }
    closeFlyout() { if (this._flyOpen) { this._flyOpen.remove(); setTimeout(() => { this._flyOpen = null; }, 0); } }
    closePop() { if (this.$.pop) this.$.pop.hidden = true; }
    showTab(t) { this.tab = t; this.renderPanels(); this.act('panel', { tab: t }); }

    /* ------------------------------------------------------- panels */
    renderAll(keepEditor) { this.render(); this.renderPanels(); this.renderControl(); this.renderToolbarState(); this.renderSwatches(); if (!keepEditor) this.emit('select'); }
    renderToolbarState() {
      const tb = this.$.toolbar;
      tb.querySelectorAll('.ai-tool').forEach((b) => {
        const g = TOOL_GROUPS[+b.dataset.group];
        if (g.length > 1) { const shown = this.groupShown[g[0]]; if (b.dataset.tool !== shown) { b.dataset.tool = shown; b.dataset.hl = 'tool-' + shown; b.innerHTML = svgIcon(shown); } }
        b.classList.toggle('on', b.dataset.tool === this.tool);
      });
      const it = this.selItems()[0];
      const f = it ? it.fill : 'none', s = it ? it.stroke : 'none';
      const fi = tb.querySelector('.ai-fs-fill i'), si = tb.querySelector('.ai-fs-stroke i');
      fi.style.background = f === 'none' ? '#fff' : f; fi.classList.toggle('none', f === 'none');
      si.style.borderColor = s === 'none' ? '#fff' : s; si.classList.toggle('none', s === 'none');
      tb.querySelector('.ai-fs-squares').classList.toggle('stroke-front', this.slot === 'stroke');
      tb.querySelectorAll('[data-fmt]').forEach((b) => b.classList.toggle('on', (b.dataset.fmt === '1') === this.textMode));
      tb.querySelector('.id-preview').classList.toggle('on', this.preview);
    }
    renderControl() {
      const it = this.selItems()[0], el = this.$.ctrl;
      const textish = this.editing || (it && it.type === 'text');
      let html = '';
      if (textish) {
        const head = this.editing ? this.item(this.editing) : it, p = this.story(head).paras[0], s = this.styleOf(p);
        html = `<span class="ai-c-label">${this.editing ? 'Typing ✎' : 'Text Frame'}</span><span class="ai-c-sep"></span>
          <select class="ai-sel" data-tp="font" style="max-width:150px" data-hl="ctrl-font">${Object.keys(FONTS).map((f) => `<option${f === s.font ? ' selected' : ''}>${f}</option>`).join('')}</select>
          <select class="ai-sel" data-tp="weight" style="max-width:96px">${[[400, 'Regular'], [600, 'Semibold'], [700, 'Bold'], [900, 'Black']].map(([w, n]) => `<option value="${w}"${+s.weight === w ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <span class="ai-c-item">T<input class="ai-num" type="number" min="4" max="400" data-tp="size" value="${s.size}" data-hl="ctrl-size"> pt</span>
          <span class="ai-c-item" title="Leading">↕<input class="ai-num" type="number" min="4" max="500" data-tp="leading" value="${Math.round(s.leading || s.size * 1.2)}"> pt</span>
          <span class="ai-c-sep"></span><span class="ai-c-align id-palign" data-hl="ctrl-align">${['left', 'center', 'right', 'justify'].map((a) => `<button data-al="${a}" class="${s.align === a ? 'on' : ''}" title="Align ${a}">${{ left: '⫷', center: '≡', right: '⫸', justify: '☰' }[a]}</button>`).join('')}</span>`;
      } else if (it) {
        html = `<span class="ai-c-label">${{ image: it.photo ? 'Graphic Frame' : 'Empty Frame', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line' }[it.type]}</span><span class="ai-c-sep"></span>
          ${['x', 'y', 'w', 'h'].map((k) => `<span class="ai-c-item">${k.toUpperCase()}:<input class="ai-num" type="number" data-geo="${k}" value="${Math.round(it[k])}"> pt</span>`).join('')}
          ${it.type === 'image' && it.photo ? `<span class="ai-c-sep"></span><button class="ps-obtn" data-fit="fill" title="Fill Frame Proportionally">⬛ Fill</button><button class="ps-obtn" data-fit="fit" title="Fit Content Proportionally">◻ Fit</button><button class="ps-obtn" data-fit="center" title="Center Content">⊕</button>` : ''}`;
      } else html = `<span class="ai-c-label">${this.masterMode ? 'Editing A-Master' : 'Nothing selected'}</span><span class="ai-c-sep"></span><span class="ps-hintline">${this.masterMode ? 'Items here appear on every page. ' : ''}Tip: press <b>W</b> to switch Preview mode</span>`;
      el.innerHTML = html;
      el.querySelectorAll('input,select').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      el.querySelectorAll('[data-tp]').forEach((i) => i.addEventListener('change', () => { const k = i.dataset.tp; this.setTextProp(k, k === 'font' ? i.value : +i.value); }));
      el.querySelectorAll('[data-al]').forEach((b) => b.addEventListener('click', () => this.setTextProp('align', b.dataset.al)));
      el.querySelectorAll('[data-geo]').forEach((i) => i.addEventListener('change', () => { const k = i.dataset.geo; this.selItems().forEach((x) => { x[k] = +i.value; }); this.commit(); this.renderAll(); this.act(k === 'x' || k === 'y' ? 'move' : 'resize', { via: 'control' }); }));
      el.querySelectorAll('[data-fit]').forEach((b) => b.addEventListener('click', () => this.fitting(null, b.dataset.fit)));
    }
    renderPanels() {
      this.$.dock.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
      const b = this.$.bodyA;
      if (this.tab === 'pages') return this.renderPages(b);
      if (this.tab === 'styles') return this.renderStyles(b);
      const it = this.selItems()[0];
      const sec = (t, inner, hl) => `<div class="ai-psec"${hl ? ` data-hl="${hl}"` : ''}><div class="ai-psec-t">${t}</div>${inner}</div>`;
      let html = '';
      if (!it) {
        html = `<div class="ai-pkind">Document</div>${sec('Page', `<p class="ps-note">${this.doc.w} × ${this.doc.h} pt · ${this.doc.pages.length} page(s)</p><div class="ai-btnrow"><button data-c="margins" data-hl="prop-margins">Margins &amp; Columns…</button></div>`)}
          ${sec('View', `<div class="ai-btnrow"><button data-c="preview" class="${this.preview ? 'on' : ''}">👁 Preview (W)</button><button data-c="fit">Fit Page</button></div>`)}`;
      } else {
        html = `<div class="ai-pkind">${{ text: 'Text Frame', image: it.photo ? 'Graphic Frame' : 'Graphic Frame (empty)', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line' }[it.type]}</div>`;
        html += sec('Transform', `<div class="ai-row"><label>X</label><input class="ai-in" type="number" data-geo="x" value="${Math.round(it.x)}"><label>W</label><input class="ai-in" type="number" data-geo="w" value="${Math.round(it.w)}"></div><div class="ai-row"><label>Y</label><input class="ai-in" type="number" data-geo="y" value="${Math.round(it.y)}"><label>H</label><input class="ai-in" type="number" data-geo="h" value="${Math.round(it.h)}"></div>`);
        html += sec('Appearance', `<div class="ai-row ai-apr"><button class="ai-swbtn" data-slotpick="fill" style="background:${it.fill === 'none' ? '#fff' : it.fill}"${it.fill === 'none' ? ' data-none' : ''}></button><label class="wide">Fill</label></div>
          <div class="ai-row ai-apr"><button class="ai-swbtn stroke" data-slotpick="stroke" style="border-color:${it.stroke === 'none' ? '#888' : it.stroke}"${it.stroke === 'none' ? ' data-none' : ''}></button><label>Stroke</label><input class="ai-in" type="number" min="0" step="0.5" data-sw value="${it.sw}"><span class="ai-unit">pt</span></div>`, 'prop-appearance');
        if (it.type === 'text') {
          html += sec('Text Frame Options', `<div class="ai-row"><label>Columns</label><input class="ai-in" type="number" min="1" max="4" data-cols value="${it.cols || 1}" data-hl="prop-columns"><label>Inset</label><input class="ai-in" type="number" min="0" max="72" data-inset value="${it.inset || 0}"></div>
            <div class="ai-btnrow"><button data-c="placeholder" data-hl="prop-placeholder">Fill with Placeholder Text</button>${it.next ? '<button data-c="unthread">Unlink next frame</button>' : ''}</div>
            ${it._overset && !it.next ? '<p class="ps-note" style="color:#ff7b7b">⊞ Overset text: the text does not fit. Make the frame bigger or click the red out-port to flow it into another frame.</p>' : ''}`, 'prop-textframe');
        }
        if (it.type === 'image') html += sec('Frame Fitting', it.photo ? `<div class="ai-btnrow"><button data-fit="fill" data-hl="fit-fill">Fill Frame Proportionally</button><button data-fit="fit" data-hl="fit-fit">Fit Content Proportionally</button><button data-fit="center">Center Content</button><button data-fit="frame">Fit Frame to Content</button></div><p class="ps-note" style="margin-top:6px">Use the <b>Direct Selection Tool (A)</b> to move the photo inside its frame.</p>` : `<div class="ai-btnrow"><button data-c="place" data-hl="prop-place">🖼 Place a photo… (${CMD}D)</button></div>`, 'prop-fitting');
        html += sec('Text Wrap', `<div class="ai-btnrow"><button data-c="wrap" class="${it.wrap ? 'on' : ''}" data-hl="prop-wrap">${it.wrap ? '✓ ' : ''}Wrap around bounding box</button></div>`, 'prop-wrapsec');
        html += sec(`Align <span class="ai-alignto" data-c="alignto">${this.alignTo === 'margins' ? 'to Margins' : 'to Page'} ▾</span>`, `<div class="ai-iconrow">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map((a) => `<button data-align="${a}" data-hl="align-${a}" title="Align ${a}">${{ left: '⫷', hcenter: '⊟', right: '⫸', top: '⊤', vcenter: '⊖', bottom: '⊥' }[a]}</button>`).join('')}</div>`, 'prop-align');
        html += sec('Quick Actions', '<div class="ai-btnrow"><button data-c="front">Bring to Front</button><button data-c="back">Send to Back</button><button data-c="dup">Duplicate</button></div>');
      }
      b.innerHTML = html;
      b.querySelectorAll('input,select').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      b.querySelectorAll('[data-geo]').forEach((i) => i.addEventListener('change', () => { const k = i.dataset.geo; this.selItems().forEach((x) => { x[k] = +i.value; }); this.commit(); this.renderAll(); this.act(k === 'x' || k === 'y' ? 'move' : 'resize', { via: 'panel' }); }));
      const sw = b.querySelector('[data-sw]'); if (sw) sw.addEventListener('change', () => { this.selItems().forEach((x) => { x.sw = +sw.value; if (x.stroke === 'none' && +sw.value > 0) x.stroke = '#000000'; }); this.commit(); this.renderAll(); this.act('strokeWeight'); });
      const cols = b.querySelector('[data-cols]'); if (cols) cols.addEventListener('change', () => { this.selItems().forEach((x) => { if (x.type === 'text') x.cols = clamp(+cols.value || 1, 1, 4); }); this.commit(); this.renderAll(); this.act('frameCols', { cols: +cols.value }); });
      const ins = b.querySelector('[data-inset]'); if (ins) ins.addEventListener('change', () => { this.selItems().forEach((x) => { x.inset = +ins.value; }); this.commit(); this.renderAll(); this.act('inset'); });
      b.querySelectorAll('[data-slotpick]').forEach((x) => x.addEventListener('click', () => { this.slot = x.dataset.slotpick; this.textMode = false; this.renderToolbarState(); this.renderSwatches(); }));
      b.querySelectorAll('[data-fit]').forEach((x) => x.addEventListener('click', () => this.fitting(null, x.dataset.fit)));
      b.querySelectorAll('[data-align]').forEach((x) => x.addEventListener('click', () => this.align(x.dataset.align)));
      b.querySelectorAll('[data-c]').forEach((x) => x.addEventListener('click', () => {
        const c = x.dataset.c, sel = this.selItems();
        const m = {
          margins: () => this.marginsDialog(), preview: () => this.togglePreview(), fit: () => this.fit(true, this.currentPage()), placeholder: () => this.fillPlaceholder(), unthread: () => this.unthread(sel[0]),
          place: () => this.placeDialog(), wrap: () => { const on = !sel[0].wrap; sel.forEach((s) => { s.wrap = on; }); this.commit(); this.renderAll(); this.act('wrap', { on }); },
          alignto: () => { this.alignTo = this.alignTo === 'margins' ? 'page' : 'margins'; this.renderPanels(); }, front: () => this.arrange('front'), back: () => this.arrange('back'), dup: () => this.duplicate(),
        };
        m[c] && m[c]();
      }));
    }
    renderPages(b) {
      const D = this.doc, tw = 64, th = tw * D.h / D.w;
      const thumb = (page) => { const c = mkCanvas(tw * 2, th * 2), g = c.getContext('2d'); g.scale((tw * 2) / D.w, (th * 2) / D.h); this.drawPage(g, page, 0, true); return c.toDataURL(); };
      this.layoutAll();
      b.innerHTML = `<div class="id-pages" data-hl="pages-list"><div class="id-psec">Masters</div>
        <button class="id-pg master${this.masterMode ? ' on' : ''}" data-master data-hl="master-a" title="Double-click to edit the master page"><img src="${thumb('A')}" alt="" style="width:${tw}px;height:${th}px"><span>A-Master</span></button>
        <div class="id-psec">Pages</div><div class="id-pgrid">
        ${D.pages.map((p, i) => `<button class="id-pg${!this.masterMode && this.currentPage() === i ? ' on' : ''}" data-pg="${i}" data-hl="page-${i + 1}"><img src="${thumb(i)}" alt="" style="width:${tw}px;height:${th}px"><span><i>A</i> ${i + 1}</span></button>`).join('')}</div></div>
        <div class="ps-lfoot"><span class="ps-hintline" style="margin-right:auto">${D.pages.length} page(s)</span><button data-pc="add" title="Create new page" data-hl="page-add">＋</button><button data-pc="del" title="Delete page">🗑</button></div>`;
      b.querySelector('[data-master]').addEventListener('click', () => this.editMaster(true));
      b.querySelectorAll('[data-pg]').forEach((x) => x.addEventListener('click', () => this.goToPage(+x.dataset.pg)));
      b.querySelector('[data-pc=add]').addEventListener('click', () => this.addPage());
      b.querySelector('[data-pc=del]').addEventListener('click', () => this.deletePage());
    }
    renderStyles(b) {
      const cur = (() => { const it = this.selItems().find((i) => i.type === 'text'); return it ? this.story(it).paras[0].style : null; })();
      b.innerHTML = `<div class="id-styles" data-hl="styles-list">${Object.entries(this.doc.styles).map(([n, s]) => `<div class="id-style${cur === n ? ' on' : ''}" data-st="${esc(n)}" data-hl="style-${esc(n).replace(/\s+/g, '-')}"><span class="id-sprev" style="font:${s.weight || 400} 13px ${fontStack(s.font)};color:${s.color}">Aa</span><span class="id-sname">${esc(n)}</span><span class="id-smeta">${s.font} ${s.size}pt</span><button class="ai-ib" data-ste="${esc(n)}" title="Edit style">✎</button></div>`).join('')}</div>
        <p class="ps-note" style="padding:6px 10px">Click a style to apply it to the selected text frame — or to the paragraph where your cursor is. Edit a style ✎ and every paragraph using it updates!</p>
        <div class="ps-lfoot"><button data-sn title="Create new style from the selected text" data-hl="style-new">＋</button></div>`;
      b.querySelectorAll('[data-st]').forEach((x) => x.addEventListener('click', (e) => { if (e.target.closest('[data-ste]')) return; this.applyStyle(x.dataset.st); }));
      b.querySelectorAll('[data-ste]').forEach((x) => x.addEventListener('click', () => this.editStyle(x.dataset.ste)));
      b.querySelector('[data-sn]').addEventListener('click', () => this.newStyle());
    }
    renderSwatches() {
      const b = this.$.bodyB;
      b.innerHTML = `<div class="ai-swhead"><span>Apply to:</span><button data-tg="fill" class="${!this.textMode && this.slot === 'fill' ? 'on' : ''}">▢ Fill</button><button data-tg="stroke" class="${!this.textMode && this.slot === 'stroke' ? 'on' : ''}">◻ Stroke</button><button data-tg="text" class="${this.textMode ? 'on' : ''}" data-hl="swatch-text">T Text</button></div>
        <div class="id-swlist">${SWATCHES.map(([n, c]) => `<button class="id-sw" data-c="${c}" title="${n}"><i style="background:${c === 'none' ? '#fff' : c}" class="${c === 'none' ? 'none' : ''}"></i><span>${n}</span></button>`).join('')}</div>`;
      b.querySelectorAll('[data-tg]').forEach((x) => x.addEventListener('click', () => { const t = x.dataset.tg; if (t === 'text') this.textMode = true; else { this.textMode = false; this.slot = t; } this.renderToolbarState(); this.renderSwatches(); this.act('formatTarget', { text: this.textMode }); }));
      b.querySelectorAll('[data-c]').forEach((x) => x.addEventListener('mousedown', (e) => { e.preventDefault(); this.applySwatch(x.dataset.c); }));
    }

    /* ------------------------------------------------------- menus */
    menuDef() {
      const n = this.sel.size, it = this.selItems()[0];
      return {
        File: [
          { l: 'Place…', k: CMD + 'D', f: () => this.placeDialog() },
          '-',
          { l: 'Export', sub: [{ l: 'Adobe PDF (Print)…', k: CMD + 'E', f: () => this.exportPDF() }, { l: 'Page as PNG…', f: () => this.exportPNG() }] },
        ],
        Edit: [
          { l: 'Undo', k: CMD + 'Z', f: () => this.undo(), d: this.hist.length < 2 }, { l: 'Redo', k: SHIFT + CMD + 'Z', f: () => this.redo(), d: !this.fut.length }, '-',
          { l: 'Duplicate', k: ALT + SHIFT + CMD + 'D', f: () => this.duplicate(), d: !n }, { l: 'Clear', k: 'Del', f: () => this.deleteSel(), d: !n },
        ],
        Layout: [
          { l: 'Margins and Columns…', f: () => this.marginsDialog() }, '-',
          { l: 'Pages', sub: [{ l: 'Add Page', f: () => this.addPage() }, { l: 'Delete Page', f: () => this.deletePage() }] },
          { l: this.masterMode ? 'Back to Pages' : 'Edit A-Master', f: () => this.editMaster(!this.masterMode) },
        ],
        Type: [
          { l: 'Fill with Placeholder Text', f: () => this.fillPlaceholder() },
          { l: 'Insert Special Character', sub: [{ l: 'Markers', sub: [{ l: 'Current Page Number', k: ALT + SHIFT + CMD + 'N', f: () => this.insertPageNumber() }] }] },
          '-',
          { l: 'Paragraph Styles', f: () => this.showTab('styles') },
          { l: 'Show Hidden Characters', f: () => this.toast('Hidden characters are shown while typing as normal text in this practice version') },
        ],
        Object: [
          { l: 'Arrange', sub: [{ l: 'Bring to Front', k: SHIFT + CMD + ']', f: () => this.arrange('front'), d: !n }, { l: 'Send to Back', k: SHIFT + CMD + '[', f: () => this.arrange('back'), d: !n }] },
          { l: 'Fitting', sub: [{ l: 'Fill Frame Proportionally', f: () => this.fitting(null, 'fill') }, { l: 'Fit Content Proportionally', f: () => this.fitting(null, 'fit') }, { l: 'Center Content', f: () => this.fitting(null, 'center') }, { l: 'Fit Frame to Content', f: () => this.fitting(null, 'frame') }] },
          { l: 'Text Wrap', sub: [{ l: 'Wrap around Bounding Box', c: it && it.wrap, f: () => { if (!it) return this.toast('Select an object first'); const on = !it.wrap; this.selItems().forEach((s) => { s.wrap = on; }); this.commit(); this.renderAll(); this.act('wrap', { on }); } }] },
          { l: 'Text Frame Options…', f: () => this.showTab('properties'), d: !(it && it.type === 'text') },
        ],
        View: [{ l: this.preview ? 'Screen Mode › Normal' : 'Screen Mode › Preview', k: 'W', f: () => this.togglePreview() }, '-', { l: 'Zoom In', k: CMD + '=', f: () => this.zoomBy(1.25) }, { l: 'Zoom Out', k: CMD + '-', f: () => this.zoomBy(0.8) }, { l: 'Fit Page in Window', k: CMD + '0', f: () => this.fit(true, this.currentPage()) }],
        Window: [{ l: 'Pages', k: 'F12', c: this.tab === 'pages', f: () => this.showTab('pages') }, { l: 'Paragraph Styles', k: 'F11', c: this.tab === 'styles', f: () => this.showTab('styles') }, { l: 'Properties', c: this.tab === 'properties', f: () => this.showTab('properties') }],
        Help: [{ l: 'Keyboard Shortcuts…', f: () => this.emit('help', { what: 'shortcuts' }) }, { l: 'InDesign Help…', f: () => this.emit('help', { what: 'help' }) }],
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
      const dd = this.$.dropdown; dd.innerHTML = build(defs); dd.hidden = false;
      const r = m.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      dd.style.left = (r.left - rr.left) + 'px'; dd.style.top = (r.bottom - rr.top) + 'px';
      // keep the text cursor when using the Type menu while typing
      dd.onmousedown = (e) => e.preventDefault();
      this.act('menuOpen', { menu: m.dataset.m });
    }
    closeMenu() { if (!this._openMenu) return; this._openMenu = null; this.$.dropdown.hidden = true; this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.remove('open')); }

    /* ------------------------------------------------------- export */
    download(blob, name) {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      if (this.opts.onDownload) this.opts.onDownload(blob, name);
    }
    pageCanvas(i, scale = 2) {
      const D = this.doc, c = mkCanvas(D.w * scale, D.h * scale), g = c.getContext('2d');
      g.scale(scale, scale); this.layoutAll(); this.drawPage(g, i, 0, true);
      return c;
    }
    exportPNG() { if (this.editing) this.endEdit(); this.pageCanvas(this.masterMode ? 'A' : this.currentPage()).toBlob((b) => b && this.download(b, 'page.png'), 'image/png'); this.act('export', { format: 'png' }); }
    exportPDF() {
      if (this.editing) this.endEdit();
      const J = window.jspdf && window.jspdf.jsPDF;
      if (!J) { this.toast('PDF engine not available — exporting a PNG of the page instead'); return this.exportPNG(); }
      const D = this.doc, pdf = new J({ unit: 'pt', format: [D.w, D.h], orientation: D.w > D.h ? 'landscape' : 'portrait' });
      D.pages.forEach((p, i) => { if (i) pdf.addPage([D.w, D.h], D.w > D.h ? 'landscape' : 'portrait'); pdf.addImage(this.pageCanvas(i, 2).toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, D.w, D.h); });
      const blob = pdf.output('blob');
      this.download(new Blob([blob], { type: 'application/pdf' }), `${D.name.replace(/\W+/g, '-') || 'document'}.pdf`);
      this.act('export', { format: 'pdf', pages: D.pages.length });
    }
    snapshotDataURL(cb, w = 420) { const c = this.pageCanvas(0, 1), o = mkCanvas(w, (w * c.height) / c.width); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); cb(o.toDataURL('image/png')); }
    saveLocal() { } loadLocal() { return false; } setTemplate() { }
    endTextEdit() { this.endEdit(); }

    showTip(el, html) { clearTimeout(this._tipT); this._tipT = setTimeout(() => { const t = this.$.tooltip, r = el.getBoundingClientRect(), rr = this.root.getBoundingClientRect(); t.innerHTML = html; t.hidden = false; t.style.left = (r.right - rr.left + 8) + 'px'; t.style.top = (r.top - rr.top) + 'px'; }, 450); }
    hideTip() { clearTimeout(this._tipT); if (this.$.tooltip) this.$.tooltip.hidden = true; }
    toast(msg) { const t = this.$.toast; t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(this._toastT); this._toastT = setTimeout(() => { t.hidden = true; }, 3200); }
    hl(name) { return this.root.querySelector(`[data-hl="${name}"]`); }

    /* lesson helpers */
    texts(page) { return this.doc.items.filter((i) => i.type === 'text' && (page == null || i.page === page)); }
    images() { return this.doc.items.filter((i) => i.type === 'image'); }
    storyText(it) { return this.story(it).paras.map((p) => p.text).join('\n'); }
  }

  window.IDEditor = IDEditor;
  window.IDEditor.TOOLS = TOOLS;
  window.IDEditor.CMD = CMD; window.IDEditor.SHIFT = SHIFT; window.IDEditor.ALT = ALT;
})();
