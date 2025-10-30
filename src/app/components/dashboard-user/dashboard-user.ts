import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Servicios
import { UserService } from '../../services/users/users'; 
import { BookService } from '../../services/book/book';
import { LoansService, LoanDTO } from '../../services/loans/loans';
import { SystemLogService, SystemLog } from '../../services/logs/logs';



@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-user.html',
  styleUrls: ['./dashboard-user.css']
})
export class DashboardUserComponent implements OnInit {

  private router = inject(Router);
  private logService = inject(SystemLogService);
  private loansService = inject(LoansService);
  private bookService = inject(BookService);
  private userService = inject(UserService);

  userName: string = '';
  userAvatar: string = '';





  // --------------------------------------------------------------------------
  // 🧾 SECCIÓN: Logs del usuario (sus actividades)
  // --------------------------------------------------------------------------
  mostrarModalLogs: boolean = false;
  mostrarDetalles: boolean = false;
  logSeleccionado: SystemLog | null = null;

  // Datos de logs del usuario
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

  // Estados de carga
  cargandoEstadisticas: boolean = false;
  ultimaActualizacion: Date = new Date();
  recomendaciones: any[] = [];
  actividadesRecientes: any;

  ngOnInit() {
    this.cargarDatosDashboard();
    this.cargarDatosUsuario();
    this.cargarRecomendaciones();
  }

  // --------------------------------------------------------------------------
  // 📊 SECCIÓN: Carga de datos del dashboard usuario
  // --------------------------------------------------------------------------

  cargarDatosDashboard() {
    this.cargandoEstadisticas = true;
    Promise.all([
      this.cargarLogsRecientes(),
      this.cargarRecomendaciones()
    ]).finally(() => {
      this.cargandoEstadisticas = false;
    });
  }

cargarRecomendaciones() {
  this.bookService.getrecommendations().subscribe({
    next: (libros) => {

      this.recomendaciones = libros.sort(() => 0.5 - Math.random()).slice(0, 4);
      console.log('📚 Recomendaciones cargadas:', this.recomendaciones);
    },
    error: (error) => {
      console.error('❌ Error al cargar recomendaciones:', error);
      this.recomendaciones = [];
    }
  });
}
verDetallesLibro(id: number) {
  this.router.navigate(['/books', id]); 
}

cargarDatosUsuario() {
  const userId = this.obtenerUserId(); 

  if (userId) {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.userName = user.name || 'Usuario';
      },
      error: (error) => {
        console.error('❌ Error cargando usuario:', error);
        this.userName = 'Usuario';
        this.userAvatar = 'assets/default-avatar.png';
      }
    });
  }
}

  // --------------------------------------------------------------------------
  // 🧭 SECCIÓN: Navegación entre vistas
  // --------------------------------------------------------------------------

  verPrestamos(event: Event) {
    event.preventDefault();
    this.router.navigate(['/my-loans']);
  }

  verPerfil(event: Event) {
    event.preventDefault();
    this.router.navigate(['/profile']);
  }

  buscarLibros(event: Event) {
    event.preventDefault();
    this.router.navigate(['/search']);
  }



  // --------------------------------------------------------------------------
  // 🧾 SECCIÓN: Funcionalidades de Logs (Actividades del usuario)
  // --------------------------------------------------------------------------

  cargarLogsRecientes() {
    this.cargandoLogs = true;
    this.errorLogs = '';

    const userId = this.obtenerUserId();
    this.logService.getLogsByUserId(userId).subscribe({
      next: (logs) => {
        this.logsRecientes = logs.slice(0, 10);
        this.cargarActividadesRecientes(logs);
        this.cargandoLogs = false;
      },
      error: (error) => {
        console.error('Error cargando logs:', error);
        this.errorLogs = 'No se pudieron cargar las actividades';
        this.cargandoLogs = false;
      }
    });
  }

  cargarActividadesRecientes(logs: SystemLog[]) {
    this.actividadesRecientes = logs.slice(0, 5).map(log => ({
      accion: this.traducirAccion(log.action),
      detalle: this.obtenerDetalleActividad(log),
      tiempo: this.formatearTiempoRelativo(log.timestamp),
      icono: this.obtenerIconoActividad(log.action)
    }));
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

    const userId = this.obtenerUserId();
    this.logService.getLogsByUserId(userId).subscribe({
      next: (logs) => {
        this.logsCompletos = logs;
        this.aplicarFiltros();
        this.cargandoLogsCompletos = false;
      },
      error: (error) => {
        console.error('Error cargando logs completos:', error);
        this.errorLogsCompletos = 'No se pudieron cargar las actividades';
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
    link.download = `mis-actividades-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  verTodasLasActividades(event: Event) {
    event.preventDefault();
    this.abrirModalLogs();
  }

  // --------------------------------------------------------------------------
  // 🔧 SECCIÓN: Utilidades y formateadores
  // --------------------------------------------------------------------------

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

  formatearTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diffMs = ahora.getTime() - fechaObj.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
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
  // 🎯 SECCIÓN: Métodos específicos para usuario
  // --------------------------------------------------------------------------

private obtenerUserId(): number {
  const currentUser = this.userService.getCurrentUser();
  if (currentUser && currentUser.id) {
    return Number(currentUser.id);
  }
  console.warn('⚠️ No se encontró el ID del usuario logueado.');
  return 0;
}

  private traducirAccion(accion: string): string {
    const traducciones: { [key: string]: string } = {
      'CREATE': 'Creó',
      'UPDATE': 'Actualizó',
      'DELETE': 'Eliminó',
      'LOGIN': 'Inició sesión',
      'LOAN_CREATE': 'Solicitó préstamo',
      'LOAN_RETURN': 'Devolvió libro',
      'RESERVATION_CREATE': 'Hizo reserva',
      'RESERVATION_CANCEL': 'Canceló reserva'
    };
    return traducciones[accion] || accion;
  }

  private obtenerIconoActividad(accion: string): string {
    const iconos: { [key: string]: string } = {
      'CREATE': '📝',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'LOGIN': '🔐',
      'LOAN_CREATE': '📚',
      'LOAN_RETURN': '↩️',
      'RESERVATION_CREATE': '📌',
      'RESERVATION_CANCEL': '❌'
    };
    return iconos[accion] || '📄';
  }

  private obtenerDetalleActividad(log: SystemLog): string {
    if (log.entityType === 'LOAN' && log.action === 'CREATE') {
      return `Solicitó el préstamo de un libro`;
    } else if (log.entityType === 'LOAN' && log.action === 'RETURN') {
      return `Devolvió un libro`;
    } else if (log.entityType === 'RESERVATION') {
      return `Gestionó una reserva`;
    }
    return `${log.action} ${log.entityType}`;
  }

  recargarDashboard() {
    this.cargarDatosDashboard();
  }
}