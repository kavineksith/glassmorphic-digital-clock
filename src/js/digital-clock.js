/*!
 * Digital Clock Module — <digital-clock> web component
 * --------------------------------------------------------------
 * A dependency-light, config-driven digital clock custom element.
 *
 *   <script src="dist/digital-clock.js"></script>
 *   <digital-clock></digital-clock>
 *   <!-- or: <digital-clock config="/path/to/my-config.json"></digital-clock> -->
 *
 * All visual + behavioural options live in config.json (or the inline
 * `config` attribute). The component resolves its own directory from the
 * script URL so fonts / icons / css / default background load correctly
 * no matter where you drop the dist/ folder.
 *
 * License: MIT  — see ../LICENSE
 */
(function () {
  'use strict';

  /* Resolve the module's own base URL (the dist/ folder) so every
   * asset path works wherever the folder is placed. */
  const BASE = (function () {
    try {
      if (document.currentScript && document.currentScript.src) {
        return new URL('.', document.currentScript.src).href;
      }
    } catch (e) {}
    return './';
  })();

  const LS_KEY = 'digital-clock:prefs';

  /* ---- Built-in default config (mirror of dist/config.json).
   * Used when config.json can't be fetched (e.g. file://). ---- */
  const DEFAULTS = {
    clock: {
      format: '24',          // "12" | "24"
      showSeconds: true,
      showAmPm: true,
      showDate: true,
      showTimezone: true,
      dateStyle: 'long',     // "long" | "short"
      timezone: 'auto',      // "auto" | IANA name (e.g. "Asia/Tokyo")
      locale: 'auto'         // "auto" | BCP-47 tag (e.g. "en-GB")
    },
    style: {
      theme: 'auto',         // auto|dark-glass|light-glass|midnight|aurora|neon-cyber|sunset|ocean
      font: {
        family: 'digital-7seg', // digital-7seg|modern-sans|elegant-serif|retro-neon|<custom>
        size: 'md',             // sm|md|lg|xl
        weight: 400
      },
      glass: {
        blur: 18,
        opacity: 0.45,
        liquid: true
      },
      border: {
        mode: 'animated-gradient', // none|solid|gradient|animated-gradient
        width: 2,
        color: 'rgba(255,255,255,0.14)',
        gradientColors: ['#818cf8', '#ec4899', '#06b6d4', '#818cf8'],
        animationDuration: 6
      }
    },
    background: {
      mode: 'image',        // image|slideshow|gradient|none
      image: 'assets/default-bg.jpg',
      images: [],
      slideshowInterval: 8,
      slideshowTransition: 1200,
      fit: 'cover',         // cover|contain|fill|center
      position: 'center center',
      gradient: {
        type: 'linear',     // linear|radial|conic
        angle: 135,
        colors: ['#0f172a', '#1e1b4b', '#312e81'],
        neon: true,
        animate: true
      },
      overlay: true,
      overlayColor: 'rgba(2,6,23,0.25)'
    },
    features: {
      settingsPanel: true,
      keyboardShortcuts: true,
      persist: true
    }
  };

  /* ---- Preset option tables shown in the settings panel ---- */
  const THEMES = [
    ['auto', 'Auto (system)'],
    ['dark-glass', 'Dark glass'],
    ['light-glass', 'Light glass'],
    ['midnight', 'Midnight'],
    ['aurora', 'Aurora'],
    ['neon-cyber', 'Neon cyber'],
    ['sunset', 'Sunset'],
    ['ocean', 'Ocean'],
    ['emerald', 'Emerald'],
    ['ruby', 'Ruby'],
    ['carbon', 'Carbon'],
    ['rose-gold', 'Rose gold'],
    ['matrix', 'Matrix'],
    ['ice', 'Ice']
  ];

  const FONTS = {
    'digital-7seg':  { digit: "'Share Tech Mono', ui-monospace, monospace",  label: "'Inter', system-ui, sans-serif", name: 'Digital 7-seg' },
    'modern-sans':   { digit: "'Space Grotesk', system-ui, sans-serif",      label: "'Inter', system-ui, sans-serif", name: 'Modern sans' },
    'elegant-serif': { digit: "'Playfair Display', Georgia, serif",         label: "'Inter', system-ui, sans-serif", name: 'Elegant serif' },
    'retro-neon':    { digit: "'Orbitron', ui-monospace, monospace",         label: "'Space Grotesk', sans-serif", name: 'Retro neon' }
  };

  const SIZES = { sm: 0.8, md: 1, lg: 1.22, xl: 1.5 };

  const TIMEZONES = [
    ['auto', 'Local'],
    ['UTC', 'UTC'],
    ['Europe/London', 'Europe / London'],
    ['Europe/Paris', 'Europe / Paris'],
    ['Europe/Berlin', 'Europe / Berlin'],
    ['Europe/Moscow', 'Europe / Moscow'],
    ['America/New_York', 'America / New York'],
    ['America/Chicago', 'America / Chicago'],
    ['America/Denver', 'America / Denver'],
    ['America/Los_Angeles', 'America / Los Angeles'],
    ['America/Sao_Paulo', 'America / São Paulo'],
    ['America/Toronto', 'America / Toronto'],
    ['Asia/Dubai', 'Asia / Dubai'],
    ['Asia/Kolkata', 'Asia / Kolkata'],
    ['Asia/Colombo', 'Asia / Colombo'],
    ['Asia/Bangkok', 'Asia / Bangkok'],
    ['Asia/Singapore', 'Asia / Singapore'],
    ['Asia/Hong_Kong', 'Asia / Hong Kong'],
    ['Asia/Shanghai', 'Asia / Shanghai'],
    ['Asia/Tokyo', 'Asia / Tokyo'],
    ['Asia/Seoul', 'Asia / Seoul'],
    ['Australia/Sydney', 'Australia / Sydney'],
    ['Pacific/Auckland', 'Pacific / Auckland'],
    ['Pacific/Honolulu', 'Pacific / Honolulu']
  ];

  const LOCALES = [
    ['auto', 'Browser default'],
    ['en-US', 'English (US)'],
    ['en-GB', 'English (UK)'],
    ['fr-FR', 'Français'],
    ['de-DE', 'Deutsch'],
    ['es-ES', 'Español'],
    ['it-IT', 'Italiano'],
    ['pt-BR', 'Português (BR)'],
    ['ru-RU', 'Русский'],
    ['ja-JP', '日本語'],
    ['zh-CN', '简体中文'],
    ['ko-KR', '한국어'],
    ['ar-SA', 'العربية'],
    ['hi-IN', 'हिन्दी'],
    ['si-LK', 'සිංහල']
  ];

  /* ---- utils ---- */
  function isObject(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function deepMerge(base, over) {
    if (!isObject(base) || !isObject(over)) return over === undefined ? base : over;
    const out = Object.assign({}, base);
    Object.keys(over).forEach(function (k) {
      if (isObject(base[k]) && isObject(over[k])) out[k] = deepMerge(base[k], over[k]);
      else if (over[k] !== undefined) out[k] = over[k];
    });
    return out;
  }
  function resolveUrl(path) {
    if (!path) return null;
    if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
    return BASE + path.replace(/^\.\//, '');
  }
  function fitToCss(fit) {
    return ({ cover: 'cover', contain: 'contain', fill: '100% 100%', center: 'auto' })[fit] || 'cover';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function options(list, selected) {
    return list.map(function (o) {
      const v = o[0], label = o[1];
      const sel = v === selected ? ' selected' : '';
      return '<option value="' + escapeHtml(v) + '"' + sel + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  /* ============================================================
   *  DigitalClock custom element
   * ============================================================ */
  class DigitalClock extends HTMLElement {
    static get observedAttributes() { return ['config', 'timezone', 'format', 'theme']; }

    constructor() {
      super();
      this._cfg = null;
      this._tick = null;
      this._slideIdx = 0;
      this._slideTimer = null;
      this._slides = [];
      this._lastBucket = null;
      this._connected = false;
    }

    connectedCallback() {
      if (this._connected) return;
      this._connected = true;
      this.attachShadow({ mode: 'open' });
      this._injectStyles();
      this._renderShell();
      this._refs = this._cacheRefs();

      this._loadConfig().then((cfg) => {
        this._cfg = cfg;
        // Apply any initial HTML attributes (theme/format/timezone) as overrides
        // so <digital-clock theme="neon-cyber" format="12" timezone="Asia/Tokyo">
        // works out of the box without waiting for setConfig().
        const aTheme = this.getAttribute('theme');
        const aFormat = this.getAttribute('format');
        const aTz = this.getAttribute('timezone');
        if (aTheme)  this._cfg = deepMerge(this._cfg, { style: { theme: aTheme } });
        if (aFormat) this._cfg = deepMerge(this._cfg, { clock: { format: aFormat } });
        if (aTz)     this._cfg = deepMerge(this._cfg, { clock: { timezone: aTz } });
        this._applyAll();
        this._wireSettings();
        this._startClock();
      }).catch((err) => {
        console.error('[digital-clock] init failed:', err);
      });
    }

    disconnectedCallback() {
      this._stopClock();
      this._stopSlideshow();
    }

    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV || !this._cfg) return;
      if (name === 'config') {
        this._loadConfig().then((cfg) => { this._cfg = cfg; this._applyAll(); this._syncSettingsUI(); });
        return;
      }
      const patch = {};
      if (name === 'timezone') patch.clock = { timezone: newV };
      else if (name === 'format') patch.clock = { format: newV };
      else if (name === 'theme') patch.style = { theme: newV };
      this._cfg = deepMerge(this._cfg, patch);
      this._applyAll();
      this._syncSettingsUI();
    }

    /* ---- public API ---- */
    getConfig() { return JSON.parse(JSON.stringify(this._cfg || DEFAULTS)); }
    setConfig(partial) {
      this._cfg = deepMerge(this._cfg || DEFAULTS, partial);
      this._persist();
      this._applyAll();
      this._syncSettingsUI();
    }
    resetConfig() {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      this._cfg = deepMerge({}, DEFAULTS);
      this._applyAll();
      this._syncSettingsUI();
    }
    refresh() { this._updateTime(true); }

    /* ---- styles ---- */
    _injectStyles() {
      const sr = this.shadowRoot;

      // ---- @font-face declarations MUST live in the main document, not the
      //      shadow root. Chromium doesn't trigger font loading for @font-face
      //      rules defined in a shadow-DOM <link> stylesheet (a long-standing
      //      bug), so the woff2 files would never be fetched and every icon
      //      would render as an invisible missing-glyph box. We inject a
      //      <link> for each fontface-only CSS file into document.head exactly
      //      once (guarded by a data attribute), so the fonts become globally
      //      available. The icon class rules (which DO need to be inside the
      //      shadow root to match shadow-DOM <i> elements) are loaded below.
      if (!document.head.querySelector('link[data-dc-fontface="fonts"]')) {
        const lf = document.createElement('link');
        lf.rel = 'stylesheet';
        lf.href = BASE + 'fonts/fonts.css';
        lf.setAttribute('data-dc-fontface', 'fonts');
        document.head.appendChild(lf);
      }
      if (!document.head.querySelector('link[data-dc-fontface="icons"]')) {
        const li = document.createElement('link');
        li.rel = 'stylesheet';
        li.href = BASE + 'icons/bootstrap-icons-fontface.css';
        li.setAttribute('data-dc-fontface', 'icons');
        document.head.appendChild(li);
      }

      // ---- Shadow-root stylesheets: icon class rules + the clock's own CSS.
      //      These target elements inside THIS shadow root only.
      ['icons/bootstrap-icons.css', 'digital-clock.css'].forEach((p) => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = BASE + p;
        l.setAttribute('data-dc-asset', p);
        sr.appendChild(l);
      });
    }

    /* ---- config load (attribute / fetch / defaults) ---- */
    _loadConfig() {
      const attr = this.getAttribute('config');
      let loadPromise;
      if (attr) {
        const trimmed = attr.trim();
        if (trimmed.charAt(0) === '{') {
          try { loadPromise = Promise.resolve(JSON.parse(attr)); }
          catch (e) { console.warn('[digital-clock] inline config JSON invalid:', e); loadPromise = Promise.resolve({}); }
        } else {
          loadPromise = fetch(attr, { cache: 'no-store' })
            .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .catch((e) => { console.warn('[digital-clock] config fetch failed:', attr, e); return {}; });
        }
      } else {
        loadPromise = fetch(BASE + 'config.json', { cache: 'no-store' })
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
          .catch((e) => { console.warn('[digital-clock] config.json fetch failed; using built-in defaults:', e); return {}; });
      }
      return loadPromise.then((cfg) => {
        let merged = deepMerge(DEFAULTS, cfg);
        if (merged.features && merged.features.persist) {
          try {
            const stored = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
            if (stored) merged = deepMerge(merged, stored);
          } catch (e) {}
        }
        return merged;
      });
    }

    _persist() {
      if (!this._cfg.features || !this._cfg.features.persist) return;
      try {
        const snap = JSON.parse(JSON.stringify(this._cfg));
        if (snap.background && typeof snap.background.image === 'string' && /^blob:/.test(snap.background.image)) {
          snap.background.image = '';
        }
        localStorage.setItem(LS_KEY, JSON.stringify(snap));
      } catch (e) {}
    }

    /* ---- render shell ---- */
    _renderShell() {
      const root = document.createElement('div');
      root.className = 'dc';
      root.innerHTML =
        '<div class="dc-bg">' +
          '<div class="dc-bg-gradient" data-bg-gradient data-anim="0"></div>' +
          '<div class="dc-bg-image" data-bg-image data-fade="0"></div>' +
          '<div class="dc-bg-overlay" data-bg-overlay></div>' +
        '</div>' +
        '<div class="dc-stage">' +
          '<div class="dc-panel" data-panel data-border="animated-gradient">' +
            '<button class="dc-gear" data-gear aria-label="Settings" type="button"><i class="bi-gear-fill"></i></button>' +
            '<div class="dc-time" data-time data-seconds="1">' +
              '<span class="dc-h" data-h>00</span>' +
              '<span class="dc-sep">:</span>' +
              '<span class="dc-m" data-m>00</span>' +
              '<span class="dc-sep dc-sep--sec">:</span>' +
              '<span class="dc-s" data-s>00</span>' +
              '<span class="dc-ampm" data-ampm hidden></span>' +
            '</div>' +
            '<div class="dc-date" data-date></div>' +
            '<div class="dc-tz" data-tz></div>' +
          '</div>' +
        '</div>' +
        this._settingsHtml();
      this.shadowRoot.appendChild(root);
    }

    _settingsHtml() {
      return '' +
        '<div class="dc-settings" data-settings hidden>' +
          '<div class="dc-settings-head">' +
            '<span class="dc-settings-title"><i class="bi-sliders"></i> Clock settings</span>' +
            '<button class="dc-close" data-close type="button" aria-label="Close"><i class="bi-x-lg"></i></button>' +
          '</div>' +
          '<div class="dc-settings-body">' +
            '<fieldset><legend>Time</legend>' +
              '<label>Format <select data-c-format>' +
                '<option value="24">24-hour</option><option value="12">12-hour</option></select></label>' +
              '<label>Time zone <select data-c-tz>' + options(TIMEZONES, 'auto') + '</select></label>' +
              '<label>Locale <select data-c-locale>' + options(LOCALES, 'auto') + '</select></label>' +
              '<label class="dc-check"><input type="checkbox" data-c-seconds> Show seconds</label>' +
              '<label class="dc-check"><input type="checkbox" data-c-ampm> Show AM / PM</label>' +
              '<label class="dc-check"><input type="checkbox" data-c-date> Show date</label>' +
              '<label class="dc-check"><input type="checkbox" data-c-tzlabel> Show time zone</label>' +
            '</fieldset>' +
            '<fieldset><legend>Look</legend>' +
              '<label>Theme <select data-c-theme>' + options(THEMES, 'auto') + '</select></label>' +
              '<label>Font <select data-c-font>' + options(Object.keys(FONTS).map((k) => [k, FONTS[k].name]), 'digital-7seg') + '</select></label>' +
              '<label>Text size <select data-c-size>' +
                '<option value="sm">Small</option><option value="md">Medium</option>' +
                '<option value="lg">Large</option><option value="xl">Extra large</option></select></label>' +
              '<label>Glass blur <input type="range" min="0" max="40" value="18" data-c-blur></label>' +
              '<label>Border <select data-c-border>' +
                '<option value="none">None</option><option value="solid">Solid</option>' +
                '<option value="gradient">Gradient</option><option value="animated-gradient">Animated gradient</option></select></label>' +
            '</fieldset>' +
            '<fieldset><legend>Background</legend>' +
              '<label>Mode <select data-c-bgmode>' +
                '<option value="image">Image</option><option value="slideshow">Slideshow</option>' +
                '<option value="gradient">Neon gradient</option><option value="none">None</option></select></label>' +
              '<label>Image fit <select data-c-bgfit>' +
                '<option value="cover">Cover (crop)</option><option value="contain">Contain (letterbox)</option>' +
                '<option value="fill">Fill (stretch)</option><option value="center">Center (no scale)</option></select></label>' +
              '<label>Image <input type="file" accept="image/*" data-c-bgfile></label>' +
            '</fieldset>' +
          '</div>' +
          '<div class="dc-settings-foot">' +
            '<button class="dc-btn dc-btn--ghost" data-c-reset type="button">Reset</button>' +
          '</div>' +
        '</div>';
    }

    _cacheRefs() {
      const sr = this.shadowRoot;
      const by = (sel) => sr.querySelector(sel);
      return {
        panel: by('[data-panel]'),
        time: by('[data-time]'),
        h: by('[data-h]'), m: by('[data-m]'), s: by('[data-s]'),
        ampm: by('[data-ampm]'),
        date: by('[data-date]'), tz: by('[data-tz]'),
        gear: by('[data-gear]'),
        settings: by('[data-settings]'), close: by('[data-close]'),
        bgGradient: by('[data-bg-gradient]'),
        bgImage: by('[data-bg-image]'),
        bgOverlay: by('[data-bg-overlay]'),
        c: {
          format: by('[data-c-format]'), tz: by('[data-c-tz]'), locale: by('[data-c-locale]'),
          seconds: by('[data-c-seconds]'), ampm: by('[data-c-ampm]'), date: by('[data-c-date]'), tzlabel: by('[data-c-tzlabel]'),
          theme: by('[data-c-theme]'), font: by('[data-c-font]'), size: by('[data-c-size]'),
          blur: by('[data-c-blur]'), border: by('[data-c-border]'),
          bgmode: by('[data-c-bgmode]'), bgfit: by('[data-c-bgfit]'), bgfile: by('[data-c-bgfile]'),
          reset: by('[data-c-reset]')
        }
      };
    }

    /* ---- apply whole config ---- */
    _applyAll() {
      this._applyTheme();
      this._applyFonts();
      this._applySize();
      this._applyGlass();
      this._applyBorder();
      this._applyBackground();
      this._applyTimeFlags();
      this._updateTime(true);
      if (this._refs.gear) {
        this._refs.gear.style.display = (this._cfg.features && this._cfg.features.settingsPanel) ? '' : 'none';
      }
    }

    _applyTheme() {
      const t = (this._cfg.style && this._cfg.style.theme) || 'auto';
      this.setAttribute('data-theme', t);
    }

    _applyFonts() {
      const f = (this._cfg.style && this._cfg.style.font) || {};
      const key = f.family || 'digital-7seg';
      const preset = FONTS[key];
      const digitFamily = preset ? preset.digit : key;        // unknown key = raw family string
      const labelFamily = preset ? preset.label : ('Inter, system-ui, sans-serif');
      this.style.setProperty('--dc-digit-font', digitFamily);
      this.style.setProperty('--dc-label-font', labelFamily);
      if (f.weight) this.style.setProperty('--dc-digit-weight', f.weight);
    }

    _applySize() {
      const s = (this._cfg.style && this._cfg.style.font && this._cfg.style.font.size) || 'md';
      const scale = SIZES[s] != null ? SIZES[s] : 1;
      this.style.setProperty('--dc-scale', scale);
    }

    _applyGlass() {
      const g = (this._cfg.style && this._cfg.style.glass) || {};
      if (g.blur != null) this.style.setProperty('--dc-glass-blur', g.blur + 'px');
      if (g.opacity != null) this.style.setProperty('--dc-glass-opacity', g.opacity);
      this.style.setProperty('--dc-liquid', g.liquid === false ? 0 : 1);
    }

    _applyBorder() {
      const b = (this._cfg.style && this._cfg.style.border) || {};
      const mode = b.mode || 'animated-gradient';
      if (this._refs.panel) this._refs.panel.setAttribute('data-border', mode);
      if (b.width != null) this.style.setProperty('--dc-border-width', b.width + 'px');
      if (b.color) this.style.setProperty('--dc-border-color', b.color);
      if (b.gradientColors && b.gradientColors.length) {
        this.style.setProperty('--dc-border-grad', 'linear-gradient(135deg, ' + b.gradientColors.join(', ') + ')');
      }
      if (b.animationDuration != null) this.style.setProperty('--dc-border-anim-dur', b.animationDuration + 's');
    }

    _buildGradient(g) {
      g = g || {};
      const colors = (g.colors && g.colors.length) ? g.colors : ['#0f172a', '#1e1b4b', '#312e81'];
      const stops = colors.join(', ');
      const angle = (g.angle != null) ? g.angle : 135;
      if (g.type === 'radial') return 'radial-gradient(120% 120% at 50% 30%, ' + stops + ')';
      if (g.type === 'conic')  return 'conic-gradient(from ' + angle + 'deg at 50% 45%, ' + stops + ')';
      return 'linear-gradient(' + angle + 'deg, ' + stops + ')';
    }

    _applyBackground() {
      const bg = this._cfg.background || {};
      const mode = bg.mode || 'image';
      const r = this._refs;

      r.bgGradient.style.backgroundImage = this._buildGradient(bg.gradient);
      r.bgGradient.setAttribute('data-anim', (bg.gradient && bg.gradient.animate !== false) ? '1' : '0');

      this.style.setProperty('--dc-bg-fit', fitToCss(bg.fit));
      if (bg.position) this.style.setProperty('--dc-bg-position', bg.position);

      if (bg.overlay === false) {
        r.bgOverlay.style.background = 'transparent';
      } else if (bg.overlayColor) {
        this.style.setProperty('--dc-bg-overlay', bg.overlayColor);
        r.bgOverlay.style.background = 'var(--dc-bg-overlay)';
      }

      this._stopSlideshow();

      if (mode === 'gradient') {
        // Clear the image so the neon gradient shows through instantly
        // (don't rely on the 1.2s opacity transition for a mode switch).
        r.bgImage.style.backgroundImage = 'none';
        r.bgImage.style.opacity = '0';
        r.bgGradient.style.display = '';
      } else if (mode === 'none') {
        r.bgImage.style.backgroundImage = 'none';
        r.bgImage.style.opacity = '0';
        r.bgGradient.style.display = 'none';
      } else if (mode === 'image') {
        r.bgGradient.style.display = '';
        const url = resolveUrl(bg.image);
        if (url) {
          r.bgImage.style.backgroundImage = "url('" + url + "')";
          r.bgImage.style.opacity = '1';
          r.bgImage.setAttribute('data-fade', '0');
        } else {
          r.bgImage.style.opacity = '0';
        }
      } else if (mode === 'slideshow') {
        r.bgGradient.style.display = '';
        const imgs = (bg.images && bg.images.length) ? bg.images : (bg.image ? [bg.image] : []);
        this._slides = imgs.map(resolveUrl).filter(Boolean);
        this._slideIdx = 0;
        if (this._slides.length) {
          r.bgImage.style.backgroundImage = "url('" + this._slides[0] + "')";
          r.bgImage.style.opacity = '1';
          this._startSlideshow();
        } else {
          r.bgImage.style.opacity = '0';
        }
      }
    }

    _startSlideshow() {
      if (!this._slides || this._slides.length < 2) return;
      const self = this;
      const interval = (this._cfg.background.slideshowInterval || 8) * 1000;
      const transition = (this._cfg.background.slideshowTransition || 1200);
      this._slideTimer = setInterval(() => {
        self._slideIdx = (self._slideIdx + 1) % self._slides.length;
        const next = self._slides[self._slideIdx];
        const img = self._refs.bgImage;
        img.setAttribute('data-fade', '1');
        setTimeout(() => {
          img.style.backgroundImage = "url('" + next + "')";
          img.setAttribute('data-fade', '0');
        }, transition);
      }, interval);
    }
    _stopSlideshow() {
      if (this._slideTimer) { clearInterval(this._slideTimer); this._slideTimer = null; }
    }

    _applyTimeFlags() {
      const c = this._cfg.clock || {};
      if (this._refs.time) this._refs.time.setAttribute('data-seconds', c.showSeconds ? '1' : '0');
    }

    /* ---- clock tick ---- */
    _startClock() {
      this._stopClock();
      this._updateTime(true);
      this._tick = setInterval(() => this._updateTime(), 250);
    }
    _stopClock() {
      if (this._tick) { clearInterval(this._tick); this._tick = null; }
    }

    _updateTime(force) {
      if (!this._refs) return;
      const c = this._cfg.clock || {};
      const now = new Date();
      const tz = c.timezone === 'auto' ? undefined : c.timezone;
      const locale = c.locale === 'auto' ? undefined : c.locale;
      const hour12 = c.format === '12';

      const key = now.getTime();
      const bucket = c.showSeconds ? Math.floor(key / 250) : Math.floor(key / 1000);
      if (!force && bucket === this._lastBucket) return;
      this._lastBucket = bucket;

      let parts;
      try {
        parts = new Intl.DateTimeFormat(locale, {
          timeZone: tz, hour12: hour12, hour: '2-digit', minute: '2-digit',
          second: c.showSeconds ? '2-digit' : undefined
        }).formatToParts(now);
      } catch (e) {
        parts = new Intl.DateTimeFormat(undefined, {
          hour12: hour12, hour: '2-digit', minute: '2-digit', second: c.showSeconds ? '2-digit' : undefined
        }).formatToParts(now);
      }
      let h = '', m = '', s = '', ap = '';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.type === 'hour') h = p.value;
        else if (p.type === 'minute') m = p.value;
        else if (p.type === 'second') s = p.value;
        else if (p.type === 'dayPeriod') ap = p.value;
      }
      h = String(h).padStart(2, '0');
      m = String(m).padStart(2, '0');
      if (s) s = String(s).padStart(2, '0');

      if (this._refs.h.textContent !== h) this._refs.h.textContent = h;
      if (this._refs.m.textContent !== m) this._refs.m.textContent = m;
      if (c.showSeconds && this._refs.s.textContent !== s) this._refs.s.textContent = s;

      if (hour12 && c.showAmPm && ap) {
        this._refs.ampm.hidden = false;
        if (this._refs.ampm.textContent !== ap) this._refs.ampm.textContent = ap;
      } else {
        this._refs.ampm.hidden = true;
      }

      if (c.showDate) {
        try {
          const df = new Intl.DateTimeFormat(locale, {
            timeZone: tz,
            weekday: c.dateStyle === 'short' ? 'short' : 'long',
            year: 'numeric', month: c.dateStyle === 'short' ? 'short' : 'long', day: 'numeric'
          });
          const d = df.format(now);
          if (this._refs.date.textContent !== d) this._refs.date.textContent = d;
          this._refs.date.hidden = false;
        } catch (e) { this._refs.date.hidden = true; }
      } else this._refs.date.hidden = true;

      if (c.showTimezone) {
        let label = tz || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local');
        try {
          const of = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(now);
          for (let j = 0; j < of.length; j++) if (of[j].type === 'timeZoneName') { label += ' \u00B7 ' + of[j].value; break; }
        } catch (e) {}
        if (this._refs.tz.textContent !== label) this._refs.tz.textContent = label;
        this._refs.tz.hidden = false;
      } else this._refs.tz.hidden = true;
    }

    /* ---- settings wiring ---- */
    _wireSettings() {
      const self = this;
      const r = this._refs;
      const open = () => { r.settings.hidden = false; };
      const close = () => { r.settings.hidden = true; };

      r.gear.addEventListener('click', (e) => { e.stopPropagation(); r.settings.hidden ? open() : close(); });
      r.close.addEventListener('click', () => close());

      this.addEventListener('click', function (e) {
        const path = e.composedPath && e.composedPath();
        if (!path) return;
        const inSettings = path.indexOf(r.settings) !== -1;
        const onGear = path.indexOf(r.gear) !== -1;
        if (!inSettings && !onGear && !r.settings.hidden) close();
      });

      const apply = (partial) => self.setConfig(partial);

      r.c.format.addEventListener('change', () => apply({ clock: { format: r.c.format.value } }));
      r.c.tz.addEventListener('change', () => apply({ clock: { timezone: r.c.tz.value } }));
      r.c.locale.addEventListener('change', () => apply({ clock: { locale: r.c.locale.value } }));
      r.c.seconds.addEventListener('change', () => apply({ clock: { showSeconds: r.c.seconds.checked } }));
      r.c.ampm.addEventListener('change', () => apply({ clock: { showAmPm: r.c.ampm.checked } }));
      r.c.date.addEventListener('change', () => apply({ clock: { showDate: r.c.date.checked } }));
      r.c.tzlabel.addEventListener('change', () => apply({ clock: { showTimezone: r.c.tzlabel.checked } }));
      r.c.theme.addEventListener('change', () => apply({ style: { theme: r.c.theme.value } }));
      r.c.font.addEventListener('change', () => apply({ style: { font: { family: r.c.font.value } } }));
      r.c.size.addEventListener('change', () => apply({ style: { font: { size: r.c.size.value } } }));
      r.c.blur.addEventListener('input', () => apply({ style: { glass: { blur: +r.c.blur.value } } }));
      r.c.border.addEventListener('change', () => apply({ style: { border: { mode: r.c.border.value } } }));
      r.c.bgmode.addEventListener('change', () => apply({ background: { mode: r.c.bgmode.value } }));
      r.c.bgfit.addEventListener('change', () => apply({ background: { fit: r.c.bgfit.value } }));
      r.c.reset.addEventListener('click', () => self.resetConfig());

      r.c.bgfile.addEventListener('change', () => {
        const f = r.c.bgfile.files && r.c.bgfile.files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        apply({ background: { mode: 'image', image: url } });
      });

      if (this._cfg.features && this._cfg.features.keyboardShortcuts) {
        this._keyHandler = (e) => {
          if (e.key === 'Escape') close();
          else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            r.settings.hidden ? open() : close();
            e.preventDefault();
          }
        };
        this.addEventListener('keydown', this._keyHandler);
      }

      this._syncSettingsUI();
    }

    _syncSettingsUI() {
      if (!this._refs || !this._refs.c.format) return;
      const c = this._cfg.clock || {};
      const s = this._cfg.style || {};
      const b = this._cfg.background || {};
      const r = this._refs.c;
      r.format.value = c.format || '24';
      r.tz.value = c.timezone || 'auto';
      r.locale.value = c.locale || 'auto';
      r.seconds.checked = !!c.showSeconds;
      r.ampm.checked = !!c.showAmPm;
      r.date.checked = !!c.showDate;
      r.tzlabel.checked = !!c.showTimezone;
      r.theme.value = s.theme || 'auto';
      r.font.value = (s.font && s.font.family) || 'digital-7seg';
      r.size.value = (s.font && s.font.size) || 'md';
      r.blur.value = (s.glass && s.glass.blur != null) ? s.glass.blur : 18;
      r.border.value = (s.border && s.border.mode) || 'animated-gradient';
      r.bgmode.value = b.mode || 'image';
      r.bgfit.value = b.fit || 'cover';
    }
  }

  if (!window.customElements.get('digital-clock')) {
    try { window.customElements.define('digital-clock', DigitalClock); }
    catch (e) { console.error('[digital-clock] registration failed:', e); }
  }
  window.DigitalClock = DigitalClock;
})();
