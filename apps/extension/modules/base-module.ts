/**
 * Base Module Interface
 * 
 * All ATS modules (Workday, Greenhouse, Oracle) must implement this interface.
 * Each module is responsible for one job site.
 */

import type { ProfileData, FieldMapping, FillResult, ModuleStatus } from "./types"

export interface ATSModule {
  /** Module identifier */
  readonly name: string
  
  /** URL patterns this module handles */
  readonly urlPatterns: RegExp[]
  
  /**
   * Detect if current page is handled by this module
   * @returns Detection result with page type and confidence
   */
  detect(): DetectionResult
  
  /**
   * Check login/account status
   * @returns Whether user is logged in and account state
   */
  getLoginStatus(): Promise<LoginStatus>
  
  /**
   * Fill form fields with profile data
   * @param profile User's profile data
   * @returns Result of fill operation for each field
   */
  fillForm(profile: ProfileData): Promise<FillResult>
  
  /**
   * Submit the application (if auto-submit is enabled)
   * @returns Success/failure of submission
   */
  submit(): Promise<SubmitResult>
  
  /**
   * Get current module status
   * @returns Overall status for display in popup
   */
  getStatus(): ModuleStatus
}

export interface DetectionResult {
  /** Is this module's ATS detected? */
  detected: boolean
  
  /** Type of page */
  pageType: "application" | "listing" | "search" | "login" | "account" | "unknown"
  
  /** Is this an application form page? */
  isApplicationPage: boolean
  
  /** Confidence score 0-1 */
  confidence: number
  
  /** URL that was detected */
  url: string
  
  /** Company name if detected */
  company?: string
  
  /** Job title if detected */
  jobTitle?: string
  
  /** Detected elements that led to this conclusion */
  detectedElements: string[]
}

export interface LoginStatus {
  /** Is user logged in? */
  isLoggedIn: boolean
  
  /** Does user need to create an account? */
  needsAccountCreation: boolean
  
  /** User email if logged in */
  email?: string
  
  /** Any login-related errors */
  error?: string
}

export interface SubmitResult {
  /** Was submission successful? */
  success: boolean
  
  /** Error message if failed */
  error?: string
  
  /** Application confirmation number if provided */
  confirmationNumber?: string
  
  /** Redirect URL after submission */
  redirectUrl?: string
  
  /** Was manual intervention required? */
  requiredManualIntervention: boolean
  
  /** Fields that couldn't be filled automatically */
  manualFields?: string[]
}

/**
 * Base class with common functionality
 */
export abstract class BaseATSModule implements ATSModule {
  abstract readonly name: string
  abstract readonly urlPatterns: RegExp[]
  
  protected currentStatus: ModuleStatus = {
    state: "idle",
    message: "Ready"
  }
  
  /**
   * Check if current URL matches this module's patterns
   */
  protected matchesUrl(url: string = window.location.href): boolean {
    return this.urlPatterns.some(pattern => pattern.test(url))
  }
  
  /**
   * Log with module prefix
   */
  protected log(message: string, ...args: unknown[]): void {
    console.log(`[AutoApply:${this.name}] ${message}`, ...args)
  }
  
  /**
   * Log error with module prefix
   */
  protected error(message: string, ...args: unknown[]): void {
    console.error(`[AutoApply:${this.name}] ${message}`, ...args)
  }
  
  /**
   * Update and return current status
   */
  protected setStatus(state: ModuleStatus["state"], message: string): ModuleStatus {
    this.currentStatus = { state, message, timestamp: Date.now() }
    return this.currentStatus
  }
  
  getStatus(): ModuleStatus {
    return this.currentStatus
  }
  
  // Abstract methods to be implemented by each module
  abstract detect(): DetectionResult
  abstract getLoginStatus(): Promise<LoginStatus>
  abstract fillForm(profile: ProfileData): Promise<FillResult>
  abstract submit(): Promise<SubmitResult>
}
