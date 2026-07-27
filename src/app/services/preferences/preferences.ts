import { Injectable, inject, PLATFORM_ID, Inject, Renderer2, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from '../users/users';

export interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans' | 'georgia';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  letterSpacing: 'tight' | 'normal' | 'wide';
  primaryColor: string;
  secondaryColor: string;
  contrast: 'default' | 'high';
  reduceMotion: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  fontSize: 'medium',
  fontFamily: 'system',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  primaryColor: '217 119 6',
  secondaryColor: '234 88 12',
  contrast: 'default',
  reduceMotion: false,
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private userService = inject(UserService);
  private renderer: Renderer2;
  private styleEl: HTMLStyleElement | null = null;
  private initialized = false;

  preferences: UserPreferences = { ...DEFAULT_PREFS };

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  init(): Promise<void> {
    if (!this.isBrowser || this.initialized) return Promise.resolve();
    this.initialized = true;

    return new Promise((resolve) => {
      this.userService.getUserProfile().subscribe({
        next: (user: any) => {
          if (user.preferences) {
            try {
              const parsed = JSON.parse(user.preferences);
              this.preferences = { ...DEFAULT_PREFS, ...parsed };
            } catch { /* keep defaults */ }
          } else {
            this.loadFromLocal();
          }
          this.applyAll();
          resolve();
        },
        error: () => {
          this.loadFromLocal();
          this.applyAll();
          resolve();
        },
      });
    });
  }

  private loadFromLocal() {
    if (!this.isBrowser) return;
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        this.preferences = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch { /* keep defaults */ }
  }

  updatePreferences(prefs: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
    this.applyAll();
  }

  saveAndApply() {
    if (this.isBrowser) {
      localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    }
    this.userService.updatePreferences(JSON.stringify(this.preferences)).subscribe({
      error: () => {},
    });
    this.applyAll();
  }

  resetToDefault() {
    this.preferences = { ...DEFAULT_PREFS };
    this.applyAll();
  }

  private applyAll() {
    if (!this.isBrowser) return;

    const html = document.documentElement;

    this.applyFontSettings(html);
    this.applyColorOverrides(html);
    this.applyAccessibility(html);
  }

  private applyFontSettings(html: HTMLElement) {
    html.className = html.className
      .split(' ')
      .filter((c) => !c.startsWith('global-'))
      .join(' ');

    html.classList.add(
      `global-font-size-${this.preferences.fontSize}`,
      `global-font-family-${this.preferences.fontFamily}`,
      `global-line-height-${this.preferences.lineHeight}`,
      `global-letter-spacing-${this.preferences.letterSpacing}`,
      `global-contrast-${this.preferences.contrast}`
    );

    if (this.preferences.reduceMotion) {
      html.classList.add('global-reduce-motion');
    }
  }

  private applyAccessibility(html: HTMLElement) {
    if (this.preferences.contrast === 'high') {
      html.classList.add('global-contrast-high');
    } else {
      html.classList.remove('global-contrast-high');
    }
  }

  private applyColorOverrides(html: HTMLElement) {
    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.id = 'dynamic-theme-overrides';
      document.head.appendChild(this.styleEl);
    }

    const primary = this.hexToHsl(this.preferences.primaryColor);
    const secondary = this.hexToHsl(this.preferences.secondaryColor);
    const primaryShades = this.generateShades(primary);
    const secondaryShades = this.generateShades(secondary);

    const css = this.buildThemeCSS(primaryShades, secondaryShades);
    this.styleEl.textContent = css;
  }

  private buildThemeCSS(primary: string[], secondary: string[]): string {
    let css = '';

    const utilities = [
      { prefix: 'bg', prop: 'background-color' },
      { prefix: 'text', prop: 'color' },
      { prefix: 'border', prop: 'border-color' },
      { prefix: 'from', prop: '--tw-gradient-from' },
      { prefix: 'to', prop: '--tw-gradient-to' },
      { prefix: 'ring', prop: '--tw-ring-color' },
    ];

    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const hovers = ['hover:bg', 'hover:text', 'hover:border', 'hover:ring'];
    const focus = ['focus:bg', 'focus:text', 'focus:border', 'focus:ring'];
    const groupHovers = ['group-hover:text'];

    for (const util of utilities) {
      shades.forEach((shade, i) => {
        css += `.${util.prefix}-amber-${shade}{${util.prop}:${primary[i]}!important}\n`;
        css += `.${util.prefix}-orange-${shade}{${util.prop}:${secondary[i]}!important}\n`;
      });

      for (const hv of hovers) {
        const pfx = hv.replace('hover:', '');
        if (pfx !== util.prefix) continue;
        shades.forEach((shade, i) => {
          css += `.${hv}-amber-${shade}{${util.prop}:${primary[i]}!important}\n`;
          css += `.${hv}-orange-${shade}{${util.prop}:${secondary[i]}!important}\n`;
        });
      }

      for (const fc of focus) {
        const pfx = fc.replace('focus:', '');
        if (pfx !== util.prefix) continue;
        shades.forEach((shade, i) => {
          css += `.${fc}-amber-${shade}{${util.prop}:${primary[i]}!important}\n`;
          css += `.${fc}-orange-${shade}{${util.prop}:${secondary[i]}!important}\n`;
        });
      }

      for (const gh of groupHovers) {
        const pfx = gh.replace('group-hover:', '');
        if (pfx !== util.prefix) continue;
        shades.forEach((shade, i) => {
          css += `.${gh}-amber-${shade}{${util.prop}:${primary[i]}!important}\n`;
          css += `.${gh}-orange-${shade}{${util.prop}:${secondary[i]}!important}\n`;
        });
      }
    }

    css += `.shadow-amber-500/25{--tw-shadow-color:0 0 0 0 0 0 0 0 ${primary[5]};box-shadow:var(--tw-shadow)!important}\n`;
    css += `.shadow-amber-500/40{--tw-shadow-color:0 0 0 0 0 0 0 0 ${primary[5]};box-shadow:var(--tw-shadow)!important}\n`;

    css += `.divide-orange-200>*+*{border-color:${secondary[2]}!important}\n`;

    css += `.file\\:bg-amber-50::file-selector-button{background-color:${primary[0]}!important}\n`;
    css += `.file\\:text-amber-700::file-selector-button{color:${primary[6]}!important}\n`;
    css += `.hover\\:file\\:bg-amber-100::file-selector-button:hover{background-color:${primary[1]}!important}\n`;

    css += `.text-amber-600\\/60{color:${primary[5]}b3!important}\n`;
    css += `.text-amber-600\\/70{color:${primary[5]}b3!important}\n`;
    css += `.text-amber-700\\/60{color:${primary[6]}99!important}\n`;
    css += `.text-amber-700\\/70{color:${primary[6]}b3!important}\n`;
    css += `.text-amber-700\\/80{color:${primary[6]}cc!important}\n`;
    css += `.text-amber-800\\/70{color:${primary[7]}b3!important}\n`;

    css += `.bg-amber-50\\/20{background-color:${primary[0]}33!important}\n`;
    css += `.bg-amber-50\\/50{background-color:${primary[0]}80!important}\n`;
    css += `.bg-orange-50\\/20{background-color:${secondary[0]}33!important}\n`;
    css += `.bg-orange-50\\/30{background-color:${secondary[0]}4d!important}\n`;
    css += `.bg-orange-50\\/50{background-color:${secondary[0]}80!important}\n`;

    css += `.border-amber-200\\/30{border-color:${primary[2]}4d!important}\n`;
    css += `.border-orange-200\\/20{border-color:${secondary[2]}33!important}\n`;
    css += `.border-orange-200\\/30{border-color:${secondary[2]}4d!important}\n`;
    css += `.border-orange-200\\/40{border-color:${secondary[2]}66!important}\n`;
    css += `.border-orange-200\\/50{border-color:${secondary[2]}80!important}\n`;

    css += `.from-orange-50\\/50{--tw-gradient-from:${secondary[0]}80!important}\n`;
    css += `.to-amber-50\\/30{--tw-gradient-to:${primary[0]}4d!important}\n`;
    css += `.hover\\:bg-orange-50\\/30:hover{background-color:${secondary[0]}4d!important}\n`;
    css += `.hover\\:bg-orange-100\\/50:hover{background-color:${secondary[1]}80!important}\n`;

    return css;
  }

  private hexToHsl(rgbString: string): [number, number, number] {
    const parts = rgbString.split(' ').map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      return this.rgbToHsl(parts[0], parts[1], parts[2]);
    }
    return [40, 80, 45];
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  private generateShades(hsl: [number, number, number]): string[] {
    const [h, s] = hsl;
    const configs = [
      { s: Math.max(s - 30, 5), l: 97 },
      { s: Math.max(s - 25, 10), l: 92 },
      { s: Math.max(s - 15, 15), l: 83 },
      { s: Math.max(s - 8, 20), l: 70 },
      { s: Math.max(s - 2, 25), l: 58 },
      { s, l: 45 },
      { s: Math.min(s + 5, 100), l: 38 },
      { s: Math.min(s + 8, 100), l: 31 },
      { s: Math.min(s + 10, 100), l: 24 },
      { s: Math.min(s + 12, 100), l: 17 },
    ];
    return configs.map(
      (c) => `hsl(${h}, ${c.s}%, ${c.l}%)`
    );
  }
}
