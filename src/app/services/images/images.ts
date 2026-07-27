// services/image/image.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private http = inject(HttpClient);
  private apiUrl = 'https://biblioteca-backend-y24p.onrender.com/images'; 

  updateUserImage(userId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, formData);
  }

  updateBookImage(bookId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.put<any>(`${this.apiUrl}/books/${bookId}`, formData);
  }

  updateAuthorImage(authorId: number, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.put<any>(`${this.apiUrl}/authors/${authorId}`, formData);
  }


  getImageUrl(path: string): string {
    if (!path) return 'assets/default-avatar.png';
    

    if (path.startsWith('http')) return path;
    
    return `https://biblioteca-backend-y24p.onrender.com${path.startsWith('/') ? path : '/' + path}`;
  }
}
