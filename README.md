# ✋ HandBoard

> An Excalidraw-style whiteboard you control entirely with hand gestures — no mouse, no touch, just your hands.

![HandBoard Preview](https://raw.githubusercontent.com/iLLuSiOnZZ/handboard/main/preview.png)

## ✨ Features

- 🖊️ **Freehand drawing** — smooth chalk-style strokes
- ⬜ **Shapes** — rectangle, ellipse, arrow
- 🤏 **Select & drag** — pick up and move any element
- ✊ **Erase** — clear elements with your fist
- 🎨 **8 chalk colours** + 4 stroke widths
- ↩️ **Undo / Redo** — full history stack
- 💾 **Export PNG** — one-click download
- 📷 **Camera preview** — small corner feed so you can see your hand
- 💻 **Runs entirely in-browser** — no server, no installation, no data sent anywhere

---

## 🖐️ Gesture Reference

| Gesture | Hand Shape | Action |
|---|---|---|
| ☝️ **Draw** | Index finger only | Freehand stroke |
| ✌️ **Shape** | Peace sign (index + middle) | Draw selected shape (rect/ellipse/arrow) |
| 🤏 **Pinch** | Thumb + index close | Grab & drag any element |
| 🖐️ **Erase** | Open palm (all fingers spread) | Erase elements in radius |
| ✊ **Idle** | Fist / any other shape | Cursor only, no action |
| 🖐️ **Pause** *(2nd hand)* | Second hand open palm | Freezes all drawing input — reposition your drawing hand freely |

> **Tip:** Hold each gesture steady for ~3 frames before it activates. This prevents accidental switches.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl + Z` | Undo |
| `Delete` | Clear canvas |
| `Ctrl + S` | Export PNG |
| `1` | Select Pen |
| `2` | Select Rectangle |
| `3` | Select Ellipse |
| `4` | Select Arrow |
| `?` | Toggle help overlay |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A webcam
- Chrome, Firefox, or Edge (Safari not recommended — MediaPipe WASM support is limited)

### Run Locally

```bash
git clone https://github.com/your-username/handboard.git
cd handboard
npm install
npm run dev
```

Open `http://localhost:5173` and **allow camera access** when prompted.

### Build for Production

```bash
npm run build
# Outputs to dist/
```

### Deploy to GitHub Pages

1. Update `vite.config.js` — set `base` to your repo name:
   ```js
   base: '/handboard/'
   ```
2. Add homepage to `package.json`:
   ```json
   "homepage": "https://your-username.github.io/handboard"
   ```
3. Run:
   ```bash
   npm run deploy
   ```

---

## 🏗️ Architecture

```
src/
├── App.jsx                  # Root: hand tracking → gesture → drawing engine
├── index.css                # Global styles (chalk-board theme)
│
├── hooks/
│   └── useHandTracking.js   # MediaPipe Hands initialisation & camera loop
│
├── utils/
│   ├── gestures.js          # Pure: classify landmarks → gesture name
│   ├── smoothing.js         # Exponential moving average for jitter reduction
│   ├── hitTest.js           # Spatial queries for selection & erasing
│   └── drawElement.js       # Canvas 2D rendering (chalk aesthetic)
│
└── components/
    ├── Canvas.jsx            # RAF render loop — reads from refs every frame
    ├── Toolbar.jsx           # Tool / colour / width picker + action buttons
    ├── CameraPreview.jsx     # Mirrored webcam in bottom-right corner
    ├── GestureHUD.jsx        # Gesture label pill at top centre
    └── HelpOverlay.jsx       # Dismissable gesture reference card
```

### Data flow

```
Webcam frames
    └─► MediaPipe Hands (CDN WASM)
            └─► onHandResults callback (App.jsx)
                    ├─► classifyGesture() → gesture name
                    ├─► PositionSmoother → smooth cursor pos
                    └─► Drawing engine (mutates refs)
                                └─► Canvas RAF loop reads refs → renders
```

### Why refs instead of state?

The drawing engine runs at 30–60 fps driven by `requestAnimationFrame`.  Updating React state on every frame would cause expensive re-renders.  Instead, all hot-path data (`elements`, `currentStroke`, `cursorPos`, etc.) lives in `useRef` objects and is read directly by the RAF loop in `Canvas.jsx`.  React state is only used for toolbar controls and the gesture label — things that genuinely need to trigger UI re-renders.

---

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev) + [Vite](https://vitejs.dev) | UI framework + dev server |
| [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) | Real-time hand landmark detection |
| HTML5 Canvas API | 2D drawing |
| CSS animations | Loading screen, transitions |

MediaPipe is loaded via CDN `<script>` tags (no bundling required), which avoids WASM packaging issues with Vite.

---

## 🤝 Contributing

Pull requests are welcome!  Good first issues:

- [ ] Multi-hand support (draw with both hands simultaneously)
- [ ] Text labels (virtual keyboard or speech-to-text)
- [ ] Lasso selection (select multiple elements)
- [ ] Collaborative mode (WebRTC / WebSocket)
- [ ] Mobile / tablet support

---

## 📄 License

MIT — do whatever you want with it.
