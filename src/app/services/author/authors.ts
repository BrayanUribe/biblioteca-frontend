import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AuthorDTO {
  id: number;
  name: string;
  nationality?: string;
  biography?: string;
  imageUrl?: string;
}

export interface Author {
  id?: number;
  name: string;
  nationality?: string;
  biography?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorsService {
  private apiUrl = 'http://localhost:8088/authors'; 

  constructor(private http: HttpClient) { }

  getAllAuthors(): Observable<AuthorDTO[]> {
    return this.http.get<AuthorDTO[]>(`${this.apiUrl}`, {
      withCredentials: true 
    }).pipe(
      catchError(error => {
        // Ignorar error 403 silenciosamente porque sabemos que funciona
        if (error.status === 403) {
          return throwError(() => error);
        }
        return this.handleError(error);
      })
    );
  }

  getAuthorById(id: number): Observable<AuthorDTO> {
    return this.http.get<AuthorDTO>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createAuthor(author: Author): Observable<AuthorDTO> {
    return this.http.post<AuthorDTO>(`${this.apiUrl}`, author).pipe(
      catchError(this.handleError)
    );
  }

  updateAuthor(id: number, author: Author): Observable<AuthorDTO> {
    return this.http.put<AuthorDTO>(`${this.apiUrl}/${id}`, author).pipe(
      catchError(this.handleError)
    );
  }

  deleteAuthor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error en el servicio';

    // Evitar usar directamente ErrorEvent en SSR o Node
    if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de red: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'Autor no encontrado';
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos';
      } else if (error.status === 409) {
        errorMessage = 'El autor ya existe';
      } else if (error.status) {
        errorMessage = `Error ${error.status}: ${error.message}`;
      } else {
        errorMessage = 'Error desconocido al conectar con el servidor';
      }
    }

    console.error('Error en AuthorsService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  convertToAuthorForm(authorDTO: AuthorDTO): Author {
    return {
      id: authorDTO.id,
      name: authorDTO.name,
      nationality: authorDTO.nationality,
      biography: authorDTO.biography,
      imageUrl: authorDTO.imageUrl
    };
  }

  createEmptyAuthor(): Author {
    return {
      name: '',
      nationality: '',
      biography: '',
      imageUrl: ''
    };
  }

  formatBiography(biography: string, maxLength: number = 150): string {
    if (!biography) return 'Sin biografía disponible';
    
    if (biography.length <= maxLength) return biography;
    
    return biography.substring(0, maxLength) + '...';
  }
}
