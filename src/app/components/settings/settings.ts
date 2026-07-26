import { Component, OnInit, Renderer2, Inject, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users/users';

interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans' | 'georgia';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  letterSpacing: 'tight' | 'normal' | 'wide';
  primaryColor: string;
  secondaryColor: string;
  contrast: 'default' | 'high';
  reduceMotion: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  private userService = inject(UserService);
  
  preferences: UserPreferences = {
    fontSize: 'medium',
    fontFamily: 'system',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    primaryColor: '217 119 6',
    secondaryColor: '234 88 12',
    contrast: 'default',
    reduceMotion: false
  };

  // Configuraciones disponibles
  fontSizes = [
    { value: 'small', label: 'Pequeño', description: 'Más contenido en pantalla' },
    { value: 'medium', label: 'Mediano', description: 'Tamaño estándar' },
    { value: 'large', label: 'Grande', description: 'Texto más legible' },
    { value: 'x-large', label: 'Extra Grande', description: 'Máxima legibilidad' }
  ] as const;

  fontFamilies = [
    { value: 'system', label: 'Sistema', description: 'Fuente de tu sistema operativo' },
    { value: 'inter', label: 'Inter', description: 'Moderno y legible' },
    { value: 'roboto', label: 'Roboto', description: 'Google Fonts estándar' },
    { value: 'open-sans', label: 'Open Sans', description: 'Amigable y clara' },
    { value: 'georgia', label: 'Georgia', description: 'Elegante y serif' }
  ] as const;

  lineHeights = [
    { value: 'tight', label: 'Compacto', description: 'Menor espacio entre líneas' },
    { value: 'normal', label: 'Normal', description: 'Espaciado estándar' },
    { value: 'relaxed', label: 'Amplio', description: 'Mayor espacio entre líneas' }
  ] as const;

  letterSpacings = [
    { value: 'tight', label: 'Apretado', description: 'Letras más juntas' },
    { value: 'normal', label: 'Normal', description: 'Espaciado estándar' },
    { value: 'wide', label: 'Amplio', description: 'Letras más separadas' }
  ] as const;

  colorPresets = [
    { primary: '217 119 6', secondary: '234 88 12', name: 'Ámbar', description: 'Tema cálido' },
    { primary: '59 130 246', secondary: '139 92 246', name: 'Azul', description: 'Tema profesional' },
    { primary: '16 185 129', secondary: '245 158 11', name: 'Verde', description: 'Tema fresco' },
    { primary: '168 85 247', secondary: '236 72 153', name: 'Púrpura', description: 'Tema creativo' },
    { primary: '239 68 68', secondary: '249 115 22', name: 'Rojo', description: 'Tema energético' }
  ];

  contrasts = [
    { value: 'default', label: 'Estándar', description: 'Contraste normal' },
    { value: 'high', label: 'Alto Contraste', description: 'Mejor legibilidad' }
  ] as const;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.loadPreferencesFromBackend();
  }

  // ✅ Aplicar cambios inmediatamente sin guardar
  onSettingChange() {
    this.applyPreferences();
  }

  onColorChange(preset: any) {
    this.preferences.primaryColor = preset.primary;
    this.preferences.secondaryColor = preset.secondary;
    this.applyPreferences();
  }

  loadPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      this.preferences = { ...this.preferences, ...JSON.parse(saved) };
    }
  }

  loadPreferencesFromBackend() {
    this.userService.getUserProfile().subscribe({
      next: (user: any) => {
        if (user.preferences) {
          try {
            const parsed = JSON.parse(user.preferences);
            this.preferences = { ...this.preferences, ...parsed };
          } catch {}
        }
        this.applyPreferences();
      },
      error: () => {
        this.loadPreferences();
        this.applyPreferences();
      }
    });
  }

  savePreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    this.userService.updatePreferences(JSON.stringify(this.preferences)).subscribe({
      error: () => {}
    });
    this.showSaveFeedback();
  }

  applyPreferences() {
    const html = this.document.documentElement;
    
    this.renderer.setStyle(html, '--user-primary-color', this.preferences.primaryColor);
    this.renderer.setStyle(html, '--user-secondary-color', this.preferences.secondaryColor);
    
    this.removeAllPreferenceClasses(html);
    
    this.renderer.addClass(html, `global-font-size-${this.preferences.fontSize}`);
    this.renderer.addClass(html, `global-font-family-${this.preferences.fontFamily}`);
    this.renderer.addClass(html, `global-line-height-${this.preferences.lineHeight}`);
    this.renderer.addClass(html, `global-letter-spacing-${this.preferences.letterSpacing}`);
    this.renderer.addClass(html, `global-contrast-${this.preferences.contrast}`);
    
    if (this.preferences.reduceMotion) {
      this.renderer.addClass(html, 'global-reduce-motion');
    } else {
      this.renderer.removeClass(html, 'global-reduce-motion');
    }
    
    // 3. Forzar actualización
    this.forceStyleUpdate();
  }

  private removeAllPreferenceClasses(element: HTMLElement) {
    const classesToRemove = Array.from(element.classList).filter(className => 
      className.startsWith('global-font-') ||
      className.startsWith('global-line-') ||
      className.startsWith('global-letter-') ||
      className.startsWith('global-contrast-') ||
      className === 'global-reduce-motion'
    );
    
    classesToRemove.forEach(className => {
      this.renderer.removeClass(element, className);
    });
  }

  private forceStyleUpdate() {
    // Truco para forzar que el navegador recalcule los estilos
    const body = this.document.body;
    body.style.display = 'none';
    body.offsetHeight; // Trigger reflow
    body.style.display = '';
  }

  resetToDefault() {
    this.preferences = {
      fontSize: 'medium',
      fontFamily: 'system',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      primaryColor: '217 119 6',
      secondaryColor: '234 88 12',
      contrast: 'default',
      reduceMotion: false
    };
    this.applyPreferences();
  }

  // Métodos de utilidad
  getCurrentLabel(options: readonly any[], currentValue: string): string {
    const option = options.find(opt => opt.value === currentValue);
    return option ? option.label : currentValue;
  }

  getOptionClass(settingType: string, value: string): string {
    const isActive = this.preferences[settingType as keyof UserPreferences] === value;
    return isActive ? 'option-card active' : 'option-card';
  }

  isColorPresetActive(preset: any): boolean {
    return this.preferences.primaryColor === preset.primary && 
           this.preferences.secondaryColor === preset.secondary;
  }

  getColorPresetName(): string {
    const preset = this.colorPresets.find(p => 
      p.primary === this.preferences.primaryColor && 
      p.secondary === this.preferences.secondaryColor
    );
    return preset ? preset.name : 'Personalizado';
  }

  getCurrentPrimaryColor(): string {
    return `rgb(${this.preferences.primaryColor})`;
  }

  getCurrentSecondaryColor(): string {
    return `rgb(${this.preferences.secondaryColor})`;
  }

  private showSaveFeedback() {
    const toast = this.document.createElement('div');
    toast.textContent = '✅ Preferencias guardadas';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    this.renderer.appendChild(this.document.body, toast);
    
    setTimeout(() => {
      this.renderer.removeChild(this.document.body, toast);
    }, 2000);
  }
}