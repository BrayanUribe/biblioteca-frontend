import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/users/users';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
changePassword() {
throw new Error('Method not implemented.');
}
  
  user: UserProfile | null = null;
  loading = false;
  errorMessage = '';
  showEditModal = false;
  showImageModal = false;
  editingUser: Partial<UserProfile> = {};
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  today = new Date();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  // 🔹 Cargar perfil desde el backend
  loadUserProfile() {
    this.loading = true;
    this.errorMessage = '';
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = {
          ...userData,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined
        };
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error cargando perfil.';
        this.loading = false;
      }
    });
  }

  // 🔹 Abrir modal de edición
  openEditModal() {
    if (this.user) {
      this.editingUser = { ...this.user };
    }
    this.showEditModal = true;
    this.errorMessage = '';
  }


  closeEditModal() {
    this.showEditModal = false;
    this.editingUser = {};
    this.errorMessage = '';
  }


saveProfile() {
  if (!this.editingUser.name?.trim() || !this.editingUser.email?.trim()) {
    this.errorMessage = 'Nombre y email son requeridos';
    return;
  }
  const userId = this.user?.id;
  if (!userId || !this.user) {
    this.errorMessage = 'No se pudo identificar el usuario para actualizar.';
    return;
  }
  this.loading = true;
  this.errorMessage = '';
  console.log('📝 Actualizando usuario en backend:', this.editingUser);
  const userDTO = {
    name: this.editingUser.name!,
    email: this.editingUser.email!,
    role: this.editingUser.role || this.user.role!,
    phone: this.editingUser.phone || '',
    address: this.editingUser.address || '',
    imageUrl: this.editingUser.imageUrl || this.user.imageUrl || ''
  };
  this.userService.updateUser(userId, userDTO).subscribe({
    next: (updatedUser) => {
      console.log('✅ Usuario actualizado en backend:', updatedUser);
      this.user = {
        ...this.user!,
        ...updatedUser,
        id: userId,
        role: updatedUser.role || this.user!.role!
      } as UserProfile;
      if (this.userService.getCurrentUser()) {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      this.closeEditModal();
      this.loading = false;
    },
    error: (error) => {
      console.error('❌ Error actualizando usuario:', error);
      this.errorMessage = 'No se pudo actualizar el perfil.';
      this.loading = false;
    }
  });
}



  openImageModal() {
    this.showImageModal = true;
    this.imagePreview = this.user?.imageUrl || null;
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Por favor selecciona una imagen válida';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar los 5MB';
        return;
      }

      this.selectedImage = file;
      this.errorMessage = '';
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveImage() {
    if (!this.selectedImage) {
      this.errorMessage = 'Por favor selecciona una imagen';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    // Aquí iría la lógica real de Cloudinary o backend
    setTimeout(() => {
      if (this.user && this.imagePreview) {
        this.user.imageUrl = this.imagePreview;
        console.log('🖼️ Imagen actualizada localmente:', this.selectedImage);
      }
      this.closeImageModal();
      this.loading = false;
    }, 1000);
  }

  // 🔹 Cerrar sesión
  logout() {
    this.userService.logout().subscribe({
      next: () => window.location.href = '/login',
      error: () => {
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  }

  // 🔹 Helpers visuales
  getInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleBadgeClass(role: string): string {
    const baseClasses = 'inline-block px-3 py-1 rounded-full font-medium text-sm transition-all';
    switch (role?.toUpperCase()) {
      case 'ADMIN': return `${baseClasses} bg-red-100 text-red-700 border border-red-200`;
      case 'PREMIUM': return `${baseClasses} bg-purple-100 text-purple-700 border border-purple-200`;
      case 'EDITOR': return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'USER': return `${baseClasses} bg-green-100 text-green-700 border border-green-200`;
      default: return `${baseClasses} bg-amber-100 text-amber-700 border border-amber-200`;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }
}
