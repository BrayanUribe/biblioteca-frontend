import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users/users'; 

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password?: string;
  rol: 'administrativo' | 'bibliotecario' | 'usuario';
  fechaRegistro: Date;
  imge_url: string;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User implements OnInit {

  private userService = inject(UserService);
  
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  
  terminoBusqueda: string = '';
  filtroRol: string = '';
  
  campoOrden: string = 'nombre';
  direccionOrden: 'asc' | 'desc' = 'asc';
  
  paginaActual: number = 1;
  usuariosPorPagina: number = 10;
  totalPaginas: number = 1;
  
  mostrarModal: boolean = false;
  mostrarModalConfirmacion: boolean = false;
  usuarioEditando: Usuario | null = null;
  usuarioSeleccionado: Usuario | null = null;
  usuarioAEliminar: Usuario | null = null;
  
  cargando: boolean = false;
  guardando: boolean = false;
  error: string = '';
  
  nuevoUsuario: any = {
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario'
  };

  ngOnInit() {
    this.cargarUsuariosReales();
  }

  getRolBadgeClasses(rol: string): string {
    const baseClasses = 'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-300';
    
    switch(rol) {
      case 'administrativo':
        return `${baseClasses} bg-pink-50 text-pink-600 border-pink-200`;
      case 'bibliotecario':
        return `${baseClasses} bg-purple-50 text-purple-600 border-purple-200`;
      case 'usuario':
        return `${baseClasses} bg-blue-50 text-blue-600 border-blue-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-600 border-gray-200`;
    }
  }

  public cargarUsuariosReales() {
    this.cargando = true;
    this.error = '';
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.usuarios = users.map(user => this.mapearUsuarioBackend(user));
        this.filtrarUsuarios();
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los usuarios: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cargando = false;
      }
    });
  }

 
getSafeImageUrl(usuario: Usuario): string {
  if (!usuario.imge_url || usuario.imge_url === 'assets/default-avatar.png') {
    return 'assets/default-avatar.png';
  }
  
  if (usuario.imge_url.startsWith('http')) {
    return usuario.imge_url;
  }
  return `https://biblioteca-backend-y24p.onrender.com${usuario.imge_url.startsWith('/') ? '' : '/'}${usuario.imge_url}`;
}

private mapearUsuarioBackend(user: any): Usuario {
  return {
    id: user.id || 0,
    nombre: user.name || user.nombre || 'Sin nombre',
    email: user.email || 'Sin email',
    rol: this.mapearRolBackend(user.role || user.rol),
    fechaRegistro: new Date(user.createdAt || user.registrationDate || user.fechaRegistro || Date.now()),
    imge_url: user.imageUrl || user.imge_url || user.avatar || user.profilePicture || 'assets/default-avatar.png'
  };
}

  private mapearRolBackend(rol: any): Usuario['rol'] {
    if (!rol) return 'usuario';
    
    const rolString = String(rol).toLowerCase();
    const rolesMap: { [key: string]: Usuario['rol'] } = {
      'admin': 'administrativo',
      'administrativo': 'administrativo',
      'librarian': 'bibliotecario', 
      'bibliotecario': 'bibliotecario',
      'user': 'usuario',
      'usuario': 'usuario'
    };
    return rolesMap[rolString] || 'usuario';
  }

  private mapearParaBackend(usuario: any): any {
    const rolesMap: { [key: string]: string } = {
      'administrativo': 'ADMIN',
      'bibliotecario': 'LIBRARIAN',
      'usuario': 'USER'
    };

    const data: any = {
      name: usuario.nombre || '',
      email: usuario.email || '',
      role: rolesMap[usuario.rol] || 'USER'
    };

    if (usuario.password && usuario.password.trim() !== '') {
      data.password = usuario.password;
    }

    return data;
  }

  filtrarUsuarios() {
    let filtered = this.usuarios.filter(usuario => {
      const coincideBusqueda = !this.terminoBusqueda || 
        usuario.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        usuario.email.toLowerCase().includes(this.terminoBusqueda.toLowerCase());
      
      const coincideRol = !this.filtroRol || usuario.rol === this.filtroRol;
      
      return coincideBusqueda && coincideRol;
    });

    filtered.sort((a, b) => {
      const aValue = (a as any)[this.campoOrden];
      const bValue = (b as any)[this.campoOrden];
      
      if (aValue < bValue) return this.direccionOrden === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });

    this.usuariosFiltrados = filtered;
    this.actualizarPaginacion();
  }

  ordenarPor(campo: string) {
    if (this.campoOrden === campo) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrden = campo;
      this.direccionOrden = 'asc';
    }
    this.filtrarUsuarios();
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroRol = '';
    this.filtrarUsuarios();
  }

  contarUsuariosPorRol(rol: string): number {
    return this.usuarios.filter(u => u.rol === rol).length;
  }

  contarUsuariosNuevos(): number {
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    return this.usuarios.filter(u => u.fechaRegistro >= unaSemanaAtras).length;
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.usuariosPorPagina);
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

  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
  }

  abrirModalNuevoUsuario() {
    this.usuarioEditando = null;
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: 'usuario'
    };
    this.mostrarModal = true;
    this.error = '';
  }

  editarUsuario(usuario: Usuario) {
    this.usuarioEditando = usuario;
    this.nuevoUsuario = { 
      ...usuario,
      password: '' 
    };
    this.mostrarModal = true;
    this.error = '';
  }

  
  cerrarModal() {
    if (this.guardando) {
      return; 
    }
    
    this.mostrarModal = false;
    this.usuarioEditando = null;
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: 'usuario'
    };
    this.error = '';
  }


  abrirModalConfirmacionEliminar(usuario: Usuario) {
    this.usuarioAEliminar = usuario;
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion = false;
    this.usuarioAEliminar = null;
  }

  
  confirmarEliminarUsuario() {
    if (!this.usuarioAEliminar) return;

    this.userService.deleteUser(this.usuarioAEliminar.id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== this.usuarioAEliminar!.id);
        this.filtrarUsuarios();
        this.cerrarModalConfirmacion();
      },
      error: (err) => {
        this.error = 'Error al eliminar el usuario: ' + (err.error?.message || 'Inténtalo de nuevo');
        this.cerrarModalConfirmacion();
        console.error('Error deleting user:', err);
      }
    });
  }

  guardarUsuario() {
    this.error = '';
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) {
      this.error = 'Nombre y email son obligatorios';
      return;
    }
    if (!this.usuarioEditando && (!this.nuevoUsuario.password || this.nuevoUsuario.password.length < 6)) {
      this.error = 'La contraseña es obligatoria y debe tener al menos 6 caracteres';
      return;
    }
    this.guardando = true;
    const usuarioParaBackend = this.mapearParaBackend(this.nuevoUsuario);
    if (this.usuarioEditando) {
      this.userService.updateUser(this.usuarioEditando.id, usuarioParaBackend).subscribe({
        next: (user) => {
          const usuarioActualizado = this.mapearUsuarioBackend(user);
          const index = this.usuarios.findIndex(u => u.id === this.usuarioEditando!.id);
          if (index !== -1) {
            this.usuarios[index] = usuarioActualizado;
          }
          this.filtrarUsuarios();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al actualizar el usuario: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error updating user:', err);
        }
      });
    } else {
      this.userService.createUser(usuarioParaBackend).subscribe({
        next: (user) => {
          const nuevoUsuario = this.mapearUsuarioBackend(user);
          this.usuarios.push(nuevoUsuario);
          this.filtrarUsuarios();
          this.guardando = false;
          this.cerrarModal();
        },
        error: (err) => {
          this.error = 'Error al crear el usuario: ' + (err.error?.message || 'Inténtalo de nuevo');
          this.guardando = false;
          console.error('Error creating user:', err);
        }
      });
    }
  }


  eliminarUsuario(usuario: Usuario) {
    this.abrirModalConfirmacionEliminar(usuario);
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

  esElMismoUsuario(usuario: Usuario): boolean {
    const currentUser = this.userService.getCurrentUser();
    return !!(currentUser && currentUser.id === usuario.id);
  }

  esAdmin(): boolean {
    return this.userService.getUserRole() === 'ADMIN';
  }
}