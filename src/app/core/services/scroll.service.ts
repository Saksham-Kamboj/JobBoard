import { Injectable } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  private scrollPositions = new Map<string, ScrollPosition>();
  private currentUrl: string = '';
  private isBackNavigation: boolean = false;
  private navigationHistory: string[] = [];
  private lastNavigationType: 'push' | 'pop' | 'replace' = 'push';

  constructor(private router: Router, private location: Location) {
    this.initializeScrollManagement();
    this.setupPopstateListener();
  }

  private setupPopstateListener(): void {
    // Listen to browser back/forward button events
    window.addEventListener('popstate', (event) => {
      this.lastNavigationType = 'pop';
      this.isBackNavigation = true;
    });
  }

  private initializeScrollManagement(): void {
    // Listen to navigation start to detect back navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        // Store current scroll position before navigation
        if (this.currentUrl) {
          this.storeScrollPosition(this.currentUrl);
        }

        // Detect if this is a back navigation
        this.isBackNavigation =
          this.isBackwardNavigation(event.url) ||
          this.lastNavigationType === 'pop';
      });

    // Listen to navigation end to handle scroll restoration
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleScrollRestoration(event.url);
        this.currentUrl = event.url;
        this.updateNavigationHistory(event.url);

        // Reset navigation type for next navigation
        this.lastNavigationType = 'push';
      });

    // Store scroll position when user scrolls
    window.addEventListener(
      'scroll',
      () => {
        if (this.currentUrl) {
          this.storeScrollPosition(this.currentUrl);
        }
      },
      { passive: true }
    );

    // Store scroll position before page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentUrl) {
        this.storeScrollPosition(this.currentUrl);
      }
    });
  }

  private isBackwardNavigation(url: string): boolean {
    // Check if the URL exists in our navigation history
    const urlIndex = this.navigationHistory.indexOf(url);
    return urlIndex !== -1 && urlIndex < this.navigationHistory.length - 1;
  }

  private updateNavigationHistory(url: string): void {
    const existingIndex = this.navigationHistory.indexOf(url);

    if (existingIndex !== -1) {
      // Remove the URL and all URLs after it (back navigation)
      this.navigationHistory = this.navigationHistory.slice(
        0,
        existingIndex + 1
      );
    } else {
      // Add new URL to history (forward navigation)
      this.navigationHistory.push(url);

      // Limit history size to prevent memory issues
      if (this.navigationHistory.length > 50) {
        this.navigationHistory = this.navigationHistory.slice(-25);
      }
    }
  }

  private handleScrollRestoration(url: string): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (
        this.scrollRestorationEnabled &&
        this.isBackNavigation &&
        this.hasStoredPosition(url)
      ) {
        // Restore previous scroll position for back navigation
        this.restoreScrollPosition(url);
      } else {
        // Scroll to top for new navigation
        this.scrollToTopInstant();
      }
      this.isBackNavigation = false;
    }, 0);
  }

  private storeScrollPosition(url: string): void {
    const position: ScrollPosition = {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop,
      timestamp: Date.now(),
    };

    this.scrollPositions.set(url, position);

    // Also store in sessionStorage for persistence across page reloads
    try {
      sessionStorage.setItem(`scroll_${url}`, JSON.stringify(position));
    } catch (e) {
      // Handle storage quota exceeded
      console.warn('Failed to store scroll position in sessionStorage');
    }
  }

  private restoreScrollPosition(url: string): void {
    let position = this.scrollPositions.get(url);

    // Try to get from sessionStorage if not in memory
    if (!position) {
      try {
        const stored = sessionStorage.getItem(`scroll_${url}`);
        if (stored) {
          position = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to parse stored scroll position');
      }
    }

    if (position) {
      window.scrollTo(position.x, position.y);
    }
  }

  private hasStoredPosition(url: string): boolean {
    return (
      this.scrollPositions.has(url) ||
      sessionStorage.getItem(`scroll_${url}`) !== null
    );
  }

  /**
   * Scroll to the top of the page smoothly
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Scroll to the top of the page instantly
   */
  scrollToTopInstant(): void {
    window.scrollTo(0, 0);
  }

  /**
   * Force scroll to top (useful for programmatic navigation)
   */
  forceScrollToTop(): void {
    this.scrollToTopInstant();
    // Clear any stored position for current URL to prevent restoration
    if (this.currentUrl) {
      this.scrollPositions.delete(this.currentUrl);
      sessionStorage.removeItem(`scroll_${this.currentUrl}`);
    }
  }

  /**
   * Manually store current scroll position
   */
  storeCurrentPosition(): void {
    if (this.currentUrl) {
      this.storeScrollPosition(this.currentUrl);
    }
  }

  /**
   * Clear all stored scroll positions
   */
  clearAllPositions(): void {
    this.scrollPositions.clear();
    this.navigationHistory = [];

    // Clear from sessionStorage
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith('scroll_')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear stored position for a specific URL
   */
  clearPositionForUrl(url: string): void {
    this.scrollPositions.delete(url);
    sessionStorage.removeItem(`scroll_${url}`);
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
        inline: 'nearest',
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
      behavior: 'smooth',
    });
  }

  /**
   * Get current scroll position
   */
  getCurrentScrollPosition(): { x: number; y: number } {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop,
    };
  }

  /**
   * Check if user has scrolled past a certain point
   */
  hasScrolledPast(threshold: number): boolean {
    return window.pageYOffset > threshold;
  }

  /**
   * Get debug information about stored scroll positions
   */
  getDebugInfo(): any {
    return {
      currentUrl: this.currentUrl,
      navigationHistory: [...this.navigationHistory],
      storedPositions: Array.from(this.scrollPositions.entries()).map(
        ([url, pos]) => ({
          url,
          position: pos,
          age: Date.now() - pos.timestamp,
        })
      ),
      isBackNavigation: this.isBackNavigation,
      lastNavigationType: this.lastNavigationType,
    };
  }

  /**
   * Enable/disable scroll restoration (useful for specific pages)
   */
  private scrollRestorationEnabled: boolean = true;

  enableScrollRestoration(): void {
    this.scrollRestorationEnabled = true;
  }

  disableScrollRestoration(): void {
    this.scrollRestorationEnabled = false;
  }

  /**
   * Check if scroll restoration is enabled
   */
  isScrollRestorationEnabled(): boolean {
    return this.scrollRestorationEnabled;
  }
}
