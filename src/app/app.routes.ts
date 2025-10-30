import { Routes } from '@angular/router';
import { authGuard } from './guards/users/usres-guard';
import { roleGuard } from './guards/role/role-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./components/unauthorized/unauthorized').then((m) => m.UnauthorizedComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard').then((m) => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN'] },
      },
      {
        path: 'dashboard-user',
        loadComponent: () =>
          import('./components/dashboard-user/dashboard-user').then(
            (m) => m.DashboardUserComponent
          ),
        canActivate: [roleGuard],
        data: { expectedRoles: ['ROLE_USER'] },
      },
      {
        path: 'user',
        loadComponent: () => import('./components/user/user').then((m) => m.User),
        canActivate: [roleGuard],
        data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN'] },
      },
      {
        path: 'author',
        loadComponent: () => import('./components/author/author').then((m) => m.AuthorComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN'] },
      },
      {
        path: 'authors',
        loadComponent: () => import('./components/authors-users/authors').then((m) => m.AuthorUserComponent),
        canActivate: [roleGuard],
        data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_USER'] },
      },
      {
        path: 'book',
        loadComponent: () => import('./components/book/book').then((m) => m.BookComponent),
        canActivate: [roleGuard],
        data: {
          expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN' ],
        },
      },
      {
        path: 'books',
        loadComponent: () => import('./components/books-users/books').then((m) => m.BookUserComponent),
        canActivate: [roleGuard],
        data: {
          expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_USER'],
        },
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings').then((m) => m.SettingsComponent),
        canActivate: [roleGuard],
        data:{
        expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_USER'],
        },
      },
      {
        path: 'loans',
        loadComponent: () => import('./components/loans/loans').then((m) => m.LoansComponent),
        canActivate: [roleGuard],
        data: {
          expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN'],
        },
      },
      {
        path: 'loans-user',
        loadComponent: () => import('./components/loans-user/loans-user').then((m) => m.MyLoansComponent),
        canActivate: [roleGuard],
        data: {
          expectedRoles: ['ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_USER'],
        },
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
