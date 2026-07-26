import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoriteService } from '../../services/favorite/favorite';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-amber-200">
        <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Mis Favoritos
        </h1>
        <p class="text-amber-700 mt-2">Libros que te gustan</p>
      </div>

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
      </div>

      <div *ngIf="!loading && favorites.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4 opacity-50">❤️</div>
        <h3 class="text-xl font-semibold text-amber-900 mb-2">No tienes favoritos aun</h3>
        <p class="text-amber-700 mb-4">Explora el catalogo y marca tus libros favoritos</p>
        <a routerLink="/books" class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold inline-block">
          Ver Catalogo
        </a>
      </div>

      <div *ngIf="!loading && favorites.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let book of favorites" class="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
          <div class="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
            <img *ngIf="book.imageUrl" [src]="book.imageUrl" [alt]="book.title"
              class="w-full h-full object-cover" (error)="book.imageUrl = null" />
            <span *ngIf="!book.imageUrl" class="text-5xl">📖</span>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-amber-900 mb-1 line-clamp-2">{{ book.title }}</h3>
            <p class="text-amber-700 text-sm mb-2">{{ book.authorDTO?.name }}</p>
            <p class="text-amber-600 text-xs mb-3">{{ book.genre }} - {{ book.publicationYear }}</p>
            <button (click)="removeFavorite(book.id)"
              class="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-all text-sm">
              Quitar de favoritos
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FavoritesComponent implements OnInit {
  private favoriteService = inject(FavoriteService);

  favorites: any[] = [];
  loading = false;

  ngOnInit() { this.loadFavorites(); }

  loadFavorites() {
    this.loading = true;
    this.favoriteService.getUserFavorites().subscribe({
      next: (favs) => { this.favorites = favs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  removeFavorite(bookId: number) {
    this.favoriteService.toggleFavorite(bookId).subscribe(() => {
      this.favorites = this.favorites.filter(b => b.id !== bookId);
    });
  }
}
