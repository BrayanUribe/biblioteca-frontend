import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AuthorDTO {
  id: number;
  name: string;
  nationality?: string;
  birthDate?: string;
  biography?: string;
}

export interface BookDTO {
  id: number;
  title: string;
  genre: string;
  publicationYear: number;
  isbn: string;
  stock: number;
  available: boolean;
  authorDTO: AuthorDTO;
  imageUrl?: string;
  description?: string;
}

export interface Book {
  id?: number;
  title: string;
  genre: string;
  publicationYear: number;
  isbn: string;
  stock: number;
  available: boolean;
  author: {
    id: number;
  };
  imageUrl?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8088/books';

  constructor(private http: HttpClient) { }

  getAllBooks(): Observable<BookDTO[]> {
    return this.http.get<BookDTO[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  getBooks(): Observable<BookDTO[]> {
    return this.getAllBooks();
  }

  searchBooks(query?: string, genre?: string): Observable<BookDTO[]> {
    let params: any = {};
    if (query) params.q = query;
    if (genre) params.genre = genre;
    return this.http.get<BookDTO[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getrecommendations():Observable<BookDTO[]> {
    return this.http.get<BookDTO[]>(`${this.apiUrl}/recommendations`).pipe(
      catchError(this.handleError)
    );
  }

  getBookById(id: number): Observable<BookDTO> {
    return this.http.get<BookDTO>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  createBook(book: Book): Observable<BookDTO> {
    return this.http.post<BookDTO>(`${this.apiUrl}`, book).pipe(
      catchError(this.handleError)
    );
  }

  updateBook(id: number, book: Book): Observable<BookDTO> {
    return this.http.put<BookDTO>(`${this.apiUrl}/${id}`, book).pipe(
      catchError(this.handleError)
    );
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error en el servicio';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'Libro no encontrado';
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos';
      } else if (error.status === 409) {
        errorMessage = 'El ISBN ya existe';
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  convertToBookForm(bookDTO: BookDTO): Book {
    return {
      id: bookDTO.id,
      title: bookDTO.title,
      genre: bookDTO.genre,
      publicationYear: bookDTO.publicationYear,
      isbn: bookDTO.isbn,
      stock: bookDTO.stock,
      available: bookDTO.available,
      author: {
        id: bookDTO.authorDTO.id
      },
      imageUrl: bookDTO.imageUrl
    };
  }

  createEmptyBook(): Book {
    return {
      title: '',
      genre: '',
      publicationYear: new Date().getFullYear(),
      isbn: '',
      stock: 1,
      available: true,
      author: {
        id: 0
      },
      imageUrl: ''
    };
  }
}