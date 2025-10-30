import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users/users';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private userService = inject(UserService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  loading = false;

  onPasswordInput() {
    this.error = '';
  }

  getSecurityLevel(): string {
    if (!this.password) return 'bajo';
    if (this.password.length >= 10) return 'alto';
    if (this.password.length >= 6) return 'medio';
    return 'bajo';
  }

  getSecurityText(): string {
    const level = this.getSecurityLevel();
    switch (level) {
      case 'alto':
        return 'Contraseña segura 🔒';
      case 'medio':
        return 'Contraseña aceptable 🟡';
      default:
        return 'Contraseña débil 🔓';
    }
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }
    this.loading = true;
    this.error = '';
    this.userService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.accessToken) {
          const userRole = this.userService.getUserRole();
          console.log('ROL DEL USUARIO:', userRole);

          if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_LIBRARIAN') {
            this.router.navigate(['/dashboard']);
          } else if (userRole === 'ROLE_USER') {
            this.router.navigate(['/dashboard-user']);
          } else {
            this.router.navigate(['/dashboard-user']);
          }
        } else {
          this.error = 'No se recibió token de acceso';
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error de login:', err);
        if (err.status === 0) {
          this.error = 'Error de conexión con el servidor';
        } else if (err.status === 401) {
          this.error = 'Email o contraseña incorrectos';
        } else {
          this.error = err.error?.message || 'Error al iniciar sesión';
        }
      },
    });
  }
}
