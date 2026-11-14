/* =========================================================================
   DesignQuest — Illustrator Workspace Simulator
   A browser-based, beginner-friendly recreation of the Adobe Illustrator
   workspace: menu bar, control bar, toolbar (with hidden-tool flyouts),
   rulers, artboard, Properties / Layers / Swatches / Color panels.
   Real working tools: Selection, Direct Selection, Pen, Type, Line,
   Rectangle, Ellipse, Polygon, Star, Paintbrush, Pencil, Rotate,
   Eyedropper, Hand, Zoom — plus Pathfinder, Align, Arrange, Group,
   Effects, Undo/Redo, Smart Guides and PNG/SVG export.
   ========================================================================= */
(function () {
  'use strict';

  const KAPPA = 0.5522847498;
  let UID = 1;
  const uid = () => 'o' + Date.now().toString(36) + (UID++);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const CMD = IS_MAC ? '⌘' : 'Ctrl+';
  const SHIFT = IS_MAC ? '⇧' : 'Shift+';
  const ALT = IS_MAC ? '⌥' : 'Alt+';

  function rotPt(p, c, deg) {
    if (!deg) return { x: p.x, y: p.y };
    const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a);
    const dx = p.x - c.x, dy = p.y - c.y;
    return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
  }

  /* ---------------------------------------------------------------- fonts */
  const FONTS = {
    'Myriad Pro': "'Myriad Pro','Source Sans 3','Segoe UI',Arial,sans-serif",
    'Poppins': 'Poppins,sans-serif',
    'Montserrat': 'Montserrat,sans-serif',
    'Bebas Neue': "'Bebas Neue',Impact,sans-serif",
    'Playfair Display': "'Playfair Display',Georgia,serif",
    'Pacifico': 'Pacifico,cursive',
    'Lobster': 'Lobster,cursive',
    'Roboto Mono': "'Roboto Mono',monospace",
  };
  const fontStack = (f) => FONTS[f] || FONTS['Myriad Pro'];

  /* ------------------------------------------------------------- swatches */
  const SWATCHES = [
    'none', '#FFFFFF', '#000000', '#E6E6E6', '#B3B3B3', '#808080', '#4D4D4D',
    '#ED1C24', '#F15A24', '#F7931E', '#FBB03B', '#FCEE21', '#D9E021', '#8CC63F',
    '#39B54A', '#009245', '#00A99D', '#29ABE2', '#0071BC', '#2E3192', '#662D91',
    '#93278F', '#D4145A', '#ED1E79', '#C7B299', '#998675', '#754C24', '#603813',
    '#FFD6E0', '#FFE5B4', '#C9F2C7', '#BDE0FE', '#E4C1F9', '#FF7A59', '#FFB547', '#5B5BD6',
  ];
  const GRADIENTS = [
    { g: 'lin', a: 0, s: ['#FFFFFF', '#000000'] },
    { g: 'lin', a: 0, s: ['#FF7A59', '#FFD166'] },
    { g: 'lin', a: 90, s: ['#5B5BD6', '#00C2FF'] },
    { g: 'lin', a: 45, s: ['#ED1E79', '#662D91'] },
    { g: 'lin', a: 0, s: ['#39B54A', '#FCEE21'] },
    { g: 'rad', a: 0, s: ['#FFFFFF', '#29ABE2'] },
  ];
  const isGrad = (p) => p && typeof p === 'object';
  const gradCss = (p) => p.g === 'rad'
    ? `radial-gradient(circle, ${p.s[0]}, ${p.s[1]})`
    : `linear-gradient(${90 + (p.a || 0)}deg, ${p.s[0]}, ${p.s[1]})`;
  const paintCss = (p) => (p === 'none' || !p) ? 'transparent' : isGrad(p) ? gradCss(p) : p;
  const samePaint = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ---------------------------------------------------------------- tools */
  const TOOLS = {
    select: { name: 'Selection Tool', key: 'V', tip: 'Click a shape to select it. Drag to move it. Drag the small white squares to resize it.' },
    direct: { name: 'Direct Selection Tool', key: 'A', tip: 'Click single anchor points and drag them to change a shape.' },
    pen: { name: 'Pen Tool', key: 'P', tip: 'Click = straight line. Click + drag = smooth curve. Click the first point to close.' },
    type: { name: 'Type Tool', key: 'T', tip: 'Click on the artboard and start typing.' },
    line: { name: 'Line Segment Tool', key: '\\', tip: 'Drag to draw a straight line. Hold Shift for perfect angles.' },
    rect: { name: 'Rectangle Tool', key: 'M', tip: 'Drag to draw a rectangle. Hold Shift for a perfect square.' },
    ellipse: { name: 'Ellipse Tool', key: 'L', tip: 'Drag to draw an ellipse. Hold Shift for a perfect circle.' },
    polygon: { name: 'Polygon Tool', key: '', tip: 'Drag to draw a polygon (6 sides by default).' },
    star: { name: 'Star Tool', key: '', tip: 'Drag to draw a star.' },
    brush: { name: 'Paintbrush Tool', key: 'B', tip: 'Drag to paint a smooth brush stroke.' },
    pencil: { name: 'Pencil Tool', key: 'N', tip: 'Drag to draw freehand lines, like a real pencil.' },
    rotate: { name: 'Rotate Tool', key: 'R', tip: 'Select a shape, then drag around it to rotate.' },
    eyedropper: { name: 'Eyedropper Tool', key: 'I', tip: 'Select a shape, then click another shape to copy its colors.' },
    hand: { name: 'Hand Tool', key: 'H', tip: 'Drag to move around your document. (Hold Space for a shortcut!)' },
    zoom: { name: 'Zoom Tool', key: 'Z', tip: 'Click to zoom in. Hold Alt and click to zoom out.' },
  };
  const TOOL_GROUPS = [['select'], ['direct'], ['pen'], ['type'], ['line'], ['rect', 'ellipse', 'polygon', 'star'], ['brush', 'pencil'], ['rotate'], ['eyedropper'], ['hand'], ['zoom']];

  const ICON = {
    select: '<path d="M6 3l12.5 9-5.4 1.1 3.3 6.3-2.4 1.2-3.3-6.4L6 18.5z" fill="currentColor"/>',
    direct: '<path d="M6 3l12.5 9-5.4 1.1 3.3 6.3-2.4 1.2-3.3-6.4L6 18.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    pen: '<path d="M12 3l5.5 8.8-2.8 6.2H9.3L6.5 11.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="11.5" r="1.6" fill="currentColor"/><path d="M12 3v7" stroke="currentColor" stroke-width="1.3"/><rect x="8.8" y="18.8" width="6.4" height="2.4" rx=".5" fill="currentColor"/>',
    type: '<path d="M5 4.5h14v3.3h-1.4l-.6-1.6h-3.6v12l2 .8v1.5H8.6V19l2-.8v-12H7l-.6 1.6H5z" fill="currentColor"/>',
    line: '<path d="M5 19L19 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    rect: '<rect x="4.5" y="6.5" width="15" height="11" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    polygon: '<path d="M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    star: '<path d="M12 3.5l2.6 5.5 6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.1 6-.8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    brush: '<path d="M19.6 3.6c-1 0-6.6 6-8.6 8.6l1.9 1.9c2.6-2 8.6-7.6 8.6-8.6 0-1-.9-1.9-1.9-1.9z" fill="currentColor"/><path d="M9.9 13.4c-2 0-3.4 1.5-3.4 3.4 0 1.1-.8 2-2 2.5 2.6 1.1 7.2.6 7.6-3.4z" fill="currentColor"/>',
    pencil: '<path d="M4.5 19.5l1-4.2L16.3 4.5l3.2 3.2L8.7 18.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14.2 6.6l3.2 3.2" stroke="currentColor" stroke-width="1.5"/>',
    rotate: '<path d="M19 12.5a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M18.6 3.6v4.2h-4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    eyedropper: '<path d="M18.9 5.1a2.3 2.3 0 0 0-3.2 0l-2.4 2.4-1-1-1.5 1.5 1 1-6.6 6.6-.6 3.6 3.6-.6 6.6-6.6 1 1 1.5-1.5-1-1 2.4-2.4a2.3 2.3 0 0 0 0-3.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    hand: '<path d="M8.3 13V6.7a1.4 1.4 0 0 1 2.8 0V12m0-.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3m0-.4V6.4a1.4 1.4 0 0 1 2.8 0v7c0 4.1-2.4 7-6 7-2.4 0-3.9-1.2-5.4-3.4L4.4 13.7a1.3 1.3 0 0 1 2.1-1.5l1.8 2.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const svgIcon = (k, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${ICON[k] || ''}</svg>`;

  /* -------------------------------------------------------------- cursors */
  const curUrl = (svg, x, y, fb) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${x} ${y}, ${fb}`;
  const ARROW = (fill, stroke) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M4 2v16l4.2-4 2.8 6.4 2.4-1-2.8-6.3 5.8-.1z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  const PEN = (extra) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><g transform="translate(3 3) rotate(-38)"><path d="M0 0L5.2 9 3.2 15H-3.2l-2-6z" fill="#fff" stroke="#000" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 0v7" stroke="#000"/><circle cx="0" cy="8" r="1.3"/></g>${extra || ''}</svg>`;
  const CURSORS = {
    select: curUrl(ARROW('#000', '#fff'), 4, 2, 'default'),
    direct: curUrl(ARROW('#fff', '#000'), 4, 2, 'default'),
    pen: curUrl(PEN('<path d="M19 17h6M22 14v6M19.9 14.9l4.2 4.2M24.1 14.9l-4.2 4.2" stroke="#000" stroke-width="1.2"/>'), 3, 3, 'crosshair'),
    penGo: curUrl(PEN(''), 3, 3, 'crosshair'),
    penClose: curUrl(PEN('<circle cx="22" cy="18" r="3" fill="#fff" stroke="#000" stroke-width="1.3"/>'), 3, 3, 'crosshair'),
    eyedropper: curUrl('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M20 4.4a2.3 2.3 0 0 0-3.2 0l-2.4 2.4-1-1-1.5 1.5 1 1-7 7-.9 4.6 4.6-.9 7-7 1 1 1.5-1.5-1-1 2.4-2.4a2.3 2.3 0 0 0 0-3.2z" fill="#fff" stroke="#000" stroke-width="1.3"/></svg>', 3, 21, 'crosshair'),
    rotateZone: curUrl('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M5 15a9 9 0 0 1 10-10" fill="none" stroke="#fff" stroke-width="4"/><path d="M5 15a9 9 0 0 1 10-10" fill="none" stroke="#000" stroke-width="1.6"/><path d="M2 12l3 4 3-4zM12 2l4 3-4 3z" fill="#000"/></svg>', 12, 12, 'alias'),
  };

  /* ------------------------------------------------------------- geometry */
  function rectD(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  }
  function ellD(x, y, w, h) {
    const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry;
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
  }
  function polyUnit(n, star, inner) {
    const N = star ? n * 2 : n, pts = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N, rr = star && i % 2 ? inner : 1;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    return pts.map(([a, b]) => [(a - mnx) / (mxx - mnx || 1), (b - mny) / (mxy - mny || 1)]);
  }
  function polyPts(o) {
    const u = o.kind === 'star' ? polyUnit(o.pts || 5, true, o.inner || 0.45) : polyUnit(o.sides || 6, false);
    return u.map(([a, b]) => ({ x: o.x + a * o.w, y: o.y + b * o.h }));
  }
  function segD(a, b) {
    if (!a.o && !b.i) return `L${r1(b.x)} ${r1(b.y)}`;
    const c1 = a.o || a, c2 = b.i || b;
    return `C${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${r1(b.x)} ${r1(b.y)}`;
  }
  function subD(sp) {
    const P = sp.P;
    if (!P.length) return '';
    let d = `M${r1(P[0].x)} ${r1(P[0].y)}`;
    for (let i = 1; i < P.length; i++) d += segD(P[i - 1], P[i]);
    if (sp.c && P.length > 1) d += segD(P[P.length - 1], P[0]) + 'Z';
    return d;
  }
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
  function pathBB(o) {
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    const add = (x, y) => { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; };
    for (const sp of o.subs) {
      const P = sp.P, n = P.length;
      P.forEach((p) => add(p.x, p.y));
      const segs = n - 1 + (sp.c && n > 1 ? 1 : 0);
      for (let i = 0; i < segs; i++) {
        const a = P[i], b = P[(i + 1) % n];
        if (!a.o && !b.i) continue;
        const c1 = a.o || a, c2 = b.i || b;
        for (let t = 0.05; t < 1; t += 0.05) add(bez(a.x, c1.x, c2.x, b.x, t), bez(a.y, c1.y, c2.y, b.y, t));
      }
    }
    if (mnx === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: mnx, y: mny, w: mxx - mnx, h: mxy - mny };
  }
  function bbox(o) {
    if (o.kind === 'path') return pathBB(o);
    if (o.kind === 'text') {
      if (o._bb) return { x: o.x + o._bb.dx, y: o.y + o._bb.dy, w: o._bb.w, h: o._bb.h };
      const lines = o.text.split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * o.size * 0.55;
      return { x: o.x, y: o.y - o.size * 0.8, w: Math.max(w, 4), h: o.size * (1.2 * (lines.length - 1) + 1) };
    }
    return { x: o.x, y: o.y, w: o.w, h: o.h };
  }
  const center = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  function corners(o) {
    const b = bbox(o), c = center(b);
    return [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }].map((p) => rotPt(p, c, o.rot || 0));
  }
  function aabb(o) {
    const cs = corners(o), xs = cs.map((p) => p.x), ys = cs.map((p) => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  function union(list) {
    if (!list.length) return null;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    list.forEach((o) => { const b = aabb(o); x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h); });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  /** local (unrotated) path data for an object */
  function localD(o) {
    switch (o.kind) {
      case 'rect': return rectD(o.x, o.y, o.w, o.h, o.r);
      case 'ellipse': return ellD(o.x, o.y, o.w, o.h);
      case 'polygon': case 'star': { const p = polyPts(o); return 'M' + p.map((q) => `${r1(q.x)} ${r1(q.y)}`).join('L') + 'Z'; }
      case 'path': return o.subs.map(subD).join('');
      case 'text': { const b = bbox(o); return rectD(b.x, b.y, b.w, b.h, 0); }
    }
    return '';
  }
  function eachPt(o, fn) {
    o.subs.forEach((sp) => sp.P.forEach((p) => { fn(p); if (p.i) fn(p.i); if (p.o) fn(p.o); }));
  }
  function translate(o, dx, dy) {
    if (o.kind === 'path') eachPt(o, (p) => { p.x += dx; p.y += dy; });
    else { o.x += dx; o.y += dy; }
  }
  /** set the local (unrotated) bounding box */
  function setBBox(o, nb) {
    const b = bbox(o);
    if (o.kind === 'path') {
      const sx = b.w > 0.0001 ? nb.w / b.w : 1, sy = b.h > 0.0001 ? nb.h / b.h : 1;
      eachPt(o, (p) => { p.x = nb.x + (p.x - b.x) * sx; p.y = nb.y + (p.y - b.y) * sy; });
    } else if (o.kind === 'text') {
      const k = b.h > 0 ? nb.h / b.h : 1;
      const dx = b.x - o.x, dy = b.y - o.y;
      o.size = clamp(o.size * k, 1, 2000);
      o.x = nb.x - dx * k; o.y = nb.y - dy * k;
      if (o._bb) { o._bb = { dx: o._bb.dx * k, dy: o._bb.dy * k, w: o._bb.w * k, h: o._bb.h * k }; }
    } else {
      o.x = nb.x; o.y = nb.y; o.w = Math.max(0.5, nb.w); o.h = Math.max(0.5, nb.h);
    }
  }
  /** convert a primitive into editable anchor points (bakes rotation) */
  function toPath(o) {
    if (o.kind === 'path' || o.kind === 'text') return o;
    let P = [];
    const { x, y, w, h } = o;
    if (o.kind === 'ellipse') {
      const rx = w / 2, ry = h / 2, cx = x + rx, cy = y + ry, kx = rx * KAPPA, ky = ry * KAPPA;
      P = [
        { x: cx, y: y, i: { x: cx - kx, y: y }, o: { x: cx + kx, y: y }, s: true },
        { x: x + w, y: cy, i: { x: x + w, y: cy - ky }, o: { x: x + w, y: cy + ky }, s: true },
        { x: cx, y: y + h, i: { x: cx + kx, y: y + h }, o: { x: cx - kx, y: y + h }, s: true },
        { x: x, y: cy, i: { x: x, y: cy + ky }, o: { x: x, y: cy - ky }, s: true },
      ];
    } else if (o.kind === 'rect') {
      const r = Math.max(0, Math.min(o.r || 0, w / 2, h / 2));
      if (!r) P = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }].map((p) => ({ ...p, i: null, o: null }));
      else {
        const k = r * KAPPA;
        P = [
          { x: x + r, y, i: { x: x + r - k, y }, o: null }, { x: x + w - r, y, i: null, o: { x: x + w - r + k, y } },
          { x: x + w, y: y + r, i: { x: x + w, y: y + r - k }, o: null }, { x: x + w, y: y + h - r, i: null, o: { x: x + w, y: y + h - r + k } },
          { x: x + w - r, y: y + h, i: { x: x + w - r + k, y: y + h }, o: null }, { x: x + r, y: y + h, i: null, o: { x: x + r - k, y: y + h } },
          { x, y: y + h - r, i: { x, y: y + h - r + k }, o: null }, { x, y: y + r, i: null, o: { x, y: y + r - k } },
        ];
      }
    } else {
      P = polyPts(o).map((p) => ({ ...p, i: null, o: null }));
    }
    const c = center(bbox(o));
    const fx = o.flipX ? -1 : 1, fy = o.flipY ? -1 : 1;
    const tf = (p) => rotPt({ x: c.x + (p.x - c.x) * fx, y: c.y + (p.y - c.y) * fy }, c, o.rot || 0);
    P.forEach((p) => { Object.assign(p, tf(p)); if (p.i) p.i = tf(p.i); if (p.o) p.o = tf(p.o); });
    const n = { id: o.id, kind: 'path', name: o.name, subs: [{ P, c: true }], fill: o.fill, stroke: o.stroke, sw: o.sw, op: o.op, rot: 0, gid: o.gid, fx: o.fx, hidden: o.hidden, locked: o.locked };
    return n;
  }
  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    let dmax = 0, idx = 0;
    const a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      const num = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
      const d = num / (Math.hypot(b.y - a.y, b.x - a.x) || 1);
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > eps) {
      const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps);
      return l.slice(0, -1).concat(r);
    }
    return [a, b];
  }
  function smoothPts(raw) {
    const P = raw.map((p) => ({ x: p.x, y: p.y, i: null, o: null, s: true }));
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      p1.o = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      p2.i = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    }
    return P;
  }

  /* ========================================================== the editor */
  class AIEditor {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = opts;
      this.AB = { w: 800, h: 600 };
      this.objs = [];
      this.sel = new Set();
      this.selPts = new Set();
      this.tool = 'select';
      this.groupShown = { rect: 'rect', brush: 'brush' };
      this.def = { fill: '#FFFFFF', stroke: '#000000', sw: 1, op: 1 };
      this.slot = 'fill';
      this.view = { z: 1, x: 0, y: 0 };
      this.flags = { rulers: true, grid: false, snap: false, outline: false, smart: true };
      this.alignTo = 'auto';
      this.hist = []; this.fut = [];
      this.listeners = [];
      this.log = [];
      this.clip = null;
      this.template = null;
      this.tabA = 'properties'; this.tabB = 'swatches';
      this.dockOpen = true;
      this.drag = null;
      this.build();
      this.bind();
      requestAnimationFrame(() => { this.resize(); this.fit(); });
      this.commit(true);
      this.renderAll();
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

    /* ------------------------------------------------------------- build */
    build() {
      const h = this.host;
      h.innerHTML = '';
      const root = document.createElement('div');
      root.className = 'ai';
      root.tabIndex = -1;
      root.innerHTML = `
        <div class="ai-menubar">
          <div class="ai-logo" title="Illustrator">Ai</div>
          <div class="ai-menus"></div>
          <div class="ai-menubar-right">
            <span class="ai-workspace" data-hl="workspace">Essentials <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2.5l3 3 3-3" stroke="currentColor" fill="none"/></svg></span>
          </div>
        </div>
        <div class="ai-ctrlbar"></div>
        <div class="ai-main">
          <div class="ai-toolbar" data-hl="toolbar"></div>
          <div class="ai-doc">
            <div class="ai-tabs"><div class="ai-tab active"><span class="ai-tab-name">Untitled-1*</span> <span class="ai-tab-zoom">@ 100 % (RGB/Preview)</span><span class="ai-tab-x">×</span></div></div>
            <div class="ai-stage">
              <div class="ai-ruler-corner"></div>
              <canvas class="ai-ruler ai-ruler-h"></canvas>
              <canvas class="ai-ruler ai-ruler-v"></canvas>
              <div class="ai-canvas-wrap" data-hl="canvas">
                <svg class="ai-canvas" xmlns="http://www.w3.org/2000/svg">
                  <defs class="ai-defs"></defs>
                  <g class="ai-vp">
                    <rect class="ai-ab-shadow"/>
                    <rect class="ai-artboard"/>
                    <rect class="ai-grid" fill="url(#ai-grid-pat)"/>
                    <g class="ai-template"></g>
                    <g class="ai-objs"></g>
                    <text class="ai-ab-label">01 - Artboard 1</text>
                  </g>
                  <g class="ai-ov"></g>
                </svg>
                <div class="ai-textedit" contenteditable="true" spellcheck="false" hidden></div>
                <div class="ai-toast" hidden></div>
              </div>
            </div>
            <div class="ai-status"></div>
          </div>
          <div class="ai-dock" data-hl="panels">
            <div class="ai-dockgroup ai-dock-a">
              <div class="ai-dtabs">
                <button data-tab="properties" data-hl="tab-properties">Properties</button>
                <button data-tab="layers" data-hl="tab-layers">Layers</button>
                <button class="ai-dock-collapse" title="Collapse panels">»</button>
              </div>
              <div class="ai-dbody ai-dbody-a"></div>
            </div>
            <div class="ai-dockgroup ai-dock-b">
              <div class="ai-dtabs">
                <button data-tab="swatches" data-hl="tab-swatches">Swatches</button>
                <button data-tab="color" data-hl="tab-color">Color</button>
              </div>
              <div class="ai-dbody ai-dbody-b"></div>
            </div>
          </div>
        </div>
        <div class="ai-pop" hidden></div>
        <div class="ai-dropdown" hidden></div>
        <div class="ai-tooltip" hidden></div>
        <div class="ai-dialog-wrap" hidden></div>`;
      h.appendChild(root);
      const q = (s) => root.querySelector(s);
      this.root = root;
      this.$ = {
        menus: q('.ai-menus'), ctrl: q('.ai-ctrlbar'), toolbar: q('.ai-toolbar'), stage: q('.ai-stage'),
        wrap: q('.ai-canvas-wrap'), svg: q('.ai-canvas'), defs: q('.ai-defs'), vp: q('.ai-vp'), objs: q('.ai-objs'), ov: q('.ai-ov'),
        tmpl: q('.ai-template'), ab: q('.ai-artboard'), abShadow: q('.ai-ab-shadow'), grid: q('.ai-grid'), abLabel: q('.ai-ab-label'),
        rh: q('.ai-ruler-h'), rv: q('.ai-ruler-v'), corner: q('.ai-ruler-corner'), status: q('.ai-status'),
        tabZoom: q('.ai-tab-zoom'), bodyA: q('.ai-dbody-a'), bodyB: q('.ai-dbody-b'), dock: q('.ai-dock'),
        pop: q('.ai-pop'), dropdown: q('.ai-dropdown'), tooltip: q('.ai-tooltip'), dialog: q('.ai-dialog-wrap'),
        textedit: q('.ai-textedit'), toast: q('.ai-toast'),
      };
      this.buildMenus();
      this.buildToolbar();
    }

    buildMenus() {
      const names = ['File', 'Edit', 'Object', 'Type', 'Select', 'Effect', 'View', 'Window', 'Help'];
      this.$.menus.innerHTML = names.map((n) => `<div class="ai-menu" data-m="${n}" data-hl="menu-${n.toLowerCase()}">${n}</div>`).join('');
    }

    menuDef() {
      const n = this.sel.size, sel = this.selObjs();
      const hasGroup = sel.some((o) => o.gid);
      const fx = (k) => sel.length && sel.every((o) => o.fx && o.fx[k]);
      return {
        File: [
          { l: 'New', k: CMD + 'N', f: () => this.newDoc() },
          '-',
          { l: 'Export As PNG…', f: () => this.exportPNG() },
          { l: 'Export As SVG…', f: () => this.exportSVG() },
        ],
        Edit: [
          { l: 'Undo', k: CMD + 'Z', f: () => this.undo(), d: this.hist.length < 2 },
          { l: 'Redo', k: SHIFT + CMD + 'Z', f: () => this.redo(), d: !this.fut.length },
          '-',
          { l: 'Cut', k: CMD + 'X', f: () => this.cut(), d: !n },
          { l: 'Copy', k: CMD + 'C', f: () => this.copy(), d: !n },
          { l: 'Paste', k: CMD + 'V', f: () => this.paste(), d: !this.clip },
          { l: 'Paste in Place', k: SHIFT + CMD + 'V', f: () => this.paste(true), d: !this.clip },
          { l: 'Duplicate', k: CMD + 'D', f: () => this.duplicate(), d: !n },
          { l: 'Clear', k: 'Del', f: () => this.deleteSel(), d: !n },
        ],
        Object: [
          { l: 'Transform', sub: [
            { l: 'Reflect Horizontal', f: () => this.reflect('x'), d: !n },
            { l: 'Reflect Vertical', f: () => this.reflect('y'), d: !n },
            { l: 'Rotate 90° CW', f: () => this.rotateBy(90), d: !n },
            { l: 'Reset Rotation', f: () => this.resetRotation(), d: !n },
          ] },
          { l: 'Arrange', sub: [
            { l: 'Bring to Front', k: SHIFT + CMD + ']', f: () => this.arrange('front'), d: !n },
            { l: 'Bring Forward', k: CMD + ']', f: () => this.arrange('forward'), d: !n },
            { l: 'Send Backward', k: CMD + '[', f: () => this.arrange('backward'), d: !n },
            { l: 'Send to Back', k: SHIFT + CMD + '[', f: () => this.arrange('back'), d: !n },
          ] },
          '-',
          { l: 'Group', k: CMD + 'G', f: () => this.group(), d: n < 2 },
          { l: 'Ungroup', k: SHIFT + CMD + 'G', f: () => this.ungroup(), d: !hasGroup },
          '-',
          { l: 'Lock Selection', k: CMD + '2', f: () => this.lockSel(), d: !n },
          { l: 'Unlock All', k: ALT + CMD + '2', f: () => this.unlockAll() },
          { l: 'Hide Selection', k: CMD + '3', f: () => this.hideSel(), d: !n },
          { l: 'Show All', k: ALT + CMD + '3', f: () => this.showAll() },
        ],
        Type: [
          { l: 'Change Case', sub: [
            { l: 'UPPERCASE', f: () => this.changeCase('upper') },
            { l: 'lowercase', f: () => this.changeCase('lower') },
            { l: 'Title Case', f: () => this.changeCase('title') },
          ] },
          '-',
          { l: 'Font', sub: Object.keys(FONTS).map((f) => ({ l: f, f: () => this.setProp('font', f), font: f })) },
        ],
        Select: [
          { l: 'All', k: CMD + 'A', f: () => this.selectAll() },
          { l: 'Deselect', k: SHIFT + CMD + 'A', f: () => this.select([]) },
          { l: 'Inverse', f: () => this.selectInverse() },
          '-',
          { l: 'Same', sub: [
            { l: 'Fill Color', f: () => this.selectSame('fill'), d: !n },
            { l: 'Stroke Color', f: () => this.selectSame('stroke'), d: !n },
          ] },
        ],
        Effect: [
          { l: 'Stylize', sub: [{ l: 'Drop Shadow…', f: () => this.toggleFx('shadow'), c: fx('shadow'), d: !n }] },
          { l: 'Blur', sub: [{ l: 'Gaussian Blur…', f: () => this.toggleFx('blur'), c: fx('blur'), d: !n }] },
        ],
        View: [
          { l: this.flags.outline ? 'Preview' : 'Outline', k: CMD + 'Y', f: () => this.toggleFlag('outline') },
          '-',
          { l: 'Zoom In', k: CMD + '+', f: () => this.zoomBy(1.25) },
          { l: 'Zoom Out', k: CMD + '-', f: () => this.zoomBy(0.8) },
          { l: 'Fit Artboard in Window', k: CMD + '0', f: () => this.fit(true) },
          { l: 'Actual Size', k: CMD + '1', f: () => this.zoomTo(1) },
          '-',
          { l: 'Rulers', k: CMD + 'R', f: () => this.toggleFlag('rulers'), c: this.flags.rulers },
          { l: 'Smart Guides', k: CMD + 'U', f: () => this.toggleFlag('smart'), c: this.flags.smart },
          { l: 'Show Grid', k: CMD + "'", f: () => this.toggleFlag('grid'), c: this.flags.grid },
          { l: 'Snap to Grid', k: SHIFT + CMD + "'", f: () => this.toggleFlag('snap'), c: this.flags.snap },
        ],
        Window: [
          { l: 'Color', f: () => this.showTab('color'), c: this.tabB === 'color' },
          { l: 'Layers', k: 'F7', f: () => this.showTab('layers'), c: this.tabA === 'layers' },
          { l: 'Properties', f: () => this.showTab('properties'), c: this.tabA === 'properties' },
          { l: 'Swatches', f: () => this.showTab('swatches'), c: this.tabB === 'swatches' },
          '-',
          { l: 'Reset Essentials', f: () => this.resetWorkspace() },
        ],
        Help: [
          { l: 'Keyboard Shortcuts…', f: () => this.emit('help', { what: 'shortcuts' }) },
          { l: 'Illustrator Help…', f: () => this.emit('help', { what: 'help' }) },
        ],
      };
    }

    buildToolbar() {
      let html = '<div class="ai-tools">';
      TOOL_GROUPS.forEach((g, gi) => {
        const shown = g.length > 1 ? this.groupShown[g[0]] : g[0];
        html += `<button class="ai-tool${g.length > 1 ? ' has-fly' : ''}" data-tool="${shown}" data-group="${gi}" data-hl="tool-${shown}" aria-label="${TOOLS[shown].name}">${svgIcon(shown)}</button>`;
        if (gi === 1 || gi === 4 || gi === 8) html += '<div class="ai-tool-sep"></div>';
      });
      html += `</div>
        <div class="ai-fs" data-hl="fillstroke">
          <div class="ai-fs-squares">
            <button class="ai-fs-sq ai-fs-stroke" data-slot="stroke" title="Stroke (X)" data-hl="stroke-box"><i></i></button>
            <button class="ai-fs-sq ai-fs-fill" data-slot="fill" title="Fill (X)" data-hl="fill-box"><i></i></button>
            <button class="ai-fs-swap" title="Swap Fill and Stroke (Shift+X)">⇄</button>
            <button class="ai-fs-default" title="Default Fill and Stroke (D)"><span></span><span></span></button>
          </div>
          <div class="ai-fs-modes">
            <button data-mode="color" title="Color (<)"><span style="background:#fff"></span></button>
            <button data-mode="gradient" title="Gradient (>)"><span style="background:linear-gradient(90deg,#fff,#000)"></span></button>
            <button data-mode="none" title="None (/)"><span class="none"></span></button>
          </div>
        </div>`;
      this.$.toolbar.innerHTML = html;
    }

    /* -------------------------------------------------------------- bind */
    bind() {
      const $ = this.$;
      // tools
      $.toolbar.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('.ai-tool');
        if (!b) return;
        const gi = +b.dataset.group;
        if (TOOL_GROUPS[gi].length > 1) {
          clearTimeout(this._flyT);
          this._flyT = setTimeout(() => this.openFlyout(b, gi), 380);
        }
      });
      $.toolbar.addEventListener('pointerup', () => clearTimeout(this._flyT));
      $.toolbar.addEventListener('pointerleave', () => clearTimeout(this._flyT));
      $.toolbar.addEventListener('contextmenu', (e) => {
        const b = e.target.closest('.ai-tool');
        if (b && TOOL_GROUPS[+b.dataset.group].length > 1) { e.preventDefault(); this.openFlyout(b, +b.dataset.group); }
      });
      $.toolbar.addEventListener('click', (e) => {
        const b = e.target.closest('.ai-tool');
        if (b) { if (!this._flyOpen) this.setTool(b.dataset.tool); return; }
        const sq = e.target.closest('.ai-fs-sq');
        if (sq) {
          if (this.slot === sq.dataset.slot) this.openColorPop(sq, this.slot);
          else { this.slot = sq.dataset.slot; this.act('slot', { slot: this.slot }); this.renderToolbarState(); this.renderColorPanel(); }
          return;
        }
        if (e.target.closest('.ai-fs-swap')) return this.swapFillStroke();
        if (e.target.closest('.ai-fs-default')) return this.defaultColors();
        const m = e.target.closest('[data-mode]');
        if (m) {
          const mode = m.dataset.mode;
          if (mode === 'none') this.applyPaint(this.slot, 'none');
          else if (mode === 'gradient') this.applyPaint(this.slot, clone(GRADIENTS[1]));
          else {
            const cur = this.currentPaint(this.slot);
            this.applyPaint(this.slot, isGrad(cur) ? cur.s[0] : cur === 'none' ? '#000000' : cur);
          }
        }
      });
      $.toolbar.addEventListener('pointerover', (e) => {
        const b = e.target.closest('.ai-tool');
        if (!b) return this.hideTip();
        const t = TOOLS[b.dataset.tool];
        this.showTip(b, `<b>${t.name}</b>${t.key ? ` <kbd>${t.key}</kbd>` : ''}<div>${t.tip}</div>${TOOL_GROUPS[+b.dataset.group].length > 1 ? '<em>Hold the mouse down to see hidden tools</em>' : ''}`);
      });
      $.toolbar.addEventListener('pointerout', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.ai-tool')) this.hideTip(); });

      // menus
      $.menus.addEventListener('click', (e) => {
        const m = e.target.closest('.ai-menu');
        if (!m) return;
        if (this._openMenu === m.dataset.m) this.closeMenu();
        else this.openMenu(m);
      });
      $.menus.addEventListener('pointerover', (e) => {
        const m = e.target.closest('.ai-menu');
        if (m && this._openMenu && this._openMenu !== m.dataset.m) this.openMenu(m);
      });
      $.dropdown.addEventListener('click', (e) => {
        const it = e.target.closest('.ai-mi');
        if (!it || it.classList.contains('disabled') || it.classList.contains('has-sub')) return;
        const fn = this._menuFns[it.dataset.i];
        this.closeMenu();
        if (fn) { fn(); this.act('menu', { item: it.dataset.l }); }
      });

      // dock tabs
      $.dock.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab]');
        if (t) return this.showTab(t.dataset.tab);
        if (e.target.closest('.ai-dock-collapse')) { this.dockOpen = !this.dockOpen; this.root.classList.toggle('dock-closed', !this.dockOpen); this.resize(); }
      });

      // canvas
      const svg = $.svg;
      svg.addEventListener('pointerdown', (e) => this.onDown(e));
      svg.addEventListener('pointermove', (e) => this.onMove(e));
      svg.addEventListener('pointerup', (e) => this.onUp(e));
      svg.addEventListener('pointercancel', (e) => this.onUp(e));
      svg.addEventListener('dblclick', (e) => this.onDbl(e));
      svg.addEventListener('pointerleave', () => { this.hover = null; this.penHover = null; this.renderOverlay(); this.renderRulers(); });
      svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
      svg.addEventListener('contextmenu', (e) => e.preventDefault());

      // text editing
      $.textedit.addEventListener('input', () => {
        const o = this.get(this.editingText);
        if (o) { o.text = $.textedit.innerText.replace(/\n$/, ''); o._bb = null; this.renderObjs(); }
      });
      $.textedit.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { e.preventDefault(); this.endTextEdit(); }
      });
      $.textedit.addEventListener('paste', (e) => {
        e.preventDefault();
        const t = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t);
      });

      // keyboard
      this._onKey = (e) => this.onKey(e);
      this._onKeyUp = (e) => this.onKeyUp(e);
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('keyup', this._onKeyUp);

      // close popups
      document.addEventListener('pointerdown', (e) => {
        if (!this.root.contains(e.target)) { this.closeMenu(); this.closePop(); this.closeFlyout(); return; }
        if (!e.target.closest('.ai-menu') && !e.target.closest('.ai-dropdown')) this.closeMenu();
        if (!e.target.closest('.ai-pop') && !e.target.closest('[data-pop]') && !e.target.closest('.ai-fs-sq')) this.closePop();
        if (!e.target.closest('.ai-flyout')) this.closeFlyout();
        if (this.editingText && !e.target.closest('.ai-textedit') && !e.target.closest('.ai-dock') && !e.target.closest('.ai-ctrlbar')) this.endTextEdit();
      }, true);

      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe($.stage);
    }

    destroy() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('keyup', this._onKeyUp);
      this._ro && this._ro.disconnect();
    }

    isActive() { return this.root.offsetParent !== null && !this.root.closest('[inert]'); }

    /* -------------------------------------------------------------- view */
    resize() {
      const r = this.$.wrap.getBoundingClientRect();
      if (!r.width) return;
      this.W = r.width; this.H = r.height;
      this.$.svg.setAttribute('width', r.width);
      this.$.svg.setAttribute('height', r.height);
      if (!this._fitted) { this.fit(); this._fitted = true; }
      this.renderView();
    }
    fit(user) {
      if (!this.W) return;
      const pad = 60;
      const z = Math.min((this.W - pad) / this.AB.w, (this.H - pad) / this.AB.h);
      this.view.z = clamp(z, 0.05, 64);
      this.view.x = (this.W - this.AB.w * this.view.z) / 2;
      this.view.y = (this.H - this.AB.h * this.view.z) / 2;
      this.renderView();
      if (user) this.act('zoom', { z: this.view.z, fit: true });
    }
    zoomTo(z, at) {
      at = at || { x: this.W / 2, y: this.H / 2 };
      const old = this.view.z;
      z = clamp(z, 0.05, 64);
      const dx = (at.x - this.view.x) / old, dy = (at.y - this.view.y) / old;
      this.view.z = z;
      this.view.x = at.x - dx * z;
      this.view.y = at.y - dy * z;
      this.renderView();
      this.act('zoom', { z, dir: z > old ? 'in' : 'out' });
    }
    zoomBy(f, at) { this.zoomTo(this.view.z * f, at); }
    toScr(p) { return { x: p.x * this.view.z + this.view.x, y: p.y * this.view.z + this.view.y }; }
    toDoc(e) {
      const r = this.$.svg.getBoundingClientRect();
      return { x: (e.clientX - r.left - this.view.x) / this.view.z, y: (e.clientY - r.top - this.view.y) / this.view.z };
    }
    scrPt(e) { const r = this.$.svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    renderView() {
      const { z, x, y } = this.view, $ = this.$;
      $.vp.setAttribute('transform', `translate(${x} ${y}) scale(${z})`);
      const set = (el, a) => Object.entries(a).forEach(([k, v]) => el.setAttribute(k, v));
      set($.ab, { x: 0, y: 0, width: this.AB.w, height: this.AB.h });
      set($.abShadow, { x: 3 / z, y: 3 / z, width: this.AB.w, height: this.AB.h });
      set($.grid, { x: 0, y: 0, width: this.AB.w, height: this.AB.h });
      $.grid.style.display = this.flags.grid ? '' : 'none';
      set($.abLabel, { x: 0, y: -6 / z, 'font-size': 11 / z });
      this.renderDefsStatic();
      $.tabZoom.textContent = `@ ${Math.round(z * 100)} % (RGB/${this.flags.outline ? 'Outline' : 'Preview'})`;
      this.root.classList.toggle('no-rulers', !this.flags.rulers);
      this.renderOverlay();
      this.renderRulers();
      this.renderStatus();
    }
    renderDefsStatic() {
      const z = this.view.z;
      let pat = this.$.defs.querySelector('#ai-grid-pat');
      if (!pat) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.innerHTML = '<pattern id="ai-grid-pat" width="80" height="80" patternUnits="userSpaceOnUse"><path class="minor" d="M20 0V80M40 0V80M60 0V80M0 20H80M0 40H80M0 60H80" fill="none" stroke="#e3e3e3"/><path d="M0 0V80M0 0H80" fill="none" stroke="#c4c4c4"/></pattern>';
        this.$.defs.appendChild(g.firstChild);
        pat = this.$.defs.querySelector('#ai-grid-pat');
      }
      pat.querySelectorAll('path').forEach((p) => p.setAttribute('stroke-width', 1 / z));
    }

    renderRulers() {
      if (!this.flags.rulers || !this.W) return;
      const dpr = window.devicePixelRatio || 1;
      const draw = (cv, horiz) => {
        const len = horiz ? this.W : this.H, th = 18;
        cv.width = (horiz ? len : th) * dpr; cv.height = (horiz ? th : len) * dpr;
        cv.style.width = (horiz ? len : th) + 'px'; cv.style.height = (horiz ? th : len) + 'px';
        const c = cv.getContext('2d');
        c.scale(dpr, dpr);
        c.fillStyle = '#323232'; c.fillRect(0, 0, horiz ? len : th, horiz ? th : len);
        c.strokeStyle = '#8a8a8a'; c.fillStyle = '#b8b8b8'; c.font = '9px "Source Sans 3", sans-serif'; c.lineWidth = 1;
        const z = this.view.z, off = horiz ? this.view.x : this.view.y;
        const steps = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
        const step = steps.find((s) => s * z >= 60) || 5000;
        const sub = step / 10;
        const start = Math.floor(-off / z / step) * step, end = (len - off) / z;
        c.beginPath();
        for (let v = start; v <= end; v += sub) {
          const p = Math.round(v * z + off) + 0.5;
          const isMajor = Math.abs(v / step - Math.round(v / step)) < 1e-6;
          const t = isMajor ? th : Math.abs((v / (step / 2)) - Math.round(v / (step / 2))) < 1e-6 ? 7 : 4;
          if (horiz) { c.moveTo(p, th); c.lineTo(p, th - t); } else { c.moveTo(th, p); c.lineTo(th - t, p); }
          if (isMajor) {
            const lbl = String(Math.round(v));
            if (horiz) c.fillText(lbl, p + 3, 9);
            else { c.save(); c.translate(9, p + 3); c.rotate(-Math.PI / 2); c.fillText(lbl, -c.measureText(lbl).width - 3, 0); c.restore(); }
          }
        }
        c.stroke();
        if (this.mouseScr) {
          const mp = horiz ? this.mouseScr.x : this.mouseScr.y;
          c.strokeStyle = '#2d9cff'; c.beginPath();
          if (horiz) { c.moveTo(mp + 0.5, 0); c.lineTo(mp + 0.5, th); } else { c.moveTo(0, mp + 0.5); c.lineTo(th, mp + 0.5); }
          c.stroke();
        }
      };
      draw(this.$.rh, true);
      draw(this.$.rv, false);
    }

    /* ------------------------------------------------------------- model */
    get(id) { return this.objs.find((o) => o.id === id); }
    selObjs() { return this.objs.filter((o) => this.sel.has(o.id)); }
    groupMembers(o) { return o.gid ? this.objs.filter((x) => x.gid === o.gid) : [o]; }
    nextName(kind) {
      return { rect: 'Rectangle', ellipse: 'Ellipse', polygon: 'Polygon', star: 'Star', path: 'Path', text: 'Text' }[kind] || 'Path';
    }
    add(o, opts = {}) {
      o.id = o.id || uid();
      o.rot = o.rot || 0;
      if (o.op == null) o.op = 1;
      if (o.sw == null) o.sw = this.def.sw;
      if (o.fill === undefined) o.fill = clone(this.def.fill);
      if (o.stroke === undefined) o.stroke = clone(this.def.stroke);
      o.name = o.name || this.nextName(o.kind);
      this.objs.push(o);
      if (!opts.silent) { this.renderObjs(); }
      return o;
    }
    load(list, opts = {}) {
      list.forEach((o) => this.add(clone(o), { silent: true }));
      this.renderAll();
      if (!opts.noCommit) this.commit();
    }
    reset(opts = {}) {
      this.endTextEdit(true);
      this.pen = null;
      this.objs = [];
      this.sel.clear(); this.selPts.clear();
      this.template = opts.template || null;
      this.def = { fill: '#FFFFFF', stroke: '#000000', sw: 1, op: 1, ...(opts.def || {}) };
      this.slot = 'fill';
      this.flags.outline = false;
      if (!opts.keepPanels) {
        this.tabA = 'properties'; this.tabB = 'swatches';
        this.dockOpen = true; this.root.classList.remove('dock-closed');
      }
      this.closeMenu(); this.closePop(); this.closeFlyout();
      this.hist = []; this.fut = [];
      this.clearLog();
      if (opts.objs) opts.objs.forEach((o) => this.add(clone(o), { silent: true }));
      this.setTool(opts.tool || 'select', true);
      this.commit(true);
      this.fit();
      this.renderAll();
    }
    snapshot() { return JSON.stringify({ objs: this.objs, sel: [...this.sel] }); }
    commit(silent) {
      const s = this.snapshot();
      if (this.hist[this.hist.length - 1] === s) return;
      this.hist.push(s);
      if (this.hist.length > 120) this.hist.shift();
      this.fut = [];
      if (!silent) this.emit('change');
      this.saveLocal();
    }
    restore(s) {
      const d = JSON.parse(s);
      this.objs = d.objs;
      this.sel = new Set(d.sel.filter((id) => this.get(id)));
      this.selPts.clear();
      this.renderAll();
      this.emit('change');
      this.saveLocal();
    }
    undo() {
      if (this.editingText) this.endTextEdit();
      if (this.pen) this.pen = null;
      if (this.hist.length < 2) return this.toast('Nothing to undo');
      this.fut.push(this.hist.pop());
      this.restore(this.hist[this.hist.length - 1]);
      this.act('undo');
    }
    redo() {
      if (!this.fut.length) return this.toast('Nothing to redo');
      const s = this.fut.pop();
      this.hist.push(s);
      this.restore(s);
      this.act('redo');
    }
    saveLocal() {
      if (!this.opts.storageKey) return;
      try { localStorage.setItem(this.opts.storageKey, JSON.stringify({ objs: this.objs })); } catch (e) { /* storage unavailable */ }
    }
    loadLocal() {
      if (!this.opts.storageKey) return false;
      try {
        const d = JSON.parse(localStorage.getItem(this.opts.storageKey) || 'null');
        if (d && Array.isArray(d.objs)) { this.objs = d.objs; this.renderAll(); this.commit(true); return true; }
      } catch (e) { /* ignore */ }
      return false;
    }

    /* --------------------------------------------------------- selection */
    select(ids, opts = {}) {
      this.sel = new Set(ids);
      this.selPts.clear();
      this.renderSelection();
      if (!opts.silent) this.act('select', { count: this.sel.size });
    }
    expandGroups(ids) {
      const out = new Set();
      ids.forEach((id) => { const o = this.get(id); if (o) this.groupMembers(o).forEach((m) => out.add(m.id)); });
      return [...out];
    }
    selectAll() { this.select(this.objs.filter((o) => !o.locked && !o.hidden).map((o) => o.id)); }
    selectInverse() { this.select(this.objs.filter((o) => !o.locked && !o.hidden && !this.sel.has(o.id)).map((o) => o.id)); }
    selectSame(k) {
      const s = this.selObjs()[0];
      if (!s) return;
      this.select(this.objs.filter((o) => !o.locked && !o.hidden && samePaint(o[k], s[k])).map((o) => o.id));
    }

    /* -------------------------------------------------------------- tools */
    setTool(t, silent) {
      if (!TOOLS[t]) return;
      if (this.pen && t !== 'pen') this.finishPen();
      if (this.editingText) this.endTextEdit();
      this.tool = t;
      TOOL_GROUPS.forEach((g) => { if (g.length > 1 && g.includes(t)) this.groupShown[g[0]] = t; });
      this.closeFlyout();
      this.renderToolbarState();
      this.updateCursor();
      this.renderOverlay();
      this.renderStatus();
      if (!silent) this.act('tool', { tool: t });
    }
    updateCursor() {
      const t = this.spaceHand ? 'hand' : this.tool;
      let c = 'default';
      if (t === 'select' || t === 'direct') c = CURSORS[t];
      else if (t === 'pen') c = this.pen ? (this.penNearStart ? CURSORS.penClose : CURSORS.penGo) : CURSORS.pen;
      else if (t === 'type') c = 'text';
      else if (t === 'hand') c = this.drag && this.drag.mode === 'pan' ? 'grabbing' : 'grab';
      else if (t === 'zoom') c = this.altDown ? 'zoom-out' : 'zoom-in';
      else if (t === 'eyedropper') c = CURSORS.eyedropper;
      else c = 'crosshair';
      this.$.svg.style.cursor = c;
    }
    openFlyout(btn, gi) {
      this.closeFlyout();
      const r = btn.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'ai-flyout';
      f.dataset.hl = 'flyout';
      f.innerHTML = TOOL_GROUPS[gi].map((t) => `<button data-ft="${t}" data-hl="fly-${t}" class="${t === this.tool ? 'on' : ''}">${svgIcon(t, 18)}<span>${TOOLS[t].name}</span>${TOOLS[t].key ? `<kbd>${TOOLS[t].key}</kbd>` : ''}</button>`).join('');
      f.style.left = (r.right - rr.left + 2) + 'px';
      f.style.top = (r.top - rr.top) + 'px';
      f.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ft]');
        if (b) { this.setTool(b.dataset.ft); this.act('flyout', { tool: b.dataset.ft }); }
      });
      this.root.appendChild(f);
      this._flyOpen = f;
      this.hideTip();
      this.act('flyoutOpen', { group: gi });
    }
    closeFlyout() { if (this._flyOpen) { this._flyOpen.remove(); setTimeout(() => { this._flyOpen = null; }, 0); } }

    /* ----------------------------------------------------------- pointer */
    onDown(e) {
      if (e.button === 1 || (e.button === 0 && (this.spaceHand || this.tool === 'hand'))) {
        this.drag = { mode: 'pan', s: this.scrPt(e), v: { ...this.view } };
        this.$.svg.setPointerCapture(e.pointerId);
        this.updateCursor();
        return;
      }
      if (e.button !== 0) return;
      this.closeMenu(); this.closePop();
      this.$.svg.setPointerCapture(e.pointerId);
      this.root.focus({ preventScroll: true });
      const p = this.toDoc(e), t = e.target;
      const objEl = t.closest && t.closest('[data-id]');
      const id = objEl && objEl.dataset.id;
      this.downAt = this.scrPt(e);

      switch (this.tool) {
        case 'zoom':
          this.zoomBy(e.altKey ? 0.5 : 2, this.scrPt(e));
          return;
        case 'select': return this.downSelect(e, p, t, id);
        case 'direct': return this.downDirect(e, p, t, id);
        case 'pen': return this.downPen(e, p);
        case 'type': return this.downType(e, p, id);
        case 'rotate': return this.downRotate(e, p);
        case 'eyedropper': return this.downEyedropper(id);
        case 'brush': case 'pencil':
          this.drag = { mode: 'free', pts: [p] };
          return;
        case 'rect': case 'ellipse': case 'polygon': case 'star': case 'line':
          this.drag = { mode: 'draw', s: p, kind: this.tool };
          return;
      }
    }

    downSelect(e, p, t, id) {
      const h = t.dataset && t.dataset.h;
      if (h && this.sel.size) return this.startScale(h, p, e);
      if (t.dataset && t.dataset.rz && this.sel.size) return this.startRotate(p);
      if (id) {
        const o = this.get(id);
        const members = this.groupMembers(o).map((m) => m.id);
        if (e.shiftKey) {
          const all = members.every((m) => this.sel.has(m));
          members.forEach((m) => (all ? this.sel.delete(m) : this.sel.add(m)));
          this.select([...this.sel]);
          return;
        }
        if (!this.sel.has(id)) this.select(members);
        if (e.altKey) this.duplicate(true, true);
        this.startMove(p);
        return;
      }
      if (!e.shiftKey) this.select([], { silent: !this.sel.size });
      this.drag = { mode: 'marquee', s: p, add: e.shiftKey, base: [...this.sel] };
    }

    downDirect(e, p, t, id) {
      const a = t.dataset && t.dataset.a, hh = t.dataset && t.dataset.hh;
      if (hh) {
        const [oid, si, pi, side] = hh.split(':');
        const o = this.get(oid);
        this.drag = { mode: 'handle', o, si: +si, pi: +pi, side };
        return;
      }
      if (a) {
        const key = a;
        if (e.shiftKey) { this.selPts.has(key) ? this.selPts.delete(key) : this.selPts.add(key); }
        else if (!this.selPts.has(key)) { this.selPts.clear(); this.selPts.add(key); }
        const [oid] = key.split(':');
        this.sel.add(oid);
        this.drag = { mode: 'anchors', s: p, snap: this.snapshot(), moved: false };
        this.renderSelection();
        return;
      }
      if (id) {
        if (e.shiftKey) { this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id); }
        else if (!this.sel.has(id)) this.sel = new Set([id]);
        this.selPts.clear();
        this.renderSelection();
        this.act('select', { count: this.sel.size, direct: true });
        this.startMove(p);
        return;
      }
      if (!e.shiftKey) { this.sel.clear(); this.selPts.clear(); this.renderSelection(); }
      this.drag = { mode: 'marquee', s: p, add: e.shiftKey, base: [...this.sel], direct: true };
    }

    startMove(p) {
      const list = this.selObjs().filter((o) => !o.locked);
      this.drag = { mode: 'move', s: p, snap: list.map((o) => clone(o)), U: union(list), moved: false };
    }
    startScale(h, p, e) {
      const list = this.selObjs();
      const single = list.length === 1 && !list[0].gid ? list[0] : null;
      this.drag = { mode: 'scale', h, s: p, snap: list.map((o) => clone(o)), single: !!single, U: single ? bbox(single) : union(list), rot: single ? single.rot || 0 : 0 };
    }
    startRotate(p) {
      const list = this.selObjs();
      const U = union(list);
      const c = list.length === 1 ? center(bbox(list[0])) : center(U);
      this.drag = { mode: 'rotate', c, a0: Math.atan2(p.y - c.y, p.x - c.x), snap: list.map((o) => clone(o)) };
    }
    downRotate(e, p) {
      if (!this.sel.size) return this.toast('Select a shape first, then drag to rotate it');
      this.startRotate(p);
    }
    downEyedropper(id) {
      if (!id) return;
      const src = this.get(id);
      const targets = this.selObjs().filter((o) => o.id !== id);
      if (!targets.length) {
        this.def.fill = clone(src.fill); this.def.stroke = clone(src.stroke); this.def.sw = src.sw;
        this.toast('Picked colors. Select a shape first to paint it.');
      } else {
        targets.forEach((o) => { o.fill = clone(src.fill); o.stroke = clone(src.stroke); o.sw = src.sw; if (src.kind === 'text' && o.kind === 'text') { o.font = src.font; o.size = src.size; o.weight = src.weight; o._bb = null; } });
        this.commit();
      }
      this.renderAll();
      this.act('eyedropper', { from: id, count: targets.length });
    }
    downType(e, p, id) {
      e.preventDefault();
      const o = id && this.get(id);
      if (o && o.kind === 'text') return this.startTextEdit(o);
      const t = this.add({ kind: 'text', x: p.x, y: p.y, text: '', size: 36, font: 'Myriad Pro', weight: 400, fill: isGrad(this.def.fill) || this.def.fill === 'none' || this.def.fill === '#FFFFFF' ? '#000000' : clone(this.def.fill), stroke: 'none', sw: 1 });
      this.select([t.id], { silent: true });
      this.startTextEdit(t, true);
    }
    downPen(e, p) {
      if (!this.pen) {
        const o = this.add({ kind: 'path', subs: [{ P: [{ x: p.x, y: p.y, i: null, o: null }], c: false }], fill: clone(this.def.fill), stroke: clone(this.def.stroke) });
        this.pen = { id: o.id };
        this.select([o.id], { silent: true });
        this.drag = { mode: 'pen', idx: 0 };
        this.act('penPoint', { n: 1 });
        return;
      }
      const o = this.get(this.pen.id);
      if (!o) { this.pen = null; return this.downPen(e, p); }
      const sp = o.subs[0], P = sp.P;
      if (P.length >= 2 && dist(this.toScr(P[0]), this.toScr(p)) < 9) {
        sp.c = true;
        this.drag = { mode: 'pen', idx: 0, closing: true };
        this.renderObjs();
        return;
      }
      P.push({ x: p.x, y: p.y, i: null, o: null });
      this.drag = { mode: 'pen', idx: P.length - 1 };
      this.renderObjs();
      this.act('penPoint', { n: P.length });
    }
    finishPen() {
      const o = this.pen && this.get(this.pen.id);
      this.pen = null;
      this.penHover = null;
      if (o) {
        const sp = o.subs[0];
        if (sp.P.length < 2) { this.objs = this.objs.filter((x) => x !== o); this.sel.delete(o.id); }
        else {
          this.commit();
          this.act('penDone', { closed: sp.c, n: sp.P.length, curves: sp.P.some((q) => q.i || q.o) });
        }
      }
      this.renderAll();
      this.updateCursor();
    }

    onMove(e) {
      const p = this.toDoc(e);
      this.mouseScr = this.scrPt(e);
      this.mouseDoc = p;
      if (this.flags.rulers) this.renderRulers();
      const d = this.drag;
      if (!d) {
        if (this.tool === 'select' || this.tool === 'direct') {
          const el = e.target.closest && e.target.closest('[data-id]');
          const hid = el ? el.dataset.id : null;
          if (hid !== this.hover) { this.hover = hid; this.renderOverlay(); }
          this.$.svg.style.cursor = e.target.dataset && e.target.dataset.rz ? CURSORS.rotateZone : e.target.dataset && e.target.dataset.h ? (['n', 's'].includes(e.target.dataset.h) ? 'ns-resize' : ['e', 'w'].includes(e.target.dataset.h) ? 'ew-resize' : ['nw', 'se'].includes(e.target.dataset.h) ? 'nwse-resize' : 'nesw-resize') : CURSORS[this.tool];
        }
        if (this.tool === 'pen' && this.pen) {
          this.penHover = p;
          const o = this.get(this.pen.id);
          const near = o && o.subs[0].P.length >= 2 && dist(this.toScr(o.subs[0].P[0]), this.toScr(p)) < 9;
          if (near !== this.penNearStart) { this.penNearStart = near; this.updateCursor(); }
          this.renderOverlay();
        }
        this.renderStatus();
        return;
      }
      switch (d.mode) {
        case 'pan': {
          const s = this.scrPt(e);
          this.view.x = d.v.x + s.x - d.s.x; this.view.y = d.v.y + s.y - d.s.y;
          d.moved = true;
          this.renderView();
          break;
        }
        case 'move': this.dragMove(p, e); break;
        case 'scale': this.dragScale(p, e); break;
        case 'rotate': this.dragRotate(p, e); break;
        case 'marquee': d.cur = p; this.renderOverlay(); break;
        case 'draw': this.dragDraw(p, e); break;
        case 'free': {
          const last = d.pts[d.pts.length - 1];
          if (dist(last, p) * this.view.z > 2) d.pts.push(p);
          this.renderOverlay();
          break;
        }
        case 'pen': {
          const o = this.get(this.pen.id), P = o.subs[0].P, pt = P[d.idx];
          if (dist(this.toScr(pt), this.toScr(p)) > 3) {
            let q = p;
            if (e.shiftKey) q = this.constrain(pt, p);
            pt.o = { x: q.x, y: q.y }; pt.i = { x: 2 * pt.x - q.x, y: 2 * pt.y - q.y }; pt.s = true;
            d.curved = true;
          } else if (!d.closing) { pt.o = null; pt.i = null; }
          this.renderObjs();
          this.renderOverlay();
          break;
        }
        case 'anchors': {
          const S = JSON.parse(d.snap);
          let dx = p.x - d.s.x, dy = p.y - d.s.y;
          if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
          this.objs = S.objs;
          this.convertSelectedForPoints();
          this.selPts.forEach((k) => {
            const [oid, si, pi] = k.split(':');
            const o = this.get(oid);
            const pt = o && o.subs[+si] && o.subs[+si].P[+pi];
            if (!pt) return;
            pt.x += dx; pt.y += dy;
            if (pt.i) { pt.i.x += dx; pt.i.y += dy; }
            if (pt.o) { pt.o.x += dx; pt.o.y += dy; }
          });
          d.moved = true;
          this.renderObjs(); this.renderOverlay();
          break;
        }
        case 'handle': {
          const o = this.get(d.o.id), pt = o.subs[d.si].P[d.pi];
          const hp = d.side === 'i' ? 'i' : 'o', op = hp === 'i' ? 'o' : 'i';
          pt[hp] = { x: p.x, y: p.y };
          if (pt.s && pt[op] && !e.altKey) {
            const len = dist(pt, pt[op]), a = Math.atan2(pt.y - p.y, pt.x - p.x);
            pt[op] = { x: pt.x + Math.cos(a) * len, y: pt.y + Math.sin(a) * len };
          }
          if (e.altKey) pt.s = false;
          d.moved = true;
          this.renderObjs(); this.renderOverlay();
          break;
        }
      }
    }

    constrain(a, p) {
      const dx = p.x - a.x, dy = p.y - a.y, ang = Math.atan2(dy, dx), len = Math.hypot(dx, dy);
      const s = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
      return { x: a.x + Math.cos(s) * len, y: a.y + Math.sin(s) * len };
    }

    dragMove(p, e) {
      const d = this.drag;
      let dx = p.x - d.s.x, dy = p.y - d.s.y;
      if (!d.moved && Math.hypot(dx, dy) * this.view.z < 2) return;
      if (e.shiftKey) { const q = this.constrain({ x: 0, y: 0 }, { x: dx, y: dy }); dx = q.x; dy = q.y; }
      const sn = this.snapDelta(d.U, dx, dy, new Set(d.snap.map((o) => o.id)));
      dx = sn.dx; dy = sn.dy;
      this.guides = sn.guides;
      d.snap.forEach((s) => {
        const o = this.get(s.id);
        if (!o) return;
        Object.assign(o, clone(s));
        translate(o, dx, dy);
      });
      d.moved = true; d.dx = dx; d.dy = dy;
      this.hint = { text: `dX: ${Math.round(dx)} px\ndY: ${Math.round(dy)} px`, at: this.mouseScr };
      this.renderObjs(); this.renderOverlay();
    }
    snapDelta(U, dx, dy, ignore) {
      const guides = [];
      if (!U) return { dx, dy, guides };
      if (this.flags.snap) {
        const g = 20;
        dx = Math.round((U.x + dx) / g) * g - U.x;
        dy = Math.round((U.y + dy) / g) * g - U.y;
        return { dx, dy, guides };
      }
      if (!this.flags.smart) return { dx, dy, guides };
      const tol = 6 / this.view.z;
      const tx = [{ v: 0 }, { v: this.AB.w / 2, c: 1 }, { v: this.AB.w }], ty = [{ v: 0 }, { v: this.AB.h / 2, c: 1 }, { v: this.AB.h }];
      this.objs.forEach((o) => {
        if (ignore.has(o.id) || o.hidden) return;
        const b = aabb(o);
        tx.push({ v: b.x }, { v: b.x + b.w / 2 }, { v: b.x + b.w });
        ty.push({ v: b.y }, { v: b.y + b.h / 2 }, { v: b.y + b.h });
      });
      const best = (vals, targets) => {
        let bd = Infinity, res = null;
        vals.forEach((v, vi) => targets.forEach((t) => { const df = t.v - v; if (Math.abs(df) < tol && Math.abs(df) < Math.abs(bd)) { bd = df; res = { df, t, vi }; } }));
        return res;
      };
      const bx = best([U.x + dx, U.x + U.w / 2 + dx, U.x + U.w + dx], tx);
      const by = best([U.y + dy, U.y + U.h / 2 + dy, U.y + U.h + dy], ty);
      if (bx) { dx += bx.df; guides.push({ x: bx.t.v, c: bx.t.c && bx.vi === 1 }); }
      if (by) { dy += by.df; guides.push({ y: by.t.v, c: by.t.c && by.vi === 1 }); }
      return { dx, dy, guides };
    }

    dragScale(p, e) {
      const d = this.drag, h = d.h, U = d.U;
      const hx = h.includes('e') ? 1 : h.includes('w') ? -1 : 0;
      const hy = h.includes('s') ? 1 : h.includes('n') ? -1 : 0;
      const r = d.rot;
      const c0 = center(U);
      const fromCenter = e.altKey;
      const anchorL = fromCenter ? c0 : { x: hx === 1 ? U.x : hx === -1 ? U.x + U.w : c0.x, y: hy === 1 ? U.y : hy === -1 ? U.y + U.h : c0.y };
      const Aw = rotPt(anchorL, c0, r);
      const m = rotPt(p, Aw, -r);
      let lx = m.x - Aw.x, ly = m.y - Aw.y;
      const k = fromCenter ? 2 : 1;
      let w = hx ? Math.max(1, hx * lx * k) : U.w;
      let hh = hy ? Math.max(1, hy * ly * k) : U.h;
      if (e.shiftKey && hx && hy) {
        const s = Math.max(w / U.w, hh / U.h);
        w = U.w * s; hh = U.h * s;
      } else if (e.shiftKey) {
        const s = hx ? w / U.w : hh / U.h;
        w = U.w * s; hh = U.h * s;
      }
      let cl;
      if (fromCenter) cl = { x: 0, y: 0 };
      else cl = { x: hx === 1 ? w / 2 : hx === -1 ? -w / 2 : 0, y: hy === 1 ? hh / 2 : hy === -1 ? -hh / 2 : 0 };
      const cw = rotPt({ x: Aw.x + cl.x, y: Aw.y + cl.y }, Aw, r);
      const nb = { x: cw.x - w / 2, y: cw.y - hh / 2, w, h: hh };
      if (d.single) {
        const o = this.get(d.snap[0].id);
        Object.assign(o, clone(d.snap[0]));
        setBBox(o, nb);
      } else {
        const sx = nb.w / (U.w || 1), sy = nb.h / (U.h || 1);
        d.snap.forEach((s) => {
          const o = this.get(s.id);
          Object.assign(o, clone(s));
          const b = bbox(o), c = center(b);
          const nc = { x: nb.x + (c.x - U.x) * sx, y: nb.y + (c.y - U.y) * sy };
          const ow = o.kind === 'text' ? b.w * sy : b.w * sx, oh = b.h * sy;
          setBBox(o, { x: nc.x - ow / 2, y: nc.y - oh / 2, w: ow, h: oh });
        });
      }
      d.moved = true;
      this.hint = { text: `W: ${Math.round(nb.w)} px\nH: ${Math.round(nb.h)} px`, at: this.mouseScr };
      this.renderObjs(); this.renderOverlay();
    }
    dragRotate(p, e) {
      const d = this.drag;
      let a = ((Math.atan2(p.y - d.c.y, p.x - d.c.x) - d.a0) * 180) / Math.PI;
      if (e.shiftKey) a = Math.round(a / 45) * 45;
      d.snap.forEach((s) => {
        const o = this.get(s.id);
        Object.assign(o, clone(s));
        const c = center(bbox(o));
        const nc = rotPt(c, d.c, a);
        translate(o, nc.x - c.x, nc.y - c.y);
        o.rot = (((s.rot || 0) + a) % 360 + 540) % 360 - 180;
      });
      d.moved = true; d.angle = a;
      this.hint = { text: `${Math.round(-a)}°`, at: this.mouseScr };
      this.renderObjs(); this.renderOverlay();
    }
    dragDraw(p, e) {
      const d = this.drag;
      let s = d.s, x2 = p.x, y2 = p.y;
      if (d.kind === 'line') {
        if (e.shiftKey) { const q = this.constrain(s, p); x2 = q.x; y2 = q.y; }
        if (!d.id) {
          const o = this.add({ kind: 'path', name: 'Line', subs: [{ P: [{ x: s.x, y: s.y, i: null, o: null }, { x: x2, y: y2, i: null, o: null }], c: false }], fill: 'none', stroke: this.def.stroke === 'none' ? '#000000' : clone(this.def.stroke) });
          d.id = o.id;
        }
        const o = this.get(d.id);
        o.subs[0].P[1].x = x2; o.subs[0].P[1].y = y2;
        this.hint = { text: `L: ${Math.round(dist(s, { x: x2, y: y2 }))} px\n∠ ${Math.round((-Math.atan2(y2 - s.y, x2 - s.x) * 180) / Math.PI)}°`, at: this.mouseScr };
      } else {
        let w = x2 - s.x, h = y2 - s.y;
        if (e.shiftKey) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
        let x = s.x, y = s.y;
        if (e.altKey) { x = s.x - Math.abs(w); y = s.y - Math.abs(h); w = Math.abs(w) * 2; h = Math.abs(h) * 2; }
        else { if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; } }
        if (!d.id) {
          const base = { kind: d.kind, x, y, w: Math.max(w, 0.5), h: Math.max(h, 0.5) };
          if (d.kind === 'polygon') base.sides = 6;
          if (d.kind === 'star') { base.pts = 5; base.inner = 0.45; }
          d.id = this.add(base).id;
          this.select([d.id], { silent: true });
        }
        const o = this.get(d.id);
        Object.assign(o, { x, y, w: Math.max(w, 0.5), h: Math.max(h, 0.5) });
        this.hint = { text: `W: ${Math.round(w)} px\nH: ${Math.round(h)} px`, at: this.mouseScr };
      }
      d.moved = true;
      this.renderObjs(); this.renderOverlay();
    }

    onUp(e) {
      const d = this.drag;
      this.drag = null;
      this.guides = null;
      this.hint = null;
      try { this.$.svg.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (!d) return;
      const p = this.toDoc(e);
      switch (d.mode) {
        case 'pan': if (d.moved) this.act('pan'); this.updateCursor(); break;
        case 'move':
          if (d.moved) { this.commit(); this.act('move', { dx: d.dx, dy: d.dy, count: d.snap.length }); }
          break;
        case 'scale': if (d.moved) { this.commit(); this.act('scale', { count: d.snap.length }); } break;
        case 'rotate': if (d.moved) { this.commit(); this.act('rotate', { angle: d.angle }); } break;
        case 'marquee': {
          if (d.cur) {
            const x1 = Math.min(d.s.x, d.cur.x), y1 = Math.min(d.s.y, d.cur.y), x2 = Math.max(d.s.x, d.cur.x), y2 = Math.max(d.s.y, d.cur.y);
            const hits = this.objs.filter((o) => {
              if (o.locked || o.hidden) return false;
              const b = aabb(o);
              return b.x < x2 && b.x + b.w > x1 && b.y < y2 && b.y + b.h > y1;
            }).map((o) => o.id);
            if (d.direct) {
              this.sel = new Set([...(d.add ? d.base : []), ...hits]);
              this.selPts = d.add ? this.selPts : new Set();
              hits.forEach((id) => {
                const o = this.get(id);
                if (o.kind !== 'path') return;
                o.subs.forEach((sp, si) => sp.P.forEach((pt, pi) => { if (pt.x >= x1 && pt.x <= x2 && pt.y >= y1 && pt.y <= y2) this.selPts.add(`${id}:${si}:${pi}`); }));
              });
              this.renderSelection();
              this.act('select', { count: this.sel.size, marquee: true });
            } else {
              const ids = this.expandGroups(hits);
              this.select(d.add ? [...new Set([...d.base, ...ids])] : ids);
              this.act('marquee', { count: ids.length });
            }
          }
          this.renderOverlay();
          break;
        }
        case 'draw': {
          if (!d.id) {
            if (d.kind === 'line') break;
            this.shapeDialog(d.kind, d.s);
            break;
          }
          const o = this.get(d.id);
          this.select([o.id], { silent: true });
          this.commit();
          this.act('create', { kind: o.kind, id: o.id, oname: o.name });
          break;
        }
        case 'free': {
          if (d.pts.length < 2) break;
          const pts = rdp(d.pts, 1.2 / this.view.z);
          const brush = this.tool === 'brush';
          const stroke = this.def.stroke === 'none' || isGrad(this.def.stroke) ? '#000000' : this.def.stroke;
          const o = this.add({ kind: 'path', name: brush ? 'Brush Stroke' : 'Path', subs: [{ P: smoothPts(pts), c: false }], fill: 'none', stroke, sw: brush ? Math.max(this.def.sw, 4) : this.def.sw, cap: 'round' });
          this.select([o.id], { silent: true });
          this.commit();
          this.act('create', { kind: 'path', id: o.id, tool: this.tool });
          break;
        }
        case 'pen':
          if (d.closing) this.finishPen();
          else { this.commit(true); this.renderAll(); }
          if (d.curved) this.act('penCurve');
          break;
        case 'anchors': if (d.moved) { this.commit(); this.act('anchorMove'); } break;
        case 'handle': if (d.moved) { this.commit(); this.act('handleMove'); } break;
      }
      this.renderAll();
    }
    onDbl(e) {
      if (this.tool !== 'select') return;
      const el = e.target.closest && e.target.closest('[data-id]');
      const o = el && this.get(el.dataset.id);
      if (o && o.kind === 'text') { this.setTool('type', true); this.startTextEdit(o); }
    }
    onWheel(e) {
      e.preventDefault();
      if (e.ctrlKey || e.altKey || e.metaKey) {
        this.zoomBy(Math.exp(-e.deltaY * (e.ctrlKey && !e.altKey ? 0.01 : 0.002)), this.scrPt(e));
      } else {
        const dx = e.shiftKey ? e.deltaY : e.deltaX, dy = e.shiftKey ? 0 : e.deltaY;
        this.view.x -= dx; this.view.y -= dy;
        this.renderView();
        this._panT && clearTimeout(this._panT);
        this._panT = setTimeout(() => this.act('pan', { wheel: true }), 200);
      }
    }

    /** when direct-selecting a primitive's anchor, convert it into a path */
    convertSelectedForPoints() {
      const ids = new Set([...this.selPts].map((k) => k.split(':')[0]));
      ids.forEach((id) => {
        const i = this.objs.findIndex((o) => o.id === id);
        if (i >= 0 && this.objs[i].kind !== 'path' && this.objs[i].kind !== 'text') this.objs[i] = toPath(this.objs[i]);
      });
    }
    anchorsOf(o) {
      if (o.kind === 'path') return o.subs.map((sp) => sp.P);
      if (o.kind === 'text') return [];
      return [toPath(clone(o)).subs[0].P];
    }

    /* ---------------------------------------------------------- keyboard */
    onKey(e) {
      if (!this.isActive()) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (this.$.dialog && !this.$.dialog.hidden) return;
      this.altDown = e.altKey;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key;
      if (k === ' ' && !e.repeat) { this.spaceHand = true; this.updateCursor(); e.preventDefault(); return; }
      if (k === 'Alt') { this.updateCursor(); return; }
      if (mod) {
        const kk = k.toLowerCase();
        const map = {
          z: () => (e.shiftKey ? this.redo() : this.undo()), y: () => this.redo(),
          a: () => (e.shiftKey ? this.select([]) : this.selectAll()),
          c: () => this.copy(), x: () => this.cut(), v: () => this.paste(e.shiftKey), d: () => this.duplicate(),
          g: () => (e.shiftKey ? this.ungroup() : this.group()),
          ']': () => this.arrange(e.shiftKey ? 'front' : 'forward'), '}': () => this.arrange('front'),
          '[': () => this.arrange(e.shiftKey ? 'back' : 'backward'), '{': () => this.arrange('back'),
          '=': () => this.zoomBy(1.25), '+': () => this.zoomBy(1.25), '-': () => this.zoomBy(0.8),
          0: () => this.fit(true), 1: () => this.zoomTo(1),
          r: () => this.toggleFlag('rulers'), u: () => this.toggleFlag('smart'), "'": () => this.toggleFlag(e.shiftKey ? 'snap' : 'grid'),
          '"': () => this.toggleFlag('snap'),
          y2: null,
          2: () => (e.altKey ? this.unlockAll() : this.lockSel()), 3: () => (e.altKey ? this.showAll() : this.hideSel()),
        };
        if (kk === 'y' && !e.shiftKey) { e.preventDefault(); this.toggleFlag('outline'); return; }
        const code = e.code === 'Digit2' ? 2 : e.code === 'Digit3' ? 3 : e.code === 'Digit0' ? 0 : e.code === 'Digit1' ? 1 : kk;
        if (map[code]) { e.preventDefault(); map[code](); }
        return;
      }
      if (k === 'Escape') {
        if (this.pen) return this.finishPen();
        this.closeMenu(); this.closePop(); this.closeFlyout();
        return;
      }
      if (k === 'Enter' && this.pen) { e.preventDefault(); return this.finishPen(); }
      if (k === 'Delete' || k === 'Backspace') {
        e.preventDefault();
        if (this.pen) {
          const o = this.get(this.pen.id);
          if (o && o.subs[0].P.length > 1) { o.subs[0].P.pop(); this.renderAll(); return; }
          return this.finishPen();
        }
        return this.deleteSel();
      }
      if (k.startsWith('Arrow')) {
        if (!this.sel.size) return;
        e.preventDefault();
        const s = e.shiftKey ? 10 : 1;
        const dx = k === 'ArrowLeft' ? -s : k === 'ArrowRight' ? s : 0, dy = k === 'ArrowUp' ? -s : k === 'ArrowDown' ? s : 0;
        this.selObjs().forEach((o) => !o.locked && translate(o, dx, dy));
        this.renderAll();
        clearTimeout(this._nudgeT);
        this._nudgeT = setTimeout(() => { this.commit(); this.act('move', { dx, dy, nudge: true }); }, 250);
        return;
      }
      if (e.shiftKey && k.toLowerCase() === 'x') { this.swapFillStroke(); return; }
      if (k === 'x' || k === 'X') { this.slot = this.slot === 'fill' ? 'stroke' : 'fill'; this.renderToolbarState(); this.renderColorPanel(); this.act('slot', { slot: this.slot }); return; }
      if (k === 'd' || k === 'D') { this.defaultColors(); return; }
      if (k === '/') { this.applyPaint(this.slot, 'none'); return; }
      if (k === 'F7') { e.preventDefault(); this.showTab('layers'); return; }
      const toolKey = Object.keys(TOOLS).find((t) => TOOLS[t].key && TOOLS[t].key.toLowerCase() === k.toLowerCase());
      if (toolKey && !e.altKey) { this.setTool(toolKey); }
    }
    onKeyUp(e) {
      this.altDown = e.altKey;
      if (e.key === ' ') { this.spaceHand = false; this.updateCursor(); }
      if (e.key === 'Alt') this.updateCursor();
    }

    /* ---------------------------------------------------------- commands */
    deleteSel() {
      if (!this.sel.size) return;
      if (this.selPts.size && this.tool === 'direct') {
        // delete anchor points
        this.convertSelectedForPoints();
        const byObj = {};
        this.selPts.forEach((k) => { const [id, si, pi] = k.split(':'); (byObj[id] = byObj[id] || []).push([+si, +pi]); });
        Object.entries(byObj).forEach(([id, list]) => {
          const o = this.get(id);
          list.sort((a, b) => b[1] - a[1]).forEach(([si, pi]) => o.subs[si] && o.subs[si].P.splice(pi, 1));
          o.subs = o.subs.filter((sp) => sp.P.length > 1);
          if (!o.subs.length) this.objs = this.objs.filter((x) => x !== o);
        });
        this.selPts.clear();
      } else {
        this.objs = this.objs.filter((o) => !this.sel.has(o.id));
        this.sel.clear();
      }
      this.commit(); this.renderAll();
      this.act('delete');
    }
    copy() { if (!this.sel.size) return; this.clip = clone(this.selObjs()); this.act('copy'); this.toast('Copied'); }
    cut() { if (!this.sel.size) return; this.copy(); this.deleteSel(); this.act('cut'); }
    paste(inPlace) {
      if (!this.clip) return;
      const gmap = {};
      const list = clone(this.clip).map((o) => {
        o.id = uid();
        if (o.gid) o.gid = gmap[o.gid] || (gmap[o.gid] = uid());
        if (!inPlace) translate(o, 12, 12);
        return o;
      });
      list.forEach((o) => this.objs.push(o));
      if (!inPlace) this.clip.forEach((o) => translate(o, 12, 12));
      this.select(list.map((o) => o.id), { silent: true });
      this.commit(); this.renderAll();
      this.act('paste', { count: list.length });
    }
    duplicate(inPlace, silent) {
      if (!this.sel.size) return;
      const gmap = {};
      const list = this.selObjs().map((o) => {
        const c = clone(o);
        c.id = uid();
        if (c.gid) c.gid = gmap[c.gid] || (gmap[c.gid] = uid());
        if (!inPlace) translate(c, 12, 12);
        return c;
      });
      list.forEach((o) => this.objs.push(o));
      this.select(list.map((o) => o.id), { silent: true });
      this.renderAll();
      if (!silent) { this.commit(); this.act('duplicate', { count: list.length }); }
      else this.act('duplicate', { count: list.length, alt: true });
    }
    arrange(how) {
      const sel = this.selObjs();
      if (!sel.length) return;
      const rest = this.objs.filter((o) => !this.sel.has(o.id));
      if (how === 'front') this.objs = rest.concat(sel);
      else if (how === 'back') this.objs = sel.concat(rest);
      else {
        const arr = this.objs.slice();
        if (how === 'forward') {
          for (let i = arr.length - 2; i >= 0; i--) if (this.sel.has(arr[i].id) && !this.sel.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        } else {
          for (let i = 1; i < arr.length; i++) if (this.sel.has(arr[i].id) && !this.sel.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
        }
        this.objs = arr;
      }
      this.commit(); this.renderAll();
      this.act('arrange', { how });
    }
    group() {
      const sel = this.selObjs();
      if (sel.length < 2) return this.toast('Select 2 or more objects to group them');
      const gid = 'g' + uid();
      const topIdx = Math.max(...sel.map((o) => this.objs.indexOf(o)));
      const rest = this.objs.filter((o) => !this.sel.has(o.id));
      const before = this.objs.slice(0, topIdx + 1).filter((o) => !this.sel.has(o.id)).length;
      sel.forEach((o) => { o.gid = gid; });
      this.objs = rest.slice(0, before).concat(sel, rest.slice(before));
      this.commit(); this.renderAll();
      this.act('group', { count: sel.length });
    }
    ungroup() {
      const sel = this.selObjs();
      if (!sel.some((o) => o.gid)) return;
      sel.forEach((o) => { delete o.gid; });
      this.commit(); this.renderAll();
      this.act('ungroup');
    }
    lockSel() { this.selObjs().forEach((o) => { o.locked = true; }); this.sel.clear(); this.commit(); this.renderAll(); this.act('lock'); }
    unlockAll() { const ids = this.objs.filter((o) => o.locked).map((o) => o.id); this.objs.forEach((o) => { o.locked = false; }); this.sel = new Set(ids); this.commit(); this.renderAll(); this.act('unlock'); }
    hideSel() { this.selObjs().forEach((o) => { o.hidden = true; }); this.sel.clear(); this.commit(); this.renderAll(); this.act('hide'); }
    showAll() { const ids = this.objs.filter((o) => o.hidden).map((o) => o.id); this.objs.forEach((o) => { o.hidden = false; }); this.sel = new Set(ids); this.commit(); this.renderAll(); this.act('show'); }
    reflect(axis) {
      this.selObjs().forEach((o) => {
        if (o.kind === 'path') {
          const c = center(bbox(o));
          eachPt(o, (p) => { if (axis === 'x') p.x = 2 * c.x - p.x; else p.y = 2 * c.y - p.y; });
          o.rot = -(o.rot || 0);
        } else {
          if (axis === 'x') o.flipX = !o.flipX; else o.flipY = !o.flipY;
          o.rot = -(o.rot || 0);
        }
      });
      this.commit(); this.renderAll();
      this.act('reflect', { axis });
    }
    rotateBy(a) {
      const list = this.selObjs();
      const U = union(list), c = center(U);
      list.forEach((o) => {
        const oc = center(bbox(o)), nc = rotPt(oc, c, a);
        translate(o, nc.x - oc.x, nc.y - oc.y);
        o.rot = (((o.rot || 0) + a) % 360 + 540) % 360 - 180;
      });
      this.commit(); this.renderAll();
      this.act('rotate', { angle: a });
    }
    resetRotation() { this.selObjs().forEach((o) => { o.rot = 0; }); this.commit(); this.renderAll(); this.act('rotate', { reset: true }); }
    changeCase(how) {
      const t = this.selObjs().filter((o) => o.kind === 'text');
      if (!t.length) return this.toast('Select some text first');
      t.forEach((o) => {
        o.text = how === 'upper' ? o.text.toUpperCase() : how === 'lower' ? o.text.toLowerCase() : o.text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
        o._bb = null;
      });
      this.commit(); this.renderAll();
      this.act('case', { how });
    }
    toggleFx(k) {
      const sel = this.selObjs();
      if (!sel.length) return this.toast('Select an object first');
      const on = !sel.every((o) => o.fx && o.fx[k]);
      sel.forEach((o) => { o.fx = { ...(o.fx || {}), [k]: on }; });
      this.commit(); this.renderAll();
      this.act('effect', { fx: k, on });
    }
    toggleFlag(f) {
      this.flags[f] = !this.flags[f];
      if (f === 'snap' && this.flags.snap) this.flags.grid = true;
      this.$.objs.classList.toggle('outline', this.flags.outline);
      this.renderView();
      if (f === 'rulers') this.resize();
      this.act('view', { flag: f, on: this.flags[f] });
    }
    showTab(t) {
      if (['properties', 'layers'].includes(t)) this.tabA = t; else this.tabB = t;
      if (!this.dockOpen) { this.dockOpen = true; this.root.classList.remove('dock-closed'); this.resize(); }
      this.renderPanels();
      this.act('panel', { tab: t });
    }
    resetWorkspace() {
      this.tabA = 'properties'; this.tabB = 'swatches'; this.dockOpen = true; this.root.classList.remove('dock-closed');
      this.flags.rulers = true; this.flags.outline = false;
      this.resize(); this.fit(); this.renderAll();
      this.act('resetWorkspace');
    }
    newDoc() {
      const go = () => { this.reset(); this.act('new'); };
      if (!this.objs.length) return go();
      const msg = 'Start a new empty document? Your current drawing will be cleared.';
      if (this.opts.confirm) this.opts.confirm(msg, 'Start new', go);
      else if (window.confirm(msg)) go();
    }
    setProp(k, v, opts = {}) {
      const sel = this.selObjs();
      sel.forEach((o) => {
        if (k === 'font' || k === 'size' || k === 'weight' || k === 'align') { if (o.kind === 'text') { o[k] = v; o._bb = null; } }
        else if (k === 'r') { if (o.kind === 'rect') o.r = v; }
        else if (k === 'sides') { if (o.kind === 'polygon') o.sides = clamp(Math.round(v), 3, 20); }
        else if (k === 'pts') { if (o.kind === 'star') o.pts = clamp(Math.round(v), 3, 20); }
        else if (k === 'inner') { if (o.kind === 'star') o.inner = clamp(v, 0.1, 0.95); }
        else o[k] = v;
      });
      if (k === 'sw') this.def.sw = v;
      if (k === 'op' && !sel.length) this.def.op = v;
      this.renderAll();
      if (!opts.noCommit) { this.commit(); this.act('prop', { k, v }); }
    }

    /* ------------------------------------------------------------- color */
    currentPaint(slot) {
      const s = this.selObjs()[0];
      return s ? s[slot] : this.def[slot];
    }
    applyPaint(slot, paint) {
      this.def[slot] = clone(paint);
      const sel = this.selObjs();
      sel.forEach((o) => { o[slot] = clone(paint); });
      this.renderAll();
      if (sel.length) this.commit();
      this.act(slot === 'fill' ? 'fill' : 'stroke', { paint, count: sel.length });
    }
    swapFillStroke() {
      const sel = this.selObjs();
      if (sel.length) sel.forEach((o) => { if (o.kind === 'text') return; [o.fill, o.stroke] = [o.stroke, o.fill]; });
      [this.def.fill, this.def.stroke] = [this.def.stroke, this.def.fill];
      this.renderAll();
      if (sel.length) this.commit();
      this.act('swap');
    }
    defaultColors() {
      this.def.fill = '#FFFFFF'; this.def.stroke = '#000000'; this.def.sw = 1;
      this.selObjs().forEach((o) => { if (o.kind === 'text') { o.fill = '#000000'; o.stroke = 'none'; } else { o.fill = '#FFFFFF'; o.stroke = '#000000'; o.sw = 1; } });
      this.renderAll();
      if (this.sel.size) this.commit();
      this.act('defaultColors');
    }

    /* --------------------------------------------------------------- align */
    align(how) {
      const sel = this.selObjs();
      if (!sel.length) return this.toast('Select something to align');
      const toAB = this.alignTo === 'artboard' || (this.alignTo === 'auto' && (sel.length === 1 || new Set(sel.map((o) => o.gid || o.id)).size === 1));
      const T = toAB ? { x: 0, y: 0, w: this.AB.w, h: this.AB.h } : union(sel);
      // groups move as units
      const units = {};
      sel.forEach((o) => { const k = o.gid || o.id; (units[k] = units[k] || []).push(o); });
      Object.values(units).forEach((list) => {
        const b = union(list);
        let dx = 0, dy = 0;
        if (how === 'left') dx = T.x - b.x;
        if (how === 'hcenter') dx = T.x + T.w / 2 - (b.x + b.w / 2);
        if (how === 'right') dx = T.x + T.w - (b.x + b.w);
        if (how === 'top') dy = T.y - b.y;
        if (how === 'vcenter') dy = T.y + T.h / 2 - (b.y + b.h / 2);
        if (how === 'bottom') dy = T.y + T.h - (b.y + b.h);
        list.forEach((o) => translate(o, dx, dy));
      });
      this.commit(); this.renderAll();
      this.act('align', { how, toArtboard: toAB });
    }

    /* ------------------------------------------------------------ pathfinder */
    toPaper(o) {
      const P = window.paper;
      const item = P.PathItem.create(localD(o));
      const c = center(bbox(o));
      if (o.flipX || o.flipY) item.scale(o.flipX ? -1 : 1, o.flipY ? -1 : 1, new P.Point(c.x, c.y));
      if (o.rot) item.rotate(o.rot, new P.Point(c.x, c.y));
      return item;
    }
    pathfinder(op) {
      const P = window.paper;
      if (!P) return this.toast('Pathfinder engine is still loading — try again in a second');
      const sel = this.selObjs();
      if (sel.length < 2) return this.toast('Select 2 or more shapes for Pathfinder');
      if (sel.some((o) => o.kind === 'text')) return this.toast('Pathfinder works on shapes, not text');
      if (!this._paperReady) { P.setup(new P.Size(10, 10)); this._paperReady = true; }
      const ordered = this.objs.filter((o) => this.sel.has(o.id));
      const items = ordered.map((o) => this.toPaper(o));
      let res;
      try {
        if (op === 'unite') res = items.reduce((a, b) => a.unite(b));
        else if (op === 'minus') res = items.slice(1).reduce((a, b) => a.subtract(b), items[0]);
        else if (op === 'intersect') res = items.reduce((a, b) => a.intersect(b));
        else if (op === 'exclude') res = items.reduce((a, b) => a.exclude(b));
      } catch (err) { console.error(err); return this.toast('Could not combine these shapes'); }
      const paths = res ? (res.children ? res.children.slice() : [res]) : [];
      const subs = paths.filter((pp) => pp.segments && pp.segments.length > 1).map((pp) => ({
        c: pp.closed,
        P: pp.segments.map((s) => {
          const pt = s.point, hi = s.handleIn, ho = s.handleOut;
          return { x: pt.x, y: pt.y, i: hi.isZero() ? null : { x: pt.x + hi.x, y: pt.y + hi.y }, o: ho.isZero() ? null : { x: pt.x + ho.x, y: pt.y + ho.y }, s: !hi.isZero() && !ho.isZero() };
        }),
      }));
      if (P.project) P.project.clear();
      if (!subs.length) return this.toast('These shapes do not overlap — nothing is left!');
      const styleFrom = op === 'minus' ? ordered[0] : ordered[ordered.length - 1];
      const n = { id: uid(), kind: 'path', name: subs.length > 1 ? 'Compound Path' : 'Path', subs, fill: clone(styleFrom.fill), stroke: clone(styleFrom.stroke), sw: styleFrom.sw, op: styleFrom.op, rot: 0, fx: styleFrom.fx };
      const idx = this.objs.indexOf(ordered[0]);
      this.objs = this.objs.filter((o) => !this.sel.has(o.id));
      this.objs.splice(Math.min(idx, this.objs.length), 0, n);
      this.select([n.id], { silent: true });
      this.commit(); this.renderAll();
      this.act('pathfinder', { op });
    }

    /* ----------------------------------------------------------- text edit */
    startTextEdit(o, isNew) {
      this.editingText = o.id;
      this.editingIsNew = !!isNew;
      const te = this.$.textedit, z = this.view.z;
      te.hidden = false;
      te.innerText = o.text;
      const sc = this.toScr({ x: o.x, y: o.y });
      Object.assign(te.style, {
        left: sc.x + 'px', top: (sc.y - o.size * z * 0.98) + 'px', fontSize: o.size * z + 'px',
        fontFamily: fontStack(o.font), fontWeight: o.weight || 400, lineHeight: 1.2,
        color: isGrad(o.fill) ? o.fill.s[0] : o.fill === 'none' ? '#000' : o.fill,
        textAlign: o.align || 'left',
      });
      this.renderObjs();
      te.focus();
      setTimeout(() => {
        te.focus();
        const r = document.createRange();
        r.selectNodeContents(te);
        if (!isNew) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      }, 0);
      this.renderOverlay();
      this.act('textEditStart');
    }
    endTextEdit(silent) {
      if (!this.editingText) return;
      const o = this.get(this.editingText);
      const te = this.$.textedit;
      this.editingText = null;
      te.hidden = true;
      if (o) {
        o.text = te.innerText.replace(/\n$/, '');
        o._bb = null;
        if (!o.text.trim()) { this.objs = this.objs.filter((x) => x !== o); this.sel.delete(o.id); }
      }
      this.renderAll();
      if (!silent) {
        this.commit();
        if (o && o.text.trim()) this.act('type', { text: o.text, id: o.id, isNew: this.editingIsNew });
      }
    }

    /* ---------------------------------------------------------------- dialog */
    shapeDialog(kind, at) {
      const fields = kind === 'polygon' ? [['Radius', 50], ['Sides', 6]] : kind === 'star' ? [['Radius 1', 50], ['Radius 2', 25], ['Points', 5]] : [['Width', 100], ['Height', 100]];
      const title = { rect: 'Rectangle', ellipse: 'Ellipse', polygon: 'Polygon', star: 'Star' }[kind];
      this.dialog(title, fields, (v) => {
        let o;
        if (kind === 'polygon') { const r = v[0]; o = { kind, x: at.x - r, y: at.y - r, w: r * 2, h: r * 2, sides: clamp(Math.round(v[1]), 3, 20) }; }
        else if (kind === 'star') { const r = v[0]; o = { kind, x: at.x - r, y: at.y - r, w: r * 2, h: r * 2, pts: clamp(Math.round(v[2]), 3, 20), inner: clamp(v[1] / (v[0] || 1), 0.1, 0.95) }; }
        else o = { kind, x: at.x, y: at.y, w: Math.max(1, v[0]), h: Math.max(1, v[1]) };
        o = this.add(o);
        this.select([o.id], { silent: true });
        this.commit(); this.renderAll();
        this.act('create', { kind, id: o.id, dialog: true });
      });
    }
    dialog(title, fields, onOk) {
      const d = this.$.dialog;
      d.hidden = false;
      d.innerHTML = `<div class="ai-dialog" role="dialog" aria-label="${title}"><div class="ai-dialog-title">${title}</div>
        <div class="ai-dialog-body">${fields.map((f, i) => `<label><span>${f[0]}:</span><input type="number" value="${f[1]}" data-i="${i}" step="any"> <em>${f[0].match(/Sides|Points/) ? '' : 'px'}</em></label>`).join('')}</div>
        <div class="ai-dialog-btns"><button data-x="cancel">Cancel</button><button data-x="ok" class="primary">OK</button></div></div>`;
      const close = () => { d.hidden = true; d.innerHTML = ''; };
      const ok = () => { const v = [...d.querySelectorAll('input')].map((i) => parseFloat(i.value) || 0); close(); onOk(v); };
      d.querySelector('[data-x=ok]').onclick = ok;
      d.querySelector('[data-x=cancel]').onclick = close;
      d.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(); }));
      setTimeout(() => { const i = d.querySelector('input'); i && (i.focus(), i.select()); }, 0);
      this.act('dialog', { title });
    }
    toast(msg) {
      const t = this.$.toast;
      t.textContent = msg; t.hidden = false;
      t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => { t.hidden = true; }, 2600);
    }

    /* --------------------------------------------------------------- render */
    renderAll() {
      this.renderObjs();
      this.renderSelection();
    }
    renderSelection() {
      this.renderOverlay();
      this.renderPanels();
      this.renderCtrl();
      this.renderToolbarState();
      this.renderStatus();
      this.emit('select');
    }

    paintAttr(p, id, slot, defs) {
      if (!p || p === 'none') return 'none';
      if (!isGrad(p)) return p;
      const gid = `${id}-${slot}`;
      const stops = p.s.map((c, i) => `<stop offset="${i / (p.s.length - 1)}" stop-color="${c}"/>`).join('');
      defs.push(p.g === 'rad'
        ? `<radialGradient id="${gid}">${stops}</radialGradient>`
        : `<linearGradient id="${gid}" gradientTransform="rotate(${p.a || 0} .5 .5)">${stops}</linearGradient>`);
      return `url(#${gid})`;
    }
    objMarkup(o, pfx, defs) {
      const b = bbox(o), c = center(b);
      const id = pfx + o.id;
      let tf = '';
      if (o.rot) tf += `rotate(${r1(o.rot)} ${r1(c.x)} ${r1(c.y)})`;
      if (o.flipX || o.flipY) tf += ` translate(${c.x} ${c.y}) scale(${o.flipX ? -1 : 1} ${o.flipY ? -1 : 1}) translate(${-c.x} ${-c.y})`;
      const fill = this.paintAttr(o.fill, id, 'f', defs), stroke = this.paintAttr(o.stroke, id, 's', defs);
      let filt = '';
      if (o.fx && (o.fx.shadow || o.fx.blur)) {
        defs.push(`<filter id="${id}-fx" x="-50%" y="-50%" width="200%" height="200%">${o.fx.blur ? '<feGaussianBlur stdDeviation="4" result="b"/>' : ''}${o.fx.shadow ? `<feDropShadow ${o.fx.blur ? 'in="b" ' : ''}dx="7" dy="7" stdDeviation="5" flood-color="#000" flood-opacity=".35"/>` : ''}</filter>`);
        filt = ` filter="url(#${id}-fx)"`;
      }
      const common = `fill="${fill}" stroke="${stroke}" stroke-width="${o.sw}"${o.cap ? ` stroke-linecap="${o.cap}" stroke-linejoin="round"` : ''}`;
      let inner;
      if (o.kind === 'text') {
        const lines = o.text.split('\n');
        const anchor = o.align === 'center' ? 'middle' : o.align === 'right' ? 'end' : 'start';
        inner = `<text class="vis" x="${o.x}" y="${o.y}" font-family="${esc(fontStack(o.font))}" font-size="${o.size}" font-weight="${o.weight || 400}" text-anchor="${anchor}" ${common} paint-order="stroke" xml:space="preserve">${lines.map((l, i) => `<tspan x="${o.x}" dy="${i ? o.size * 1.2 : 0}">${esc(l) || ' '}</tspan>`).join('')}</text>`;
        if (!pfx && o._bb) inner += `<rect class="hit" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="transparent"/>`;
      } else {
        const d = localD(o);
        inner = `<path class="vis" d="${d}" ${common}${o.kind === 'path' && o.subs.length > 1 ? ' fill-rule="evenodd"' : ''}/>`;
        if (!pfx) inner += `<path class="hit" d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(o.sw, 9 / this.view.z)}"/>`;
      }
      const hidden = o.hidden || (this.editingText === o.id && !pfx);
      return `<g ${pfx ? '' : `data-id="${o.id}" `}class="obj${o.locked ? ' locked' : ''}"${tf ? ` transform="${tf}"` : ''} opacity="${o.op}"${filt}${hidden ? ' style="display:none"' : ''}>${inner}</g>`;
    }
    renderObjs() {
      const defs = [];
      const html = this.objs.map((o) => this.objMarkup(o, '', defs)).join('');
      this.$.objs.innerHTML = html;
      this.$.defs.querySelectorAll('.dyn').forEach((n) => n.remove());
      if (defs.length) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'dyn');
        g.innerHTML = defs.join('');
        this.$.defs.appendChild(g);
      }
      this.$.objs.classList.toggle('outline', this.flags.outline);
      // measure text
      let changed = false;
      this.$.objs.querySelectorAll('[data-id] text').forEach((t) => {
        const o = this.get(t.parentNode.dataset.id);
        if (!o) return;
        try {
          const bb = t.getBBox();
          if (!bb.width && !bb.height) return;
          const nb = { dx: bb.x - o.x, dy: bb.y - o.y, w: bb.width, h: bb.height };
          if (!o._bb || Math.abs(o._bb.w - nb.w) > 0.5 || Math.abs(o._bb.h - nb.h) > 0.5 || Math.abs(o._bb.dx - nb.dx) > 0.5) { o._bb = nb; changed = true; }
        } catch (e) { /* not rendered */ }
      });
      if (changed && !this._remeasure) { this._remeasure = true; this.renderObjs(); this._remeasure = false; }
      this.renderTemplate();
      if (!this._remeasure) this.renderLayers();
    }
    renderTemplate() {
      const t = this.template;
      this.$.tmpl.innerHTML = t ? `<g class="tmpl">${(t.paths || []).map((d) => `<path d="${d}" fill="${t.fill || 'none'}" stroke="${t.stroke || '#00A3FF'}" stroke-width="${2 / this.view.z}" stroke-dasharray="${6 / this.view.z} ${5 / this.view.z}" opacity=".85"/>`).join('')}${(t.dots || []).map((p, i) => `<g><circle cx="${p[0]}" cy="${p[1]}" r="${7 / this.view.z}" fill="#00A3FF" opacity=".25"/><circle cx="${p[0]}" cy="${p[1]}" r="${3 / this.view.z}" fill="#00A3FF"/><text x="${p[0] + 9 / this.view.z}" y="${p[1] - 9 / this.view.z}" font-size="${12 / this.view.z}" fill="#0077cc" font-family="Poppins,sans-serif" font-weight="600">${i + 1}</text></g>`).join('')}${t.label ? `<text x="${t.label[1]}" y="${t.label[2]}" font-size="${14}" fill="#0077cc" font-family="Poppins,sans-serif" text-anchor="middle" font-weight="600">${esc(t.label[0])}</text>` : ''}</g>` : '';
    }
    setTemplate(t) { this.template = t; this.renderTemplate(); }

    renderOverlay() {
      if (!this.W) return;
      const z = this.view.z, out = [];
      const vpT = `translate(${this.view.x} ${this.view.y}) scale(${z})`;
      const outlinePath = (o, cls) => {
        const b = bbox(o), c = center(b);
        let tf = vpT;
        if (o.rot) tf += ` rotate(${o.rot} ${c.x} ${c.y})`;
        if (o.flipX || o.flipY) tf += ` translate(${c.x} ${c.y}) scale(${o.flipX ? -1 : 1} ${o.flipY ? -1 : 1}) translate(${-c.x} ${-c.y})`;
        return `<path class="${cls}" d="${localD(o)}" transform="${tf}"/>`;
      };
      // hover
      if (this.hover && !this.sel.has(this.hover) && !this.drag) {
        const o = this.get(this.hover);
        if (o && !o.locked) this.groupMembers(o).forEach((m) => out.push(outlinePath(m, 'ov-hover')));
      }
      const sel = this.selObjs().filter((o) => !o.hidden);
      sel.forEach((o) => out.push(outlinePath(o, 'ov-outline')));
      // bounding box
      if (sel.length && (this.tool === 'select' || this.tool === 'rotate') && !this.editingText && !(this.drag && this.drag.mode === 'pen')) {
        const single = sel.length === 1 && !sel[0].gid;
        let cs;
        if (single) cs = corners(sel[0]);
        else { const U = union(sel); cs = [{ x: U.x, y: U.y }, { x: U.x + U.w, y: U.y }, { x: U.x + U.w, y: U.y + U.h }, { x: U.x, y: U.y + U.h }]; }
        const S = cs.map((p) => this.toScr(p));
        out.push(`<polygon class="ov-bbox" points="${S.map((p) => `${p.x},${p.y}`).join(' ')}"/>`);
        if (this.tool === 'select' && !(this.drag && this.drag.moved && this.drag.mode === 'move')) {
          const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
          const hs = { nw: S[0], n: mid(S[0], S[1]), ne: S[1], e: mid(S[1], S[2]), se: S[2], s: mid(S[2], S[3]), sw: S[3], w: mid(S[3], S[0]) };
          const C0 = { x: (S[0].x + S[2].x) / 2, y: (S[0].y + S[2].y) / 2 };
          ['nw', 'ne', 'se', 'sw'].forEach((k) => {
            const dx = hs[k].x - C0.x, dy = hs[k].y - C0.y, L = Math.hypot(dx, dy) || 1;
            out.push(`<circle class="ov-rz" data-rz="1" cx="${hs[k].x + (dx / L) * 12}" cy="${hs[k].y + (dy / L) * 12}" r="14"/>`);
          });
          Object.entries(hs).forEach(([k, p]) => out.push(`<rect class="ov-handle" data-h="${k}" x="${p.x - 4}" y="${p.y - 4}" width="8" height="8"/>`));
          if (single) {
            const c = this.toScr(center(bbox(sel[0])));
            out.push(`<circle class="ov-center" cx="${c.x}" cy="${c.y}" r="2.5"/>`);
          }
        }
      }
      // direct selection anchors
      if (this.tool === 'direct' || this.tool === 'pen') {
        sel.forEach((o) => {
          if (o.kind === 'text') return;
          const subs = this.anchorsOf(o);
          subs.forEach((P, si) => P.forEach((pt, pi) => {
            const key = `${o.id}:${si}:${pi}`, on = this.selPts.has(key) || (this.tool === 'pen' && this.pen && this.pen.id === o.id && pi === P.length - 1);
            const S = this.toScr(pt);
            if (on && o.kind === 'path') {
              ['i', 'o'].forEach((side) => {
                if (!pt[side]) return;
                const H = this.toScr(pt[side]);
                out.push(`<line class="ov-hline" x1="${S.x}" y1="${S.y}" x2="${H.x}" y2="${H.y}"/><circle class="ov-hdot" data-hh="${o.id}:${si}:${pi}:${side}" cx="${H.x}" cy="${H.y}" r="3.5"/>`);
              });
            }
            out.push(`<rect class="ov-anchor${on ? ' on' : ''}" data-a="${key}" x="${S.x - 3.5}" y="${S.y - 3.5}" width="7" height="7"/>`);
          }));
        });
      }
      // pen preview
      if (this.tool === 'pen' && this.pen && this.penHover && !this.drag) {
        const o = this.get(this.pen.id);
        if (o) {
          const P = o.subs[0].P, last = P[P.length - 1], h = this.penHover;
          const a = this.toScr(last), b = this.toScr(this.penNearStart ? P[0] : h), c1 = last.o ? this.toScr(last.o) : a;
          const c2 = this.penNearStart && P[0].i ? this.toScr(P[0].i) : b;
          out.push(`<path class="ov-rubber" d="M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}"/>`);
          if (this.penNearStart) { const s = this.toScr(P[0]); out.push(`<circle class="ov-close" cx="${s.x}" cy="${s.y}" r="8"/>`); }
        }
      }
      // freehand preview
      if (this.drag && this.drag.mode === 'free') {
        out.push(`<polyline class="ov-free" points="${this.drag.pts.map((p) => { const s = this.toScr(p); return `${s.x},${s.y}`; }).join(' ')}"/>`);
      }
      // marquee
      if (this.drag && this.drag.mode === 'marquee' && this.drag.cur) {
        const a = this.toScr(this.drag.s), b = this.toScr(this.drag.cur);
        out.push(`<rect class="ov-marquee" x="${Math.min(a.x, b.x)}" y="${Math.min(a.y, b.y)}" width="${Math.abs(b.x - a.x)}" height="${Math.abs(b.y - a.y)}"/>`);
      }
      // smart guides
      (this.guides || []).forEach((g) => {
        if (g.x != null) { const s = this.toScr({ x: g.x, y: 0 }); out.push(`<line class="ov-guide" x1="${s.x}" y1="0" x2="${s.x}" y2="${this.H}"/>`); if (g.c) out.push(`<text class="ov-glabel" x="${s.x + 6}" y="${this.toScr({ x: 0, y: this.AB.h / 2 }).y}">center</text>`); }
        if (g.y != null) { const s = this.toScr({ x: 0, y: g.y }); out.push(`<line class="ov-guide" x1="0" y1="${s.y}" x2="${this.W}" y2="${s.y}"/>`); if (g.c) out.push(`<text class="ov-glabel" x="${this.toScr({ x: this.AB.w / 2, y: 0 }).x + 6}" y="${s.y - 6}">center</text>`); }
      });
      // measurement hint
      if (this.hint && this.hint.at) {
        const lines = this.hint.text.split('\n');
        const x = this.hint.at.x + 16, y = this.hint.at.y + 14;
        out.push(`<g class="ov-hint"><rect x="${x}" y="${y}" width="${Math.max(...lines.map((l) => l.length)) * 6.4 + 12}" height="${lines.length * 14 + 6}" rx="2"/>${lines.map((l, i) => `<text x="${x + 6}" y="${y + 14 + i * 14}">${esc(l)}</text>`).join('')}</g>`);
      }
      this.$.ov.innerHTML = out.join('');
    }

    renderStatus() {
      const z = Math.round(this.view.z * 100);
      const sel = this.selObjs();
      const rot = sel.length === 1 ? Math.round(-(sel[0].rot || 0)) : 0;
      const presets = [25, 50, 66.67, 100, 150, 200, 300, 400, 800];
      const opts = presets.map((p) => `<option value="${p}"${Math.abs(p - z) < 0.5 ? ' selected' : ''}>${p}%</option>`).join('');
      const mp = this.mouseDoc ? `X: ${Math.round(this.mouseDoc.x)}  Y: ${Math.round(this.mouseDoc.y)}` : '';
      this.$.status.innerHTML = `<select class="ai-zoomsel" data-hl="zoom-select">${presets.some((p) => Math.abs(p - z) < 0.5) ? '' : `<option selected>${z}%</option>`}${opts}</select>
        <span class="ai-st-rot">↻ ${rot}°</span>
        <span class="ai-st-ab">◂ <b>1</b> ▸</span>
        <span class="ai-st-tool">${TOOLS[this.tool].name.replace(' Tool', '')}</span>
        <span class="ai-st-pos">${mp}</span>`;
      const zs = this.$.status.querySelector('.ai-zoomsel');
      zs.onchange = () => { const v = parseFloat(zs.value); if (v) this.zoomTo(v / 100); };
    }

    renderToolbarState() {
      const tb = this.$.toolbar;
      tb.querySelectorAll('.ai-tool').forEach((b) => {
        const g = TOOL_GROUPS[+b.dataset.group];
        if (g.length > 1) {
          const shown = this.groupShown[g[0]];
          if (b.dataset.tool !== shown) { b.dataset.tool = shown; b.dataset.hl = 'tool-' + shown; b.innerHTML = svgIcon(shown); b.setAttribute('aria-label', TOOLS[shown].name); }
        }
        b.classList.toggle('on', b.dataset.tool === this.tool);
      });
      const f = this.currentPaint('fill'), s = this.currentPaint('stroke');
      const fi = tb.querySelector('.ai-fs-fill i'), si = tb.querySelector('.ai-fs-stroke i');
      fi.style.background = paintCss(f); fi.classList.toggle('none', f === 'none');
      si.style.borderColor = isGrad(s) ? s.s[0] : s === 'none' ? '#fff' : s;
      si.style.background = isGrad(s) ? gradCss(s) : 'transparent';
      si.classList.toggle('none', s === 'none');
      tb.querySelector('.ai-fs-squares').classList.toggle('stroke-front', this.slot === 'stroke');
    }

    /* ---------------------------------------------------------- control bar */
    renderCtrl() {
      const sel = this.selObjs();
      const kinds = [...new Set(sel.map((o) => (o.gid ? 'Group' : o.kind === 'text' ? 'Type' : o.kind === 'path' ? (o.name === 'Line' ? 'Line' : 'Path') : o.name)))];
      const label = !sel.length ? 'No Selection' : kinds.length === 1 ? kinds[0] : 'Mixed Objects';
      const f = this.currentPaint('fill'), s = this.currentPaint('stroke');
      const sw = sel.length ? sel[0].sw : this.def.sw;
      const op = sel.length ? sel[0].op : this.def.op;
      const t = sel.find((o) => o.kind === 'text');
      this.$.ctrl.innerHTML = `
        <span class="ai-c-label">${label}</span>
        <span class="ai-c-sep"></span>
        <span class="ai-c-item" data-hl="ctrl-fill"><button class="ai-swbtn" data-pop="fill" style="background:${paintCss(f)}"${f === 'none' ? ' data-none' : ''}></button><span class="ai-c-caret">▾</span></span>
        <span class="ai-c-item" data-hl="ctrl-stroke"><button class="ai-swbtn stroke" data-pop="stroke" style="border-color:${isGrad(s) ? s.s[0] : s === 'none' ? '#888' : s}"${s === 'none' ? ' data-none' : ''}></button><span class="ai-c-caret">▾</span></span>
        <span class="ai-c-item"><a class="ai-c-link">Stroke:</a><input class="ai-num" type="number" min="0" max="200" step="0.5" value="${sw}" data-k="sw"> pt</span>
        <span class="ai-c-sep"></span>
        <span class="ai-c-item"><a class="ai-c-link">Opacity:</a><input class="ai-num" type="number" min="0" max="100" step="5" value="${Math.round(op * 100)}" data-k="op">%</span>
        ${t ? `<span class="ai-c-sep"></span><span class="ai-c-item"><a class="ai-c-link">Character:</a><select data-k="font">${Object.keys(FONTS).map((fn) => `<option${fn === t.font ? ' selected' : ''}>${fn}</option>`).join('')}</select><input class="ai-num" type="number" min="1" value="${r1(t.size)}" data-k="size"> pt</span>` : ''}
        <span class="ai-c-spacer"></span>
        <span class="ai-c-item ai-c-align">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map((a) => `<button data-align="${a}" title="Align ${a}">${this.alignIcon(a)}</button>`).join('')}</span>`;
      this.bindInputs(this.$.ctrl);
    }

    alignIcon(a) {
      const I = {
        left: '<path d="M3 2v16" stroke="currentColor"/><rect x="5" y="5" width="9" height="3" fill="currentColor"/><rect x="5" y="11" width="6" height="3" fill="currentColor"/>',
        hcenter: '<path d="M10 2v16" stroke="currentColor"/><rect x="5" y="5" width="10" height="3" fill="currentColor"/><rect x="7" y="11" width="6" height="3" fill="currentColor"/>',
        right: '<path d="M17 2v16" stroke="currentColor"/><rect x="6" y="5" width="9" height="3" fill="currentColor"/><rect x="9" y="11" width="6" height="3" fill="currentColor"/>',
        top: '<path d="M2 3h16" stroke="currentColor"/><rect x="5" y="5" width="3" height="9" fill="currentColor"/><rect x="11" y="5" width="3" height="6" fill="currentColor"/>',
        vcenter: '<path d="M2 10h16" stroke="currentColor"/><rect x="5" y="5" width="3" height="10" fill="currentColor"/><rect x="11" y="7" width="3" height="6" fill="currentColor"/>',
        bottom: '<path d="M2 17h16" stroke="currentColor"/><rect x="5" y="6" width="3" height="9" fill="currentColor"/><rect x="11" y="9" width="3" height="6" fill="currentColor"/>',
      };
      return `<svg viewBox="0 0 20 20" width="16" height="16">${I[a]}</svg>`;
    }
    pfIcon(op) {
      const A = '<rect x="2" y="2" width="10" height="10"/>', B = '<rect x="8" y="8" width="10" height="10"/>';
      const I = {
        unite: '<path d="M2 2h10v6h6v10H8v-6H2z" fill="currentColor"/>',
        minus: '<path d="M2 2h10v6H8v4H2z" fill="currentColor"/><rect x="8.5" y="8.5" width="9" height="9" fill="none" stroke="currentColor" stroke-dasharray="2 1.5"/>',
        intersect: `<g fill="none" stroke="currentColor" stroke-dasharray="2 1.5">${A}${B}</g><rect x="8" y="8" width="4" height="4" fill="currentColor"/>`,
        exclude: '<path d="M2 2h10v6H8v4H2zM12 8h6v10H8v-6h4z" fill="currentColor"/>',
      };
      return `<svg viewBox="0 0 20 20" width="20" height="20">${I[op]}</svg>`;
    }

    bindInputs(root) {
      root.querySelectorAll('[data-k]').forEach((inp) => {
        const k = inp.dataset.k;
        const handler = () => {
          let v = inp.type === 'number' || inp.type === 'range' ? parseFloat(inp.value) : inp.value;
          if (inp.type === 'number' && isNaN(v)) return;
          if (k === 'op') v = clamp(v / 100, 0, 1);
          if (['x', 'y', 'w', 'h', 'rot'].includes(k)) return this.setTransform(k, v);
          if (k === 'gangle' || k === 'gs0' || k === 'gs1' || k === 'gtype') return this.setGradient(k, v);
          this.setProp(k, k === 'r' || k === 'size' || k === 'sw' || k === 'inner' ? Math.max(0, v) : v);
        };
        inp.addEventListener('change', handler);
        if (inp.type === 'range') inp.addEventListener('input', () => {
          const v = parseFloat(inp.value);
          if (k === 'gangle') this.setGradient(k, v, true);
          else if (k === 'op') this.setProp('op', v / 100, { noCommit: true });
          else this.setProp(k, v, { noCommit: true });
        });
        inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { inp.blur(); } });
      });
      root.querySelectorAll('[data-pop]').forEach((b) => b.addEventListener('click', () => this.openColorPop(b, b.dataset.pop)));
      root.querySelectorAll('[data-align]').forEach((b) => b.addEventListener('click', () => this.align(b.dataset.align)));
      root.querySelectorAll('[data-pf]').forEach((b) => b.addEventListener('click', () => this.pathfinder(b.dataset.pf)));
      root.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => {
        const c = b.dataset.cmd;
        const map = {
          group: () => this.group(), ungroup: () => this.ungroup(), front: () => this.arrange('front'), back: () => this.arrange('back'),
          forward: () => this.arrange('forward'), backward: () => this.arrange('backward'), shadow: () => this.toggleFx('shadow'), blur: () => this.toggleFx('blur'),
          flipx: () => this.reflect('x'), flipy: () => this.reflect('y'), rulers: () => this.toggleFlag('rulers'), grid: () => this.toggleFlag('grid'),
          smart: () => this.toggleFlag('smart'), snap: () => this.toggleFlag('snap'), fit: () => this.fit(true), selectall: () => this.selectAll(),
          aligntoggle: () => { this.alignTo = this.alignTo === 'artboard' ? 'auto' : 'artboard'; this.renderPanels(); },
        };
        map[c] && map[c]();
      }));
    }
    setTransform(k, v) {
      const sel = this.selObjs();
      if (!sel.length) return;
      if (k === 'rot') {
        sel.forEach((o) => { o.rot = -v; });
      } else {
        const U = sel.length === 1 && !sel[0].gid ? bbox(sel[0]) : union(sel);
        const nb = { ...U };
        if (k === 'x') nb.x = v; if (k === 'y') nb.y = v;
        if (k === 'w') { nb.w = Math.max(0.5, v); if (this.lockRatio) nb.h = U.h * (nb.w / U.w); }
        if (k === 'h') { nb.h = Math.max(0.5, v); if (this.lockRatio) nb.w = U.w * (nb.h / U.h); }
        if (sel.length === 1 && !sel[0].gid) {
          const o = sel[0];
          if (k === 'x' || k === 'y') translate(o, nb.x - U.x, nb.y - U.y);
          else { const c = center(U); setBBox(o, { x: c.x - nb.w / 2, y: c.y - nb.h / 2, w: nb.w, h: nb.h }); }
        } else {
          const sx = nb.w / (U.w || 1), sy = nb.h / (U.h || 1);
          sel.forEach((o) => {
            const b = bbox(o), c = center(b);
            const nc = { x: nb.x + (c.x - U.x) * sx, y: nb.y + (c.y - U.y) * sy };
            if (k === 'x' || k === 'y') translate(o, nc.x - c.x, nc.y - c.y);
            else setBBox(o, { x: nc.x - (b.w * sx) / 2, y: nc.y - (b.h * sy) / 2, w: b.w * sx, h: b.h * sy });
          });
        }
      }
      this.commit(); this.renderAll();
      this.act(k === 'rot' ? 'rotate' : k === 'x' || k === 'y' ? 'move' : 'scale', { via: 'panel', k, v });
    }
    setGradient(k, v, live) {
      const sel = this.selObjs();
      const apply = (o) => {
        if (!isGrad(o.fill)) return;
        if (k === 'gangle') o.fill.a = v;
        if (k === 'gs0') o.fill.s[0] = v;
        if (k === 'gs1') o.fill.s[1] = v;
        if (k === 'gtype') o.fill.g = v;
      };
      sel.forEach(apply);
      if (isGrad(this.def.fill)) apply({ fill: this.def.fill });
      this.renderObjs();
      if (!live) { this.commit(); this.renderAll(); this.act('gradient', { k, v }); }
    }

    /* --------------------------------------------------------------- panels */
    renderPanels() {
      const $ = this.$;
      $.dock.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tabA || b.dataset.tab === this.tabB));
      if (this.tabA === 'properties') this.renderProperties(); else this.renderLayers(true);
      if (this.tabB === 'swatches') this.renderSwatches(); else this.renderColorPanel();
    }
    renderProperties() {
      if (this.tabA !== 'properties') return;
      const sel = this.selObjs(), body = this.$.bodyA;
      const sec = (title, inner, hl) => `<div class="ai-psec"${hl ? ` data-hl="${hl}"` : ''}><div class="ai-psec-t">${title}</div>${inner}</div>`;
      let html = '';
      if (!sel.length) {
        html += `<div class="ai-pkind">Document</div>`;
        html += sec('Artboard', `<div class="ai-row"><label>W</label><input class="ai-in" value="${this.AB.w} px" disabled><label>H</label><input class="ai-in" value="${this.AB.h} px" disabled></div>`);
        html += sec('Rulers &amp; Grids', `<div class="ai-btnrow"><button data-cmd="rulers" class="${this.flags.rulers ? 'on' : ''}" title="Rulers">📏 Rulers</button><button data-cmd="grid" class="${this.flags.grid ? 'on' : ''}" title="Grid">▦ Grid</button></div>`);
        html += sec('Guides', `<div class="ai-btnrow"><button data-cmd="smart" class="${this.flags.smart ? 'on' : ''}">Smart Guides</button><button data-cmd="snap" class="${this.flags.snap ? 'on' : ''}">Snap to Grid</button></div>`);
        html += sec('Quick Actions', `<div class="ai-btnrow"><button data-cmd="fit">Fit Artboard</button><button data-cmd="selectall">Select All</button></div>`);
      } else {
        const one = sel.length === 1 ? sel[0] : null;
        const isGroup = sel.length > 1 && sel.every((o) => o.gid && o.gid === sel[0].gid);
        const kind = one ? (one.kind === 'text' ? 'Type' : one.kind === 'path' ? one.name : one.name) : isGroup ? 'Group' : 'Mixed Objects';
        html += `<div class="ai-pkind">${esc(kind)}</div>`;
        const U = one ? bbox(one) : union(sel);
        html += sec('Transform', `
          <div class="ai-row"><label>X:</label><input class="ai-in" type="number" step="1" data-k="x" value="${Math.round(U.x)}"><label>W:</label><input class="ai-in" type="number" step="1" data-k="w" value="${Math.round(U.w)}"></div>
          <div class="ai-row"><label>Y:</label><input class="ai-in" type="number" step="1" data-k="y" value="${Math.round(U.y)}"><label>H:</label><input class="ai-in" type="number" step="1" data-k="h" value="${Math.round(U.h)}"></div>
          <div class="ai-row"><label>↻</label><input class="ai-in" type="number" step="1" data-k="rot" value="${one ? Math.round(-(one.rot || 0)) : 0}"><span class="ai-unit">°</span>
          <button class="ai-ib" data-cmd="flipx" title="Flip Horizontal">⇋</button><button class="ai-ib" data-cmd="flipy" title="Flip Vertical">⥮</button></div>`, 'prop-transform');
        if (one && one.kind === 'rect') html += sec('Rectangle Properties', `<div class="ai-row"><label>◜ Corner:</label><input class="ai-in" type="number" min="0" step="1" data-k="r" value="${Math.round(one.r || 0)}"><input type="range" min="0" max="${Math.round(Math.min(one.w, one.h) / 2)}" value="${Math.round(one.r || 0)}" data-k="r"></div>`, 'prop-shape');
        if (one && one.kind === 'polygon') html += sec('Polygon Properties', `<div class="ai-row"><label>Sides:</label><input class="ai-in" type="number" min="3" max="20" data-k="sides" value="${one.sides}"><input type="range" min="3" max="12" value="${one.sides}" data-k="sides"></div>`, 'prop-shape');
        if (one && one.kind === 'star') html += sec('Star Properties', `<div class="ai-row"><label>Points:</label><input class="ai-in" type="number" min="3" max="20" data-k="pts" value="${one.pts}"><input type="range" min="3" max="12" value="${one.pts}" data-k="pts"></div><div class="ai-row"><label>Depth:</label><input type="range" min="0.1" max="0.95" step="0.01" value="${one.inner}" data-k="inner"></div>`, 'prop-shape');
        const t = sel.find((o) => o.kind === 'text');
        if (t) html += sec('Character', `
          <div class="ai-row"><select class="ai-sel wide" data-k="font">${Object.keys(FONTS).map((f) => `<option${f === t.font ? ' selected' : ''} style="font-family:${esc(fontStack(f))}">${f}</option>`).join('')}</select></div>
          <div class="ai-row"><select class="ai-sel" data-k="weight">${[[300, 'Light'], [400, 'Regular'], [600, 'Semibold'], [700, 'Bold'], [900, 'Black']].map(([w, n]) => `<option value="${w}"${+t.weight === w ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <label>T</label><input class="ai-in" type="number" min="1" step="1" data-k="size" value="${Math.round(t.size)}"><span class="ai-unit">pt</span></div>
          <div class="ai-btnrow">${['left', 'center', 'right'].map((a) => `<button data-align-text="${a}" class="${(t.align || 'left') === a ? 'on' : ''}">${a === 'left' ? '⫷ Left' : a === 'center' ? '≡ Center' : 'Right ⫸'}</button>`).join('')}</div>`, 'prop-character');
        const f = sel[0].fill, s = sel[0].stroke;
        html += sec('Appearance', `
          <div class="ai-row ai-apr"><button class="ai-swbtn" data-pop="fill" data-hl="prop-fill" style="background:${paintCss(f)}"${f === 'none' ? ' data-none' : ''}></button><label class="wide">Fill</label></div>
          <div class="ai-row ai-apr"><button class="ai-swbtn stroke" data-pop="stroke" data-hl="prop-stroke" style="border-color:${isGrad(s) ? s.s[0] : s === 'none' ? '#888' : s}"${s === 'none' ? ' data-none' : ''}></button><label>Stroke</label><input class="ai-in" type="number" min="0" step="0.5" data-k="sw" value="${sel[0].sw}" data-hl="prop-sw"><span class="ai-unit">pt</span></div>
          <div class="ai-row"><label>Opacity</label><input type="range" min="0" max="100" value="${Math.round(sel[0].op * 100)}" data-k="op"><span class="ai-unit">${Math.round(sel[0].op * 100)}%</span></div>
          ${isGrad(f) ? `<div class="ai-grad" data-hl="prop-gradient"><div class="ai-grad-bar" style="background:${gradCss(f)}"></div>
            <div class="ai-row"><label>Type</label><select class="ai-sel" data-k="gtype"><option value="lin"${f.g === 'lin' ? ' selected' : ''}>Linear</option><option value="rad"${f.g === 'rad' ? ' selected' : ''}>Radial</option></select></div>
            <div class="ai-row"><label>Angle</label><input type="range" min="-180" max="180" value="${f.a || 0}" data-k="gangle"><span class="ai-unit">${f.a || 0}°</span></div>
            <div class="ai-row"><label>Colors</label><input type="color" value="${f.s[0]}" data-k="gs0"><input type="color" value="${f.s[1]}" data-k="gs1"></div></div>` : ''}
          <div class="ai-btnrow"><button data-cmd="shadow" class="${sel.every((o) => o.fx && o.fx.shadow) ? 'on' : ''}" data-hl="prop-shadow">☁ Drop Shadow</button><button data-cmd="blur" class="${sel.every((o) => o.fx && o.fx.blur) ? 'on' : ''}">◌ Blur</button></div>`, 'prop-appearance');
        html += sec(`Align <span class="ai-alignto" data-cmd="aligntoggle" title="Click to switch">${this.alignTo === 'artboard' || (this.alignTo === 'auto' && (sel.length === 1 || isGroup)) ? 'to Artboard' : 'to Selection'} ▾</span>`, `<div class="ai-iconrow">${['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom'].map((a) => `<button data-align="${a}" data-hl="align-${a}" title="${{ left: 'Horizontal Align Left', hcenter: 'Horizontal Align Center', right: 'Horizontal Align Right', top: 'Vertical Align Top', vcenter: 'Vertical Align Center', bottom: 'Vertical Align Bottom' }[a]}">${this.alignIcon(a)}</button>`).join('')}</div>`, 'prop-align');
        if (sel.length > 1) html += sec('Pathfinder', `<div class="ai-iconrow pf">${[['unite', 'Unite'], ['minus', 'Minus Front'], ['intersect', 'Intersect'], ['exclude', 'Exclude']].map(([k, n]) => `<button data-pf="${k}" data-hl="pf-${k}" title="${n}">${this.pfIcon(k)}<small>${n}</small></button>`).join('')}</div>`, 'prop-pathfinder');
        html += sec('Quick Actions', `<div class="ai-btnrow">
          ${sel.length > 1 && !isGroup ? '<button data-cmd="group" data-hl="qa-group">Group</button>' : ''}${sel.some((o) => o.gid) ? '<button data-cmd="ungroup" data-hl="qa-ungroup">Ungroup</button>' : ''}
          <button data-cmd="front" data-hl="qa-front" title="Bring to Front">⬆ Front</button><button data-cmd="back" data-hl="qa-back" title="Send to Back">⬇ Back</button></div>`, 'prop-quick');
      }
      body.innerHTML = html;
      this.bindInputs(body);
      body.querySelectorAll('[data-align-text]').forEach((b) => b.addEventListener('click', () => this.setProp('align', b.dataset.alignText)));
    }

    renderLayers(force) {
      if (this.tabA !== 'layers' && !force) return;
      if (this.tabA !== 'layers') return;
      const body = this.$.bodyA;
      const rows = [];
      const seen = new Set();
      const thumb = (list) => {
        const U = union(list) || { x: 0, y: 0, w: 1, h: 1 };
        const pad = Math.max(U.w, U.h) * 0.08 + 1;
        const defs = [];
        const inner = list.map((o) => this.objMarkup(o, 'th' + Math.random().toString(36).slice(2, 6), defs)).join('');
        return `<svg viewBox="${U.x - pad} ${U.y - pad} ${U.w + pad * 2} ${U.h + pad * 2}" preserveAspectRatio="xMidYMid meet"><defs>${defs.join('')}</defs>${inner}</svg>`;
      };
      const row = (o, indent) => `<div class="ai-lrow${this.sel.has(o.id) ? ' sel' : ''}${indent ? ' ind' : ''}" data-lid="${o.id}">
          <button class="ai-eye${o.hidden ? ' off' : ''}" data-eye="${o.id}" title="Toggle visibility">${o.hidden ? '' : '👁'}</button>
          <button class="ai-lock${o.locked ? ' on' : ''}" data-lock="${o.id}" title="Toggle lock">${o.locked ? '🔒' : ''}</button>
          <span class="ai-lthumb">${thumb([o])}</span><span class="ai-lname">&lt;${esc(o.kind === 'text' ? (o.text.slice(0, 18) || 'Text') : o.name)}&gt;</span>
          <span class="ai-lsel${this.sel.has(o.id) ? ' on' : ''}"></span></div>`;
      for (let i = this.objs.length - 1; i >= 0; i--) {
        const o = this.objs[i];
        if (seen.has(o.id)) continue;
        if (o.gid) {
          const mem = this.objs.filter((x) => x.gid === o.gid).reverse();
          mem.forEach((m) => seen.add(m.id));
          const allSel = mem.every((m) => this.sel.has(m.id));
          rows.push(`<div class="ai-lrow grp${allSel ? ' sel' : ''}" data-gsel="${o.gid}"><button class="ai-eye" data-geye="${o.gid}">👁</button><button class="ai-lock"></button><span class="ai-lthumb">${thumb(mem)}</span><span class="ai-lname">▾ &lt;Group&gt;</span><span class="ai-lsel${allSel ? ' on' : ''}"></span></div>`);
          mem.forEach((m) => rows.push(row(m, true)));
        } else { seen.add(o.id); rows.push(row(o)); }
      }
      body.innerHTML = `<div class="ai-layers" data-hl="layers-list">
        <div class="ai-lrow layer"><button class="ai-eye">👁</button><button class="ai-lock"></button><span class="ai-lcolor"></span><span class="ai-lname"><b>▾ Layer 1</b></span><span class="ai-lsel${this.sel.size ? ' on' : ''}"></span></div>
        ${rows.join('') || '<div class="ai-lempty">Your artboard is empty.<br>Draw something and it appears here!</div>'}
        </div><div class="ai-lfoot">1 Layer · ${this.objs.length} object${this.objs.length === 1 ? '' : 's'}</div>`;
      body.querySelectorAll('[data-lid]').forEach((r) => r.addEventListener('click', (e) => {
        if (e.target.closest('[data-eye]') || e.target.closest('[data-lock]')) return;
        const id = r.dataset.lid, o = this.get(id);
        if (o.locked || o.hidden) return;
        if (e.shiftKey) { this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id); this.select([...this.sel]); }
        else this.select([id]);
        this.act('layerSelect', { id });
      }));
      body.querySelectorAll('[data-gsel]').forEach((r) => r.addEventListener('click', (e) => {
        if (e.target.closest('[data-geye]')) return;
        this.select(this.objs.filter((o) => o.gid === r.dataset.gsel && !o.locked).map((o) => o.id));
        this.act('layerSelect', { group: true });
      }));
      body.querySelectorAll('[data-eye]').forEach((b) => b.addEventListener('click', () => {
        const o = this.get(b.dataset.eye); o.hidden = !o.hidden; if (o.hidden) this.sel.delete(o.id);
        this.commit(); this.renderAll(); this.act(o.hidden ? 'hide' : 'show', { via: 'layers' });
      }));
      body.querySelectorAll('[data-geye]').forEach((b) => b.addEventListener('click', () => {
        const mem = this.objs.filter((o) => o.gid === b.dataset.geye), h = !mem[0].hidden;
        mem.forEach((o) => { o.hidden = h; if (h) this.sel.delete(o.id); });
        this.commit(); this.renderAll(); this.act(h ? 'hide' : 'show', { via: 'layers' });
      }));
      body.querySelectorAll('[data-lock]').forEach((b) => b.addEventListener('click', () => {
        const o = this.get(b.dataset.lock); o.locked = !o.locked; if (o.locked) this.sel.delete(o.id);
        this.commit(); this.renderAll(); this.act(o.locked ? 'lock' : 'unlock', { via: 'layers' });
      }));
    }

    swatchGrid(onPick, cur) {
      return `<div class="ai-swgrid">${SWATCHES.map((c) => `<button class="ai-sw${c === 'none' ? ' none' : ''}${samePaint(c, cur) ? ' on' : ''}" data-sw='${JSON.stringify(c)}' title="${c === 'none' ? '[None]' : c}" style="background:${paintCss(c)}"></button>`).join('')}</div>
        <div class="ai-swlabel">Gradients</div>
        <div class="ai-swgrid">${GRADIENTS.map((g) => `<button class="ai-sw${samePaint(g, cur) ? ' on' : ''}" data-sw='${JSON.stringify(g)}' title="Gradient" style="background:${gradCss(g)}"></button>`).join('')}</div>`;
    }
    renderSwatches() {
      if (this.tabB !== 'swatches') return;
      const body = this.$.bodyB;
      body.innerHTML = `<div class="ai-swhead"><span>Applies to:</span><button data-slotpick="fill" class="${this.slot === 'fill' ? 'on' : ''}">Fill</button><button data-slotpick="stroke" class="${this.slot === 'stroke' ? 'on' : ''}">Stroke</button></div>${this.swatchGrid(null, this.currentPaint(this.slot))}`;
      body.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => this.applyPaint(this.slot, JSON.parse(b.dataset.sw))));
      body.querySelectorAll('[data-slotpick]').forEach((b) => b.addEventListener('click', () => { this.slot = b.dataset.slotpick; this.renderToolbarState(); this.renderSwatches(); this.act('slot', { slot: this.slot }); }));
    }
    renderColorPanel() {
      if (this.tabB !== 'color') return;
      const body = this.$.bodyB;
      const p = this.currentPaint(this.slot);
      const hex = isGrad(p) ? p.s[0] : p === 'none' ? '#FFFFFF' : p;
      const n = parseInt(hex.slice(1), 16), rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      body.innerHTML = `<div class="ai-swhead"><span>Editing:</span><button data-slotpick="fill" class="${this.slot === 'fill' ? 'on' : ''}">Fill</button><button data-slotpick="stroke" class="${this.slot === 'stroke' ? 'on' : ''}">Stroke</button></div>
        <div class="ai-color">${['R', 'G', 'B'].map((c, i) => `<div class="ai-row"><label>${c}</label><input type="range" min="0" max="255" value="${rgb[i]}" data-rgb="${i}" class="ch-${c}"><input class="ai-in" type="number" min="0" max="255" value="${rgb[i]}" data-rgbn="${i}"></div>`).join('')}
        <div class="ai-row"><label>#</label><input class="ai-in wide" value="${hex.slice(1).toUpperCase()}" data-hex maxlength="6"><input type="color" value="${hex}" data-native></div>
        <div class="ai-spectrum" title="Click to pick a color"></div></div>`;
      const apply = (h) => this.applyPaint(this.slot, h.toUpperCase());
      const fromRGB = () => '#' + [0, 1, 2].map((i) => (+body.querySelector(`[data-rgb="${i}"]`).value).toString(16).padStart(2, '0')).join('');
      body.querySelectorAll('[data-rgb]').forEach((r) => {
        r.addEventListener('input', () => { body.querySelector(`[data-rgbn="${r.dataset.rgb}"]`).value = r.value; const h = fromRGB(); this.selObjs().forEach((o) => { o[this.slot] = h; }); this.def[this.slot] = h; this.renderObjs(); this.renderToolbarState(); });
        r.addEventListener('change', () => apply(fromRGB()));
      });
      body.querySelectorAll('[data-rgbn]').forEach((r) => r.addEventListener('change', () => { body.querySelector(`[data-rgb="${r.dataset.rgbn}"]`).value = clamp(+r.value, 0, 255); apply(fromRGB()); }));
      const hx = body.querySelector('[data-hex]');
      hx.addEventListener('keydown', (e) => e.stopPropagation());
      hx.addEventListener('change', () => { if (/^[0-9a-f]{6}$/i.test(hx.value)) apply('#' + hx.value); });
      body.querySelector('[data-native]').addEventListener('change', (e) => apply(e.target.value));
      body.querySelector('.ai-spectrum').addEventListener('click', (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const hue = ((e.clientX - r.left) / r.width) * 360, l = 1 - (e.clientY - r.top) / r.height;
        apply(hslHex(hue, 0.9, clamp(l, 0.05, 0.95)));
      });
      body.querySelectorAll('[data-slotpick]').forEach((b) => b.addEventListener('click', () => { this.slot = b.dataset.slotpick; this.renderToolbarState(); this.renderColorPanel(); }));
    }

    openColorPop(anchor, slot) {
      const pop = this.$.pop;
      if (!pop.hidden && pop.dataset.slot === slot) return this.closePop();
      const cur = this.currentPaint(slot);
      pop.hidden = false;
      pop.dataset.slot = slot;
      pop.innerHTML = `<div class="ai-pop-t">${slot === 'fill' ? 'Fill' : 'Stroke'} color</div>${this.swatchGrid(null, cur)}
        <div class="ai-row ai-pop-custom"><label>Custom</label><input type="color" value="${isGrad(cur) ? cur.s[0] : cur === 'none' ? '#ffffff' : cur}"></div>`;
      const r = anchor.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      let left = r.left - rr.left, top = r.bottom - rr.top + 4;
      const pw = 236;
      if (left + pw > rr.width) left = rr.width - pw - 6;
      if (top + 280 > rr.height) top = Math.max(4, r.top - rr.top - 284);
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
      pop.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => { this.slot = slot; this.applyPaint(slot, JSON.parse(b.dataset.sw)); this.closePop(); }));
      pop.querySelector('input[type=color]').addEventListener('change', (e) => { this.applyPaint(slot, e.target.value.toUpperCase()); });
      this.act('colorPop', { slot });
    }
    closePop() { if (this.$.pop) this.$.pop.hidden = true; }

    showTip(el, html) {
      clearTimeout(this._tipT);
      this._tipT = setTimeout(() => {
        const t = this.$.tooltip, r = el.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
        t.innerHTML = html; t.hidden = false;
        t.style.left = (r.right - rr.left + 8) + 'px';
        t.style.top = (r.top - rr.top) + 'px';
      }, 450);
    }
    hideTip() { clearTimeout(this._tipT); if (this.$.tooltip) this.$.tooltip.hidden = true; }

    /* ---------------------------------------------------------------- menus */
    openMenu(m) {
      const defs = this.menuDef()[m.dataset.m];
      this._openMenu = m.dataset.m;
      this._menuFns = [];
      this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.toggle('open', x === m));
      const build = (items) => items.map((it) => {
        if (it === '-') return '<div class="ai-msep"></div>';
        const i = this._menuFns.push(it.f) - 1;
        if (it.sub) return `<div class="ai-mi has-sub${it.d ? ' disabled' : ''}" data-l="${esc(it.l)}"><span class="ck"></span><span class="l">${it.l}</span><span class="k">▸</span><div class="ai-sub">${build(it.sub)}</div></div>`;
        return `<div class="ai-mi${it.d ? ' disabled' : ''}" data-i="${i}" data-l="${esc(it.l)}"><span class="ck">${it.c ? '✓' : ''}</span><span class="l"${it.font ? ` style="font-family:${esc(fontStack(it.font))}"` : ''}>${it.l}</span><span class="k">${it.k || ''}</span></div>`;
      }).join('');
      const dd = this.$.dropdown;
      dd.innerHTML = build(defs);
      dd.hidden = false;
      const r = m.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      dd.style.left = (r.left - rr.left) + 'px';
      dd.style.top = (r.bottom - rr.top) + 'px';
      dd.dataset.hl = 'dropdown-' + m.dataset.m.toLowerCase();
      this.act('menuOpen', { menu: m.dataset.m });
    }
    closeMenu() {
      if (!this._openMenu) return;
      this._openMenu = null;
      this.$.dropdown.hidden = true;
      this.$.menus.querySelectorAll('.ai-menu').forEach((x) => x.classList.remove('open'));
    }

    /* --------------------------------------------------------------- export */
    exportSVGString(bg) {
      const defs = [];
      const body = this.objs.filter((o) => !o.hidden).map((o) => this.objMarkup(o, 'x', defs)).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.AB.w}" height="${this.AB.h}" viewBox="0 0 ${this.AB.w} ${this.AB.h}"><defs>${defs.join('')}</defs>${bg ? `<rect width="${this.AB.w}" height="${this.AB.h}" fill="#fff"/>` : ''}${body}</svg>`;
    }
    download(blob, name) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      if (this.opts.onDownload) this.opts.onDownload(blob, name);
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    exportSVG() {
      this.download(new Blob([this.exportSVGString(false)], { type: 'image/svg+xml' }), 'my-artwork.svg');
      this.act('export', { format: 'svg' });
    }
    exportPNG(scale = 2) {
      const svg = this.exportSVGString(true);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = this.AB.w * scale; c.height = this.AB.h * scale;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => b && this.download(b, 'my-artwork.png'), 'image/png');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      this.act('export', { format: 'png' });
    }
    /** quick PNG data URL of the artboard for certificates / galleries */
    snapshotDataURL(cb, w = 400) {
      const svg = this.exportSVGString(true);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = w; c.height = (w * this.AB.h) / this.AB.w;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/png'));
      };
      img.onerror = () => cb(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /* ------------------------------------------------------ lesson helpers */
    /** screen rect (client coords) of a document-space point, for the coach */
    docToClient(p) {
      const r = this.$.svg.getBoundingClientRect(), s = this.toScr(p);
      return { x: r.left + s.x, y: r.top + s.y };
    }
    hl(name) { return this.root.querySelector(`[data-hl="${name}"]`); }
    objsOf(kind) { return this.objs.filter((o) => o.kind === kind && !o.hidden); }
    bbox(o) { return bbox(o); }
    aabb(o) { return aabb(o); }
    union(l) { return union(l); }
  }

  function hslHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, '0'); };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  window.AIEditor = AIEditor;
  window.AIEditor.TOOLS = TOOLS;
  window.AIEditor.svgIcon = svgIcon;
  window.AIEditor.FONTS = FONTS;
  window.AIEditor.CMD = CMD;
  window.AIEditor.SHIFT = SHIFT;
  window.AIEditor.ALT = ALT;
})();
