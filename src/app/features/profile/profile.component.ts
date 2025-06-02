import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditingProfile = false;
  isChangingPassword = false;
  isLoading = false;
  profileUpdateSuccess = false;
  passwordUpdateSuccess = false;
  errorMessage = '';

  private authSubscription: Subscription = new Subscription();

  // Profile sections
  profileSections = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: 'user',
      description: 'Update your basic information',
    },
    {
      id: 'contact',
      title: 'Contact Details',
      icon: 'mail',
      description: 'Manage your contact information',
    },
    {
      id: 'security',
      title: 'Security',
      icon: 'shield',
      description: 'Change password and security settings',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: 'settings',
      description: 'Customize your experience',
    },
  ];

  activeSection = 'personal';

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      location: [''],
      bio: ['', [Validators.maxLength(500)]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      linkedin: [''],
      github: [''],
      twitter: [''],
    });

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
    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserProfile();
        }
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  setActiveSection(sectionId: string) {
    this.activeSection = sectionId;
    this.isEditingProfile = false;
    this.isChangingPassword = false;
    this.clearMessages();
  }

  loadUserProfile() {
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        location: this.currentUser.location || '',
        bio: this.currentUser.bio || '',
        website: this.currentUser.website || '',
        linkedin: this.currentUser.linkedin || '',
        github: this.currentUser.github || '',
        twitter: this.currentUser.twitter || '',
      });
    }
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      this.loadUserProfile(); // Reset form if canceling
    }
    this.clearMessages();
  }

  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
    this.clearMessages();
  }

  onProfileSubmit() {
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const updatedProfile = {
        ...this.currentUser,
        ...this.profileForm.value,
      };

      // Simulate API call - replace with actual service call
      setTimeout(() => {
        // Update the current user in auth service
        this.authService.updateUserProfile(updatedProfile);
        this.isLoading = false;
        this.isEditingProfile = false;
        this.profileUpdateSuccess = true;

        setTimeout(() => {
          this.profileUpdateSuccess = false;
        }, 3000);
      }, 1000);
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
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
    this.profileUpdateSuccess = false;
    this.passwordUpdateSuccess = false;
    this.errorMessage = '';
  }

  getFieldError(
    fieldName: string,
    formGroup: FormGroup = this.profileForm
  ): string {
    const field = formGroup.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      if (field.errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} must be less than ${
          field.errors['maxlength'].requiredLength
        } characters`;
      if (field.errors['pattern']) return `Please enter a valid ${fieldName}`;
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
    };
    return labels[fieldName] || fieldName;
  }

  getUserInitials(): string {
    if (this.currentUser) {
      const first = this.currentUser.firstName?.charAt(0) || '';
      const last = this.currentUser.lastName?.charAt(0) || '';
      return (first + last).toUpperCase();
    }
    return 'U';
  }

  getUserFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName || ''} ${
        this.currentUser.lastName || ''
      }`.trim();
    }
    return 'User';
  }

  getRoleDisplayName(): string {
    if (this.currentUser?.role === 'job-seeker') {
      return 'Job Seeker';
    }
    if (this.currentUser?.role) {
      return (
        this.currentUser.role.charAt(0).toUpperCase() +
        this.currentUser.role.slice(1)
      );
    }
    return 'User';
  }
}
