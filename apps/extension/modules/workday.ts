/**
 * Workday ATS Module
 * 
 * Handles job applications on Workday-powered career sites.
 * Most common ATS for large companies.
 */

import { BaseATSModule, type DetectionResult, type LoginStatus, type SubmitResult } from "./base-module"
import type { ProfileData, FillResult, FieldMapping, DetectedField, FilledField, FailedField, ManualField } from "./types"
import { humanType, humanClick, humanScroll, randomDelay, shortDelay, mediumDelay, removeAutomationFingerprints } from "~lib/evasion"
import { matchField, getProfileValue, formatValueForInput } from "~lib/field-matcher"

/**
 * Workday field selectors mapped to profile data paths
 */
const WORKDAY_FIELD_MAPPINGS: FieldMapping[] = [
  // Personal Info
  {
    selector: '[data-automation-id="legalNameSection_firstName"]',
    automationId: "legalNameSection_firstName",
    profilePath: "firstName",
    type: "text",
    required: true,
    labelVariations: ["First Name", "Given Name", "Legal First Name"]
  },
  {
    selector: '[data-automation-id="legalNameSection_lastName"]',
    automationId: "legalNameSection_lastName",
    profilePath: "lastName",
    type: "text",
    required: true,
    labelVariations: ["Last Name", "Surname", "Family Name", "Legal Last Name"]
  },
  {
    selector: '[data-automation-id="email"]',
    automationId: "email",
    profilePath: "email",
    type: "text",
    required: true,
    labelVariations: ["Email", "Email Address", "E-mail"]
  },
  {
    selector: '[data-automation-id="phone-number"]',
    automationId: "phone-number",
    profilePath: "phone",
    type: "text",
    required: false,
    labelVariations: ["Phone", "Phone Number", "Mobile", "Mobile Phone", "Cell Phone"]
  },
  
  // Address
  {
    selector: '[data-automation-id="addressSection_addressLine1"]',
    automationId: "addressSection_addressLine1",
    profilePath: "address.street",
    type: "text",
    required: false,
    labelVariations: ["Address", "Street Address", "Address Line 1"]
  },
  {
    selector: '[data-automation-id="addressSection_city"]',
    automationId: "addressSection_city",
    profilePath: "address.city",
    type: "text",
    required: false,
    labelVariations: ["City"]
  },
  {
    selector: '[data-automation-id="addressSection_postalCode"]',
    automationId: "addressSection_postalCode",
    profilePath: "address.postalCode",
    type: "text",
    required: false,
    labelVariations: ["Postal Code", "Zip Code", "ZIP"]
  },
  {
    selector: '[data-automation-id="addressSection_countryRegion"]',
    automationId: "addressSection_countryRegion",
    profilePath: "address.state",
    type: "select",
    required: false,
    labelVariations: ["State", "Province", "Region", "State/Province"]
  },
  
  // Links
  {
    selector: '[data-automation-id="linkedinQuestion"]',
    automationId: "linkedinQuestion",
    profilePath: "linkedIn",
    type: "text",
    required: false,
    labelVariations: ["LinkedIn", "LinkedIn URL", "LinkedIn Profile"]
  },
  {
    selector: '[data-automation-id="websiteQuestion"]',
    automationId: "websiteQuestion",
    profilePath: "portfolio",
    type: "text",
    required: false,
    labelVariations: ["Website", "Portfolio", "Personal Website"]
  },
  
  // Resume Upload
  {
    selector: '[data-automation-id="file-upload-input-ref"]',
    automationId: "file-upload-input-ref",
    profilePath: "resume",
    type: "file",
    required: true,
    labelVariations: ["Resume", "CV", "Upload Resume"]
  }
]

/**
 * Additional selectors for page detection
 */
const WORKDAY_DETECTION = {
  // Application form indicators
  applicationIndicators: [
    '[data-automation-id="quickApply"]',
    '[data-automation-id="applicationForm"]',
    '[data-automation-id="legalNameSection"]',
    '[data-automation-id="contactInformationSection"]',
    '[data-automation-id="myExperienceSection"]',
    '[data-automation-id="resumeSection"]',
    '[data-automation-id="questionSection"]',
    '[data-automation-id="bottom-navigation-next-button"]',
    '[data-automation-id="progressBar"]'
  ],
  
  // Job listing indicators (not application)
  listingIndicators: [
    '[data-automation-id="jobPostingHeader"]',
    '[data-automation-id="jobPostingDescription"]',
    '[data-automation-id="jobRequisitionId"]',
    'button[data-automation-id="applyButton"]:not([data-automation-id="bottom-navigation-next-button"])'
  ],
  
  // Login/account page indicators
  loginIndicators: [
    '[data-automation-id="signInContent"]',
    '[data-automation-id="createAccountLink"]',
    '[data-automation-id="signInSubmitButton"]',
    '[data-automation-id="GoogleSignInButton"]',
    '[data-automation-id="SignInWithEmailButton"]',
    '[data-automation-id="email"][type="text"]',
    '[data-automation-id="password"][type="password"]',
    '[data-automation-id="createAccountCheckbox"]'
  ],
  
  // Honeypot fields to NEVER fill (bot detection)
  honeypotSelectors: [
    '[data-automation-id="beecatcher"]',
    'input[name="website"]'
  ],
  
  // URL patterns
  applicationUrlPatterns: [
    /\/job-apply\//i,
    /\/apply\//i,
    /\/staffing\/application/i,
    /\/recruitingPages\//i,
    /\/wday\/cxs\/.*\/apply/i
  ],
  
  listingUrlPatterns: [
    /\/job\/\d+$/i,
    /\/job-listing/i,
    /\/en-US\/job\//i
  ]
}

export class WorkdayModule extends BaseATSModule {
  readonly name = "workday"
  
  readonly urlPatterns = [
    /workday\.com/i,
    /myworkdayjobs\.com/i,
    /wd\d+\.myworkday\.com/i
  ]
  
  private detectedFields: DetectedField[] = []
  
  constructor() {
    super()
    // Remove automation fingerprints on initialization
    removeAutomationFingerprints()
  }
  
  /**
   * Detect if current page is a Workday application
   */
  detect(): DetectionResult {
    const url = window.location.href
    
    if (!this.matchesUrl(url)) {
      return {
        detected: false,
        pageType: "unknown",
        isApplicationPage: false,
        confidence: 0,
        url,
        detectedElements: []
      }
    }
    
    // Score-based detection
    let applicationScore = 0
    let listingScore = 0
    let loginScore = 0
    const detectedElements: string[] = []
    
    // Check URL patterns
    if (WORKDAY_DETECTION.applicationUrlPatterns.some(p => p.test(url))) {
      applicationScore += 3
      detectedElements.push("URL: application pattern")
    }
    if (WORKDAY_DETECTION.listingUrlPatterns.some(p => p.test(url))) {
      listingScore += 3
      detectedElements.push("URL: listing pattern")
    }
    
    // Check DOM elements
    WORKDAY_DETECTION.applicationIndicators.forEach(selector => {
      if (document.querySelector(selector)) {
        applicationScore += 2
        detectedElements.push(`DOM: ${selector}`)
      }
    })
    
    WORKDAY_DETECTION.listingIndicators.forEach(selector => {
      if (document.querySelector(selector)) {
        listingScore += 2
        detectedElements.push(`DOM: ${selector}`)
      }
    })
    
    WORKDAY_DETECTION.loginIndicators.forEach(selector => {
      if (document.querySelector(selector)) {
        loginScore += 2
        detectedElements.push(`DOM: ${selector}`)
      }
    })
    
    // Determine page type
    let pageType: DetectionResult["pageType"] = "unknown"
    let confidence = 0
    
    if (loginScore > applicationScore && loginScore > listingScore) {
      pageType = "login"
      confidence = Math.min(loginScore / 6, 1)
    } else if (applicationScore > listingScore && applicationScore >= 4) {
      pageType = "application"
      confidence = Math.min(applicationScore / 10, 1)
    } else if (listingScore > applicationScore) {
      pageType = "listing"
      confidence = Math.min(listingScore / 8, 1)
    }
    
    // Extract company and job title if possible
    const company = this.extractCompany()
    const jobTitle = this.extractJobTitle()
    
    this.log(`Detected: ${pageType} (confidence: ${confidence.toFixed(2)})`)
    
    return {
      detected: true,
      pageType,
      isApplicationPage: pageType === "application",
      confidence,
      url,
      company,
      jobTitle,
      detectedElements
    }
  }
  
  /**
   * Check login status
   */
  async getLoginStatus(): Promise<LoginStatus> {
    // Check for logged-in indicators
    const userMenu = document.querySelector('[data-automation-id="userMenu"]')
    const signInLink = document.querySelector('[data-automation-id="signInLink"]')
    const createAccountLink = document.querySelector('[data-automation-id="createAccountLink"]')
    
    if (userMenu) {
      // Try to get email from user menu
      const emailElement = document.querySelector('[data-automation-id="userEmail"]')
      return {
        isLoggedIn: true,
        needsAccountCreation: false,
        email: emailElement?.textContent || undefined
      }
    }
    
    if (createAccountLink && !signInLink) {
      return {
        isLoggedIn: false,
        needsAccountCreation: true
      }
    }
    
    return {
      isLoggedIn: false,
      needsAccountCreation: false
    }
  }
  
  /**
   * Fill form with profile data
   */
  async fillForm(profile: ProfileData): Promise<FillResult> {
    const startTime = Date.now()
    this.setStatus("filling", "Filling form fields...")
    
    const filledFields: FilledField[] = []
    const failedFields: FailedField[] = []
    const manualFields: ManualField[] = []
    
    // Detect available fields on the page
    this.detectedFields = await this.detectFields()
    this.log(`Detected ${this.detectedFields.length} fields on page`)
    
    // Fill each mapped field
    for (const mapping of WORKDAY_FIELD_MAPPINGS) {
      const element = document.querySelector(mapping.selector) as HTMLElement
      
      if (!element) {
        if (mapping.required) {
          this.log(`Required field not found: ${mapping.profilePath}`)
        }
        continue
      }
      
      // Get value from profile
      const value = this.getProfileValue(profile, mapping.profilePath)
      
      if (!value && mapping.required) {
        failedFields.push({
          selector: mapping.selector,
          profilePath: mapping.profilePath,
          reason: "Required value missing from profile",
          success: false
        })
        continue
      }
      
      if (!value) continue
      
      try {
        // Scroll to element
        await humanScroll(element)
        await shortDelay()
        
        // Fill based on field type
        const success = await this.fillField(element, mapping, value)
        
        if (success) {
          filledFields.push({
            selector: mapping.selector,
            profilePath: mapping.profilePath,
            value: String(value),
            success: true
          })
        } else {
          failedFields.push({
            selector: mapping.selector,
            profilePath: mapping.profilePath,
            reason: "Failed to fill field",
            success: false
          })
        }
        
        // Delay between fields
        await randomDelay(300, 800)
        
      } catch (err) {
        this.error(`Error filling ${mapping.profilePath}:`, err)
        failedFields.push({
          selector: mapping.selector,
          profilePath: mapping.profilePath,
          reason: String(err),
          success: false
        })
      }
    }
    
    // Try to fill unmapped required fields using smart matching
    const unmappedFields = this.findUnmappedFields()
    this.log(`Found ${unmappedFields.length} unmapped fields, attempting smart match...`)
    
    for (const field of unmappedFields) {
      const result = await this.tryFillUnmappedField(field, profile)
      
      if (result.filled && result.profilePath && result.value) {
        filledFields.push({
          selector: field.selector,
          profilePath: result.profilePath,
          value: result.value,
          success: true
        })
      } else {
        manualFields.push({
          selector: field.selector,
          label: field.label || "Unknown field",
          reason: "Could not auto-match to profile data"
        })
      }
      
      await shortDelay()
    }
    
    const duration = Date.now() - startTime
    const success = failedFields.length === 0 && manualFields.length === 0
    
    this.setStatus(
      success ? "success" : manualFields.length > 0 ? "manual" : "error",
      success 
        ? `Filled ${filledFields.length} fields` 
        : `${failedFields.length} failed, ${manualFields.length} need manual review`
    )
    
    return {
      success,
      filledFields,
      failedFields,
      manualFields,
      duration
    }
  }
  
  /**
   * Submit the application
   */
  async submit(): Promise<SubmitResult> {
    this.setStatus("submitting", "Submitting application...")
    
    // Find submit button
    const submitButton = document.querySelector(
      '[data-automation-id="bottom-navigation-next-button"], ' +
      'button[data-automation-id="submit"], ' +
      'button[type="submit"]'
    ) as HTMLElement
    
    if (!submitButton) {
      return {
        success: false,
        error: "Submit button not found",
        requiredManualIntervention: true
      }
    }
    
    try {
      await humanScroll(submitButton)
      await mediumDelay()
      await humanClick(submitButton)
      
      // Wait for response
      await randomDelay(2000, 4000)
      
      // Check for success indicators
      const successIndicator = document.querySelector(
        '[data-automation-id="confirmationMessage"], ' +
        '[data-automation-id="applicationSubmitted"]'
      )
      
      if (successIndicator) {
        // Try to extract confirmation number
        const confirmationText = successIndicator.textContent || ""
        const confirmationMatch = confirmationText.match(/confirmation[:\s#]*(\w+)/i)
        
        this.setStatus("success", "Application submitted!")
        
        return {
          success: true,
          confirmationNumber: confirmationMatch?.[1],
          redirectUrl: window.location.href,
          requiredManualIntervention: false
        }
      }
      
      // Check for error messages
      const errorIndicator = document.querySelector(
        '[data-automation-id="errorMessage"], ' +
        '.error-message, ' +
        '[role="alert"]'
      )
      
      if (errorIndicator) {
        return {
          success: false,
          error: errorIndicator.textContent || "Unknown error",
          requiredManualIntervention: true
        }
      }
      
      // Unknown state
      return {
        success: false,
        error: "Could not confirm submission",
        requiredManualIntervention: true
      }
      
    } catch (err) {
      this.error("Submit error:", err)
      return {
        success: false,
        error: String(err),
        requiredManualIntervention: true
      }
    }
  }
  
  // --- Private helper methods ---
  
  private async fillField(
    element: HTMLElement, 
    mapping: FieldMapping, 
    value: unknown
  ): Promise<boolean> {
    switch (mapping.type) {
      case "text":
      case "textarea":
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          await humanClick(element)
          await shortDelay()
          await humanType(element, String(value), { clearFirst: true })
          return true
        }
        break
        
      case "select":
        if (element instanceof HTMLSelectElement) {
          await humanClick(element)
          await shortDelay()
          element.value = String(value)
          element.dispatchEvent(new Event("change", { bubbles: true }))
          return true
        }
        // Workday often uses custom dropdowns
        return await this.fillCustomDropdown(element, String(value))
        
      case "checkbox":
        if (element instanceof HTMLInputElement && element.type === "checkbox") {
          if (Boolean(value) !== element.checked) {
            await humanClick(element)
          }
          return true
        }
        break
        
      case "file":
        // File uploads need special handling
        return await this.handleFileUpload(element, value as ProfileData["resume"])
        
      case "date":
        if (element instanceof HTMLInputElement) {
          await humanClick(element)
          await shortDelay()
          await humanType(element, String(value), { clearFirst: true })
          return true
        }
        break
    }
    
    return false
  }
  
  private async fillCustomDropdown(element: HTMLElement, value: string): Promise<boolean> {
    try {
      // Click to open dropdown
      await humanClick(element)
      await shortDelay()
      
      // Look for dropdown options
      const options = document.querySelectorAll(
        '[data-automation-id*="promptOption"], ' +
        '[role="option"], ' +
        '.dropdown-option'
      )
      
      for (const option of options) {
        const optionText = option.textContent?.toLowerCase() || ""
        if (optionText.includes(value.toLowerCase())) {
          await humanClick(option as HTMLElement)
          return true
        }
      }
      
      this.log(`Could not find dropdown option: ${value}`)
      return false
    } catch (err) {
      this.error("Custom dropdown error:", err)
      return false
    }
  }
  
  private async handleFileUpload(element: HTMLElement, resume?: ProfileData["resume"]): Promise<boolean> {
    if (!resume) return false
    
    const input = element.querySelector('input[type="file"]') || element
    if (!(input instanceof HTMLInputElement)) return false
    
    // For now, we can't programmatically upload files in content scripts
    // This needs manual intervention or backend support
    this.log("File upload requires manual intervention")
    return false
  }
  
  private getProfileValue(profile: ProfileData, path: string): unknown {
    const parts = path.split(".")
    let value: unknown = profile
    
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    
    return value
  }
  
  private async detectFields(): Promise<DetectedField[]> {
    const fields: DetectedField[] = []
    
    // Find all input-like elements
    const elements = document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, [role="combobox"], [role="listbox"]'
    )
    
    for (const el of elements) {
      const element = el as HTMLElement
      const automationId = element.getAttribute("data-automation-id") || undefined
      
      fields.push({
        element,
        selector: automationId ? `[data-automation-id="${automationId}"]` : this.generateSelector(element),
        type: this.getFieldType(element),
        label: this.getFieldLabel(element),
        required: element.hasAttribute("required") || element.getAttribute("aria-required") === "true",
        currentValue: (element as HTMLInputElement).value || undefined,
        automationId
      })
    }
    
    return fields
  }
  
  private findUnmappedFields(): DetectedField[] {
    const mappedSelectors = new Set(WORKDAY_FIELD_MAPPINGS.map(m => m.selector))
    const mappedAutomationIds = new Set(WORKDAY_FIELD_MAPPINGS.map(m => m.automationId).filter(Boolean))
    
    return this.detectedFields.filter(f => {
      // Skip honeypot fields
      if (f.automationId === "beecatcher" || f.element.getAttribute("name") === "website") {
        return false
      }
      // Check if it's already mapped
      if (mappedSelectors.has(f.selector)) return false
      if (f.automationId && mappedAutomationIds.has(f.automationId)) return false
      // Only include required fields
      return f.required
    })
  }
  
  /**
   * Try to fill unmapped fields using the smart matcher
   */
  private async tryFillUnmappedField(
    field: DetectedField, 
    profile: ProfileData
  ): Promise<{ filled: boolean; profilePath?: string; value?: string }> {
    // Use the field matcher to find best profile path
    const match = matchField(field, WORKDAY_FIELD_MAPPINGS)
    
    if (match.confidence < 0.6) {
      this.log(`No confident match for field: ${field.label || field.selector} (confidence: ${match.confidence})`)
      return { filled: false }
    }
    
    // Get value from profile
    const value = getProfileValue(profile, match.profilePath)
    if (!value) {
      this.log(`No profile value for matched path: ${match.profilePath}`)
      return { filled: false }
    }
    
    const formattedValue = formatValueForInput(value, field.type)
    
    try {
      await humanScroll(field.element)
      await shortDelay()
      
      const mapping: FieldMapping = {
        selector: field.selector,
        profilePath: match.profilePath,
        type: field.type,
        required: field.required
      }
      
      const success = await this.fillField(field.element, mapping, formattedValue)
      
      if (success) {
        this.log(`Smart-matched and filled: ${field.label} → ${match.profilePath} (${match.matchedBy}, confidence: ${match.confidence})`)
        return { filled: true, profilePath: match.profilePath, value: formattedValue }
      }
    } catch (err) {
      this.error(`Error filling smart-matched field:`, err)
    }
    
    return { filled: false }
  }
  
  private getFieldType(element: HTMLElement): FieldMapping["type"] {
    if (element instanceof HTMLSelectElement) return "select"
    if (element instanceof HTMLTextAreaElement) return "textarea"
    if (element instanceof HTMLInputElement) {
      const type = element.type.toLowerCase()
      if (type === "checkbox") return "checkbox"
      if (type === "radio") return "radio"
      if (type === "file") return "file"
      if (type === "date") return "date"
    }
    if (element.getAttribute("role") === "combobox") return "select"
    return "text"
  }
  
  private getFieldLabel(element: HTMLElement): string | undefined {
    // Check for associated label
    const id = element.id
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label?.textContent) return label.textContent.trim()
    }
    
    // Check aria-label
    const ariaLabel = element.getAttribute("aria-label")
    if (ariaLabel) return ariaLabel
    
    // Check parent label
    const parentLabel = element.closest("label")
    if (parentLabel?.textContent) return parentLabel.textContent.trim()
    
    // Check placeholder
    if (element instanceof HTMLInputElement && element.placeholder) {
      return element.placeholder
    }
    
    return undefined
  }
  
  private generateSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`
    
    const automationId = element.getAttribute("data-automation-id")
    if (automationId) return `[data-automation-id="${automationId}"]`
    
    // Fallback to tag + classes
    let selector = element.tagName.toLowerCase()
    if (element.className) {
      selector += "." + element.className.split(" ").join(".")
    }
    return selector
  }
  
  private extractCompany(): string | undefined {
    // Try various selectors for company name
    const selectors = [
      '[data-automation-id="companyTitle"]',
      '.company-name',
      '[class*="company"]'
    ]
    
    for (const selector of selectors) {
      const el = document.querySelector(selector)
      if (el?.textContent) return el.textContent.trim()
    }
    
    // Try to extract from URL
    const urlMatch = window.location.hostname.match(/([^.]+)\.workday\.com/)
    if (urlMatch) return urlMatch[1]
    
    return undefined
  }
  
  private extractJobTitle(): string | undefined {
    const selectors = [
      '[data-automation-id="jobPostingHeader"]',
      '[data-automation-id="jobTitle"]',
      'h1',
      '.job-title'
    ]
    
    for (const selector of selectors) {
      const el = document.querySelector(selector)
      if (el?.textContent) return el.textContent.trim()
    }
    
    return undefined
  }
}

// Export singleton instance
export const workdayModule = new WorkdayModule()
