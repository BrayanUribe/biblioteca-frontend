import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/users/users';

export const roleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  const userRole = userService.getUserRole()?.toUpperCase();
  const expectedRoles = route.data?.['expectedRoles'] || [];

  if (expectedRoles.length === 0) return true;

  if (userRole && expectedRoles.includes(userRole)) return true;
  router.navigate(['/unauthorized']);
  return false;
};
