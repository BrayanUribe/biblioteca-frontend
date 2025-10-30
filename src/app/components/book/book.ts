import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, BookDTO, Book } from '../../services/book/book';
import { AuthorsService, AuthorDTO } from '../../services/author/authors'; 

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  isbn: string;
  anioPublicacion: number;
  stock: number;
  disponible: boolean;
  imageUrl: string;
}

@Component({
  selector: 'app-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book.html',
  styleUrl: './book.css'
})
export class BookComponent implements OnInit {

  private bookService = inject(BookService);
  private authorsService = inject(AuthorsService); 
  
  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  
  terminoBusqueda: string = '';
  generoSeleccionado: string = '';
  
  campoOrden: string = 'titulo';
  direccionOrden: 'asc' | 'desc' = 'asc';
  
  paginaActual: number = 1;
  librosPorPagina: number = 10;
  totalPaginas: number = 1;
  
  mostrarModal: boolean = false;
  mostrarModalConfirmacion: boolean = false;
  libroEditando: Libro | null = null;
  libroSeleccionado: Libro | null = null;
  libroAEliminar: Libro | null = null;
  
  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';
  
  generosUnicos: string[] = [];
  sugerenciasGeneros: string[] = [];
  mostrarSugerencias: boolean = false;

  autores: AuthorDTO[] = [];

  nuevoLibro: any = {
    titulo: '',
    autorId: null,
    genero: '',
    isbn: '',
    anioPublicacion: new Date().getFullYear(),
    stock: 1,
    disponible: true
  };

  ngOnInit() {
    this.cargarLibrosReales();
    this.cargarAutores(); 
  }

  private cargarAutores() {
    this.authorsService.getAllAuthors().subscribe({
      next: (authors) => {
        this.autores = authors;
      },
      error: (err) => {
        this.usarAutoresPorDefecto();
      }
    });
  }
  

  private usarAutoresPorDefecto() {
    this.autores = [
      { id: 1, name: 'Gabriel García Márquez', nationality: 'Colombia' },
      { id: 2, name: 'Isabel Allende', nationality: 'Chile' },
      { id: 3, name: 'Mario Vargas Llosa', nationality: 'Perú' },
      { id: 4, name: 'Jorge Luis Borges', nationality: 'Argentina' },
      { id: 5, name: 'Pablo Neruda', nationality: 'Chile' },
      { id: 6, name: 'Julio Cortázar', nationality: 'Argentina' }
    ];
  }

  public cargarLibrosReales() {
    this.cargando = true;
    this.error = '';
    
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.libros = books.map(book => this.mapearLibroBackend(book));
        this.actualizarGenerosUnicos();
        this.filtrarLibros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los libros: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      }
    });
  }

  private actualizarGenerosUnicos() {
    const generos = new Set(this.libros.map(libro => libro.genero));
    this.generosUnicos = Array.from(generos).sort();
  }

  private mapearLibroBackend(book: any): Libro {
    return {
      id: book.id || 0,
      titulo: book.title || book.titulo || 'Sin título',
      autor: book.authorDTO?.name || book.autor || 'Autor desconocido',
      genero: book.genre || book.genero || 'No especificado',
      isbn: book.isbn || 'Sin ISBN',
      anioPublicacion: book.publicationYear || book.anioPublicacion || new Date().getFullYear(),
      stock: book.stock || 0,
      disponible: book.available !== undefined ? book.available : true,
      imageUrl: book.imageUrl || book.imge_url || 'assets/default-book.png'
    };
  }

  private mapearParaBackend(libro: any): any {
    return {
      title: libro.titulo || '',
      author: { id: libro.autorId },
      genre: libro.genero || '',
      isbn: libro.isbn || '',
      publicationYear: libro.anioPublicacion || new Date().getFullYear(),
      stock: libro.stock || 0,
      available: libro.disponible !== undefined ? libro.disponible : true
    };
  }

  filtrarLibros() {
    let filtered = this.libros.filter(libro => {
      const coincideBusqueda = !this.terminoBusqueda || 
        libro.titulo.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        libro.autor.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        libro.isbn.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        libro.genero.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      const coincideGenero = !this.generoSeleccionado || libro.genero === this.generoSeleccionado;
      
      return coincideBusqueda && coincideGenero;
    });

    filtered.sort((a, b) => {
      const aValue = (a as any)[this.campoOrden];
      const bValue = (b as any)[this.campoOrden];
      
      if (aValue < bValue) return this.direccionOrden === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });

    this.librosFiltrados = filtered;
    this.actualizarPaginacion();
  }

  // Métodos para autocompletado de géneros
  buscarSugerenciasGeneros(termino: string) {
    if (!termino) {
      this.sugerenciasGeneros = [];
      this.mostrarSugerencias = false;
      return;
    }
    
    const terminoLower = termino.toLowerCase();
    this.sugerenciasGeneros = this.generosUnicos.filter(genero => 
      genero.toLowerCase().includes(terminoLower)
    ).slice(0, 5);
    
    this.mostrarSugerencias = this.sugerenciasGeneros.length > 0;
  }

  seleccionarGenero(genero: string) {
    this.nuevoLibro.genero = genero;
    this.mostrarSugerencias = false;
  }

  ocultarSugerencias() {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 150);
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrden = campo;
      this.direccionOrden = 'asc';
    }
    this.filtrarLibros();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.generoSeleccionado = '';
    this.filtrarLibros();
  }

  contarLibros(): number {
    return this.libros.length;
  }

  contarLibrosDisponibles(): number {
    return this.libros.filter(libro => libro.disponible).length;
  }

  contarGenerosUnicos(): number {
    return this.generosUnicos.length;
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.librosFiltrados.length / this.librosPorPagina);
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

  seleccionarLibro(libro: Libro) {
    this.libroSeleccionado = libro;
  }

  abrirModalNuevoLibro() {
    this.libroEditando = null;
    this.nuevoLibro = {
      titulo: '',
      autorId: null,
      genero: '',
      isbn: '',
      anioPublicacion: new Date().getFullYear(),
      stock: 1,
      disponible: true
    };
    this.mostrarModal = true;
    this.error = '';
    this.mostrarSugerencias = false;
  }

  editarLibro(libro: Libro) {
    this.libroEditando = libro;
    const autorEncontrado = this.autores.find(a => a.name === libro.autor);
    this.nuevoLibro = { 
      ...libro,
      autorId: autorEncontrado?.id || null
    };
    this.mostrarModal = true;
    this.error = '';
    this.mostrarSugerencias = false;
  }

  cerrarModal() {
    if (this.guardando) {
      return;
    }
    
    this.mostrarModal = false;
    this.libroEditando = null;
    this.nuevoLibro = {
      titulo: '',
      autorId: null,
      genero: '',
      isbn: '',
      anioPublicacion: new Date().getFullYear(),
      stock: 1,
      disponible: true
    };
    this.error = '';
    this.mostrarSugerencias = false;
  }

  abrirModalConfirmacionEliminar(libro: Libro) {
    this.libroAEliminar = libro;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion = false;
    this.libroAEliminar = null;
  }

  confirmarEliminarLibro() {
    if (!this.libroAEliminar) return;

    this.bookService.deleteBook(this.libroAEliminar.id).subscribe({
      next: () => {
        this.libros = this.libros.filter(l => l.id !== this.libroAEliminar!.id);
        this.actualizarGenerosUnicos();
        this.filtrarLibros();
        this.cerrarModalConfirmacion();
      },
      error: (err) => {
        this.error = 'Error al eliminar el libro: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cerrarModalConfirmacion();
        console.error('Error deleting book:', err);
      }
    });
  }

  guardarLibro() {
    this.error = '';

    if (!this.nuevoLibro.titulo || !this.nuevoLibro.autorId || !this.nuevoLibro.genero || !this.nuevoLibro.isbn) {
      this.error = 'Título, autor, género e ISBN son obligatorios';
      return;
    }

    if (this.nuevoLibro.anioPublicacion < 1000 || this.nuevoLibro.anioPublicacion > 2100) {
      this.error = 'El año de publicación debe ser válido';
      return;
    }

    if (this.nuevoLibro.stock < 0) {
      this.error = 'El stock no puede ser negativo';
      return;
    }

    this.guardando = true;

    const libroParaBackend = this.mapearParaBackend(this.nuevoLibro);
    
    if (this.libroEditando) {
      this.bookService.updateBook(this.libroEditando.id, libroParaBackend).subscribe({
        next: (book) => {
          const libroActualizado = this.mapearLibroBackend(book);
          const index = this.libros.findIndex(l => l.id === this.libroEditando!.id);
          if (index !== -1) {
            this.libros[index] = libroActualizado;
          }
          this.actualizarGenerosUnicos();
          this.filtrarLibros();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al actualizar el libro: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error updating book:', err);
        }
      });
    } else {
      this.bookService.createBook(libroParaBackend).subscribe({
        next: (book) => {
          const nuevoLibro = this.mapearLibroBackend(book);
          this.libros.push(nuevoLibro);
          this.actualizarGenerosUnicos();
          this.filtrarLibros();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al crear el libro: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error creating book:', err);
        }
      });
    }
  }

  eliminarLibro(libro: Libro) {
    this.abrirModalConfirmacionEliminar(libro);
  }

  puedeEliminar(): boolean {
    return true; 
  }

  puedeEditar(): boolean {
    return true; 
  }

  puedeCrear(): boolean {
    return true; 
  }
}