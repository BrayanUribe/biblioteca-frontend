import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthorDTO {
  id: number;
  name: string;
  nationality?: string;
  biography?: string;
  imageUrl?: string;
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
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
}

export interface LoanItemDTO {
  id: number;
  bookDTO: BookDTO;
  status: string;
}

export interface LoanDTO {
  id: number;
  userDTO: UserDTO;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  fine: number | null;
  loanItems: LoanItemDTO[];
}

export interface CreateLoanRequest {
  userId: number;
  bookIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class LoansService {
  private baseUrl = 'http://localhost:8088/loans'; 

  constructor(private http: HttpClient) { }

  getAllLoans(): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(this.baseUrl);
  }

  getLoanById(id: number): Observable<LoanDTO> {
    return this.http.get<LoanDTO>(`${this.baseUrl}/${id}`);
  }

  getLoansByUser(userId: number): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(`${this.baseUrl}/user/${userId}`);
  }

  getActiveLoansByBook(bookId: number): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(`${this.baseUrl}/book/${bookId}/active`);
  }

  getLoansByStatus(status: string): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(`${this.baseUrl}/status/${status}`);
  }

  getOverdueLoans(): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(`${this.baseUrl}/overdue`);
  }

  createLoan(request: CreateLoanRequest): Observable<LoanDTO> {
    return this.http.post<LoanDTO>(this.baseUrl, request);
  }

  returnLoan(id: number): Observable<LoanDTO> {
    return this.http.put<LoanDTO>(`${this.baseUrl}/${id}/return`, {});
  }

  deleteLoan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}