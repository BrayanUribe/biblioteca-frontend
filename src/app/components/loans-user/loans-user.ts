import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoansService, CreateLoanRequest } from '../../services/loans/loans';
import { UserService } from '../../services/users/users';
import { BookService, BookDTO } from '../../services/book/book';

interface Prestamo {
  id: number;
  usuario: string;
  userId: number;
  libros: any[];
  fechaPrestamo: string;
  fechaVencimiento: string;
  fechaDevolucion: string | null;
  estado: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'RETURNED' | 'LATE';
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
  private bookService = inject(BookService);
  private router = inject(Router);
  
  prestamos: Prestamo[] = [];
  prestamosFiltrados: Prestamo[] = [];
  
  // Datos para nuevo préstamo
  libros: BookDTO[] = [];
  librosFiltrados: BookDTO[] = [];
  busquedaLibro: string = '';
  
  filtroEstado: string = '';
  paginaActual: number = 1;
  prestamosPorPagina: number = 8;
  totalPaginas: number = 1;
  
  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';
  success: string = '';
  
  mostrarModalDetalles: boolean = false;
  mostrarModalNuevoPrestamo: boolean = false;
  prestamoDetallado: any = null;
  
  usuarioId: number | null = null;
  userProfile: any = null;

  nuevoPrestamo: any = {
    bookIds: [],
    bookTitles: [],
  };

  maximoLibros: number = 3;

  ngOnInit() {
    this.cargarUsuarioLogueado();
  }

  private cargarUsuarioLogueado() {
    this.userService.getUserProfile().subscribe({
      next: (user: any) => {    
        this.userProfile = user;
        this.usuarioId = user.id;
        this.cargarMisPrestamos();
        this.cargarLibrosDisponibles();
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this.error = 'Error al cargar tu información de usuario';
        this.router.navigate(['/login']);
      }
    });
  }

  cargarLibrosDisponibles() {
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.libros = books.filter((book) => book.available && book.stock > 0);
        this.librosFiltrados = [];
      },
      error: (err) => {
        console.error('Error al cargar libros:', err);
      },
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
    // Mapear estados correctamente
    let estado: any = loan.status || 'PENDING';
    if (estado === 'OVERDUE') {
      estado = 'LATE';
    }

    return {
      id: loan.id || 0,
      usuario: loan.userDTO?.name || 'Usuario desconocido',
      userId: loan.userDTO?.id || 0,
      libros: loan.loanItems || [],
      fechaPrestamo: loan.loanDate || new Date().toISOString(),
      fechaVencimiento: loan.dueDate || new Date().toISOString(),
      fechaDevolucion: loan.returnDate || null,
      estado: estado,
      multa: loan.fine || 0,
      loanItems: loan.loanItems || [],
      userDTO: loan.userDTO,
    };
  }

  // Métodos para nuevo préstamo
  abrirModalNuevoPrestamo() {
    this.mostrarModalNuevoPrestamo = true;
    this.error = '';
    this.success = '';
    this.nuevoPrestamo = {
      bookIds: [],
      bookTitles: [],
    };
    this.busquedaLibro = '';
    this.librosFiltrados = [];
  }

  cerrarModalNuevoPrestamo() {
    if (this.guardando) return;
    this.mostrarModalNuevoPrestamo = false;
    this.nuevoPrestamo = {
      bookIds: [],
      bookTitles: [],
    };
    this.busquedaLibro = '';
    this.librosFiltrados = [];
    this.error = '';
  }

  filtrarLibros() {
    if (!this.busquedaLibro) {
      this.librosFiltrados = [];
      return;
    }

    const busqueda = this.busquedaLibro.toLowerCase();
    this.librosFiltrados = this.libros.filter(
      (libro) =>
        libro.title.toLowerCase().includes(busqueda) ||
        libro.authorDTO.name.toLowerCase().includes(busqueda) ||
        libro.isbn.toLowerCase().includes(busqueda) ||
        (libro.id && libro.id.toString().includes(busqueda))
    );
  }

  seleccionarLibro(libro: BookDTO) {
    if (this.nuevoPrestamo.bookIds.length >= this.maximoLibros) {
      this.error = `Máximo ${this.maximoLibros} libros por préstamo`;
      return;
    }

    if (this.nuevoPrestamo.bookIds.includes(libro.id)) {
      this.error = 'Este libro ya está en la lista';
      return;
    }

    this.nuevoPrestamo.bookIds.push(libro.id);
    this.nuevoPrestamo.bookTitles.push({
      id: libro.id,
      title: libro.title,
      author: libro.authorDTO.name,
      isbn: libro.isbn,
    });

    this.busquedaLibro = '';
    this.librosFiltrados = [];
    this.error = '';
  }

  removerLibro(index: number) {
    this.nuevoPrestamo.bookIds.splice(index, 1);
    this.nuevoPrestamo.bookTitles.splice(index, 1);
  }

  solicitarPrestamo() {
    this.error = '';

    if (this.nuevoPrestamo.bookIds.length === 0) {
      this.error = 'Debe agregar al menos un libro';
      return;
    }

    if (this.nuevoPrestamo.bookIds.length > this.maximoLibros) {
      this.error = `Máximo ${this.maximoLibros} libros por préstamo`;
      return;
    }

    this.guardando = true;

    const prestamoRequest: CreateLoanRequest = {
      userId: this.usuarioId!,
      bookIds: this.nuevoPrestamo.bookIds
    };

    // Usar requestLoan en lugar de createLoan
    this.loansService.requestLoan(prestamoRequest).subscribe({
      next: (loan) => {
        const nuevoPrestamo = this.mapearPrestamoBackend(loan);
        this.prestamos.push(nuevoPrestamo);
        this.filtrarPrestamos();
        this.guardando = false;
        this.success = '¡Préstamo solicitado correctamente! Será revisado por un bibliotecario.';
        setTimeout(() => {
          this.cerrarModalNuevoPrestamo();
          this.success = '';
        }, 2000);
      },
      error: (err) => {
        this.error = 'Error al solicitar el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.guardando = false;
      },
    });
  }

  // Métodos existentes (sin cambios)
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

  contarPrestamosPendientes(): number {
    return this.prestamos.filter(p => p.estado === 'PENDING').length;
  }

  contarPrestamosAprobados(): number {
    return this.prestamos.filter(p => p.estado === 'APPROVED').length;
  }

  contarPrestamosRechazados(): number {
    return this.prestamos.filter(p => p.estado === 'REJECTED').length;
  }

  contarPrestamosActivos(): number {
    return this.prestamos.filter(p => p.estado === 'ACTIVE').length;
  }

  contarPrestamosDevueltos(): number {
    return this.prestamos.filter(p => p.estado === 'RETURNED').length;
  }

  contarPrestamosVencidos(): number {
    return this.prestamos.filter(p => p.estado === 'LATE').length;
  }

formatearFecha(fecha: string): string {
  if (!fecha) return 'No especificada';
  try {
    const fechaObj = new Date(fecha);
    

    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC' // ← Esto es clave
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

  obtenerClaseEstado(estado: string): string {
    switch (estado) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'RETURNED': return 'bg-gray-100 text-gray-700';
      case 'LATE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      case 'ACTIVE': return 'Activo';
      case 'RETURNED': return 'Devuelto';
      case 'LATE': return 'Vencido';
      default: return estado;
    }
  }

  calcularDiasRestantes(fechaVencimiento: string): number {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  obtenerTextoDiasRestantes(prestamo: Prestamo): string {
    if (prestamo.estado === 'RETURNED') return 'Completado';
    if (prestamo.estado === 'LATE') return 'Vencido';
    if (prestamo.estado === 'PENDING') return 'En revisión';
    if (prestamo.estado === 'REJECTED') return 'Rechazado';
    if (prestamo.estado === 'APPROVED') return 'Aprobado';
    
    const diasRestantes = this.calcularDiasRestantes(prestamo.fechaVencimiento);
    
    if (diasRestantes < 0) return 'Vencido';
    if (diasRestantes === 0) return 'Vence hoy';
    if (diasRestantes === 1) return '1 día restante';
    return `${diasRestantes} días restantes`;
  }

  obtenerClaseDiasRestantes(prestamo: Prestamo): string {
    if (prestamo.estado === 'RETURNED') return 'bg-green-100 text-green-700';
    if (prestamo.estado === 'LATE') return 'bg-red-100 text-red-700';
    if (prestamo.estado === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (prestamo.estado === 'REJECTED') return 'bg-red-100 text-red-700';
    if (prestamo.estado === 'APPROVED') return 'bg-green-100 text-green-700';
    
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