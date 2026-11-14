/* =========================================================================
   DesignQuest — Adobe After Effects course content (motion graphics)
   Same step format as js/lessons.js. The practice workspace is AEEditor.
   ========================================================================= */
(function () {
  'use strict';
  const did = (ed, n, f) => ed.did(n, f);
  const K = window.AEEditor ? window.AEEditor.CMD : 'Ctrl+';
  const L = (ed, n) => ed.layerNamed(n);
  const keys = (ed, n, path) => ed.keys(L(ed, n), path);
  const anyKeys = (ed, path, min = 2) => ed.layers.some((l) => ed.keys(l, path).length >= min);
  const range = (ks, i) => { const v = ks.map((k) => (Array.isArray(k.v) ? k.v[i || 0] : k.v)); return v.length ? Math.max(...v) - Math.min(...v) : 0; };
  const NAVY = '#14142B';

  const ball = (extra = {}) => ({ kind: 'shape', shape: 'ellipse', name: 'Ball', size: [110, 110], fill: '#FF7A59', props: { position: [170, 300] }, ...extra });

  const LESSONS = [
    /* ================================================================ 1 */
    {
      id: 'ae-01', title: 'Meet After Effects', sub: 'What motion graphics are & how to play them', img: 'assets/img/ae-interface.webp',
      mins: 8, color: '#9999FF', badge: { icon: '🎬', name: 'Motion Explorer' },
      setup: (ed) => ed.reset({
        bg: '#1D1B4B',
        layers: [
          { kind: 'text', name: 'Hello, Motion!', text: 'Hello, Motion!', fsize: 70, color: '#FFFFFF', props: { position: [480, 445] }, keys: { reveal: [[1.4, 0], [2.6, 100]] } },
          { kind: 'shape', shape: 'star', name: 'Star', size: [70, 70], fill: '#FFC93C', props: { position: [150, 110] }, keys: { rotation: [[0, 0, 1], [5, 360, 1]], scale: [[0, [0, 0]], [0.6, [120, 120], 1], [0.9, [100, 100], 1]] } },
          { kind: 'shape', shape: 'ellipse', name: 'Sun', size: [190, 190], fill: '#FF7A59', props: { position: [480, 330] }, keys: { position: [[0, [480, 640]], [1.6, [480, 250], 1]] }, effects: ['glow'] },
          { kind: 'shape', shape: 'rect', name: 'Hills', size: [980, 190], fill: '#19C3B1', props: { position: [480, 470] } },
        ],
      }),
      steps: [
        {
          title: 'Welcome to After Effects! 🎬', demo: 'ae-welcome',
          body: `<p><b>Adobe After Effects</b> makes things <b>move</b>: animated logos, YouTube intros, titles, social media videos, cartoon effects… This is called <b>motion graphics</b>.</p>
                 <p>On the right is a <b>practice After Effects</b> with a little animation already inside. Nothing can break — explore! 💪</p>
                 <p class="tip">💡 Illustrator = drawings. Photoshop = photos. After Effects = <b>animation &amp; video</b>.</p>`,
        },
        {
          title: 'Press play ▶', hl: ['play-btn'],
          body: `<p>Animations happen over <b>time</b>. Press <kbd>Space</kbd> (or the ▶ button in the Preview panel) to play the composition. Press <kbd>Space</kbd> again to stop.</p>`,
          task: { text: 'Press <kbd>Space</kbd> to <b>play</b> the animation.', hint: 'Click on the workspace first, then press the Space bar. Or click ▶ in the Preview panel (right).', check: (ed) => did(ed, 'play') },
          ghost: [{ el: 'play-btn' }, { click: 1 }],
        },
        {
          title: 'The Timeline & the playhead', demo: 'cti', hl: ['time-ruler'],
          body: `<p>The <b>Timeline</b> (bottom) shows time from left to right. The blue line is the <b>Current Time Indicator</b> — the "playhead". Drag it to move through the animation slowly (this is called <b>scrubbing</b>).</p>
                 <p>The big blue number is the <b>timecode</b>: <code>0:00:02:15</code> = 2 seconds and 15 frames.</p>`,
          task: { text: '<b>Drag</b> along the time ruler (the top of the timeline) to scrub through time.', hint: 'Press and drag left/right on the strip with 0s 1s 2s… at the top of the timeline.', check: (ed) => did(ed, 'scrub') },
          ghost: [{ el: 'time-ruler' }, { click: 1 }],
        },
        {
          title: 'The 5 main areas', demo: 'ae-workspace', hl: ['menu-composition'],
          body: `<ol class="areas"><li><b>Toolbar</b> — tools across the top.</li><li><b>Project</b> — your files (footage, images).</li><li><b>Composition</b> — the video screen.</li><li><b>Effects &amp; Presets</b> — ready-made animations and effects.</li><li><b>Timeline</b> — layers and keyframes over time. ⏱</li></ol>`,
          task: { text: 'Open the <b>Composition</b> menu at the top.', hint: 'Top bar: File · Edit · <b>Composition</b> · Layer…', check: (ed) => did(ed, 'menuOpen', (e) => e.menu === 'Composition') },
          ghost: [{ el: 'menu-composition' }, { click: 1 }],
        },
        {
          title: 'Frames per second',
          body: '<p>A video is many still pictures shown very fast — like a flip book. 📖 This composition plays <b>30 frames per second</b>.</p><p>Press <kbd>Page Down</kbd> to go forward one frame, <kbd>Page Up</kbd> to go back. Watch the timecode change.</p>',
          task: { text: 'Step <b>one frame</b> at a time (Page Down or the ⏩ button).', hint: 'In the Preview panel click ⏩ (next frame).', check: (ed) => ed.time > 0 && (did(ed, 'time') || did(ed, 'scrub')) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which key plays and stops the animation?', options: ['Enter', 'Space', 'Delete'], answer: 1, explain: 'Yes! Space = play / stop.' },
        },
      ],
    },

    /* ================================================================ 2 */
    {
      id: 'ae-02', title: 'Keyframes 101', sub: 'The magic of animation: start, end, play', img: 'assets/img/ae-keyframes.webp',
      mins: 12, color: '#FF7A59', badge: { icon: '🔶', name: 'Keyframe Kid' },
      setup: (ed) => ed.reset({ bg: NAVY, layers: [ball()], select: 0 }),
      steps: [
        {
          title: 'What is a keyframe?', demo: 'keyframes', hl: ['twirl-1'],
          body: '<p>A <b>keyframe</b> ◆ saves a value at one moment in time: "at 0 seconds the ball is on the <b>left</b>".</p><p>Add a second keyframe: "at 2 seconds the ball is on the <b>right</b>". After Effects automatically animates everything in between!</p><p>First, open the ball\'s properties: click the little <b>▸ arrow</b> next to the layer (or press <kbd>P</kbd> for Position).</p>',
          task: { text: 'Open the <b>Ball</b> layer\'s properties (click ▸ or press <kbd>P</kbd>).', hint: 'In the timeline, click the small triangle ▸ left of the number 1.', check: (ed) => did(ed, 'twirl', (e) => e.open) || did(ed, 'reveal') },
          ghost: [{ el: 'twirl-1' }, { click: 1 }],
        },
        {
          title: 'Click the stopwatch ⏱', demo: 'stopwatch', hl: ['sw-position'],
          body: '<p>Make sure the playhead is at <b>0s</b>. Click the <b>stopwatch ⏱</b> next to <b>Position</b>. It turns blue and a ◆ keyframe appears on the timeline.</p><p>That means: "Position is now animated — remember where the ball is right now."</p>',
          task: { text: 'Click the <b>stopwatch</b> next to <b>Position</b>.', hint: 'In the Position row of the timeline, click the small clock icon.', check: (ed) => did(ed, 'stopwatch', (e) => e.path === 'position' && e.on) },
          ghost: [{ el: 'sw-position', wait: 1 }, { click: 1 }],
        },
        {
          title: 'Move in time, then move the ball',
          body: '<p>Now drag the playhead to <b>2 seconds</b>. Then drag the ball to the <b>right side</b> of the screen (or change the blue Position numbers).</p><p>A second ◆ appears automatically — you just made an animation! 🎉</p>',
          task: { text: 'Go to <b>2s</b>, then move the ball to the right to make a <b>second keyframe</b>.', hint: 'Drag on the time ruler to 2s. Then with the Selection tool (V) drag the ball in the viewer.', check: (ed) => keys(ed, 'Ball', 'position').length >= 2 && range(keys(ed, 'Ball', 'position'), 0) > 150 },
          ghost: [{ el: 'time-ruler' }, { drag: [[170, 300], [790, 300]] }],
        },
        {
          title: 'Watch it move ▶', hl: ['play-btn'],
          body: '<p>Press <kbd>Space</kbd> to play. The ball slides from the first keyframe to the second. The dotted line in the viewer is the <b>motion path</b>.</p>',
          task: { text: 'Press <kbd>Space</kbd> to play your animation.', hint: 'Click the workspace, then press Space.', check: (ed) => did(ed, 'play') },
        },
        {
          title: 'Add a third keyframe',
          body: '<p>More keyframes = more movement. Go to <b>4s</b> and move the ball <b>up</b> or somewhere new.</p><p class="tip">💡 <kbd>J</kbd> and <kbd>K</kbd> jump to the previous / next keyframe.</p>',
          task: { text: 'Make <b>3 or more</b> Position keyframes.', hint: 'Drag the playhead to 4s, then drag the ball to a new place.', check: (ed) => keys(ed, 'Ball', 'position').length >= 3 },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What turns on animation for a property?', options: ['The eye 👁', 'The stopwatch ⏱', 'The lock 🔒'], answer: 1, explain: 'Correct! Click the stopwatch to start making keyframes.' },
        },
      ],
    },

    /* ================================================================ 3 */
    {
      id: 'ae-03', title: 'Transform Properties', sub: 'Scale, Rotation, Opacity & the Anchor Point', img: 'assets/img/ae-transform.webp',
      mins: 12, color: '#FFC93C', badge: { icon: '🌀', name: 'Transformer' },
      setup: (ed) => ed.reset({ bg: NAVY, layers: [{ kind: 'shape', shape: 'star', name: 'Star', size: [200, 200], fill: '#FFC93C' }], select: 0 }),
      steps: [
        {
          title: 'Scale (S) — pop!', demo: 'ae-scale', hl: ['sw-scale'],
          body: '<p>Every layer has 5 <b>Transform</b> properties. Press <kbd>S</kbd> to show only <b>Scale</b>.</p><ol><li>At 0s: stopwatch ⏱ on Scale, set it to <b>0%</b>.</li><li>At 1s: set it to <b>100%</b>.</li></ol><p class="tip">💡 Drag the blue numbers left/right to change them — or click to type.</p>',
          task: { text: 'Animate the star\'s <b>Scale</b> (2 keyframes with different values).', hint: 'Press S. Click the Scale stopwatch at 0s and type 0. Move to 1s and type 100.', check: (ed) => keys(ed, 'Star', 'scale').length >= 2 && range(keys(ed, 'Star', 'scale')) > 20 },
          ghost: [{ el: 'sw-scale', wait: 1 }, { click: 1 }],
        },
        {
          title: 'Rotation (R) — spin!', demo: 'ae-rotate', hl: ['sw-rotation'],
          body: '<p>Press <kbd>R</kbd> for <b>Rotation</b>. Animate it from <b>0°</b> to <b>360°</b> for one full spin. You can also use the <b>Rotation Tool</b> <kbd>W</kbd> and drag in the viewer.</p>',
          task: { text: 'Animate <b>Rotation</b> by at least <b>90°</b>.', hint: 'Press R → stopwatch at 0s → move to 2s → drag the blue number to 360.', check: (ed) => range(keys(ed, 'Star', 'rotation')) >= 90 },
        },
        {
          title: 'Opacity (T) — fade!', demo: 'ae-opacity', hl: ['sw-opacity'],
          body: '<p>Press <kbd>T</kbd> for <b>Opacity</b> (T for "Transparency"). 0% = invisible, 100% = solid.</p>',
          task: { text: 'Make the star <b>fade in</b>: Opacity keyframes from <b>0%</b> to 100%.', hint: 'Press T → stopwatch at 0s → type 0 → move to 1s → type 100.', check: (ed) => keys(ed, 'Star', 'opacity').length >= 2 && keys(ed, 'Star', 'opacity').some((k) => k.v <= 10) },
        },
        {
          title: 'The Anchor Point ⊕', demo: 'anchor-point', hl: ['tool-anchor'],
          body: '<p>The <b>anchor point</b> ⊕ is the center that a layer spins and scales around. Move it with the <b>Pan Behind Tool</b> <kbd>Y</kbd>: drag the ⊕ in the viewer.</p><p>Move it to a tip of the star and play — now it spins around that point!</p>',
          task: { text: 'Use the <b>Pan Behind Tool</b> <kbd>Y</kbd> to move the anchor point.', hint: 'Press Y, then drag on the star in the viewer.', check: (ed) => did(ed, 'anchor', (e) => !e.center) },
          ghost: [{ el: 'tool-anchor' }, { click: 1 }, { drag: [[480, 270], [480, 180]] }],
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which key shows the Opacity property?', options: ['O', 'T', 'P'], answer: 1, explain: 'T for Transparency! (P = Position, S = Scale, R = Rotation, A = Anchor)' },
        },
      ],
    },

    /* ================================================================ 4 */
    {
      id: 'ae-04', title: 'Easing: Smooth Motion', sub: 'Easy Ease, timing and a bouncing ball', img: 'assets/img/ae-easing.webp',
      mins: 10, color: '#19C3B1', badge: { icon: '🏀', name: 'Smooth Mover' },
      setup: (ed) => ed.reset({
        bg: NAVY,
        layers: [
          ball({ name: 'Ball', props: { position: [150, 220] }, keys: { position: [[0, [150, 220]], [2, [810, 220]]] }, _open: true, _only: ['position'] }),
          { kind: 'shape', shape: 'ellipse', name: 'Linear Ball', size: [70, 70], fill: '#777777', props: { position: [150, 400] }, keys: { position: [[0, [150, 400]], [2, [810, 400]]] } },
          { kind: 'text', name: 'label', text: 'linear (robot) ↓', fsize: 26, fweight: 600, color: '#9a9ab8', props: { position: [480, 330] } },
        ],
        select: 0,
      }),
      steps: [
        {
          title: 'Robot motion vs real motion', demo: 'easing', hl: ['row-position'],
          body: '<p>Play the animation. Both balls move at the <b>same speed</b> the whole time — that\'s called <b>linear</b>. It looks robotic. 🤖</p><p>Real things <b>speed up</b> and <b>slow down</b>. That\'s called <b>easing</b>.</p><p>First, <b>select both keyframes</b> of the orange Ball: click one ◆, then <kbd>Shift</kbd>+click the other.</p>',
          task: { text: 'Select <b>both Position keyframes</b> of the orange Ball.', hint: 'In the timeline click the first ◆ on the Position row, then Shift+click the second ◆.', check: (ed) => ed.selKeys.size >= 2 },
        },
        {
          title: 'Easy Ease (F9) ✨', hl: ['menu-animation'],
          body: '<p>Press <kbd>F9</kbd> (or <b>Animation › Keyframe Assistant › Easy Ease</b>). The diamonds change shape — they are now <b>eased</b>.</p>',
          task: { text: 'Apply <b>Easy Ease</b> to the selected keyframes.', hint: 'Press F9 on your keyboard (Mac: fn+F9), or use the Animation menu.', check: (ed) => did(ed, 'ease') },
          ghost: [{ el: 'menu-animation' }, { click: 1 }],
        },
        {
          title: 'Compare ▶',
          body: '<p>Play it again and compare the two balls. The orange one starts <b>slowly</b>, speeds up, then <b>gently stops</b>. So much better! 😍</p>',
          task: { text: 'Press <kbd>Space</kbd> and compare the two balls.', hint: 'Click the workspace, then Space.', check: (ed) => did(ed, 'play') },
        },
        {
          title: 'Timing = speed',
          body: '<p>Keyframes <b>close together</b> = <b>fast</b> movement. Far apart = slow.</p><p>Drag the second ◆ of the orange Ball to the <b>left</b> (closer to the first) to make it faster.</p>',
          task: { text: '<b>Drag a keyframe</b> in the timeline to change the timing.', hint: 'Press and drag a ◆ left or right on the timeline.', check: (ed) => did(ed, 'keyMove') },
        },
        {
          title: 'Bounce! 🏀', demo: 'bounce', hl: ['preset-bounce', 'tab-effects'],
          body: '<p>A bounce is many eased keyframes. Let\'s use a ready-made <b>Animation Preset</b>!</p><p>Select the orange Ball, go to time <b>0s</b>, then click <b>Bounce Drop</b> in <b>Effects &amp; Presets</b>.</p>',
          task: { text: 'Apply the <b>Bounce Drop</b> preset to the Ball and play it.', hint: 'Right panel → Effects & Presets → Animation Presets → Bounce Drop.', check: (ed) => did(ed, 'preset', (e) => e.id === 'bounce') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Keyframes that are CLOSE together make the motion…', options: ['Slower', 'Faster', 'Invisible'], answer: 1, explain: 'Right — less time to travel the same distance = faster!' },
        },
      ],
    },

    /* ================================================================ 5 */
    {
      id: 'ae-05', title: 'Shapes & Text', sub: 'Draw shape layers and animate titles', img: 'assets/img/ae-text.webp',
      mins: 10, color: '#FF5FA2', badge: { icon: '⌨️', name: 'Title Maker' },
      setup: (ed) => ed.reset({ bg: NAVY }),
      steps: [
        {
          title: 'Draw a shape layer', demo: 'draw-rect', hl: ['[data-group="5"]'],
          body: '<p>The <b>Shape tools</b> <kbd>Q</kbd> draw vector shape layers right in After Effects. <b>Press and hold</b> the Rectangle tool to find the <b>Star</b> and <b>Ellipse</b>.</p>',
          task: { text: 'Find the <b>Star Tool</b> and drag in the viewer to draw a star.', hint: 'Hold the mouse on the rectangle icon in the top toolbar → Star Tool → drag in the viewer.', check: (ed) => did(ed, 'create', (e) => e.shape === 'star') },
          ghost: [{ el: '[data-group="5"]' }, { hold: 1 }, { el: 'fly-star', wait: 1 }],
        },
        {
          title: 'Change its color', hl: ['tab-properties', 'prop-shape'],
          body: '<p>Open the <b>Properties</b> tab (right) and pick a new <b>Fill</b> color for your star.</p>',
          task: { text: 'Change the star\'s <b>fill color</b>.', hint: 'Right panel → Properties → click a color swatch next to Fill.', check: (ed) => did(ed, 'layerProp', (e) => e.k === 'fill') },
          ghost: [{ el: 'tab-properties' }, { click: 1 }],
        },
        {
          title: 'Add a title', hl: ['tool-type'],
          body: `<p>Choose the <b>Type Tool</b> (<kbd>${K}T</kbd>), click in the viewer and type a title. Press <kbd>Esc</kbd> when done.</p>`,
          task: { text: 'Make a <b>text layer</b> with your name or a title.', hint: 'Click the T icon in the toolbar → click in the viewer → type → Esc.', check: (ed) => did(ed, 'type') },
          ghost: [{ el: 'tool-type' }, { click: 1 }, { doc: [300, 420] }, { click: 1 }],
        },
        {
          title: 'Typewriter effect ⌨️', demo: 'typewriter', hl: ['preset-typewriter'],
          body: '<p>Go to <b>0s</b>, keep your text layer selected and click <b>Typewriter</b> in Effects &amp; Presets. The letters will appear one by one!</p>',
          task: { text: 'Apply the <b>Typewriter</b> preset to your text, then play it.', hint: 'Effects & Presets tab → Animation Presets → Typewriter.', check: (ed) => did(ed, 'preset', (e) => e.id === 'typewriter') },
        },
        {
          title: 'Text color', hl: ['prop-text'],
          body: '<p>Select the text layer and change its <b>color</b> in the Properties panel.</p>',
          task: { text: 'Change your text\'s <b>color</b>.', hint: 'Properties → Text → click a color swatch.', check: (ed) => did(ed, 'layerProp', (e) => e.k === 'color') },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'Which tool draws a star shape layer?', options: ['Type Tool', 'Shape tools (Q)', 'Hand Tool'], answer: 1, explain: 'Yes! Q = shape tools: Rectangle, Ellipse, Star.' },
        },
      ],
    },

    /* ================================================================ 6 */
    {
      id: 'ae-06', title: 'Effects & Presets', sub: 'Fade, glow, shadow and blur in seconds', img: 'assets/img/ae-effects.webp',
      mins: 10, color: '#8B5CF6', badge: { icon: '✨', name: 'Effects Wizard' },
      setup: (ed) => ed.reset({ bg: '#0D0D22', layers: [{ kind: 'text', name: 'GLOW UP', text: 'GLOW UP', font: 'Bebas Neue', fweight: 400, fsize: 150, color: '#FFC93C' }], select: 0 }),
      steps: [
        {
          title: 'Fade In preset', demo: 'fade-in', hl: ['preset-fade-in'],
          body: '<p><b>Animation Presets</b> are ready-made animations. Apply one and After Effects makes the keyframes for you!</p><p>At <b>0s</b>, with the text selected, click <b>Fade In</b>.</p>',
          task: { text: 'Apply the <b>Fade In</b> preset to the text.', hint: 'Effects & Presets → Animation Presets → Fade In.', check: (ed) => did(ed, 'preset', (e) => e.id === 'fade-in') },
          ghost: [{ el: 'tab-effects' }, { click: 1 }, { el: 'preset-fade-in', wait: 1 }],
        },
        {
          title: 'Drop Shadow', hl: ['fx-shadow'],
          body: '<p><b>Effects</b> change how a layer looks. Find <b>Perspective › Drop Shadow</b> in Effects &amp; Presets and click it.</p>',
          task: { text: 'Add a <b>Drop Shadow</b> effect.', hint: 'Effects & Presets → Perspective → Drop Shadow.', check: (ed) => did(ed, 'effect', (e) => e.fx === 'shadow') },
        },
        {
          title: 'Glow ✨', demo: 'glow-fx', hl: ['fx-glow'],
          body: '<p><b>Stylize › Glow</b> makes things shine like neon signs. You can pick the glow color in the Properties panel.</p>',
          task: { text: 'Add a <b>Glow</b> effect.', hint: 'Effects & Presets → Stylize → Glow.', check: (ed) => did(ed, 'effect', (e) => e.fx === 'glow') },
        },
        {
          title: 'Animate an effect: blur in', demo: 'blur-in', hl: ['fx-blur'],
          body: '<p>Effects have properties too — and they can be <b>animated</b> with the stopwatch!</p><ol><li>Add <b>Gaussian Blur</b>.</li><li>At 0s: stopwatch on <b>Blurriness</b>, set <b>40</b>.</li><li>At 1s: set <b>0</b>.</li></ol><p class="tip">💡 Shortcut: the <b>Blur In</b> preset does this for you.</p>',
          task: { text: 'Animate a <b>Gaussian Blur</b> (2 or more Blurriness keyframes).', hint: 'Add Gaussian Blur, open the layer (▸), click the Blurriness stopwatch, change the value at another time.', check: (ed) => ed.layers.some((l) => (l.fx || []).some((f) => f.type === 'blur' && f.props.blur.k && f.props.blur.k.length >= 2)) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'What is an Animation Preset?', options: ['A ready-made animation you can apply', 'A type of font', 'A file format'], answer: 0, explain: 'Exactly — presets add keyframes for you in one click.' },
        },
      ],
    },

    /* ================================================================ 7 */
    {
      id: 'ae-07', title: 'Layers, Timing & Parenting', sub: 'Make layers follow each other and start later', img: 'assets/img/ae-parenting.webp',
      mins: 10, color: '#3B82F6', badge: { icon: '🪐', name: 'Orbit Master' },
      setup: (ed) => ed.reset({
        bg: '#0D0D22',
        layers: [
          { kind: 'text', name: 'Space Trip', text: 'SPACE TRIP', font: 'Bebas Neue', fweight: 400, fsize: 90, color: '#FFFFFF', props: { position: [480, 70] }, keys: { opacity: [[0, 0], [0.6, 100, 1]] } },
          { kind: 'shape', shape: 'ellipse', name: 'Moon', size: [60, 60], fill: '#DDDDDD', props: { position: [680, 300] } },
          { kind: 'shape', shape: 'ellipse', name: 'Planet', size: [170, 170], fill: '#7C5CFF', props: { position: [480, 300] }, keys: { rotation: [[0, 0], [5, 360]] } },
        ],
      }),
      steps: [
        {
          title: 'Parenting 🔗', demo: 'parenting', hl: ['parent-2'],
          body: '<p>The planet spins, but the moon just sits there. 😴 Let\'s make the moon <b>follow</b> the planet!</p><p><b>Parenting</b> links a child layer to a parent: when the parent moves or rotates, the child goes with it.</p><p>In the timeline, set the <b>Moon</b>\'s <b>Parent &amp; Link</b> to <b>Planet</b>.</p>',
          task: { text: 'Set the Moon\'s <b>Parent</b> to <b>Planet</b>.', hint: 'Timeline → Moon row → the "Parent & Link" menu on the right side of the layer list → choose Planet.', check: (ed) => { const m = L(ed, 'Moon'), p = L(ed, 'Planet'); return m && p && m.parent === p.id; } },
        },
        {
          title: 'Watch the orbit ▶',
          body: '<p>Play it! The moon now <b>orbits</b> the planet because it follows the planet\'s rotation. 🌍🌙</p>',
          task: { text: 'Press <kbd>Space</kbd> to watch the moon orbit.', hint: 'Click the workspace, then press Space.', check: (ed) => did(ed, 'play') },
        },
        {
          title: 'Layer timing', demo: 'layer-timing', hl: ['layer-1'],
          body: '<p>Each colored bar in the timeline shows <b>when</b> a layer is visible. Drag the <b>SPACE TRIP</b> bar to the right so the title appears <b>later</b>.</p><p class="tip">💡 Drag the ends of a bar to trim it.</p>',
          task: { text: 'Drag the title\'s <b>layer bar</b> so it starts later.', hint: 'Press in the middle of the colored bar on layer 1 and drag right.', check: (ed) => did(ed, 'layerTime') },
        },
        {
          title: 'Duplicate', hl: ['layer-2'],
          body: `<p>Select the Moon and press <kbd>${K}D</kbd> to <b>duplicate</b> it. Then drag the copy somewhere else — it\'s still parented, so it orbits too!</p>`,
          task: { text: 'Duplicate the Moon with <kbd>' + K + 'D</kbd>.', hint: 'Click the Moon row in the timeline, then press ' + K + 'D (or Edit › Duplicate).', check: (ed) => did(ed, 'layerDup') },
        },
        {
          title: 'Hide a layer 👁',
          body: '<p>The eye 👁 on the left of each layer hides or shows it — great for checking your work.</p>',
          task: { text: '<b>Hide</b> any layer with its eye.', hint: 'Click the 👁 at the far left of a layer row.', check: (ed) => did(ed, 'layerVis', (e) => !e.visible) },
        },
        {
          title: 'Quick check ✅',
          quiz: { q: 'If the Moon\'s parent is the Planet and the Planet rotates…', options: ['The Moon disappears', 'The Moon rotates with it', 'Nothing happens'], answer: 1, explain: 'Yes! Children follow their parent\'s position, scale and rotation.' },
        },
      ],
    },

    /* ================================================================ 8 */
    {
      id: 'ae-08', title: 'Final Project: Animated Intro', sub: 'Make a 5-second intro for your channel', img: 'assets/img/ae-final.webp',
      mins: 20, color: '#F59E0B', badge: { icon: '🏆', name: 'Motion Legend' }, final: true,
      setup: (ed) => ed.reset({ bg: NAVY }),
      steps: [
        {
          title: 'The brief 🎥', demo: 'ae-intro',
          body: '<p>Let\'s make a <b>5-second intro</b> for a YouTube channel (yours!). A logo pops in, the title types on, everything glows. Use your own colors and style!</p>',
        },
        {
          title: 'Background color', hl: ['menu-composition'],
          body: `<p>Open <b>Composition › Composition Settings</b> (<kbd>${K}K</kbd>) and choose a <b>background color</b>.</p>`,
          task: { text: 'Change the composition <b>background color</b>.', hint: 'Composition menu → Composition Settings → Background → OK.', check: (ed) => did(ed, 'compSettings') },
          ghost: [{ el: 'menu-composition' }, { click: 1 }],
        },
        {
          title: 'Logo that pops 💥',
          body: '<p>Draw a shape for your logo (ellipse, star, rectangle). Go to <b>0s</b> and apply the <b>Pop In</b> preset.</p>',
          task: { text: 'Draw a shape and apply the <b>Pop In</b> preset.', hint: 'Q → drag in the viewer → Effects & Presets → Pop In.', check: (ed) => did(ed, 'create') && did(ed, 'preset', (e) => e.id === 'pop-in') },
        },
        {
          title: 'Channel name',
          body: '<p>Add your channel name with the Type tool. Animate it with <b>Typewriter</b>, <b>Fade In</b> or <b>Slide In</b>. Tip: move the playhead to <b>1s</b> first so it starts after the logo.</p>',
          task: { text: 'Add a <b>title</b> and give it an <b>animation preset</b>.', hint: 'Type tool → type → Esc → choose a preset.', check: (ed) => did(ed, 'type') && did(ed, 'preset') },
        },
        {
          title: 'Smooth it out ✨',
          body: '<p>Select some keyframes (drag a box or Shift+click ◆) and press <kbd>F9</kbd> for <b>Easy Ease</b>.</p>',
          task: { text: 'Apply <b>Easy Ease</b> to some keyframes.', hint: 'Press U to show all keyframes, click ◆, Shift+click more, press F9.', check: (ed) => did(ed, 'ease') },
        },
        {
          title: 'Add an effect',
          body: '<p>Finish with an effect: <b>Glow</b> on the logo or a <b>Drop Shadow</b> on the title.</p>',
          task: { text: 'Add an <b>effect</b> to any layer.', hint: 'Select a layer → Effects & Presets → Glow or Drop Shadow.', check: (ed) => did(ed, 'effect') },
        },
        {
          title: 'Export your video 🚀', demo: 'render', hl: ['menu-file'],
          body: '<p>Time to share! <b>File › Export › Video</b> renders your animation into a video file. It plays once in real time while it records.</p>',
          task: { text: 'Export your intro: <b>File › Export › Video (WebM)…</b>', hint: 'File menu → Export → Video.', check: (ed) => did(ed, 'export') },
          ghost: [{ el: 'menu-file' }, { click: 1 }],
        },
      ],
    },
  ];

  const C = window.DQCourses;
  C.push({ id: 'aftereffects', name: 'Adobe After Effects', short: 'Ae', tag: 'Motion graphics · Animation · Keyframes', color: '#9999FF', bg: '#00005B', status: 'open', lessons: LESSONS, editor: 'ae', img: 'assets/img/ae-course.webp', goal: 'from zero to your first animated intro', skills: 'Keyframes · Transform · Easing · Shapes · Text · Effects · Parenting · Export' });
  const ai = C.find((c) => c.id === 'illustrator'), ps = C.find((c) => c.id === 'photoshop');
  if (ai) Object.assign(ai, { goal: 'from zero to your first logo', skills: 'Shapes · Color · Pen Tool · Type · Layers · Pathfinder · Logo Design' });
  if (ps) Object.assign(ps, { goal: 'from zero to your first social media poster', skills: 'Layers · Selections · Brushes · Adjustments · Retouching · Type · Crop' });
})();
