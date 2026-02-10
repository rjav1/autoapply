/**
 * Shared types and utilities for AutoApply
 * 
 * Used by: Extension, Dashboard, Backend
 */

// ============================================
// User & Authentication
// ============================================

export interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Profile (Mock Form - Fill Once, Apply Forever)
// ============================================

export interface Profile {
  id: string
  userId: string
  
  // Personal Info
  firstName: string
  lastName: string
  preferredName?: string
  email: string
  phone?: string
  
  // Address
  address?: Address
  
  // Links
  linkedIn?: string
  github?: string
  portfolio?: string
  otherLinks?: string[]
  
  // Work Experience
  workExperience: WorkExperience[]
  
  // Education
  education: Education[]
  
  // Skills
  skills?: string[]
  
  // Work Authorization
  workAuthorization?: WorkAuthorization
  
  // Demographics (EEO - optional)
  demographics?: Demographics
  
  // Custom fields for site-specific questions
  customFields?: Record<string, string>
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface WorkExperience {
  id?: string
  company: string
  title: string
  location?: string
  startDate: string // YYYY-MM format
  endDate?: string // YYYY-MM format or null if current
  current: boolean
  description?: string
  highlights?: string[]
}

export interface Education {
  id?: string
  school: string
  degree: string // e.g., "Bachelor of Science"
  fieldOfStudy: string // e.g., "Computer Science"
  startDate?: string
  endDate?: string // Graduation date
  current: boolean
  gpa?: string
  honors?: string
}

export interface WorkAuthorization {
  authorizedToWork: boolean
  requiresSponsorship: boolean
  visaType?: string
  visaExpiration?: string
}

export interface Demographics {
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say'
  ethnicity?: string
  veteranStatus?: 'veteran' | 'not-veteran' | 'prefer-not-to-say'
  disabilityStatus?: 'yes' | 'no' | 'prefer-not-to-say'
}

// ============================================
// Resume
// ============================================

export interface Resume {
  id: string
  userId: string
  name: string // Display name, e.g., "Main Resume"
  fileName: string
  fileUrl: string
  mimeType: 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  uploadedAt: Date
  isDefault: boolean
  
  // Parsed content (optional)
  parsedContent?: {
    text: string
    skills?: string[]
    experience?: WorkExperience[]
    education?: Education[]
  }
}

// ============================================
// Applications
// ============================================

export type ApplicationStatus = 
  | 'draft'
  | 'in-progress'
  | 'submitted'
  | 'viewed'
  | 'rejected'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'withdrawn'

export interface Application {
  id: string
  userId: string
  
  // Job Info
  jobUrl: string
  company: string
  title: string
  location?: string
  salary?: string
  
  // Application State
  status: ApplicationStatus
  platform: 'workday' | 'greenhouse' | 'oracle' | 'lever' | 'other'
  
  // Resume used
  resumeId?: string
  resumeVersion?: string // For tailored resumes
  
  // Tracking
  appliedAt?: Date
  lastUpdatedAt: Date
  
  // Notes
  notes?: string
  
  // For debugging/support
  fillResult?: {
    success: boolean
    filledFields: number
    failedFields: number
    manualFields: string[]
    duration: number
  }
}

// ============================================
// Extension <-> Dashboard Communication
// ============================================

export interface SyncRequest {
  type: 'get-profile' | 'get-resume' | 'log-application'
  userId?: string
  data?: unknown
}

export interface SyncResponse {
  success: boolean
  data?: unknown
  error?: string
}

// ============================================
// Form Field Types (for extension)
// ============================================

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date'

export interface FieldMapping {
  selector: string
  automationId?: string
  profilePath: string // Path in Profile object, e.g., "address.city"
  type: FieldType
  required: boolean
  labelVariations?: string[]
}

export interface FillResult {
  success: boolean
  filledFields: Array<{
    selector: string
    profilePath: string
    value: string
  }>
  failedFields: Array<{
    selector: string
    profilePath: string
    reason: string
  }>
  manualFields: Array<{
    selector: string
    label: string
    reason: string
  }>
  duration: number
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Profile data for form filling (subset of full Profile) */
export type ProfileFormData = Pick<Profile, 
  | 'firstName' 
  | 'lastName' 
  | 'email' 
  | 'phone' 
  | 'address' 
  | 'linkedIn' 
  | 'github' 
  | 'portfolio'
  | 'workExperience'
  | 'education'
  | 'workAuthorization'
  | 'demographics'
  | 'customFields'
>
