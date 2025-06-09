import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import {
  ProfileService,
  UserProfile,
  DashboardStats,
} from '../../core/services/profile.service';
import {
  JobManagementService,
  Job,
  JobApplication,
} from '../../core/services/job-management.service';
import {
  AdminManagementService,
  AdminSettings,
  UserManagement,
  JobManagementStats,
} from '../../core/services/admin-management.service';
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
  companyForm: FormGroup;
  isEditingProfile = false;
  isEditingProfessional = false;
  isEditingCompany = false;

  // Job and application data
  companyJobs: Job[] = [];
  jobApplications: JobApplication[] = [];
  filteredApplications: JobApplication[] = [];
  selectedJobFilter = '';
  selectedStatusFilter = '';

  // Admin data
  adminSettings: AdminSettings | null = null;
  allUsers: UserManagement[] = [];
  filteredUsers: UserManagement[] = [];
  allJobsForAdmin: any[] = [];
  filteredJobsForAdmin: any[] = [];
  jobManagementStats: JobManagementStats | null = null;
  selectedUserRoleFilter = '';
  selectedUserStatusFilter = '';
  selectedJobStatusFilter = '';
  isEditingAdminSettings = false;
  adminSettingsForm: FormGroup;
  isLoading = false;
  profileUpdateSuccess = false;
  errorMessage = '';
  newSkill = '';
  newJobType = '';
  newLocation = '';

  private authSubscription: Subscription = new Subscription();

  // Profile sections - will be dynamically set based on user role
  profileSections: any[] = [];

  activeSection = 'personal';

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private profileService: ProfileService,
    private jobManagementService: JobManagementService,
    private adminManagementService: AdminManagementService,
    private router: Router
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

    this.companyForm = this.formBuilder.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      companyDescription: [''],
      companyWebsite: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      companySize: [''],
      industry: [''],
    });

    // Initialize admin settings form
    this.adminSettingsForm = this.formBuilder.group({
      platformName: ['', [Validators.required]],
      platformDescription: ['', [Validators.required]],
      allowRegistration: [true],
      requireEmailVerification: [false],
      maxJobPostingsPerCompany: [50, [Validators.required, Validators.min(1)]],
      jobPostingDurationDays: [30, [Validators.required, Validators.min(1)]],
      featuredJobPrice: [99.99, [Validators.required, Validators.min(0)]],
      maintenanceMode: [false],
      supportEmail: ['', [Validators.required, Validators.email]],
      privacyPolicyUrl: [''],
      termsOfServiceUrl: [''],
    });
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
          this.setProfileSections(user.role);
          this.loadUserProfile();
          this.loadCompanyData();
          if (user.role === 'company') {
            this.loadCompanyJobs();
          } else if (user.role === 'admin') {
            this.loadAdminData();
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  setProfileSections(role: string) {
    switch (role) {
      case 'job-seeker':
        this.profileSections = [
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
            id: 'education',
            title: 'Education',
            icon: 'book',
            description: 'Add your educational background',
          },
          {
            id: 'experience',
            title: 'Work Experience',
            icon: 'work',
            description: 'Manage your work history',
          },
          {
            id: 'resume',
            title: 'Resume',
            icon: 'file',
            description: 'Upload and manage your resume',
          },

          {
            id: 'preferences',
            title: 'Preferences',
            icon: 'settings',
            description: 'Customize your experience',
          },
        ];
        break;
      case 'company':
        this.profileSections = [
          {
            id: 'personal',
            title: 'Contact Information',
            icon: 'user',
            description: 'Update contact details',
          },
          {
            id: 'company',
            title: 'Company Profile',
            icon: 'building',
            description: 'Manage company information',
          },
          {
            id: 'jobs',
            title: 'Job Postings',
            icon: 'briefcase',
            description: 'Manage your job listings',
          },
          {
            id: 'applications',
            title: 'Applications',
            icon: 'users',
            description: 'Review job applications',
          },

          {
            id: 'preferences',
            title: 'Preferences',
            icon: 'settings',
            description: 'Customize your experience',
          },
        ];
        break;
      case 'admin':
        this.profileSections = [
          {
            id: 'personal',
            title: 'Personal Information',
            icon: 'user',
            description: 'Update your basic information',
          },
          {
            id: 'admin',
            title: 'Admin Settings',
            icon: 'shield-check',
            description: 'Platform administration settings',
          },
          {
            id: 'users',
            title: 'User Management',
            icon: 'users',
            description: 'Manage platform users',
          },
          {
            id: 'jobs',
            title: 'Job Management',
            icon: 'briefcase',
            description: 'Oversee all job postings',
          },

          {
            id: 'preferences',
            title: 'Preferences',
            icon: 'settings',
            description: 'Customize your experience',
          },
        ];
        break;
      default:
        this.profileSections = [
          {
            id: 'personal',
            title: 'Personal Information',
            icon: 'user',
            description: 'Update your basic information',
          },
        ];
    }
  }

  setActiveSection(sectionId: string) {
    this.activeSection = sectionId;
    this.isEditingProfile = false;
    this.isEditingProfessional = false;
    this.isEditingCompany = false;
    this.clearMessages();
  }

  loadUserProfile() {
    if (this.currentUser) {
      this.isLoading = true;

      // Load comprehensive profile from userProfiles table
      this.authSubscription.add(
        this.profileService.getUserProfile(this.currentUser.id).subscribe({
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

  toggleEditProfessional() {
    this.isEditingProfessional = !this.isEditingProfessional;
    if (!this.isEditingProfessional) {
      this.loadUserProfile(); // Reset form if canceling
    }
    this.clearMessages();
  }

  toggleEditCompany() {
    this.isEditingCompany = !this.isEditingCompany;
    if (!this.isEditingCompany) {
      this.loadCompanyData(); // Reset form if canceling
    }
    this.clearMessages();
  }

  loadCompanyData() {
    if (this.currentUser) {
      this.companyForm.patchValue({
        companyName: this.currentUser.companyName || '',
        companyDescription: this.currentUser.companyDescription || '',
        companyWebsite: this.currentUser.companyWebsite || '',
        companySize: this.currentUser.companySize || '',
        industry: this.currentUser.industry || '',
      });
    }
  }

  onCompanySubmit() {
    if (this.companyForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const formValue = this.companyForm.value;
      const updatedUser = {
        ...this.currentUser,
        companyName: formValue.companyName,
        companyDescription: formValue.companyDescription,
        companyWebsite: formValue.companyWebsite,
        companySize: formValue.companySize,
        industry: formValue.industry,
      };

      // Update user in the backend
      this.authService.updateProfile(formValue).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isLoading = false;
          this.isEditingCompany = false;
          this.profileUpdateSuccess = true;

          setTimeout(() => {
            this.profileUpdateSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating company profile:', error);
          this.isLoading = false;
          this.errorMessage =
            'Failed to update company profile. Please try again.';

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      });
    } else {
      this.markFormGroupTouched(this.companyForm);
    }
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
          this.profileService.updateUserProfile(profileData).subscribe({
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
              this.errorMessage = 'Failed to update profile. Please try again.';

              setTimeout(() => {
                this.errorMessage = '';
              }, 5000);
            },
          })
        );
      } else {
        // Create new profile
        this.authSubscription.add(
          this.profileService.createUserProfile(profileData).subscribe({
            next: (newProfile: UserProfile) => {
              this.userProfile = newProfile;
              this.isLoading = false;
              this.isEditingProfile = false;
              this.profileUpdateSuccess = true;

              setTimeout(() => {
                this.profileUpdateSuccess = false;
              }, 3000);
            },
            error: (error: any) => {
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
          this.profileService.updateUserProfile(updatedProfile).subscribe({
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages() {
    this.profileUpdateSuccess = false;
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
      this.profileService.uploadResume(file).subscribe({
        next: (resume: any) => {
          // Update the user profile with new resume
          if (this.userProfile) {
            const updatedProfile = {
              ...this.userProfile,
              resume: resume,
            };

            this.authSubscription.add(
              this.profileService.updateUserProfile(updatedProfile).subscribe({
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
        error: (error: any) => {
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
      this.profileService.createUserProfile(profileData).subscribe({
        next: (profile: UserProfile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.profileUpdateSuccess = true;

          setTimeout(() => {
            this.profileUpdateSuccess = false;
          }, 3000);
        },
        error: (error: any) => {
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

  downloadResume(resumeUrl?: string): void {
    if (resumeUrl) {
      // Download specific resume from application
      console.log('Downloading resume:', resumeUrl);
      alert('Resume download would start here');
    } else if (this.userProfile?.resume) {
      // Download user's own resume
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
      this.profileService.createUserProfile(profileData).subscribe({
        next: (profile: UserProfile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.isEditingProfessional = false;
          this.profileUpdateSuccess = true;

          setTimeout(() => {
            this.profileUpdateSuccess = false;
          }, 3000);
        },
        error: (error: any) => {
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

  // Job and Application Management Methods
  loadCompanyJobs() {
    if (this.currentUser?.role === 'company') {
      this.isLoading = true;

      // Get company name from user data
      const companyName =
        this.currentUser.companyName ||
        this.currentUser.firstName + ' ' + this.currentUser.lastName;

      this.authSubscription.add(
        this.jobManagementService.getJobs().subscribe({
          next: (jobs) => {
            // Filter jobs by company name or company ID
            this.companyJobs = jobs.filter(
              (job) =>
                job.company === companyName ||
                job.companyId === this.currentUser?.id ||
                job.company === this.currentUser?.companyName
            );
            this.isLoading = false;

            // Load applications after jobs are loaded
            this.loadJobApplications();
          },
          error: (error) => {
            console.error('Error loading company jobs:', error);
            this.isLoading = false;
            this.companyJobs = [];
          },
        })
      );
    }
  }

  loadJobApplications() {
    if (this.currentUser?.role === 'company' && this.companyJobs.length > 0) {
      this.authSubscription.add(
        this.jobManagementService
          .getApplicationsByCompany(this.companyJobs)
          .subscribe({
            next: (applications) => {
              this.jobApplications = applications;
              this.filteredApplications = [...applications];
            },
            error: (error) => {
              console.error('Error loading job applications:', error);
              this.jobApplications = [];
              this.filteredApplications = [];
            },
          })
      );
    }
  }

  // Navigation methods
  navigateToCreateJob() {
    this.router.navigate(['/jobs/create']);
  }

  editJob(jobId: string) {
    this.router.navigate(['/jobs/edit', jobId]);
  }

  viewJobApplications(jobId: string) {
    this.selectedJobFilter = jobId;
    this.filterApplications();
    this.setActiveSection('applications');
  }

  // Job management methods
  deleteJob(jobId: string) {
    if (confirm('Are you sure you want to delete this job posting?')) {
      this.authSubscription.add(
        this.jobManagementService.deleteJob(jobId).subscribe({
          next: () => {
            this.companyJobs = this.companyJobs.filter(
              (job) => job.id !== jobId
            );
            // Also remove related applications
            this.jobApplications = this.jobApplications.filter(
              (app) => app.jobId !== jobId
            );
            this.filteredApplications = this.filteredApplications.filter(
              (app) => app.jobId !== jobId
            );
          },
          error: (error) => {
            console.error('Error deleting job:', error);
            this.errorMessage = 'Failed to delete job. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  getJobApplicationCount(jobId: string): number {
    return this.jobManagementService.getJobApplicationCount(
      jobId,
      this.jobApplications
    );
  }

  getDaysUntilDeadline(deadline: string): number {
    return this.jobManagementService.getDaysUntilDeadline(deadline);
  }

  getTimeAgo(date: string): string {
    return this.jobManagementService.getTimeAgo(date);
  }

  // Application management methods
  filterApplications() {
    this.filteredApplications = this.jobManagementService.filterApplications(
      this.jobApplications,
      this.selectedJobFilter,
      this.selectedStatusFilter
    );
  }

  updateApplicationStatus(application: JobApplication) {
    this.authSubscription.add(
      this.jobManagementService
        .updateApplicationStatus(application.id, application.status)
        .subscribe({
          next: (updatedApplication) => {
            // Update the local application data
            const index = this.jobApplications.findIndex(
              (app) => app.id === application.id
            );
            if (index !== -1) {
              this.jobApplications[index] = updatedApplication;
            }
            // Update filtered applications
            this.filterApplications();
          },
          error: (error) => {
            console.error('Error updating application status:', error);
            this.errorMessage =
              'Failed to update application status. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
    );
  }

  getJobTitle(jobId: string): string {
    const job = this.companyJobs.find((j) => j.id === jobId);
    return job ? job.title : 'Unknown Job';
  }

  getInitials(name: string): string {
    return this.jobManagementService.getInitials(name);
  }

  viewApplication(application: JobApplication) {
    // In real app, navigate to detailed application view
    const applicantName = `${application.applicationData.personalInfo.firstName} ${application.applicationData.personalInfo.lastName}`;
    const applicantEmail = application.applicationData.personalInfo.email;

    console.log('Viewing application:', application);
    alert(
      `Viewing application from ${applicantName}\n\nEmail: ${applicantEmail}\nStatus: ${application.status}\n\nCover Letter:\n${application.applicationData.coverLetter}`
    );
  }

  contactApplicant(application: JobApplication) {
    const applicantEmail = application.applicationData.personalInfo.email;
    const jobTitle = this.getJobTitle(application.jobId);

    console.log('Contacting applicant:', applicantEmail);
    window.location.href = `mailto:${applicantEmail}?subject=Regarding your application for ${jobTitle}`;
  }

  // Admin Management Methods
  loadAdminData() {
    if (this.currentUser?.role === 'admin') {
      this.loadAdminSettings();
      this.loadAllUsers();
      this.loadAllJobsForAdmin();
      this.loadJobManagementStats();
    }
  }

  loadAdminSettings() {
    this.authSubscription.add(
      this.adminManagementService.getAdminSettings().subscribe({
        next: (settings) => {
          this.adminSettings = settings;
          this.adminSettingsForm.patchValue(settings);
        },
        error: (error) => {
          console.error('Error loading admin settings:', error);
        },
      })
    );
  }

  loadAllUsers() {
    this.authSubscription.add(
      this.adminManagementService.getAllUsers().subscribe({
        next: (users) => {
          this.allUsers = users;
          this.filteredUsers = [...users];
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.allUsers = [];
          this.filteredUsers = [];
        },
      })
    );
  }

  loadAllJobsForAdmin() {
    this.authSubscription.add(
      this.adminManagementService.getAllJobsForAdmin().subscribe({
        next: (jobs) => {
          this.allJobsForAdmin = jobs;
          this.filteredJobsForAdmin = [...jobs];
        },
        error: (error) => {
          console.error('Error loading jobs for admin:', error);
          this.allJobsForAdmin = [];
          this.filteredJobsForAdmin = [];
        },
      })
    );
  }

  loadJobManagementStats() {
    this.authSubscription.add(
      this.adminManagementService.getJobManagementStats().subscribe({
        next: (stats) => {
          this.jobManagementStats = stats;
        },
        error: (error) => {
          console.error('Error loading job management stats:', error);
        },
      })
    );
  }

  // Admin Settings Methods
  toggleEditAdminSettings() {
    this.isEditingAdminSettings = !this.isEditingAdminSettings;
    if (!this.isEditingAdminSettings && this.adminSettings) {
      this.adminSettingsForm.patchValue(this.adminSettings);
    }
    this.clearMessages();
  }

  onAdminSettingsSubmit() {
    if (this.adminSettingsForm.valid) {
      this.isLoading = true;
      const formData = this.adminSettingsForm.value;

      this.authSubscription.add(
        this.adminManagementService.updateAdminSettings(formData).subscribe({
          next: (updatedSettings) => {
            this.adminSettings = updatedSettings;
            this.isEditingAdminSettings = false;
            this.isLoading = false;
            this.profileUpdateSuccess = true;
            setTimeout(() => {
              this.profileUpdateSuccess = false;
            }, 3000);
          },
          error: (error) => {
            console.error('Error updating admin settings:', error);
            this.isLoading = false;
            this.errorMessage =
              'Failed to update admin settings. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  // User Management Methods
  filterUsers() {
    this.filteredUsers = this.allUsers.filter((user) => {
      const roleMatch =
        !this.selectedUserRoleFilter ||
        user.role === this.selectedUserRoleFilter;
      const statusMatch =
        !this.selectedUserStatusFilter ||
        (this.selectedUserStatusFilter === 'active' && user.isActive) ||
        (this.selectedUserStatusFilter === 'inactive' && !user.isActive);
      return roleMatch && statusMatch;
    });
  }

  updateUserStatus(user: UserManagement) {
    this.authSubscription.add(
      this.adminManagementService
        .updateUserStatus(user.id, user.isActive)
        .subscribe({
          next: (updatedUser) => {
            const index = this.allUsers.findIndex((u) => u.id === user.id);
            if (index !== -1) {
              this.allUsers[index] = updatedUser;
            }
            this.filterUsers();
          },
          error: (error) => {
            console.error('Error updating user status:', error);
            this.errorMessage =
              'Failed to update user status. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
    );
  }

  onUserRoleChange(user: UserManagement, event: Event) {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value;
    this.updateUserRole(user, newRole);
  }

  updateUserRole(user: UserManagement, newRole: string) {
    if (
      confirm(
        `Are you sure you want to change ${user.firstName} ${
          user.lastName
        }'s role to ${this.adminManagementService.getUserRoleDisplayName(
          newRole
        )}?`
      )
    ) {
      this.authSubscription.add(
        this.adminManagementService.updateUserRole(user.id, newRole).subscribe({
          next: (updatedUser) => {
            const index = this.allUsers.findIndex((u) => u.id === user.id);
            if (index !== -1) {
              this.allUsers[index] = updatedUser;
            }
            this.filterUsers();
          },
          error: (error) => {
            console.error('Error updating user role:', error);
            this.errorMessage = 'Failed to update user role. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  deleteUser(user: UserManagement) {
    if (
      confirm(
        `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`
      )
    ) {
      this.authSubscription.add(
        this.adminManagementService.deleteUser(user.id).subscribe({
          next: () => {
            this.allUsers = this.allUsers.filter((u) => u.id !== user.id);
            this.filterUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.errorMessage = 'Failed to delete user. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  // Job Management Methods for Admin
  filterJobsForAdmin() {
    this.filteredJobsForAdmin = this.allJobsForAdmin.filter((job) => {
      const statusMatch =
        !this.selectedJobStatusFilter ||
        this.adminManagementService
          .getJobStatusDisplayName(job)
          .toLowerCase() === this.selectedJobStatusFilter;
      return statusMatch;
    });
  }

  updateJobStatusAsAdmin(job: any) {
    this.authSubscription.add(
      this.adminManagementService
        .updateJobStatus(job.id, job.isActive)
        .subscribe({
          next: (updatedJob) => {
            const index = this.allJobsForAdmin.findIndex(
              (j) => j.id === job.id
            );
            if (index !== -1) {
              this.allJobsForAdmin[index] = {
                ...this.allJobsForAdmin[index],
                ...updatedJob,
              };
            }
            this.filterJobsForAdmin();
          },
          error: (error) => {
            console.error('Error updating job status:', error);
            this.errorMessage =
              'Failed to update job status. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
    );
  }

  deleteJobAsAdmin(job: any) {
    if (
      confirm(
        `Are you sure you want to delete the job "${job.title}"? This action cannot be undone.`
      )
    ) {
      this.authSubscription.add(
        this.adminManagementService.deleteJobAsAdmin(job.id).subscribe({
          next: () => {
            this.allJobsForAdmin = this.allJobsForAdmin.filter(
              (j) => j.id !== job.id
            );
            this.filterJobsForAdmin();
            // Reload stats
            this.loadJobManagementStats();
          },
          error: (error) => {
            console.error('Error deleting job:', error);
            this.errorMessage = 'Failed to delete job. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  // Helper methods for admin
  getUserRoleDisplayName(role: string): string {
    return this.adminManagementService.getUserRoleDisplayName(role);
  }

  getJobStatusDisplayName(job: any): string {
    return this.adminManagementService.getJobStatusDisplayName(job);
  }

  getJobStatusClass(job: any): string {
    return this.adminManagementService.getJobStatusClass(job);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    return this.adminManagementService.formatDate(dateString);
  }

  getTimeAgoAdmin(dateString: string): string {
    return this.adminManagementService.getTimeAgo(dateString);
  }
}
