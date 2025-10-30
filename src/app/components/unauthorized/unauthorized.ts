import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/users/users';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.html',
  styleUrls: ['./unauthorized.css']
})
export class UnauthorizedComponent {
  constructor(private router: Router, private userService: UserService) {}

  goBack(): void {
    window.history.back();
  }

  goToDashboard(): void {
    const role = this.userService.getUserRole()?.toUpperCase();

    switch (role) {
      case 'ROLE_ADMIN':
      case 'ROLE_LIBRARIAN':
        this.router.navigate(['/dashboard']);
        break;
      case 'ROLE_USER':
      default:
        this.router.navigate(['/dashboard-user']);
        break;
    }
  }
}

