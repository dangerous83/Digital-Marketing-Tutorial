/* =========================================================================
   DesignQuest — Photoshop animated explainer clips (pure SVG + SMIL)
   ========================================================================= */
(function () {
  'use strict';
  const H = window.DQDemos.helpers;
  const { C, at, op, ripple, frame, label, key, ARROW, CROSS, HAND } = H;
  const add = (n, f) => window.DQDemos.add(n, f);
  const BRUSHC = '<circle r="9" fill="none" stroke="#fff" stroke-width="2.4"/><circle r="9" fill="none" stroke="#111" stroke-width="1"/>';
  // a little "photo": sky, sun, mountains, lake
  const photo = (x, y, w, h, id = 'ph') => `<g><clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/></clipPath><g clip-path="url(#${id}c)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7EC8F2"/>
      <circle cx="${x + w * 0.75}" cy="${y + h * 0.28}" r="${h * 0.12}" fill="#FFD84D"/>
      <path d="M${x} ${y + h * 0.75}L${x + w * 0.28} ${y + h * 0.35}L${x + w * 0.5} ${y + h * 0.62}L${x + w * 0.7} ${y + h * 0.4}L${x + w} ${y + h * 0.78}V${y + h}H${x}Z" fill="#4C8C5A"/>
      <path d="M${x + w * 0.22} ${y + h * 0.43}L${x + w * 0.28} ${y + h * 0.35}L${x + w * 0.34} ${y + h * 0.44}Z" fill="#fff"/>
      <rect x="${x}" y="${y + h * 0.8}" width="${w}" height="${h * 0.2}" fill="#3E8FC4"/></g></g>`;
  const checker = '<defs><pattern id="chk" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fff"/><rect width="5" height="5" fill="#ccc"/><rect x="5" y="5" width="5" height="5" fill="#ccc"/></pattern></defs>';
  const ants = (inner, extra = '') => `<g fill="none" ${extra}><g stroke="#fff" stroke-width="1.6">${inner}</g><g stroke="#111" stroke-width="1.6" stroke-dasharray="4 4">${inner}<animate attributeName="stroke-dashoffset" values="0;8" dur=".6s" repeatCount="indefinite"/></g></g>`;

  add('ps-welcome', () => frame(`
    <g transform="translate(160 88)">
      <rect x="-50" y="-34" width="100" height="72" rx="12" fill="#31A8FF"/><rect x="-18" y="-46" width="36" height="16" rx="5" fill="#31A8FF"/>
      <circle r="24" fill="#001E36"/><circle r="16" fill="#7EC8F2">${at('16;19;16', '0;.5;1', 2.4, 'r')}</circle><circle cx="-6" cy="-6" r="5" fill="#fff" opacity=".8"/>
      ${[[-80, -30, C.y], [78, -26, C.k], [-70, 40, C.t], [74, 44, C.o]].map(([x, y, c], i) => `<path d="M${x} ${y - 8}l2.5 5.5 6 .8-4.3 4 1 6-5.2-2.9-5.2 2.9 1-6-4.3-4 6-.8z" fill="${c}">${at('1;1.35;1', '0;.5;1', 1.4 + i * 0.3, 'transform', 'scale', 'additive="sum"')}</path>`).join('')}
    </g>`, { noBoard: true, label: 'Welcome to Photoshop' }));

  add('pixels', () => {
    const cols = ['#7EC8F2', '#6BB8E8', '#FFD84D', '#4C8C5A', '#3E7F4F', '#3E8FC4', '#fff', '#9DD3F5'];
    let px = '';
    for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) {
      const c = j > 5 ? '#3E8FC4' : j > 3 + ((i * 7) % 3) / 2 ? '#4C8C5A' : (i > 7 && j < 3 && i < 11) ? (j === 1 && i > 8 ? '#FFD84D' : '#9DD3F5') : cols[(i + j) % 2];
      px += `<rect x="${i * 10}" y="${j * 10}" width="10" height="10" fill="${c}" stroke="#555" stroke-width=".3"/>`;
    }
    return frame(`
      ${photo(30, 30, 120, 80, 'px1')}
      <rect x="62" y="52" width="26" height="20" fill="none" stroke="${C.o}" stroke-width="2"/>
      <path d="M88 52L178 26M88 72L178 140" stroke="${C.o}" stroke-width="1.2" stroke-dasharray="3 3"/>
      <g transform="translate(178 26)"><g>${at('0.2;1;1;0.2', '0;.3;.85;1', 6, 'transform', 'scale')}${px}</g></g>
      ${label(90, 132, 'A photo…', '#fff', 11)}${label(238, 160, '…is made of tiny squares = PIXELS', '#fff', 10)}`, { noBoard: true, label: 'Photos are made of pixels' });
  });

  add('ps-workspace', () => {
    const T = 8;
    const area = (x, y, w, h, t, i, lx, ly) => {
      const s = i / 5, e = (i + 1) / 5, k = `0;${Math.max(s - 0.001, 0).toFixed(3)};${s.toFixed(3)};${(e - 0.02).toFixed(3)};${e.toFixed(3)};1`;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.b}" fill-opacity="0" stroke="#31A8FF" stroke-width="2.5" stroke-opacity="0">${at('0;0;1;1;0;0', k, T, 'stroke-opacity')}${at('0;0;.25;.25;0;0', k, T, 'fill-opacity')}</rect>
        <g opacity="0">${at('0;0;1;1;0;0', k, T, 'opacity')}<rect x="${lx - 52}" y="${ly - 13}" width="104" height="20" rx="10" fill="#31A8FF"/>${label(lx, ly + 1, t, '#001E36', 10.5)}</g>`;
    };
    return frame(`
      <rect x="16" y="14" width="288" height="152" rx="6" fill="#2c2c2c"/>
      <rect x="16" y="14" width="288" height="12" rx="3" fill="#1f1f1f"/><rect x="16" y="26" width="288" height="12" fill="#383838"/>
      <rect x="16" y="38" width="22" height="128" fill="#383838"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="21" y="${44 + i * 13}" width="12" height="9" rx="2" fill="#666"/>`).join('')}
      <rect x="232" y="38" width="72" height="128" fill="#383838"/>${[0, 1, 2, 3].map((i) => `<rect x="238" y="${100 + i * 15}" width="60" height="11" rx="2" fill="${i === 1 ? '#555' : '#474747'}"/>`).join('')}
      <rect x="38" y="38" width="194" height="128" fill="#1d1d1d"/>${photo(62, 56, 146, 94, 'ws')}
      ${area(16, 14, 288, 12, '1 · Menu Bar', 0, 160, 46)}${area(16, 26, 288, 12, '2 · Options Bar', 1, 160, 58)}
      ${area(16, 38, 22, 128, '3 · Toolbar', 2, 92, 100)}${area(62, 56, 146, 94, '4 · Your Photo', 3, 135, 104)}${area(232, 94, 72, 72, '5 · Layers', 4, 180, 130)}`, { noBoard: true, label: 'The main areas of Photoshop' });
  });

  add('ps-layers', () => {
    const T = 6, k = '0;.2;.5;.8;1';
    const sheet = (dy, inner, i) => `<g>${at(`0,0;0,0;${i * 34 - 34},${dy};${i * 34 - 34},${dy};0,0`, k, T)}<g transform="translate(160 92) skewX(-20) scale(1 .62)"><rect x="-60" y="-60" width="120" height="120" rx="4" fill="${i === 0 ? '#7EC8F2' : 'rgba(255,255,255,.12)'}" stroke="#fff" stroke-opacity=".6" stroke-dasharray="${i ? '4 3' : '0'}"/>${inner}</g></g>`;
    return frame(checker + `
      ${sheet(30, '<circle cx="30" cy="-30" r="14" fill="#FFD84D"/>', 0)}
      ${sheet(0, '<path d="M-60 40L-15 -15L15 20L35 0L60 40V60H-60Z" fill="#4C8C5A"/>', 1)}
      ${sheet(-30, `<text x="0" y="-25" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="26" fill="${C.o}">HELLO</text>`, 2)}
      <g opacity="0">${op('0;0;1;1;0', k, T)}${label(48, 160, 'Background', '#bbb', 9.5)}${label(160, 160, 'Mountain', '#bbb', 9.5)}${label(270, 160, 'Text', '#bbb', 9.5)}</g>`, { noBoard: true, label: 'Layers are like stacked transparent sheets' });
  });

  add('opacity', () => {
    const T = 5, k = '0;.2;.6;.85;1';
    return frame(checker + `<rect x="60" y="30" width="200" height="110" fill="url(#chk)"/>
      <circle cx="125" cy="85" r="40" fill="${C.p}"/><rect x="140" y="55" width="90" height="60" rx="10" fill="${C.o}">${at('1;1;.3;.3;1', k, T, 'opacity')}</rect>
      <rect x="80" y="152" width="160" height="6" rx="3" fill="#555"/><circle cx="240" cy="155" r="7" fill="#fff">${at('240;240;128;128;240', k, T, 'cx')}</circle>
      ${label(40, 158, 'Opacity', '#fff', 9.5)}`, { noBoard: true, label: 'Opacity makes a layer see-through' });
  });

  add('bg-lock', () => {
    const T = 6, k = '0;.35;.45;1';
    return frame(`<rect x="70" y="40" width="180" height="40" rx="5" fill="#3c3c3c"/><rect x="80" y="47" width="36" height="26" fill="#7EC8F2"/>
      ${label(160, 65, 'Background', '#ddd', 11)}<g>${op('1;1;0;0', k, T)}<text x="232" y="66" font-size="14" text-anchor="middle">🔒</text></g>
      <g opacity="0">${op('0;0;1;1', k, T)}<rect x="70" y="40" width="180" height="40" rx="5" fill="#505050"/><rect x="80" y="47" width="36" height="26" fill="#7EC8F2"/>${label(160, 65, 'Layer 0', '#fff', 11)}</g>
      <g>${at('200,130;150,62;150,62;150,62', '0;.25;.9;1', T)}${ARROW}</g>
      ${ripple(150, 62, '0;.25;.3;1', T)}${ripple(150, 62, '0;.32;.37;1', T)}
      ${label(160, 120, 'Double-click to unlock 🔓', '#fff', 12)}`, { noBoard: true, label: 'Double-click the Background to unlock it' });
  });

  add('marquee', () => {
    const T = 5, k = '0;.15;.55;.9;1';
    return frame(`${photo(40, 18, 240, 144, 'mq')}
      <rect x="90" y="50" width="0" height="0" fill="none" stroke="#fff" stroke-width="1.6">${at('0;0;130;130;0', k, T, 'width')}${at('0;0;80;80;0', k, T, 'height')}</rect>
      <rect x="90" y="50" width="0" height="0" fill="none" stroke="#111" stroke-width="1.6" stroke-dasharray="4 4">${at('0;0;130;130;0', k, T, 'width')}${at('0;0;80;80;0', k, T, 'height')}<animate attributeName="stroke-dashoffset" values="0;8" dur=".6s" repeatCount="indefinite"/></rect>
      <g>${at('70,30;90,50;220,130;220,130;70,30', k, T)}${CROSS}</g>
      <g opacity="0">${op('0;0;1;1;0', '0;.55;.6;.9;1', T)}<rect x="96" y="134" width="128" height="20" rx="10" fill="#111" opacity=".75"/>${label(160, 148, 'Marching ants! 🐜', '#fff', 10.5)}</g>`, { noBoard: true, label: 'The marquee tool selects an area' });
  });

  add('wand', () => {
    const T = 6, k = '0;.25;.32;.62;.7;1';
    return frame(`<rect x="40" y="18" width="240" height="144" rx="3" fill="#5FB4EC"/>
      <g transform="translate(160 84)"><path d="M-30-10a30 34 0 1 1 60 0c0 18-18 30-22 38h-16c-4-8-22-20-22-38z" fill="${C.o}"/><path d="M-10-44c-8 14-8 46 0 72M10-44c8 14 8 46 0 72" stroke="${C.y}" stroke-width="7" fill="none"/><rect x="-8" y="34" width="16" height="12" rx="2" fill="#8B5A2B"/></g>
      <g opacity="0">${op('0;0;1;1;0;0', k, T)}${ants('<rect x="41" y="19" width="238" height="142"/><path d="M130 74a30 34 0 1 1 60 0c0 18-18 30-22 38h-16c-4-8-22-20-22-38z"/>')}${label(100, 40, 'Sky selected', '#fff', 10)}</g>
      <g opacity="0">${op('0;0;0;0;1;1', k, T)}${ants('<path d="M130 74a30 34 0 1 1 60 0c0 18-18 30-22 38h-16c-4-8-22-20-22-38z M152 118h16v12h-16z"/>')}${label(100, 40, 'Select › Inverse = the balloon!', '#fff', 10)}</g>
      <g>${at('250,140;80,60;80,60;80,60;80,60;250,140', k, T)}<path d="M0 0L16 16" stroke="#111" stroke-width="4" stroke-linecap="round"/><path d="M0 0L16 16" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M-4-8v6M-7-5h6" stroke="#fff" stroke-width="1.5"/></g>
      ${ripple(80, 60, '0;.2;.27;1', T)}`, { noBoard: true, label: 'Magic Wand selects similar colors' });
  });

  add('lasso', () => {
    const T = 5, d = 'M110 60C120 30 200 30 210 60S230 130 160 130 100 90 110 60Z';
    return frame(`${photo(40, 18, 240, 144, 'ls')}
      <path d="${d}" fill="none" stroke="#111" stroke-width="2" stroke-dasharray="400" stroke-dashoffset="400">${at('400;0;0;400', '0;.6;.9;1', T, 'stroke-dashoffset')}</path>
      <g><animateMotion dur="${T}s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;.6;.9;1" calcMode="linear" path="${d}"/><path d="M-4 4c-4-2-4-8 1-10s12-1 12 3-7 6-11 5" fill="none" stroke="#111" stroke-width="2"/></g>
      ${label(160, 154, 'Draw around it — like a lasso rope 🤠', '#fff', 10.5)}`, { noBoard: true, label: 'Lasso draws a freehand selection' });
  });

  add('brush', () => {
    const T = 5, d = 'M70 120C110 40 150 140 190 70S250 60 260 100';
    return frame(`<path d="${d}" fill="none" stroke="${C.p}" stroke-width="16" stroke-linecap="round" stroke-dasharray="320" stroke-dashoffset="320">${at('320;0;0;320', '0;.6;.9;1', T, 'stroke-dashoffset')}</path>
      <g><animateMotion dur="${T}s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;.6;.9;1" calcMode="linear" path="${d}"/>${BRUSHC}</g>
      ${key(70, 36, '[', '0;.7;.8;1', T)}${key(120, 36, ']', '0;.8;.9;1', T)}${label(210, 40, '= brush size', C.ink, 10)}`, { label: 'Paint with the Brush tool' });
  });

  add('hardness', () => frame(`
    <defs><radialGradient id="soft"><stop offset=".1" stop-color="${C.p}"/><stop offset="1" stop-color="${C.p}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="110" cy="80" r="40" fill="${C.p}"/><circle cx="215" cy="80" r="46" fill="url(#soft)"/>
    ${label(110, 145, 'Hardness 100%', C.ink, 11)}${label(215, 145, 'Hardness 0%', C.ink, 11)}${label(110, 160, 'sharp edge', '#777', 9)}${label(215, 160, 'soft, fuzzy edge', '#777', 9)}`, { label: 'Hard vs soft brushes' }));

  add('eraser', () => {
    const T = 5, d = 'M80 70C130 70 150 110 240 100';
    return frame(checker + `<rect x="40" y="18" width="240" height="144" fill="url(#chk)"/>
      <mask id="erm"><rect x="40" y="18" width="240" height="144" fill="#fff"/><path d="${d}" stroke="#000" stroke-width="30" stroke-linecap="round" fill="none" stroke-dasharray="200" stroke-dashoffset="200">${at('200;0;0;200', '0;.6;.9;1', T, 'stroke-dashoffset')}</path></mask>
      <g mask="url(#erm)">${photo(40, 18, 240, 144, 'er')}</g>
      <g><animateMotion dur="${T}s" repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;.6;.9;1" calcMode="linear" path="${d}"/><circle r="15" fill="none" stroke="#fff" stroke-width="2"/><circle r="15" fill="none" stroke="#111"/></g>
      ${label(160, 154, 'The checkerboard = transparent (empty)', '#fff', 10)}`, { noBoard: true, label: 'Eraser makes pixels transparent' });
  });

  add('ps-gradient', () => {
    const T = 5, k = '0;.2;.5;.55;.9;1';
    return frame(`<defs><linearGradient id="pgr"><stop offset="0" stop-color="${C.o}"/><stop offset="1" stop-color="${C.p}"/></linearGradient></defs>
      <rect x="40" y="18" width="240" height="144" fill="#fff"/><rect x="40" y="18" width="240" height="144" fill="url(#pgr)" opacity="0">${op('0;0;0;1;1;0', k, T)}</rect>
      <line x1="70" y1="90" x2="70" y2="90" stroke="#111" stroke-width="2">${at('70;70;250;250;250;70', k, T, 'x2')}${op('1;1;1;0;0;1', k, T)}</line>
      <g>${at('70,90;70,90;250,90;250,90;250,90;70,90', k, T)}${CROSS}</g>`, { label: 'Gradient tool: drag a line' });
  });

  add('bucket', () => {
    const T = 5, k = '0;.25;.32;.9;1';
    return frame(`<rect x="70" y="30" width="180" height="110" rx="10" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="160" cy="85" r="30" fill="#fff" stroke="#111" stroke-width="3"/>
      <rect x="71.5" y="31.5" width="177" height="107" rx="9" fill="${C.t}" opacity="0">${op('0;0;1;1;0', k, T)}</rect><circle cx="160" cy="85" r="28.5" fill="#fff" opacity="0">${op('0;0;1;1;0', k, T)}</circle>
      <g>${at('260,40;100,60;100,60;100,60;260,40', k, T)}<path d="M-8 2l7-7 8 8-7 7z" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M8 6s-2 2.5-2 3.8a2 2 0 0 0 4 0c0-1.3-2-3.8-2-3.8z" fill="${C.t}"/></g>
      ${ripple(100, 60, k, T)}${label(160, 158, 'Click = fill the area with color', C.ink, 10.5)}`, { label: 'Paint Bucket fills an area' });
  });

  const filterDemo = (name, filt, labelTxt, values) => add(name, () => frame(`<defs><filter id="f-${name}">${filt}</filter></defs>
      <g filter="url(#f-${name})">${photo(60, 24, 200, 120, 'fd' + name)}</g>
      <g opacity="0">${op(values.lab, values.k, 6)}<rect x="96" y="150" width="128" height="20" rx="10" fill="#111" opacity=".8"/>${label(160, 164, labelTxt, '#fff', 10)}</g>`, { noBoard: true, label: labelTxt }));
  filterDemo('brightness', `<feComponentTransfer><feFuncR type="linear" slope=".45">${at('.45;.45;1.05;1.05;.45', '0;.2;.5;.85;1', 6, 'slope')}</feFuncR><feFuncG type="linear" slope=".45">${at('.45;.45;1.05;1.05;.45', '0;.2;.5;.85;1', 6, 'slope')}</feFuncG><feFuncB type="linear" slope=".45">${at('.45;.45;1.05;1.05;.45', '0;.2;.5;.85;1', 6, 'slope')}</feFuncB></feComponentTransfer>`, 'Brightness ☀ = lighter photo', { lab: '0;0;1;1;0', k: '0;.45;.5;.85;1' });
  filterDemo('huesat', `<feColorMatrix type="hueRotate" values="0">${at('0;0;180;360;360', '0;.15;.55;.9;1', 6, 'values')}</feColorMatrix>`, 'Hue = change all the colors 🌈', { lab: '0;1;1;1;0', k: '0;.15;.5;.9;1' });
  filterDemo('bw', `<feColorMatrix type="saturate" values="1">${at('1;1;0;0;1', '0;.2;.5;.85;1', 6, 'values')}</feColorMatrix>`, 'Black & White ◐', { lab: '0;0;1;1;0', k: '0;.45;.5;.85;1' });
  filterDemo('blur', `<feGaussianBlur stdDeviation="0">${at('0;0;5;5;0', '0;.2;.5;.85;1', 6, 'stdDeviation')}</feGaussianBlur>`, 'Gaussian Blur = soft & dreamy', { lab: '0;0;1;1;0', k: '0;.45;.5;.85;1' });

  add('heal', () => {
    const T = 6;
    const spots = [[120, 70], [170, 95], [205, 66]];
    return frame(`<circle cx="160" cy="88" r="60" fill="#D7263D"/><path d="M160 30c2-10 8-16 16-18" stroke="#6b3e1f" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="135" cy="60" rx="14" ry="8" fill="#fff" opacity=".35"/>
      ${spots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="#5a2a14">${op(`1;1;0;0;1`, `0;${(0.2 + i * 0.2).toFixed(2)};${(0.27 + i * 0.2).toFixed(2)};.92;1`, T)}</circle>`).join('')}
      <g>${at(`100,140;${spots[0].join(',')};${spots[0].join(',')};${spots[1].join(',')};${spots[1].join(',')};${spots[2].join(',')};${spots[2].join(',')};100,140`, '0;.18;.25;.38;.45;.58;.7;1', T)}${BRUSHC}</g>
      ${label(160, 166, 'Spot Healing: paint over → spot is gone ✨', C.ink, 10)}`, { label: 'Spot healing removes blemishes' });
  });

  add('clone', () => {
    const T = 6, k = '0;.2;.28;.4;.8;.92;1';
    return frame(`${photo(40, 18, 240, 144, 'cl')}
      <g opacity="0">${op('0;0;0;1;1;1;0', k, T)}<circle cx="215" cy="42" r="18" fill="#FFD84D"/></g>
      <g>${at('100,140;210,44;210,44;210,44;210,44;210,44;100,140', k, T)}${CROSS}</g>
      <g>${at('100,140;100,140;100,140;215,42;215,42;100,140;100,140', k, T)}<g opacity="0">${op('0;0;0;1;1;0;0', k, T)}${BRUSHC}</g></g>
      ${key(70, 40, 'ALT', '0;.15;.28;1', T)}${ripple(210, 44, '0;.24;.3;1', T)}
      ${label(160, 154, 'Alt+click a source, then paint a copy', '#fff', 10.5)}`, { noBoard: true, label: 'Clone stamp copies pixels' });
  });

  add('ps-type', () => {
    const T = 6, word = 'SUMMER';
    return frame(`${photo(40, 18, 240, 144, 'ty')}
      <text x="160" y="80" text-anchor="middle" font-family="Bebas Neue, Poppins" font-weight="900" font-size="44" fill="#fff">${[...word].map((ch, i) => `<tspan opacity="0">${ch}${op('0;0;1;1;0', `0;${(0.15 + i * 0.07).toFixed(2)};${(0.16 + i * 0.07).toFixed(2)};.9;1`, T)}</tspan>`).join('')}</text>
      ${label(160, 150, 'Type tool (T) makes a new TYPE layer', '#fff', 10)}`, { noBoard: true, label: 'Add text with the Type tool' });
  });

  add('layer-style', () => {
    const T = 6, k = '0;.25;.5;.9;1';
    return frame(`<defs><filter id="lsf" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="6" dy="6" stdDeviation="4" flood-opacity="0">${at('0;0;.6;.6;0', '0;.5;.62;.9;1', T, 'flood-opacity')}</feDropShadow></filter></defs>
      ${photo(40, 18, 240, 144, 'lst')}
      <text x="160" y="104" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="48" fill="${C.y}" stroke="#111" stroke-width="0" paint-order="stroke" filter="url(#lsf)">POP!${at('0;0;6;6;0', k, T, 'stroke-width')}</text>
      <g opacity="0">${op('0;0;1;1;0', '0;.25;.3;.9;1', T)}<rect x="44" y="24" width="60" height="18" rx="9" fill="#111" opacity=".8"/>${label(74, 37, 'Stroke ◯', '#fff', 9.5)}</g>
      <g opacity="0">${op('0;0;1;1;0', '0;.5;.55;.9;1', T)}<rect x="208" y="24" width="68" height="18" rx="9" fill="#111" opacity=".8"/>${label(242, 37, 'Shadow ☁', '#fff', 9.5)}</g>`, { noBoard: true, label: 'Layer styles: stroke and drop shadow' });
  });

  add('crop', () => {
    const T = 6, k = '0;.2;.55;.65;.9;1';
    return frame(`<g>${photo(40, 18, 240, 144, 'cr')}</g>
      <path fill="rgba(0,0,0,.55)" fill-rule="evenodd"><animate attributeName="d" values="M40 18h240v144H40zM40 18h240v144H40z;M40 18h240v144H40zM40 18h240v144H40z;M40 18h240v144H40zM110 30h100v100H110z;M40 18h240v144H40zM110 30h100v100H110z;M40 18h240v144H40zM110 30h100v100H110z;M40 18h240v144H40zM40 18h240v144H40z" keyTimes="${k}" dur="${T}s" repeatCount="indefinite"/></path>
      <rect fill="none" stroke="#fff" stroke-width="2"><animate attributeName="x" values="40;40;110;110;110;40" keyTimes="${k}" dur="${T}s" repeatCount="indefinite"/><animate attributeName="y" values="18;18;30;30;30;18" keyTimes="${k}" dur="${T}s" repeatCount="indefinite"/><animate attributeName="width" values="240;240;100;100;100;240" keyTimes="${k}" dur="${T}s" repeatCount="indefinite"/><animate attributeName="height" values="144;144;100;100;100;144" keyTimes="${k}" dur="${T}s" repeatCount="indefinite"/></rect>
      ${key(270, 166, 'ENTER', '0;.62;.72;1', T)}${label(110, 172, '1:1 square for Instagram', '#fff', 10)}`, { noBoard: true, label: 'Crop cuts away the outside' });
  });

  add('transform', () => {
    const T = 6, k = '0;.2;.45;.55;.8;1';
    return frame(checker + `<rect x="40" y="18" width="240" height="144" fill="url(#chk)"/>
      <g transform="translate(160 90)"><g>${at('1;1;1.5;1.5;1.5;1', k, T, 'transform', 'scale')}<g>${at('0;0;0;0;-20;0', k, T, 'transform', 'rotate', 'additive="sum"')}
        <path d="M-34 8c0-14 10-20 22-20 8 0 12 6 18 6s14-4 22 2c8 6 6 18 6 18H-34z" fill="${C.k}"/><rect x="-36" y="12" width="74" height="8" rx="3" fill="#fff"/>
        <rect x="-38" y="-16" width="78" height="38" fill="none" stroke="#2d9cff" vector-effect="non-scaling-stroke"/>
        ${[[-38, -16], [40, -16], [40, 22], [-38, 22]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#fff" stroke="#2d9cff" vector-effect="non-scaling-stroke"/>`).join('')}
      </g></g></g>
      ${key(270, 166, 'Ctrl+T', '0;.1;.2;1', T)}${label(120, 172, 'Free Transform: resize & rotate', '#fff', 10)}`, { noBoard: true, label: 'Free Transform resizes and rotates' });
  });

  add('history', () => {
    const T = 6, items = ['Open', 'Brush Tool', 'Brush Tool', 'Eraser', 'Hue/Saturation'];
    return frame(`<rect x="90" y="20" width="140" height="${items.length * 24 + 10}" rx="6" fill="#323232"/>
      ${items.map((t, i) => `<text x="112" y="${42 + i * 24}" font-family="Poppins" font-size="11" fill="#ddd">${t}</text>`).join('')}
      <rect x="94" y="${26 + 4 * 24}" width="132" height="22" rx="3" fill="#31A8FF" opacity=".35">${at(`0,0;0,0;0,-48;0,-48;0,0`, '0;.3;.6;.9;1', T)}</rect>
      <g>${at(`260,140;150,${42 + 2 * 24 - 4};150,${42 + 2 * 24 - 4};260,140`, '0;.3;.9;1', T)}${ARROW}</g>
      ${label(160, 170, 'Click an old step = time machine ⏪', '#fff', 10.5)}`, { noBoard: true, label: 'The History panel lets you go back' });
  });

  add('blend', () => frame(`<rect x="60" y="30" width="200" height="110" fill="#fff"/>
      <circle cx="135" cy="85" r="42" fill="${C.y}"/><circle cx="185" cy="85" r="42" fill="#29ABE2" style="mix-blend-mode:multiply"><animate attributeName="opacity" values="1;1;1" dur="5s" repeatCount="indefinite"/></circle>
      ${label(160, 160, 'Blend mode "Multiply" mixes colors like ink', C.ink, 10)}`, { label: 'Blend modes mix layers' }));

  add('ps-poster', () => {
    const T = 8, st = (i) => { const s = 0.08 + i * 0.15; return `0;${s.toFixed(2)};${(s + 0.06).toFixed(2)};.92;1`; };
    return frame(`<g opacity="0">${op('0;0;1;1;0', st(0), T)}${photo(80, 10, 160, 160, 'po')}</g>
      <g opacity="0">${op('0;0;1;1;0', st(1), T)}<path d="M120 130c0-18 14-26 30-26 10 0 16 8 24 8s18-6 28 2c10 8 8 22 8 22H120z" fill="#D7263D"/><rect x="118" y="132" width="94" height="10" rx="4" fill="#fff"/></g>
      <g opacity="0">${op('0;0;1;1;0', st(2), T)}<text x="160" y="58" text-anchor="middle" font-family="Bebas Neue,Poppins" font-weight="900" font-size="40" fill="#fff" stroke="#111" stroke-width="3" paint-order="stroke">SUMMER</text></g>
      <g opacity="0">${op('0;0;1;1;0', st(3), T)}<rect x="196" y="68" width="40" height="40" rx="20" fill="${C.y}"/>${label(216, 92, '-50%', C.ink, 11)}</g>
      <g opacity="0">${op('0;0;1;1;0', st(4), T)}<rect x="80" y="10" width="160" height="160" fill="none" stroke="#fff" stroke-width="3"/></g>`, { noBoard: true, label: 'Building a poster step by step' });
  });
})();
