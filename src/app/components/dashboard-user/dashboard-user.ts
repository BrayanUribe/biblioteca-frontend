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
  styleUrls: ['./dashboard-user.css'],
})
export class DashboardUserComponent implements OnInit {
  private router = inject(Router);
  private logService = inject(SystemLogService);
  private loansService = inject(LoansService);
  private bookService = inject(BookService);
  private userService = inject(UserService);

  userName: string = '';
  userAvatar: string = '';
  userId: number = 0;

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
  actividadesRecientes: any[] = [];

  // Opciones para filtros
  opcionesAccion: string[] = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOAN_CREATE',
    'LOAN_RETURN',
    'RESERVATION_CREATE',
    'RESERVATION_CANCEL',
  ];
  opcionesEntidad: string[] = ['USER', 'BOOK', 'LOAN', 'LOAN_REQUEST', 'RESERVATION'];

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  // --------------------------------------------------------------------------
  // 📊 SECCIÓN: Carga de datos del dashboard usuario
  // --------------------------------------------------------------------------

  cargarDatosDashboard() {
    this.cargandoEstadisticas = true;
    Promise.all([this.cargarLogsRecientes(), this.cargarRecomendaciones()]).finally(() => {
      this.cargandoEstadisticas = false;
      this.ultimaActualizacion = new Date();
    });
  }

  cargarRecomendaciones() {
    this.bookService.getrecommendations().subscribe({
      next: (libros) => {
        this.recomendaciones = libros.sort(() => 0.5 - Math.random()).slice(0, 4);
      },
      error: (error) => {
        console.error('❌ Error al cargar recomendaciones:', error);
        this.recomendaciones = [];
      },
    });
  }

  verDetallesLibro(id: number) {
    this.router.navigate(['/books', id]);
  }

  cargarDatosUsuario() {
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.userName = user.name || 'Usuario';
        this.userAvatar = user.imageUrl || 'assets/default-avatar.png';
        this.cargarDatosDashboard();
      },
      error: (error) => {
        console.error('❌ Error cargando perfil de usuario:', error);
        this.userName = 'Usuario';
        this.userAvatar = 'assets/default-avatar.png';
        this.userId = this.obtenerUserIdAlternativo();
        this.cargarDatosDashboard();
      },
    });
  }

  private obtenerUserIdAlternativo(): number {
    const tokenData = this.userService.decodeToken();
    if (tokenData && tokenData.id) {
      return Number(tokenData.id);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            return Number(user.id);
          }
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }

    return 0;
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
  // 🧾 SECCIÓN: Funcionalidades de Logs (Actividades del usuario) - CORREGIDO
  // --------------------------------------------------------------------------

  cargarLogsRecientes() {
  if (!this.userId || this.userId === 0) {
    console.error('❌ No hay user ID para cargar logs');
    this.errorLogs = 'No se pudo identificar al usuario';
    this.cargandoLogs = false;
    return;
  }
  this.cargandoLogs = true;
  this.errorLogs = '';
  this.logService.getLogsByUserId(this.userId).subscribe({
    next: (logs) => {

      const logsDelUsuario = logs.filter((log) => {
        const logUserId = Number(log.performedBy);
        return logUserId === this.userId;
      });
      this.logsRecientes = logsDelUsuario
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      this.cargarActividadesRecientes(logsDelUsuario);
      this.cargandoLogs = false;
    },
    error: (error) => {
      this.errorLogs = 'No se pudieron cargar las actividades';
      this.cargandoLogs = false;
    },
  });
}

  cargarActividadesRecientes(logs: SystemLog[]) {
    this.actividadesRecientes = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((log) => ({
        accion: this.traducirAccion(log.action),
        detalle: this.obtenerDetalleActividad(log),
        tiempo: this.formatearTiempoRelativo(log.timestamp),
        icono: this.obtenerIconoActividad(log.action),
        fechaCompleta: this.formatearFechaCompleta(log.timestamp),
      }));
  }

  // ✅ AGREGAR: Método verTodasLasActividades que falta
  verTodasLasActividades(event: Event) {
    event.preventDefault();
    this.abrirModalLogs();
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
    if (!this.userId || this.userId === 0) {
      console.error('❌ No hay user ID para cargar logs completos');
      this.errorLogsCompletos = 'No se pudo identificar al usuario';
      this.cargandoLogsCompletos = false;
      return;
    }

    this.cargandoLogsCompletos = true;
    this.errorLogsCompletos = '';

    this.logService.getLogsByUserId(this.userId).subscribe({
      next: (logs) => {
        // ✅ CORREGIDO: Usar performedBy
        const logsDelUsuario = logs.filter((log) => {
          const logUserId = Number(log.performedBy);
          return logUserId === this.userId;
        });

        this.logsCompletos = logsDelUsuario.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.aplicarFiltros();
        this.cargandoLogsCompletos = false;
      },
      error: (error) => {
        console.error('❌ Error cargando logs completos:', error);
        this.errorLogsCompletos = 'No se pudieron cargar las actividades';
        this.cargandoLogsCompletos = false;
      },
    });
  }

  aplicarFiltros() {
    let logsFiltrados = this.logsCompletos;

    if (this.filtroAccion) {
      logsFiltrados = logsFiltrados.filter((log) =>
        log.action.toLowerCase().includes(this.filtroAccion.toLowerCase())
      );
    }

    if (this.filtroEntidad) {
      logsFiltrados = logsFiltrados.filter(
        (log) =>
          log.entityType && log.entityType.toLowerCase().includes(this.filtroEntidad.toLowerCase())
      );
    }

    this.logsFiltrados = logsFiltrados;
    this.paginaActual = 1;
  }

  // ✅ AGREGAR: Método exportarLogs que falta
  exportarLogs() {
    const dataStr = JSON.stringify(this.logsFiltrados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mis-actividades-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
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
      minute: '2-digit',
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

  private traducirAccion(accion: string): string {
    const traducciones: { [key: string]: string } = {
      CREATE: 'Creó',
      UPDATE: 'Actualizó',
      DELETE: 'Eliminó',
      LOGIN: 'Inició sesión',
      LOAN_CREATE: 'Solicitó préstamo',
      LOAN_RETURN: 'Devolvió libro',
      RESERVATION_CREATE: 'Hizo reserva',
      RESERVATION_CANCEL: 'Canceló reserva',
    };
    return traducciones[accion] || accion;
  }

  private obtenerIconoActividad(accion: string): string {
    const iconos: { [key: string]: string } = {
      CREATE: '📝',
      UPDATE: '✏️',
      DELETE: '🗑️',
      LOGIN: '🔐',
      LOAN_CREATE: '📚',
      LOAN_RETURN: '↩️',
      RESERVATION_CREATE: '📌',
      RESERVATION_CANCEL: '❌',
    };
    return iconos[accion] || '📄';
  }

  private obtenerDetalleActividad(log: SystemLog): string {
    if (log.entityType === 'LOAN_REQUEST' && log.action === 'CREATE') {
      return `Solicitó un nuevo préstamo de libro`;
    } else if (log.entityType === 'LOAN' && log.action === 'CREATE') {
      return `Realizó un préstamo`;
    } else if (log.entityType === 'LOAN' && log.action === 'RETURN') {
      return `Devolvió un libro`;
    } else if (log.entityType === 'RESERVATION' && log.action === 'CREATE') {
      return `Hizo una reserva`;
    } else if (log.entityType === 'RESERVATION' && log.action === 'CANCEL') {
      return `Canceló una reserva`;
    } else if (log.action === 'LOGIN') {
      return `Inició sesión en el sistema`;
    }

    return `${this.traducirAccion(log.action)} ${log.entityType || 'elemento'}`;
  }

  recargarDashboard() {
    this.cargarDatosDashboard();
  }

  // ✅ AGREGAR: Método para ver detalles del log
  verDetallesLog(log: SystemLog) {
    this.logSeleccionado = log;
    this.mostrarDetalles = true;
  }

  // ✅ AGREGAR: Método para limpiar filtros
  limpiarFiltros() {
    this.filtroAccion = '';
    this.filtroEntidad = '';
    this.aplicarFiltros();
  }

  debugLogs() {
    console.log('🐛 DEBUG LOGS:');
    console.log('User ID:', this.userId);
    console.log('Logs Completos:', this.logsCompletos);
    console.log('Logs Recientes:', this.logsRecientes);
    console.log('Actividades Recientes:', this.actividadesRecientes);
  }


  // --------------------------------------------------------------------------
// 🔧 MÉTODOS NUEVOS PARA VISTA SIMPLIFICADA
// --------------------------------------------------------------------------

obtenerDescripcionAmigable(log: SystemLog): string {
  const acciones: { [key: string]: string } = {
    'CREATE': 'Creaste un nuevo elemento',
    'UPDATE': 'Actualizaste información', 
    'DELETE': 'Eliminaste un elemento',
    'LOGIN': 'Iniciaste sesión en el sistema',
    'LOAN_CREATE': 'Solicitaste un préstamo'
  };

  const entidades: { [key: string]: string } = {
    'USER': 'de tu perfil',
    'LOAN_REQUEST': 'de préstamo de libros',
    'LOAN': 'de préstamo',
    'RESERVATION': 'de reserva'
  };

  const accion = acciones[log.action] || 'Realizaste una acción';
  const entidad = entidades[log.entityType] || 'en el sistema';
  
  return `${accion} ${entidad}`;
}

obtenerTipoAmigable(tipo: string): string {
  const tipos: { [key: string]: string } = {
    'USER': 'Perfil de Usuario',
    'LOAN_REQUEST': 'Solicitud de Préstamo', 
    'LOAN': 'Préstamo',
    'RESERVATION': 'Reserva',
    'BOOK': 'Libro'
  };
  return tipos[tipo] || tipo;
}

formatearHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

obtenerCampoModificado(newValue: string, campo: string): string | null {
  try {
    const datos = JSON.parse(newValue);
    return datos[campo] || null;
  } catch {
    return null;
  }
}

}
