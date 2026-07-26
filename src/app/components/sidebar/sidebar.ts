import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/users/users';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  private userService = inject(UserService);
  
  userRole: 'admin' | 'librarian' | 'user' = 'user';
  userProfile: any = null;
  isLoading: boolean = true;
  error: string = '';


  adminMenu = [
    {
      title: 'PRINCIPAL',
      items: [{ label: 'Dashboard', route: '/dashboard', icon: '📊', badge: '' }]
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Usuarios', route: '/user', icon: '👥', badge: '' },
        { label: 'Préstamos', route: '/loans', icon: '📚', badge: '' },
        { label: 'Libros', route: '/book', icon: '📖', badge: '' },
        { label: 'Autores', route: '/author', icon: '✍️', badge: '' }
      ]
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { label: 'Perfil', route: '/profile', icon: '👤', badge: '' },
        { label: 'Ajustes', route: '/settings', icon: '⚙️', badge: '' }
      ]
    }
  ];

  librarianMenu = [
    {
      title: 'PRINCIPAL',
      items: [{ label: 'Dashboard', route: '/dashboard', icon: '📊', badge: '' }]
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Préstamos', route: '/loans', icon: '📚', badge: '' },
        { label: 'Libros', route: '/book', icon: '📖', badge: '' },
        { label: 'Autores', route: '/author', icon: '✍️', badge: '' }
      ]
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { label: 'Perfil', route: '/profile', icon: '👤', badge: '' },
        { label: 'Ajustes', route: '/settings', icon: '⚙️', badge: '' }
      ]
    }
  ];

  userMenu = [
    {
      title: 'MI ESPACIO',
      items: [
        { label: 'Dashboard', route: '/dashboard-user', icon: '🏠', badge: '' },
        { label: 'Mis Préstamos', route: '/loans-user', icon: '📚', badge: '' },
        { label: 'Favoritos', route: '/favorites', icon: '❤️', badge: '' },
        { label: 'Mis Listas', route: '/reading-lists', icon: '📋', badge: '' },
      ]
    },
    {
      title: 'BIBLIOTECA',
      items: [
        { label: 'Buscar Libros', route: '/search', icon: '🔍', badge: '' },
        { label: 'Libros', route: '/books', icon: '📘', badge: '' },
        { label: 'Autores', route: '/authors', icon: '✍️', badge: '' }
      ]
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { label: 'Perfil', route: '/profile', icon: '👤', badge: '' },
        { label: 'Ajustes', route: '/settings', icon: '⚙️', badge: '' }
      ]
    }
  ];

  ngOnInit() {
    this.loadUserProfile();
  }

  public loadUserProfile() {
    this.isLoading = true;
    this.error = '';   
    
    if (this.userService.isAuthenticated()) {
      const tokenData = this.userService.decodeToken();

      this.userService.getUserProfile().subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.setUserRole(profile.role);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar perfil de usuario';
          this.setDefaultRole();
          this.isLoading = false;
        }
      });
    } else {
      this.setDefaultRole();
      this.isLoading = false;
    }
  }

  private setUserRole(role: string) {
    const roleLower = role?.toLowerCase();
    
    switch (roleLower) {
      case 'admin':
      case 'administrador':
        this.userRole = 'admin';
        break;
      case 'librarian':
      case 'bibliotecario':
        this.userRole = 'librarian';
        break;
      case 'user':
      case 'usuario':
      default:
        this.userRole = 'user';
        break;
    }
  }

  private setDefaultRole() {
    const tokenData = this.userService.decodeToken();
    if (tokenData?.role) {
      this.setUserRole(tokenData.role);
    } else {
      this.userRole = 'user';
    }
  }

  get menuGroups() {
    if (this.isLoading) {
      return []; 
    }
    let menu;
    switch (this.userRole) {
      case 'admin':
        menu = this.adminMenu;
        break;
      case 'librarian':
        menu = this.librarianMenu;
        break;
      case 'user':
      default:
        menu = this.userMenu;
        break;
    }
    return menu;
  }

  getUserName(): string {
    return this.userProfile?.name || 'Usuario';
  }

  getUserEmail(): string {
    return this.userProfile?.email || 'usuario@ejemplo.com';
  }

  getUserRoleText(): string {
    switch (this.userRole) {
      case 'admin':
        return 'Administrador';
      case 'librarian':
        return 'Bibliotecario';
      case 'user':
      default:
        return 'Usuario';
    }
  }
}


