import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios
import { UserService } from '../../services/users/users'; 
import { AuthorsService } from '../../services/author/authors'; 
import { BookService } from '../../services/book/book';
import { LoansService, LoanDTO } from '../../services/loans/loans';
import { SystemLogService, SystemLog } from '../../services/logs/logs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);
  private logService = inject(SystemLogService);
  private loansService = inject(LoansService);
  private bookService = inject(BookService);
  private authorService = inject(AuthorsService);
  private userService = inject(UserService);

  userName: string = '';
  userAvatar: string = '';

  // Estadísticas
  prestamosActivos: number = 0;
  totalLibros: number = 0;
  totalAutores: number = 0;
  usuariosActivos: number = 0;

  // --------------------------------------------------------------------------
  // 🧾 SECCIÓN: Logs del sistema
  // --------------------------------------------------------------------------
  mostrarModalLogs: boolean = false;
  mostrarDetalles: boolean = false;
  logSeleccionado: SystemLog | null = null;

  // Datos generales de logs
  logsCompletos: SystemLog[] = [];
  logsFiltrados: SystemLog[] = [];
  logsRecientes: SystemLog[] = [];

  cargandoLogs: boolean = false;
  cargandoLogsCompletos: boolean = false;
  errorLogs: string = '';
  errorLogsCompletos: string = '';

  filtroAccion: string = '';
  filtroEntidad: string = '';
  paginaActual: number = 1;
  itemsPorPagina: number = 20;
  // VARIABLES LOGS TERMINA AQUI -------------------------------------------------------

  // Estados de carga para estadísticas

  cargandoEstadisticas: boolean = false;
  ultimaActualizacion: Date = new Date();

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  // --------------------------------------------------------------------------
  // 📊 SECCIÓN: Carga de datos del dashboard
  // --------------------------------------------------------------------------

  cargarDatosDashboard() {
    this.cargandoEstadisticas = true;
    Promise.all([
      this.cargarPrestamosActivos(),
      this.cargarTotalLibros(),
      this.cargarTotalAutores(),
      this.cargarUsuariosActivos(),
      this.cargarLogsRecientes()
    ]).finally(() => {
      this.cargandoEstadisticas = false;
    });
  }


  cargarPrestamosActivos(): Promise<void> {
    return new Promise((resolve) => {
      this.loansService.getLoansByStatus('ACTIVE').subscribe({
        next: (prestamos: LoanDTO[]) => {
          this.prestamosActivos = prestamos.length;
          resolve();
        },
        error: (error) => {
          this.prestamosActivos = 0;
          resolve();
        }
      });
    });
  }


  cargarTotalLibros(): Promise<void> {
    return new Promise((resolve) => {
      this.bookService.getAllBooks().subscribe({
        next: (libros) => {
          this.totalLibros = libros.length;
          resolve();
        },
        error: (error) => {
          this.totalLibros = 0;
          resolve();
        }
      });
    });
  }

  cargarTotalAutores(): Promise<void> {
    return new Promise((resolve) => {
      this.authorService.getAllAuthors().subscribe({
        next: (autores) => {
          this.totalAutores = autores.length;
          resolve();
        },
        error: (error) => {
          this.totalAutores = 0;
          resolve();
        }
      });
    });
  }

  cargarUsuariosActivos(): Promise<void> {
    return new Promise((resolve) => {
      this.userService.getAllUsers().subscribe({
        next: (usuarios) => {
          this.usuariosActivos = usuarios.length;
          resolve();
        },
        error: (error) => {
          this.usuariosActivos = 0;
          resolve();
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 🧭 SECCIÓN: Navegación entre vistas
  // --------------------------------------------------------------------------

  nuevoPrestamo(event: Event) {
    event.preventDefault();
    this.router.navigate(['/loans']);
  }

  guardarLibro(event: Event) {
    event.preventDefault();
    this.router.navigate(['/book']);
  }

  guardarAutor(event: Event) {
    event.preventDefault();
    this.router.navigate(['/author']);
  }

  crearUsuario(event: Event) {
    event.preventDefault();
    this.router.navigate(['/user']);
  }

  irConfiguracion(event: Event) {
    event.preventDefault();
    this.router.navigate(['/settings']);
  }

  verPerfil(event: Event) {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  // --------------------------------------------------------------------------
  // 🧾 SECCIÓN: Funcionalidades de Logs
  // --------------------------------------------------------------------------

  cargarLogsRecientes() {
    this.cargandoLogs = true;
    this.errorLogs = '';

    this.logService.getAllLogs().subscribe({
      next: (logs) => {
        this.logsRecientes = logs.slice(0, 10);
        this.cargandoLogs = false;
      },
      error: (error) => {
        console.error('Error cargando logs:', error);
        this.errorLogs = 'No se pudieron cargar los logs';
        this.cargandoLogs = false;
      }
    });
  }

  abrirModalLogs() {
    this.mostrarModalLogs = true;
    this.cargarLogsCompletos();
  }

  cerrarModalLogs() {
    this.mostrarModalLogs = false;
    this.mostrarDetalles = false;
    this.logSeleccionado = null;
    this.filtroAccion = '';
    this.filtroEntidad = '';
    this.paginaActual = 1;
  }

  cargarLogsCompletos() {
    this.cargandoLogsCompletos = true;
    this.errorLogsCompletos = '';

    this.logService.getAllLogs().subscribe({
      next: (logs) => {
        this.logsCompletos = logs;
        this.aplicarFiltros();
        this.cargandoLogsCompletos = false;
      },
      error: (error) => {
        console.error('Error cargando logs completos:', error);
        this.errorLogsCompletos = 'No se pudieron cargar los movimientos del sistema';
        this.cargandoLogsCompletos = false;
      }
    });
  }

  aplicarFiltros() {
    let logsFiltrados = this.logsCompletos;

    if (this.filtroAccion) {
      logsFiltrados = logsFiltrados.filter(log => log.action === this.filtroAccion);
    }

    if (this.filtroEntidad) {
      logsFiltrados = logsFiltrados.filter(log => log.entityType === this.filtroEntidad);
    }

    this.logsFiltrados = logsFiltrados;
    this.paginaActual = 1;
  }

  exportarLogs() {
    const dataStr = JSON.stringify(this.logsFiltrados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `movimientos-sistema-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  verTodosLosLogs(event: Event) {
    event.preventDefault();
    this.abrirModalLogs();
  }
formatearFecha(fecha: string | Date): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return fechaObj.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}


  formatearFechaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  parseJson(valor: string): any {
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente() {
    const totalPaginas = Math.ceil(this.logsFiltrados.length / this.itemsPorPagina);
    if (this.paginaActual < totalPaginas) {
      this.paginaActual++;
    }
  }

  // --------------------------------------------------------------------------
  // 🔄 SECCIÓN: Utilidades
  // --------------------------------------------------------------------------

  /** Recargar todos los datos del dashboard */
  recargarDashboard() {
    this.cargarDatosDashboard();
  }
}




