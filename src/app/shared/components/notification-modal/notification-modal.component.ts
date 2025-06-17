import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class NotificationModalComponent implements OnDestroy {
  @Input() set notification(value: NotificationData | null) {
    this._notification = value;
    if (value && this.show && !this.isTimerRunning) {
      this.startAutoCloseTimer();
    }
  }
  get notification(): NotificationData | null {
    return this._notification;
  }
  private _notification: NotificationData | null = null;

  @Input() set show(value: boolean) {
    this._show = value;
    if (value && this._notification && !this.isTimerRunning) {
      this.canClose = false;
      this.isModalLocked = true;

      // Allow closing after 1 second to prevent accidental immediate closure
      setTimeout(() => {
        this.canClose = true;
        this.isModalLocked = false;
      }, 1000);

      this.startAutoCloseTimer();
    } else if (!value) {
      this.clearAutoCloseTimer();
      this.canClose = false;
      this.isModalLocked = false;
    }
  }
  get show(): boolean {
    return this._show;
  }
  private _show: boolean = false;

  @Output() close = new EventEmitter<void>();

  private autoCloseTimer: any;
  private canClose: boolean = false;
  public isTimerRunning: boolean = false; // Made public for template access
  private isModalLocked: boolean = false;
  public remainingTime: number = 0; // For debug display
  private countdownTimer: any;

  // Getter methods for template use
  get notificationType(): string {
    return this.notification?.type || 'info';
  }

  get notificationTitle(): string {
    return this.notification?.title || '';
  }

  get notificationMessage(): string {
    return this.notification?.message || '';
  }

  get notificationDuration(): number {
    return this.notification?.duration || 3000;
  }

  get shouldShowAutoClose(): boolean {
    return this.notification?.autoClose !== false;
  }

  constructor(private ngZone: NgZone) {}

  ngOnDestroy() {
    this.clearAutoCloseTimer();
  }

  private startAutoCloseTimer() {
    // Prevent multiple timers from running
    if (this.isTimerRunning) {
      return;
    }

    // Clear any existing timer first
    this.clearAutoCloseTimer();

    // Only start timer if auto-close is enabled
    if (!this.notification || this.notification.autoClose === false) {
      return;
    }

    const duration = this.notification.duration || 3000;

    this.isTimerRunning = true;
    this.remainingTime = Math.ceil(duration / 1000);

    // Start countdown for debug display
    this.startCountdown();

    // Run timer outside Angular zone to prevent interference from change detection
    this.ngZone.runOutsideAngular(() => {
      this.autoCloseTimer = setTimeout(() => {
        // Run the close operation back inside Angular zone
        this.ngZone.run(() => {
          this.closeModal();
        });
      }, duration);
    });
  }

  private startCountdown() {
    this.countdownTimer = setInterval(() => {
      this.remainingTime--;
      if (this.remainingTime <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.remainingTime = 0;
  }

  private clearAutoCloseTimer() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.clearCountdown();
    this.isTimerRunning = false;
  }

  onOverlayClick(event: Event) {
    // Only close if clicking directly on the overlay, not on child elements, and after 1 second
    if (
      event.target === event.currentTarget &&
      this.canClose &&
      !this.isModalLocked
    ) {
      this.closeModal();
    }
  }

  closeModal() {
    // Prevent multiple close calls
    if (!this.show) {
      return;
    }

    this.clearAutoCloseTimer();
    this.close.emit();
  }
}
