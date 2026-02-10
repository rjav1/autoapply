/**
 * Bot Evasion Utilities
 * 
 * Human-like behavior simulation to avoid bot detection.
 * CRITICAL for Workday and other ATS systems.
 */

/**
 * Random delay between min and max milliseconds
 */
export function randomDelay(minMs: number = 500, maxMs: number = 2000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Short delay for between-field actions
 */
export function shortDelay(): Promise<void> {
  return randomDelay(200, 800)
}

/**
 * Medium delay for page transitions
 */
export function mediumDelay(): Promise<void> {
  return randomDelay(500, 1500)
}

/**
 * Long delay for form submissions
 */
export function longDelay(): Promise<void> {
  return randomDelay(1500, 3000)
}

/**
 * Human-like typing speed (ms per character)
 */
function getTypingDelay(): number {
  // Base: 50-150ms per char with occasional longer pauses
  const base = Math.floor(Math.random() * 100) + 50
  
  // 10% chance of a longer pause (thinking)
  if (Math.random() < 0.1) {
    return base + Math.floor(Math.random() * 300) + 200
  }
  
  return base
}

/**
 * Type text character by character with human-like delays
 */
export async function humanType(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: { 
    clearFirst?: boolean
    simulateTypos?: boolean 
  } = {}
): Promise<void> {
  if (options.clearFirst) {
    element.value = ""
    element.dispatchEvent(new Event("input", { bubbles: true }))
    await shortDelay()
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    
    // Simulate occasional typo and backspace (5% chance)
    if (options.simulateTypos && Math.random() < 0.05 && i > 0) {
      const typoChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1))
      element.value += typoChar
      element.dispatchEvent(new Event("input", { bubbles: true }))
      await new Promise(r => setTimeout(r, getTypingDelay()))
      
      // Backspace
      element.value = element.value.slice(0, -1)
      element.dispatchEvent(new Event("input", { bubbles: true }))
      await new Promise(r => setTimeout(r, 100 + Math.random() * 200))
    }
    
    element.value += char
    element.dispatchEvent(new Event("input", { bubbles: true }))
    
    await new Promise(r => setTimeout(r, getTypingDelay()))
  }
  
  // Final blur after typing
  element.dispatchEvent(new Event("change", { bubbles: true }))
  element.dispatchEvent(new Event("blur", { bubbles: true }))
}

/**
 * Bezier curve point calculation for natural mouse movement
 */
function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/**
 * Generate natural mouse path using Bezier curves
 */
export function generateMousePath(
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number,
  steps: number = 20
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = []
  
  // Control points for Bezier curve (add randomness)
  const cp1x = startX + (endX - startX) * 0.25 + (Math.random() - 0.5) * 50
  const cp1y = startY + (endY - startY) * 0.1 + (Math.random() - 0.5) * 50
  const cp2x = startX + (endX - startX) * 0.75 + (Math.random() - 0.5) * 50
  const cp2y = startY + (endY - startY) * 0.9 + (Math.random() - 0.5) * 50
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    path.push({
      x: bezierPoint(t, startX, cp1x, cp2x, endX),
      y: bezierPoint(t, startY, cp1y, cp2y, endY)
    })
  }
  
  return path
}

/**
 * Click element with randomized position (not dead center)
 */
export async function humanClick(element: Element): Promise<void> {
  const rect = element.getBoundingClientRect()
  
  // Click within element but not dead center
  const offsetX = (Math.random() - 0.5) * rect.width * 0.6
  const offsetY = (Math.random() - 0.5) * rect.height * 0.6
  
  const clickX = rect.left + rect.width / 2 + offsetX
  const clickY = rect.top + rect.height / 2 + offsetY
  
  // Dispatch mouse events
  const mousedownEvent = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    clientX: clickX,
    clientY: clickY,
    button: 0
  })
  
  const mouseupEvent = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
    clientX: clickX,
    clientY: clickY,
    button: 0
  })
  
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX: clickX,
    clientY: clickY,
    button: 0
  })
  
  element.dispatchEvent(mousedownEvent)
  await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
  element.dispatchEvent(mouseupEvent)
  element.dispatchEvent(clickEvent)
}

/**
 * Smooth scroll to element with natural behavior
 */
export async function humanScroll(element: Element): Promise<void> {
  const rect = element.getBoundingClientRect()
  const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
  
  if (isVisible) return
  
  // Calculate target scroll position (element near center of viewport)
  const targetY = window.scrollY + rect.top - window.innerHeight / 2
  const startY = window.scrollY
  const distance = targetY - startY
  const duration = Math.min(Math.abs(distance) * 0.5, 1000) // Max 1 second
  const startTime = Date.now()
  
  return new Promise(resolve => {
    function step() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out curve for natural deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      window.scrollTo(0, startY + distance * easeOut + (Math.random() - 0.5) * 5)
      
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        resolve()
      }
    }
    
    requestAnimationFrame(step)
  })
}

/**
 * Remove common automation fingerprints
 */
export function removeAutomationFingerprints(): void {
  try {
    // Override webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
      configurable: true
    })
    
    // Override plugins (empty in headless)
    if (navigator.plugins.length === 0) {
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
        configurable: true
      })
    }
    
    // Override languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
      configurable: true
    })
    
    console.log("[AutoApply] Automation fingerprints removed")
  } catch (e) {
    console.warn("[AutoApply] Could not remove all fingerprints:", e)
  }
}
