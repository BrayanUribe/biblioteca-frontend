import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SystemLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  description: string;
  performedBy: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemLogService {
  private apiUrl = 'https://biblioteca-backend-y24p.onrender.com/logs'; 

  constructor(private http: HttpClient) { }


getAllLogs(): Observable<SystemLog[]> {
  return this.http.get<SystemLog[]>(`${this.apiUrl}`, {
    withCredentials: true
  }).pipe(
    catchError(error => {
      if (error.status === 403 && !error.error) {
        return new Observable<SystemLog[]>(observer => observer.complete());
      }
      return this.handleError(error);
    })
  );
}

  getLogsByUserId(userId: number): Observable<SystemLog[]> {
    return this.http.get<SystemLog[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error en el servicio de logs';

    if (error.status === 404) {
      errorMessage = 'Logs no encontrados';
    } else if (error.status === 400) {
      errorMessage = 'Parámetros inválidos';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para acceder a los logs';
    } else if (error.status) {
      errorMessage = `Error ${error.status}: ${error.message}`;
    } else {
      errorMessage = 'Error desconocido al conectar con el servidor';
    }

    console.error('Error en SystemLogService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  // Métodos utilitarios para formatear logs
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('es-ES');
  }

  getActionIcon(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'info';
    }
  }

  getActionColor(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'primary';
      case 'UPDATE': return 'accent';
      case 'DELETE': return 'warn';
      default: return '';
    }
  }


  parseLogValue(value: string): any {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  }

  // Formatear descripción para mostrar en UI
  formatDescription(description: string): string {
    return description.replace(/Usuario ID '(\d+)'/g, 'Usuario $1');
  }
}