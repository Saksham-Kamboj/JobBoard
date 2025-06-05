import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import {
  UserProfileService,
  UserProfile,
} from '../../core/services/user-profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;
  profileForm: FormGroup;
  professionalForm: FormGroup;
  passwordForm: FormGroup;
  isEditingProfile = false;
  isEditingProfessional = false;
  isChangingPassword = false;
  isLoading = false;
  profileUpdateSuccess = false;
  passwordUpdateSuccess = false;
  errorMessage = '';
  newSkill = '';
  newJobType = '';
  newLocation = '';

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
      id: 'professional',
      title: 'Professional Info',
      icon: 'briefcase',
      description: 'Manage your professional details',
    },
    {
      id: 'resume',
      title: 'Resume',
      icon: 'file',
      description: 'Upload and manage your resume',
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
    private formBuilder: FormBuilder,
    private userProfileService: UserProfileService
  ) {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      linkedinUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      portfolioUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      githubUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
      // Legacy fields for backward compatibility
      location: [''],
      bio: ['', [Validators.maxLength(500)]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      linkedin: [''],
      github: [''],
      twitter: [''],
    });

    this.professionalForm = this.createProfessionalForm();

    this.passwordForm = this.formBuilder.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private createProfessionalForm(): FormGroup {
    return this.formBuilder.group({
      currentTitle: ['', [Validators.required]],
      yearsOfExperience: [0, [Validators.required, Validators.min(0)]],
      summary: ['', [Validators.required, Validators.minLength(50)]],
      skills: [[]],
      preferredJobTypes: [[]],
      preferredLocations: [[]],
      expectedSalaryMin: [0, [Validators.required, Validators.min(0)]],
      expectedSalaryMax: [0, [Validators.required, Validators.min(0)]],
      expectedSalaryCurrency: ['USD', [Validators.required]],
    });
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
    this.isEditingProfessional = false;
    this.isChangingPassword = false;
    this.clearMessages();
  }

  loadUserProfile() {
    if (this.currentUser) {
      this.isLoading = true;

      // Load comprehensive profile from userProfiles table
      this.authSubscription.add(
        this.userProfileService.getUserProfile(this.currentUser.id).subscribe({
          next: (profile) => {
            this.userProfile = profile;
            this.isLoading = false;

            if (profile) {
              // Populate personal form with profile data
              this.profileForm.patchValue({
                firstName: profile.personalInfo.firstName || '',
                lastName: profile.personalInfo.lastName || '',
                email: profile.personalInfo.email || '',
                phone: profile.personalInfo.phone || '',
                linkedinUrl: profile.personalInfo.linkedinUrl || '',
                portfolioUrl: profile.personalInfo.portfolioUrl || '',
                githubUrl: profile.personalInfo.githubUrl || '',
                street: profile.personalInfo.address?.street || '',
                city: profile.personalInfo.address?.city || '',
                state: profile.personalInfo.address?.state || '',
                zipCode: profile.personalInfo.address?.zipCode || '',
                country: profile.personalInfo.address?.country || '',
                // Legacy fields for backward compatibility
                location:
                  `${profile.personalInfo.address?.city || ''}, ${
                    profile.personalInfo.address?.state || ''
                  }`.replace(/^, |, $/, '') || '',
                bio: profile.professionalInfo.summary || '',
                website: profile.personalInfo.portfolioUrl || '',
                linkedin: profile.personalInfo.linkedinUrl || '',
                github: profile.personalInfo.githubUrl || '',
                twitter: '',
              });

              // Populate professional form with profile data
              this.professionalForm.patchValue({
                currentTitle: profile.professionalInfo.currentTitle || '',
                yearsOfExperience:
                  profile.professionalInfo.yearsOfExperience || 0,
                summary: profile.professionalInfo.summary || '',
                skills: profile.professionalInfo.skills || [],
                preferredJobTypes:
                  profile.professionalInfo.preferredJobTypes || [],
                preferredLocations:
                  profile.professionalInfo.preferredLocations || [],
                expectedSalaryMin:
                  profile.professionalInfo.expectedSalary?.min || 0,
                expectedSalaryMax:
                  profile.professionalInfo.expectedSalary?.max || 0,
                expectedSalaryCurrency:
                  profile.professionalInfo.expectedSalary?.currency || 'USD',
              });
            } else {
              // Fallback to basic user data if no profile exists
              this.profileForm.patchValue({
                firstName: this.currentUser?.firstName || '',
                lastName: this.currentUser?.lastName || '',
                email: this.currentUser?.email || '',
                phone: this.currentUser?.phone || '',
                location: this.currentUser?.location || '',
                bio: this.currentUser?.bio || '',
                website: this.currentUser?.website || '',
                linkedin: this.currentUser?.linkedin || '',
                github: this.currentUser?.github || '',
                twitter: this.currentUser?.twitter || '',
              });
            }
          },
          error: (error) => {
            console.error('Error loading user profile:', error);
            this.isLoading = false;

            // Fallback to basic user data
            this.profileForm.patchValue({
              firstName: this.currentUser?.firstName || '',
              lastName: this.currentUser?.lastName || '',
              email: this.currentUser?.email || '',
              phone: this.currentUser?.phone || '',
              location: this.currentUser?.location || '',
              bio: this.currentUser?.bio || '',
              website: this.currentUser?.website || '',
              linkedin: this.currentUser?.linkedin || '',
              github: this.currentUser?.github || '',
              twitter: this.currentUser?.twitter || '',
            });
          },
        })
      );
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

  toggleEditProfessional() {
    this.isEditingProfessional = !this.isEditingProfessional;
    if (!this.isEditingProfessional) {
      this.loadUserProfile(); // Reset form if canceling
    }
    this.clearMessages();
  }

  onProfileSubmit() {
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const formValue = this.profileForm.value;

      const profileData = {
        userId: this.currentUser.id,
        personalInfo: {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phone: formValue.phone,
          address: {
            street: formValue.street || '',
            city: formValue.city || '',
            state: formValue.state || '',
            zipCode: formValue.zipCode || '',
            country: formValue.country || 'United States',
          },
          linkedinUrl: formValue.linkedinUrl || '',
          portfolioUrl: formValue.portfolioUrl || '',
          githubUrl: formValue.githubUrl || '',
        },
        professionalInfo: {
          currentTitle: this.userProfile?.professionalInfo.currentTitle || '',
          yearsOfExperience:
            this.userProfile?.professionalInfo.yearsOfExperience || 0,
          summary: formValue.bio,
          skills: this.userProfile?.professionalInfo.skills || [],
          preferredJobTypes:
            this.userProfile?.professionalInfo.preferredJobTypes || [],
          preferredLocations:
            this.userProfile?.professionalInfo.preferredLocations || [],
          expectedSalary: this.userProfile?.professionalInfo.expectedSalary || {
            min: 0,
            max: 0,
            currency: 'USD',
          },
        },
        education: this.userProfile?.education || [],
        experience: this.userProfile?.experience || [],
        resume: this.userProfile?.resume,
      };

      if (this.userProfile) {
        // Update existing profile
        this.authSubscription.add(
          this.userProfileService
            .updateUserProfile(this.userProfile.id, profileData)
            .subscribe({
              next: (updatedProfile) => {
                this.userProfile = updatedProfile;
                this.isLoading = false;
                this.isEditingProfile = false;
                this.profileUpdateSuccess = true;

                setTimeout(() => {
                  this.profileUpdateSuccess = false;
                }, 3000);
              },
              error: (error) => {
                console.error('Error updating profile:', error);
                this.isLoading = false;
                this.errorMessage =
                  'Failed to update profile. Please try again.';

                setTimeout(() => {
                  this.errorMessage = '';
                }, 5000);
              },
            })
        );
      } else {
        // Create new profile
        this.authSubscription.add(
          this.userProfileService.createUserProfile(profileData).subscribe({
            next: (newProfile) => {
              this.userProfile = newProfile;
              this.isLoading = false;
              this.isEditingProfile = false;
              this.profileUpdateSuccess = true;

              setTimeout(() => {
                this.profileUpdateSuccess = false;
              }, 3000);
            },
            error: (error) => {
              console.error('Error creating profile:', error);
              this.isLoading = false;
              this.errorMessage = 'Failed to create profile. Please try again.';

              setTimeout(() => {
                this.errorMessage = '';
              }, 5000);
            },
          })
        );
      }
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onProfessionalSubmit() {
    if (this.professionalForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const formValue = this.professionalForm.value;

      const updatedProfessionalInfo = {
        currentTitle: formValue.currentTitle,
        yearsOfExperience: formValue.yearsOfExperience,
        summary: formValue.summary,
        skills: formValue.skills || [],
        preferredJobTypes: formValue.preferredJobTypes || [],
        preferredLocations: formValue.preferredLocations || [],
        expectedSalary: {
          min: formValue.expectedSalaryMin,
          max: formValue.expectedSalaryMax,
          currency: formValue.expectedSalaryCurrency,
        },
      };

      if (this.userProfile) {
        const updatedProfile = {
          ...this.userProfile,
          professionalInfo: updatedProfessionalInfo,
        };

        this.authSubscription.add(
          this.userProfileService
            .updateUserProfile(this.userProfile.id, updatedProfile)
            .subscribe({
              next: (profile) => {
                this.userProfile = profile;
                this.isLoading = false;
                this.isEditingProfessional = false;
                this.profileUpdateSuccess = true;

                setTimeout(() => {
                  this.profileUpdateSuccess = false;
                }, 3000);
              },
              error: (error) => {
                console.error('Error updating professional info:', error);
                this.isLoading = false;
                this.errorMessage =
                  'Failed to update professional information. Please try again.';

                setTimeout(() => {
                  this.errorMessage = '';
                }, 5000);
              },
            })
        );
      } else {
        // Create new profile with professional info
        this.createProfileWithProfessionalInfo(updatedProfessionalInfo);
      }
    } else {
      this.markFormGroupTouched(this.professionalForm);
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

  // Resume functionality
  onResumeSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Please upload a PDF or Word document';
        setTimeout(() => (this.errorMessage = ''), 5000);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'File size must be less than 5MB';
        setTimeout(() => (this.errorMessage = ''), 5000);
        return;
      }

      this.uploadResume(file);
    }
  }

  private uploadResume(file: File): void {
    this.isLoading = true;
    this.clearMessages();

    this.authSubscription.add(
      this.userProfileService.uploadResume(file).subscribe({
        next: (resume) => {
          // Update the user profile with new resume
          if (this.userProfile) {
            const updatedProfile = {
              ...this.userProfile,
              resume: resume,
            };

            this.authSubscription.add(
              this.userProfileService
                .updateUserProfile(this.userProfile.id, updatedProfile)
                .subscribe({
                  next: (profile) => {
                    this.userProfile = profile;
                    this.isLoading = false;
                    this.profileUpdateSuccess = true;

                    setTimeout(() => {
                      this.profileUpdateSuccess = false;
                    }, 3000);
                  },
                  error: (error) => {
                    console.error('Error updating profile with resume:', error);
                    this.isLoading = false;
                    this.errorMessage =
                      'Failed to save resume. Please try again.';

                    setTimeout(() => {
                      this.errorMessage = '';
                    }, 5000);
                  },
                })
            );
          } else {
            // Create new profile with resume
            this.createProfileWithResume(resume);
          }
        },
        error: (error) => {
          console.error('Error uploading resume:', error);
          this.isLoading = false;
          this.errorMessage = 'Failed to upload resume. Please try again.';

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      })
    );
  }

  private createProfileWithResume(resume: any): void {
    if (!this.currentUser) return;

    const profileData = {
      userId: this.currentUser.id,
      personalInfo: {
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
        },
      },
      professionalInfo: {
        currentTitle: '',
        yearsOfExperience: 0,
        summary: '',
        skills: [],
        preferredJobTypes: [],
        preferredLocations: [],
        expectedSalary: {
          min: 0,
          max: 0,
          currency: 'USD',
        },
      },
      education: [],
      experience: [],
      resume: resume,
    };

    this.authSubscription.add(
      this.userProfileService.createUserProfile(profileData).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.profileUpdateSuccess = true;

          setTimeout(() => {
            this.profileUpdateSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating profile:', error);
          this.isLoading = false;
          this.errorMessage = 'Failed to create profile. Please try again.';

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      })
    );
  }

  downloadResume(): void {
    if (this.userProfile?.resume) {
      // In a real application, this would download from the server
      // For demo purposes, we'll show a message
      alert(`Downloading ${this.userProfile.resume.fileName}...`);

      // Real implementation would be:
      // window.open(this.userProfile.resume.fileUrl, '_blank');
    }
  }

  replaceResume(): void {
    const fileInput = document.getElementById(
      'resume-upload'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Professional Information Management
  addSkill(): void {
    if (this.newSkill.trim()) {
      const currentSkills = this.professionalForm.get('skills')?.value || [];
      if (!currentSkills.includes(this.newSkill.trim())) {
        currentSkills.push(this.newSkill.trim());
        this.professionalForm.patchValue({ skills: currentSkills });
      }
      this.newSkill = '';
    }
  }

  removeSkill(skill: string): void {
    const currentSkills = this.professionalForm.get('skills')?.value || [];
    const updatedSkills = currentSkills.filter((s: string) => s !== skill);
    this.professionalForm.patchValue({ skills: updatedSkills });
  }

  addJobType(): void {
    if (this.newJobType.trim()) {
      const currentTypes =
        this.professionalForm.get('preferredJobTypes')?.value || [];
      if (!currentTypes.includes(this.newJobType.trim())) {
        currentTypes.push(this.newJobType.trim());
        this.professionalForm.patchValue({ preferredJobTypes: currentTypes });
      }
      this.newJobType = '';
    }
  }

  removeJobType(type: string): void {
    const currentTypes =
      this.professionalForm.get('preferredJobTypes')?.value || [];
    const updatedTypes = currentTypes.filter((t: string) => t !== type);
    this.professionalForm.patchValue({ preferredJobTypes: updatedTypes });
  }

  addLocation(): void {
    if (this.newLocation.trim()) {
      const currentLocations =
        this.professionalForm.get('preferredLocations')?.value || [];
      if (!currentLocations.includes(this.newLocation.trim())) {
        currentLocations.push(this.newLocation.trim());
        this.professionalForm.patchValue({
          preferredLocations: currentLocations,
        });
      }
      this.newLocation = '';
    }
  }

  removeLocation(location: string): void {
    const currentLocations =
      this.professionalForm.get('preferredLocations')?.value || [];
    const updatedLocations = currentLocations.filter(
      (l: string) => l !== location
    );
    this.professionalForm.patchValue({ preferredLocations: updatedLocations });
  }

  private createProfileWithProfessionalInfo(professionalInfo: any): void {
    if (!this.currentUser) return;

    const profileData = {
      userId: this.currentUser.id,
      personalInfo: {
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States',
        },
      },
      professionalInfo: professionalInfo,
      education: [],
      experience: [],
      resume: undefined,
    };

    this.authSubscription.add(
      this.userProfileService.createUserProfile(profileData).subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.isEditingProfessional = false;
          this.profileUpdateSuccess = true;

          setTimeout(() => {
            this.profileUpdateSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating profile:', error);
          this.isLoading = false;
          this.errorMessage = 'Failed to create profile. Please try again.';

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      })
    );
  }
}
