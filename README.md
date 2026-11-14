# DesignQuest Academy 🎨

An interactive, beginner-friendly tutorial platform for graphic design.
Students learn by **doing**. Every lesson has a built-in practice workspace that looks and works like **Adobe Illustrator**.

> First course: **Adobe Illustrator** (8 lessons). The next course is **Adobe Photoshop**; its course card already shows "Coming soon".

## What's inside

| Feature | What students get |
| --- | --- |
| 🖥️ **Illustrator workspace simulator** | Menu bar, control bar, toolbar with hidden-tool flyouts, rulers, artboard, Properties / Layers / Swatches / Color panels, status bar, keyboard shortcuts |
| 🛠️ **Real working tools** | Selection, Direct Selection, Pen (curves + handles), Type, Line, Rectangle, Ellipse, Polygon, Star, Paintbrush, Pencil, Rotate, Eyedropper, Hand, Zoom |
| ✨ **Real features** | Fill/Stroke, swatches, gradients, Pathfinder (Unite, Minus Front, Intersect, Exclude), Align, Arrange, Group, Lock/Hide, Drop Shadow, Blur, Undo/Redo, Smart Guides, Outline mode, Export PNG/SVG |
| 🧑‍🏫 **Coach panel** | Short explanations in simple English, a looping animation for each idea, and a **mission** that is checked automatically |
| 👀 **Show me** | An animated "ghost cursor" demonstrates the action on the real interface |
| 🔦 **Spotlight** | Pulsing highlight on the exact button to click |
| 🏆 **Gamification** | XP, levels, badges, confetti, sounds, quizzes, mascot "Nibby", and a downloadable **certificate** that includes the student's own logo |
| 🎨 **Playground** | Free drawing with all tools, 6 creative challenges, and autosave |

### Illustrator lessons
1. Meet Illustrator: the workspace, vector vs. pixels, zoom
2. Shapes & Selection: draw, Shift for perfect shapes, hidden tools, move, resize, rotate, undo, rounded corners
3. Color: Fill & Stroke, swatches, None, gradients, Eyedropper
4. The Pen Tool: straight lines, open paths, curves, Direct Selection, the heart challenge
5. Typography: Type tool, fonts, size and color, align to artboard
6. Layers, Order & Groups: stacking order, Layers panel, group, lock
7. Pathfinder Magic: cloud (Unite), moon (Minus Front), leaf (Intersect), Exclude
8. Final Project: design a "Happy Cup" café logo, then export it

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
js/demos.js           Animated explainer clips (pure SVG, no video files)
js/lessons.js         Course content: lessons, steps, missions, quizzes
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

To start the Photoshop course, add its lessons to the `photoshop` entry in `COURSES` and set `status: 'open'`.

## Credits

- Illustrations generated with **Higgsfield, using the Nano Banana model at 1K resolution**
- [paper.js](http://paperjs.org) (MIT license) for Pathfinder geometry
- Fonts from Google Fonts

DesignQuest is an independent educational practice tool. It is not affiliated with or endorsed by Adobe. "Adobe", "Illustrator" and "Photoshop" are trademarks of Adobe Inc.
