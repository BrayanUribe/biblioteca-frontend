import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookService } from '../../services/book/book';
import { FavoriteService } from '../../services/favorite/favorite';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-amber-200">
        <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
          Buscar Libros
        </h1>

        <div class="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="search()"
            placeholder="Buscar por titulo..."
            class="flex-1 px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50" />
          <input
            type="text"
            [(ngModel)]="genreFilter"
            (keyup.enter)="search()"
            placeholder="Filtrar por genero..."
            class="flex-1 px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50" />
          <button (click)="search()"
            class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
            Buscar
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p class="text-amber-700">Buscando libros...</p>
      </div>

      <div *ngIf="!loading && books.length === 0 && searched" class="text-center py-12">
        <div class="text-6xl mb-4 opacity-50">📚</div>
        <h3 class="text-xl font-semibold text-amber-900 mb-2">No se encontraron libros</h3>
        <p class="text-amber-700">Intenta con otros terminos de busqueda</p>
      </div>

      <div *ngIf="!loading && books.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let book of books" class="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
          <div class="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
            <img *ngIf="book.imageUrl" [src]="book.imageUrl" [alt]="book.title"
              class="w-full h-full object-cover" (error)="book.imageUrl = null" />
            <span *ngIf="!book.imageUrl" class="text-5xl">📖</span>
          </div>
          <div class="p-4">
            <h3 class="font-bold text-amber-900 mb-1 line-clamp-2">{{ book.title }}</h3>
            <p class="text-amber-700 text-sm mb-2">{{ book.authorDTO?.name }}</p>
            <p class="text-amber-600 text-xs mb-3">{{ book.genre }} - {{ book.publicationYear }}</p>
            <div class="flex justify-between items-center">
              <span [class]="book.available ? 'text-green-600 text-sm font-medium' : 'text-red-600 text-sm font-medium'">
                {{ book.available ? 'Disponible' : 'No disponible' }}
              </span>
              <button (click)="toggleFavorite(book.id)"
                class="text-2xl transition-transform hover:scale-125"
                [class]="isFavorited(book.id) ? 'text-red-500' : 'text-gray-300'">
                {{ isFavorited(book.id) ? '❤️' : '🤍' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SearchComponent implements OnInit {
  private bookService = inject(BookService);
  private favoriteService = inject(FavoriteService);

  searchQuery = '';
  genreFilter = '';
  books: any[] = [];
  favoritedIds = new Set<number>();
  loading = false;
  searched = false;

  ngOnInit() {
    this.loadAllBooks();
    this.loadFavorites();
  }

  loadAllBooks() {
    this.loading = true;
    this.bookService.getBooks().subscribe({
      next: (books) => { this.books = books; this.loading = false; this.searched = true; },
      error: () => { this.loading = false; this.searched = true; }
    });
  }

  loadFavorites() {
    this.favoriteService.getUserFavorites().subscribe({
      next: (favs) => { favs.forEach((f: any) => this.favoritedIds.add(f.id)); }
    });
  }

  search() {
    this.loading = true;
    this.searched = true;
    this.bookService.searchBooks(this.searchQuery, this.genreFilter).subscribe({
      next: (books) => { this.books = books; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggleFavorite(bookId: number) {
    this.favoriteService.toggleFavorite(bookId).subscribe({
      next: (res: any) => {
        if (res.favorited) { this.favoritedIds.add(bookId); }
        else { this.favoritedIds.delete(bookId); }
      }
    });
  }

  isFavorited(bookId: number): boolean {
    return this.favoritedIds.has(bookId);
  }
}
