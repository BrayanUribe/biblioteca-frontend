import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorsService, AuthorDTO } from '../../services/author/authors';

interface Autor {
  id: number;
  nombre: string;
  nacionalidad: string;
  biografia: string;
  imageUrl: string;
}

@Component({
  selector: 'app-author',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './author.html',
  styleUrl: './author.css'
})
export class AuthorComponent implements OnInit {

  private authorsService = inject(AuthorsService);
  
  autores: Autor[] = [];
  autoresFiltrados: Autor[] = [];
  
  terminoBusqueda: string = '';
  
  campoOrden: string = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';
  
  paginaActual: number = 1;
  autoresPorPagina: number = 10;
  totalPaginas: number = 1;
  
  mostrarModal: boolean = false;
  mostrarModalConfirmacion: boolean = false;
  autorEditando: Autor | null = null;
  autorSeleccionado: Autor | null = null;
  autorAEliminar: Autor | null = null;
  
  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';
  
  nuevoAutor: any = {
    nombre: '',
    nacionalidad: '',
    biografia: ''
  };

  ngOnInit() {
    this.cargarAutoresReales();
  }

  public cargarAutoresReales() {
    this.cargando = true;
    this.error = '';
    
    this.authorsService.getAllAuthors().subscribe({
      next: (authors) => {
        this.autores = authors.map(author => this.mapearAutorBackend(author));
        this.filtrarAutores();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los autores: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      }
    });
  }

  private mapearAutorBackend(author: any): Autor {
    return {
      id: author.id || 0,
      nombre: author.name || author.nombre || 'Sin nombre',
      nacionalidad: author.nationality || author.nacionalidad || 'No especificada',
      biografia: author.biography || author.biografia || '',
      imageUrl: author.imageUrl || author.imge_url || author.avatar || 'assets/default-avatar.png'
    };
  }

  private mapearParaBackend(autor: any): any {
    return {
      name: autor.nombre || '',
      nationality: autor.nacionalidad || '',
      biography: autor.biografia || ''
    };
  }

  filtrarAutores() {
    let filtered = this.autores.filter(autor => {
      const coincideBusqueda = !this.terminoBusqueda || 
        autor.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        autor.nacionalidad.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      return coincideBusqueda;
    });

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

  contarAutores(): number {
    return this.autores.length;
  }

  contarAutoresNuevos(): number {
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    return this.autores.filter(autor => {
      const fechaCreacion = new Date((autor as any).createdAt || (autor as any).fechaCreacion || new Date());
      return fechaCreacion >= unaSemanaAtras;
    }).length;
  }

  contarPaisesUnicos(): number {
    const paises = new Set(this.autores.map(autor => autor.nacionalidad));
    return paises.size;
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.autoresFiltrados.length / this.autoresPorPagina);
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

  seleccionarAutor(autor: Autor) {
    this.autorSeleccionado = autor;
  }

  abrirModalNuevoAutor() {
    this.autorEditando = null;
    this.nuevoAutor = {
      nombre: '',
      nacionalidad: '',
      biografia: ''
    };
    this.mostrarModal = true;
    this.error = '';
  }

  editarAutor(autor: Autor) {
    this.autorEditando = autor;
    this.nuevoAutor = { 
      ...autor
    };
    this.mostrarModal = true;
    this.error = '';
  }

  cerrarModal() {
    if (this.guardando) {
      return;
    }
    
    this.mostrarModal = false;
    this.autorEditando = null;
    this.nuevoAutor = {
      nombre: '',
      nacionalidad: '',
      biografia: ''
    };
    this.error = '';
  }

  abrirModalConfirmacionEliminar(autor: Autor) {
    this.autorAEliminar = autor;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion = false;
    this.autorAEliminar = null;
  }

  confirmarEliminarAutor() {
    if (!this.autorAEliminar) return;

    this.authorsService.deleteAuthor(this.autorAEliminar.id).subscribe({
      next: () => {
        this.autores = this.autores.filter(a => a.id !== this.autorAEliminar!.id);
        this.filtrarAutores();
        this.cerrarModalConfirmacion();
      },
      error: (err) => {
        this.error = 'Error al eliminar el autor: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cerrarModalConfirmacion();
        console.error('Error deleting author:', err);
      }
    });
  }

  guardarAutor() {
    this.error = '';

    if (!this.nuevoAutor.nombre || !this.nuevoAutor.nacionalidad) {
      this.error = 'Nombre y nacionalidad son obligatorios';
      return;
    }

    this.guardando = true;

    const autorParaBackend = this.mapearParaBackend(this.nuevoAutor);
    
    if (this.autorEditando) {
      this.authorsService.updateAuthor(this.autorEditando.id, autorParaBackend).subscribe({
        next: (author) => {
          const autorActualizado = this.mapearAutorBackend(author);
          const index = this.autores.findIndex(a => a.id === this.autorEditando!.id);
          if (index !== -1) {
            this.autores[index] = autorActualizado;
          }
          this.filtrarAutores();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al actualizar el autor: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error updating author:', err);
        }
      });
    } else {
      this.authorsService.createAuthor(autorParaBackend).subscribe({
        next: (author) => {
          const nuevoAutor = this.mapearAutorBackend(author);
          this.autores.push(nuevoAutor);
          this.filtrarAutores();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al crear el autor: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error creating author:', err);
        }
      });
    }
  }

  eliminarAutor(autor: Autor) {
    this.abrirModalConfirmacionEliminar(autor);
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

  // Helper para formatear biografía
  formatearBiografia(biografia: string): string {
    if (!biografia) return 'Sin biografía disponible';
    return biografia.length > 100 ? biografia.substring(0, 100) + '...' : biografia;
  }
}