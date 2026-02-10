/**
 * Workday Content Script
 * 
 * Entry point for Workday ATS automation.
 * Uses the Workday module for detection and form filling.
 */

import type { PlasmoCSConfig } from "plasmo"
import { workdayModule } from "~modules/workday"
import type { ProfileData } from "~modules/types"

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
  all_frames: false,
  run_at: "document_idle"
}

// Current detection state
let lastDetection = workdayModule.detect()
let lastUrl = window.location.href

/**
 * Send detection result to background script
 */
function notifyDetection() {
  const detection = workdayModule.detect()
  lastDetection = detection
  
  console.log("[AutoApply:Workday] Page detected:", {
    pageType: detection.pageType,
    isApplication: detection.isApplicationPage,
    confidence: detection.confidence.toFixed(2),
    company: detection.company,
    jobTitle: detection.jobTitle
  })

  chrome.runtime.sendMessage({
    type: "PAGE_DETECTED",
    platform: "workday",
    ...detection
  }).catch(err => {
    console.log("[AutoApply:Workday] Could not notify background:", err.message)
  })
}

/**
 * Watch for SPA navigation
 */
function watchNavigation() {
  let debounceTimer: number | null = null
  
  const checkNavigation = () => {
    const currentUrl = window.location.href
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl
      
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        // Wait for Workday to load new content
        setTimeout(notifyDetection, 1500)
      }, 500)
    }
  }

  // Override history methods
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

  window.addEventListener("popstate", checkNavigation)

  // Also watch DOM changes
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      checkNavigation()
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Handle messages from popup/background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "AUTOFILL":
      handleAutoFill(message.profile)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true

    case "GET_PAGE_STATUS":
      sendResponse({
        detection: lastDetection,
        status: workdayModule.getStatus()
      })
      return false

    case "RE_DETECT":
      notifyDetection()
      sendResponse(lastDetection)
      return false
      
    case "SUBMIT":
      handleSubmit()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true
  }
})

/**
 * Handle autofill request
 */
async function handleAutoFill(profile: ProfileData) {
  if (!lastDetection.isApplicationPage) {
    return { 
      success: false, 
      error: "Not on an application page",
      pageType: lastDetection.pageType
    }
  }

  console.log("[AutoApply:Workday] Starting autofill...")
  
  try {
    const result = await workdayModule.fillForm(profile)
    
    console.log("[AutoApply:Workday] Fill result:", {
      success: result.success,
      filled: result.filledFields.length,
      failed: result.failedFields.length,
      manual: result.manualFields.length,
      duration: `${result.duration}ms`
    })
    
    return result
  } catch (error) {
    console.error("[AutoApply:Workday] Fill error:", error)
    throw error
  }
}

/**
 * Handle submit request
 */
async function handleSubmit() {
  if (!lastDetection.isApplicationPage) {
    return {
      success: false,
      error: "Not on an application page",
      requiredManualIntervention: true
    }
  }
  
  console.log("[AutoApply:Workday] Submitting application...")
  return workdayModule.submit()
}

/**
 * Initialize
 */
function initialize() {
  console.log("[AutoApply:Workday] Content script initializing...")
  
  // Initial detection (wait for page to stabilize)
  setTimeout(() => {
    notifyDetection()
    
    // Auto-fill if enabled and on application page
    if (lastDetection.isApplicationPage) {
      chrome.storage.local.get(["enabled", "profile"], (data) => {
        if (data.enabled && data.profile) {
          console.log("[AutoApply:Workday] Auto-fill enabled, filling form...")
          handleAutoFill(data.profile)
        }
      })
    }
  }, 2000)
  
  // Watch for navigation
  watchNavigation()
}

initialize()
