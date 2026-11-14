/* =========================================================================
   DesignQuest — Adobe InDesign course content (page layout)
   Same step format as js/lessons.js. The practice workspace is IDEditor.
   ========================================================================= */
(function () {
  'use strict';
  const did = (ed, n, f) => ed.did(n, f);
  const K = window.IDEditor ? window.IDEditor.CMD : 'Ctrl+';
  const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  const body = (n) => Array.from({ length: n }, () => ({ text: LOREM, style: 'Body Text' }));
  const STYLES = {
    'Heading': { font: 'Bebas Neue', size: 56, leading: 56, color: '#E8307D', align: 'left', weight: 400, spaceAfter: 8 },
    'Body Text': { font: 'Minion Pro', size: 11, leading: 15, color: '#1D1B2E', align: 'justify', weight: 400, spaceAfter: 6 },
  };
  const footer = [
    { type: 'line', x: 36, y: 800, w: 523, h: 0, stroke: '#E8307D', sw: 1 },
    { type: 'text', x: 36, y: 806, w: 523, h: 22, paras: [{ text: 'SUMMER MAGAZINE   ·   page <#>', style: 'Basic Paragraph', ov: { font: 'Montserrat', size: 9, leading: 12, color: '#808080', align: 'center' } }] },
  ];

  const LESSONS = [
    /* ================================================================ 1 */
    {
      id: 'id-01', title: 'Meet InDesign', sub: 'Pages, guides and the workspace', img: 'assets/img/id-interface.webp',
      mins: 8, color: '#E8307D', badge: { icon: '📰', name: 'Page Explorer' },
      setup: (ed) => ed.reset({
        name: 'summer-magazine', pages: 2, cols: 2, styles: STYLES, master: footer,
        items: [
          { type: 'image', page: 0, x: 36, y: 36, w: 523, h: 300, photo: 'beach' },
          { type: 'text', page: 0, x: 36, y: 352, w: 523, h: 64, paras: [{ text: 'Summer Escapes', style: 'Heading' }] },
          { type: 'text', page: 0, x: 36, y: 424, w: 523, h: 360, cols: 2, paras: body(5) },
          { type: 'text', page: 1, x: 36, y: 36, w: 523, h: 64, paras: [{ text: 'Into the Mountains', style: 'Heading' }] },
          { type: 'image', page: 1, x: 36, y: 110, w: 523, h: 260, photo: 'landscape' },
          { type: 'text', page: 1, x: 36, y: 386, w: 523, h: 400, cols: 2, paras: body(5) },
        ],
      }),
      steps: [
        {
          title: 'Welcome to InDesign! 📰', demo: 'id-welcome',
          body: `<p><b>Adobe InDesign</b> is the app for <b>page layout</b>: magazines, books, flyers, brochures, menus, CVs and posters with lots of text.</p>
                 <p>Illustrator draws, Photoshop edits photos, and InDesign <b>puts everything together on pages</b>.</p>
                 <p>On the right is a practice InDesign with a 2-page magazine.</p>`,
        },
        {
          title: 'The Pages panel', hl: ['tab-pages'],
          body: '<p>Documents can have many pages. The <b>Pages</b> panel shows them all as little thumbnails. Click a page to jump to it.</p><p>At the top is the <b>A-Master</b>: a template that every page uses (more about masters later).</p>',
          task: { text: 'Open the <b>Pages</b> panel and go to <b>page 2</b>.', check: (ed) => did(ed, 'pageSelect', (e) => e.i === 1) },
          ghost: [{ el: 'tab-pages' }, { click: 1 }, { el: 'page-2', wait: 1 }, { click: 1 }],
        },
        {
          title: 'Guides & Preview mode', demo: 'id-guides', hl: ['preview-btn'],
          body: '<ul><li><b style="color:#e05ad6">Magenta</b> = margins (keep text inside).</li><li><b style="color:#a48cff">Violet</b> = columns.</li><li><b style="color:#ff6b6b">Red</b> = bleed (for printing to the edge).</li></ul><p>These lines never print. Press <kbd>W</kbd> for <b>Preview mode</b> to see the clean page.</p>',
          task: { text: 'Turn on <b>Preview mode</b>.', check: (ed) => did(ed, 'preview', (e) => e.on) },
          ghost: [{ el: 'preview-btn' }, { click: 1 }],
        },
        {
          title: 'The workspace', demo: 'id-workspace', hl: ['menu-layout'],
          body: '<ol class="areas"><li><b>Menu Bar</b> — File, Layout, Type, Object…</li><li><b>Control Panel</b> — quick options for what you selected.</li><li><b>Tools</b> — left side.</li><li><b>Pages</b> on the pasteboard.</li><li><b>Panels</b> — Properties, Pages, Paragraph Styles, Swatches.</li></ol>',
          task: { text: 'Open the <b>Layout</b> menu.', check: (ed) => did(ed, 'menuOpen', (e) => e.menu === 'Layout') },
          ghost: [{ el: 'menu-layout' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'InDesign is best for…', options: ['Editing photos', 'Multi-page layouts like magazines and books', 'Animation'], answer: 1, explain: 'Yes! InDesign is the page-layout app.' },
        },
      ],
    },

    /* ================================================================ 2 */
    {
      id: 'id-02', title: 'Frames & Text', sub: 'Text frames, placeholder text and type settings', img: 'assets/img/id-text.webp',
      mins: 10, color: '#7C5CFF', badge: { icon: '🔠', name: 'Text Setter' },
      setup: (ed) => ed.reset({ name: 'text-practice', styles: STYLES }),
      steps: [
        {
          title: 'Text lives in frames', demo: 'id-textframe', hl: ['tool-type'],
          body: '<p>In InDesign, all text sits inside <b>text frames</b> (boxes). Choose the <b>Type Tool</b> <kbd>T</kbd>, <b>drag a box</b> on the page, then type.</p><p>Press <kbd>Esc</kbd> when you finish typing.</p>',
          task: { text: 'Draw a <b>text frame</b> with the Type Tool and type a title.', check: (ed) => did(ed, 'type') },
          ghost: [{ el: 'tool-type' }, { click: 1 }, { drag: [[60, 60], [520, 160]] }],
        },
        {
          title: 'Placeholder text', hl: ['menu-type'],
          body: '<p>Designers often don\'t have the real text yet. <b>Type › Fill with Placeholder Text</b> fills a frame with dummy text so you can design the layout first.</p>',
          task: { text: 'Draw a big text frame and fill it with <b>Placeholder Text</b>.', check: (ed) => did(ed, 'placeholder') },
          ghost: [{ el: 'menu-type' }, { click: 1 }],
        },
        {
          title: 'Font & size', hl: ['ctrl-font', 'ctrl-size'],
          body: '<p>Select a text frame with the <b>Selection Tool</b> <kbd>V</kbd> and change the <b>font</b> and <b>size</b> in the Control Panel at the top.</p><p class="tip">💡 <b>Leading</b> (↕) is the space between lines.</p>',
          task: { text: 'Change the <b>font</b> or the <b>size</b> of your text.', check: (ed) => did(ed, 'charProp', (e) => e.k === 'font' || e.k === 'size') },
        },
        {
          title: 'Alignment', hl: ['ctrl-align'],
          body: '<p>Paragraphs can be aligned <b>left</b>, <b>center</b>, <b>right</b> or <b>justified</b> (straight edges on both sides, like in newspapers).</p>',
          task: { text: '<b>Center</b> the text in one of your frames.', check: (ed) => did(ed, 'paraProp', (e) => e.k === 'align' && e.v === 'center') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'In InDesign, text is always inside a…', options: ['Layer', 'Text frame', 'Artboard'], answer: 1, explain: 'Correct — every piece of text lives in a text frame.' },
        },
      ],
    },

    /* ================================================================ 3 */
    {
      id: 'id-03', title: 'Photos in Frames', sub: 'Place, fit, fill and crop pictures', img: 'assets/img/id-images.webp',
      mins: 10, color: '#19C3B1', badge: { icon: '🖼️', name: 'Frame Master' },
      setup: (ed) => ed.reset({ name: 'photo-practice', styles: STYLES }),
      steps: [
        {
          title: 'Draw a picture frame', hl: ['[data-group="4"]'],
          body: '<p>Photos also live in frames. The <b>Rectangle Frame Tool</b> <kbd>F</kbd> draws an empty frame with an <b>✕</b> inside — the ✕ means "a picture goes here".</p>',
          task: { text: 'Draw an empty <b>picture frame</b> with the Rectangle Frame Tool.', check: (ed) => did(ed, 'create', (e) => e.frame) },
          ghost: [{ el: '[data-group="4"]' }, { click: 1 }, { drag: [[60, 60], [520, 360]] }],
        },
        {
          title: 'Place a photo', demo: 'id-placeimage', hl: ['menu-file'],
          body: `<p>With the frame selected, use <b>File › Place</b> (<kbd>${K}D</kbd>) and choose a photo. It goes <b>into</b> the frame.</p>`,
          task: { text: '<b>Place</b> a photo into your frame.', check: (ed) => did(ed, 'place', (e) => e.into) },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
        {
          title: 'Fit or fill', hl: ['prop-fitting'],
          body: '<ul><li><b>Fill Frame Proportionally</b> — the photo covers the whole frame (some edges are cut).</li><li><b>Fit Content Proportionally</b> — the whole photo is visible (maybe with empty space).</li></ul>',
          task: { text: 'Use a <b>Fitting</b> option on your photo.', check: (ed) => did(ed, 'fit') },
        },
        {
          title: 'Move the photo inside the frame', demo: 'id-direct', hl: ['tool-direct'],
          body: '<p>The frame is like a window. The <b>Direct Selection Tool</b> <kbd>A</kbd> moves the <b>photo behind the window</b> — this is how you crop in InDesign.</p>',
          task: { text: 'With the <b>Direct Selection Tool</b>, drag the photo inside its frame.', check: (ed) => did(ed, 'contentMove') },
          ghost: [{ el: 'tool-direct' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which tool moves the PHOTO inside its frame?', options: ['Selection Tool (V)', 'Direct Selection Tool (A)', 'Type Tool (T)'], answer: 1, explain: 'Yes — Direct Selection moves the content; Selection moves the whole frame.' },
        },
      ],
    },

    /* ================================================================ 4 */
    {
      id: 'id-04', title: 'Paragraph Styles', sub: 'Format once — update everywhere', img: 'assets/img/id-styles.webp',
      mins: 12, color: '#FFC93C', badge: { icon: '¶', name: 'Style Pro' },
      setup: (ed) => ed.reset({
        name: 'recipe-book', styles: { 'Body Text': STYLES['Body Text'] },
        items: [{ type: 'text', page: 0, x: 36, y: 36, w: 523, h: 760, paras: [
          { text: 'Pancakes', style: 'Basic Paragraph' }, { text: LOREM, style: 'Body Text' },
          { text: 'Fruit Salad', style: 'Basic Paragraph' }, { text: LOREM, style: 'Body Text' },
          { text: 'Smoothie', style: 'Basic Paragraph' }, { text: LOREM, style: 'Body Text' },
        ] }], select: 0, tab: 'styles',
      }),
      steps: [
        {
          title: 'Why styles?', demo: 'id-styles', hl: ['styles-list'],
          body: '<p>A cookbook has 100 recipe titles. Formatting each one by hand takes forever, and if the boss wants them blue… you\'d redo all 100! 😱</p><p>A <b>Paragraph Style</b> saves formatting with a name. Change the style once and <b>every paragraph using it updates</b>.</p>',
        },
        {
          title: 'Create a "Heading" style', hl: ['style-new'],
          body: '<ol><li>Click into the title <b>Pancakes</b> with the <b>Type Tool</b>.</li><li>Click <b>＋</b> at the bottom of the Paragraph Styles panel.</li><li>Name it <b>Heading</b>, pick a big bold font and a color, click OK.</li></ol>',
          task: { text: 'Create a new paragraph style for the recipe titles.', check: (ed) => did(ed, 'styleNew') },
        },
        {
          title: 'Apply it to the other titles',
          body: '<p>Click into <b>Fruit Salad</b> with the Type Tool and click your new style in the panel. Do the same for <b>Smoothie</b>.</p>',
          task: { text: '<b>Apply</b> your style to another title.', check: (ed) => did(ed, 'styleApply', (e) => e.sname !== 'Basic Paragraph' && e.sname !== 'Body Text') },
        },
        {
          title: 'The magic: edit the style ✨',
          body: '<p>Press <kbd>Esc</kbd> to stop typing. Now click <b>✎</b> next to your style and change its <b>color</b> or <b>size</b>. Watch every title change at once!</p>',
          task: { text: '<b>Edit</b> your paragraph style.', check: (ed) => did(ed, 'styleEdit', (e) => e.sname !== 'Basic Paragraph') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'You change the "Heading" paragraph style. What happens?', options: ['Only one heading changes', 'Every paragraph using "Heading" updates', 'Nothing happens'], answer: 1, explain: 'Exactly — that\'s the superpower of styles.' },
        },
      ],
    },

    /* ================================================================ 5 */
    {
      id: 'id-05', title: 'Threading & Overset Text', sub: 'Flow long text from frame to frame', img: 'assets/img/id-thread.webp',
      mins: 10, color: '#3B82F6', badge: { icon: '🧵', name: 'Text Threader' },
      setup: (ed) => ed.reset({
        name: 'article', pages: 2, cols: 2, styles: STYLES,
        items: [
          { type: 'text', page: 0, x: 36, y: 36, w: 523, h: 60, paras: [{ text: 'The Ocean Story', style: 'Heading' }] },
          { type: 'text', page: 0, x: 36, y: 110, w: 255, h: 690, paras: body(16) },
          { type: 'text', page: 0, x: 304, y: 110, w: 255, h: 690, paras: [{ text: '', style: 'Body Text' }] },
        ], select: 1,
      }),
      steps: [
        {
          title: 'Overset text ⊞', demo: 'id-thread',
          body: '<p>The left frame has <b>more text than fits</b>. See the small <b style="color:#ff6b6b">red ⊞</b> at its bottom-right corner? That means <b>overset text</b> — hidden text that doesn\'t fit. The status bar also says "● Overset text".</p><p>That little square is the <b>out port</b>. Click it with the <b>Selection Tool</b> to "load" the extra text.</p>',
          task: { text: 'Click the <b>red out port</b> of the left text frame.', check: (ed) => did(ed, 'portClick') },
        },
        {
          title: 'Thread into the next frame',
          body: '<p>Your cursor is now "loaded" with text. Click the <b>empty frame</b> on the right — the story flows into it. This is called <b>threading</b>.</p>',
          task: { text: 'Click the empty right frame to <b>thread</b> the text into it.', check: (ed) => did(ed, 'thread') },
        },
        {
          title: 'Make it all fit',
          body: '<p>Still a red ⊞? Thread again: click the new out port, go to <b>page 2</b>, and click on the empty page to create a new frame there. Or make the frames bigger.</p><p>When everything fits, the status bar turns <b style="color:#6bd66b">● No errors</b>.</p>',
          task: { text: 'Fix all overset text (status bar: <b>No errors</b>).', check: (ed) => !ed.anyOverset() },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'A red ⊞ on a text frame means…', options: ['The frame is locked', 'There is overset text that doesn\'t fit', 'The font is missing'], answer: 1, explain: 'Correct — the text needs more room or another threaded frame.' },
        },
      ],
    },

    /* ================================================================ 6 */
    {
      id: 'id-06', title: 'Text Wrap & Layout', sub: 'Wrap text around pictures, columns and alignment', img: 'assets/img/id-wrap.webp',
      mins: 10, color: '#FF5FA2', badge: { icon: '🌊', name: 'Layout Artist' },
      setup: (ed) => ed.reset({
        name: 'travel-page', styles: STYLES,
        items: [
          { type: 'text', page: 0, x: 36, y: 36, w: 523, h: 60, paras: [{ text: 'Up, Up and Away', style: 'Heading' }] },
          { type: 'text', page: 0, x: 36, y: 110, w: 523, h: 690, paras: body(10) },
          { type: 'image', page: 0, x: 120, y: 260, w: 260, h: 200, photo: 'balloon' },
        ], select: 2,
      }),
      steps: [
        {
          title: 'Text Wrap', demo: 'id-wrap', hl: ['prop-wrap'],
          body: '<p>The balloon photo is sitting <b>on top</b> of the text — you can\'t read it! <b>Text Wrap</b> pushes the text around the picture.</p><p>Select the photo and turn on <b>Wrap around bounding box</b> (Properties panel or Object › Text Wrap).</p>',
          task: { text: 'Turn on <b>Text Wrap</b> for the balloon photo.', check: (ed) => did(ed, 'wrap', (e) => e.on) },
        },
        {
          title: 'Columns', hl: ['prop-columns'],
          body: '<p>Long lines are tiring to read. Split the body text into <b>2 columns</b>: select the text frame and set <b>Columns</b> in Text Frame Options (Properties).</p>',
          task: { text: 'Give the body text frame <b>2 columns</b>.', check: (ed) => did(ed, 'frameCols', (e) => e.cols >= 2) },
        },
        {
          title: 'Align to the page', hl: ['prop-align'],
          body: '<p>Select the photo and use <b>Align › Horizontal Center</b> to put it exactly in the middle of the page.</p>',
          task: { text: '<b>Center</b> the photo horizontally on the page.', check: (ed) => did(ed, 'align', (e) => e.how === 'hcenter') },
        },
        {
          title: 'Margins & Columns', hl: ['menu-layout'],
          body: '<p><b>Layout › Margins and Columns</b> changes the guides of the page. Try 3 columns or bigger margins.</p>',
          task: { text: 'Change the page guides with <b>Margins and Columns</b>.', check: (ed) => did(ed, 'margins') },
          ghost: [{ el: 'menu-layout' }, { click: 1 }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What does Text Wrap do?', options: ['Makes text bigger', 'Pushes text around an object', 'Changes the font'], answer: 1, explain: 'Yes — text flows around the picture instead of under it.' },
        },
      ],
    },

    /* ================================================================ 7 */
    {
      id: 'id-07', title: 'Master Pages & Page Numbers', sub: 'Things that repeat on every page', img: 'assets/img/id-master.webp',
      mins: 10, color: '#8B5CF6', badge: { icon: '🔢', name: 'Master Builder' },
      setup: (ed) => ed.reset({
        name: 'booklet', pages: 3, styles: STYLES,
        items: [0, 1, 2].map((i) => ({ type: 'text', page: i, x: 36, y: 36, w: 523, h: 700, paras: [{ text: ['Chapter One', 'Chapter Two', 'Chapter Three'][i], style: 'Heading' }, ...body(3)] })),
        tab: 'pages',
      }),
      steps: [
        {
          title: 'Add a page', hl: ['page-add'],
          body: '<p>Books and magazines grow page by page. Click <b>＋</b> at the bottom of the Pages panel to add a page.</p>',
          task: { text: 'Add a new <b>page</b>.', check: (ed) => did(ed, 'pageAdd') },
          ghost: [{ el: 'tab-pages' }, { click: 1 }, { el: 'page-add', wait: 1 }, { click: 1 }],
        },
        {
          title: 'The A-Master', demo: 'id-master', hl: ['master-a'],
          body: '<p>A <b>master page</b> is a template: anything you put on it appears on <b>every page</b> that uses it — logos, footers, page numbers.</p><p>Click <b>A-Master</b> in the Pages panel to edit it.</p>',
          task: { text: 'Open the <b>A-Master</b>.', check: (ed) => did(ed, 'masterEdit') },
          ghost: [{ el: 'master-a', wait: 1 }, { click: 1 }],
        },
        {
          title: 'Automatic page numbers', hl: ['menu-type'],
          body: '<ol><li>On the master, draw a small text frame at the <b>bottom</b> of the page with the Type Tool.</li><li>Choose <b>Type › Insert Special Character › Markers › Current Page Number</b>.</li></ol><p>On the master it shows <b>A</b>. On real pages it becomes 1, 2, 3…</p>',
          task: { text: 'Insert a <b>Current Page Number</b> marker on the master.', check: (ed) => did(ed, 'pageNumber', (e) => e.master) },
        },
        {
          title: 'Back to the pages',
          body: '<p>Click any page in the Pages panel. Every page now has its own number — automatically! 🎉</p>',
          task: { text: 'Go back to a normal <b>page</b> and look at the page numbers.', check: (ed) => did(ed, 'pageSelect') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Where should you put a page number so it appears on every page?', options: ['On page 1 only', 'On the master page', 'In a paragraph style'], answer: 1, explain: 'Right — master page items repeat on every page.' },
        },
      ],
    },

    /* ================================================================ 8 */
    {
      id: 'id-08', title: 'Final Project: Event Flyer', sub: 'Design and export a print-ready flyer', img: 'assets/img/id-final.webp',
      mins: 20, color: '#F59E0B', badge: { icon: '🏆', name: 'Layout Legend' }, final: true,
      setup: (ed) => ed.reset({ name: 'event-flyer', styles: STYLES }),
      steps: [
        {
          title: 'The brief 🎉', demo: 'id-flyer',
          body: '<p>Your school is having a <b>Summer Festival</b> and needs an A4 flyer. Big photo, bold title, some info text, a colored bar at the bottom — then a <b>PDF</b> for the printer.</p>',
        },
        {
          title: 'Set up the grid',
          body: '<p><b>Layout › Margins and Columns</b>: choose <b>2 columns</b> so your text has a nice structure.</p>',
          task: { text: 'Set the page to <b>2 or more columns</b>.', check: (ed) => did(ed, 'margins', (e) => e.cols >= 2) },
        },
        {
          title: 'Hero photo',
          body: '<p>Draw a big frame across the top (Rectangle Frame Tool <kbd>F</kbd>) and <b>Place</b> a photo into it.</p>',
          task: { text: 'Place a <b>photo</b> into a frame.', check: (ed) => did(ed, 'place') },
        },
        {
          title: 'The headline',
          body: '<p>Add a big title like <b>SUMMER FEST</b> and style it: a bold font, a big size, a bright color.</p>',
          task: { text: 'Add a <b>title</b> and change its font or size.', check: (ed) => did(ed, 'type') && (did(ed, 'charProp') || did(ed, 'styleApply') || did(ed, 'styleNew')) },
        },
        {
          title: 'Info text',
          body: '<p>Draw a text frame across both columns, give it <b>2 columns</b> and fill it with placeholder text (or write the real date, time and place!).</p>',
          task: { text: 'Add body text with <b>placeholder</b> text.', check: (ed) => did(ed, 'placeholder') || did(ed, 'type') },
        },
        {
          title: 'Color bar',
          body: '<p>Draw a <b>rectangle</b> (<kbd>M</kbd>) along the bottom and give it a color from the <b>Swatches</b>.</p>',
          task: { text: 'Draw a rectangle and give it a <b>swatch color</b>.', check: (ed) => did(ed, 'fill') },
        },
        {
          title: 'Export the PDF 🚀', demo: 'id-pdf', hl: ['menu-file'],
          body: `<p>Printers want a <b>PDF</b>. Choose <b>File › Export › Adobe PDF (Print)</b> (<kbd>${K}E</kbd>).</p>`,
          task: { text: 'Export your flyer as a <b>PDF</b>.', check: (ed) => did(ed, 'export', (e) => e.format === 'pdf') },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
      ],
    },
  ];

  window.DQCourses.push({ id: 'indesign', name: 'Adobe InDesign', short: 'Id', tag: 'Page layout · Magazines · Flyers', color: '#FF3366', bg: '#49021F', status: 'open', lessons: LESSONS, editor: 'id', img: 'assets/img/id-course.webp', goal: 'from zero to your first print-ready flyer', skills: 'Pages · Frames · Text · Photos · Styles · Threading · Masters · PDF' });
})();
