import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book/book';

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  isbn: string;
  anioPublicacion: number;
  sinopsis: string;
  imageUrl: string;
  disponible: boolean;
}

@Component({
  selector: 'app-book-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './books.html',
  styleUrl: './books.css'
})
export class BookUserComponent implements OnInit {
  private bookService = inject(BookService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  libroSeleccionado: Libro | null = null;
  
  // Filtros simples
  terminoBusqueda: string = '';
  generoSeleccionado: string = '';
  
  // Ordenamiento
  campoOrden: string = 'titulo';
  direccionOrden: 'asc' | 'desc' = 'asc';
  
  // Paginación
  paginaActual: number = 1;
  librosPorPagina: number = 12;
  totalPaginas: number = 1;
  
  // Estados
  cargando: boolean = false;
  error: string = '';
  

  generosUnicos: string[] = [];
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const autor = params['autor'];
      this.cargarCatalogoLibros(autor);
    });
  }

   cargarCatalogoLibros(autorFiltro?: string) {
    this.cargando = true;
    this.error = '';
    
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.libros = books.map(book => this.mapearLibroBackend(book));
        this.actualizarGenerosUnicos();
        if (autorFiltro) {
          this.terminoBusqueda = autorFiltro;
        }

        this.filtrarLibros();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el catálogo';
        this.cargando = false;
        console.error('Error loading books:', err);
      }
    });
  }
  
  private mapearLibroBackend(book: any): Libro {
    return {
      id: book.id || 0,
      titulo: book.title || book.titulo || 'Sin título',
      autor: book.authorDTO?.name || book.autor || 'Autor desconocido',
      genero: book.genre || book.genero || 'No especificado',
      isbn: book.isbn || 'Sin ISBN',
      anioPublicacion: book.publicationYear || book.anioPublicacion || new Date().getFullYear(),
      sinopsis: book.sinopsis || book.description || 'Descripción no disponible',
      disponible: book.available !== undefined ? book.available : true,
      imageUrl: book.imageUrl || book.imge_url || 'assets/default-book.png'
    };
  }

  private actualizarGenerosUnicos() {
    const generos = new Set(this.libros.map(libro => libro.genero));
    this.generosUnicos = Array.from(generos).sort();
  }

  filtrarLibros() {
    let filtered = this.libros.filter(libro => {
      const coincideBusqueda = !this.terminoBusqueda || 
        libro.titulo.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        libro.autor.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        libro.genero.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      const coincideGenero = !this.generoSeleccionado || libro.genero === this.generoSeleccionado;
      
      return coincideBusqueda && coincideGenero;
    });

    // Ordenar
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

  seleccionarLibro(libro: Libro) {
    this.libroSeleccionado = libro;
  }

  cerrarDetalle() {
    this.libroSeleccionado = null;
  }

solicitarPrestamo(libro: Libro) {
  this.router.navigate(['/loans-user'], { 
    queryParams: { solicitarPrestamo: 'true', libroId: libro.id },
    state: { libroSeleccionado: libro } // Mantén el state por si acaso
  });
}

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.librosFiltrados.length / this.librosPorPagina);
    this.paginaActual = Math.max(1, Math.min(this.paginaActual, this.totalPaginas));
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
  }

  obtenerLibrosPaginaActual() {
    const inicio = (this.paginaActual - 1) * this.librosPorPagina;
    const fin = inicio + this.librosPorPagina;
    return this.librosFiltrados.slice(inicio, fin);
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

  // Métodos de conteo para estadísticas
  contarLibros(): number {
    return this.libros.length;
  }

  contarLibrosDisponibles(): number {
    return this.libros.filter(libro => libro.disponible).length;
  }

  contarGenerosUnicos(): number {
    return this.generosUnicos.length;
  }
}