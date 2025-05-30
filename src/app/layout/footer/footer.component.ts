import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Footer navigation links
  jobSeekerLinks = [
    { title: 'Browse Jobs', route: '/jobs' },
    { title: 'Job Alerts', route: '/job-alerts' },
    { title: 'Career Advice', route: '/career-advice' },
    { title: 'Resume Builder', route: '/resume-builder' },
    { title: 'Salary Guide', route: '/salary-guide' },
  ];

  employerLinks = [
    { title: 'Post a Job', route: '/post-job' },
    { title: 'Browse Resumes', route: '/browse-resumes' },
    { title: 'Employer Dashboard', route: '/employer-dashboard' },
    { title: 'Pricing', route: '/pricing' },
    { title: 'Recruitment Solutions', route: '/recruitment-solutions' },
  ];

  companyLinks = [
    { title: 'About Us', route: '/about' },
    { title: 'Contact', route: '/contact' },
    { title: 'Careers', route: '/careers' },
    { title: 'Press', route: '/press' },
    { title: 'Blog', route: '/blog' },
  ];

  supportLinks = [
    { title: 'Help Center', route: '/help' },
    { title: 'Privacy Policy', route: '/privacy' },
    { title: 'Terms of Service', route: '/terms' },
    { title: 'Cookie Policy', route: '/cookies' },
    { title: 'Accessibility', route: '/accessibility' },
  ];

  socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/jobboard',
      icon: 'linkedin',
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/jobboard',
      icon: 'twitter',
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/jobboard',
      icon: 'facebook',
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/jobboard',
      icon: 'instagram',
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/jobboard',
      icon: 'youtube',
    },
  ];

  onNewsletterSubmit(email: string) {
    if (email.trim()) {
      console.log('Newsletter subscription:', email);
      // Implement newsletter subscription logic here
    }
  }
}
