import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
  featured?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private API_URL = 'http://localhost:3000';

  // Mock jobs data - this will be consistent across components
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
• Stay up-to-date with the latest frontend technologies and best practices

What You'll Do:
• Build cutting-edge web applications that serve millions of users
• Work with a talented team of designers and engineers
• Contribute to our open-source projects and technical blog
• Participate in technical decision-making and architecture discussions`,
      requirements: [
        '5+ years of experience in frontend development',
        'Expert knowledge of JavaScript, HTML5, and CSS3',
        'Experience with React, Angular, or Vue.js',
        'Proficiency in TypeScript',
        'Experience with state management (Redux, NgRx, Vuex)',
        'Knowledge of build tools (Webpack, Vite, etc.)',
        'Experience with version control (Git)',
        'Understanding of responsive design principles',
        'Bachelor\'s degree in Computer Science or related field',
        'Experience with testing frameworks (Jest, Cypress)',
        'Knowledge of web performance optimization'
      ],
      benefits: [
        'Competitive salary and equity package',
        'Comprehensive health, dental, and vision insurance',
        'Flexible work arrangements and remote work options',
        'Professional development budget ($2,000/year)',
        'Unlimited PTO policy',
        'Modern office with free meals and snacks',
        '401(k) with company matching',
        'Gym membership reimbursement',
        'Latest MacBook Pro and equipment',
        'Conference and training opportunities'
      ],
      postedDate: '2024-01-15',
      applicationDeadline: '2024-02-15',
      companyDescription: 'TechCorp Solutions is a leading technology company specializing in innovative software solutions for enterprise clients. We pride ourselves on creating cutting-edge products that solve real-world problems and help businesses scale efficiently.',
      contactEmail: 'careers@techcorp.com',
      experienceLevel: 'senior',
      skills: ['JavaScript', 'React', 'TypeScript', 'CSS3', 'HTML5', 'Git', 'Webpack', 'Redux'],
      isActive: true,
      applicationCount: 45,
      featured: true
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
• Present design concepts to clients and stakeholders
• Work closely with product managers to define user requirements

What Makes This Role Special:
• Work with high-profile clients across various industries
• Access to the latest design tools and technologies
• Collaborative environment with talented designers
• Opportunity to lead design projects from concept to launch`,
      requirements: [
        '3+ years of UX/UI design experience',
        'Proficiency in Figma, Sketch, or Adobe Creative Suite',
        'Strong portfolio demonstrating design process',
        'Understanding of user research methodologies',
        'Knowledge of design systems and component libraries',
        'Experience with prototyping tools',
        'Excellent communication and presentation skills',
        'Understanding of web and mobile design principles',
        'Experience with user testing and analytics'
      ],
      benefits: [
        'Creative and collaborative work environment',
        'Health and dental insurance',
        'Flexible working hours',
        'Professional development opportunities',
        'Modern design tools and equipment',
        'Team building events and retreats',
        'Work-from-home options',
        'Creative project bonuses'
      ],
      postedDate: '2024-01-10',
      applicationDeadline: '2024-02-10',
      companyDescription: 'Design Studio Pro is a full-service design agency that creates beautiful and functional digital experiences. We work with clients across various industries to bring their visions to life through innovative design solutions.',
      contactEmail: 'jobs@designstudiopro.com',
      experienceLevel: 'mid',
      skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'Prototyping', 'User Research', 'Design Systems'],
      isActive: true,
      applicationCount: 28,
      featured: false
    },
    {
      id: '3',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      type: 'full-time',
      salary: '$90,000 - $120,000',
      description: `We're looking for a versatile Full Stack Developer to join our growing startup. You'll work on both frontend and backend technologies, helping us build scalable web applications that serve thousands of users.

Key Responsibilities:
• Develop and maintain full-stack web applications
• Work with modern JavaScript frameworks and backend technologies
• Design and implement RESTful APIs
• Collaborate with cross-functional teams
• Participate in code reviews and technical discussions
• Help scale our infrastructure as we grow

Startup Environment:
• Fast-paced, dynamic work environment
• Direct impact on product development
• Opportunity to wear multiple hats
• Work directly with founders and leadership team`,
      requirements: [
        '3+ years of full-stack development experience',
        'Proficiency in JavaScript/TypeScript',
        'Experience with React or Vue.js',
        'Backend experience with Node.js, Python, or similar',
        'Database experience (PostgreSQL, MongoDB)',
        'Understanding of RESTful API design',
        'Experience with cloud platforms (AWS, GCP)',
        'Knowledge of version control (Git)',
        'Startup experience preferred'
      ],
      benefits: [
        'Competitive salary with equity options',
        'Health and dental insurance',
        'Flexible work schedule',
        'Remote work opportunities',
        'Learning and development budget',
        'Startup culture and fast growth',
        'Modern tech stack',
        'Catered lunches'
      ],
      postedDate: '2024-01-12',
      applicationDeadline: '2024-02-12',
      companyDescription: 'StartupXYZ is an innovative tech startup focused on revolutionizing how people interact with technology. We\'re building the next generation of web applications with a focus on user experience and scalability.',
      contactEmail: 'hiring@startupxyz.com',
      experienceLevel: 'mid',
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript'],
      isActive: true,
      applicationCount: 32,
      featured: false
    },
    {
      id: '4',
      title: 'Product Manager',
      company: 'InnovateCorp',
      location: 'Seattle, WA',
      type: 'full-time',
      salary: '$110,000 - $140,000',
      description: `We're seeking an experienced Product Manager to lead our product development initiatives. You'll work closely with engineering, design, and business teams to deliver products that delight our customers.

Key Responsibilities:
• Define product strategy and roadmap
• Gather and prioritize product requirements
• Work closely with engineering teams to deliver features
• Analyze user feedback and market trends
• Coordinate product launches and go-to-market strategies
• Monitor product performance and iterate based on data

Leadership Opportunities:
• Lead cross-functional product teams
• Present to executive leadership
• Drive product vision and strategy
• Mentor junior product team members`,
      requirements: [
        '4+ years of product management experience',
        'Experience with agile development methodologies',
        'Strong analytical and problem-solving skills',
        'Excellent communication and leadership abilities',
        'Experience with product analytics tools',
        'Understanding of user experience principles',
        'Technical background preferred',
        'MBA or relevant degree preferred'
      ],
      benefits: [
        'Competitive salary and bonus structure',
        'Comprehensive benefits package',
        'Stock options',
        'Professional development opportunities',
        'Flexible work arrangements',
        'Modern office environment',
        'Team retreats and events',
        'Product management training'
      ],
      postedDate: '2024-01-08',
      applicationDeadline: '2024-02-08',
      companyDescription: 'InnovateCorp is a technology company focused on creating innovative solutions for modern businesses. We pride ourselves on building products that make a real difference in our customers\' lives.',
      contactEmail: 'careers@innovatecorp.com',
      experienceLevel: 'senior',
      skills: ['Product Management', 'Analytics', 'Agile', 'Leadership', 'Strategy'],
      isActive: true,
      applicationCount: 19,
      featured: true
    },
    {
      id: '5',
      title: 'DevOps Engineer',
      company: 'CloudTech Systems',
      location: 'Denver, CO',
      type: 'full-time',
      salary: '$100,000 - $130,000',
      description: `Join our DevOps team to help build and maintain scalable infrastructure. You'll work with cutting-edge cloud technologies and help our development teams deploy code efficiently and reliably.

Key Responsibilities:
• Design and maintain CI/CD pipelines
• Manage cloud infrastructure on AWS/Azure
• Implement monitoring and alerting systems
• Automate deployment processes
• Ensure system security and compliance
• Collaborate with development teams on infrastructure needs

Technical Environment:
• Modern cloud-native architecture
• Kubernetes and containerization
• Infrastructure as Code (Terraform)
• Monitoring with Prometheus and Grafana`,
      requirements: [
        '3+ years of DevOps/Infrastructure experience',
        'Experience with AWS or Azure',
        'Proficiency in Docker and Kubernetes',
        'Knowledge of CI/CD tools (Jenkins, GitLab CI)',
        'Experience with Infrastructure as Code',
        'Scripting skills (Python, Bash)',
        'Understanding of networking and security',
        'Experience with monitoring tools'
      ],
      benefits: [
        'Competitive salary',
        'Health, dental, and vision insurance',
        '401(k) with matching',
        'Flexible PTO',
        'Remote work options',
        'Professional certifications support',
        'Latest tools and equipment',
        'Conference attendance'
      ],
      postedDate: '2024-01-14',
      applicationDeadline: '2024-02-14',
      companyDescription: 'CloudTech Systems specializes in cloud infrastructure solutions for enterprise clients. We help companies migrate to the cloud and optimize their infrastructure for performance and cost.',
      contactEmail: 'devops-jobs@cloudtech.com',
      experienceLevel: 'mid',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Python', 'Jenkins'],
      isActive: true,
      applicationCount: 23,
      featured: false
    }
  ];

  constructor(private http: HttpClient) {}

  // Get all jobs
  getAllJobs(): Observable<Job[]> {
    // In a real application, this would make an HTTP request
    // return this.http.get<Job[]>(`${this.API_URL}/jobs`);
    
    // For now, return mock data
    return of(this.mockJobs);
  }

  // Get job by ID
  getJobById(id: string): Observable<Job | null> {
    // In a real application, this would make an HTTP request
    // return this.http.get<Job>(`${this.API_URL}/jobs/${id}`);
    
    // For now, find in mock data
    const job = this.mockJobs.find(job => job.id === id);
    return of(job || null);
  }

  // Get featured jobs
  getFeaturedJobs(): Observable<Job[]> {
    const featuredJobs = this.mockJobs.filter(job => job.featured);
    return of(featuredJobs);
  }

  // Search jobs
  searchJobs(query: string): Observable<Job[]> {
    const filteredJobs = this.mockJobs.filter(job => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.location.toLowerCase().includes(query.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
    );
    return of(filteredJobs);
  }

  // Filter jobs by criteria
  filterJobs(filters: {
    type?: string;
    location?: string;
    experienceLevel?: string;
    salary?: string;
  }): Observable<Job[]> {
    let filteredJobs = [...this.mockJobs];

    if (filters.type) {
      filteredJobs = filteredJobs.filter(job => job.type === filters.type);
    }

    if (filters.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.experienceLevel) {
      filteredJobs = filteredJobs.filter(job => job.experienceLevel === filters.experienceLevel);
    }

    return of(filteredJobs);
  }

  // Apply for job (mock implementation)
  applyForJob(jobId: string, applicationData: any): Observable<boolean> {
    // In a real application, this would submit the application
    // return this.http.post<boolean>(`${this.API_URL}/jobs/${jobId}/apply`, applicationData);
    
    // For now, just return success
    return of(true);
  }
}
