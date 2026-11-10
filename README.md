# Digital Clock Module

A reusable, config-driven **`<digital-clock>`** web component — glassmorphism + liquid-glass, animated gradient borders, image / slideshow / neon-gradient backgrounds, 12 / 24-hour + AM/PM, full timezone & locale support, runtime font & size switching, and offline-first fonts and icons with CDN fallback. Everything is customizable from a single `config.json`.

- **Zero build step to use.** Drop `dist/` anywhere, include one script, done.
- **One custom element, infinitely reusable.** Configure per-instance via attributes or per-instance config files.
- **Production-ready.** MIT-licensed, offline-capable, ~12 KB CSS + ~30 KB JS (no runtime dependencies).

---

## Quick start

Serve the folder over HTTP (custom-element shadow-DOM `<link>` stylesheets need a server, not `file://`):

```bash
cd digital-clock-module
python3 -m http.server 5173
# open http://localhost:5173/
```

Minimal usage on your own page:

```html
<script src="dist/digital-clock.js"></script>
<digital-clock></digital-clock>
```

Per-clock overrides via HTML attributes:

```html
<digital-clock theme="neon-cyber" format="12" timezone="Asia/Tokyo"></digital-clock>
```

Custom config file:

```html
<digital-clock config="/path/to/my-clock-config.json"></digital-clock>
```

Imperative API:

```js
const clock = document.querySelector('digital-clock');
clock.setConfig({ style: { theme: 'aurora' }, clock: { format: '12' } });
clock.getConfig();    // -> current merged config (deep clone)
clock.refresh();      // -> force a re-render of the time
clock.resetConfig();  // -> clear localStorage overrides, back to config.json defaults
```

> **Sizing tip:** don't set `display` on `<digital-clock>` — the component uses `display:flex` internally so the panel + background stretch to fill any `min-height` / `height` you give the host. Set `min-height` (or the `--dc-min-height` custom property) on the host.
>
> ```css
> .hero digital-clock { min-height: 560px; }
> ```

---

## File structure

```
digital-clock-module/
├── index.html              # Demo page (hero + 2 rows of themed variants + slideshow demo)
├── LICENSE                 # MIT (+ 3rd-party notices)
├── package.json            # npm scripts: build CSS, watch, serve, zip
├── README.md               # This file
├── dist/                   # ← The drop-in module. Ship THIS folder.
│   ├── digital-clock.js    # The <digital-clock> custom element
│   ├── digital-clock.css   # Compiled SCSS output (expanded)
│   ├── digital-clock.min.css # Compiled SCSS output (compressed)
│   ├── config.json         # Default config (edit this to customize)
│   ├── config-slideshow.json # Slideshow example config (rotates sample wallpapers)
│   ├── fonts/
│   │   ├── fonts.css        # @font-face: local woff2 first, Google Fonts CDN fallback
│   │   └── <family>/*.woff2 # Bundled offline woff2 (Inter, Share Tech Mono,
│   │                        #   Orbitron, Playfair Display, Space Grotesk)
│   ├── icons/
│   │   ├── bootstrap-icons.css          # Icon class rules (loaded in shadow root)
│   │   ├── bootstrap-icons-fontface.css # @font-face only (loaded in main document)
│   │   └── fonts/bootstrap-icons.woff2
│   └── assets/
│       ├── default-bg.jpg              # Default background — lone tree under starry night sky (Pexels, free)
│       ├── wallpaper-aurora.jpg          # Aurora borealis (green/purple, landscape)
│       ├── wallpaper-aurora-pink.jpg     # Pink/green aurora (landscape)
│       ├── wallpaper-mountain-sunset.jpg # Mountain silhouettes at sunset (landscape)
│       ├── wallpaper-milky-way.jpg       # Milky Way night sky (landscape)
│       └── wallpaper-night-street.jpg    # City street with car light trails (landscape)
└── src/                    # Source for developers who want to rebuild
    ├── scss/
    │   ├── digital-clock.scss   # Main entry
    │   ├── _variables.scss       # CSS custom-property defaults
    │   ├── _themes.scss          # 14 theme presets
    │   ├── _glass.scss           # Glassmorphism + liquid glass + gradient border
    │   ├── _animations.scss     # Keyframes
    │   └── _responsive.scss     # Breakpoints + reduced-motion
    └── js/
        └── digital-clock.js     # The component source (identical to dist/)
```

---

## Rebuilding from source

Requires Node.js ≥ 18. The SCSS compiler (`sass`) installs as a dev dependency:

```bash
npm install
npm run build          # compile SCSS -> dist/digital-clock.css, copy JS
npm run build:css:min  # also emit a compressed dist/digital-clock.min.css (~4 KB gzipped)
npm run watch:css      # watch SCSS for changes
npm run serve          # serve on http://localhost:5173
npm run zip            # package the whole folder as digital-clock-module.zip
```

> **Using the compressed CSS in production.** `npm run build:css:min` produces `dist/digital-clock.min.css`. The component loads `dist/digital-clock.css` by default; to use the minified version, either rename the `.min.css` over the expanded file, or edit the `BASE + 'digital-clock.css'` reference in `dist/digital-clock.js` (the third entry in the `_injectStyles()` array) to point at `digital-clock.min.css`. Behaviour is identical — only the bytes differ.

---

## Deploy the demo to GitHub Pages

A ready-made GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the CSS from SCSS and publishes the demo as a static GitHub Pages site — free hosting, no extra config.

**One-time setup (~30 seconds):**

1. Push this folder to a GitHub repo (e.g. `your-username/digital-clock-module`).
2. In the repo, go to **Settings → Pages → "Build and deployment"** and set **Source = "GitHub Actions"**.
3. Push to `main` (or merge any PR). The workflow runs automatically.

Your demo is live at **`https://<your-username>.github.io/<your-repo-name>/`** within ~30 seconds of the workflow finishing.

The component resolves its own folder at runtime from the `<script src>` URL, so it works whether the site is served from the repo root, a sub-path (like `username.github.io/repo-name/`), or a custom domain — no base-path configuration needed. To trigger a manual redeploy, go to the **Actions** tab and run the "Deploy demo to GitHub Pages" workflow.

> **Note:** the workflow stages only `index.html` + `dist/` + `README.md` + `LICENSE` to the Pages artifact (not `src/`). The `dist/` folder already contains the compiled CSS, bundled JS, fonts, icons, wallpapers, and config — everything the demo needs to run. If you edit SCSS or `src/js/`, the workflow rebuilds `dist/` on every push.

---

## Configuration reference (`dist/config.json`)

Every option below is honored by the component. Runtime tweaks from the settings panel are saved to `localStorage` (`digital-clock:prefs`) and override these values; call `clock.resetConfig()` to clear them.

### `clock`

| key            | type      | values                                     | default   | notes |
|----------------|-----------|--------------------------------------------|-----------|-------|
| `format`       | string    | `"12"` \| `"24"`                           | `"24"`    | 12-hour shows AM/PM |
| `showSeconds`  | boolean   | —                                          | `true`    | toggles `:SS` |
| `showAmPm`     | boolean   | —                                          | `true`    | only in 12-hour mode |
| `showDate`     | boolean   | —                                          | `true`    | weekday + date line |
| `showTimezone` | boolean   | —                                          | `true`    | IANA name + UTC offset |
| `dateStyle`    | string    | `"long"` \| `"short"`                      | `"long"`  | weekday & month style |
| `timezone`     | string    | `"auto"` or IANA name                      | `"auto"`  | e.g. `"Asia/Colombo"`, `"America/New_York"`, `"UTC"` |
| `locale`       | string    | `"auto"` or BCP-47 tag                      | `"auto"`  | e.g. `"en-GB"`, `"ja-JP"`, `"si-LK"` |

Time formatting uses `Intl.DateTimeFormat`, so **every IANA timezone** and **every locale** your browser supports is available — the dropdowns in the settings panel just list the common ones.

### `style`

| key | values | default |
|-----|--------|---------|
| `theme` | `auto`, `dark-glass`, `light-glass`, `midnight`, `aurora`, `neon-cyber`, `sunset`, `ocean` | `"auto"` |
| `font.family` | `digital-7seg`, `modern-sans`, `elegant-serif`, `retro-neon`, or any raw CSS font-family string | `"digital-7seg"` |
| `font.size`   | `sm`, `md`, `lg`, `xl` (scales digits 0.8× / 1× / 1.22× / 1.5×) | `"md"` |
| `font.weight` | number | `400` |
| `glass.blur`      | number (px)     | `18` |
| `glass.opacity`   | number 0–1      | `0.45` |
| `glass.liquid`    | boolean         | `true` — specular "liquid glass" highlights |
| `border.mode`     | `none`, `solid`, `gradient`, `animated-gradient` | `"animated-gradient"` |
| `border.width`    | number (px)     | `2` |
| `border.color`    | CSS color       | `"rgba(255,255,255,0.14)"` (used by `solid`) |
| `border.gradientColors` | array of CSS colors | `["#818cf8","#ec4899","#06b6d4","#818cf8"]` |
| `border.animationDuration` | number (s) | `6` |

> **Border modes** — `none` = transparent, `solid` = single color, `gradient` = static gradient ring, `animated-gradient` = the gradient shifts around the ring (the popular neon look). The gradient is painted on a `::before` and masked to the border ring, so it stays crisp at any radius.

### `background`

| key | values | default | notes |
|-----|--------|---------|-------|
| `mode` | `image`, `slideshow`, `gradient`, `none` | `"image"` | |
| `image` | path or URL | `"assets/default-bg.webp"` | relative to `dist/`, or absolute URL |
| `images` | array of paths/URLs | `[]` | used by `slideshow` mode |
| `slideshowInterval` | number (s) | `8` | time between slides |
| `slideshowTransition` | number (ms) | `1200` | crossfade duration |
| `fit` | `cover`, `contain`, `fill`, `center` | `"cover"` | maps to CSS `background-size: cover/contain/100% 100%/auto` |
| `position` | CSS `background-position` | `"center center"` | |
| `gradient.type` | `linear`, `radial`, `conic` | `"linear"` | the "neon gradient" backdrop |
| `gradient.angle` | number (deg) | `135` | for `linear` & `conic` |
| `gradient.colors` | array of CSS colors | `["#0f172a","#1e1b4b","#312e81"]` | |
| `gradient.neon` | boolean | `true` | semantic flag (use bright colors for a neon feel) |
| `gradient.animate` | boolean | `true` | pan the gradient slowly |
| `overlay` | boolean | `true` | dark/light scrim so text stays readable |
| `overlayColor` | CSS color | `"rgba(2,6,23,0.25)"` | |

**Background fit / cropping for any screen** — the `fit` option controls how each image fills the panel on **large screens, small screens, portrait and landscape**:

- `cover` (default) — scales to fill, **crops** the overflow. Best for full-bleed hero photos on big and small screens.
- `contain` — scales to fit, **letterboxes**. No cropping; you see the whole image with bars on the sides.
- `fill` — stretches to 100% × 100%. Distorts the image but no bars and no crop.
- `center` — shows the image at natural size, centered. Useful for small logos / pattern tiles.

Set the background image from the settings panel (file picker) for quick testing — uploaded images become `blob:` URLs (not persisted across reloads). For production, ship your images in `dist/assets/` and reference them by path in `config.json`.

```jsonc
// Example: rotating slideshow of three backgrounds, cover-cropped
{
  "background": {
    "mode": "slideshow",
    "images": ["assets/bg1.webp", "assets/bg2.jpg", "assets/bg3.png"],
    "slideshowInterval": 6,
    "slideshowTransition": 1400,
    "fit": "cover"
  }
}
```

Supported image formats: anything the browser can paint via CSS `background-image` — **`.webp`, `.jpg`, `.png`, `.gif`, `.avif`, `.svg`**. There is no hard file-size limit; the browser handles decode. For best performance keep wallpapers under ~1–2 MB and use `.webp` or `.avif`.

### Sample wallpapers

Five copyright-free **Pexels** photos ship in `dist/assets/` so you can try the `slideshow` and `fit` options without sourcing your own. All are free to use, even commercially, with **no attribution required** (Pexels License — https://www.pexels.com/license/). Photographer credits are listed below as a courtesy — you are not legally required to keep them:

| File | Orientation | Size | Vibe | Photo by | Pexels |
|------|------------|------|------|----------|--------|
| `default-bg.jpg` (the default) | landscape | 1920×1280, ~352 KB | lone windswept tree under a deep-blue starry night sky with the Milky Way | Mustafa Necati Oksuz | [/photo/39086430](https://www.pexels.com/photo/39086430/) |
| `wallpaper-aurora.jpg`          | landscape | 1600×1067, ~116 KB | green/purple aurora borealis over a utility pole | kublizz | [/photo/16681026](https://www.pexels.com/photo/16681026/) |
| `wallpaper-aurora-pink.jpg`     | landscape | 1600×900,  ~137 KB | soft pink/red/green aurora, dim and diffuse | Jason Pittman | [/photo/28949224](https://www.pexels.com/photo/28949224/) |
| `wallpaper-mountain-sunset.jpg` | landscape | 1600×1067, ~90 KB  | silhouetted mountains under a dramatic orange/gray sunset | Bastian Riccardi | [/photo/38664023](https://www.pexels.com/photo/38664023/) |
| `wallpaper-milky-way.jpg`       | landscape | 1600×1067, ~432 KB | deep-navy Milky Way night sky | Tanita Lupa | [/photo/39180815](https://www.pexels.com/photo/39180815/) |
| `wallpaper-night-street.jpg`    | landscape | 1600×1031, ~212 KB | dark city street with red/orange car light trails | Agustin Fernandez | [/photo/17067146](https://www.pexels.com/photo/17067146/) |

A ready-made slideshow config (`dist/config-slideshow.json`) rotates through all five every 6 seconds with a 1.4s crossfade, using the **neon-cyber** theme and **retro-neon** font. Drop it in:

```html
<digital-clock config="dist/config-slideshow.json"></digital-clock>
```

To swap in your own wallpapers: copy them into `dist/assets/` and point `config.json` (or your own config file) at them — any format CSS `background-image` accepts (`.webp`, `.jpg`, `.png`, `.gif`, `.avif`, `.svg`), any orientation, any file size. The `fit` option (`cover` / `contain` / `fill` / `center`) controls cropping per screen size. Good free sources: **pexels.com**, **unsplash.com**, **pixabay.com** — all allow commercial use without attribution (verify each photo's license page before shipping in a commercial product).

### `features`

| key | default | notes |
|-----|---------|-------|
| `settingsPanel` | `true` | show the gear button + settings panel |
| `keyboardShortcuts` | `true` | `S` toggles settings, `Esc` closes |
| `persist` | `true` | save runtime tweaks to `localStorage` |

---

## Themes

Eight built-in themes plus six bonus themes (v1.1, 14 total). `auto` follows `prefers-color-scheme` (dark-glass at night, light-glass by day). The rest are rich dark variants that read best over image / neon backgrounds — **midnight**, **aurora**, **neon-cyber**, **sunset**, **ocean**, **emerald**, **ruby**, **carbon**, **rose-gold**, **matrix**, plus **dark-glass** and **light-glass** and the **ice** light variant. Add your own by editing `src/scss/_themes.scss` (a `:host([data-theme="your-name"]) { --dc-…: … }` block) and rebuilding — and add a `['your-name', 'Pretty name']` row to the `THEMES` array in `src/js/digital-clock.js` so it shows up in the settings dropdown.

## Fonts

Offline-first with CDN fallback. Each `@font-face` in `dist/fonts/fonts.css` lists the **local woff2 first** and the matching **Google Fonts / Fontsource CDN** URL second, so the module works with no internet connection and degrades gracefully if a local file is missing. Shipped families:

| Family | Use | Weights |
|--------|-----|---------|
| Share Tech Mono | default 7-seg digital digits | 400 |
| Orbitron        | retro-neon digits            | 400 / 700 / 900 |
| Playfair Display| elegant-serif digits         | 400 / 700 |
| Space Grotesk   | modern-sans digits / retro-neon labels | 400 / 500 / 700 |
| Inter           | default + most labels        | 400 / 500 / 600 |

To use any other Google Font: add its `@font-face` to `dist/fonts/fonts.css` (local woff2 + CDN URL), then set `style.font.family` in `config.json` to that font-family string, e.g. `"font.family": "'Major Mono Display', monospace"`.

## Icons

Bootstrap Icons, also offline-first: `dist/icons/bootstrap-icons.css` references the local woff2 (130 KB) first and the jsdelivr CDN second. Used for the settings gear and panel header. No runtime fetch from `bootstrap-icons.com` needed.

## HTML attributes

| attribute | overrides config key | example |
|-----------|----------------------|---------|
| `config`   | whole config (URL or inline JSON) | `config="/my.json"` or `config='{"clock":{"format":"12"}}'` |
| `theme`    | `style.theme`         | `theme="midnight"` |
| `format`   | `clock.format`        | `format="12"` |
| `timezone` | `clock.timezone`      | `timezone="Asia/Colombo"` |

These are observed attributes — changing them at runtime live-updates the clock.

## CSS custom properties

The component drives everything from custom properties on the host, so you can override any value from your own CSS without touching the config:

```css
digital-clock {
  --dc-accent: #22d3ee;          /* highlight color */
  --dc-glass-blur: 24px;         /* frosted amount */
  --dc-digit-size: clamp(3rem, 10vw, 6rem);
  --dc-min-height: 420px;        /* intrinsic height floor */
  --dc-radius: 32px;
}
```

See `src/scss/_variables.scss` for the full list of `--dc-*` variables.

## Browser support

Works in every browser that supports **Custom Elements v1 + Shadow DOM + `Intl.DateTimeFormat` with `timeZone`** — Chrome 67+, Edge 79+, Firefox 63+, Safari 10.1+. `backdrop-filter` (the glass blur) is supported in all current Chromium/Safari/Firefox; older browsers see a solid translucent panel instead of a blurred one — the clock still works.

## Accessibility

- The settings gear is a real `<button>` with `aria-label="Settings"`.
- `Esc` closes the settings panel; `S` toggles it (when `features.keyboardShortcuts` is on).
- The clock text uses `tabular-nums` so digits don't jitter.
- `prefers-reduced-motion` disables animations and the colon blink.

## License

**MIT** — see [LICENSE](./LICENSE). Bundled fonts are SIL OFL 1.1 (Google Fonts via Fontsource); Bootstrap Icons are MIT. All compatible with redistribution.
