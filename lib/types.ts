export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  city?: string; // Extracted city for filtering
  jobUrl: string;
  postedTime: string;
  employmentType: string;
  seniorityLevel?: string;
  description?: string;
  salary?: string;
  applicants?: string;
  skills?: string[];
  scrapedAt: string;
}

export type JobTypeFilter =
  | ""
  | "I" // Internship
  | "F" // Full-time
  | "P" // Part-time
  | "C" // Contract
  | "T" // Temporary
  | "V" // Volunteer
  | "O"; // Other

export type TimeFilter =
  | ""
  | "r21600"   // Past 6 hours
  | "r43200"   // Past 12 hours
  | "r86400"   // Past 24 hours
  | "r172800"  // Past 2 days
  | "r604800"  // Past week
  | "r2592000"; // Past month

export type ExperienceLevel =
  | ""
  | "1" // Internship
  | "2" // Entry level
  | "3" // Associate
  | "4" // Mid-Senior level
  | "5" // Director
  | "6"; // Executive

export type WorkType =
  | ""
  | "1" // On-site
  | "2" // Remote
  | "3"; // Hybrid

export interface ScrapeRequest {
  keywords: string;
  location: string;
  jobType: JobTypeFilter;
  timePosted: TimeFilter;
  experienceLevel: ExperienceLevel;
  workType: WorkType;
  maxResults?: number;
  strictTitle?: boolean;
}

export interface ScrapeJob {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  request: ScrapeRequest;
  results: JobListing[];
  error?: string;
  createdAt: string;
  completedAt?: string;
  progress: number; // 0-100
}

export const JOB_TYPE_LABELS: Record<JobTypeFilter, string> = {
  "": "All Types",
  I: "Internship",
  F: "Full-time",
  P: "Part-time",
  C: "Contract",
  T: "Temporary",
  V: "Volunteer",
  O: "Other",
};

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  "": "Any time",
  r21600: "Past 6 hours",
  r43200: "Past 12 hours",
  r86400: "Past 24 hours",
  r172800: "Past 2 days",
  r604800: "Past week",
  r2592000: "Past month",
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  "": "Any Level",
  "1": "Internship",
  "2": "Entry Level",
  "3": "Associate",
  "4": "Mid-Senior Level",
  "5": "Director",
  "6": "Executive",
};

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  "": "Any Workplace",
  "1": "On-site",
  "2": "Remote",
  "3": "Hybrid",
};
