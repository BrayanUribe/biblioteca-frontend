import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar/sidebar';
import { UserService } from '../../services/users/users';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  isSidebarOpen = true;
  showNotifications = false;
  showUserMenu = false;
  isDarkMode = false;
  unreadNotifications = 0;
  notifications: any[] = [];
  currentUser: any = null;
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private userService: UserService
  ) {
    this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isSidebarOpen = isOpen;
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUserData() {
    if (this.userService.isAuthenticated()) {
      this.userSubscription = this.userService.getUserProfile().subscribe({
        next: (user: any) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.setFallbackUserData();
        }
      });
    } else {
      this.setFallbackUserData();
    }
  }

  private setFallbackUserData() {
    const userFromStorage = this.userService.getCurrentUser();
    if (userFromStorage) {
      this.currentUser = {
        id: userFromStorage.id || 0,
        name: userFromStorage.name || 'Usuario',
        email: userFromStorage.email || 'usuario@ejemplo.com',
        role: userFromStorage.role || 'Usuario',
        lastAccess: userFromStorage.lastAccess || new Date().toLocaleString()
      };
    } else {
      this.currentUser = {
        id: 0,
        name: 'Invitado',
        email: 'invitado@ejemplo.com',
        role: 'Invitado',
        lastAccess: new Date().toLocaleString()
      };
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showNotifications = false;
      this.showUserMenu = false;
    }
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  getUserInitial(): string {
    if (!this.currentUser?.name) return 'U';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => this.cleanupAndNavigate(),
      error: (error) => {
        console.error('Error during logout:', error);
        this.cleanupAndNavigate();
      }
    });
  }

  private cleanupAndNavigate() {
    this.currentUser = null;
    this.showUserMenu = false;
    this.router.navigate(['/login']);
  }

  getUserName(): string {
    return this.currentUser?.name || 'Usuario';
  }

  getUserEmail(): string {
    return this.currentUser?.email || 'usuario@ejemplo.com';
  }


  getUserRole(): string {
    return this.currentUser?.role || 'Usuario';
  }


  verPerfil() {
    this.router.navigate(['/profile']);
  }


  irConfiguracion() {
    this.router.navigate(['/settings']);
  }




}
