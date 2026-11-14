/* =========================================================================
   DesignQuest — Adobe Illustrator course content
   Every step can have:
     title, body (HTML), demo (animated clip), hl (things to spotlight),
     task {text, hint, check(ed)}  -> checked live while the student works
     quiz {q, options, answer, explain}
     setup(ed)  -> prepares the practice workspace
     ghost []   -> "Show me" animated cursor script
   ========================================================================= */
(function () {
  'use strict';
  const isGrad = (p) => p && typeof p === 'object';
  const plain = (p) => !p || p === 'none' || (typeof p === 'string' && /^#?f{6}$/i.test(p.replace('#', '')));
  const colored = (p) => isGrad(p) || (!plain(p) && p !== '#000000');
  const has = (ed, kind, f) => ed.objs.some((o) => o.kind === kind && !o.hidden && (!f || f(o)));
  const count = (ed, kind, f) => ed.objs.filter((o) => o.kind === kind && !o.hidden && (!f || f(o))).length;
  const did = (ed, n, f) => ed.did(n, f);
  const K = window.AIEditor ? window.AIEditor.CMD : 'Ctrl+';

  /* ---- reusable artwork --------------------------------------------- */
  const starterShapes = [
    { kind: 'star', x: 120, y: 170, w: 200, h: 190, pts: 5, inner: 0.45, fill: '#FFFFFF', stroke: '#000000', sw: 2, name: 'Star' },
    { kind: 'ellipse', x: 380, y: 180, w: 170, h: 170, fill: '#FFFFFF', stroke: '#000000', sw: 2, name: 'Circle' },
    { kind: 'rect', x: 600, y: 190, w: 120, h: 150, fill: '#FFFFFF', stroke: '#000000', sw: 2, name: 'Rectangle' },
  ];
  const sceneShapes = [
    { kind: 'rect', x: 0, y: 380, w: 800, h: 220, fill: '#8CC63F', stroke: 'none', sw: 0, name: 'Hill' },
    { kind: 'ellipse', x: 470, y: 90, w: 170, h: 170, fill: '#FBB03B', stroke: 'none', sw: 0, name: 'Sun' },
    { kind: 'ellipse', x: 400, y: 170, w: 260, h: 120, fill: '#FFFFFF', stroke: '#B3B3B3', sw: 2, name: 'Cloud' },
  ];
  const cloudParts = [
    { kind: 'ellipse', x: 230, y: 230, w: 160, h: 160, fill: '#29ABE2', stroke: 'none', sw: 0 },
    { kind: 'ellipse', x: 330, y: 170, w: 200, h: 200, fill: '#29ABE2', stroke: 'none', sw: 0 },
    { kind: 'ellipse', x: 470, y: 250, w: 140, h: 140, fill: '#29ABE2', stroke: 'none', sw: 0 },
    { kind: 'rect', x: 300, y: 300, w: 260, h: 90, r: 0, fill: '#29ABE2', stroke: 'none', sw: 0 },
  ];
  const twoCircles = (c1, c2, dx = 110) => [
    { kind: 'ellipse', x: 400 - 110 - dx / 2, y: 190, w: 220, h: 220, fill: c1, stroke: 'none', sw: 0 },
    { kind: 'ellipse', x: 400 - 110 + dx / 2, y: 190, w: 220, h: 220, fill: c2, stroke: 'none', sw: 0 },
  ];

  const LESSONS = [
    /* =================================================================== 1 */
    {
      id: 'ai-01', title: 'Meet Illustrator', sub: 'Tour the workspace & learn what "vector" means', img: 'assets/img/lesson-interface.webp',
      mins: 8, color: '#FF7A59', badge: { icon: '🧭', name: 'Explorer' },
      setup: (ed) => ed.reset({ objs: starterShapes.map((o, i) => ({ ...o, fill: ['#FFC93C', '#FF5FA2', '#19C3B1'][i], stroke: 'none' })) }),
      steps: [
        {
          title: 'Welcome, designer! 👋', demo: 'welcome',
          body: `<p><b>Adobe Illustrator</b> is the app designers use to make <b>logos, icons, stickers, posters and cartoons</b>.</p>
                 <p>On the right is a <b>practice workspace</b>. It looks and works like the real Illustrator. You can click anything — <b>nothing can break!</b> 💪</p>
                 <p class="tip">💡 Each step has a <b>Mission</b>. Do it in the workspace and the coach checks it for you automatically.</p>`,
        },
        {
          title: 'Vector vs. Pixels', demo: 'vector-raster',
          body: `<p>Photos are made of tiny squares called <b>pixels</b>. Zoom in and they get blocky. 😕</p>
                 <p>Illustrator makes <b>vector</b> art. Vectors are made of math lines, so they stay <b>super sharp at any size</b> — from a tiny phone icon to a giant billboard!</p>`,
          quiz: {
            q: 'You need a logo that looks sharp on a phone AND on a huge billboard. What should you make?',
            options: ['A vector logo in Illustrator', 'A small photo', 'A screenshot'],
            answer: 0, explain: 'Yes! Vector art can grow to any size and never gets blurry.',
          },
        },
        {
          title: 'The 5 main areas', demo: 'workspace', hl: ['menu-window'],
          body: `<ol class="areas"><li><b>Menu Bar</b> — File, Edit, Object… all commands live here.</li>
                 <li><b>Control Bar</b> — quick settings for what you selected.</li>
                 <li><b>Toolbar</b> — your drawing tools (left side).</li>
                 <li><b>Artboard</b> — the white page. This is what you print or export.</li>
                 <li><b>Panels</b> — Properties, Layers, Swatches (right side).</li></ol>`,
          task: { text: 'Click the <b>Window</b> menu at the top of the workspace to open it.', hint: 'Look at the very top bar: File · Edit · Object · Type · Select · Effect · View · <b>Window</b>', check: (ed) => did(ed, 'menuOpen', (e) => e.menu === 'Window') },
          ghost: [{ el: 'menu-window' }, { click: 1 }],
        },
        {
          title: 'The Toolbar', hl: ['toolbar', 'tool-pen'], demo: 'flyout',
          body: `<p>The <b>Toolbar</b> holds your tools. Hover a tool to see its <b>name</b> and its <b>shortcut letter</b>.</p>
                 <p>Pros press letters instead of clicking: <kbd>V</kbd> = Selection, <kbd>P</kbd> = Pen, <kbd>M</kbd> = Rectangle, <kbd>T</kbd> = Type.</p>
                 <p class="tip">💡 A tiny triangle in the corner of a tool means <b>more tools are hidden</b> inside!</p>`,
          task: { text: 'Choose the <b>Pen Tool</b> — click it, or press <kbd>P</kbd> on your keyboard.', hint: 'It looks like the tip of a fountain pen. It is the 3rd tool from the top.', check: (ed) => did(ed, 'tool', (e) => e.tool === 'pen') },
          ghost: [{ el: 'tool-pen' }, { click: 1 }],
        },
        {
          title: 'Panels: Properties & Layers', hl: ['tab-layers'],
          body: `<p>The <b>Properties</b> panel changes depending on what you select — size, color, align and more.</p>
                 <p>The <b>Layers</b> panel lists every object on your artboard, like a stack of cards.</p>`,
          task: { text: 'Open the <b>Layers</b> panel by clicking its tab on the right.', hint: 'Top right corner: <b>Properties | Layers</b>', check: (ed) => did(ed, 'panel', (e) => e.tab === 'layers') },
          ghost: [{ el: 'tab-layers' }, { click: 1 }],
        },
        {
          title: 'Zoom in & out', demo: 'zoom', hl: ['tool-zoom'],
          body: `<p>Zooming makes things look bigger on the screen. It does <b>not</b> change the real size of your art.</p>
                 <ul><li><b>Zoom Tool</b> <kbd>Z</kbd> — click to zoom in, <kbd>Alt</kbd>+click to zoom out.</li>
                 <li><kbd>${K}0</kbd> — fit the whole artboard in the window.</li>
                 <li>Hold <kbd>Space</kbd> and drag to move around (Hand tool).</li></ul>`,
          task: { text: 'Zoom <b>in</b> with the Zoom tool, then press <kbd>' + K + '0</kbd> (or View › Fit Artboard in Window) to fit it again.', hint: 'Press Z, click the star. Then use View menu › Fit Artboard in Window.', check: (ed) => did(ed, 'zoom', (e) => e.dir === 'in') && did(ed, 'zoom', (e) => e.fit) },
          ghost: [{ el: 'tool-zoom' }, { click: 1 }, { doc: [220, 260] }, { click: 1 }, { el: 'menu-view' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          body: '<p>Let\'s see what you remember!</p>',
          quiz: { q: 'Where do you find tools like the Pen and the Rectangle?', options: ['In the Toolbar on the left', 'In the File menu', 'On the Artboard'], answer: 0, explain: 'Correct! The Toolbar on the left holds all the drawing tools.' },
        },
      ],
    },

    /* =================================================================== 2 */
    {
      id: 'ai-02', title: 'Shapes & Selection', sub: 'Draw, move, resize and rotate shapes', img: 'assets/img/lesson-shapes.webp',
      mins: 12, color: '#7C5CFF', badge: { icon: '🔷', name: 'Shape Master' },
      setup: (ed) => ed.reset({ def: { fill: '#FFC93C', stroke: '#1D1B2E', sw: 2 } }),
      steps: [
        {
          title: 'Draw a rectangle', demo: 'draw-rect', hl: ['[data-group="5"]'],
          body: `<p>Every design starts with simple shapes. 🟧</p><p>Pick the <b>Rectangle Tool</b> <kbd>M</kbd>, then <b>press and drag</b> diagonally on the white artboard.</p>`,
          task: { text: 'Choose the <b>Rectangle Tool</b> and drag on the artboard to draw a rectangle.', hint: 'Press <kbd>M</kbd>, then press the mouse button, move it, and let go.', check: (ed) => did(ed, 'create', (e) => e.kind === 'rect') },
          ghost: [{ el: '[data-group="5"]' }, { click: 1 }, { drag: [[150, 150], [380, 320]] }],
        },
        {
          title: 'A perfect square', demo: 'shift-square',
          body: `<p>Hold the <kbd>Shift</kbd> key <b>while you drag</b>. Width and height stay the same — a <b>perfect square</b>!</p><p class="tip">💡 Let go of the mouse first, then let go of Shift.</p>`,
          task: { text: 'Draw a <b>perfect square</b> (hold <kbd>Shift</kbd> while dragging).', hint: 'Keep Shift pressed down the whole time you drag.', check: (ed) => has(ed, 'rect', (o) => Math.abs(o.w - o.h) < 1 && o.w > 20) },
          ghost: [{ drag: [[450, 150], [620, 320]], key: 'Shift' }],
        },
        {
          title: 'Find the hidden tools', demo: 'flyout', hl: ['[data-group="5"]'],
          body: `<p>See the tiny triangle on the Rectangle tool? There are <b>more tools hiding inside</b>: Ellipse, Polygon and Star.</p><p><b>Press and hold</b> the mouse on the tool (or right-click it) to open the menu.</p>`,
          task: { text: 'Hold the Rectangle tool to open the hidden menu, pick the <b>Star Tool</b> and draw a star ⭐', hint: 'Press the mouse button on the rectangle icon and keep holding for 1 second.', check: (ed) => has(ed, 'star') },
          ghost: [{ el: '[data-group="5"]' }, { hold: 1 }, { el: 'fly-star', wait: 1 }, { click: 1 }, { drag: [[200, 380], [330, 520]] }],
        },
        {
          title: 'A perfect circle', hl: ['[data-group="5"]'],
          body: `<p>The <b>Ellipse Tool</b> <kbd>L</kbd> draws ovals. Add <kbd>Shift</kbd> for a perfect circle. 🔵</p><p class="tip">💡 Hold <kbd>Alt</kbd> to draw from the center out!</p>`,
          task: { text: 'Use the <b>Ellipse Tool</b> <kbd>L</kbd> to draw a <b>perfect circle</b>.', hint: 'Press L, then hold Shift while you drag.', check: (ed) => has(ed, 'ellipse', (o) => Math.abs(o.w - o.h) < 1 && o.w > 20) },
          ghost: [{ el: '[data-group="5"]' }, { click: 1 }, { drag: [[450, 380], [580, 510]], key: 'Shift' }],
        },
        {
          title: 'Select & move', demo: 'select-move', hl: ['tool-select'],
          body: `<p>The black arrow is the <b>Selection Tool</b> <kbd>V</kbd>. It is the tool you will use the most!</p>
                 <ul><li><b>Click</b> a shape to select it (a blue box appears).</li><li><b>Drag</b> it to move it.</li><li><kbd>Shift</kbd>+click to select more than one.</li></ul>
                 <p class="tip">💡 Pink <b>Smart Guides</b> appear when your shape lines up with the center or other shapes.</p>`,
          task: { text: 'Pick the <b>Selection Tool</b> <kbd>V</kbd>, then click a shape and <b>drag</b> it somewhere new.', hint: 'Press V. Press on the shape\'s color and drag.', check: (ed) => did(ed, 'move', (e) => !e.nudge) },
          ghost: [{ el: 'tool-select' }, { click: 1 }, { drag: [[260, 230], [330, 260]] }],
        },
        {
          title: 'Resize with handles', demo: 'scale',
          body: `<p>A selected shape has <b>8 little white squares</b> called <b>handles</b>. Drag one to resize.</p><p>Hold <kbd>Shift</kbd> while dragging a corner to keep the shape's proportions.</p>`,
          task: { text: 'Select a shape and drag a <b>corner handle</b> to make it bigger.', hint: 'Click a shape first. Then grab one of the white squares at a corner.', check: (ed) => did(ed, 'scale') },
        },
        {
          title: 'Rotate', demo: 'rotate',
          body: `<p>Move your mouse <b>just outside</b> a corner handle. The cursor turns into a <b>curved arrow</b> ↻. Now drag to rotate!</p><p class="tip">💡 Hold <kbd>Shift</kbd> to rotate in perfect 45° steps. You can also use the <b>Rotate Tool</b> <kbd>R</kbd>.</p>`,
          task: { text: '<b>Rotate</b> any shape.', hint: 'Select a shape. Hover slightly outside a corner until you see ↻, then drag around.', check: (ed) => did(ed, 'rotate') },
        },
        {
          title: 'Oops! Delete & Undo', demo: 'undo',
          body: `<p>Made a mistake? No problem!</p><ul><li><kbd>Delete</kbd> or <kbd>Backspace</kbd> removes the selected shape.</li><li><kbd>${K}Z</kbd> = <b>Undo</b> (go back one step).</li><li><kbd>${window.AIEditor ? window.AIEditor.SHIFT : 'Shift+'}${K}Z</kbd> = Redo.</li></ul><p>Undo is a designer's best friend. 😄</p>`,
          task: { text: 'Select a shape and press <kbd>Delete</kbd>. Then press <kbd>' + K + 'Z</kbd> to bring it back!', hint: 'Or use the Edit menu › Undo.', check: (ed) => did(ed, 'delete') && did(ed, 'undo') },
        },
        {
          title: 'Rounded corners', demo: 'corners', hl: ['prop-shape'],
          body: `<p>Select a rectangle and look at <b>Properties › Rectangle Properties</b>. Change the <b>Corner</b> number (or drag its slider) to round the corners — great for buttons and app icons!</p>`,
          task: { text: 'Give a rectangle <b>rounded corners</b>.', hint: 'Select a rectangle with the black arrow, then look in the Properties panel on the right.', check: (ed) => has(ed, 'rect', (o) => (o.r || 0) > 0) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which key do you hold to draw a PERFECT circle?', options: ['Ctrl', 'Shift', 'Space'], answer: 1, explain: 'Yes! Shift keeps width and height equal.' },
        },
      ],
    },

    /* =================================================================== 3 */
    {
      id: 'ai-03', title: 'Color: Fill & Stroke', sub: 'Swatches, outlines, gradients & the eyedropper', img: 'assets/img/lesson-color.webp',
      mins: 10, color: '#FFC93C', badge: { icon: '🎨', name: 'Color Wizard' },
      setup: (ed) => ed.reset({ objs: starterShapes }),
      steps: [
        {
          title: 'Fill vs. Stroke', demo: 'fill-stroke', hl: ['fillstroke'],
          body: `<p>Every shape has two colors:</p><ul><li>🟨 <b>Fill</b> — the color <b>inside</b>.</li><li>🟪 <b>Stroke</b> — the <b>outline</b>.</li></ul>
                 <p>At the bottom of the toolbar are two squares. The one <b>in front</b> is the one you are changing. Press <kbd>X</kbd> to switch.</p>`,
          task: { text: 'Click the <b>Stroke</b> square (the hollow one) to bring it to the front.', hint: 'Bottom of the toolbar: the square with a thick border is the Stroke.', check: (ed) => did(ed, 'slot', (e) => e.slot === 'stroke') },
          ghost: [{ el: 'stroke-box' }, { click: 1 }],
        },
        {
          title: 'Paint the fill', hl: ['tab-swatches'],
          body: `<p>Select a shape, make sure <b>Fill</b> is in front, then click a color in the <b>Swatches</b> panel.</p><p class="tip">💡 You can also click the Fill square in the Properties panel for a quick color menu.</p>`,
          task: { text: 'Select the <b>star</b> and give it a bright <b>fill</b> color.', hint: 'Press V, click the star, choose "Fill" in the Swatches panel, then click a color.', check: (ed) => has(ed, 'star', (o) => colored(o.fill)) },
          ghost: [{ el: 'tool-select' }, { click: 1 }, { doc: [220, 300] }, { click: 1 }, { el: 'tab-swatches' }],
        },
        {
          title: 'Style the stroke', hl: ['prop-sw'],
          body: `<p>Now the outline! Switch to <b>Stroke</b>, pick a color, then make it <b>thicker</b> with the Stroke weight box (in Properties or the Control Bar).</p>`,
          task: { text: 'Give any shape a colored stroke that is <b>6 pt or thicker</b>.', hint: 'Select a shape → Appearance → type 8 in the Stroke box → press Enter.', check: (ed) => ed.objs.some((o) => o.sw >= 6 && o.stroke !== 'none') },
        },
        {
          title: 'No color at all', hl: ['fillstroke'],
          body: `<p>The white swatch with a <b style="color:#ff4b4b">red line</b> means <b>None</b> — no color.</p><p>Use it to remove a stroke or make a shape with only an outline. Shortcut: <kbd>/</kbd></p>`,
          task: { text: 'Select the <b>circle</b> and set its <b>stroke to None</b>.', hint: 'Select the circle, bring Stroke to front, click the None swatch (first one).', check: (ed) => has(ed, 'ellipse', (o) => o.stroke === 'none') },
        },
        {
          title: 'Gradients', demo: 'gradient', hl: ['tab-swatches'],
          body: `<p>A <b>gradient</b> blends colors smoothly — sunsets, shiny buttons, cool backgrounds. 🌅</p><p>Pick a gradient swatch, then adjust the <b>Angle</b> and <b>Colors</b> in Properties.</p>`,
          task: { text: 'Give the <b>rectangle</b> a gradient fill, then change its <b>Angle</b>.', hint: 'Select the rectangle → Fill in front → click a gradient swatch → move the Angle slider.', check: (ed) => has(ed, 'rect', (o) => isGrad(o.fill)) && did(ed, 'gradient') },
        },
        {
          title: 'The Eyedropper', demo: 'eyedropper', hl: ['tool-eyedropper'],
          body: `<p>The <b>Eyedropper</b> <kbd>I</kbd> copies colors from one shape to another.</p><ol><li>Select the shape you want to change.</li><li>Choose the Eyedropper.</li><li>Click the shape that has the colors you like.</li></ol>`,
          task: { text: 'Copy colors with the <b>Eyedropper</b> onto another shape.', hint: 'Select the circle (V), press I, then click the star.', check: (ed) => did(ed, 'eyedropper', (e) => e.count > 0) },
        },
        {
          title: 'Handy color keys',
          body: `<ul><li><kbd>X</kbd> — switch between Fill and Stroke.</li><li><kbd>Shift</kbd>+<kbd>X</kbd> — swap the two colors.</li><li><kbd>D</kbd> — <b>D</b>efault colors (white fill, black stroke).</li><li><kbd>/</kbd> — None.</li></ul>`,
          task: { text: 'Press <kbd>D</kbd> to reset to the <b>default</b> colors.', hint: 'Click on the workspace first, then press the D key.', check: (ed) => did(ed, 'defaultColors') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'The OUTLINE of a shape is called the…', options: ['Fill', 'Gradient', 'Stroke'], answer: 2, explain: 'Right! Fill = inside, Stroke = outline.' },
        },
      ],
    },

    /* =================================================================== 4 */
    {
      id: 'ai-04', title: 'The Pen Tool', sub: 'The famous tool of every pro — made easy', img: 'assets/img/lesson-pen.webp',
      mins: 15, color: '#19C3B1', badge: { icon: '🖋️', name: 'Pen Ninja' },
      setup: (ed) => ed.reset({ def: { fill: 'none', stroke: '#1D1B2E', sw: 3 } }),
      steps: [
        {
          title: 'Anchor points & paths', demo: 'pen-straight', hl: ['tool-pen'],
          body: `<p>Everything in Illustrator is made of <b>anchor points</b> (little squares) connected by <b>paths</b> (lines).</p><p>The <b>Pen Tool</b> <kbd>P</kbd> lets you place anchor points one by one. It feels tricky at first — but you'll master it in 10 minutes! 🥷</p>`,
          task: { text: 'Choose the <b>Pen Tool</b> <kbd>P</kbd>.', hint: 'Third tool from the top, or press P.', check: (ed) => ed.tool === 'pen' },
          ghost: [{ el: 'tool-pen' }, { click: 1 }],
        },
        {
          title: 'Straight lines: a triangle',
          setup: (ed) => { ed.setTemplate({ paths: ['M250 420L400 170L550 420Z'], dots: [[250, 420], [400, 170], [550, 420]], label: ['Click 1 → 2 → 3 → 1', 400, 470] }); },
          body: `<p><b>Click</b> (don't drag!) to place points. Illustrator connects them with straight lines.</p><p>To <b>close</b> the shape, move back to the first point — a small <b>circle ○</b> appears next to the pen — and click.</p>`,
          task: { text: 'Click the blue dots <b>1 → 2 → 3</b>, then click <b>dot 1</b> again to close the triangle.', hint: 'Just click — do not drag. When you hover dot 1 at the end, the pen shows a little circle.', check: (ed) => did(ed, 'penDone', (e) => e.closed && e.n >= 3) },
          ghost: [{ el: 'tool-pen' }, { click: 1 }, { doc: [250, 420] }, { click: 1 }, { doc: [400, 170] }, { click: 1 }, { doc: [550, 420] }, { click: 1 }, { doc: [250, 420] }, { click: 1 }],
        },
        {
          title: 'Open paths: a zig-zag',
          setup: (ed) => { ed.reset({ def: { fill: 'none', stroke: '#7C5CFF', sw: 6 }, tool: 'pen', template: { paths: ['M150 350L275 220L400 350L525 220L650 350'], dots: [[150, 350], [275, 220], [400, 350], [525, 220], [650, 350]], label: ['Click all 5 dots, then press Enter', 400, 430] } }); },
          body: `<p>Not every path must be closed. Lines, zig-zags and squiggles are <b>open paths</b>.</p><p>When you are done, press <kbd>Enter</kbd> or <kbd>Esc</kbd> to stop drawing.</p><p class="tip">💡 Hold <kbd>Shift</kbd> to make perfectly straight or 45° lines.</p>`,
          task: { text: 'Click all <b>5 dots</b>, then press <kbd>Enter</kbd> to finish the zig-zag.', hint: 'Click 1, 2, 3, 4, 5 — then press Enter on your keyboard.', check: (ed) => did(ed, 'penDone', (e) => !e.closed && e.n >= 4) },
        },
        {
          title: 'Curves: click + drag', demo: 'pen-curve',
          setup: (ed) => { ed.reset({ def: { fill: 'none', stroke: '#FF7A59', sw: 6 }, tool: 'pen', template: { paths: ['M220 380C220 180 580 180 580 380', 'M220 360V250M208 264L220 250L232 264', 'M580 400V510M568 496L580 510L592 496'], dots: [[220, 380], [580, 380]], label: ['Dot 1: drag UP ↑   ·   Dot 2: drag DOWN ↓', 400, 450] } }); },
          body: `<p>To make a curve, <b>press and drag</b> instead of clicking. Two blue <b>handles</b> come out of the point — they bend the line like a magnet. 🧲</p><p>Longer handles = bigger curve. The direction you drag = the direction the line goes.</p>`,
          task: { text: 'On dot 1 press and drag <b>UP</b>. On dot 2 press and drag <b>DOWN</b>. Then press <kbd>Enter</kbd>.', hint: 'Do not just click — keep the mouse button down and pull. Watch the curve change while you drag!', check: (ed) => did(ed, 'penCurve') && did(ed, 'penDone') },
          ghost: [{ doc: [220, 380] }, { drag: [[220, 380], [220, 200]] }, { drag: [[580, 380], [580, 560]] }],
        },
        {
          title: 'Edit points: Direct Selection', demo: 'direct', hl: ['tool-direct'],
          setup: (ed) => { ed.reset({ objs: [{ kind: 'star', x: 290, y: 160, w: 220, h: 210, pts: 5, inner: 0.45, fill: '#19C3B1', stroke: '#1D1B2E', sw: 2 }] }); },
          body: `<p>The <b>white arrow</b> is the <b>Direct Selection Tool</b> <kbd>A</kbd>. It selects <b>single anchor points</b> instead of the whole shape.</p><p>Drag one point to <b>reshape</b> anything. Selected points turn solid blue.</p>`,
          task: { text: 'Choose the <b>Direct Selection Tool</b> <kbd>A</kbd>, click one point of the star and drag it.', hint: 'Click the star\'s edge with the white arrow to see its points. Then drag one tiny square.', check: (ed) => did(ed, 'anchorMove') },
          ghost: [{ el: 'tool-direct' }, { click: 1 }, { doc: [400, 160] }, { drag: [[400, 162], [400, 80]] }],
        },
        {
          title: 'Boss challenge: a heart ❤️',
          setup: (ed) => { ed.reset({ def: { fill: '#FF5FA2', stroke: '#1D1B2E', sw: 3 }, tool: 'pen', template: { paths: ['M400 480C330 430 250 370 250 290C250 230 300 200 345 210C375 216 395 240 400 262C405 240 425 216 455 210C500 200 550 230 550 290C550 370 470 430 400 480Z'], dots: [[400, 480], [250, 290], [400, 262], [550, 290]], label: ['1 click · 2 drag up · 3 click · 4 drag down · back to 1', 400, 540] } }); },
          body: `<p>Time to combine everything! Trace the heart:</p><ol><li>Dot 1 (bottom): <b>click</b>.</li><li>Dot 2 (left): press & <b>drag up</b>.</li><li>Dot 3 (middle top): <b>click</b>.</li><li>Dot 4 (right): press & <b>drag down</b>.</li><li>Click dot 1 to <b>close</b>.</li></ol><p class="tip">💡 Don't worry if it's not perfect — use <kbd>A</kbd> to fix points after!</p>`,
          task: { text: 'Draw a <b>closed shape with at least one curve</b> by tracing the heart.', hint: 'Mixing clicks (corners) and drags (curves) is the key. If it goes wrong, press Esc and start again.', check: (ed) => did(ed, 'penDone', (e) => e.closed && e.curves && e.n >= 3) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'With the Pen Tool, CLICK + DRAG makes…', options: ['A straight line', 'A smooth curve', 'A rectangle'], answer: 1, explain: 'Exactly! Click = corner, click + drag = curve.' },
        },
      ],
    },

    /* =================================================================== 5 */
    {
      id: 'ai-05', title: 'Typography', sub: 'Write text, pick fonts and center it', img: 'assets/img/lesson-type.webp',
      mins: 8, color: '#FF5FA2', badge: { icon: '🔤', name: 'Type Hero' },
      setup: (ed) => ed.reset({ objs: [{ kind: 'rect', x: 0, y: 0, w: 800, h: 600, fill: { g: 'lin', a: 90, s: ['#FFE5B4', '#FFD6E0'] }, stroke: 'none', sw: 0, name: 'Background', locked: true }] }),
      steps: [
        {
          title: 'The Type Tool', demo: 'type', hl: ['tool-type'],
          body: `<p>The <b>Type Tool</b> <kbd>T</kbd> lets you write words on your design. ✍️</p><p>Click on the artboard and start typing. Press <kbd>Esc</kbd> when you are done.</p>`,
          task: { text: 'Choose the <b>Type Tool</b>, click on the artboard and type <b>your name</b>.', hint: 'Press T, click in the middle of the artboard, type, then press Esc.', check: (ed) => did(ed, 'type') },
          ghost: [{ el: 'tool-type' }, { click: 1 }, { doc: [260, 300] }, { click: 1 }],
        },
        {
          title: 'Choose a font', demo: 'fonts', hl: ['prop-character'],
          body: `<p>A <b>font</b> gives your words a personality: fun, elegant, strong, cute…</p><p>Select your text with the <b>Selection Tool</b> <kbd>V</kbd> and choose a new font in <b>Properties › Character</b>.</p>`,
          task: { text: 'Select your text and choose a <b>different font</b>.', hint: 'Press V, click your text, then open the font list in the Properties panel.', check: (ed) => has(ed, 'text', (o) => o.font !== 'Myriad Pro') },
        },
        {
          title: 'Size & color',
          body: `<p>Make it big and bold! Change the size (the <b>T</b> box, in points) and the fill color with the Swatches panel.</p><p class="tip">💡 You can also drag a corner handle to scale text.</p>`,
          task: { text: 'Make your text <b>72 pt or bigger</b> and give it a <b>color</b>.', hint: 'Select the text → type 90 in the size box → Enter → click a swatch.', check: (ed) => has(ed, 'text', (o) => o.size >= 72 && colored(o.fill)) },
        },
        {
          title: 'Center it perfectly', demo: 'align', hl: ['align-hcenter'],
          body: `<p>Don't center things by eye — use <b>Align</b>! With one object selected it aligns to the <b>artboard</b>.</p><p>Click <b>Horizontal Align Center</b> then <b>Vertical Align Center</b>.</p>`,
          task: { text: 'Center your text on the artboard using the <b>Align</b> buttons.', hint: 'Select the text, then in Properties › Align click the 2nd icon (Horizontal Align Center).', check: (ed) => did(ed, 'align', (e) => e.how === 'hcenter') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What is the shortcut key for the Type Tool?', options: ['T', 'P', 'V'], answer: 0, explain: 'T for Type! P is the Pen and V is the Selection tool.' },
        },
      ],
    },

    /* =================================================================== 6 */
    {
      id: 'ai-06', title: 'Layers, Order & Groups', sub: 'Control what is in front and keep things tidy', img: 'assets/img/lesson-layers.webp',
      mins: 10, color: '#3B82F6', badge: { icon: '🗂️', name: 'Layer Boss' },
      setup: (ed) => ed.reset({ objs: [sceneShapes[0], sceneShapes[2], sceneShapes[1]].map((o) => ({ ...o })) }),
      steps: [
        {
          title: 'Stacking order', demo: 'layers',
          setup: (ed) => { ed.reset({ objs: [sceneShapes[0], sceneShapes[2], { ...sceneShapes[1], x: 520, y: 120 }].map((o) => ({ ...o })) }); ed.objs.splice(1, 0, ed.objs.pop()); ed.renderAll(); ed.commit(true); },
          body: `<p>Shapes sit on top of each other like <b>paper cards</b>. The newest shape is on top.</p><p>The sun is hiding <b>behind</b> the cloud. Let's bring it to the front!</p><p><b>Object › Arrange › Bring to Front</b> (<kbd>${window.AIEditor ? window.AIEditor.SHIFT : 'Shift+'}${K}]</kbd>)</p>`,
          task: { text: 'Select the <b>sun</b> and bring it to the <b>front</b>.', hint: 'Click the orange part of the sun, then use the Object menu › Arrange › Bring to Front (or the "Front" button in Properties).', check: (ed) => { const i = (n) => ed.objs.findIndex((o) => o.name === n); return did(ed, 'arrange') && i('Sun') > i('Cloud'); } },
          ghost: [{ el: 'tool-select' }, { click: 1 }, { doc: [690, 160] }, { click: 1 }, { el: 'menu-object' }, { click: 1 }],
        },
        {
          title: 'The Layers panel', hl: ['tab-layers'],
          body: `<p>The <b>Layers</b> panel shows every object. The top of the list = the front of your artwork.</p><ul><li>👁 <b>Eye</b> — hide / show.</li><li>🔒 <b>Lock</b> — protect it from changes.</li></ul>`,
          task: { text: 'Open <b>Layers</b>. Click an <b>eye</b> 👁 to hide something, then click again to show it.', hint: 'Layers tab (top right) → the eye button is at the left of each row.', check: (ed) => did(ed, 'hide', (e) => e.via === 'layers') && did(ed, 'show', (e) => e.via === 'layers') },
          ghost: [{ el: 'tab-layers' }, { click: 1 }],
        },
        {
          title: 'Group objects', demo: 'group',
          body: `<p>A <b>group</b> glues objects together so they move and resize as one.</p><ol><li>Select several objects (<kbd>Shift</kbd>+click or drag a box around them).</li><li><b>Object › Group</b> (<kbd>${K}G</kbd>).</li></ol>`,
          task: { text: 'Select the <b>sun and the cloud</b> together, then <b>Group</b> them.', hint: 'Use the Selection tool: click the sun, Shift+click the cloud, then press ' + K + 'G.', check: (ed) => did(ed, 'group') },
        },
        {
          title: 'Move the group',
          body: `<p>Now click either shape — <b>both</b> get selected. Drag them together! ☀️☁️</p><p class="tip">💡 To edit just one shape inside a group, ungroup it (<kbd>${window.AIEditor ? window.AIEditor.SHIFT : 'Shift+'}${K}G</kbd>) or use the Direct Selection tool.</p>`,
          task: { text: '<b>Drag the group</b> to a new spot.', hint: 'Press V and drag the sun or the cloud.', check: (ed) => did(ed, 'move', (e) => e.count >= 2) },
        },
        {
          title: 'Lock it',
          body: `<p>Locking is great for backgrounds: you can't move them by accident.</p><p>Click the lock box in Layers, or <b>Object › Lock Selection</b> (<kbd>${K}2</kbd>). <b>Object › Unlock All</b> frees everything.</p>`,
          task: { text: '<b>Lock</b> the green hill.', hint: 'Layers panel → click the empty box next to the eye on the &lt;Hill&gt; row.', check: (ed) => ed.objs.some((o) => o.locked) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'In the Layers panel, the object at the TOP of the list is…', options: ['At the back', 'In front of everything', 'Hidden'], answer: 1, explain: 'Correct — top of the list = front of the artwork.' },
        },
      ],
    },

    /* =================================================================== 7 */
    {
      id: 'ai-07', title: 'Pathfinder Magic', sub: 'Combine simple shapes into amazing new ones', img: 'assets/img/lesson-pathfinder.webp',
      mins: 10, color: '#8B5CF6', badge: { icon: '🧩', name: 'Pathfinder Pro' },
      setup: (ed) => ed.reset({ objs: cloudParts }),
      steps: [
        {
          title: 'Unite: make a cloud', demo: 'unite', hl: ['prop-pathfinder'],
          body: `<p>Pros rarely draw complex shapes from scratch. They <b>combine simple shapes</b> with <b>Pathfinder</b>! 🧩</p><p><b>Unite</b> joins shapes into one.</p><ol><li>Drag a box around all the blue pieces to select them.</li><li>Properties › Pathfinder › <b>Unite</b>.</li></ol>`,
          task: { text: 'Select all the cloud pieces and click <b>Unite</b>.', hint: 'With the black arrow, drag a big box over all four shapes. The Pathfinder buttons appear in Properties.', check: (ed) => did(ed, 'pathfinder', (e) => e.op === 'unite') },
          ghost: [{ el: 'tool-select' }, { click: 1 }, { drag: [[180, 120], [660, 440]] }, { el: 'pf-unite', wait: 1 }],
        },
        {
          title: 'Minus Front: a moon 🌙', demo: 'minus',
          setup: (ed) => { ed.reset({ objs: [{ kind: 'rect', x: 0, y: 0, w: 800, h: 600, fill: '#2E3192', stroke: 'none', sw: 0, name: 'Sky', locked: true }, { kind: 'ellipse', x: 260, y: 150, w: 280, h: 280, fill: '#FCEE21', stroke: 'none', sw: 0 }, { kind: 'ellipse', x: 350, y: 110, w: 260, h: 260, fill: '#FFFFFF', stroke: 'none', sw: 0 }] }); },
          body: `<p><b>Minus Front</b> uses the top shape like a <b>cookie cutter</b> 🍪 and removes it from the shape below.</p>`,
          task: { text: 'Select both circles and click <b>Minus Front</b> to make a moon.', hint: 'Shift+click the yellow circle and the white circle (the sky is locked), then click the 2nd Pathfinder button.', check: (ed) => did(ed, 'pathfinder', (e) => e.op === 'minus') },
        },
        {
          title: 'Intersect: a leaf 🍃', demo: 'intersect',
          setup: (ed) => { ed.reset({ objs: twoCircles('#39B54A', '#8CC63F', 150) }); },
          body: `<p><b>Intersect</b> keeps <b>only the part where shapes overlap</b>. Two circles → a leaf or an eye shape!</p>`,
          task: { text: 'Select both circles and click <b>Intersect</b>.', hint: 'Select All (' + K + 'A), then the 3rd Pathfinder button.', check: (ed) => did(ed, 'pathfinder', (e) => e.op === 'intersect') },
        },
        {
          title: 'Exclude: cut the middle', demo: 'exclude',
          setup: (ed) => { ed.reset({ objs: twoCircles('#FF7A59', '#FFC93C', 120) }); },
          body: `<p><b>Exclude</b> removes the overlap and keeps the rest — great for cool logo effects.</p>`,
          task: { text: 'Select both circles and click <b>Exclude</b>.', hint: 'Select All (' + K + 'A), then the 4th Pathfinder button.', check: (ed) => did(ed, 'pathfinder', (e) => e.op === 'exclude') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which Pathfinder button works like a cookie cutter?', options: ['Unite', 'Minus Front', 'Intersect'], answer: 1, explain: 'Yes! Minus Front cuts the top shape out of the bottom one.' },
        },
      ],
    },

    /* =================================================================== 8 */
    {
      id: 'ai-08', title: 'Final Project: Your Logo', sub: 'Use everything you learned to design a real logo', img: 'assets/img/lesson-final.webp',
      mins: 20, color: '#F59E0B', badge: { icon: '🏆', name: 'Logo Legend' }, final: true,
      setup: (ed) => ed.reset({ def: { fill: '#FFE5B4', stroke: 'none', sw: 0 } }),
      steps: [
        {
          title: 'The brief ☕', demo: 'logo',
          body: `<p>A new café called <b>"Happy Cup"</b> needs a logo — and you are the designer! 🎉</p><p>We'll build it from simple shapes, like real pros do. Feel free to use your own colors and ideas. Your art, your style!</p>
                 <p class="tip">💡 Can't remember something? Every tool has a tooltip — just hover it.</p>`,
        },
        {
          title: 'Background badge',
          body: '<p>Start with a big <b>circle</b> as a badge behind everything. Pick a soft, light color.</p>',
          task: { text: 'Draw a <b>big circle</b> (at least 250 px wide) with a light <b>fill</b> color.', hint: 'Ellipse tool (L) + Shift. Then click a swatch for the fill.', check: (ed) => has(ed, 'ellipse', (o) => o.w >= 250 && colored(o.fill)) },
        },
        {
          title: 'The cup',
          body: '<p>Draw a <b>rectangle</b> for the cup. Round the corners and make it brown (or any color you like!).</p>',
          task: { text: 'Draw a <b>rectangle with rounded corners</b> for the cup.', hint: 'Rectangle tool (M), then Properties › Corner.', check: (ed) => has(ed, 'rect', (o) => (o.r || 0) > 0 && o.w >= 60) },
        },
        {
          title: 'The handle',
          body: '<p>A circle with a <b>thick stroke</b> and <b>no fill</b> makes a perfect handle. Place it at the side of the cup, then <b>send it to the back</b> or put the cup on top.</p>',
          task: { text: 'Make a circle with <b>Fill: None</b> and a <b>stroke of 10 pt or more</b>.', hint: 'Draw a circle → Fill: None (/) → Stroke color → Stroke weight 14.', check: (ed) => has(ed, 'ellipse', (o) => o.fill === 'none' && o.sw >= 10 && o.stroke !== 'none') },
        },
        {
          title: 'Hot steam ♨️', hl: ['[data-group="6"]', 'tool-pen'],
          body: '<p>Use the <b>Pencil</b> <kbd>N</kbd>, <b>Paintbrush</b> <kbd>B</kbd> or <b>Pen</b> <kbd>P</kbd> to draw wavy steam lines above the cup.</p>',
          task: { text: 'Draw <b>2 or more</b> steam lines.', hint: 'Press B and draw a few wavy lines. Make the stroke thick!', check: (ed) => count(ed, 'path', (o) => o.fill === 'none') >= 2 },
        },
        {
          title: 'Brand name',
          body: '<p>Add the name <b>Happy Cup</b> with a fun font like <i>Pacifico</i> or <i>Lobster</i>. Center it with Align.</p>',
          task: { text: 'Add your <b>brand name</b> using a font that is not Myriad Pro.', hint: 'Type tool (T) → type → Esc → V → choose a font in Properties.', check: (ed) => has(ed, 'text', (o) => o.font !== 'Myriad Pro' && o.text.trim().length > 1) },
        },
        {
          title: 'Polish it ✨', demo: 'effects',
          body: `<p>Give the cup a <b>Drop Shadow</b> (Effect › Stylize › Drop Shadow) so it pops.</p><p>Then select everything (<kbd>${K}A</kbd>) and <b>Group</b> it (<kbd>${K}G</kbd>).</p>`,
          task: { text: 'Add a <b>Drop Shadow</b> to something and <b>Group</b> your logo.', hint: 'Select the cup → Properties › Drop Shadow. Then ' + K + 'A and ' + K + 'G.', check: (ed) => did(ed, 'effect', (e) => e.fx === 'shadow' && e.on) && did(ed, 'group') },
        },
        {
          title: 'Export your logo 🚀', demo: 'export', hl: ['menu-file'],
          body: '<p>Designers deliver files. Save your logo as a <b>PNG</b> picture to share with your friends, teacher, or the café owner!</p>',
          task: { text: 'Export your logo: <b>File › Export As PNG…</b>', hint: 'Open the File menu at the top-left of the workspace.', check: (ed) => did(ed, 'export') },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
      ],
    },
  ];

  const COURSES = [
    { id: 'illustrator', name: 'Adobe Illustrator', short: 'Ai', tag: 'Vector graphics · Logos · Icons', color: '#FF9A00', bg: '#330000', status: 'open', lessons: LESSONS, img: 'assets/img/hero.webp' },
    { id: 'photoshop', name: 'Adobe Photoshop', short: 'Ps', tag: 'Photo editing · Layers · Retouching', color: '#31A8FF', bg: '#001E36', status: 'soon', lessons: [], img: 'assets/img/photoshop-soon.webp' },
  ];

  window.DQCourses = COURSES;
})();
