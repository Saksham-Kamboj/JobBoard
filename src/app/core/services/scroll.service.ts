import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor(private router: Router) {
    // Listen to route changes and scroll to top
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scrollToTop();
      });
  }

  /**
   * Scroll to the top of the page smoothly
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Scroll to the top of the page instantly
   */
  scrollToTopInstant(): void {
    window.scrollTo(0, 0);
  }

  /**
   * Scroll to a specific element by ID
   */
  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  /**
   * Scroll to a specific position
   */
  scrollToPosition(x: number, y: number): void {
    window.scrollTo({
      top: y,
      left: x,
      behavior: 'smooth'
    });
  }

  /**
   * Get current scroll position
   */
  getCurrentScrollPosition(): { x: number; y: number } {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  /**
   * Check if user has scrolled past a certain point
   */
  hasScrolledPast(threshold: number): boolean {
    return window.pageYOffset > threshold;
  }
}
