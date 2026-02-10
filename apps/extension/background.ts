// AutoApply Background Service Worker

export {}

// Track current page detection per tab
interface TabState {
  platform: string | null
  isApplicationPage: boolean
  pageType: string
  url: string
  confidence: number
  lastUpdated: number
}

const tabStates = new Map<number, TabState>()

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
  const tabId = sender.tab?.id

  switch (message.type) {
    case "PAGE_DETECTED":
      // Store detection result for this tab
      if (tabId) {
        tabStates.set(tabId, {
          platform: message.platform,
          isApplicationPage: message.isApplicationPage,
          pageType: message.pageType,
          url: message.url,
          confidence: message.confidence,
          lastUpdated: Date.now()
        })
        console.log(`[AutoApply] Tab ${tabId} detected:`, message.pageType, message.isApplicationPage)
        
        // Update badge to show status
        chrome.action.setBadgeText({
          tabId,
          text: message.isApplicationPage ? "ON" : ""
        })
        chrome.action.setBadgeBackgroundColor({
          tabId,
          color: message.isApplicationPage ? "#4caf50" : "#999"
        })
      }
      sendResponse({ received: true })
      return false

    case "GET_TAB_STATE":
      // Get detection state for current tab (called by popup)
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0]?.id
        if (currentTabId) {
          sendResponse(tabStates.get(currentTabId) || null)
        } else {
          sendResponse(null)
        }
      })
      return true

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
      console.log("[AutoApply] Unknown message type:", message.type)
      sendResponse({ error: "Unknown message type" })
  }
})

// Clean up tab state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId)
})

// Track navigation for supported ATS platforms
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return // Only main frame
  
  const url = details.url
  const isWorkday = url.includes("workday.com") || url.includes("myworkdayjobs.com")
  const isGreenhouse = url.includes("greenhouse.io") || url.includes("boards.greenhouse.io")
  
  if (isWorkday || isGreenhouse) {
    console.log("[AutoApply] ATS page loaded:", url)
  }
})

console.log("[AutoApply] Background service worker started")
