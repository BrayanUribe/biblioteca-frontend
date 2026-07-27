import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookService, BookDTO } from '../../services/book/book';
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
        <div *ngFor="let book of books"
          (click)="selectedBook = book"
          class="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
          <div class="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden">
            <img *ngIf="book.imageUrl" [src]="book.imageUrl" [alt]="book.title"
              class="w-full h-full object-cover" (error)="book.imageUrl = undefined" />
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
              <button (click)="toggleFavorite(book.id); $event.stopPropagation()"
                class="text-2xl transition-transform hover:scale-125"
                [class]="isFavorited(book.id) ? 'text-red-500' : 'text-gray-300'">
                {{ isFavorited(book.id) ? '❤️' : '🤍' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Detalle -->
      <div *ngIf="selectedBook"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
        (click)="selectedBook = null">
        <div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-amber-200/40"
          (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center p-6 border-b border-amber-200/30 bg-amber-50/30">
            <h2 class="text-xl font-semibold text-amber-900">Detalles del Libro</h2>
            <button class="w-8 h-8 rounded-full flex items-center justify-center text-amber-700/70 hover:bg-orange-100 hover:text-amber-900 transition-all"
              (click)="selectedBook = null">x</button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div class="flex flex-col lg:flex-row gap-8">
              <div class="flex-shrink-0">
                <div class="w-64 h-80 rounded-2xl overflow-hidden shadow-lg border border-orange-200/30">
                  <img [src]="selectedBook.imageUrl || '/default-book.png'" [alt]="selectedBook.title"
                    class="w-full h-full object-cover" />
                </div>
              </div>
              <div class="flex-1 space-y-6">
                <div>
                  <h1 class="text-3xl font-bold text-amber-900 mb-2">{{ selectedBook.title }}</h1>
                  <p class="text-xl text-amber-700/70">por {{ selectedBook.authorDTO?.name || 'Autor desconocido' }}</p>
                </div>
                <div class="flex flex-wrap gap-3">
                  <span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">{{ selectedBook.genre }}</span>
                  <span [class]="selectedBook.available ? 'bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium' : 'bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium'">
                    {{ selectedBook.available ? 'Disponible' : 'No disponible' }}
                  </span>
                  <span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">{{ selectedBook.publicationYear }}</span>
                </div>
                <div>
                  <h3 class="font-semibold text-amber-900 mb-2">ISBN</h3>
                  <p class="text-amber-700 font-mono">{{ selectedBook.isbn }}</p>
                </div>
                <div>
                  <h3 class="font-semibold text-amber-900 mb-2">Descripcion</h3>
                  <p class="text-amber-700/80 leading-relaxed">{{ selectedBook.description || 'Sin descripcion disponible' }}</p>
                </div>
                <div>
                  <h3 class="font-semibold text-amber-900 mb-2">Stock</h3>
                  <p class="text-amber-700">{{ selectedBook.stock }} ejemplares</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end p-6 border-t border-amber-200/30 bg-amber-50/30">
            <button class="bg-orange-100 text-amber-900 px-6 py-3 rounded-xl font-medium border border-orange-200 hover:bg-orange-200 transition-all"
              (click)="selectedBook = null">Cerrar</button>
            <button (click)="toggleFavorite(selectedBook.id)"
              class="px-6 py-3 rounded-xl font-semibold transition-all"
              [class]="isFavorited(selectedBook.id) ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'">
              {{ isFavorited(selectedBook.id) ? '❤️ Quitar de Favoritos' : '🤍 Agregar a Favoritos' }}
            </button>
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
  books: BookDTO[] = [];
  selectedBook: BookDTO | null = null;
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
