import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8088/favorites';

  getUserFavorites(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  toggleFavorite(bookId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/toggle/${bookId}`, {});
  }

  checkFavorite(bookId: number): Observable<{ isFavorited: boolean }> {
    return this.http.get<{ isFavorited: boolean }>(`${this.apiUrl}/check/${bookId}`);
  }
}
