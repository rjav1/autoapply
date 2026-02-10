// Shared types and utilities for AutoApply

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  workHistory: WorkExperience[];
  education: Education[];
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  graduationDate: string;
}

export interface Application {
  id: string;
  userId: string;
  jobUrl: string;
  company: string;
  title: string;
  status: 'draft' | 'submitted' | 'rejected' | 'interview' | 'offer';
  appliedAt: Date;
}

export type { User as UserType };
