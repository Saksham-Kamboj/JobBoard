import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth.service';
import {
  ProfileService,
  UserProfile,
} from '../../../core/services/profile.service';

@Component({
  selector: 'app-job-seeker-profile',
  templateUrl: './job-seeker-profile.component.html',
  styleUrls: ['./job-seeker-profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class JobSeekerProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userProfile: UserProfile | null = null;

  // Form controls
  profileForm: FormGroup;
  professionalForm: FormGroup;
  educationForm: FormGroup;
  experienceForm: FormGroup;

  // UI state
  activeSection = 'personal';
  isEditingProfile = false;
  isEditingProfessional = false;
  isEditingEducation = false;
  isEditingExperience = false;
  isEditingPreferences = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Skills and preferences
  newSkill = '';
  newJobType = '';
  newLocation = '';
  availableSkills: string[] = [];
  availableJobTypes: string[] = [];
  availableLocations: string[] = [];

  // Education and Experience
  editingEducationIndex = -1;
  editingExperienceIndex = -1;

  private authSubscription: Subscription = new Subscription();

  // Profile sections for job seeker
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      linkedinUrl: [''],
      portfolioUrl: [''],
      githubUrl: [''],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['United States'],
    });

    this.professionalForm = this.fb.group({
      currentTitle: [''],
      yearsOfExperience: [0, [Validators.min(0)]],
      summary: [''],
      expectedSalaryMin: [0, [Validators.min(0)]],
      expectedSalaryMax: [0, [Validators.min(0)]],
      expectedSalaryCurrency: ['USD'],
      jobAlertFrequency: ['weekly'],
    });

    this.educationForm = this.fb.group({
      institution: ['', Validators.required],
      degree: ['', Validators.required],
      fieldOfStudy: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isCurrentlyStudying: [false],
      gpa: [''],
      description: [''],
    });

    this.experienceForm = this.fb.group({
      company: ['', Validators.required],
      position: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      isCurrentPosition: [false],
      description: [''],
      location: [''],
    });

    // Initialize available options
    this.availableSkills = [
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'C#',
      'React',
      'Angular',
      'Vue.js',
      'Node.js',
      'Express.js',
      'Django',
      'Flask',
      'Spring Boot',
      '.NET',
      'SQL',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'AWS',
      'Azure',
      'Google Cloud',
      'Docker',
      'Kubernetes',
      'Git',
      'HTML',
      'CSS',
      'SASS',
      'Bootstrap',
      'Tailwind CSS',
      'REST APIs',
      'GraphQL',
    ];

    this.availableJobTypes = [
      'Full-time',
      'Part-time',
      'Contract',
      'Freelance',
      'Internship',
      'Remote',
      'Hybrid',
    ];

    this.availableLocations = [
      'New York, NY',
      'San Francisco, CA',
      'Los Angeles, CA',
      'Chicago, IL',
      'Boston, MA',
      'Seattle, WA',
      'Austin, TX',
      'Denver, CO',
      'Atlanta, GA',
      'Miami, FL',
      'Remote',
    ];
  }

  ngOnInit() {
    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user && user.role === 'job-seeker') {
          this.loadUserProfile();
        }
      })
    );
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  // Helper methods for profile header
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
    return 'Job Seeker';
  }

  setActiveSection(sectionId: string) {
    this.activeSection = sectionId;
    this.isEditingProfile = false;
    this.isEditingProfessional = false;
    this.isEditingEducation = false;
    this.isEditingExperience = false;
    this.clearMessages();
  }

  loadUserProfile() {
    if (this.currentUser) {
      this.isLoading = true;
      this.clearMessages();
      this.authSubscription.add(
        this.profileService.getUserProfile(this.currentUser.id).subscribe({
          next: (profile) => {
            this.userProfile = profile;
            this.populateProfileForm();
            this.populateProfessionalForm();
            this.isLoading = false;
            console.log('Profile loaded successfully:', profile);
          },
          error: (error) => {
            console.error('Error loading user profile:', error);
            this.isLoading = false;
            this.errorMessage =
              'Failed to load profile. Please refresh the page.';
            // Still populate forms with current user data as fallback
            this.populateProfileForm();
            this.populateProfessionalForm();
          },
        })
      );
    }
  }

  populateProfileForm() {
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName:
          this.userProfile?.personalInfo?.firstName ||
          this.currentUser.firstName ||
          '',
        lastName:
          this.userProfile?.personalInfo?.lastName ||
          this.currentUser.lastName ||
          '',
        email:
          this.userProfile?.personalInfo?.email || this.currentUser.email || '',
        phone:
          this.userProfile?.personalInfo?.phone || this.currentUser.phone || '',
        linkedinUrl: this.userProfile?.personalInfo?.linkedinUrl || '',
        portfolioUrl: this.userProfile?.personalInfo?.portfolioUrl || '',
        githubUrl: this.userProfile?.personalInfo?.githubUrl || '',
        street: this.userProfile?.personalInfo?.address?.street || '',
        city: this.userProfile?.personalInfo?.address?.city || '',
        state: this.userProfile?.personalInfo?.address?.state || '',
        zipCode: this.userProfile?.personalInfo?.address?.zipCode || '',
        country:
          this.userProfile?.personalInfo?.address?.country || 'United States',
      });
    }
  }

  populateProfessionalForm() {
    if (this.userProfile?.professionalInfo) {
      this.professionalForm.patchValue({
        currentTitle: this.userProfile.professionalInfo.currentTitle || '',
        yearsOfExperience:
          this.userProfile.professionalInfo.yearsOfExperience || 0,
        summary: this.userProfile.professionalInfo.summary || '',
        expectedSalaryMin:
          this.userProfile.professionalInfo.expectedSalary?.min || 0,
        expectedSalaryMax:
          this.userProfile.professionalInfo.expectedSalary?.max || 0,
        expectedSalaryCurrency:
          this.userProfile.professionalInfo.expectedSalary?.currency || 'USD',
        jobAlertFrequency:
          this.userProfile.professionalInfo.jobAlertFrequency || 'weekly',
      });
    }
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile) {
      this.populateProfileForm();
    }
    this.clearMessages();
  }

  toggleEditProfessional() {
    this.isEditingProfessional = !this.isEditingProfessional;
    this.clearMessages();
    if (this.isEditingProfessional) {
      // Populate form when entering edit mode
      this.populateProfessionalForm();
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
          linkedinUrl: formValue.linkedinUrl,
          portfolioUrl: formValue.portfolioUrl,
          githubUrl: formValue.githubUrl,
          address: {
            street: formValue.street,
            city: formValue.city,
            state: formValue.state,
            zipCode: formValue.zipCode,
            country: formValue.country,
          },
        },
        professionalInfo: this.userProfile?.professionalInfo || {
          currentTitle: '',
          yearsOfExperience: 0,
          summary: '',
          skills: [],
          preferredJobTypes: [],
          preferredLocations: [],
          expectedSalary: { min: 0, max: 0, currency: 'USD' },
          jobAlertFrequency: 'weekly',
        },
        education: this.userProfile?.education || [],
        experience: this.userProfile?.experience || [],
        resume: this.userProfile?.resume,
      };

      this.saveProfile(profileData);
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onProfessionalSubmit() {
    // This method is called when the reactive form is submitted (not used anymore)
    this.saveProfessionalInfo();
  }

  saveProfessionalInfo() {
    console.log('saveProfessionalInfo called');
    console.log('Form valid:', this.professionalForm.valid);
    console.log('Form value:', this.professionalForm.value);
    console.log('Form errors:', this.professionalForm.errors);
    console.log('Current user:', this.currentUser);

    if (this.professionalForm.valid && this.currentUser) {
      this.isLoading = true;
      this.clearMessages();

      const formValue = this.professionalForm.value;
      const professionalInfo = {
        currentTitle: formValue.currentTitle,
        yearsOfExperience: formValue.yearsOfExperience,
        summary: formValue.summary,
        skills: this.userProfile?.professionalInfo?.skills || [],
        preferredJobTypes:
          this.userProfile?.professionalInfo?.preferredJobTypes || [],
        preferredLocations:
          this.userProfile?.professionalInfo?.preferredLocations || [],
        expectedSalary: {
          min: formValue.expectedSalaryMin,
          max: formValue.expectedSalaryMax,
          currency: formValue.expectedSalaryCurrency,
        },
        jobAlertFrequency: formValue.jobAlertFrequency,
      };

      const profileData = {
        userId: this.currentUser.id,
        personalInfo: this.userProfile?.personalInfo || {
          firstName: this.currentUser.firstName || '',
          lastName: this.currentUser.lastName || '',
          email: this.currentUser.email || '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
          },
        },
        professionalInfo: professionalInfo,
        education: this.userProfile?.education || [],
        experience: this.userProfile?.experience || [],
        resume: this.userProfile?.resume,
      };

      console.log('Saving profile data:', profileData);
      this.saveProfile(profileData);
    } else {
      console.log('Form is invalid or no current user');
      if (!this.professionalForm.valid) {
        console.log('Form validation errors:');
        Object.keys(this.professionalForm.controls).forEach((key) => {
          const control = this.professionalForm.get(key);
          if (control && control.errors) {
            console.log(`${key}:`, control.errors);
          }
        });
      }
      this.markFormGroupTouched(this.professionalForm);
    }
  }

  private saveProfile(profileData: any) {
    const isUpdate = !!this.userProfile;
    const operation = isUpdate ? 'update' : 'create';

    const serviceCall = isUpdate
      ? this.profileService.updateUserProfile(profileData)
      : this.profileService.createUserProfile(profileData);

    this.authSubscription.add(
      serviceCall.subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.isLoading = false;
          this.isEditingProfile = false;
          this.isEditingProfessional = false;
          this.successMessage = `Profile ${operation}d successfully!`;

          // Auto-hide success message
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);

          console.log(`Profile ${operation}d successfully:`, profile);
        },
        error: (error) => {
          console.error(`Error ${operation}ing profile:`, error);
          this.isLoading = false;
          this.errorMessage = `Failed to ${operation} profile. Please try again.`;

          // Auto-hide error message
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        },
      })
    );
  }

  // Skills management
  addSkill() {
    if (this.newSkill.trim()) {
      this.ensureProfessionalInfoExists();
      if (this.userProfile?.professionalInfo) {
        if (!this.userProfile.professionalInfo.skills) {
          this.userProfile.professionalInfo.skills = [];
        }
        if (
          !this.userProfile.professionalInfo.skills.includes(
            this.newSkill.trim()
          )
        ) {
          this.userProfile.professionalInfo.skills.push(this.newSkill.trim());
          this.newSkill = '';
          // Don't save immediately - only save when form is submitted
        }
      }
    }
  }

  removeSkill(skill: string) {
    if (this.userProfile?.professionalInfo) {
      this.userProfile.professionalInfo.skills =
        this.userProfile.professionalInfo.skills.filter(
          (s: string) => s !== skill
        );
      // Don't save immediately - only save when form is submitted
    }
  }

  // Job Type management
  addJobType() {
    if (this.newJobType.trim()) {
      this.ensureProfessionalInfoExists();
      if (this.userProfile?.professionalInfo) {
        if (!this.userProfile.professionalInfo.preferredJobTypes) {
          this.userProfile.professionalInfo.preferredJobTypes = [];
        }
        if (
          !this.userProfile.professionalInfo.preferredJobTypes.includes(
            this.newJobType.trim()
          )
        ) {
          this.userProfile.professionalInfo.preferredJobTypes.push(
            this.newJobType.trim()
          );
          this.newJobType = '';
          // Don't save immediately - only save when form is submitted
        }
      }
    }
  }

  removeJobType(jobType: string) {
    if (this.userProfile?.professionalInfo) {
      this.userProfile.professionalInfo.preferredJobTypes =
        this.userProfile.professionalInfo.preferredJobTypes.filter(
          (type: string) => type !== jobType
        );
      // Don't save immediately - only save when form is submitted
    }
  }

  // Location management
  addLocation() {
    if (this.newLocation.trim()) {
      this.ensureProfessionalInfoExists();
      if (this.userProfile?.professionalInfo) {
        if (!this.userProfile.professionalInfo.preferredLocations) {
          this.userProfile.professionalInfo.preferredLocations = [];
        }
        if (
          !this.userProfile.professionalInfo.preferredLocations.includes(
            this.newLocation.trim()
          )
        ) {
          this.userProfile.professionalInfo.preferredLocations.push(
            this.newLocation.trim()
          );
          this.newLocation = '';
          // Don't save immediately - only save when form is submitted
        }
      }
    }
  }

  removeLocation(location: string) {
    if (this.userProfile?.professionalInfo) {
      this.userProfile.professionalInfo.preferredLocations =
        this.userProfile.professionalInfo.preferredLocations.filter(
          (loc: string) => loc !== location
        );
      // Don't save immediately - only save when form is submitted
    }
  }

  // Education management
  toggleEditEducation() {
    this.isEditingEducation = !this.isEditingEducation;
    if (!this.isEditingEducation) {
      this.educationForm.reset();
      this.editingEducationIndex = -1;
    }
    this.clearMessages();
  }

  editEducation(index: number) {
    if (this.userProfile?.education && this.userProfile.education[index]) {
      const education = this.userProfile.education[index];
      this.educationForm.patchValue(education);
      this.editingEducationIndex = index;
      this.isEditingEducation = true;
    }
  }

  onEducationSubmit() {
    if (this.educationForm.valid && this.userProfile && this.currentUser) {
      const formValue = this.educationForm.value;

      if (this.editingEducationIndex >= 0) {
        // Update existing education
        this.userProfile.education[this.editingEducationIndex] = formValue;
      } else {
        // Add new education
        if (!this.userProfile.education) {
          this.userProfile.education = [];
        }
        this.userProfile.education.push(formValue);
      }

      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.isEditingEducation = false;
            this.educationForm.reset();
            this.editingEducationIndex = -1;
            this.successMessage = 'Education updated successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error updating education:', error);
            this.errorMessage = 'Failed to update education. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    } else {
      this.markFormGroupTouched(this.educationForm);
    }
  }

  deleteEducation(index: number) {
    if (
      this.userProfile?.education &&
      confirm('Are you sure you want to delete this education entry?')
    ) {
      this.userProfile.education.splice(index, 1);
      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.successMessage = 'Education deleted successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error deleting education:', error);
            this.errorMessage = 'Failed to delete education. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  // Experience management
  toggleEditExperience() {
    this.isEditingExperience = !this.isEditingExperience;
    if (!this.isEditingExperience) {
      this.experienceForm.reset();
      this.editingExperienceIndex = -1;
    }
    this.clearMessages();
  }

  editExperience(index: number) {
    if (this.userProfile?.experience && this.userProfile.experience[index]) {
      const experience = this.userProfile.experience[index];
      this.experienceForm.patchValue(experience);
      this.editingExperienceIndex = index;
      this.isEditingExperience = true;
    }
  }

  onExperienceSubmit() {
    if (this.experienceForm.valid && this.userProfile && this.currentUser) {
      const formValue = this.experienceForm.value;

      if (this.editingExperienceIndex >= 0) {
        // Update existing experience
        this.userProfile.experience[this.editingExperienceIndex] = formValue;
      } else {
        // Add new experience
        if (!this.userProfile.experience) {
          this.userProfile.experience = [];
        }
        this.userProfile.experience.push(formValue);
      }

      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.isEditingExperience = false;
            this.experienceForm.reset();
            this.editingExperienceIndex = -1;
            this.successMessage = 'Experience updated successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error updating experience:', error);
            this.errorMessage =
              'Failed to update experience. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    } else {
      this.markFormGroupTouched(this.experienceForm);
    }
  }

  deleteExperience(index: number) {
    if (
      this.userProfile?.experience &&
      confirm('Are you sure you want to delete this experience entry?')
    ) {
      this.userProfile.experience.splice(index, 1);
      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.successMessage = 'Experience deleted successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error deleting experience:', error);
            this.errorMessage =
              'Failed to delete experience. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  // Resume management
  onResumeUpload(event: any) {
    const file = event.target.files[0];
    if (file && this.userProfile && this.currentUser) {
      // In a real application, you would upload the file to a server
      // For now, we'll just store the file name and simulate the upload
      const resumeData = {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // Temporary URL for preview
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
      };

      this.userProfile.resume = resumeData;

      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.successMessage = 'Resume uploaded successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error uploading resume:', error);
            this.errorMessage = 'Failed to upload resume. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  deleteResume() {
    if (
      this.userProfile &&
      confirm('Are you sure you want to delete your resume?')
    ) {
      this.userProfile.resume = undefined;

      this.authSubscription.add(
        this.profileService.updateUserProfile(this.userProfile).subscribe({
          next: (updatedProfile) => {
            this.userProfile = updatedProfile;
            this.successMessage = 'Resume deleted successfully';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          },
          error: (error) => {
            console.error('Error deleting resume:', error);
            this.errorMessage = 'Failed to delete resume. Please try again.';
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          },
        })
      );
    }
  }

  replaceResume() {
    const fileInput = document.getElementById(
      'resumeReplace'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Preferences management
  toggleEditPreferences() {
    this.isEditingPreferences = !this.isEditingPreferences;
    this.clearMessages();
  }

  // Utility methods
  private ensureProfessionalInfoExists() {
    if (!this.userProfile) {
      console.error('No user profile found');
      return;
    }

    if (!this.userProfile.professionalInfo) {
      this.userProfile.professionalInfo = {
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
        jobAlertFrequency: 'weekly',
      };
    }

    // Ensure arrays exist
    if (!this.userProfile.professionalInfo.skills) {
      this.userProfile.professionalInfo.skills = [];
    }
    if (!this.userProfile.professionalInfo.preferredJobTypes) {
      this.userProfile.professionalInfo.preferredJobTypes = [];
    }
    if (!this.userProfile.professionalInfo.preferredLocations) {
      this.userProfile.professionalInfo.preferredLocations = [];
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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
      if (field.errors['min'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['min'].min
        }`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      currentTitle: 'Current title',
      yearsOfExperience: 'Years of experience',
      expectedSalaryMin: 'Minimum expected salary',
      expectedSalaryMax: 'Maximum expected salary',
      institution: 'Institution',
      degree: 'Degree',
      fieldOfStudy: 'Field of study',
      startDate: 'Start date',
      company: 'Company',
      position: 'Position',
    };
    return labels[fieldName] || fieldName;
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Refresh profile data from server
  refreshProfile() {
    if (this.currentUser) {
      this.loadUserProfile();
    }
  }

  // Check if profile has required data
  isProfileComplete(): boolean {
    if (!this.userProfile?.personalInfo) return false;

    const personal = this.userProfile.personalInfo;
    return !!(
      personal.firstName &&
      personal.lastName &&
      personal.email &&
      personal.phone
    );
  }

  // Get completion percentage
  getProfileCompletionPercentage(): number {
    if (!this.userProfile) return 0;

    let completed = 0;
    let total = 0;

    // Personal info (40% weight)
    const personalFields = ['firstName', 'lastName', 'email', 'phone'];
    personalFields.forEach((field) => {
      total++;
      if (
        this.userProfile?.personalInfo?.[
          field as keyof typeof this.userProfile.personalInfo
        ]
      ) {
        completed++;
      }
    });

    // Professional info (30% weight)
    const professionalFields = ['currentTitle', 'summary'];
    professionalFields.forEach((field) => {
      total++;
      if (
        this.userProfile?.professionalInfo?.[
          field as keyof typeof this.userProfile.professionalInfo
        ]
      ) {
        completed++;
      }
    });

    // Education and Experience (30% weight)
    total += 2;
    if (this.userProfile?.education && this.userProfile.education.length > 0)
      completed++;
    if (this.userProfile?.experience && this.userProfile.experience.length > 0)
      completed++;

    return Math.round((completed / total) * 100);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Present';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
