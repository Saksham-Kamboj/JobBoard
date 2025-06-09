import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  currentUser: User | null = null;
  private authSubscription: Subscription = new Subscription();

  // Password change functionality
  passwordForm: FormGroup;
  isChangingPassword = false;
  isLoading = false;
  passwordUpdateSuccess = false;
  errorMessage = '';

  // Settings categories
  settingsCategories = [
    {
      id: 'appearance',
      title: 'Appearance',
      icon: 'palette',
      description: 'Customize the look and feel of your interface',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell',
      description: 'Manage your notification preferences',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'shield',
      description: 'Control your privacy and security settings',
    },
    {
      id: 'account',
      title: 'Account',
      icon: 'user',
      description: 'Manage your account information',
    },
  ];

  activeCategory = 'appearance';

  // Notification settings
  notificationSettings = {
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
  };

  // Privacy settings
  privacySettings = {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowSearchEngines: true,
  };

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private formBuilder: FormBuilder
  ) {
    // Initialize password form
    this.passwordForm = this.formBuilder.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    // Subscribe to theme changes
    this.authSubscription.add(
      this.themeService.isDarkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark;
      })
    );

    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  setActiveCategory(categoryId: string) {
    this.activeCategory = categoryId;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  updateNotificationSetting(setting: string, value: boolean) {
    (this.notificationSettings as any)[setting] = value;
    // Here you would typically save to backend
    console.log('Updated notification setting:', setting, value);
  }

  updatePrivacySetting(setting: string, value: any) {
    (this.privacySettings as any)[setting] = value;
    // Here you would typically save to backend
    console.log('Updated privacy setting:', setting, value);
  }

  onNotificationChange(event: Event, setting: string) {
    const target = event.target as HTMLInputElement;
    this.updateNotificationSetting(setting, target.checked);
  }

  onPrivacyChange(event: Event, setting: string) {
    const target = event.target as HTMLInputElement;
    this.updatePrivacySetting(setting, target.checked);
  }

  onPrivacySelectChange(event: Event, setting: string) {
    const target = event.target as HTMLSelectElement;
    this.updatePrivacySetting(setting, target.value);
  }

  exportData() {
    // Implement data export functionality
    console.log('Exporting user data...');
  }

  deleteAccount() {
    // Implement account deletion functionality
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      console.log('Deleting account...');
    }
  }

  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
    this.clearMessages();
  }

  onPasswordSubmit() {
    if (this.passwordForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.isLoading = false;
          this.isChangingPassword = false;
          this.passwordUpdateSuccess = true;
          this.passwordForm.reset();

          setTimeout(() => {
            this.passwordUpdateSuccess = false;
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Failed to change password';

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages() {
    this.passwordUpdateSuccess = false;
    this.errorMessage = '';
  }

  getFieldError(fieldName: string): string | null {
    const field = this.passwordForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } is required`;
      }
      if (field.errors['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return null;
  }
}
