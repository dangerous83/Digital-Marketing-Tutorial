/* =========================================================================
   DesignQuest — animated explainer clips (pure SVG + SMIL, no video files)
   Each demo is a tiny looping animation that shows the idea of a step.
   ========================================================================= */
(function () {
  'use strict';
  const C = { o: '#FF7A59', p: '#7C5CFF', t: '#19C3B1', y: '#FFC93C', k: '#FF5FA2', b: '#3B82F6', ink: '#1d1b2e', sel: '#4F80FF' };
  const D = 5; // default loop seconds

  const ARROW = '<path d="M0 0v17l4.4-4.2 3 6.8 2.6-1.1-3-6.7 6.1-.1z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>';
  const WARROW = '<path d="M0 0v17l4.4-4.2 3 6.8 2.6-1.1-3-6.7 6.1-.1z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/>';
  const CROSS = '<g stroke="#111" stroke-width="1.6"><path d="M-8 0H8M0-8V8"/></g><g stroke="#fff" stroke-width=".6"><path d="M-8 0H8M0-8V8"/></g>';
  const PEN = '<g transform="rotate(-38)"><path d="M0 0L5.5 9.5 3.4 16H-3.4l-2.1-6.5z" fill="#fff" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/><path d="M0 0v7.5" stroke="#111"/><circle cy="8.5" r="1.4" fill="#111"/></g>';
  const IBEAM = '<path d="M-4-10h8M-4 10h8M0-10v20" stroke="#111" stroke-width="1.6" fill="none"/>';
  const DROP = '<path d="M14-14a3 3 0 0 0-4 0l-3 3-1.3-1.3-2 2 1.3 1.3-8.6 8.6-1.2 5.8 5.8-1.2 8.6-8.6 1.3 1.3 2-2-1.3-1.3 3-3a3 3 0 0 0 0-4z" fill="#fff" stroke="#111" stroke-width="1.4"/>';
  const HAND = '<path d="M-4 4V-6a2 2 0 0 1 4 0v8m0-1V-9a2 2 0 0 1 4 0v9m0-1v-6a2 2 0 0 1 4 0V8c0 6-3.5 10-8.5 10-3.4 0-5.6-1.7-7.6-4.8L-12 7.5a1.9 1.9 0 0 1 3-2.2L-6.5 8" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';

  const at = (v, k, dur = D, attr = 'transform', type = 'translate', extra = '') =>
    attr === 'transform'
      ? `<animateTransform attributeName="transform" type="${type}" values="${v}" keyTimes="${k}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`
      : `<animate attributeName="${attr}" values="${v}" keyTimes="${k}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
  const op = (v, k, dur = D) => at(v, k, dur, 'opacity');
  const ripple = (x, y, k, dur = D) => `<circle cx="${x}" cy="${y}" r="0" fill="none" stroke="${C.o}" stroke-width="2.5">${at('0;0;14;14', k, dur, 'r')}${op('0;1;0;0', k, dur)}</circle>`;
  const frame = (inner, opts = {}) => `<svg class="demo-svg" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || 'Animated explanation'}">
    <defs><filter id="dsh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity=".25"/></filter></defs>
    <rect width="320" height="180" rx="14" fill="${opts.bg || '#262636'}"/>
    ${opts.noBoard ? '' : `<rect x="${opts.bx || 40}" y="${opts.by || 18}" width="${opts.bw || 240}" height="${opts.bh || 144}" rx="3" fill="#fff" filter="url(#dsh)"/>`}
    ${inner}</svg>`;
  const label = (x, y, t, c = '#fff', s = 12, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" fill="${c}" font-family="Poppins,sans-serif" font-weight="700" font-size="${s}" text-anchor="${anchor}" ${extra}>${t}</text>`;
  const bbox = (x, y, w, h) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.sel}" stroke-width="1"/>${[[x, y], [x + w / 2, y], [x + w, y], [x + w, y + h / 2], [x + w, y + h], [x + w / 2, y + h], [x, y + h], [x, y + h / 2]].map(([a, b]) => `<rect x="${a - 3}" y="${b - 3}" width="6" height="6" fill="#fff" stroke="${C.sel}"/>`).join('')}</g>`;
  const key = (x, y, t, k, dur = D) => `<g transform="translate(${x} ${y})"><rect x="-22" y="-12" width="44" height="24" rx="5" fill="#3a3a52" stroke="#55557a">${at('#3a3a52;#3a3a52;' + C.o + ';' + C.o + ';#3a3a52', k, dur, 'fill')}</rect>${label(0, 4, t, '#fff', 10)}</g>`;

  const DEMOS = {
    /* ---- 1. vector vs raster */
    'vector-raster': () => {
      let px = '';
      const N = 12, r = 5.2;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const cx = i - N / 2 + 0.5, cy = j - N / 2 + 0.5;
        if (cx * cx + cy * cy <= r * r) px += `<rect x="${i * 4 - 24}" y="${j * 4 - 24}" width="4" height="4" fill="${C.o}"/>`;
      }
      return frame(`
        <rect x="14" y="14" width="140" height="152" rx="10" fill="#fff"/><rect x="166" y="14" width="140" height="152" rx="10" fill="#fff"/>
        <g transform="translate(84 82)"><g>${at('1;1;3.2;3.2;1', '0;.2;.5;.8;1', D, 'transform', 'scale')}${px}</g></g>
        <g transform="translate(236 82)"><circle r="21" fill="${C.p}">${at('21;21;67;67;21', '0;.2;.5;.8;1', D, 'r')}</circle></g>
        <rect x="14" y="140" width="140" height="26" rx="0" fill="#fff"/><rect x="166" y="140" width="140" height="26" fill="#fff"/>
        ${label(84, 158, 'PIXELS (blurry)', C.ink, 11)}${label(236, 158, 'VECTOR (sharp!)', C.ink, 11)}
        <g transform="translate(84 82)"><circle r="12" fill="none" stroke="#111" stroke-width="3"/><path d="M8 8l12 12" stroke="#111" stroke-width="4" stroke-linecap="round"/>${op('0;1;1;0;0', '0;.15;.5;.6;1')}</g>
        <g transform="translate(236 82)"><circle r="12" fill="none" stroke="#111" stroke-width="3"/><path d="M8 8l12 12" stroke="#111" stroke-width="4" stroke-linecap="round"/>${op('0;1;1;0;0', '0;.15;.5;.6;1')}</g>`, { noBoard: true, label: 'Raster images get blocky when zoomed; vector stays sharp' });
    },

    /* ---- 2. workspace map */
    workspace: () => {
      const T = 8;
      const area = (x, y, w, h, t, i, lx, ly) => {
        const s = i / 5, e = (i + 1) / 5;
        const k = `0;${Math.max(s - 0.001, 0).toFixed(3)};${s.toFixed(3)};${(e - 0.02).toFixed(3)};${e.toFixed(3)};1`;
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.o}" fill-opacity=".0" stroke="${C.o}" stroke-width="2.5" stroke-opacity="0">${at('0;0;1;1;0;0', k, T, 'stroke-opacity')}${at('0;0;.25;.25;0;0', k, T, 'fill-opacity')}</rect>
          <g opacity="0">${at('0;0;1;1;0;0', k, T, 'opacity')}<rect x="${lx - 50}" y="${ly - 13}" width="100" height="20" rx="10" fill="${C.o}"/>${label(lx, ly + 1, t, '#fff', 10.5)}</g>`;
      };
      return frame(`
        <rect x="16" y="14" width="288" height="152" rx="6" fill="#2c2c2c"/>
        <rect x="16" y="14" width="288" height="12" rx="3" fill="#1f1f1f"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${30 + i * 22}" y="18" width="16" height="4" rx="2" fill="#777"/>`).join('')}
        <rect x="16" y="26" width="288" height="12" fill="#383838"/>
        <rect x="16" y="38" width="22" height="128" fill="#383838"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="21" y="${44 + i * 13}" width="12" height="9" rx="2" fill="#666"/>`).join('')}
        <rect x="236" y="38" width="68" height="128" fill="#383838"/>
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="242" y="${46 + i * 16}" width="${40 + (i % 2) * 14}" height="7" rx="3" fill="#5c5c5c"/>`).join('')}
        <rect x="38" y="38" width="198" height="128" fill="#1d1d1d"/>
        <rect x="70" y="54" width="134" height="96" fill="#fff"/>
        ${area(16, 14, 288, 12, '1 · Menu Bar', 0, 160, 46)}
        ${area(16, 26, 288, 12, '2 · Control Bar', 1, 160, 58)}
        ${area(16, 38, 22, 128, '3 · Toolbar', 2, 92, 100)}
        ${area(70, 54, 134, 96, '4 · Artboard', 3, 137, 104)}
        ${area(236, 38, 68, 128, '5 · Panels', 4, 186, 100)}`, { noBoard: true, label: 'The five main areas of the Illustrator workspace' });
    },

    /* ---- 3. draw rectangle by dragging */
    'draw-rect': () => {
      const k = '0;.15;.55;.8;1';
      return frame(`
        <rect x="90" y="45" width="0" height="0" fill="${C.o}" stroke="#111" stroke-width="1.5">${at('0;0;140;140;0', k, D, 'width')}${at('0;0;90;90;0', k, D, 'height')}</rect>
        <g>${at('70,30;90,45;230,135;230,135;70,30', k)}${CROSS}</g>
        <g opacity="0">${op('0;0;1;1;0', '0;.18;.25;.8;1')}<rect x="236" y="138" width="60" height="30" rx="3" fill="#555"/>${label(266, 151, 'W: 140 px', '#fff', 8.5)}${label(266, 162, 'H: 90 px', '#fff', 8.5)}</g>
        ${label(160, 34, 'Press & drag ↘', C.ink, 11)}`, { label: 'Drag diagonally to draw a rectangle' });
    },

    /* ---- 4. shift = perfect square/circle */
    'shift-square': () => {
      const k = '0;.2;.45;.55;.85;1';
      return frame(`
        <rect x="100" y="40" width="80" height="50" fill="${C.t}" stroke="#111" stroke-width="1.5">${at('80;140;140;100;100;80', k, D, 'width')}${at('50;70;70;100;100;50', k, D, 'height')}</rect>
        <g>${at('180,90;240,110;240,110;200,140;200,140;180,90', k)}${CROSS}</g>
        ${key(160, 160, 'SHIFT', '0;.45;.5;.85;1')}
        <g opacity="0">${op('0;0;1;1;0', '0;.5;.55;.85;1')}${label(150, 30, 'Perfect square! ✨', C.ink, 12)}</g>`, { label: 'Hold Shift while dragging for a perfect square' });
    },

    /* ---- 5. hidden tools flyout */
    flyout: () => {
      const k = '0;.15;.35;.55;.85;1';
      return frame(`
        <rect x="20" y="16" width="36" height="148" rx="4" fill="#323232"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="27" y="${24 + i * 20}" width="22" height="16" rx="3" fill="${i === 4 ? '#1c1c1c' : '#4a4a4a'}"/>`).join('')}
        <rect x="31" y="107" width="14" height="10" fill="none" stroke="#ddd" stroke-width="1.4"/><path d="M47 118l-3 0 3-3z" fill="#ddd"/>
        <g opacity="0">${op('0;0;1;1;0;0', k)}
          <rect x="62" y="96" width="140" height="78" rx="4" fill="#3c3c3c" filter="url(#dsh)"/>
          ${['▭  Rectangle Tool', '◯  Ellipse Tool', '⬡  Polygon Tool', '☆  Star Tool'].map((t, i) => `<rect x="66" y="${100 + i * 18}" width="132" height="16" rx="2" fill="${i === 3 ? C.b : 'transparent'}">${i === 3 ? at('0;0;0;1;1;0', k, D, 'fill-opacity') : ''}</rect>${label(74, 112 + i * 18, t, '#eee', 9.5, 'start')}`).join('')}
        </g>
        <g>${at('120,60;38,112;38,112;150,163;150,163;120,60', k)}${ARROW}</g>
        <circle cx="38" cy="112" r="0" fill="none" stroke="${C.o}" stroke-width="3">${at('0;0;12;12;12;0', '0;.15;.3;.32;.9;1', D, 'r')}${op('0;1;1;0;0;0', '0;.15;.3;.32;.9;1')}</circle>
        ${label(230, 50, 'Press & HOLD', '#fff', 13)}${label(230, 68, 'to see hidden tools', '#bbb', 10)}`, { noBoard: true, label: 'Hold the mouse on a tool to see hidden tools' });
    },

    /* ---- 6. select and move */
    'select-move': () => {
      const k = '0;.2;.3;.7;.85;1';
      return frame(`
        <g>${at('0,0;0,0;0,0;90,10;90,10;0,0', k)}
          <circle cx="110" cy="90" r="34" fill="${C.p}"/>
          <g opacity="0">${op('0;0;1;1;0;0', k)}${bbox(76, 56, 68, 68)}</g>
        </g>
        <g>${at('170,140;112,92;112,92;202,102;202,102;170,140', k)}${ARROW}</g>
        ${ripple(112, 92, '0;.2;.28;1')}
        ${label(160, 172, '1. Click   2. Drag', C.ink, 11)}`, { label: 'Click a shape to select it, then drag to move it' });
    },

    /* ---- 7. resize with handles */
    scale: () => {
      const k = '0;.2;.6;.85;1';
      return frame(`
        <rect x="90" y="50" width="70" height="50" rx="6" fill="${C.y}">${at('70;70;130;130;70', k, D, 'width')}${at('50;50;90;90;50', k, D, 'height')}</rect>
        <rect x="90" y="50" width="70" height="50" fill="none" stroke="${C.sel}">${at('70;70;130;130;70', k, D, 'width')}${at('50;50;90;90;50', k, D, 'height')}</rect>
        <rect x="87" y="47" width="6" height="6" fill="#fff" stroke="${C.sel}"/>
        <rect x="157" y="97" width="6" height="6" fill="#fff" stroke="${C.sel}">${at('157,97;157,97;217,137;217,137;157,97', k, D, 'transform', 'translate', 'additive="replace"')}</rect>
        <g>${at('170,108;160,100;220,140;220,140;170,108', k)}<path d="M-8-8L8 8M-8-8v6M-8-8h6M8 8v-6M8 8h-6" stroke="#111" stroke-width="2" fill="none"/></g>
        ${label(160, 34, 'Drag a corner handle', C.ink, 11)}`, { label: 'Drag a corner handle to resize' });
    },

    /* ---- 8. rotate */
    rotate: () => {
      const k = '0;.2;.6;.85;1';
      return frame(`
        <g transform="translate(160 92)"><g>${at('0;0;35;35;0', k, D, 'transform', 'rotate')}
          <rect x="-40" y="-28" width="80" height="56" rx="6" fill="${C.k}"/>${bbox(-40, -28, 80, 56)}
        </g></g>
        <g transform="translate(160 92)"><g>${at('0;0;35;35;0', k, D, 'transform', 'rotate')}<g transform="translate(52 -40)">
          <path d="M-6 6a10 10 0 0 1 12-12" fill="none" stroke="#111" stroke-width="2"/><path d="M-9 3l3 5 3-5zM3-9l5 3-5 3z" fill="#111"/></g></g></g>
        ${label(160, 172, 'Move just outside a corner, then drag', C.ink, 10.5)}`, { label: 'Rotate by dragging just outside a corner' });
    },

    /* ---- 9. fill & stroke */
    'fill-stroke': () => {
      const k = '0;.1;.35;.5;.75;.9;1';
      return frame(`
        <path d="M160 34l17 35 38 5-28 26 7 38-34-18-34 18 7-38-28-26 38-5z" fill="#fff" stroke="${C.p}" stroke-width="1" stroke-linejoin="round">
          ${at(`#ffffff;#ffffff;${C.y};${C.y};${C.y};${C.y};#ffffff`, k, D, 'fill')}${at('1;1;1;1;9;9;1', k, D, 'stroke-width')}</path>
        <g opacity="0">${op('0;0;1;1;0;0;0', k)}<rect x="232" y="68" width="78" height="34" rx="8" fill="${C.y}"/>${label(271, 83, 'FILL', C.ink, 12)}${label(271, 96, '= inside color', C.ink, 8.5)}</g>
        <g opacity="0">${op('0;0;0;0;1;1;0', k)}<rect x="232" y="68" width="78" height="34" rx="8" fill="${C.p}"/>${label(271, 83, 'STROKE', '#fff', 12)}${label(271, 96, '= outline', '#fff', 8.5)}</g>
        <g transform="translate(14 64)"><rect width="22" height="22" fill="#fff" stroke="#111">${at(`#ffffff;#ffffff;${C.y};${C.y};${C.y};${C.y};#ffffff`, k, D, 'fill')}</rect><rect x="12" y="12" width="22" height="22" fill="none" stroke="${C.p}" stroke-width="6"/></g>`, { bx: 50, bw: 220, label: 'Fill is the inside color, stroke is the outline' });
    },

    /* ---- 10. gradient */
    gradient: () => frame(`
      <defs><linearGradient id="dg1"><stop offset="0" stop-color="${C.o}">${at(`${C.o};${C.k};${C.p};${C.o}`, '0;.33;.66;1', 6, 'stop-color')}</stop><stop offset="1" stop-color="${C.y}">${at(`${C.y};${C.t};${C.b};${C.y}`, '0;.33;.66;1', 6, 'stop-color')}</stop>
        <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;90 .5 .5;180 .5 .5;360 .5 .5" keyTimes="0;.33;.66;1" dur="6s" repeatCount="indefinite"/></linearGradient></defs>
      <rect x="80" y="36" width="160" height="96" rx="16" fill="url(#dg1)"/>
      ${label(160, 152, 'A gradient blends two colors smoothly', C.ink, 10.5)}`, { label: 'Gradients blend colors' }),

    /* ---- 11. eyedropper */
    eyedropper: () => {
      const k = '0;.2;.35;.55;.7;.9;1';
      return frame(`
        <path d="M100 52l11 22 24 3-18 17 4 24-21-11-21 11 4-24-18-17 24-3z" fill="${C.t}" stroke="#111" stroke-width="1.5"/>
        <circle cx="215" cy="90" r="34" fill="#ddd" stroke="#111" stroke-width="1.5">${at(`#dddddd;#dddddd;#dddddd;#dddddd;${C.t};${C.t};#dddddd`, k, D, 'fill')}</circle>
        <g opacity="0">${op('0;0;0;0;1;1;0', k)}${bbox(181, 56, 68, 68)}</g>
        <g>${at('260,40;215,90;215,90;102,88;102,88;150,150;260,40', k)}${DROP}</g>
        ${ripple(102, 88, '0;.55;.62;1')}
        ${label(160, 170, 'Select a shape → click a color to copy it', C.ink, 10)}`, { label: 'The Eyedropper copies colors from one shape to another' });
    },

    /* ---- 12. pen straight lines */
    'pen-straight': () => {
      const T = 6, pts = [[90, 120], [160, 40], [230, 120]];
      const k = (i) => { const s = 0.12 + i * 0.18; return `0;${s.toFixed(2)};${(s + 0.02).toFixed(2)};.92;1`; };
      return frame(`
        <path d="M90 120L160 40L230 120Z" fill="${C.o}" fill-opacity="0" stroke="none">${at('0;0;.85;.85;0', '0;.7;.74;.92;1', T, 'fill-opacity')}</path>
        <path d="M90 120L160 40" stroke="${C.ink}" stroke-width="2" opacity="0">${op('0;0;1;1;0', k(1), T)}</path>
        <path d="M160 40L230 120" stroke="${C.ink}" stroke-width="2" opacity="0">${op('0;0;1;1;0', k(2), T)}</path>
        <path d="M230 120L90 120" stroke="${C.ink}" stroke-width="2" opacity="0">${op('0;0;1;1;0', '0;.66;.68;.92;1', T)}</path>
        ${pts.map((p, i) => `<rect x="${p[0] - 4}" y="${p[1] - 4}" width="8" height="8" fill="${C.sel}" stroke="#fff" opacity="0">${op('0;0;1;1;0', k(i), T)}</rect>${label(p[0] + (i === 1 ? 0 : i ? 14 : -14), p[1] + (i === 1 ? -10 : 18), String(i + 1), C.sel, 12)}`).join('')}
        <circle cx="90" cy="120" r="9" fill="none" stroke="${C.o}" stroke-width="2" opacity="0">${op('0;0;1;0;0', '0;.56;.6;.7;1', T)}</circle>
        <g>${at('60,150;90,120;90,120;160,40;160,40;230,120;230,120;90,120;90,120;60,150', '0;.1;.14;.28;.32;.46;.5;.64;.92;1', T)}${PEN}</g>
        ${label(160, 160, 'Click · Click · Click — then click the first point to close', C.ink, 9.5)}`, { label: 'Pen tool: click to make straight lines, click the first point to close' });
    },

    /* ---- 13. pen curves */
    'pen-curve': () => {
      const T = 6, k = '0;.2;.6;.9;1';
      return frame(`
        <path fill="none" stroke="${C.ink}" stroke-width="2.5">${at('M80 110C80 110 240 110 240 110;M80 110C80 110 240 110 240 110;M80 110C80 110 180 30 240 110;M80 110C80 110 180 30 240 110;M80 110C80 110 240 110 240 110', k, T, 'd')}</path>
        <rect x="76" y="106" width="8" height="8" fill="${C.sel}"/>
        <rect x="236" y="106" width="8" height="8" fill="${C.sel}"/>
        <line x1="240" y1="110" x2="240" y2="110" stroke="${C.sel}" stroke-width="1.5">${at('240;240;300;300;240', k, T, 'x2')}${at('110;110;190;190;110', k, T, 'y2')}</line>
        <line x1="240" y1="110" x2="240" y2="110" stroke="${C.sel}" stroke-width="1.5">${at('240;240;180;180;240', k, T, 'x2')}${at('110;110;30;30;110', k, T, 'y2')}</line>
        <circle r="4" fill="${C.sel}" cx="240" cy="110">${at('240;240;300;300;240', k, T, 'cx')}${at('110;110;190;190;110', k, T, 'cy')}</circle>
        <circle r="4" fill="${C.sel}" cx="240" cy="110">${at('240;240;180;180;240', k, T, 'cx')}${at('110;110;30;30;110', k, T, 'cy')}</circle>
        <g>${at('240,110;240,110;300,165;300,165;240,110', k, T)}${PEN}</g>
        ${label(120, 40, 'Click + DRAG', C.ink, 13)}${label(120, 56, '= a smooth curve', '#666', 10)}`, { label: 'Pen tool: click and drag to make a curve' });
    },

    /* ---- 14. direct selection */
    direct: () => {
      const T = 5, k = '0;.25;.6;.85;1';
      return frame(`
        <path fill="${C.t}" stroke="#111" stroke-width="1.5">${at('M90 130L160 70L230 130Z;M90 130L160 70L230 130Z;M90 130L160 25L230 130Z;M90 130L160 25L230 130Z;M90 130L160 70L230 130Z', k, T, 'd')}</path>
        <rect x="86" y="126" width="8" height="8" fill="#fff" stroke="${C.sel}"/><rect x="226" y="126" width="8" height="8" fill="#fff" stroke="${C.sel}"/>
        <rect x="156" y="66" width="8" height="8" fill="#fff" stroke="${C.sel}">${at('#ffffff;#ffffff;' + C.sel + ';' + C.sel + ';#ffffff', '0;.2;.25;.85;1', T, 'fill')}${at('0,0;0,0;0,-45;0,-45;0,0', k, T)}</rect>
        <g>${at('200,40;162,72;162,27;162,27;200,40', k, T)}${WARROW}</g>
        ${label(160, 160, 'Drag ONE anchor point to reshape', C.ink, 11)}`, { label: 'Direct selection moves a single anchor point' });
    },

    /* ---- 15. typing */
    type: () => {
      const T = 6, word = 'Hello!';
      return frame(`
        <text x="100" y="105" font-family="Poppins,sans-serif" font-weight="800" font-size="40" fill="${C.p}">${[...word].map((ch, i) => `<tspan opacity="0">${ch}${op('0;0;1;1;0', `0;${(0.2 + i * 0.08).toFixed(2)};${(0.21 + i * 0.08).toFixed(2)};.9;1`, T)}</tspan>`).join('')}</text>
        <rect x="100" y="72" width="2" height="40" fill="#111">${at('100;100;100;232;232;100', '0;.2;.2;.68;.95;1', T, 'x')}${op('1;0;1;0;1;0;1;0;1', '0;.12;.25;.37;.5;.62;.75;.87;1', T)}</rect>
        <g>${at('60,140;101,92;101,92;101,92', '0;.15;.9;1', T)}${IBEAM}</g>
        ${ripple(101, 92, '0;.15;.2;1', T)}
        ${label(160, 150, 'Click, then type on your keyboard', C.ink, 11)}`, { label: 'Type tool: click and type' });
    },

    /* ---- 16. font switcher */
    fonts: () => {
      const fonts = [['Poppins', 800], ['Pacifico', 400], ['Bebas Neue', 400], ['Playfair Display', 700], ['Lobster', 400]];
      const n = fonts.length, T = 7.5;
      return frame(`${fonts.map(([f, w], i) => {
        const s = i / n, e = (i + 1) / n;
        return `<text x="160" y="104" text-anchor="middle" font-family="'${f}'" font-weight="${w}" font-size="42" fill="${[C.o, C.p, C.t, C.k, C.b][i]}" opacity="0">Design${op('0;0;1;1;0;0', `0;${Math.max(0, s - 0.001).toFixed(3)};${s.toFixed(3)};${(e - 0.01).toFixed(3)};${e.toFixed(3)};1`, T)}</text>
          <text x="160" y="140" text-anchor="middle" font-family="Poppins" font-size="11" fill="#666" opacity="0">${f}${op('0;0;1;1;0;0', `0;${Math.max(0, s - 0.001).toFixed(3)};${s.toFixed(3)};${(e - 0.01).toFixed(3)};${e.toFixed(3)};1`, T)}</text>`;
      }).join('')}`, { label: 'Same word, different fonts' });
    },

    /* ---- 17. stacking order */
    layers: () => {
      const T = 6, k = '0;.25;.45;.8;1';
      return frame(`
        <rect x="70" y="40" width="80" height="80" rx="8" fill="${C.y}"/>
        <rect x="110" y="60" width="80" height="80" rx="8" fill="${C.t}"/>
        <rect x="150" y="30" width="80" height="80" rx="8" fill="${C.p}"/>
        <rect x="70" y="40" width="80" height="80" rx="8" fill="${C.y}" opacity="0" stroke="${C.sel}" stroke-width="2">${op('0;0;1;1;0', k, T)}${at('0,0;0,0;0,-6;0,-6;0,0', k, T)}</rect>
        <g transform="translate(242 34)">
          <rect width="70" height="80" rx="4" fill="#323232"/>${label(35, 13, 'Layers', '#ddd', 8.5)}
          <g>${at('0,0;0,0;0,-40;0,-40;0,0', k, T)}<rect x="4" y="60" width="62" height="16" rx="2" fill="#4a4a4a"/><rect x="8" y="64" width="8" height="8" fill="${C.y}"/>${label(40, 71, 'yellow', '#ddd', 7.5)}</g>
          <g>${at('0,0;0,0;0,20;0,20;0,0', k, T)}<rect x="4" y="20" width="62" height="16" rx="2" fill="#3c3c3c"/><rect x="8" y="24" width="8" height="8" fill="${C.p}"/>${label(40, 31, 'purple', '#ddd', 7.5)}</g>
          <g>${at('0,0;0,0;0,20;0,20;0,0', k, T)}<rect x="4" y="40" width="62" height="16" rx="2" fill="#3c3c3c"/><rect x="8" y="44" width="8" height="8" fill="${C.t}"/>${label(40, 51, 'teal', '#ddd', 7.5)}</g>
        </g>
        ${label(130, 160, 'Bring to Front = move to the TOP of the stack', C.ink, 9.5)}`, { bw: 196, label: 'Objects are stacked; Bring to Front moves one on top' });
    },

    /* ---- 18. group */
    group: () => {
      const T = 6, k = '0;.25;.35;.75;.9;1';
      return frame(`
        <g>${at('0,0;0,0;0,0;60,0;60,0;0,0', k, T)}
          <circle cx="100" cy="80" r="26" fill="${C.o}"/><rect x="118" y="78" width="54" height="40" rx="6" fill="${C.t}"/>
          <rect x="70" y="50" width="106" height="72" fill="none" stroke="${C.sel}" stroke-dasharray="4 3" opacity="0">${op('0;0;1;1;1;0', k, T)}</rect>
        </g>
        ${key(250, 46, 'Ctrl+G', '0;.2;.28;1', T)}
        ${label(160, 160, 'Group = shapes move together', C.ink, 11)}`, { label: 'Grouped shapes move together' });
    },

    /* ---- 19. pathfinder ops */
    pathfinder: (opName = 'unite') => {
      const T = 6, k = '0;.3;.5;.9;1';
      const A = '<circle cx="138" cy="84" r="38"/>', B = '<circle cx="182" cy="84" r="38"/>';
      const res = {
        unite: `<g fill="${C.p}">${A}${B}</g>`,
        minus: `<defs><mask id="pfm"><rect width="320" height="180" fill="#fff"/><circle cx="182" cy="84" r="38" fill="#000"/></mask></defs><g fill="${C.p}" mask="url(#pfm)">${A}</g>`,
        intersect: `<defs><clipPath id="pfc"><circle cx="182" cy="84" r="38"/></clipPath></defs><g fill="${C.p}" clip-path="url(#pfc)">${A}</g>`,
        exclude: `<path fill="${C.p}" fill-rule="evenodd" d="M100 84a38 38 0 1 0 76 0a38 38 0 1 0-76 0M144 84a38 38 0 1 0 76 0a38 38 0 1 0-76 0"/>`,
      }[opName];
      const names = { unite: 'UNITE = join together', minus: 'MINUS FRONT = cut away', intersect: 'INTERSECT = keep the overlap', exclude: 'EXCLUDE = remove the overlap' };
      return frame(`
        <g opacity="1">${op('1;1;0;0;1', k, T)}
          <circle cx="138" cy="84" r="38" fill="${C.p}" fill-opacity=".85" stroke="#111"/>
          <circle cx="182" cy="84" r="38" fill="${C.o}" fill-opacity=".85" stroke="#111"/>
        </g>
        <g opacity="0">${op('0;0;1;1;0', k, T)}${res}</g>
        ${label(160, 152, names[opName], C.ink, 11)}`, { label: names[opName] });
    },
    unite: () => DEMOS.pathfinder('unite'),
    minus: () => DEMOS.pathfinder('minus'),
    intersect: () => DEMOS.pathfinder('intersect'),
    exclude: () => DEMOS.pathfinder('exclude'),

    /* ---- 20. align */
    align: () => {
      const T = 6, k = '0;.25;.55;.85;1';
      return frame(`
        <line x1="160" y1="22" x2="160" y2="150" stroke="#ff3cf5" stroke-dasharray="3 3" opacity="0">${op('0;0;1;1;0', k, T)}</line>
        <rect x="60" y="30" width="70" height="26" rx="5" fill="${C.o}">${at('0,0;0,0;65,0;65,0;0,0', k, T)}</rect>
        <circle cx="220" cy="85" r="18" fill="${C.t}">${at('0,0;0,0;-60,0;-60,0;0,0', k, T)}</circle>
        <rect x="90" y="112" width="110" height="24" rx="5" fill="${C.p}">${at('0,0;0,0;15,0;15,0;0,0', k, T)}</rect>
        ${label(160, 166, 'Horizontal Align Center', '#fff', 10)}`, { by: 16, bh: 138, label: 'Align lines objects up perfectly' });
    },

    /* ---- 21. drop shadow */
    effects: () => {
      const T = 5;
      return frame(`
        <defs><filter id="dfx" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="7" dy="7" stdDeviation="5" flood-opacity=".4">${at('0;0;.4;.4;0', '0;.25;.5;.85;1', T, 'flood-opacity')}</feDropShadow></filter></defs>
        <g filter="url(#dfx)"><rect x="110" y="44" width="100" height="70" rx="14" fill="${C.y}"/>${label(160, 86, 'POP!', C.ink, 18)}</g>
        ${label(160, 150, 'Effect › Stylize › Drop Shadow', C.ink, 10.5)}`, { label: 'Drop shadow makes things pop' });
    },

    /* ---- 22. zoom */
    zoom: () => {
      const T = 6, k = '0;.25;.55;.85;1';
      return frame(`
        <g transform="translate(160 90)"><g>${at('1;1;2.2;2.2;1', k, T, 'transform', 'scale')}
          <path d="M0-22l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="${C.o}" stroke="#111"/></g></g>
        <g>${at('200,40;170,80;170,80;170,80;200,40', k, T)}<circle r="10" fill="rgba(255,255,255,.4)" stroke="#111" stroke-width="2.5"/><path d="M7 7l9 9" stroke="#111" stroke-width="3.5" stroke-linecap="round"/><path d="M-5 0h10M0-5v10" stroke="#111" stroke-width="2"/></g>
        ${key(60, 40, 'Z', '0;.2;.3;1', T)}`, { label: 'Zoom tool makes things bigger on screen' });
    },

    /* ---- 23. hand / pan */
    pan: () => {
      const T = 5, k = '0;.2;.6;.85;1';
      return frame(`<g>${at('0,0;0,0;-50,-20;-50,-20;0,0', k, T)}
          <rect x="70" y="30" width="200" height="130" rx="2" fill="#fff"/>
          <circle cx="140" cy="90" r="24" fill="${C.t}"/><rect x="180" y="70" width="50" height="40" rx="6" fill="${C.k}"/></g>
        <g>${at('180,95;180,95;130,75;130,75;180,95', k, T)}${HAND}</g>
        ${key(50, 160, 'SPACE', '0;.15;.65;1', T)}`, { noBoard: true, bg: '#1f1f1f', label: 'Hold space and drag to move around' });
    },

    /* ---- 24. corner radius */
    corners: () => frame(`
      <rect x="100" y="40" width="120" height="90" fill="${C.b}">${at('0;0;40;40;0', '0;.2;.6;.85;1', 5, 'rx')}</rect>
      <circle cx="100" cy="40" r="4" fill="#fff" stroke="${C.sel}" stroke-width="1.5">${at('0,0;0,0;14,14;14,14;0,0', '0;.2;.6;.85;1', 5)}</circle>
      ${label(160, 154, 'Rounded corners', C.ink, 11)}`, { label: 'Round the corners of a rectangle' }),

    /* ---- 25. smart guides */
    smart: () => {
      const T = 5, k = '0;.3;.5;.85;1';
      return frame(`
        <line x1="160" y1="18" x2="160" y2="162" stroke="#ff3cf5" opacity="0">${op('0;0;1;1;0', k, T)}</line>
        <g opacity="0">${op('0;0;1;1;0', k, T)}${label(166, 30, 'center', '#ff3cf5', 9, 'start')}</g>
        <rect x="70" y="70" width="50" height="40" rx="6" fill="${C.o}">${at('0,0;0,0;45,0;45,0;0,0', k, T)}</rect>
        <g>${at('95,90;95,90;140,90;140,90;95,90', k, T)}${ARROW}</g>`, { label: 'Smart guides show when things line up' });
    },

    /* ---- 26. export */
    export: () => {
      const T = 5, k = '0;.25;.55;.85;1';
      return frame(`
        <g>${at('0,0;0,0;90,10;90,10;0,0', k, T)}${at('1;1;.5;.5;1', k, T, 'transform', 'scale', 'additive="sum"')}
          <rect x="50" y="40" width="110" height="80" rx="3" fill="#fff"/><circle cx="90" cy="80" r="20" fill="${C.o}"/><rect x="110" y="62" width="34" height="34" rx="6" fill="${C.p}"/></g>
        <g transform="translate(230 50)"><path d="M0 0h40l14 14v56H0z" fill="#fff"/><path d="M40 0v14h14" fill="#ddd"/><rect x="-6" y="40" width="48" height="18" rx="4" fill="${C.t}"/>${label(18, 53, 'PNG', '#fff', 11)}</g>
        ${label(160, 160, 'File › Export As PNG', '#fff', 11)}`, { noBoard: true, label: 'Export your artwork as a PNG image' });
    },

    /* ---- 27. coffee logo build */
    logo: () => {
      const T = 8;
      const st = (i) => { const s = 0.08 + i * 0.13; return `0;${s.toFixed(2)};${(s + 0.06).toFixed(2)};.92;1`; };
      return frame(`
        <g opacity="0">${op('0;0;1;1;0', st(0), T)}<circle cx="160" cy="88" r="62" fill="#FFE5B4"/></g>
        <g opacity="0">${op('0;0;1;1;0', st(1), T)}<path d="M186 76a17 17 0 1 1 0 30" fill="none" stroke="#7a4a2b" stroke-width="9"/></g>
        <g opacity="0">${op('0;0;1;1;0', st(2), T)}<rect x="122" y="62" width="70" height="58" rx="12" fill="#7a4a2b"/></g>
        <g opacity="0">${op('0;0;1;1;0', st(3), T)}<path d="M140 52c-6-8 6-12 0-20M157 52c-6-8 6-12 0-20M174 52c-6-8 6-12 0-20" stroke="#7a4a2b" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
        <g opacity="0">${op('0;0;1;1;0', st(4), T)}<circle cx="145" cy="88" r="4" fill="#fff"/><circle cx="170" cy="88" r="4" fill="#fff"/><path d="M146 100q11 9 22 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        <g opacity="0">${op('0;0;1;1;0', st(5), T)}<text x="160" y="168" text-anchor="middle" font-family="Pacifico,cursive" font-size="20" fill="${C.o}">Happy Cup</text></g>`, { by: 10, bh: 165, label: 'Building a logo step by step' });
    },

    /* ---- 28. undo */
    undo: () => {
      const T = 5, k = '0;.25;.35;.6;.7;1';
      return frame(`
        <circle cx="160" cy="80" r="34" fill="${C.k}">${op('1;1;0;0;1;1', k, T)}</circle>
        ${key(130, 150, 'Ctrl', '0;.2;.35;1', T)}${key(186, 150, 'Z', '0;.2;.35;1', T)}
        <g opacity="0">${op('0;0;1;1;0;0', k, T)}${label(160, 85, 'Oops — undone! ↩', C.ink, 12)}</g>`, { label: 'Ctrl+Z undoes your last step' });
    },

    /* ---- 29. welcome */
    welcome: () => frame(`
      <g transform="translate(160 86)">
        <g>${at('0;360', '0;1', 10, 'transform', 'rotate')}
          <circle r="54" fill="none" stroke="${C.p}" stroke-width="2" stroke-dasharray="4 8"/></g>
        <path d="M0-34L22 6 13 30H-13L-22 6z" fill="${C.o}" stroke="#fff" stroke-width="3" stroke-linejoin="round">${at('0,0;0,-6;0,0', '0;.5;1', 2.4)}</path>
        <circle cy="2" r="5" fill="#fff">${at('0,0;0,-6;0,0', '0;.5;1', 2.4)}</circle>
        ${[[-70, -30, C.t], [70, -20, C.y], [-60, 40, C.k], [64, 44, C.b]].map(([x, y, c], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${c}">${at('1;1.4;1', '0;.5;1', 1.6 + i * 0.3, 'transform', 'scale', 'additive="sum"')}</circle>`).join('')}
      </g>`, { noBoard: true, label: 'Welcome' }),
  };

  window.DQDemos = {
    get(name) { const f = DEMOS[name]; return f ? f() : ''; },
    has(name) { return !!DEMOS[name]; },
    list: Object.keys(DEMOS),
  };
})();
