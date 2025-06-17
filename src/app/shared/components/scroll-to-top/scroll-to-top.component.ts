import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-scroll-to-top',
  imports: [CommonModule],
  templateUrl: './scroll-to-top.component.html',
  styleUrl: './scroll-to-top.component.css',
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  isVisible = false;
  isScrolling = false;
  scrollDirection: 'up' | 'down' = 'down'; // Made public for template access
  private scrollThreshold = 200; // Show button after scrolling 200px (reduced for better UX)
  private scrollTimer: any;
  private lastScrollTop = 0;

  constructor(private scrollService: ScrollService) {}

  ngOnInit(): void {
    this.checkScrollPosition();
  }

  ngOnDestroy(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkScrollPosition();
    this.detectScrollDirection();
    this.handleScrolling();
  }

  private checkScrollPosition(): void {
    const currentScroll =
      window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = currentScroll > this.scrollThreshold;

    // Only show if scrolling down or if we're far enough down
    this.isVisible =
      shouldShow &&
      (this.scrollDirection === 'up' ||
        currentScroll > this.scrollThreshold * 2);
  }

  private detectScrollDirection(): void {
    const currentScrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > this.lastScrollTop) {
      this.scrollDirection = 'down';
    } else if (currentScrollTop < this.lastScrollTop) {
      this.scrollDirection = 'up';
    }

    this.lastScrollTop = currentScrollTop;
  }

  private handleScrolling(): void {
    this.isScrolling = true;

    // Clear existing timer
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }

    // Set timer to detect when scrolling stops
    this.scrollTimer = setTimeout(() => {
      this.isScrolling = false;
    }, 150);
  }

  scrollToTop(): void {
    // Add a small delay to prevent conflicts with other scroll events
    setTimeout(() => {
      this.scrollService.scrollToTop();
      // Hide button temporarily after clicking
      this.isVisible = false;
      setTimeout(() => {
        this.checkScrollPosition();
      }, 1000);
    }, 50);
  }
}
