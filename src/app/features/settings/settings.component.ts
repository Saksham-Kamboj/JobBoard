import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  currentUser: User | null = null;
  private authSubscription: Subscription = new Subscription();

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
    private themeService: ThemeService
  ) {}

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

  changePassword() {
    // Navigate to change password page or open modal
    console.log('Change password clicked');
  }
}
