// AutoApply Background Service Worker

export {}

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[AutoApply] Extension installed:", details.reason)
  
  // Set default state
  chrome.storage.local.set({
    enabled: false,
    profile: null
  })
})

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_PROFILE":
      chrome.storage.local.get(["profile"], (result) => {
        sendResponse(result.profile || null)
      })
      return true

    case "SET_PROFILE":
      chrome.storage.local.set({ profile: message.profile }, () => {
        sendResponse({ success: true })
      })
      return true

    case "GET_STATUS":
      chrome.storage.local.get(["enabled", "profile"], (result) => {
        sendResponse({
          enabled: result.enabled || false,
          hasProfile: !!result.profile
        })
      })
      return true

    default:
      sendResponse({ error: "Unknown message type" })
  }
})

// Track applications
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.includes("workday.com") || details.url.includes("greenhouse.io")) {
    console.log("[AutoApply] ATS page loaded:", details.url)
  }
})

console.log("[AutoApply] Background service worker started")
