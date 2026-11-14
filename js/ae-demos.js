/* =========================================================================
   DesignQuest — After Effects animated explainer clips (pure SVG + SMIL)
   ========================================================================= */
(function () {
  'use strict';
  const { C, at, op, ripple, frame, label, key, ARROW } = window.DQDemos.helpers;
  const add = (n, f) => window.DQDemos.add(n, f);
  const DIA = (x, y, c = '#FFD34D', s = 6) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${c}" stroke="#111" stroke-width=".8" transform="rotate(45 ${x} ${y})"/>`;
  // a mini timeline strip at the bottom of a demo
  const strip = (y, keys, T, k) => `<rect x="20" y="${y}" width="280" height="26" rx="4" fill="#2a2a2a"/>
    ${keys.map((kx) => DIA(kx, y + 13)).join('')}
    <line x1="30" y1="${y - 2}" x2="30" y2="${y + 28}" stroke="#2d8ceb" stroke-width="2">${at('30;290', k || '0;1', T, 'x1')}${at('30;290', k || '0;1', T, 'x2')}</line>
    <path d="M24 ${y - 8}h12v5l-6 5-6-5z" fill="#2d8ceb">${at('0,0;260,0', k || '0;1', T)}</path>`;

  add('ae-welcome', () => frame(`
    <g transform="translate(160 84)">
      <rect x="-64" y="-40" width="128" height="80" rx="10" fill="#00005B" stroke="#9999FF" stroke-width="3"/>
      <circle r="16" fill="${C.o}">${at('-40,10;40,-14;-40,10', '0;.5;1', 2.4)}</circle>
      <path d="M-6-9l14 9-14 9z" fill="#fff" opacity=".9"/>
      ${[[-90, -34, C.y], [86, -30, C.k], [-84, 40, C.t], [90, 42, '#9999FF']].map(([x, y, c], i) => `<g>${DIA(x, y, c, 12)}<animateTransform attributeName="transform" type="rotate" values="0 ${x} ${y};360 ${x} ${y}" dur="${3 + i}s" repeatCount="indefinite"/></g>`).join('')}
    </g>`, { noBoard: true, label: 'Welcome to After Effects' }));

  add('ae-workspace', () => {
    const T = 8;
    const area = (x, y, w, h, t, i, lx, ly) => {
      const s = i / 5, e = (i + 1) / 5, k = `0;${Math.max(s - 0.001, 0).toFixed(3)};${s.toFixed(3)};${(e - 0.02).toFixed(3)};${e.toFixed(3)};1`;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#9999FF" fill-opacity="0" stroke="#9999FF" stroke-width="2.5" stroke-opacity="0">${at('0;0;1;1;0;0', k, T, 'stroke-opacity')}${at('0;0;.25;.25;0;0', k, T, 'fill-opacity')}</rect>
        <g opacity="0">${at('0;0;1;1;0;0', k, T, 'opacity')}<rect x="${lx - 54}" y="${ly - 13}" width="108" height="20" rx="10" fill="#9999FF"/>${label(lx, ly + 1, t, '#00005B', 10.5)}</g>`;
    };
    return frame(`<rect x="14" y="12" width="292" height="156" rx="6" fill="#2c2c2c"/>
      <rect x="14" y="12" width="292" height="10" fill="#1f1f1f"/><rect x="14" y="22" width="292" height="11" fill="#383838"/>
      <rect x="14" y="33" width="52" height="72" fill="#333"/><rect x="250" y="33" width="56" height="72" fill="#333"/>
      <rect x="66" y="33" width="184" height="72" fill="#1b1b1b"/><rect x="96" y="40" width="124" height="58" fill="#1D1B4B"/><circle cx="140" cy="70" r="12" fill="${C.o}"/>
      <rect x="14" y="105" width="292" height="63" fill="#303030"/>${[0, 1, 2].map((i) => `<rect x="20" y="${112 + i * 17}" width="80" height="12" rx="2" fill="#444"/><rect x="${130 + i * 20}" y="${113 + i * 17}" width="${120 - i * 20}" height="10" rx="2" fill="${[C.o, C.t, C.p][i]}" opacity=".8"/>`).join('')}
      ${area(14, 22, 292, 11, '1 · Toolbar', 0, 160, 50)}${area(14, 33, 52, 72, '2 · Project', 1, 100, 70)}${area(96, 40, 124, 58, '3 · Composition', 2, 158, 72)}
      ${area(250, 33, 56, 72, '4 · Effects', 3, 200, 70)}${area(14, 105, 292, 63, '5 · Timeline ⏱', 4, 160, 98)}`, { noBoard: true, label: 'The main areas of After Effects' });
  });

  add('keyframes', () => {
    const T = 5;
    return frame(`<circle cy="62" r="16" fill="${C.o}" cx="50">${at('50;270;270', '0;.8;1', T, 'cx')}</circle>
      ${[50, 160, 270].map((x, i) => `<g opacity=".25"><circle cx="${x}" cy="62" r="16" fill="none" stroke="${C.o}" stroke-dasharray="3 3"/></g>${label(x, 98, ['Start', '', 'End'][i], C.ink, 10)}`).join('')}
      ${strip(126, [30, 290], T, '0;.8;1')}
      ${label(30, 166, '◆ keyframe 1', '#fff', 9.5, 'start')}${label(290, 166, 'keyframe 2 ◆', '#fff', 9.5, 'end')}
      ${label(160, 30, 'You set the START and the END — AE draws the middle!', C.ink, 9.5)}`, { bh: 92, label: 'Keyframes mark where things are at a moment in time' });
  });

  add('stopwatch', () => {
    const T = 5, k = '0;.3;.35;1';
    return frame(`<rect x="60" y="54" width="200" height="40" rx="6" fill="#2c2c2c"/>
      <g transform="translate(86 74)"><circle r="11" fill="none" stroke="#9a9a9a" stroke-width="2.4">${at('#9a9a9a;#9a9a9a;#2d8ceb;#2d8ceb', k, T, 'stroke')}${at('none;none;#2d8ceb;#2d8ceb', k, T, 'fill')}</circle><path d="M0 0v-6M-4-15h8" stroke="#fff" stroke-width="2.4"/></g>
      ${label(150, 79, 'Position', '#ddd', 12)}<text x="210" y="79" font-family="Poppins" font-size="12" fill="#4fa3ff">480, 270</text>
      <g opacity="0">${op('0;0;1;1', k, T)}${DIA(160, 120, '#FFD34D', 12)}${label(160, 148, 'First keyframe created! ◆', '#fff', 11)}</g>
      <g>${at('200,140;86,76;86,76;86,76', '0;.25;.9;1', T)}${ARROW}</g>${ripple(86, 76, '0;.27;.33;1', T)}
      ${label(160, 34, 'Click the stopwatch ⏱ = "animate this!"', '#fff', 12)}`, { noBoard: true, label: 'The stopwatch turns on animation for a property' });
  });

  add('cti', () => {
    const T = 5, k = '0;.5;1';
    return frame(`<circle cy="60" r="16" fill="${C.t}" cx="60">${at('60;260;60', k, T, 'cx')}</circle>
      ${strip(118, [40, 280], T, k)}
      <g>${at('30,112;290,112;30,112', k, T)}<g transform="translate(0 -6)">${ARROW}</g></g>
      ${label(160, 30, 'Drag the blue playhead to move through time', C.ink, 10.5)}`, { bh: 86, label: 'The current time indicator (playhead)' });
  });

  const tDemo = (name, inner, txt, keyLetter) => add(name, () => frame(`${inner}${key(270, 40, keyLetter, '0;.05;.2;1', 5)}${label(160, 168, txt, '#fff', 10.5)}`, { noBoard: true, label: txt }));
  tDemo('ae-scale', `<g transform="translate(150 90)"><path d="M0-40l11 23 25 3-18 17 4 25-22-12-22 12 4-25-18-17 25-3z" fill="${C.y}">${at('0;1.2;1;1;0', '0;.3;.42;.8;1', 5, 'transform', 'scale')}</path></g>`, 'Scale (S) = make it bigger or smaller', 'S');
  tDemo('ae-rotate', `<g transform="translate(150 90)"><g>${at('0;360', '0;1', 3, 'transform', 'rotate')}<rect x="-34" y="-34" width="68" height="68" rx="10" fill="${C.p}"/></g></g>`, 'Rotation (R) = spin it around', 'R');
  tDemo('ae-opacity', `<circle cx="150" cy="90" r="40" fill="${C.k}">${at('0;1;1;0', '0;.4;.8;1', 5, 'opacity')}</circle>`, 'Opacity (T) = fade in and out', 'T');

  add('anchor-point', () => {
    const T = 6;
    return frame(`<g transform="translate(100 90)"><g>${at('0;360', '0;1', 3, 'transform', 'rotate')}<rect x="-30" y="-30" width="60" height="60" rx="6" fill="${C.t}"/></g><circle r="5" fill="none" stroke="#fff" stroke-width="2"/></g>
      <g transform="translate(220 90)"><g>${at('0;360', '0;1', 3, 'transform', 'rotate')}<rect x="0" y="0" width="60" height="60" rx="6" fill="${C.o}" transform="translate(-6 -6)"/></g><circle r="5" fill="none" stroke="#fff" stroke-width="2"/></g>
      ${label(100, 160, 'Anchor in the center', '#fff', 10)}${label(220, 160, 'Anchor at the corner', '#fff', 10)}${label(160, 26, 'Things spin and grow around the ⊕ ANCHOR POINT', '#fff', 10.5)}`, { noBoard: true, label: 'The anchor point is the center of rotation and scale' });
  });

  add('easing', () => {
    const T = 3.2;
    return frame(`
      ${label(40, 40, 'Linear', '#fff', 10, 'start')}<line x1="40" y1="60" x2="280" y2="60" stroke="#444"/><circle cy="60" r="12" fill="#888" cx="50"><animate attributeName="cx" values="50;270;50" keyTimes="0;.5;1" dur="${T}s" repeatCount="indefinite"/></circle>
      ${label(40, 100, 'Easy Ease (F9) ✨', '#fff', 10, 'start')}<line x1="40" y1="120" x2="280" y2="120" stroke="#444"/><circle cy="120" r="12" fill="${C.o}" cx="50"><animate attributeName="cx" values="50;270;50" keyTimes="0;.5;1" calcMode="spline" keySplines=".33 0 .67 1;.33 0 .67 1" dur="${T}s" repeatCount="indefinite"/></circle>
      ${label(160, 160, 'Ease = slow start, slow stop — like real life', '#fff', 10.5)}`, { noBoard: true, label: 'Linear vs Easy Ease' });
  });

  add('bounce', () => frame(`<line x1="40" y1="140" x2="280" y2="140" stroke="#111" stroke-width="3"/>
      <ellipse cx="160" cy="132" rx="16" ry="16" fill="${C.o}"><animate attributeName="cy" values="40;124;70;124;104;124" keyTimes="0;.35;.55;.75;.87;1" calcMode="spline" keySplines=".5 0 1 1;0 0 .5 1;.5 0 1 1;0 0 .5 1;.5 0 1 1" dur="2.4s" repeatCount="indefinite"/></ellipse>
      ${label(160, 30, 'Bounce: fall fast, slow at the top', C.ink, 10.5)}`, { label: 'A bouncing ball' }));

  add('typewriter', () => {
    const T = 5, word = 'Hello, world!';
    return frame(`<rect x="40" y="40" width="240" height="80" rx="6" fill="#1D1B4B"/>
      <text x="62" y="90" font-family="Roboto Mono, monospace" font-weight="700" font-size="22" fill="#fff">${[...word].map((ch, i) => `<tspan opacity="0">${ch === ' ' ? ' ' : ch}${op('0;0;1;1;0', `0;${(0.08 + i * 0.05).toFixed(2)};${(0.09 + i * 0.05).toFixed(2)};.92;1`, T)}</tspan>`).join('')}</text>
      ${label(160, 150, 'Typewriter preset: letters appear one by one', C.ink, 10.5)}`, { label: 'Typewriter text animation' });
  });

  add('fade-in', () => frame(`<rect x="40" y="30" width="240" height="100" rx="6" fill="#1D1B4B"/><text x="160" y="92" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="34" fill="${C.y}">WOW!${at('0;1;1;0', '0;.35;.85;1', 4, 'opacity')}</text>
      ${label(160, 156, 'Fade In = Opacity 0% → 100%', C.ink, 10.5)}`, { label: 'Fade in preset' }));

  add('glow-fx', () => frame(`<defs><filter id="glw" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"><animate attributeName="stdDeviation" values="0;8;0" dur="3s" repeatCount="indefinite"/></feGaussianBlur><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect x="40" y="24" width="240" height="110" rx="6" fill="#0d0d22"/><text x="160" y="92" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="40" fill="${C.y}" filter="url(#glw)">NEON</text>
      ${label(160, 160, 'Effect › Stylize › Glow ✨', C.ink, 10.5)}`, { label: 'Glow effect' }));

  add('blur-in', () => frame(`<defs><filter id="bli"><feGaussianBlur stdDeviation="8"><animate attributeName="stdDeviation" values="10;10;0;0;10" keyTimes="0;.15;.5;.9;1" dur="4s" repeatCount="indefinite"/></feGaussianBlur></filter></defs>
      <rect x="40" y="24" width="240" height="110" rx="6" fill="#1D1B4B"/><text x="160" y="92" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="38" fill="#fff" filter="url(#bli)">FOCUS</text>
      ${label(160, 160, 'Animate Blurriness 40 → 0 = blur in', C.ink, 10.5)}`, { label: 'Blur in animation' }));

  add('parenting', () => frame(`<g transform="translate(160 86)"><g>${at('0;360', '0;1', 5, 'transform', 'rotate')}
      <circle r="34" fill="${C.p}"/><path d="M-34 0h68" stroke="#fff" stroke-opacity=".3" stroke-width="6"/>
      <line x1="0" y1="0" x2="80" y2="0" stroke="#fff" stroke-dasharray="3 3" opacity=".5"/><circle cx="80" r="12" fill="#ddd"/></g></g>
      ${label(160, 160, 'Moon\'s PARENT = Planet → the moon follows the planet', '#fff', 10)}${label(160, 22, 'Parent & Link 🔗', '#fff', 12)}`, { noBoard: true, bg: '#0d0d22', label: 'Parenting links layers together' }));

  add('layer-timing', () => {
    const T = 5, k = '0;.3;.7;1';
    return frame(`<rect x="20" y="30" width="280" height="110" rx="6" fill="#262626"/>
      ${[[C.o, 30, 200], [C.t, 30, 200], [C.p, 30, 200]].map(([c, x, w], i) => `<rect x="${x}" y="${44 + i * 30}" width="${w}" height="18" rx="3" fill="${c}" opacity=".85">${i === 1 ? at('0,0;0,0;80,0;80,0', k, T) : ''}</rect>`).join('')}
      <g>${at('120,90;120,90;200,90;200,90', k, T)}${ARROW}</g>
      ${label(160, 160, 'Drag a layer bar = it starts later', '#fff', 10.5)}`, { noBoard: true, label: 'Layer timing in the timeline' });
  });

  add('render', () => frame(`<rect x="40" y="36" width="130" height="80" rx="4" fill="#1D1B4B"/><circle cx="80" cy="76" r="14" fill="${C.o}">${at('0,0;50,0;0,0', '0;.5;1', 2)}</circle>
      <path d="M180 76h40" stroke="#fff" stroke-width="3" marker-end="url(#ar)"/><defs><marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5 0 10z" fill="#fff"/></marker></defs>
      <g transform="translate(232 46)"><rect width="56" height="60" rx="6" fill="#fff"/><path d="M20 18l20 12-20 12z" fill="${C.p}"/></g>
      ${label(160, 150, 'File › Export › Video — share your animation!', '#fff', 10.5)}`, { noBoard: true, label: 'Export a video' }));

  add('ae-intro', () => {
    const T = 6;
    return frame(`<rect x="40" y="20" width="240" height="135" rx="4" fill="#14142B"/>
      <g transform="translate(160 70)"><circle r="26" fill="${C.o}">${at('0;1.15;1;1;0', '0;.12;.2;.9;1', T, 'transform', 'scale')}</circle><path d="M-8-12l20 12-20 12z" fill="#fff" opacity="0">${op('0;0;1;1;0', '0;.2;.25;.9;1', T)}</path></g>
      <text x="160" y="128" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="20" fill="#fff">${[...'MY CHANNEL'].map((ch, i) => `<tspan opacity="0">${ch === ' ' ? ' ' : ch}${op('0;0;1;1;0', `0;${(0.3 + i * 0.04).toFixed(2)};${(0.31 + i * 0.04).toFixed(2)};.9;1`, T)}</tspan>`).join('')}</text>`, { noBoard: true, label: 'An animated intro' });
  });
})();
