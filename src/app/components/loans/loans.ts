import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoansService, LoanDTO, CreateLoanRequest } from '../../services/loans/loans';
import { UserService, UserDTO } from '../../services/users/users';
import { BookService, BookDTO } from '../../services/book/book';

interface Prestamo {
  id: number;
  usuario: string;
  userId: number;
  libros: any[];
  fechaPrestamo: string;
  fechaVencimiento: string;
  fechaDevolucion: string | null;
  estado: 'PENDING' |  'REJECTED' | 'ACTIVE' | 'RETURNED' | 'LATE';
  multa: number;
  loanItems: any[];
  userDTO?: any;
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loans.html',
  styleUrl: './loans.css',
})
export class LoansComponent implements OnInit {
  private loansService = inject(LoansService);
  private userService = inject(UserService);
  private bookService = inject(BookService);

  prestamos: Prestamo[] = [];
  prestamosFiltrados: Prestamo[] = [];

  // Datos para autocompletado
  usuarios: UserDTO[] = [];
  libros: BookDTO[] = [];
  usuariosFiltrados: UserDTO[] = [];
  librosFiltrados: BookDTO[] = [];

  // Búsquedas en modales
  mostrarModalDetalles: boolean = false;
  prestamoDetallado: any = null;
  busquedaUsuario: string = '';
  busquedaLibro: string = '';

  terminoBusqueda: string = '';
  filtroEstado: string = 'PENDING';
  filtroUsuario: string = '';
  filtroFecha: string = '';

  campoOrden: string = 'fechaPrestamo';
  direccionOrden: 'asc' | 'desc' = 'desc';

  paginaActual: number = 1;
  prestamosPorPagina: number = 10;
  totalPaginas: number = 1;

  mostrarModal: boolean = false;
  mostrarModalConfirmacion: boolean = false;
  prestamoEditando: Prestamo | null = null;
  prestamoSeleccionado: Prestamo | null = null;
  prestamoAEliminar: Prestamo | null = null;

  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';

  nuevoPrestamo: any = {
    userId: 0,
    userName: '',
    bookIds: [],
    bookTitles: [],
  };

  maximoLibros: number = 3;

  ngOnInit() {
    this.cargarPrestamosReales();
    this.cargarUsuarios();
    this.cargarLibros();
    this.updateOverdueLoans();
  }

  updateOverdueLoans() {
    this.loansService.updateOverdueLoans().subscribe({
      next: (msg) => {
        console.log('✅ Préstamos vencidos actualizados');
      },
      error: (err) => {
        console.error('❌ Error al actualizar préstamos vencidos', err);
      },
    });
  }

  cargarUsuarios() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.usuarios = users;
        this.usuariosFiltrados = [];
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      },
    });
  }

  cargarLibros() {
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

  filtrarUsuarios() {
    if (!this.busquedaUsuario) {
      this.usuariosFiltrados = [];
      return;
    }

    const busqueda = this.busquedaUsuario.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(
      (usuario) =>
        usuario.name.toLowerCase().includes(busqueda) ||
        usuario.email.toLowerCase().includes(busqueda) ||
        (usuario.id && usuario.id.toString().includes(busqueda))
    );
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

  seleccionarUsuario(usuario: UserDTO) {
    this.nuevoPrestamo.userId = usuario.id || 0;
    this.nuevoPrestamo.userName = usuario.name;
    this.busquedaUsuario = usuario.name;
    this.usuariosFiltrados = [];
  }

  limpiarUsuario() {
    this.nuevoPrestamo.userId = 0;
    this.nuevoPrestamo.userName = '';
    this.busquedaUsuario = '';
    this.usuariosFiltrados = [];
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

  public cargarPrestamosReales() {
    this.cargando = true;
    this.error = '';
    this.loansService.getAllLoans().subscribe({
      next: (loans) => {
        this.prestamos = loans.map((loan) => this.mapearPrestamoBackend(loan));
        this.filtrarPrestamos();
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          'Error al cargar los préstamos: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      },
    });
  }

  private mapearPrestamoBackend(loan: any): Prestamo {
    // Mapear LATE correctamente
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

  verDetalles(prestamo: Prestamo) {
    this.prestamoDetallado = prestamo;
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles() {
    this.mostrarModalDetalles = false;
    this.prestamoDetallado = null;
  }

filtrarPrestamos() {
  let filtered = this.prestamos.filter((prestamo) => {
    const coincideBusqueda =
      !this.terminoBusqueda ||
      prestamo.usuario.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
      prestamo.libros.some(
        (libro) =>
          libro.bookId.toString().includes(this.terminoBusqueda) ||
          libro.bookDTO?.title?.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
          libro.bookDTO?.authorDTO?.name
            ?.toLowerCase()
            .includes(this.terminoBusqueda.toLowerCase())
      );

    // CORREGIDO: Manejar el caso cuando filtroEstado es "OVERDUE" (del HTML) pero el estado real es "LATE"
    const coincideEstado = !this.filtroEstado || 
      (this.filtroEstado === 'OVERDUE' ? prestamo.estado === 'LATE' : prestamo.estado === this.filtroEstado);

    const coincideUsuario =
      !this.filtroUsuario ||
      prestamo.usuario.toLowerCase().includes(this.filtroUsuario.toLowerCase());

    const coincideFecha = this.filtrarPorFecha(prestamo);

    return coincideBusqueda && coincideEstado && coincideUsuario && coincideFecha;
  });

  filtered.sort((a, b) => {
    const aValue = (a as any)[this.campoOrden];
    const bValue = (b as any)[this.campoOrden];

    if (aValue < bValue) return this.direccionOrden === 'asc' ? -1 : 1;
    if (aValue > bValue) return this.direccionOrden === 'asc' ? 1 : -1;
    return 0;
  });

  this.prestamosFiltrados = filtered;
  this.actualizarPaginacion();
}

  filtrarPorFecha(prestamo: Prestamo): boolean {
    if (!this.filtroFecha) return true;

    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const fechaPrestamo = new Date(prestamo.fechaPrestamo);
    const fechaPrestamoLocal = new Date(
      fechaPrestamo.getFullYear(),
      fechaPrestamo.getMonth(),
      fechaPrestamo.getDate()
    );

    const fechaVencimiento = new Date(prestamo.fechaVencimiento);
    const fechaVencimientoLocal = new Date(
      fechaVencimiento.getFullYear(),
      fechaVencimiento.getMonth(),
      fechaVencimiento.getDate()
    );

    switch (this.filtroFecha) {
      case 'hoy':
        return fechaPrestamoLocal.getTime() === hoyLocal.getTime();

      case 'semana':
        const unaSemanaAtras = new Date(hoyLocal);
        unaSemanaAtras.setDate(hoyLocal.getDate() - 7);
        return fechaPrestamoLocal >= unaSemanaAtras;

      case 'mes':
        const unMesAtras = new Date(hoyLocal);
        unMesAtras.setMonth(hoyLocal.getMonth() - 1);
        return fechaPrestamoLocal >= unMesAtras;

      case 'vencidos':
        const estaVencido = prestamo.estado === 'LATE';
        return estaVencido;

      default:
        return true;
    }
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrden = campo;
      this.direccionOrden = 'asc';
    }
    this.filtrarPrestamos();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroUsuario = '';
    this.filtroFecha = '';
    this.filtroEstado = 'PENDING';
    this.filtrarPrestamos();
  }

  // Métodos para contar préstamos por estado
  contarPrestamos(): number {
    return this.prestamos.length;
  }

  contarPrestamosPendientes(): number {
    return this.prestamos.filter((p) => p.estado === 'PENDING').length;
  }


  contarPrestamosRechazados(): number {
    return this.prestamos.filter((p) => p.estado === 'REJECTED').length;
  }

  contarPrestamosActivos(): number {
    return this.prestamos.filter((p) => p.estado === 'ACTIVE').length;
  }

  contarPrestamosDevueltos(): number {
    return this.prestamos.filter((p) => p.estado === 'RETURNED').length;
  }

  contarPrestamosVencidos(): number {
    return this.prestamos.filter((p) => p.estado === 'LATE').length;
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.prestamosFiltrados.length / this.prestamosPorPagina);
    this.paginaActual = Math.max(1, Math.min(this.paginaActual, this.totalPaginas));
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
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

  seleccionarPrestamo(prestamo: Prestamo) {
    this.prestamoSeleccionado = prestamo;
  }

  abrirModalNuevoPrestamo() {
    this.prestamoEditando = null;
    this.nuevoPrestamo = {
      userId: 0,
      userName: '',
      bookIds: [],
      bookTitles: [],
    };
    this.busquedaUsuario = '';
    this.busquedaLibro = '';
    this.usuariosFiltrados = [];
    this.librosFiltrados = [];
    this.mostrarModal = true;
    this.error = '';
  }

  cerrarModal() {
    if (this.guardando) {
      return;
    }

    this.mostrarModal = false;
    this.prestamoEditando = null;
    this.nuevoPrestamo = {
      userId: 0,
      userName: '',
      bookIds: [],
      bookTitles: [],
    };
    this.busquedaUsuario = '';
    this.busquedaLibro = '';
    this.usuariosFiltrados = [];
    this.librosFiltrados = [];
    this.error = '';
  }

  abrirModalConfirmacionEliminar(prestamo: Prestamo) {
    this.prestamoAEliminar = prestamo;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion = false;
    this.prestamoAEliminar = null;
  }

  confirmarEliminarPrestamo() {
    if (!this.prestamoAEliminar) return;

    this.loansService.deleteLoan(this.prestamoAEliminar.id).subscribe({
      next: () => {
        this.prestamos = this.prestamos.filter((p) => p.id !== this.prestamoAEliminar!.id);
        this.filtrarPrestamos();
        this.cerrarModalConfirmacion();
      },
      error: (err) => {
        this.error =
          'Error al eliminar el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cerrarModalConfirmacion();
      },
    });
  }

  // Métodos para los estados del préstamo
  aprobarPrestamo(prestamo: Prestamo) {
    this.cargando = true;
    this.loansService.approveLoan(prestamo.id).subscribe({
      next: (updatedLoan) => {
        const index = this.prestamos.findIndex((p) => p.id === prestamo.id);
        if (index !== -1) {
          this.prestamos[index] = this.mapearPrestamoBackend(updatedLoan);
        }
        this.filtrarPrestamos();
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          'Error al aprobar el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      },
    });
  }

  rechazarPrestamo(prestamo: Prestamo) {
    this.cargando = true;
    this.loansService.rejectLoan(prestamo.id).subscribe({
      next: (updatedLoan) => {
        const index = this.prestamos.findIndex((p) => p.id === prestamo.id);
        if (index !== -1) {
          this.prestamos[index] = this.mapearPrestamoBackend(updatedLoan);
        }
        this.filtrarPrestamos();
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          'Error al rechazar el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      },
    });
  }

  devolverPrestamo(prestamo: Prestamo) {
    this.cargando = true;
    this.loansService.returnLoan(prestamo.id).subscribe({
      next: (updatedLoan) => {
        const index = this.prestamos.findIndex((p) => p.id === prestamo.id);
        if (index !== -1) {
          this.prestamos[index] = this.mapearPrestamoBackend(updatedLoan);
        }
        this.filtrarPrestamos();
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          'Error al devolver el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      },
    });
  }

  guardarPrestamo() {
    this.error = '';

    if (!this.nuevoPrestamo.userId) {
      this.error = 'Debe seleccionar un usuario';
      return;
    }

    if (this.nuevoPrestamo.bookIds.length === 0) {
      this.error = 'Debe agregar al menos un libro';
      return;
    }

    if (this.nuevoPrestamo.bookIds.length > this.maximoLibros) {
      this.error = `Máximo ${this.maximoLibros} libros por préstamo`;
      return;
    }

    this.guardando = true;

    const prestamoParaBackend = {
      userId: this.nuevoPrestamo.userId,
      bookIds: this.nuevoPrestamo.bookIds,
    };

    this.loansService.createLoan(prestamoParaBackend).subscribe({
      next: (loan) => {
        const nuevoPrestamo = this.mapearPrestamoBackend(loan);
        this.prestamos.push(nuevoPrestamo);
        this.filtrarPrestamos();
        this.guardando = false;
        this.cerrarModal();
      },
      error: (err) => {
        this.error = 'Error al crear el préstamo: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.guardando = false;
      },
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No especificada';
    try {
      const fechaObj = new Date(fecha);
      const fechaAjustada = new Date(fechaObj.getTime() + fechaObj.getTimezoneOffset() * 60000);

      return fechaAjustada.toLocaleDateString('es-ES', {
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
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-700';
      case 'RETURNED':
        return 'bg-gray-100 text-gray-700';
      case 'LATE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado) {
      case 'PENDING':
        return 'Pendiente';
      case 'REJECTED':
        return 'Rechazado';
      case 'ACTIVE':
        return 'Activo';
      case 'RETURNED':
        return 'Devuelto';
      case 'LATE':
        return 'Vencido';
      default:
        return estado;
    }
  }

  puedeEliminar(): boolean {
    return true;
  }

  puedeCrear(): boolean {
    return true;
  }

  calcularDiasPrestamo(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }
}