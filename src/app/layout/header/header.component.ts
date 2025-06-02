import { Component, OnInit, Renderer2, Inject, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDarkMode = false;
  searchQuery = '';
  isSearchOpen = false;
  isLoggedIn = false;
  currentUser: User | null = null;
  private authSubscription: Subscription = new Subscription();

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.updateTheme();

    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      // Focus the search input after the popup opens
      setTimeout(() => {
        const searchInput = document.querySelector(
          '.mobile-search-input'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private updateTheme() {
    if (this.isDarkMode) {
      this.renderer.addClass(this.document.documentElement, 'dark');
    } else {
      this.renderer.removeClass(this.document.documentElement, 'dark');
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement search functionality here
    }
  }

  onSignin() {
    // Navigate to signin page
    window.location.href = '/auth/signin';
  }
  
  onSignup() {
    // Navigate to signup page
    window.location.href = '/auth/signup';
  }

  onLogout() {
    this.authService.logout();
  }

  onProfile() {
    // Navigate to profile
    console.log('Profile clicked');
  }
}
