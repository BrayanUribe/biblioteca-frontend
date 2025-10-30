import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoansService } from '../../services/loans/loans';
import { UserService } from '../../services/users/users';

interface Prestamo {
  id: number;
  usuario: string;
  userId: number;
  libros: any[];
  fechaPrestamo: string;
  fechaVencimiento: string;
  fechaDevolucion: string | null;
  estado: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  multa: number;
  loanItems: any[];
  userDTO?: any;
}

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loans-user.html',
  styleUrl: './loans-user.css'
})
export class MyLoansComponent implements OnInit {
  private loansService = inject(LoansService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  prestamos: Prestamo[] = [];
  prestamosFiltrados: Prestamo[] = [];
  
  filtroEstado: string = '';
  paginaActual: number = 1;
  prestamosPorPagina: number = 8;
  totalPaginas: number = 1;
  
  cargando: boolean = false;
  error: string = '';
  
  mostrarModalDetalles: boolean = false;
  prestamoDetallado: any = null;
  
  usuarioId: number | null = null;
  userProfile: any = null;

  ngOnInit() {
    this.cargarUsuarioLogueado();
  }

  private cargarUsuarioLogueado() {
    this.userService.getUserProfile().subscribe({
      next: (user: any) => {    
        this.userProfile = user;
        this.usuarioId = user.id;
        this.cargarMisPrestamos();
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this.error = 'Error al cargar tu información de usuario';
        this.router.navigate(['/login']);
      }
    });
  }

  cargarMisPrestamos() {
    this.cargando = true;
    this.error = '';
    
    this.loansService.getAllLoans().subscribe({
      next: (loans) => {
        this.prestamos = loans
          .filter(loan => loan.userDTO?.id === this.usuarioId)
          .map(loan => this.mapearPrestamoBackend(loan));
        
        this.filtrarPrestamos();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar tus préstamos: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      }
    });
  }

  private mapearPrestamoBackend(loan: any): Prestamo {
    return {
      id: loan.id || 0,
      usuario: loan.userDTO?.name || 'Usuario desconocido',
      userId: loan.userDTO?.id || 0,
      libros: loan.loanItems || [],
      fechaPrestamo: loan.loanDate || new Date().toISOString(),
      fechaVencimiento: loan.dueDate || new Date().toISOString(),
      fechaDevolucion: loan.returnDate || null,
      estado: loan.status || 'ACTIVE',
      multa: loan.fine || 0,
      loanItems: loan.loanItems || [],
      userDTO: loan.userDTO,
    };
  }

  filtrarPrestamos() {
    let filtered = this.prestamos.filter(prestamo => {
      return !this.filtroEstado || prestamo.estado === this.filtroEstado;
    });

    filtered.sort((a, b) => {
      return new Date(b.fechaPrestamo).getTime() - new Date(a.fechaPrestamo).getTime();
    });

    this.prestamosFiltrados = filtered;
    this.actualizarPaginacion();
  }

  verDetalles(prestamo: Prestamo) {
    this.prestamoDetallado = prestamo;
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles() {
    this.mostrarModalDetalles = false;
    this.prestamoDetallado = null;
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.prestamosFiltrados.length / this.prestamosPorPagina);
    this.paginaActual = Math.max(1, Math.min(this.paginaActual, this.totalPaginas));
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
  }

  obtenerPrestamosPaginaActual() {
    const inicio = (this.paginaActual - 1) * this.prestamosPorPagina;
    const fin = inicio + this.prestamosPorPagina;
    return this.prestamosFiltrados.slice(inicio, fin);
  }

  obtenerRangoPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  // Métodos de conteo
  contarPrestamos(): number {
    return this.prestamos.length;
  }

  contarPrestamosActivos(): number {
    return this.prestamos.filter(p => p.estado === 'ACTIVE').length;
  }

  contarPrestamosDevueltos(): number {
    return this.prestamos.filter(p => p.estado === 'RETURNED').length;
  }

  contarPrestamosVencidos(): number {
    const hoy = new Date();
    const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    return this.prestamos.filter(prestamo => {
      if (prestamo.estado === 'RETURNED') return false;
      const fechaVencimiento = new Date(prestamo.fechaVencimiento);
      const fechaVencimientoNormalizada = new Date(
        fechaVencimiento.getFullYear(),
        fechaVencimiento.getMonth(),
        fechaVencimiento.getDate()
      );
      return fechaVencimientoNormalizada < hoyNormalizado;
    }).length;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'RETURNED': return 'bg-blue-100 text-blue-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVE': return 'Activo';
      case 'RETURNED': return 'Devuelto';
      case 'OVERDUE': return 'Vencido';
      default: return estado;
    }
  }

calcularDiasRestantes(fechaVencimiento: string): number {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferencia = vencimiento.getTime() - hoy.getTime();
  return Math.abs(Math.ceil(diferencia / (1000 * 3600 * 24)));
}


  obtenerTextoDiasRestantes(prestamo: Prestamo): string {
    if (prestamo.estado === 'RETURNED') return 'Completado';
    if (prestamo.estado === 'OVERDUE') return 'Vencido';
    
    const diasRestantes = this.calcularDiasRestantes(prestamo.fechaVencimiento);
    
    if (diasRestantes < 0) return 'Vencido';
    if (diasRestantes === 0) return 'Vence hoy';
    if (diasRestantes === 1) return '1 día restante';
    return `${diasRestantes} días restantes`;
  }

  obtenerClaseDiasRestantes(prestamo: Prestamo): string {
    if (prestamo.estado === 'RETURNED') return 'bg-green-100 text-green-700';
    if (prestamo.estado === 'OVERDUE') return 'bg-red-100 text-red-700';
    
    const diasRestantes = this.calcularDiasRestantes(prestamo.fechaVencimiento);
    
    if (diasRestantes < 0) return 'bg-red-100 text-red-700';
    if (diasRestantes <= 2) return 'bg-orange-100 text-orange-700';
    if (diasRestantes <= 7) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  goToBooks() {
    this.router.navigate(['/books']);
  }

calcularDiasPrestamo(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diferencia = fin.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}


fechaActual = new Date().toISOString();
}