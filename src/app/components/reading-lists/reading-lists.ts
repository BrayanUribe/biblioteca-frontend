import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReadingListService, ReadingList, ReadingListItem } from '../../services/reading-list/reading-list';
import { BookService, BookDTO } from '../../services/book/book';

@Component({
  selector: 'app-reading-lists',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-6">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Mis Listas de Lectura
          </h1>
          <p class="text-amber-700 mt-2">Organiza los libros que quieres leer</p>
        </div>
        <button (click)="showCreateModal = true"
          class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap">
          + Nueva Lista
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p class="text-amber-700">Cargando listas...</p>
      </div>

      <div *ngIf="errorMsg" class="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center">
        <div class="text-4xl mb-2">⚠️</div>
        <p class="text-red-600 font-semibold">{{ errorMsg }}</p>
        <button (click)="loadLists()" class="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all">Reintentar</button>
      </div>

      <div *ngIf="!loading && lists.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4 opacity-50">📚</div>
        <h3 class="text-xl font-semibold text-amber-900 mb-2">No tienes listas todavia</h3>
        <p class="text-amber-700 mb-4">Crea tu primera lista para organizar tus libros</p>
        <button (click)="showCreateModal = true"
          class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          Crear Lista
        </button>
      </div>

      <div *ngIf="!loading && lists.length > 0" class="space-y-6">
        <div *ngFor="let list of lists" class="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden hover:shadow-xl transition-all">
          
          <div class="p-6">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-bold text-amber-900">{{ list.name }}</h3>
                <p *ngIf="list.description" class="text-amber-600 text-sm mt-1">{{ list.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="openAddBookModal(list)"
                  class="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-lg transition-all" title="Agregar libro">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                <button (click)="deleteList(list.id)"
                  class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all" title="Eliminar lista">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            <div *ngIf="!list.items || list.items.length === 0" class="text-center py-6 text-amber-500">
              <p class="text-sm">Vacia - presiona + para agregar libros</p>
            </div>

            <div *ngIf="list.items && list.items.length > 0" class="space-y-3 mt-4">
              <div *ngFor="let item of list.items" class="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div class="w-10 h-10 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img *ngIf="item.book?.imageUrl" [src]="item.book.imageUrl" class="w-full h-full object-cover rounded-lg" />
                  <span *ngIf="!item.book?.imageUrl" class="text-lg">📖</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-amber-900 text-sm truncate">{{ item.book?.title || 'Libro' }}</p>
                  <p class="text-amber-600 text-xs">{{ item.book?.authorDTO?.name || item.book?.author?.name || '' }}</p>
                </div>
                <select [ngModel]="item.status" (ngModelChange)="updateStatus(item.id, $event)"
                  class="text-xs border border-amber-200 rounded-lg px-2 py-1 bg-white text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer">
                  <option value="WANT_TO_READ">Quiero leer</option>
                  <option value="READING">Leyendo</option>
                  <option value="COMPLETED">Completado</option>
                </select>
                <button (click)="removeBook(item.id)"
                  class="text-red-400 hover:text-red-600 p-1 rounded transition-colors" title="Quitar">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <h2 class="text-xl font-bold text-amber-900 mb-4">Nueva Lista de Lectura</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-amber-800 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="newListName" placeholder="Ej: Quiero leer"
                class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-amber-800 mb-1">Descripcion (opcional)</label>
              <textarea [(ngModel)]="newListDescription" placeholder="Describe esta lista..." rows="3"
                class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 resize-none"></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button (click)="showCreateModal = false" class="flex-1 px-4 py-3 border border-amber-300 rounded-xl text-amber-700 font-medium hover:bg-amber-50 transition-all">Cancelar</button>
            <button (click)="createList()" [disabled]="!newListName.trim()"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all">Crear</button>
          </div>
        </div>
      </div>

      <!-- Add Book Modal -->
      <div *ngIf="showAddBookModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
          <h2 class="text-xl font-bold text-amber-900 mb-4">Agregar Libro a "{{ selectedList?.name }}"</h2>
          
          <input type="text" [(ngModel)]="bookSearchQuery" (input)="filterBooks()" placeholder="Buscar libro..."
            class="w-full px-4 py-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 mb-4" />

          <div class="flex-1 overflow-y-auto space-y-2 min-h-0">
            <div *ngIf="availableBooks.length === 0" class="text-center py-6 text-amber-500">
              <p>No se encontraron libros disponibles</p>
            </div>
            <button *ngFor="let book of availableBooks" (click)="addBookToList(book.id)"
              class="w-full flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition-all text-left">
              <div class="w-10 h-10 bg-gradient-to-br from-amber-200 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <img *ngIf="book.imageUrl" [src]="book.imageUrl" class="w-full h-full object-cover rounded-lg" />
                <span *ngIf="!book.imageUrl" class="text-lg">📖</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-amber-900 text-sm truncate">{{ book.title }}</p>
                <p class="text-amber-600 text-xs">{{ book.authorDTO?.name }}</p>
              </div>
              <span class="text-amber-500 text-xs">+ Agregar</span>
            </button>
          </div>

          <div class="mt-4 pt-4 border-t border-amber-200">
            <button (click)="showAddBookModal = false" class="w-full px-4 py-3 border border-amber-300 rounded-xl text-amber-700 font-medium hover:bg-amber-50 transition-all">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReadingListsComponent implements OnInit {
  private readingListService = inject(ReadingListService);
  private bookService = inject(BookService);

  lists: ReadingList[] = [];
  allBooks: BookDTO[] = [];
  availableBooks: BookDTO[] = [];
  loading = false;
  errorMsg = '';

  showCreateModal = false;
  newListName = '';
  newListDescription = '';

  showAddBookModal = false;
  selectedList: ReadingList | null = null;
  bookSearchQuery = '';

  ngOnInit() { 
    this.loadLists(); 
    this.loadBooks();
  }

  loadLists() {
    this.loading = true;
    this.errorMsg = '';
    this.readingListService.getUserLists().subscribe({
      next: (lists) => { this.lists = lists; this.loading = false; },
      error: (err) => { this.loading = false; this.errorMsg = 'Error al cargar listas: ' + (err.error?.message || err.message || 'Error desconocido'); console.error('Reading lists error:', err); }
    });
  }

  loadBooks() {
    this.bookService.getBooks().subscribe({
      next: (books) => { this.allBooks = books; this.availableBooks = books; },
      error: () => {}
    });
  }

  createList() {
    if (!this.newListName.trim()) return;
    this.readingListService.createList(this.newListName, this.newListDescription).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.newListName = '';
        this.newListDescription = '';
        this.loadLists();
      }
    });
  }

  deleteList(id: number) {
    if (confirm('Eliminar esta lista y todos sus libros?')) {
      this.readingListService.deleteList(id).subscribe(() => this.loadLists());
    }
  }

  openAddBookModal(list: ReadingList) {
    this.selectedList = list;
    this.bookSearchQuery = '';
    this.filterBooks();
    this.showAddBookModal = true;
  }

  filterBooks() {
    const existingBookIds = new Set(
      (this.selectedList?.items || []).map(item => item.bookDTO?.id || item.book?.id)
    );
    let filtered = this.allBooks.filter(b => !existingBookIds.has(b.id));
    if (this.bookSearchQuery.trim()) {
      const q = this.bookSearchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(q) || 
        (b.authorDTO?.name || '').toLowerCase().includes(q)
      );
    }
    this.availableBooks = filtered;
  }

  addBookToList(bookId: number) {
    if (!this.selectedList) return;
    this.readingListService.addBookToList(this.selectedList.id, bookId).subscribe({
      next: () => { this.loadLists(); this.filterBooks(); }
    });
  }

  updateStatus(itemId: number, status: string) {
    this.readingListService.updateItemStatus(itemId, status).subscribe({
      next: () => this.loadLists()
    });
  }

  removeBook(itemId: number) {
    if (confirm('Quitar este libro de la lista?')) {
      this.readingListService.removeBookFromList(itemId).subscribe(() => this.loadLists());
    }
  }
}
