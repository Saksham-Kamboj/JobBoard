import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  postedAt: string;
  applicationsCount: number;
}

@Component({
  selector: 'app-job-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './job-list.component.html',
  styleUrl: './job-list.component.css'
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [
    {
      id: '1',
      title: 'Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$80,000 - $120,000',
      description: 'We are looking for a skilled Frontend Developer to join our team...',
      postedAt: '2024-01-15T10:00:00.000Z',
      applicationsCount: 12
    },
    {
      id: '2',
      title: 'Backend Developer',
      company: 'DataSoft Solutions',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$90,000 - $140,000',
      description: 'Join our backend team to build scalable APIs and microservices...',
      postedAt: '2024-01-14T14:30:00.000Z',
      applicationsCount: 8
    },
    {
      id: '3',
      title: 'UI/UX Designer',
      company: 'Creative Agency',
      location: 'Los Angeles, CA',
      type: 'Contract',
      salary: '$60 - $80 per hour',
      description: 'We need a talented UI/UX Designer for a 6-month project...',
      postedAt: '2024-01-13T09:15:00.000Z',
      applicationsCount: 15
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else {
      return `${diffInDays} days ago`;
    }
  }
}
