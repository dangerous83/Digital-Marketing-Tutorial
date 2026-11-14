/* =========================================================================
   DesignQuest — InDesign animated explainer clips (pure SVG + SMIL)
   ========================================================================= */
(function () {
  'use strict';
  const { C, at, op, ripple, frame, label, key, ARROW } = window.DQDemos.helpers;
  const add = (n, f) => window.DQDemos.add(n, f);
  const PINK = '#e8307d';
  const lines = (x, y, w, n, gap = 8, c = '#b9b9c9') => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * gap}" width="${i === n - 1 ? w * 0.6 : w}" height="3.5" rx="1.5" fill="${c}"/>`).join('');
  const page = (x, y, w, h, inner = '') => `<g><rect x="${x + 3}" y="${y + 3}" width="${w}" height="${h}" fill="rgba(0,0,0,.35)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>${inner}</g>`;

  add('id-welcome', () => frame(`<g transform="translate(160 86)">
      ${page(-70, -52, 64, 92, `<rect x="-64" y="-46" width="52" height="30" fill="${C.p}"/>${lines(-64, -10, 52, 5, 7)}`)}
      ${page(6, -52, 64, 92, `${lines(12, -46, 52, 4, 7)}<rect x="12" y="-16" width="52" height="34" fill="${C.o}"/>${lines(12, 24, 52, 2, 7)}`)}
      <path d="M-6-52v92" stroke="#ccc"/>
      <g opacity=".95">${at('0,0;0,-5;0,0', '0;.5;1', 2.6)}<rect x="-90" y="44" width="180" height="14" rx="7" fill="${PINK}"/>${label(0, 54, 'magazines · flyers · books · menus', '#fff', 8.5)}</g></g>`, { noBoard: true, label: 'Welcome to InDesign' }));

  add('id-workspace', () => {
    const T = 8;
    const area = (x, y, w, h, t, i, lx, ly) => {
      const s = i / 5, e = (i + 1) / 5, k = `0;${Math.max(s - 0.001, 0).toFixed(3)};${s.toFixed(3)};${(e - 0.02).toFixed(3)};${e.toFixed(3)};1`;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PINK}" fill-opacity="0" stroke="${PINK}" stroke-width="2.5" stroke-opacity="0">${at('0;0;1;1;0;0', k, T, 'stroke-opacity')}${at('0;0;.25;.25;0;0', k, T, 'fill-opacity')}</rect><g opacity="0">${at('0;0;1;1;0;0', k, T, 'opacity')}<rect x="${lx - 54}" y="${ly - 13}" width="108" height="20" rx="10" fill="${PINK}"/>${label(lx, ly + 1, t, '#fff', 10.5)}</g>`;
    };
    return frame(`<rect x="14" y="12" width="292" height="156" rx="6" fill="#3a3a3a"/><rect x="14" y="12" width="292" height="10" fill="#1f1f1f"/><rect x="14" y="22" width="292" height="12" fill="#323232"/>
      <rect x="14" y="34" width="20" height="134" fill="#323232"/><rect x="240" y="34" width="66" height="134" fill="#323232"/>
      ${page(96, 44, 76, 110, `<rect x="104" y="52" width="60" height="94" fill="none" stroke="#d63bd6" stroke-width=".8"/><rect x="108" y="56" width="52" height="28" fill="${C.t}"/>${lines(108, 90, 52, 6, 8)}`)}
      ${area(14, 12, 292, 10, '1 · Menu Bar', 0, 160, 46)}${area(14, 22, 292, 12, '2 · Control Panel', 1, 160, 60)}${area(14, 34, 20, 134, '3 · Tools', 2, 78, 100)}${area(96, 44, 76, 110, '4 · Your Page', 3, 134, 100)}${area(240, 34, 66, 134, '5 · Pages & Styles', 4, 180, 100)}`, { noBoard: true, label: 'The main areas of InDesign' });
  });

  add('id-guides', () => frame(`${page(110, 16, 100, 142, `<rect x="120" y="26" width="80" height="122" fill="none" stroke="#d63bd6" stroke-width="1.2"><animate attributeName="stroke-opacity" values="1;1;0;0;1" keyTimes="0;.4;.5;.9;1" dur="5s" repeatCount="indefinite"/></rect>
      <path d="M157 26v122M163 26v122" stroke="#8a5cf6" stroke-width="1"><animate attributeName="stroke-opacity" values="1;1;0;0;1" keyTimes="0;.4;.5;.9;1" dur="5s" repeatCount="indefinite"/></path>
      <rect x="106" y="12" width="108" height="150" fill="none" stroke="#ff3b3b" stroke-width=".8"><animate attributeName="stroke-opacity" values="1;1;0;0;1" keyTimes="0;.4;.5;.9;1" dur="5s" repeatCount="indefinite"/></rect>
      <rect x="122" y="30" width="32" height="40" fill="${C.o}"/>${lines(122, 76, 32, 8, 8)}${lines(166, 30, 32, 14, 8)}`)}
      <g>${op('1;1;0;0;1', '0;.4;.5;.9;1', 5)}${label(60, 50, 'Margins', '#d63bd6', 10.5)}${label(60, 70, 'Columns', '#8a5cf6', 10.5)}${label(60, 90, 'Bleed', '#ff3b3b', 10.5)}</g>
      <g opacity="0">${op('0;0;1;1;0', '0;.4;.5;.9;1', 5)}${key(60, 70, 'W', '0;.4;.5;1', 5)}${label(60, 100, 'Preview!', '#fff', 11)}</g>`, { noBoard: true, label: 'Guides: margins, columns and bleed' }));

  add('id-textframe', () => {
    const T = 6, k = '0;.2;.45;.9;1';
    return frame(`<rect x="70" y="30" width="0" height="0" fill="none" stroke="#2d7cff">${at('0;0;180;180;0', k, T, 'width')}${at('0;0;100;100;0', k, T, 'height')}</rect>
      <g opacity="0">${op('0;0;0;1;0', '0;.4;.5;.9;1', T)}${lines(78, 40, 164, 9, 9, '#333')}</g>
      <g>${at('60,20;70,30;250,130;250,130;60,20', k, T)}<path d="M-4-10h8M-4 10h8M0-10v20" stroke="#111" stroke-width="1.6"/></g>
      ${label(160, 160, 'Type tool: drag a frame → type (or fill with placeholder)', C.ink, 9.5)}`, { label: 'Draw a text frame and type' });
  });

  add('id-placeimage', () => {
    const T = 6, k = '0;.3;.4;.9;1';
    return frame(`<rect x="90" y="30" width="140" height="100" fill="none" stroke="#7f9fff"/><path d="M90 30l140 100M230 30L90 130" stroke="#7f9fff">${op('1;1;0;0;1', k, T)}</path>
      <g opacity="0">${op('0;0;1;1;0', k, T)}<clipPath id="pic"><rect x="90" y="30" width="140" height="100"/></clipPath><g clip-path="url(#pic)"><rect x="70" y="20" width="190" height="120" fill="#7EC8F2"/><circle cx="200" cy="55" r="14" fill="#FFD84D"/><path d="M70 120L140 60L190 100L230 75L260 120V140H70Z" fill="#4C8C5A"/></g></g>
      <g>${at('260,150;160,80;160,80;160,80;260,150', k, T)}<rect x="0" y="0" width="22" height="16" fill="#fff" stroke="#111"/><path d="M2 14l6-6 4 4 3-3 5 5" stroke="${C.t}" fill="none"/></g>
      ${ripple(160, 80, '0;.28;.34;1', T)}${label(160, 160, `File › Place (${'Ctrl'}+D) → photo goes INTO the frame`, C.ink, 9.5)}`, { label: 'Place a photo into a frame' });
  });

  add('id-direct', () => {
    const T = 6, k = '0;.25;.65;.9;1';
    return frame(`<clipPath id="dsc"><rect x="100" y="34" width="120" height="90"/></clipPath>
      <g>${at('0,0;0,0;-40,-14;-40,-14;0,0', k, T)}<rect x="80" y="20" width="200" height="130" fill="none" stroke="#c87b00" stroke-dasharray="3 3"/></g>
      <g clip-path="url(#dsc)"><g>${at('0,0;0,0;-40,-14;-40,-14;0,0', k, T)}<rect x="80" y="20" width="200" height="130" fill="#7EC8F2"/><circle cx="230" cy="60" r="16" fill="#FFD84D"/><path d="M80 130L160 60L210 110L250 80L280 130V150H80Z" fill="#4C8C5A"/></g></g>
      <rect x="100" y="34" width="120" height="90" fill="none" stroke="#2d7cff" stroke-width="1.5"/>
      <g>${at('170,90;170,90;130,76;130,76;170,90', k, T)}<circle r="8" fill="none" stroke="#fff" stroke-width="2"/><circle r="3.5" fill="none" stroke="#fff" stroke-width="2"/></g>
      ${label(160, 162, 'Direct Selection (A) moves the photo INSIDE the frame', C.ink, 9.5)}`, { label: 'Move content inside a frame' });
  });

  add('id-styles', () => {
    const T = 6, k = '0;.35;.45;.9;1';
    return frame(`${page(70, 18, 180, 140, `<rect x="84" y="30" width="120" height="12" rx="2" fill="${C.ink}">${at(`${C.ink};${C.ink};${PINK};${PINK};${C.ink}`, k, T, 'fill')}</rect>${lines(84, 50, 150, 3, 8)}
      <rect x="84" y="80" width="100" height="12" rx="2" fill="${C.ink}">${at(`${C.ink};${C.ink};${PINK};${PINK};${C.ink}`, k, T, 'fill')}</rect>${lines(84, 100, 150, 3, 8)}
      <rect x="84" y="128" width="110" height="12" rx="2" fill="${C.ink}">${at(`${C.ink};${C.ink};${PINK};${PINK};${C.ink}`, k, T, 'fill')}</rect>`)}
      <g transform="translate(262 40)"><rect width="52" height="46" rx="4" fill="#323232"/>${label(26, 14, '¶ Styles', '#ddd', 7.5)}<rect x="4" y="20" width="44" height="10" rx="2" fill="#4a2a3a"/>${label(26, 28, 'Heading', '#fff', 7)}</g>
      ${label(160, 172, 'Change the style once → every heading updates!', '#fff', 10)}`, { noBoard: true, label: 'Paragraph styles update everywhere' });
  });

  add('id-thread', () => {
    const T = 6, k = '0;.3;.5;.9;1';
    return frame(`<rect x="40" y="30" width="110" height="110" fill="none" stroke="#2d7cff"/>${lines(48, 38, 94, 12, 8, '#333')}
      <rect x="140" y="135" width="10" height="10" fill="#fff" stroke="#e00"/><path d="M142 140h6M145 137v6" stroke="#e00">${op('1;1;0;0;1', k, T)}</path>
      <rect x="180" y="30" width="110" height="110" fill="none" stroke="#2d7cff"/>
      <g opacity="0">${op('0;0;1;1;0', k, T)}${lines(188, 38, 94, 6, 8, '#333')}<path d="M150 140C170 140 165 30 186 30" stroke="#2d7cff" fill="none" stroke-dasharray="3 3"/></g>
      <g>${at('100,150;145,140;145,140;235,80;100,150', '0;.2;.28;.45;1', T)}${ARROW}</g>${ripple(145, 140, '0;.22;.3;1', T)}
      ${label(160, 166, 'Red + = OVERSET text → click it, then click the next frame', '#fff', 9.5)}`, { noBoard: true, bg: '#3a3a3a', label: 'Threading text between frames' });
  });

  add('id-wrap', () => {
    const T = 6, k = '0;.3;.4;.9;1';
    const before = lines(70, 30, 180, 14, 9, '#333');
    const after = Array.from({ length: 14 }, (_, i) => { const y = 30 + i * 9; const inObs = y > 52 && y < 112; return inObs ? `<rect x="70" y="${y}" width="70" height="3.5" rx="1.5" fill="#333"/><rect x="214" y="${y}" width="36" height="3.5" rx="1.5" fill="#333"/>` : `<rect x="70" y="${y}" width="180" height="3.5" rx="1.5" fill="#333"/>`; }).join('');
    return frame(`${page(60, 20, 200, 140, `<g>${op('1;1;0;0;1', k, T)}${before}</g><g opacity="0">${op('0;0;1;1;0', k, T)}${after}</g><rect x="150" y="56" width="56" height="52" fill="${C.o}"/>`)}
      ${label(160, 174, 'Text Wrap: the text flows AROUND the picture', '#fff', 10)}`, { noBoard: true, label: 'Text wrap' });
  });

  add('id-master', () => {
    const T = 6, k = '0;.3;.45;.9;1';
    return frame(`<g transform="translate(20 30)">${page(0, 0, 70, 96, `<rect x="6" y="84" width="58" height="1" fill="${PINK}"/>${label(35, 93, 'A', PINK, 7)}`)}${label(35, 112, 'A-Master', '#fff', 9)}</g>
      ${[0, 1, 2].map((i) => `<g transform="translate(${120 + i * 64} 30)">${page(0, 0, 54, 76, `${lines(6, 8, 42, 6, 8)}<g opacity="0">${op('0;0;1;1;0', k, T)}<rect x="5" y="66" width="44" height="1" fill="${PINK}"/>${label(27, 74, String(i + 1), PINK, 7)}</g>`)}</g>`).join('')}
      <path d="M95 70h20" stroke="#fff" stroke-width="2"/>${label(212, 130, 'Page numbers appear on EVERY page automatically', '#fff', 9.5)}`, { noBoard: true, label: 'Master pages and page numbers' });
  });

  add('id-pdf', () => frame(`${page(60, 30, 80, 110, `<rect x="66" y="36" width="68" height="40" fill="${C.p}"/>${lines(66, 84, 68, 5, 8)}`)}
      <path d="M150 85h40" stroke="#fff" stroke-width="3"/><path d="M186 78l10 7-10 7z" fill="#fff"/>
      <g transform="translate(206 40)"><path d="M0 0h44l14 14v76H0z" fill="#fff"/><path d="M44 0v14h14" fill="#ddd"/><rect x="-6" y="44" width="52" height="20" rx="4" fill="#d81e1e"/>${label(20, 58, 'PDF', '#fff', 12)}</g>
      ${label(160, 166, 'File › Export › Adobe PDF — ready to print or share', '#fff', 10)}`, { noBoard: true, label: 'Export a PDF' }));

  add('id-flyer', () => {
    const T = 8, st = (i) => { const s = 0.08 + i * 0.15; return `0;${s.toFixed(2)};${(s + 0.06).toFixed(2)};.92;1`; };
    return frame(`${page(100, 10, 120, 160, `<g opacity="0">${op('0;0;1;1;0', st(0), T)}<rect x="100" y="10" width="120" height="70" fill="#7EC8F2"/><circle cx="190" cy="34" r="10" fill="#FFD84D"/><path d="M100 72L140 42L170 64L200 48L220 70V80H100Z" fill="#4C8C5A"/></g>
      <g opacity="0">${op('0;0;1;1;0', st(1), T)}<text x="110" y="100" font-family="Bebas Neue,Poppins" font-weight="900" font-size="20" fill="${PINK}">SUMMER FEST</text></g>
      <g opacity="0">${op('0;0;1;1;0', st(2), T)}${lines(110, 110, 46, 6, 7)}${lines(164, 110, 46, 6, 7)}</g>
      <g opacity="0">${op('0;0;1;1;0', st(3), T)}<rect x="100" y="156" width="120" height="14" fill="${C.ink}"/>${label(160, 166, 'SAT · 7 PM · FREE', '#fff', 7.5)}</g>`)}`, { noBoard: true, label: 'Building a flyer' });
  });
})();
