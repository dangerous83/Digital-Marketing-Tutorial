# DesignQuest Academy 🎨

An interactive, beginner-friendly tutorial platform for graphic design.
Students learn by **doing**. Every lesson has a built-in practice workspace that looks and works like **Adobe Illustrator**, **Adobe Photoshop** or **Adobe After Effects**.

> Three courses, 8 lessons each: **Adobe Illustrator** (vector: shapes, Pen tool, logos), **Adobe Photoshop** (pixels: layers, selections, retouching, posters) and **Adobe After Effects** (motion: keyframes, easing, effects, animated intros).

## What's inside

| Feature | What students get |
| --- | --- |
| 🎬 **After Effects workspace simulator** | Composition viewer with motion paths, Timeline with layer bars, twirl-down Transform properties, stopwatches, keyframes you can select, drag and Easy Ease (F9), a draggable playhead and timecode, blue "scrubby" values, P/S/R/T/A/U shortcuts, shape and text layers, Typewriter, animation presets (Fade, Pop, Slide, Spin, Bounce, Blur In), effects (Gaussian Blur, Glow, Drop Shadow, Fill), parenting, layer timing and trimming, playback, and video export (WebM) |
| 📷 **Photoshop workspace simulator** | Real pixel editing: layers (opacity, blend modes, drop shadow, stroke), locked Background, marquee / lasso / magic wand selections with marching ants, brush, eraser, clone stamp, spot healing, paint bucket, gradient, type layers, crop with ratios, Free Transform, adjustments (Brightness/Contrast, Hue/Saturation, Black & White, Photo Filter, Invert), filters (Gaussian Blur, Sharpen, Mosaic, Noise), History panel, open/place your own photos, export PNG/JPG |
| 🖥️ **Illustrator workspace simulator** | Menu bar, control bar, toolbar with hidden-tool flyouts, rulers, artboard, Properties / Layers / Swatches / Color panels, status bar, keyboard shortcuts |
| 🛠️ **Real working tools** | Selection, Direct Selection, Pen (curves + handles), Type, Line, Rectangle, Ellipse, Polygon, Star, Paintbrush, Pencil, Rotate, Eyedropper, Hand, Zoom |
| ✨ **Real features** | Fill/Stroke, swatches, gradients, Pathfinder (Unite, Minus Front, Intersect, Exclude), Align, Arrange, Group, Lock/Hide, Drop Shadow, Blur, Undo/Redo, Smart Guides, Outline mode, Export PNG/SVG |
| 🧑‍🏫 **Coach panel** | Short explanations in simple English, a looping animation for each idea, and a **mission** that is checked automatically |
| 👀 **Show me** | An animated "ghost cursor" demonstrates the action on the real interface |
| 🔦 **Spotlight** | Pulsing highlight on the exact button to click |
| 🏆 **Gamification** | XP, levels, badges, confetti, sounds, quizzes, mascot "Nibby", and a downloadable **certificate** that includes the student's own logo |
| 🎨 **Playgrounds** | Free practice in both apps with 6 creative challenges each. Illustrator work autosaves, and in Photoshop students can open their own photos |

### Illustrator lessons
1. Meet Illustrator: the workspace, vector vs. pixels, zoom
2. Shapes & Selection: draw, Shift for perfect shapes, hidden tools, move, resize, rotate, undo, rounded corners
3. Color: Fill & Stroke, swatches, None, gradients, Eyedropper
4. The Pen Tool: straight lines, open paths, curves, Direct Selection, the heart challenge
5. Typography: Type tool, fonts, size and color, align to artboard
6. Layers, Order & Groups: stacking order, Layers panel, group, lock
7. Pathfinder Magic: cloud (Unite), moon (Minus Front), leaf (Intersect), Exclude
8. Final Project: design a "Happy Cup" café logo, then export it

### Photoshop lessons
1. Meet Photoshop: pixels, the workspace, zoom
2. Layers 101: select, hide, move, order, opacity, unlock the Background, new layer
3. Selections: marquee, elliptical marquee, Magic Wand, Inverse, Layer Via Copy, Lasso
4. Brushes & Color: foreground color, brush size and hardness, eraser, paint bucket, gradient
5. Color Adjustments: Brightness/Contrast, Hue/Saturation, History panel, Black & White, Gaussian Blur
6. Retouching: work on a copy, Spot Healing Brush, Clone Stamp, before and after
7. Text & Layer Styles: Type tool, fonts, Stroke, Drop Shadow, blend modes
8. Final Project: crop to a square, place an image, Free Transform, adjust, add a title, export a "Summer Sale" post

### After Effects lessons
1. Meet After Effects: play, scrub the timeline, the workspace, frames per second
2. Keyframes 101: twirl open, the stopwatch, a second and third keyframe, motion path
3. Transform Properties: Scale, Rotation, Opacity and the Anchor Point
4. Easing: linear vs. Easy Ease, comparing them, timing, the Bounce preset
5. Shapes & Text: Star tool, fill color, Type tool, the Typewriter preset
6. Effects & Presets: Fade In, Drop Shadow, Glow, an animated blur
7. Layers, Timing & Parenting: a moon orbiting a planet, layer timing, duplicate, hide
8. Final Project: a 5-second animated channel intro exported as a video

## Run it

No build step is needed. It is plain HTML, CSS and JavaScript.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. You can also double-click `index.html`.

To publish it for students, turn on **GitHub Pages** for this repo (Settings → Pages → deploy from branch).

## Project structure

```
index.html            App shell (home, course map, lesson player, playground)
css/app.css           Platform styles
css/ai.css            Illustrator-style workspace styles
js/editor.js          The Illustrator workspace simulator (tools, panels, menus)
js/ps-editor.js       The Photoshop workspace simulator (canvas pixel editing)
js/ae-editor.js       The After Effects workspace simulator (keyframe animation engine)
js/ae-demos.js        After Effects explainer clips
js/ae-lessons.js      After Effects course content
css/ae.css            After Effects workspace styles
js/ps-photos.js       Practice photos embedded as data URIs (pixel tools work offline too)
js/demos.js           Animated explainer clips (pure SVG, no video files)
js/ps-demos.js        Photoshop explainer clips
js/lessons.js         Illustrator course content: lessons, steps, missions, quizzes
js/ps-lessons.js      Photoshop course content
css/ps.css            Photoshop-specific workspace styles
js/app.js             Router, progress/XP, coach, spotlight, ghost cursor, certificate
js/vendor/            paper.js (MIT) — powers Pathfinder boolean operations
assets/img/           Lesson illustrations (WebP)
```

## Adding lessons (e.g. the Photoshop course)

Lessons are data in `js/lessons.js`. Each step can contain:

```js
{
  title: 'Draw a rectangle',
  demo: 'draw-rect',                      // animation from js/demos.js
  hl: ['tool-rect'],                      // UI element to spotlight
  body: '<p>Explanation…</p>',
  task: {
    text: 'Draw a rectangle',
    hint: 'Press M, then drag',
    check: (ed) => ed.did('create', (e) => e.kind === 'rect'),   // auto-checked
  },
  ghost: [{ el: 'tool-rect' }, { click: 1 }, { drag: [[150,150],[380,320]] }],
  quiz: { q: '…', options: ['…'], answer: 0, explain: '…' },
}
```

To add another course (e.g. InDesign), add an entry to `COURSES` with its lessons and an `editor` key, and register a workspace for it in `editor()` in `js/app.js`.

## Credits

- Illustrations and practice photos generated with **Higgsfield, using the Nano Banana model at 1K resolution**
- [paper.js](http://paperjs.org) (MIT license) for Pathfinder geometry
- Fonts from Google Fonts

DesignQuest is an independent educational practice tool. It is not affiliated with or endorsed by Adobe. "Adobe", "Illustrator" and "Photoshop" are trademarks of Adobe Inc.
