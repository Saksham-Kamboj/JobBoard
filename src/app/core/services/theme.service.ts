import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);

  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check for saved theme preference or default to light mode
    const savedTheme = sessionStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    // Set the initial theme state
    this.isDarkModeSubject.next(isDark);

    // Apply theme immediately to avoid flash
    this.applyThemeToDOM(isDark);

    // Save to sessionStorage if not already saved
    if (!savedTheme) {
      sessionStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  private applyThemeToDOM(isDark: boolean): void {
    if (isDark) {
      this.renderer.addClass(this.document.documentElement, 'dark');
    } else {
      this.renderer.removeClass(this.document.documentElement, 'dark');
    }
  }

  setTheme(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    this.applyThemeToDOM(isDark);
    sessionStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    const currentTheme = this.isDarkModeSubject.value;
    this.setTheme(!currentTheme);
  }

  getCurrentTheme(): boolean {
    return this.isDarkModeSubject.value;
  }
}
