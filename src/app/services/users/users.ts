import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: any;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  memberSince?: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://biblioteca-backend-y24p.onrender.com/users';

  constructor(@Inject(PLATFORM_ID) private platformId: any) {}

  private get localStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null;
  }

  // Auth methods
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        this.setTokens(response.accessToken, response.refreshToken);

        if (this.localStorage) {
          if (response.user?.email) {
            this.localStorage.setItem('user_email', response.user.email);
          } else {
            this.localStorage.setItem('user_email', email);
          }
          if (response.user) {
            this.localStorage.setItem('user', JSON.stringify(response.user));
          }
        }
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          this.setTokens(response.accessToken, response.refreshToken);
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (refreshToken && this.localStorage) {
      this.localStorage.removeItem('access_token');
      this.localStorage.removeItem('refresh_token');
      this.localStorage.removeItem('user');

      return this.http.post(`${this.apiUrl}/logout`, { refreshToken });
    }

    return new Observable();
  }

  // CRUD Methods - SIN headers duplicados
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(this.apiUrl, user);
  }

  updateUser(id: number, user: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/${id}`, user);
  }

  updatePreferences(preferences: string): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/me/preferences`, { preferences });
  }

  register(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.apiUrl}/register`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return this.localStorage ? this.localStorage.getItem('access_token') : null;
  }

  getRefreshToken(): string | null {
    return this.localStorage ? this.localStorage.getItem('refresh_token') : null;
  }

  getCurrentUser(): any {
    if (this.localStorage) {
      const userStr = this.localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (this.localStorage) {
      this.localStorage.setItem('access_token', accessToken);
      this.localStorage.setItem('refresh_token', refreshToken);
    }
  }

  decodeToken(): any {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  getUserEmail(): string | null {
    const tokenData = this.decodeToken();
    return tokenData?.email || tokenData?.sub || null;
  }

  getUserByEmail(email: string): Observable<UserProfile | null> {
    return this.getAllUsers().pipe(
      map((users) => {
        const user = users.find((u) => u.email === email);
        return user ? this.mapToUserProfile(user) : null;
      }),
      catchError(() => of(null))
    );
  }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  private mapToUserProfile(user: any): UserProfile {
    return {
      id: user.id || 0,
      name: user.name || 'Usuario',
      email: user.email || '',
      role: user.role || 'Usuario',
      phone: user.phone,
      address: user.address,
      memberSince: user.memberSince || new Date().toISOString().split('T')[0],
    };
  }

  private createProfileFromToken(): UserProfile {
    const tokenData = this.decodeToken();
    return {
      id: 0,
      name: tokenData?.name || 'Usuario',
      email: tokenData?.email || tokenData?.sub || 'usuario@ejemplo.com',
      role: tokenData?.role || 'Usuario',
      memberSince: new Date().toISOString().split('T')[0],
    };
  }

  private createDefaultProfile(): UserProfile {
    return {
      id: 0,
      name: 'Usuario',
      email: 'usuario@ejemplo.com',
      role: 'Usuario',
      memberSince: new Date().toISOString().split('T')[0],
    };
  }

  getUserRole(): string | null {
    const tokenData = this.decodeToken();
    if (Array.isArray(tokenData?.roles) && tokenData.roles.length > 0) {
      return tokenData.roles[0];
    }
    if (tokenData?.role) {
      return tokenData.role;
    }
    const user = this.getCurrentUser();
    if (user?.role) return user.role;
    if (Array.isArray(user?.roles) && user.roles.length > 0) return user.roles[0];

    return null;
  }
}
