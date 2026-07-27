import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReadingList {
  id: number;
  name: string;
  description?: string;
  items?: ReadingListItem[];
  createdAt?: string;
}

export interface ReadingListItem {
  id: number;
  book?: any;
  bookDTO?: any;
  status: 'WANT_TO_READ' | 'READING' | 'COMPLETED';
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReadingListService {
  private http = inject(HttpClient);
  private apiUrl = 'https://biblioteca-backend-y24p.onrender.com/reading-lists';

  getUserLists(): Observable<ReadingList[]> {
    return this.http.get<ReadingList[]>(this.apiUrl);
  }

  createList(name: string, description: string): Observable<ReadingList> {
    return this.http.post<ReadingList>(this.apiUrl, { name, description });
  }

  deleteList(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addBookToList(listId: number, bookId: number): Observable<ReadingListItem> {
    return this.http.post<ReadingListItem>(`${this.apiUrl}/${listId}/books/${bookId}`, {});
  }

  updateItemStatus(itemId: number, status: string): Observable<ReadingListItem> {
    return this.http.put<ReadingListItem>(`${this.apiUrl}/items/${itemId}/status`, { status });
  }

  removeBookFromList(itemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/items/${itemId}`);
  }
}
