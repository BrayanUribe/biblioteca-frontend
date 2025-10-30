import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorsService } from '../../services/author/authors';
import { BookService } from '../../services/book/book';

interface Autor {
  id: number;
  nombre: string;
  nacionalidad: string;
  biografia: string;
  imageUrl: string;
  cantidadLibros?: number;
}

@Component({
  selector: 'app-author-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './authors.html',
  styleUrl: './authors.css'
})
export class AuthorUserComponent implements OnInit {
  private authorsService = inject(AuthorsService);
  private bookService = inject(BookService);
  private router = inject(Router);
  
  autores: Autor[] = [];
  autoresFiltrados: Autor[] = [];
  autorSeleccionado: Autor | null = null;
  
  // Filtros simples
  terminoBusqueda: string = '';
  
  // Ordenamiento
  campoOrden: string = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';
  
  // Paginación
  paginaActual: number = 1;
  autoresPorPagina: number = 12;
  totalPaginas: number = 1;
  
  // Estados
  cargando: boolean = false;
  error: string = '';

  ngOnInit() {
    this.cargarCatalogoAutores();
  }

  cargarCatalogoAutores() {
    this.cargando = true;
    this.error = '';
    
    this.authorsService.getAllAuthors().subscribe({
      next: (authors) => {
        this.autores = authors.map(author => this.mapearAutorBackend(author));
        this.cargarCantidadLibrosPorAutor();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el catálogo de autores';
        this.cargando = false;
        console.error('Error loading authors:', err);
      }
    });
  }

  private cargarCantidadLibrosPorAutor() {
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        // Contar libros por autor
        const librosPorAutor = new Map<number, number>();
        
        books.forEach(book => {
          const autorId = book.authorDTO?.id;
          if (autorId) {
            librosPorAutor.set(autorId, (librosPorAutor.get(autorId) || 0) + 1);
          }
        });
        this.autores = this.autores.map(autor => ({
          ...autor,
          cantidadLibros: librosPorAutor.get(autor.id) || 0
        }));

        this.filtrarAutores();
      },
      error: (err) => {
        console.error('Error loading books for count:', err);
        this.filtrarAutores();
      }
    });
  }

  private mapearAutorBackend(author: any): Autor {
    return {
      id: author.id || 0,
      nombre: author.name || author.nombre || 'Sin nombre',
      nacionalidad: author.nationality || author.nacionalidad || 'No especificada',
      biografia: author.biography || author.biografia || 'Biografía no disponible',
      imageUrl: author.imageUrl || author.imge_url || author.avatar || 'assets/default-avatar.png',
      cantidadLibros: 0
    };
  }

  filtrarAutores() {
    let filtered = this.autores.filter(autor => {
      const coincideBusqueda = !this.terminoBusqueda || 
        autor.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        autor.nacionalidad.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      return coincideBusqueda;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = (a as any)[this.campoOrden];
      const bValue = (b as any)[this.campoOrden];
      
      if (aValue < bValue) return this.direccionOrden === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });

    this.autoresFiltrados = filtered;
    this.actualizarPaginacion();
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrden = campo;
      this.direccionOrden = 'asc';
    }
    this.filtrarAutores();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtrarAutores();
  }

  seleccionarAutor(autor: Autor) {
    this.autorSeleccionado = autor;
  }

  cerrarDetalle() {
    this.autorSeleccionado = null;
  }

  verLibrosDelAutor(autor: Autor) {
    this.router.navigate(['/books'], { queryParams: { autor: autor.nombre } });
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.autoresFiltrados.length / this.autoresPorPagina);
    this.paginaActual = Math.max(1, Math.min(this.paginaActual, this.totalPaginas));
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
  }

  obtenerAutoresPaginaActual() {
    const inicio = (this.paginaActual - 1) * this.autoresPorPagina;
    const fin = inicio + this.autoresPorPagina;
    return this.autoresFiltrados.slice(inicio, fin);
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
  contarAutores(): number {
    return this.autores.length;
  }

  contarTotalLibros(): number {
    return this.autores.reduce((total, autor) => total + (autor.cantidadLibros || 0), 0);
  }

  contarPaisesUnicos(): number {
    const paises = new Set(this.autores.map(autor => autor.nacionalidad));
    return paises.size;
  }

  // Helper para formatear biografía
  formatearBiografia(biografia: string): string {
    if (!biografia || biografia === 'Biografía no disponible') return 'Sin biografía disponible';
    return biografia.length > 150 ? biografia.substring(0, 150) + '...' : biografia;
  }


  obtenerEmojiBandera(nacionalidad: string): string {
    const paises: { [key: string]: string } = {
      'colombia': '🇨🇴',
      'méxico': '🇲🇽',
      'argentina': '🇦🇷',
      'españa': '🇪🇸',
      'chile': '🇨🇱',
      'perú': '🇵🇪',
      'venezuela': '🇻🇪',
      'ecuador': '🇪🇨',
      'estados unidos': '🇺🇸',
      'reino unido': '🇬🇧',
      'francia': '🇫🇷',
      'italia': '🇮🇹',
      'alemania': '🇩🇪',
      'brasil': '🇧🇷'
    };
    
    return paises[nacionalidad.toLowerCase()] || '🌍';
  }
}