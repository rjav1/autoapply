/**
 * Workday Page Detection Utilities
 * 
 * Detects whether current page is a job application form vs just a job listing.
 */

export interface PageDetectionResult {
  platform: "workday"
  isApplicationPage: boolean
  pageType: "application" | "listing" | "search" | "unknown"
  url: string
  confidence: number // 0-1
  detectedElements: string[]
}

// URL patterns that indicate application pages
const APPLICATION_URL_PATTERNS = [
  /\/job-apply\//i,
  /\/apply\//i,
  /\/wd\d+\/job-posting/i,
  /\/staffing\/application/i,
  /\/recruitingPages\//i,
]

// URL patterns that indicate job listing/search pages
const LISTING_URL_PATTERNS = [
  /\/job\/\d+$/i,
  /\/job-listing/i,
  /\/search-results/i,
  /\/jobs\/?$/i,
  /\/careers\/?$/i,
]

// DOM elements that indicate an application form
const APPLICATION_FORM_SELECTORS = [
  '[data-automation-id="legalNameSection_firstName"]',
  '[data-automation-id="email"]',
  '[data-automation-id="phone-number"]',
  '[data-automation-id="file-upload-input-ref"]',
  '[data-automation-id="resumeAttachment"]',
  '[data-automation-id="workExperienceSection"]',
  '[data-automation-id="educationSection"]',
  '[data-automation-id="addressSection"]',
  'form[data-automation-id="quickApply"]',
  'form[data-automation-id="applicationForm"]',
  '[data-automation-id="applyButton"]',
  // Generic form indicators
  'button[data-automation-id="bottom-navigation-next-button"]',
  '[data-automation-id="progressBar"]',
]

// DOM elements that indicate a job listing page
const LISTING_PAGE_SELECTORS = [
  '[data-automation-id="jobPostingHeader"]',
  '[data-automation-id="jobPostingDescription"]',
  'button[data-automation-id="applyButton"]:not(form *)', // Apply button NOT inside a form
  '[data-automation-id="jobRequisitionId"]',
]

/**
 * Check if URL matches application patterns
 */
function checkUrlPatterns(url: string): { isApplication: boolean; isListing: boolean } {
  const isApplication = APPLICATION_URL_PATTERNS.some(pattern => pattern.test(url))
  const isListing = LISTING_URL_PATTERNS.some(pattern => pattern.test(url))
  return { isApplication, isListing }
}

/**
 * Check DOM for application form elements
 */
function checkDomElements(): { formElements: string[]; listingElements: string[] } {
  const formElements: string[] = []
  const listingElements: string[] = []

  APPLICATION_FORM_SELECTORS.forEach(selector => {
    if (document.querySelector(selector)) {
      formElements.push(selector)
    }
  })

  LISTING_PAGE_SELECTORS.forEach(selector => {
    if (document.querySelector(selector)) {
      listingElements.push(selector)
    }
  })

  return { formElements, listingElements }
}

/**
 * Main detection function
 */
export function detectWorkdayPage(): PageDetectionResult {
  const url = window.location.href
  const urlCheck = checkUrlPatterns(url)
  const domCheck = checkDomElements()

  let pageType: PageDetectionResult["pageType"] = "unknown"
  let isApplicationPage = false
  let confidence = 0

  // Scoring logic
  let applicationScore = 0
  let listingScore = 0

  // URL patterns
  if (urlCheck.isApplication) applicationScore += 3
  if (urlCheck.isListing) listingScore += 3

  // DOM elements (weighted higher - more reliable)
  applicationScore += domCheck.formElements.length * 2
  listingScore += domCheck.listingElements.length * 2

  // Determine page type
  if (applicationScore > listingScore && applicationScore >= 4) {
    pageType = "application"
    isApplicationPage = true
    confidence = Math.min(applicationScore / 10, 1)
  } else if (listingScore > applicationScore && listingScore >= 2) {
    pageType = "listing"
    isApplicationPage = false
    confidence = Math.min(listingScore / 8, 1)
  } else if (url.includes("search") || url.includes("jobs")) {
    pageType = "search"
    isApplicationPage = false
    confidence = 0.5
  }

  return {
    platform: "workday",
    isApplicationPage,
    pageType,
    url,
    confidence,
    detectedElements: isApplicationPage ? domCheck.formElements : domCheck.listingElements,
  }
}

/**
 * Wait for Workday's dynamic content to load
 */
export function waitForWorkdayContent(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    // Check if key elements are already present
    const hasContent = document.querySelector('[data-automation-id]')
    if (hasContent) {
      resolve()
      return
    }

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector('[data-automation-id]')) {
        obs.disconnect()
        resolve()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect()
      resolve()
    }, timeoutMs)
  })
}

/**
 * Watch for SPA navigation changes
 */
export function watchForNavigation(callback: (result: PageDetectionResult) => void): () => void {
  let lastUrl = window.location.href
  let debounceTimer: number | null = null

  const checkNavigation = () => {
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      
      // Debounce to avoid multiple rapid calls
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(async () => {
        await waitForWorkdayContent(3000)
        const result = detectWorkdayPage()
        callback(result)
      }, 500)
    }
  }

  // Watch for URL changes via history API
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function(...args) {
    originalPushState.apply(this, args)
    checkNavigation()
  }

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args)
    checkNavigation()
  }

  // Also watch for popstate (back/forward)
  window.addEventListener("popstate", checkNavigation)

  // Watch for DOM changes that might indicate page change
  const domObserver = new MutationObserver(() => {
    // Check if URL changed (some SPAs don't use history API properly)
    if (window.location.href !== lastUrl) {
      checkNavigation()
    }
  })

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Return cleanup function
  return () => {
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
    window.removeEventListener("popstate", checkNavigation)
    domObserver.disconnect()
    if (debounceTimer) clearTimeout(debounceTimer)
  }
}
