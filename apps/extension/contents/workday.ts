import type { PlasmoCSConfig } from "plasmo"
import { 
  detectWorkdayPage, 
  waitForWorkdayContent, 
  watchForNavigation,
  type PageDetectionResult 
} from "~lib/detection"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.workday.com/*",
    "https://*.myworkdayjobs.com/*",
    "https://*.wd1.myworkday.com/*",
    "https://*.wd2.myworkday.com/*",
    "https://*.wd3.myworkday.com/*",
    "https://*.wd4.myworkday.com/*",
    "https://*.wd5.myworkday.com/*",
  ],
  all_frames: false, // Only run in main frame
  run_at: "document_idle"
}

// Workday form field selectors
const FIELD_SELECTORS = {
  firstName: '[data-automation-id="legalNameSection_firstName"]',
  lastName: '[data-automation-id="legalNameSection_lastName"]',
  email: '[data-automation-id="email"]',
  phone: '[data-automation-id="phone-number"]',
  address: '[data-automation-id="addressSection_addressLine1"]',
  city: '[data-automation-id="addressSection_city"]',
  postalCode: '[data-automation-id="addressSection_postalCode"]',
  resumeUpload: '[data-automation-id="file-upload-input-ref"]'
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
}

// Current page detection state
let currentDetection: PageDetectionResult | null = null

/**
 * Send detection result to background script
 */
function notifyDetection(result: PageDetectionResult) {
  currentDetection = result
  
  console.log(`[AutoApply] Page detected:`, {
    type: result.pageType,
    isApplication: result.isApplicationPage,
    confidence: result.confidence,
    elements: result.detectedElements.length
  })

  chrome.runtime.sendMessage({
    type: "PAGE_DETECTED",
    ...result
  }).catch(err => {
    // Background might not be ready yet
    console.log("[AutoApply] Could not notify background:", err.message)
  })
}

/**
 * Fill a single form field
 */
async function fillField(selector: string, value: string | undefined): Promise<boolean> {
  if (!value) return false
  
  const element = document.querySelector(selector) as HTMLInputElement
  if (!element) return false

  // Focus and fill
  element.focus()
  element.value = value
  
  // Dispatch events to trigger Workday's React handlers
  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
  element.dispatchEvent(new Event("blur", { bubbles: true }))
  
  return true
}

/**
 * Auto-fill all detected Workday form fields
 */
async function autoFillWorkday(profile: ProfileData) {
  if (!currentDetection?.isApplicationPage) {
    console.log("[AutoApply] Not on application page, skipping autofill")
    return { success: false, reason: "not_application_page" }
  }

  console.log("[AutoApply] Starting Workday autofill...")
  
  const results = {
    firstName: await fillField(FIELD_SELECTORS.firstName, profile.firstName),
    lastName: await fillField(FIELD_SELECTORS.lastName, profile.lastName),
    email: await fillField(FIELD_SELECTORS.email, profile.email),
    phone: await fillField(FIELD_SELECTORS.phone, profile.phone),
    address: await fillField(FIELD_SELECTORS.address, profile.address),
    city: await fillField(FIELD_SELECTORS.city, profile.city),
    postalCode: await fillField(FIELD_SELECTORS.postalCode, profile.postalCode)
  }

  const filled = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length
  
  console.log(`[AutoApply] Filled ${filled}/${total} fields`)
  
  return { success: true, filled, total, results }
}

/**
 * Handle messages from popup/background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "AUTOFILL":
      autoFillWorkday(message.profile)
        .then(results => sendResponse(results))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Keep channel open for async response

    case "GET_PAGE_STATUS":
      sendResponse(currentDetection)
      return false

    case "RE_DETECT":
      waitForWorkdayContent(2000).then(() => {
        const result = detectWorkdayPage()
        notifyDetection(result)
        sendResponse(result)
      })
      return true
  }
})

/**
 * Initialize detection on page load
 */
async function initialize() {
  console.log("[AutoApply] Workday content script initializing...")

  // Wait for Workday's dynamic content
  await waitForWorkdayContent(5000)

  // Initial detection
  const result = detectWorkdayPage()
  notifyDetection(result)

  // Watch for SPA navigation
  const cleanup = watchForNavigation((newResult) => {
    notifyDetection(newResult)
    
    // Auto-fill if enabled and on application page
    if (newResult.isApplicationPage) {
      chrome.storage.local.get(["enabled", "profile"], (data) => {
        if (data.enabled && data.profile) {
          setTimeout(() => autoFillWorkday(data.profile), 1000)
        }
      })
    }
  })

  // Cleanup on unload
  window.addEventListener("unload", cleanup)

  // Auto-fill if already enabled and on application page
  if (result.isApplicationPage) {
    chrome.storage.local.get(["enabled", "profile"], (data) => {
      if (data.enabled && data.profile) {
        setTimeout(() => autoFillWorkday(data.profile), 1000)
      }
    })
  }
}

// Start initialization
initialize()
