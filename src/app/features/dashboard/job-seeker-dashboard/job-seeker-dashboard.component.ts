import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-job-seeker-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-seeker-dashboard.component.html',
  styleUrl: './job-seeker-dashboard.component.css'
})
export class JobSeekerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  stats = {
    appliedJobs: 12,
    savedJobs: 8,
    profileViews: 45,
    interviewsScheduled: 3
  };

  recentApplications = [
    {
      id: '1',
      jobTitle: 'Frontend Developer',
      company: 'TechCorp Inc.',
      appliedDate: '2024-01-16',
      status: 'pending'
    },
    {
      id: '2',
      jobTitle: 'UI/UX Designer',
      company: 'Creative Agency',
      appliedDate: '2024-01-15',
      status: 'interview'
    },
    {
      id: '3',
      jobTitle: 'Full Stack Developer',
      company: 'StartupXYZ',
      appliedDate: '2024-01-14',
      status: 'rejected'
    }
  ];

  recommendedJobs = [
    {
      id: '4',
      title: 'React Developer',
      company: 'InnovateTech',
      location: 'Remote',
      salary: '$85,000 - $110,000',
      matchScore: 95
    },
    {
      id: '5',
      title: 'Frontend Engineer',
      company: 'WebSolutions',
      location: 'San Francisco, CA',
      salary: '$90,000 - $125,000',
      matchScore: 88
    },
    {
      id: '6',
      title: 'JavaScript Developer',
      company: 'CodeCraft',
      location: 'New York, NY',
      salary: '$80,000 - $115,000',
      matchScore: 82
    }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'interview':
        return 'status-interview';
      case 'rejected':
        return 'status-rejected';
      case 'accepted':
        return 'status-accepted';
      default:
        return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'interview':
        return 'Interview Scheduled';
      case 'rejected':
        return 'Not Selected';
      case 'accepted':
        return 'Offer Received';
      default:
        return 'Unknown';
    }
  }

  getMatchScoreClass(score: number): string {
    if (score >= 90) return 'match-excellent';
    if (score >= 80) return 'match-good';
    if (score >= 70) return 'match-fair';
    return 'match-poor';
  }
}
