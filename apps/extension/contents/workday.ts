import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.workday.com/*"],
  all_frames: true
}

// Workday form field selectors (may need updates as Workday changes)
const FIELD_SELECTORS = {
  firstName: '[data-automation-id="legalNameSection_firstName"]',
  lastName: '[data-automation-id="legalNameSection_lastName"]',
  email: '[data-automation-id="email"]',
  phone: '[data-automation-id="phone-number"]',
  address: '[data-automation-id="addressSection_addressLine1"]',
  city: '[data-automation-id="addressSection_city"]',
  postalCode: '[data-automation-id="addressSection_postalCode"]',
  // Resume upload
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

async function fillField(selector: string, value: string | undefined) {
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

async function autoFillWorkday(profile: ProfileData) {
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
  return results
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTOFILL") {
    autoFillWorkday(message.profile)
      .then(results => sendResponse({ success: true, results }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // Keep channel open for async response
  }
})

// Check if enabled and auto-fill on page load
chrome.storage.local.get(["enabled", "profile"], (result) => {
  if (result.enabled && result.profile) {
    // Wait for Workday's dynamic content to load
    setTimeout(() => {
      autoFillWorkday(result.profile)
    }, 2000)
  }
})

console.log("[AutoApply] Workday content script loaded")
