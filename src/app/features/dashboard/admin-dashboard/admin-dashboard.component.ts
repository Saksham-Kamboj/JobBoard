import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  
  stats = {
    totalJobs: 45,
    activeJobs: 32,
    totalApplications: 234,
    newApplications: 18
  };

  recentJobs = [
    {
      id: '1',
      title: 'Frontend Developer',
      company: 'TechCorp Inc.',
      postedDate: '2024-01-16',
      applications: 12,
      status: 'active'
    },
    {
      id: '2',
      title: 'Backend Developer',
      company: 'DataSoft Solutions',
      postedDate: '2024-01-15',
      applications: 8,
      status: 'active'
    },
    {
      id: '3',
      title: 'UI/UX Designer',
      company: 'Creative Agency',
      postedDate: '2024-01-14',
      applications: 15,
      status: 'paused'
    }
  ];

  recentApplications = [
    {
      id: '1',
      applicantName: 'John Doe',
      jobTitle: 'Frontend Developer',
      appliedDate: '2024-01-16',
      status: 'pending'
    },
    {
      id: '2',
      applicantName: 'Jane Smith',
      jobTitle: 'UI/UX Designer',
      appliedDate: '2024-01-16',
      status: 'reviewed'
    },
    {
      id: '3',
      applicantName: 'Mike Johnson',
      jobTitle: 'Backend Developer',
      appliedDate: '2024-01-15',
      status: 'interview'
    }
  ];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getJobStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'paused':
        return 'status-paused';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-active';
    }
  }

  getJobStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  }

  getApplicationStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'interview':
        return 'status-interview';
      case 'rejected':
        return 'status-rejected';
      case 'hired':
        return 'status-hired';
      default:
        return 'status-pending';
    }
  }

  getApplicationStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Reviewed';
      case 'interview':
        return 'Interview';
      case 'rejected':
        return 'Rejected';
      case 'hired':
        return 'Hired';
      default:
        return 'Unknown';
    }
  }
}
