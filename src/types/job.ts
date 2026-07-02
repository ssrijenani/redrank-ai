export type JobStatus = "draft" | "active" | "closed";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Internship";
  description: string;
  status: JobStatus;
  candidateCount: number;
  /** Owning department — used for Analytics filtering. */
  department: string;
  /** Recruiter of record for this job — used for Analytics filtering. */
  recruiterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobSummary {
  id: string;
  title: string;
  status: JobStatus;
  candidateCount: number;
  avgScore: number;
  updatedAt: string;
}
