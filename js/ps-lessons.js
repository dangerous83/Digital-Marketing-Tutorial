/* =========================================================================
   DesignQuest — Adobe Photoshop course content
   Same step format as js/lessons.js. The practice workspace is PSEditor.
   ========================================================================= */
(function () {
  'use strict';
  const did = (ed, n, f) => ed.did(n, f);
  const count = (ed, n, f) => ed.log.filter((e) => e.name === n && (!f || f(e))).length;
  const K = window.PSEditor ? window.PSEditor.CMD : 'Ctrl+';
  const S = window.PSEditor ? window.PSEditor.SHIFT : 'Shift+';
  const A = window.PSEditor ? window.PSEditor.ALT : 'Alt+';
  const altName = /Mac|iPhone|iPad/.test(navigator.platform || '') ? 'Option' : 'Alt';

  /** flamingo cut-out placed on the beach */
  const flamingo = (ed, sc = 0.62, x = 560, y = 330) => {
    const s = ed.photoSize('flamingo');
    return { photo: 'flamingo', name: 'Flamingo', scale: sc, x: Math.round(x - (s.w * sc) / 2), y: Math.round(y - (s.h * sc) / 2) };
  };

  const LESSONS = [
    /* ================================================================ 1 */
    {
      id: 'ps-01', title: 'Meet Photoshop', sub: 'Pixels, the workspace and zooming', img: 'assets/img/ps-interface.webp',
      mins: 8, color: '#31A8FF', badge: { icon: '📷', name: 'Photo Explorer' },
      setup: (ed) => ed.reset({ photo: 'landscape', name: 'mountains' }),
      steps: [
        {
          title: 'Welcome to Photoshop! 📸', demo: 'ps-welcome',
          body: `<p><b>Adobe Photoshop</b> is the world's favourite app for <b>editing photos</b>: fixing colors, removing spots, mixing pictures together and making posters and social media posts.</p>
                 <p>On the right is a <b>practice Photoshop</b> with a real photo. Try anything — it's impossible to break! 💪</p>
                 <p class="tip">💡 Illustrator = vector shapes. Photoshop = <b>pixels</b> (photos). Designers use both!</p>`,
        },
        {
          title: 'A photo is made of pixels', demo: 'pixels', hl: ['tool-zoom'],
          body: `<p>Every photo is a grid of tiny colored squares called <b>pixels</b>. This photo is <b>1000 × 747 pixels</b> — that's 747,000 little squares!</p><p>Zoom in really close and you'll see them. 🔍</p>`,
          task: { text: 'Use the <b>Zoom Tool</b> <kbd>Z</kbd> and click until you reach <b>800%</b> or more. Can you see the squares?', hint: 'Press Z, then click on the photo again and again. The zoom % is shown at the bottom-left.', check: (ed) => ed.view.z >= 7.9 },
          ghost: [{ el: 'tool-zoom' }, { click: 1 }, { doc: [520, 300] }, { click: 1 }, { click: 1 }, { click: 1 }],
        },
        {
          title: 'Fit it back on screen',
          body: `<p>To see the whole photo again use <b>View › Fit on Screen</b> or the shortcut <kbd>${K}0</kbd>.</p><p class="tip">💡 Hold <kbd>Space</kbd> and drag to move around while zoomed in.</p>`,
          task: { text: 'Press <kbd>' + K + '0</kbd> (or use <b>View › Fit on Screen</b>).', hint: 'Open the View menu at the top of the workspace.', check: (ed) => did(ed, 'zoom', (e) => e.fit) },
          ghost: [{ el: 'menu-view' }, { click: 1 }],
        },
        {
          title: 'The Photoshop workspace', demo: 'ps-workspace', hl: ['menu-image'],
          body: `<ol class="areas"><li><b>Menu Bar</b> — File, Edit, Image, Layer, Select, Filter…</li><li><b>Options Bar</b> — settings for the tool you picked.</li><li><b>Toolbar</b> — your tools (left side).</li><li><b>Document</b> — your photo.</li><li><b>Panels</b> — Color, Properties, and the super-important <b>Layers</b> panel.</li></ol>`,
          task: { text: 'Open the <b>Image</b> menu and look inside <b>Adjustments</b>.', hint: 'Top bar: File · Edit · <b>Image</b> · Layer…', check: (ed) => did(ed, 'menuOpen', (e) => e.menu === 'Image') },
          ghost: [{ el: 'menu-image' }, { click: 1 }],
        },
        {
          title: 'The Options Bar changes', hl: ['tool-brush', 'options-bar'],
          body: `<p>The <b>Options Bar</b> (just under the menu) shows settings for the tool you are using. Pick the Brush and you'll see <b>Size</b>, <b>Hardness</b> and <b>Opacity</b>.</p><p>Pick the Magic Wand and you'll see <b>Tolerance</b>. Smart, right?</p>`,
          task: { text: 'Choose the <b>Brush Tool</b> <kbd>B</kbd> and look at the Options Bar.', hint: 'The brush icon is in the middle of the toolbar.', check: (ed) => ed.tool === 'brush' },
          ghost: [{ el: 'tool-brush' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What is Photoshop best for?', options: ['Editing photos (pixels)', 'Typing long documents', 'Making spreadsheets'], answer: 0, explain: 'Yes! Photoshop works with pixels — perfect for photos.' },
        },
      ],
    },

    /* ================================================================ 2 */
    {
      id: 'ps-02', title: 'Layers 101', sub: 'The secret of every Photoshop design', img: 'assets/img/ps-layers.webp',
      mins: 12, color: '#7C5CFF', badge: { icon: '🥞', name: 'Layer Stacker' },
      setup: (ed) => ed.reset({ photo: 'beach', name: 'summer', layers: [flamingo(ed), { text: 'SUMMER', font: 'Bebas Neue', size: 160, weight: 400, color: '#FFFFFF', x: 330, y: 50 }], active: 0 }),
      steps: [
        {
          title: 'What are layers?', demo: 'ps-layers', hl: ['layers-list'],
          body: `<p>Layers are like <b>clear plastic sheets</b> stacked on top of each other. Each sheet holds one part of the picture.</p><p>Look at the <b>Layers panel</b> (bottom-right): this design has 3 layers — the beach, a flamingo and the word SUMMER.</p>`,
          task: { text: 'Click the <b>Flamingo</b> layer in the Layers panel to select it.', hint: 'Bottom-right panel. Click the row that says "Flamingo".', check: (ed) => did(ed, 'layerSelect', (e) => e.lname === 'Flamingo') },
          ghost: [{ el: 'tab-layers' }, { click: 1 }, { el: 'layers-list' }],
        },
        {
          title: 'Hide & show', hl: ['layers-list'],
          body: '<p>The <b>eye 👁</b> next to each layer hides or shows it. Hidden layers are not deleted — they are just invisible.</p>',
          task: { text: 'Hide the <b>SUMMER</b> text with its eye, then show it again.', hint: 'Click the eye on the SUMMER row twice.', check: (ed) => did(ed, 'layerVis', (e) => !e.visible) && did(ed, 'layerVis', (e) => e.visible) },
        },
        {
          title: 'Move a layer', hl: ['tool-move'],
          body: `<p>The <b>Move Tool</b> <kbd>V</kbd> moves the selected layer. With <b>Auto-Select</b> on (in the Options Bar) you can just click any object to grab it.</p>`,
          task: { text: 'Use the <b>Move Tool</b> to drag the <b>flamingo</b> to a new place.', hint: 'Press V, press on the flamingo and drag.', check: (ed) => did(ed, 'move', (e) => e.lname === 'Flamingo') },
          ghost: [{ el: 'tool-move' }, { click: 1 }, { drag: [[560, 340], [420, 380]] }],
        },
        {
          title: 'Change the order',
          body: `<p>Layers at the <b>top</b> of the list are <b>in front</b>. Drag a layer up or down in the panel to change what's in front.</p><p>Or use <b>Layer › Arrange</b> (<kbd>${K}]</kbd> forward, <kbd>${K}[</kbd> backward).</p>`,
          task: { text: 'Put the <b>SUMMER</b> text <b>behind</b> the flamingo.', hint: 'Select the SUMMER layer, then press ' + K + '[ (or drag its row below Flamingo).', check: (ed) => { const t = ed.layers.findIndex((l) => l.kind === 'text'), f = ed.layers.findIndex((l) => l.name === 'Flamingo'); return did(ed, 'layerOrder') && t >= 0 && f >= 0 && t < f; } },
        },
        {
          title: 'Opacity = see-through', demo: 'opacity', hl: ['layer-opacity'],
          body: '<p><b>Opacity</b> controls how see-through a layer is. 100% = solid, 0% = invisible.</p>',
          task: { text: 'Select the <b>SUMMER</b> layer and set its <b>Opacity</b> to <b>60% or less</b>.', hint: 'Top of the Layers panel: type 50 in the Opacity box and press Enter (or drag the slider).', check: (ed) => ed.layers.some((l) => l.kind === 'text' && l.opacity <= 0.6) },
        },
        {
          title: 'The locked Background', demo: 'bg-lock',
          body: '<p>When you open a photo, it becomes a layer called <b>Background</b> with a <b>lock 🔒</b>. You cannot move it or erase it to transparent.</p><p><b>Double-click</b> it to unlock it — it becomes a normal layer called "Layer 0".</p>',
          task: { text: '<b>Double-click</b> the Background layer to unlock it.', hint: 'In the Layers panel, double-click the row that says Background (or use Properties › Unlock layer).', check: (ed) => did(ed, 'unlockBg') },
        },
        {
          title: 'Make a new layer', hl: ['layer-new'],
          body: `<p>Pros put every new thing on its <b>own layer</b>. Then you can change it later without hurting the photo.</p><p>Click <b>＋</b> at the bottom of the Layers panel, or press <kbd>${S}${K}N</kbd>.</p>`,
          task: { text: 'Create a <b>new empty layer</b>.', hint: 'The ＋ button is at the bottom of the Layers panel.', check: (ed) => did(ed, 'layerNew') },
          ghost: [{ el: 'layer-new' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'In Photoshop, the grey-and-white checkerboard means…', options: ['The photo is broken', 'Transparent (nothing there)', 'The layer is locked'], answer: 1, explain: 'Correct! The checkerboard shows empty, transparent pixels.' },
        },
      ],
    },

    /* ================================================================ 3 */
    {
      id: 'ps-03', title: 'Selections', sub: 'Marquee, Lasso and the Magic Wand', img: 'assets/img/ps-selections.webp',
      mins: 12, color: '#19C3B1', badge: { icon: '🪄', name: 'Selection Wizard' },
      setup: (ed) => ed.reset({ photo: 'balloon', name: 'balloon', tool: 'move' }),
      steps: [
        {
          title: 'Rectangular Marquee', demo: 'marquee', hl: ['[data-group="1"]'],
          body: '<p>A <b>selection</b> tells Photoshop <b>which pixels</b> you want to change. Everything outside is protected.</p><p>The <b>Rectangular Marquee</b> <kbd>M</kbd> selects a box. The moving dashed line is called <b>marching ants</b> 🐜.</p>',
          task: { text: 'Choose the <b>Rectangular Marquee</b> <kbd>M</kbd> and drag a box on the photo.', hint: 'Press M, then drag diagonally on the photo.', check: (ed) => did(ed, 'select', (e) => e.kind === 'marquee') },
          ghost: [{ el: '[data-group="1"]' }, { click: 1 }, { drag: [[300, 200], [700, 520]] }],
        },
        {
          title: 'Deselect',
          body: `<p>Done with a selection? <b>Select › Deselect</b> or press <kbd>${K}D</kbd>. The ants disappear.</p>`,
          task: { text: 'Press <kbd>' + K + 'D</kbd> to <b>deselect</b>.', hint: 'Or open the Select menu › Deselect.', check: (ed) => did(ed, 'deselect') },
        },
        {
          title: 'Elliptical Marquee', hl: ['[data-group="1"]'],
          body: '<p>Hidden under the Rectangular Marquee is the <b>Elliptical Marquee</b> for circles and ovals. <b>Press and hold</b> the tool (or right-click) to find it.</p><p class="tip">💡 Hold <kbd>Shift</kbd> while dragging for a perfect circle.</p>',
          task: { text: 'Find the <b>Elliptical Marquee</b> and make a round selection.', hint: 'Hold the mouse on the marquee icon for 1 second, choose Elliptical Marquee, then drag.', check: (ed) => did(ed, 'select', (e) => e.kind === 'ellipse') },
          ghost: [{ el: '[data-group="1"]' }, { hold: 1 }, { el: 'fly-ellipse', wait: 1 }],
        },
        {
          title: 'The Magic Wand 🪄', demo: 'wand', hl: ['tool-wand'],
          body: '<p>The <b>Magic Wand</b> <kbd>W</kbd> selects pixels with a <b>similar color</b> in one click. Perfect for a plain blue sky!</p><p><b>Tolerance</b> (Options Bar) = how similar. Higher number = more colors.</p><p class="tip">💡 Didn\'t get all the sky? <kbd>Shift</kbd>+click to <b>add</b> more.</p>',
          task: { text: 'Pick the <b>Magic Wand</b> and click the <b>sky</b>. Select most of it.', hint: 'Press W, click the blue sky. Shift+click other parts of the sky to add them.', check: (ed) => ed.hasMask() && ed.maskArea() > 0.45 && did(ed, 'select', (e) => e.kind === 'wand') },
          ghost: [{ el: 'tool-wand' }, { click: 1 }, { doc: [150, 150] }, { click: 1 }],
        },
        {
          title: 'Inverse: select the balloon!',
          body: `<p>You selected the sky… but we want the <b>balloon</b>! <b>Select › Inverse</b> (<kbd>${S}${K}I</kbd>) flips the selection: now everything <b>except</b> the sky is selected.</p>`,
          task: { text: 'Use <b>Select › Inverse</b> so the balloon is selected.', hint: 'Open the Select menu at the top and choose Inverse.', check: (ed) => did(ed, 'invert') && ed.hasMask() && ed.maskArea() < 0.5 },
          ghost: [{ el: 'menu-select' }, { click: 1 }],
        },
        {
          title: 'Cut it out onto a new layer',
          body: `<p><b>Layer › Layer Via Copy</b> (<kbd>${K}J</kbd>) copies the selected pixels to a <b>new layer</b>. Hide the Background and your balloon floats on transparency — a perfect cut-out! ✂️</p>`,
          task: { text: 'Press <kbd>' + K + 'J</kbd>, then <b>hide the Background</b> layer to see your cut-out.', hint: 'After ' + K + 'J, click the eye on the Background row in the Layers panel.', check: (ed) => did(ed, 'layerDup', (e) => e.viaCopy) && ed.layers.some((l) => l.bg && !l.visible) },
        },
        {
          title: 'The Lasso', demo: 'lasso', hl: ['tool-lasso'],
          body: '<p>The <b>Lasso</b> <kbd>L</kbd> lets you draw a selection by hand, like a lasso rope 🤠. Great for odd shapes.</p>',
          task: { text: 'Use the <b>Lasso</b> to draw a selection around anything.', hint: 'Press L, then press and draw a loop. Let go to finish.', check: (ed) => did(ed, 'select', (e) => e.kind === 'lasso') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What do the "marching ants" show?', options: ['A broken photo', 'The edge of your selection', 'A layer style'], answer: 1, explain: 'Exactly — the moving dashed line is the border of the selection.' },
        },
      ],
    },

    /* ================================================================ 4 */
    {
      id: 'ps-04', title: 'Brushes & Color', sub: 'Paint, erase, fill and gradients', img: 'assets/img/ps-brushes.webp',
      mins: 10, color: '#FF5FA2', badge: { icon: '🖌️', name: 'Paint Master' },
      setup: (ed) => ed.reset({ w: 1000, h: 700, name: 'painting', layers: [{ name: 'My Painting' }], tool: 'brush' }),
      steps: [
        {
          title: 'Foreground & Background colors', hl: ['colors', 'tab-swatches'],
          body: '<p>At the bottom of the toolbar are two squares: the <b>Foreground</b> color (front) is what you <b>paint</b> with. The <b>Background</b> color (back) is used by the eraser on locked backgrounds and by gradients.</p><p>Click a swatch in <b>Swatches</b> to set the foreground color.</p>',
          task: { text: 'Choose a bright <b>foreground color</b> from the Swatches panel.', hint: 'Top-right panel: click the Swatches tab, then click a color.', check: (ed) => did(ed, 'color', (e) => e.slot === 'fg') },
          ghost: [{ el: 'tab-swatches' }, { click: 1 }],
        },
        {
          title: 'Paint with the Brush', demo: 'brush', hl: ['tool-brush'],
          body: `<p>The <b>Brush</b> <kbd>B</kbd> paints with the foreground color. We're painting on a separate layer called <b>My Painting</b> — smart!</p><p>Press <kbd>[</kbd> and <kbd>]</kbd> to make the brush smaller or bigger.</p>`,
          task: { text: 'Paint something with the <b>Brush</b> — a smile, a sun, your name!', hint: 'Press B, then press and drag on the white page.', check: (ed) => did(ed, 'paint', (e) => e.tool === 'brush') },
          ghost: [{ el: 'tool-brush' }, { click: 1 }, { drag: [[300, 300], [600, 380]] }],
        },
        {
          title: 'Size & Hardness', demo: 'hardness', hl: ['options-bar'],
          body: '<p>In the Options Bar: <b>Size</b> = how big. <b>Hardness</b> = how sharp the edge is. 0% hardness = soft and fuzzy, like an airbrush.</p>',
          task: { text: 'Set <b>Size 60+</b> and <b>Hardness 30% or less</b>, then paint again.', hint: 'Type the numbers in the Options Bar boxes and press Enter, then paint.', check: (ed) => did(ed, 'paint', (e) => e.tool === 'brush' && e.size >= 60 && e.hard <= 0.3) },
        },
        {
          title: 'The Eraser', demo: 'eraser', hl: ['tool-eraser'],
          body: '<p>The <b>Eraser</b> <kbd>E</kbd> removes pixels. On a normal layer it makes them <b>transparent</b> (checkerboard).</p>',
          task: { text: 'Erase part of your painting with the <b>Eraser</b>.', hint: 'Press E and drag over your paint.', check: (ed) => did(ed, 'paint', (e) => e.tool === 'eraser') },
        },
        {
          title: 'Paint Bucket', demo: 'bucket', hl: ['[data-group="10"]'],
          body: '<p>The <b>Paint Bucket</b> fills an area of similar color in one click. It hides under the <b>Gradient Tool</b> — hold the tool to find it.</p>',
          task: { text: 'Find the <b>Paint Bucket</b> and click to fill an area.', hint: 'Hold the gradient icon (near the bottom of the toolbar), choose Paint Bucket, then click on the page.', check: (ed) => did(ed, 'fill', (e) => e.how === 'bucket') },
        },
        {
          title: 'Gradients', demo: 'ps-gradient', hl: ['[data-group="10"]'],
          body: '<p>The <b>Gradient Tool</b> <kbd>G</kbd> blends the foreground color into the background color. Drag a line: where you start and stop sets the blend.</p><p class="tip">💡 Make a new layer first so the gradient doesn\'t cover your painting!</p>',
          task: { text: 'Make a <b>new layer</b>, then drag a <b>gradient</b> on it.', hint: 'Layers panel ＋, then pick the Gradient Tool and drag across the page.', check: (ed) => did(ed, 'layerNew') && did(ed, 'fill', (e) => e.how === 'gradient') },
        },
        {
          title: 'Quick color keys',
          body: '<ul><li><kbd>X</kbd> — swap foreground and background.</li><li><kbd>D</kbd> — default colors (black & white).</li><li><kbd>I</kbd> — Eyedropper: click a color in the photo to pick it.</li></ul>',
          task: { text: 'Press <kbd>X</kbd> to <b>swap</b> the two colors.', hint: 'Click on the workspace first, then press the X key.', check: (ed) => did(ed, 'swap') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'A brush with Hardness 0% has…', options: ['A sharp edge', 'A soft, fuzzy edge', 'No color'], answer: 1, explain: 'Right! Low hardness = soft edges.' },
        },
      ],
    },

    /* ================================================================ 5 */
    {
      id: 'ps-05', title: 'Color Adjustments', sub: 'Make dull photos bright and beautiful', img: 'assets/img/ps-adjust.webp',
      mins: 10, color: '#FFC93C', badge: { icon: '🌈', name: 'Color Fixer' },
      setup: (ed) => ed.reset({ photo: 'landscapeDull', name: 'dull-photo' }),
      steps: [
        {
          title: 'Brightness / Contrast', demo: 'brightness', hl: ['tab-adjustments', 'adj-bc'],
          body: '<p>This photo looks dark and boring. 😴 Let\'s fix it!</p><p><b>Image › Adjustments › Brightness/Contrast</b>. Brightness = lighter/darker. Contrast = the difference between light and dark parts.</p>',
          task: { text: 'Make the photo <b>brighter</b> with Brightness/Contrast.', hint: 'Adjustments tab (right) → ☀ Brightness/Contrast → move Brightness to the right → OK.', check: (ed) => did(ed, 'adjust', (e) => e.kind === 'bc' && e.p.brightness > 5) },
          ghost: [{ el: 'tab-adjustments' }, { click: 1 }, { el: 'adj-bc', wait: 1 }],
        },
        {
          title: 'Hue / Saturation', demo: 'huesat', hl: ['adj-hsl'],
          body: `<p><b>Saturation</b> = how strong the colors are. <b>Hue</b> = changes every color around the rainbow. 🌈</p><p>Shortcut: <kbd>${K}U</kbd></p>`,
          task: { text: 'Open <b>Hue/Saturation</b> and make the colors <b>stronger</b> (Saturation up).', hint: 'Move the Saturation slider to the right, then click OK.', check: (ed) => did(ed, 'adjust', (e) => e.kind === 'hsl' && e.p.sat > 5) },
        },
        {
          title: 'The History panel ⏪', demo: 'history', hl: ['tab-history'],
          body: `<p>Every change is saved in the <b>History</b> panel. Click an old step to go back in time — like a time machine!</p><p><kbd>${K}Z</kbd> also undoes one step at a time.</p>`,
          task: { text: 'Open <b>History</b> and click an <b>earlier step</b>.', hint: 'Bottom-right: click the History tab, then click a step higher in the list.', check: (ed) => did(ed, 'history') || did(ed, 'undo') },
          ghost: [{ el: 'tab-history' }, { click: 1 }],
        },
        {
          title: 'Black & White', demo: 'bw', hl: ['adj-bw'],
          body: '<p>Black & white photos look classic and dramatic. <b>Image › Adjustments › Black & White</b>.</p>',
          task: { text: 'Turn the photo <b>Black & White</b>.', hint: 'Adjustments tab → ◐ Black & White.', check: (ed) => did(ed, 'adjust', (e) => e.kind === 'bw') },
        },
        {
          title: 'Adjust just one part',
          body: '<p>Adjustments only change the <b>selected</b> pixels. Undo the black & white, select part of the photo, then change only that part!</p><p class="tip">💡 Idea: select the sky and make it a crazy color with Hue.</p>',
          task: { text: 'Make a <b>selection</b>, then use <b>Hue/Saturation</b> to change only that part.', hint: 'Marquee (M) → drag over the sky → Hue/Saturation → move Hue → OK.', check: (ed) => did(ed, 'adjust', (e) => e.kind === 'hsl' && e.sel) },
        },
        {
          title: 'Filters: Gaussian Blur', demo: 'blur', hl: ['menu-filter'],
          body: '<p><b>Filters</b> add special effects. <b>Filter › Blur › Gaussian Blur</b> makes things soft and dreamy — great for backgrounds behind text.</p>',
          task: { text: 'Apply a <b>Gaussian Blur</b>.', hint: 'Filter menu › Blur › Gaussian Blur… → OK.', check: (ed) => did(ed, 'filter', (e) => e.kind === 'blur') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which adjustment makes colors stronger?', options: ['Saturation', 'Black & White', 'Gaussian Blur'], answer: 0, explain: 'Yes! More saturation = stronger, juicier colors.' },
        },
      ],
    },

    /* ================================================================ 6 */
    {
      id: 'ps-06', title: 'Retouching', sub: 'Remove spots like magic', img: 'assets/img/ps-retouch.webp',
      mins: 10, color: '#22C55E', badge: { icon: '🩹', name: 'Photo Doctor' },
      setup: (ed) => ed.reset({ photo: 'apple', name: 'apple' }),
      steps: [
        {
          title: 'Work on a copy',
          body: `<p>Pro rule #1: <b>never</b> retouch the original. Duplicate it first with <b>Layer › Duplicate Layer</b> (<kbd>${K}J</kbd>). If something goes wrong, the original is safe below.</p>`,
          task: { text: 'Duplicate the photo layer with <kbd>' + K + 'J</kbd>.', hint: 'Or click ⧉ at the bottom of the Layers panel.', check: (ed) => did(ed, 'layerDup') },
        },
        {
          title: 'Spot Healing Brush', demo: 'heal', hl: ['tool-heal'],
          body: '<p>This apple has <b>4 dark spots</b>. The <b>Spot Healing Brush</b> <kbd>J</kbd> removes them like magic: just paint over a spot and Photoshop fills it with the skin around it. ✨</p><p class="tip">💡 Make the brush a bit bigger than the spot (<kbd>[</kbd> <kbd>]</kbd>).</p>',
          task: { text: 'Remove <b>at least 3 spots</b> with the Spot Healing Brush.', hint: 'Press J, then click (or paint a little) on each brown spot.', check: (ed) => count(ed, 'paint', (e) => e.tool === 'heal') >= 3 },
          ghost: [{ el: 'tool-heal' }, { click: 1 }, { doc: [473, 338] }, { click: 1 }, { doc: [548, 357] }, { click: 1 }],
        },
        {
          title: 'Clone Stamp', demo: 'clone', hl: ['tool-clone'],
          body: `<p>The <b>Clone Stamp</b> <kbd>S</kbd> copies pixels from one place to another.</p><ol><li>Hold <kbd>${altName}</kbd> and <b>click</b> the area you want to copy (the source).</li><li>Let go of ${altName} and <b>paint</b> somewhere else.</li></ol><p>Try copying the apple's stem, or clone wood over the last spot!</p>`,
          task: { text: '<b>' + altName + '+click</b> to set a source, then <b>paint</b> with the Clone Stamp.', hint: 'Press S. Hold ' + altName + ' and click on the apple. Release ' + altName + ' and paint somewhere else.', check: (ed) => did(ed, 'cloneSource') && did(ed, 'paint', (e) => e.tool === 'clone') },
        },
        {
          title: 'Before & After 👀', hl: ['layers-list'],
          body: '<p>Pros always compare! Click the <b>eye</b> of your retouched copy to hide it and see the original, then show it again.</p>',
          task: { text: 'Hide and show your retouched layer to compare <b>before & after</b>.', hint: 'Click the eye on the top layer twice.', check: (ed) => did(ed, 'layerVis', (e) => !e.visible) && did(ed, 'layerVis', (e) => e.visible) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'With the Clone Stamp, how do you choose WHAT to copy?', options: ['Double-click', altName + ' + click on the source', 'Press Delete'], answer: 1, explain: 'Yes! ' + altName + '+click sets the source, then you paint.' },
        },
      ],
    },

    /* ================================================================ 7 */
    {
      id: 'ps-07', title: 'Text & Layer Styles', sub: 'Titles that pop: stroke, shadow and blend modes', img: 'assets/img/ps-text.webp',
      mins: 10, color: '#F97316', badge: { icon: '✍️', name: 'Title Hero' },
      setup: (ed) => ed.reset({ photo: 'beach', name: 'title', fg: '#FFFFFF' }),
      steps: [
        {
          title: 'The Type Tool', demo: 'ps-type', hl: ['tool-type'],
          body: '<p>The <b>Type Tool</b> <kbd>T</kbd> adds text. Each text gets its own <b>Type layer</b> (with a <b>T</b> in the Layers panel) — you can edit it any time.</p><p>The text uses the <b>foreground color</b> (we set it to white).</p>',
          task: { text: 'Choose the <b>Type Tool</b>, click on the sky and type a word like <b>HELLO</b>. Press <kbd>Esc</kbd> when done.', hint: 'Press T, click on the photo, type, then press Esc.', check: (ed) => did(ed, 'type') },
          ghost: [{ el: 'tool-type' }, { click: 1 }, { doc: [330, 220] }, { click: 1 }],
        },
        {
          title: 'Font & size', hl: ['prop-character'],
          body: '<p>Select the text layer and change the <b>font</b> and <b>size</b> in <b>Properties › Character</b> (or in the Options Bar while the Type Tool is active).</p>',
          task: { text: 'Change the <b>font</b> or <b>size</b> of your text.', hint: 'Properties panel (middle right) → choose a font like Bebas Neue or Pacifico.', check: (ed) => did(ed, 'textProp', (e) => e.k === 'font' || e.k === 'size') },
        },
        {
          title: 'Stroke', demo: 'layer-style', hl: ['prop-stroke', 'layer-fx'],
          body: '<p><b>Layer styles</b> are effects that stay editable. A <b>Stroke</b> adds an outline around the text so it\'s easy to read on any photo.</p><p>Use <b>Properties › Layer Style</b> or the <b><i>fx</i></b> button in Layers.</p>',
          task: { text: 'Add a <b>Stroke</b> layer style to your text.', hint: 'Select the text layer → Properties → ◯ Stroke.', check: (ed) => did(ed, 'fx', (e) => e.kind === 'stroke' && e.on) },
        },
        {
          title: 'Drop Shadow', hl: ['prop-shadow'],
          body: '<p>A <b>Drop Shadow</b> lifts the text off the photo. ☁</p>',
          task: { text: 'Add a <b>Drop Shadow</b> to your text.', hint: 'Properties → ☁ Drop Shadow.', check: (ed) => did(ed, 'fx', (e) => e.kind === 'shadow' && e.on) },
        },
        {
          title: 'Blend modes', demo: 'blend', hl: ['blend-mode'],
          body: '<p><b>Blend modes</b> change how a layer mixes with the layers below. <b>Overlay</b> and <b>Soft Light</b> make text look printed on the photo; <b>Multiply</b> mixes like ink.</p>',
          task: { text: 'Change the text layer\'s <b>blend mode</b> (try Overlay!).', hint: 'Top of the Layers panel: the menu that says "Normal".', check: (ed) => did(ed, 'layerBlend') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which layer style adds an outline?', options: ['Drop Shadow', 'Stroke', 'Opacity'], answer: 1, explain: 'Correct! Stroke = outline.' },
        },
      ],
    },

    /* ================================================================ 8 */
    {
      id: 'ps-08', title: 'Final Project: Summer Poster', sub: 'Crop, transform, adjust and export a real post', img: 'assets/img/ps-final.webp',
      mins: 20, color: '#F59E0B', badge: { icon: '🏆', name: 'Photo Legend' }, final: true,
      setup: (ed) => ed.reset({ photo: 'beach', name: 'summer-poster', fg: '#FFFFFF' }),
      steps: [
        {
          title: 'The brief 🏖️', demo: 'ps-poster',
          body: '<p>A beach shop needs a <b>square Instagram post</b> for its <b>Summer Sale</b> — and you\'re the designer! 🎉</p><p>You\'ll crop the photo, add a flamingo, fix the colors, add a bold title and export it. Use your own style!</p>',
        },
        {
          title: 'Crop to a square', demo: 'crop', hl: ['tool-crop', 'crop-ratio'],
          body: '<p>Instagram posts are <b>square</b> (1:1). Pick the <b>Crop Tool</b> <kbd>C</kbd>, choose <b>1 : 1</b> in the Options Bar, drag to position it, then press <kbd>Enter</kbd> (or ✓).</p>',
          task: { text: 'Crop the photo to a <b>1 : 1 square</b>.', hint: 'Press C → Options Bar → Ratio: 1:1 → drag inside the box to move it → ✓.', check: (ed) => did(ed, 'crop', (e) => Math.abs(e.w - e.h) <= 2) },
          ghost: [{ el: 'tool-crop' }, { click: 1 }, { el: 'crop-ratio', wait: 1 }],
        },
        {
          title: 'Add the flamingo', hl: ['menu-file'],
          body: '<p>Bring in another image with <b>File › Place Sample › Flamingo</b>. It arrives on its own layer. (You can also place your own photo with <b>File › Place Your Photo</b>!)</p>',
          task: { text: 'Place the <b>Flamingo</b> into your design.', hint: 'Open the File menu → Place Sample → Flamingo.', check: (ed) => did(ed, 'place') },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
        {
          title: 'Free Transform', demo: 'transform', hl: ['prop-transform'],
          body: `<p><b>Free Transform</b> (<kbd>${K}T</kbd>) lets you <b>resize</b> (drag a corner), <b>rotate</b> (drag outside a corner) and <b>move</b> (drag inside). Press <kbd>Enter</kbd> or ✓ to finish.</p>`,
          task: { text: 'Use <b>Free Transform</b> to resize or rotate the flamingo.', hint: 'Select the Flamingo layer, press ' + K + 'T, drag a corner, then press Enter.', check: (ed) => did(ed, 'transform') },
        },
        {
          title: 'Make the colors pop', hl: ['tab-adjustments'],
          body: '<p>Select the photo layer (bottom) and make the beach brighter and more colorful with <b>Brightness/Contrast</b> or <b>Hue/Saturation</b>.</p>',
          task: { text: 'Apply an <b>adjustment</b> to make the photo pop.', hint: 'Click the photo layer in Layers → Adjustments tab → pick one → OK.', check: (ed) => did(ed, 'adjust') },
        },
        {
          title: 'The big title', hl: ['tool-type'],
          body: '<p>Add <b>SUMMER SALE</b> (or your own words) with the Type Tool. Big, bold fonts like <b>Bebas Neue</b> work great for sales!</p>',
          task: { text: 'Add your <b>title</b> with the Type Tool.', hint: 'T → click → type → Esc.', check: (ed) => did(ed, 'type') },
        },
        {
          title: 'Style it ✨', hl: ['prop-style'],
          body: '<p>Make the title readable on the photo: add a <b>Stroke</b> and/or a <b>Drop Shadow</b>.</p>',
          task: { text: 'Add a <b>layer style</b> (Stroke or Drop Shadow) to your title.', hint: 'Select the title layer → Properties → Layer Style.', check: (ed) => did(ed, 'fx', (e) => e.on) },
        },
        {
          title: 'Export your poster 🚀', demo: 'export', hl: ['menu-file'],
          body: '<p>Save it as a picture to share: <b>File › Export › Export As PNG</b> (or JPG).</p>',
          task: { text: 'Export your poster: <b>File › Export › Export As PNG…</b>', hint: 'File menu → Export → Export As PNG.', check: (ed) => did(ed, 'export') },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
      ],
    },
  ];

  const C = window.DQCourses;
  const ps = C.find((c) => c.id === 'photoshop');
  Object.assign(ps, { status: 'open', lessons: LESSONS, editor: 'ps', img: 'assets/img/photoshop-soon.webp' });
  const ai = C.find((c) => c.id === 'illustrator');
  ai.editor = 'ai';
})();
