import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PreferencesService, UserPreferences } from '../../services/preferences/preferences';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
  private prefsService = inject(PreferencesService);

  preferences: UserPreferences = { ...this.prefsService.preferences };

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

  ngOnInit() {
    this.preferences = { ...this.prefsService.preferences };
  }

  onSettingChange() {
    this.prefsService.updatePreferences(this.preferences);
  }

  onColorChange(preset: any) {
    this.preferences.primaryColor = preset.primary;
    this.preferences.secondaryColor = preset.secondary;
    this.prefsService.updatePreferences(this.preferences);
  }

  savePreferences() {
    this.prefsService.updatePreferences(this.preferences);
    this.prefsService.saveAndApply();
    this.showSaveFeedback();
  }

  resetToDefault() {
    this.prefsService.resetToDefault();
    this.preferences = { ...this.prefsService.preferences };
  }

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
    const toast = document.createElement('div');
    toast.textContent = '✅ Preferencias guardadas';
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}
