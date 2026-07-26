import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/users/users';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📖</span>
          </div>
          <h1 class="text-2xl font-bold text-amber-900">Crear Cuenta</h1>
          <p class="text-amber-700 mt-2">Unete a nuestra biblioteca</p>
        </div>

        <form (ngSubmit)="onRegister()" class="space-y-4">
          <div>
            <label class="block text-amber-800 font-medium mb-2">Nombre</label>
            <input type="text" [(ngModel)]="name" name="name"
              class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
              placeholder="Tu nombre" required />
          </div>
          <div>
            <label class="block text-amber-800 font-medium mb-2">Email</label>
            <input type="email" [(ngModel)]="email" name="email"
              class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
              placeholder="tu@email.com" required />
          </div>
          <div>
            <label class="block text-amber-800 font-medium mb-2">Contrasena</label>
            <input type="password" [(ngModel)]="password" name="password"
              class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
              placeholder="Minimo 6 caracteres" required />
          </div>

          <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>

          <button type="submit" [disabled]="loading"
            class="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50">
            {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-amber-700">
            Ya tienes cuenta?
            <a routerLink="/login" class="text-amber-600 font-semibold hover:underline">Iniciar Sesion</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  onRegister() {
    if (!this.name || !this.email || !this.password) {
      this.error = 'Todos los campos son requeridos';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'La contrasena debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.userService.register({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al crear la cuenta';
      }
    });
  }
}
