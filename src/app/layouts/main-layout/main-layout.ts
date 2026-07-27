import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { HeaderComponent } from '../../components/header/header';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { FooterComponent } from '../../components/footer/footer';
import { SidebarService } from '../../services/sidebar/sidebar';
import { PreferencesService } from '../../services/preferences/preferences';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,     
    RouterModule,     
    HeaderComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayout implements OnInit {
  isSidebarOpen = true;
  private sidebarService = inject(SidebarService);
  private preferencesService = inject(PreferencesService);

  ngOnInit() {
    this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isSidebarOpen = isOpen;
    });
    this.preferencesService.init();
  }
}



