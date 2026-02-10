/**
 * Shared Types for ATS Modules
 */

/**
 * User profile data for form filling
 * This is the "Mock Form" data - fill once, apply forever
 */
export interface ProfileData {
  // Personal Info
  firstName: string
  lastName: string
  email: string
  phone?: string
  
  // Address
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  // Education (can have multiple)
  education?: EducationEntry[]
  
  // Work Experience (can have multiple)
  workExperience?: WorkExperienceEntry[]
  
  // Links
  linkedIn?: string
  github?: string
  portfolio?: string
  
  // Work Authorization
  workAuthorization?: {
    authorized: boolean
    requiresSponsorship: boolean
    visaType?: string
  }
  
  // Demographics (optional, for EEO questions)
  demographics?: {
    gender?: string
    ethnicity?: string
    veteranStatus?: string
    disabilityStatus?: string
  }
  
  // Resume
  resume?: {
    fileName: string
    fileUrl?: string
    fileData?: string // Base64 encoded
    mimeType: string
  }
  
  // Custom fields for site-specific questions
  customFields?: Record<string, string>
}

export interface EducationEntry {
  school: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate?: string
  gpa?: string
  current: boolean
}

export interface WorkExperienceEntry {
  company: string
  title: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

/**
 * Mapping between form field and profile data
 */
export interface FieldMapping {
  /** CSS selector for the field */
  selector: string
  
  /** Data-automation-id (for Workday) */
  automationId?: string
  
  /** Path to value in ProfileData (e.g., "address.city") */
  profilePath: string
  
  /** Field type */
  type: "text" | "select" | "checkbox" | "radio" | "file" | "date" | "textarea"
  
  /** Is this field required? */
  required: boolean
  
  /** Label variations this field might have */
  labelVariations?: string[]
  
  /** Transform function for the value */
  transform?: (value: unknown) => unknown
}

/**
 * Result of filling a form
 */
export interface FillResult {
  /** Overall success */
  success: boolean
  
  /** Fields that were filled */
  filledFields: FilledField[]
  
  /** Fields that failed to fill */
  failedFields: FailedField[]
  
  /** Fields that need manual intervention */
  manualFields: ManualField[]
  
  /** Total fill time in ms */
  duration: number
}

export interface FilledField {
  selector: string
  profilePath: string
  value: string
  success: true
}

export interface FailedField {
  selector: string
  profilePath: string
  reason: string
  success: false
}

export interface ManualField {
  selector: string
  label: string
  reason: string
  suggestedValue?: string
}

/**
 * Module status for display
 */
export interface ModuleStatus {
  state: "idle" | "detecting" | "filling" | "submitting" | "success" | "error" | "manual"
  message: string
  progress?: number // 0-100
  timestamp?: number
}

/**
 * Field detection result
 */
export interface DetectedField {
  element: HTMLElement
  selector: string
  type: FieldMapping["type"]
  label?: string
  required: boolean
  currentValue?: string
  automationId?: string
}
