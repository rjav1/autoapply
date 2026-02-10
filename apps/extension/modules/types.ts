/**
 * Extension-specific Types for ATS Modules
 * 
 * Re-exports shared types and adds extension-specific types.
 */

// Re-export all shared types
export type {
  Profile,
  ProfileFormData,
  Address,
  WorkExperience,
  Education,
  WorkAuthorization,
  Demographics,
  Resume,
  Application,
  ApplicationStatus,
  FieldType,
  FieldMapping,
  FillResult,
  ApiResponse
} from "@autoapply/shared"

// Use ProfileFormData as the data we send to fillForm
import type { ProfileFormData } from "@autoapply/shared"
export type ProfileData = ProfileFormData & {
  // Extension can add resume file data for upload
  resume?: {
    fileName: string
    fileUrl?: string
    fileData?: string // Base64 encoded
    mimeType: string
  }
}

/**
 * Module status for display in popup
 */
export interface ModuleStatus {
  state: "idle" | "detecting" | "filling" | "submitting" | "success" | "error" | "manual"
  message: string
  progress?: number // 0-100
  timestamp?: number
}

/**
 * Field detection result from scanning the page
 */
export interface DetectedField {
  element: HTMLElement
  selector: string
  type: FieldType
  label?: string
  required: boolean
  currentValue?: string
  automationId?: string
}

/**
 * Filled field result (extension-specific with success flag)
 */
export interface FilledField {
  selector: string
  profilePath: string
  value: string
  success: true
}

/**
 * Failed field result
 */
export interface FailedField {
  selector: string
  profilePath: string
  reason: string
  success: false
}

/**
 * Field that needs manual intervention
 */
export interface ManualField {
  selector: string
  label: string
  reason: string
  suggestedValue?: string
}

// Import FieldType for use
import type { FieldType } from "@autoapply/shared"
