import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';
import { ThemeService } from './core/services/theme.service';
import { ScrollService } from './core/services/scroll.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ScrollToTopComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'job-board';

  constructor(
    private themeService: ThemeService,
    private scrollService: ScrollService
  ) {}

  ngOnInit() {
    // Initialize theme service to ensure theme is applied on app startup
    // The theme service will automatically load the saved theme from localStorage
    // Initialize scroll service to handle scroll-to-top on route changes
    // The scroll service will automatically listen to router events
  }
}
