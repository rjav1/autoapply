import { useState, useEffect } from "react"

interface TabState {
  platform: string | null
  isApplicationPage: boolean
  pageType: string
  url: string
  confidence: number
}

function IndexPopup() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [tabState, setTabState] = useState<TabState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current tab's detection state from background
    chrome.runtime.sendMessage({ type: "GET_TAB_STATE" }, (state: TabState | null) => {
      setTabState(state)
      setLoading(false)
    })

    // Load enabled state
    chrome.storage.local.get(["enabled"], (result) => {
      setIsEnabled(result.enabled ?? false)
    })
  }, [])

  const toggleEnabled = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    chrome.storage.local.set({ enabled: newState })
    
    // If enabling on application page, trigger autofill
    if (newState && tabState?.isApplicationPage) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "RE_DETECT" })
        }
      })
    }
  }

  const triggerFill = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.storage.local.get(["profile"], (result) => {
          if (result.profile) {
            chrome.tabs.sendMessage(tabs[0].id!, { 
              type: "AUTOFILL", 
              profile: result.profile 
            })
          } else {
            alert("No profile saved. Please set up your profile in the dashboard first.")
          }
        })
      }
    })
  }

  const getStatusText = () => {
    if (loading) return "Checking..."
    if (!tabState) return "Not on a supported site"
    if (tabState.isApplicationPage) return `${tabState.platform} application detected`
    if (tabState.pageType === "listing") return `${tabState.platform} job listing`
    if (tabState.pageType === "search") return `${tabState.platform} job search`
    return `On ${tabState.platform}`
  }

  const getStatusColor = () => {
    if (!tabState) return "#f5f5f5"
    if (tabState.isApplicationPage) return "#e8f5e9"
    return "#fff3e0"
  }

  const isOnApplicationPage = tabState?.isApplicationPage ?? false

  return (
    <div style={{
      width: 320,
      padding: 16,
      fontFamily: "system-ui, sans-serif"
    }}>
      <h1 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        🚀 AutoApply
      </h1>
      
      {/* Status Card */}
      <div style={{
        padding: 12,
        borderRadius: 8,
        backgroundColor: getStatusColor(),
        marginBottom: 12
      }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Status</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{getStatusText()}</div>
        {tabState?.confidence && tabState.confidence > 0 && (
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
            Confidence: {Math.round(tabState.confidence * 100)}%
          </div>
        )}
      </div>

      {/* Enable Toggle */}
      <button
        onClick={toggleEnabled}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          backgroundColor: isEnabled ? "#ef5350" : "#4caf50",
          color: "white",
          marginBottom: 8
        }}
      >
        {isEnabled ? "Disable AutoFill" : "Enable AutoFill"}
      </button>

      {/* Manual Fill Button (only on application pages) */}
      {isOnApplicationPage && (
        <button
          onClick={triggerFill}
          disabled={!isEnabled}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            border: "1px solid #2196f3",
            cursor: isEnabled ? "pointer" : "not-allowed",
            backgroundColor: isEnabled ? "#2196f3" : "#e0e0e0",
            color: isEnabled ? "white" : "#999",
          }}
        >
          Fill Form Now
        </button>
      )}

      {/* Help text */}
      {!isOnApplicationPage && (
        <p style={{ 
          fontSize: 12, 
          color: "#999", 
          marginTop: 12,
          textAlign: "center"
        }}>
          Navigate to a Workday job application to use AutoApply
        </p>
      )}

      {/* Debug info */}
      {tabState && (
        <details style={{ marginTop: 12, fontSize: 11, color: "#999" }}>
          <summary style={{ cursor: "pointer" }}>Debug Info</summary>
          <pre style={{ 
            marginTop: 4, 
            padding: 8, 
            backgroundColor: "#f5f5f5", 
            borderRadius: 4,
            overflow: "auto",
            maxHeight: 100
          }}>
            {JSON.stringify(tabState, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default IndexPopup
