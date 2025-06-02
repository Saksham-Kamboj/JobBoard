import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline: string;
  companyLogo?: string;
  companyDescription: string;
  contactEmail: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  isActive: boolean;
  applicationCount: number;
}

@Component({
  selector: 'app-job-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrl: './job-detail.component.css'
})
export class JobDetailComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  currentUser: User | null = null;
  isLoading = true;
  hasApplied = false;
  isApplying = false;
  errorMessage = '';
  successMessage = '';
  
  private routeSubscription: Subscription = new Subscription();
  private authSubscription: Subscription = new Subscription();

  // Mock jobs data - in a real app, this would come from a service
  private mockJobs: Job[] = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: '$120,000 - $150,000',
      description: `We are seeking a talented Senior Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks and ensuring excellent user experience across all platforms.

Key Responsibilities:
• Develop and maintain responsive web applications using React, Angular, or Vue.js
• Collaborate with UX/UI designers to implement pixel-perfect designs
• Optimize applications for maximum speed and scalability
• Write clean, maintainable, and well-documented code
• Participate in code reviews and mentor junior developers
• Stay up-to-date with the latest frontend technologies and best practices`,
      requirements: [
        '5+ years of experience in frontend development',
        'Expert knowledge of JavaScript, HTML5, and CSS3',
        'Experience with React, Angular, or Vue.js',
        'Proficiency in TypeScript',
        'Experience with state management (Redux, NgRx, Vuex)',
        'Knowledge of build tools (Webpack, Vite, etc.)',
        'Experience with version control (Git)',
        'Understanding of responsive design principles',
        'Bachelor\'s degree in Computer Science or related field'
      ],
      benefits: [
        'Competitive salary and equity package',
        'Comprehensive health, dental, and vision insurance',
        'Flexible work arrangements and remote work options',
        'Professional development budget ($2,000/year)',
        'Unlimited PTO policy',
        'Modern office with free meals and snacks',
        '401(k) with company matching',
        'Gym membership reimbursement'
      ],
      postedDate: '2024-01-15',
      applicationDeadline: '2024-02-15',
      companyDescription: 'TechCorp Solutions is a leading technology company specializing in innovative software solutions for enterprise clients. We pride ourselves on creating cutting-edge products that solve real-world problems.',
      contactEmail: 'careers@techcorp.com',
      experienceLevel: 'senior',
      skills: ['JavaScript', 'React', 'TypeScript', 'CSS3', 'HTML5', 'Git', 'Webpack'],
      isActive: true,
      applicationCount: 45
    },
    {
      id: '2',
      title: 'UX/UI Designer',
      company: 'Design Studio Pro',
      location: 'New York, NY',
      type: 'full-time',
      salary: '$80,000 - $100,000',
      description: `Join our creative team as a UX/UI Designer and help shape the future of digital experiences. You'll work on exciting projects for diverse clients, from startups to Fortune 500 companies.

Key Responsibilities:
• Create user-centered designs through research, wireframing, and prototyping
• Develop design systems and maintain brand consistency
• Collaborate with developers to ensure design feasibility
• Conduct user testing and iterate based on feedback
• Present design concepts to clients and stakeholders`,
      requirements: [
        '3+ years of UX/UI design experience',
        'Proficiency in Figma, Sketch, or Adobe Creative Suite',
        'Strong portfolio demonstrating design process',
        'Understanding of user research methodologies',
        'Knowledge of design systems and component libraries',
        'Experience with prototyping tools',
        'Excellent communication and presentation skills'
      ],
      benefits: [
        'Creative and collaborative work environment',
        'Health and dental insurance',
        'Flexible working hours',
        'Professional development opportunities',
        'Modern design tools and equipment',
        'Team building events and retreats'
      ],
      postedDate: '2024-01-10',
      applicationDeadline: '2024-02-10',
      companyDescription: 'Design Studio Pro is a full-service design agency that creates beautiful and functional digital experiences. We work with clients across various industries to bring their visions to life.',
      contactEmail: 'jobs@designstudiopro.com',
      experienceLevel: 'mid',
      skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
      isActive: true,
      applicationCount: 28
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Subscribe to route parameters
    this.routeSubscription.add(
      this.route.params.subscribe(params => {
        const jobId = params['id'];
        if (jobId) {
          this.loadJob(jobId);
        }
      })
    );

    // Subscribe to authentication state
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user && this.job) {
          this.checkApplicationStatus();
        }
      })
    );
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
  }

  private loadJob(jobId: string) {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.job = this.mockJobs.find(job => job.id === jobId) || null;
      this.isLoading = false;
      
      if (!this.job) {
        this.errorMessage = 'Job not found';
      } else if (this.currentUser) {
        this.checkApplicationStatus();
      }
    }, 500);
  }

  private checkApplicationStatus() {
    // In a real app, this would check if the user has already applied
    // For now, we'll simulate this
    this.hasApplied = false;
  }

  applyForJob() {
    if (!this.currentUser) {
      this.router.navigate(['/auth/signin'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    if (this.currentUser.role !== 'job-seeker') {
      this.errorMessage = 'Only job seekers can apply for jobs';
      return;
    }

    this.isApplying = true;
    this.errorMessage = '';

    // Simulate application submission
    setTimeout(() => {
      this.isApplying = false;
      this.hasApplied = true;
      this.successMessage = 'Application submitted successfully!';
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/jobs']);
  }

  shareJob() {
    if (navigator.share && this.job) {
      navigator.share({
        title: this.job.title,
        text: `Check out this job opportunity: ${this.job.title} at ${this.job.company}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.successMessage = 'Job link copied to clipboard!';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      });
    }
  }

  getExperienceLevelDisplay(): string {
    if (!this.job) return '';
    
    const levels: { [key: string]: string } = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'executive': 'Executive Level'
    };
    
    return levels[this.job.experienceLevel] || this.job.experienceLevel;
  }

  getJobTypeDisplay(): string {
    if (!this.job) return '';
    
    const types: { [key: string]: string } = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'remote': 'Remote'
    };
    
    return types[this.job.type] || this.job.type;
  }

  getDaysAgo(): number {
    if (!this.job) return 0;
    
    const postedDate = new Date(this.job.postedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - postedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getDaysUntilDeadline(): number {
    if (!this.job) return 0;
    
    const deadline = new Date(this.job.applicationDeadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  isDeadlineSoon(): boolean {
    return this.getDaysUntilDeadline() <= 7 && this.getDaysUntilDeadline() > 0;
  }

  isDeadlinePassed(): boolean {
    return this.getDaysUntilDeadline() < 0;
  }
}
