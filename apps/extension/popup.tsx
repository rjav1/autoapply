import { useState, useEffect } from "react"

function IndexPopup() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [status, setStatus] = useState("Ready")
  const [currentSite, setCurrentSite] = useState<string | null>(null)

  useEffect(() => {
    // Check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url
      if (url) {
        if (url.includes("workday.com")) {
          setCurrentSite("Workday")
          setStatus("Workday detected")
        } else if (url.includes("greenhouse.io")) {
          setCurrentSite("Greenhouse")
          setStatus("Greenhouse detected")
        } else {
          setCurrentSite(null)
          setStatus("No supported ATS detected")
        }
      }
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
    
    if (newState && currentSite) {
      setStatus(`AutoFill active on ${currentSite}`)
    } else {
      setStatus("AutoFill disabled")
    }
  }

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
      
      <div style={{
        padding: 12,
        borderRadius: 8,
        backgroundColor: currentSite ? "#e8f5e9" : "#f5f5f5",
        marginBottom: 12
      }}>
        <div style={{ fontSize: 14, color: "#666" }}>Status</div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{status}</div>
      </div>

      <button
        onClick={toggleEnabled}
        disabled={!currentSite}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: 8,
          border: "none",
          cursor: currentSite ? "pointer" : "not-allowed",
          backgroundColor: isEnabled ? "#ef5350" : "#4caf50",
          color: "white",
          opacity: currentSite ? 1 : 0.5
        }}
      >
        {isEnabled ? "Disable AutoFill" : "Enable AutoFill"}
      </button>

      {!currentSite && (
        <p style={{ 
          fontSize: 12, 
          color: "#999", 
          marginTop: 12,
          textAlign: "center"
        }}>
          Navigate to a Workday or Greenhouse job application to use AutoApply
        </p>
      )}
    </div>
  )
}

export default IndexPopup
