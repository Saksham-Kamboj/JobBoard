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
import {
  SettingsService,
  UserSettings,
  SystemSettings,
} from '../../core/services/settings.service';
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

  // Settings categories - will be dynamically set based on user role
  settingsCategories: any[] = [];

  activeCategory = 'appearance';

  // Dynamic settings data
  userSettings: UserSettings | null = null;
  systemSettings: SystemSettings | null = null;

  // Notification settings (will be populated from userSettings)
  notificationSettings = {
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
  };

  // Privacy settings (will be populated from userSettings)
  privacySettings = {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowSearchEngines: true,
  };

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private formBuilder: FormBuilder,
    private settingsService: SettingsService
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
        this.setSettingsCategories();

        // Load user settings when user is available
        if (user) {
          this.loadUserSettings(user.id);

          // Load system settings for admin users
          if (user.role === 'admin') {
            this.loadSystemSettings();
          }
        }
      })
    );

    // Subscribe to settings changes
    this.authSubscription.add(
      this.settingsService.userSettings$.subscribe((settings) => {
        if (settings) {
          this.userSettings = settings;
          this.updateLocalSettingsFromUserSettings(settings);
        }
      })
    );

    this.authSubscription.add(
      this.settingsService.systemSettings$.subscribe((settings) => {
        this.systemSettings = settings;
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  setSettingsCategories() {
    if (!this.currentUser) {
      this.settingsCategories = [];
      return;
    }

    const baseCategories = [
      {
        id: 'appearance',
        title: 'Appearance',
        icon: 'palette',
        description: 'Customize the look and feel of your interface',
      },
      {
        id: 'account',
        title: 'Account',
        icon: 'user',
        description: 'Manage your account information and security',
      },
    ];

    switch (this.currentUser.role) {
      case 'job-seeker':
        this.settingsCategories = [
          ...baseCategories,
          {
            id: 'notifications',
            title: 'Notifications',
            icon: 'bell',
            description: 'Manage job alerts and application notifications',
          },
          {
            id: 'privacy',
            title: 'Privacy & Profile',
            icon: 'shield',
            description: 'Control your profile visibility and privacy settings',
          },
        ];
        break;

      case 'company':
        this.settingsCategories = [
          ...baseCategories,
          {
            id: 'notifications',
            title: 'Notifications',
            icon: 'bell',
            description: 'Manage application and hiring notifications',
          },
          {
            id: 'company',
            title: 'Company Settings',
            icon: 'building',
            description: 'Manage company profile and hiring preferences',
          },
          {
            id: 'billing',
            title: 'Billing & Plans',
            icon: 'credit-card',
            description: 'Manage subscription and billing information',
          },
        ];
        break;

      case 'admin':
        this.settingsCategories = [
          ...baseCategories,
          {
            id: 'notifications',
            title: 'Notifications',
            icon: 'bell',
            description: 'Manage system and admin notifications',
          },
          {
            id: 'system',
            title: 'System Settings',
            icon: 'settings',
            description: 'Configure platform-wide settings',
          },
          {
            id: 'security',
            title: 'Security & Compliance',
            icon: 'shield',
            description: 'Manage security policies and compliance settings',
          },
          {
            id: 'analytics',
            title: 'Analytics & Reports',
            icon: 'bar-chart',
            description: 'View platform analytics and generate reports',
          },
        ];
        break;

      default:
        this.settingsCategories = baseCategories;
    }

    // Set default active category if current one is not available
    if (
      !this.settingsCategories.find((cat) => cat.id === this.activeCategory)
    ) {
      this.activeCategory = this.settingsCategories[0]?.id || 'appearance';
    }
  }

  setActiveCategory(categoryId: string) {
    this.activeCategory = categoryId;
  }

  // Load user settings from database
  loadUserSettings(userId: string) {
    this.settingsService.getUserSettings(userId).subscribe({
      next: (settings) => {
        this.userSettings = settings;
        this.updateLocalSettingsFromUserSettings(settings);
      },
      error: (error) => {
        console.error('Error loading user settings:', error);
      },
    });
  }

  // Load system settings from database (admin only)
  loadSystemSettings() {
    this.settingsService.getSystemSettings().subscribe({
      next: (settings) => {
        this.systemSettings = settings;
      },
      error: (error) => {
        console.error('Error loading system settings:', error);
      },
    });
  }

  // Update local settings objects from user settings
  updateLocalSettingsFromUserSettings(settings: UserSettings) {
    // Update notification settings
    this.notificationSettings = {
      emailNotifications: settings.notifications.emailNotifications,
      jobAlerts: settings.notifications.jobAlerts || false,
      applicationUpdates: settings.notifications.applicationUpdates || false,
      marketingEmails: settings.notifications.marketingEmails,
      pushNotifications: settings.notifications.pushNotifications,
    };

    // Update privacy settings if available
    if (settings.privacy) {
      this.privacySettings = {
        profileVisibility: settings.privacy.profileVisibility,
        showEmail: settings.privacy.showEmail,
        showPhone: settings.privacy.showPhone,
        allowSearchEngines: settings.privacy.allowSearchEngines,
      };
    }

    // Update theme from appearance settings
    if (
      settings.appearance.theme &&
      (settings.appearance.theme === 'light' ||
        settings.appearance.theme === 'dark')
    ) {
      this.themeService.syncThemeFromSettings(
        settings.appearance.theme as 'light' | 'dark'
      );
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();

    // Update theme in user settings database
    if (this.userSettings) {
      const newTheme = this.themeService.getThemeString();
      this.settingsService
        .updateAppearanceSettings({ theme: newTheme })
        .subscribe({
          next: (settings) => {
            console.log('Theme updated in database:', newTheme);
          },
          error: (error) => {
            console.error('Error updating theme:', error);
            // Revert theme change if database update fails
            this.themeService.toggleTheme();
          },
        });
    }
  }

  updateNotificationSetting(setting: string, value: boolean) {
    (this.notificationSettings as any)[setting] = value;

    // Save to database
    if (this.userSettings) {
      const notificationUpdate = { [setting]: value };
      this.settingsService
        .updateNotificationSettings(notificationUpdate)
        .subscribe({
          next: (settings) => {
            console.log('Notification setting updated:', setting, value);
          },
          error: (error) => {
            console.error('Error updating notification setting:', error);
            // Revert the change on error
            (this.notificationSettings as any)[setting] = !value;
          },
        });
    }
  }

  updatePrivacySetting(setting: string, value: any) {
    (this.privacySettings as any)[setting] = value;

    // Save to database
    if (this.userSettings) {
      const privacyUpdate = { [setting]: value };
      this.settingsService.updatePrivacySettings(privacyUpdate).subscribe({
        next: (settings) => {
          console.log('Privacy setting updated:', setting, value);
        },
        error: (error) => {
          console.error('Error updating privacy setting:', error);
          // Revert the change on error
          (this.privacySettings as any)[setting] =
            setting === 'profileVisibility' ? 'public' : false;
        },
      });
    }
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
