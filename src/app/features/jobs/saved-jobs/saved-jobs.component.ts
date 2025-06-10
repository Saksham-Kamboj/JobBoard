import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-saved-jobs',
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-jobs.component.html',
  styleUrl: './saved-jobs.component.css'
})
export class SavedJobsComponent {
  savedJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'Tech Innovations',
      location: 'Remote',
      salary: '$80,000 - $120,000',
      savedDate: '2024-01-20'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      salary: '$90,000 - $130,000',
      savedDate: '2024-01-18'
    }
  ];

  removeSavedJob(jobId: number) {
    this.savedJobs = this.savedJobs.filter(job => job.id !== jobId);
  }
}
