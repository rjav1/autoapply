/**
 * Field Matching Algorithm
 * 
 * Matches form fields to profile data using multiple strategies:
 * 1. data-automation-id (Workday-specific, most reliable)
 * 2. Label text matching with variations
 * 3. Placeholder/aria-label matching
 * 4. Input name/id attribute matching
 */

import type { ProfileData, FieldMapping, DetectedField } from "~modules/types"

/**
 * Label variations for common fields
 * Key = profile path, Value = array of possible labels
 */
const LABEL_VARIATIONS: Record<string, string[]> = {
  // Personal Info
  "firstName": [
    "first name", "given name", "forename", "legal first name",
    "nombre", "prénom", "vorname"
  ],
  "lastName": [
    "last name", "surname", "family name", "legal last name",
    "apellido", "nom", "nachname"
  ],
  "email": [
    "email", "e-mail", "email address", "e-mail address",
    "correo", "courriel"
  ],
  "phone": [
    "phone", "phone number", "telephone", "mobile", "mobile phone",
    "cell", "cell phone", "contact number", "teléfono"
  ],
  "preferredName": [
    "preferred name", "nickname", "goes by", "display name"
  ],
  
  // Address
  "address.street": [
    "address", "street address", "address line 1", "street",
    "dirección", "adresse"
  ],
  "address.street2": [
    "address line 2", "apt", "apartment", "suite", "unit",
    "building", "floor"
  ],
  "address.city": [
    "city", "town", "ciudad", "ville", "stadt"
  ],
  "address.state": [
    "state", "province", "region", "state/province",
    "estado", "province", "bundesland"
  ],
  "address.postalCode": [
    "zip", "zip code", "postal code", "postcode", "post code",
    "código postal", "code postal", "plz"
  ],
  "address.country": [
    "country", "nation", "país", "pays", "land"
  ],
  
  // Links
  "linkedIn": [
    "linkedin", "linkedin url", "linkedin profile",
    "linkedin.com"
  ],
  "github": [
    "github", "github url", "github profile", "github.com"
  ],
  "portfolio": [
    "portfolio", "website", "personal website", "personal site",
    "online portfolio"
  ],
  
  // Work Authorization
  "workAuthorization.authorizedToWork": [
    "authorized to work", "legally authorized", "work authorization",
    "eligible to work", "right to work"
  ],
  "workAuthorization.requiresSponsorship": [
    "sponsorship", "require sponsorship", "visa sponsorship",
    "immigration sponsorship", "work visa"
  ],
  
  // Demographics
  "demographics.gender": [
    "gender", "sex", "género"
  ],
  "demographics.ethnicity": [
    "ethnicity", "race", "ethnic background", "race/ethnicity"
  ],
  "demographics.veteranStatus": [
    "veteran", "veteran status", "military status", "military service"
  ],
  "demographics.disabilityStatus": [
    "disability", "disability status", "disabled"
  ]
}

/**
 * Match confidence result
 */
interface MatchResult {
  profilePath: string
  confidence: number // 0-1
  matchedBy: "automation-id" | "label" | "placeholder" | "attribute" | "none"
}

/**
 * Normalize text for comparison
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if any variation matches the text
 */
function matchesVariation(text: string, variations: string[]): boolean {
  const normalizedText = normalize(text)
  return variations.some(v => {
    const normalizedVariation = normalize(v)
    // Exact match or contains
    return normalizedText === normalizedVariation || 
           normalizedText.includes(normalizedVariation) ||
           normalizedVariation.includes(normalizedText)
  })
}

/**
 * Find best profile path match for a label
 */
function findBestMatch(label: string): MatchResult {
  const normalizedLabel = normalize(label)
  
  let bestMatch: MatchResult = {
    profilePath: "",
    confidence: 0,
    matchedBy: "none"
  }
  
  for (const [path, variations] of Object.entries(LABEL_VARIATIONS)) {
    for (const variation of variations) {
      const normalizedVariation = normalize(variation)
      
      // Exact match = 1.0 confidence
      if (normalizedLabel === normalizedVariation) {
        return { profilePath: path, confidence: 1.0, matchedBy: "label" }
      }
      
      // Contains match = 0.8 confidence
      if (normalizedLabel.includes(normalizedVariation)) {
        if (0.8 > bestMatch.confidence) {
          bestMatch = { profilePath: path, confidence: 0.8, matchedBy: "label" }
        }
      }
      
      // Partial word match = 0.6 confidence
      const labelWords = normalizedLabel.split(" ")
      const variationWords = normalizedVariation.split(" ")
      const commonWords = labelWords.filter(w => variationWords.includes(w))
      if (commonWords.length > 0) {
        const score = 0.6 * (commonWords.length / variationWords.length)
        if (score > bestMatch.confidence) {
          bestMatch = { profilePath: path, confidence: score, matchedBy: "label" }
        }
      }
    }
  }
  
  return bestMatch
}

/**
 * Match a detected field to a profile path
 */
export function matchField(
  field: DetectedField,
  mappings: FieldMapping[]
): MatchResult {
  // Strategy 1: Check automation-id against known mappings (highest confidence)
  if (field.automationId) {
    const mapping = mappings.find(m => m.automationId === field.automationId)
    if (mapping) {
      return {
        profilePath: mapping.profilePath,
        confidence: 1.0,
        matchedBy: "automation-id"
      }
    }
  }
  
  // Strategy 2: Match label text
  if (field.label) {
    const labelMatch = findBestMatch(field.label)
    if (labelMatch.confidence >= 0.6) {
      return labelMatch
    }
  }
  
  // Strategy 3: Match placeholder
  const placeholder = (field.element as HTMLInputElement).placeholder
  if (placeholder) {
    const placeholderMatch = findBestMatch(placeholder)
    if (placeholderMatch.confidence >= 0.6) {
      return { ...placeholderMatch, matchedBy: "placeholder" }
    }
  }
  
  // Strategy 4: Match aria-label
  const ariaLabel = field.element.getAttribute("aria-label")
  if (ariaLabel) {
    const ariaMatch = findBestMatch(ariaLabel)
    if (ariaMatch.confidence >= 0.6) {
      return { ...ariaMatch, matchedBy: "label" }
    }
  }
  
  // Strategy 5: Match input name or id attributes
  const element = field.element as HTMLInputElement
  const nameOrId = element.name || element.id
  if (nameOrId) {
    const attrMatch = findBestMatch(nameOrId.replace(/[-_]/g, " "))
    if (attrMatch.confidence >= 0.5) {
      return { ...attrMatch, matchedBy: "attribute" }
    }
  }
  
  return { profilePath: "", confidence: 0, matchedBy: "none" }
}

/**
 * Match all detected fields to profile paths
 */
export function matchAllFields(
  fields: DetectedField[],
  mappings: FieldMapping[]
): Map<DetectedField, MatchResult> {
  const results = new Map<DetectedField, MatchResult>()
  
  for (const field of fields) {
    results.set(field, matchField(field, mappings))
  }
  
  return results
}

/**
 * Get value from profile by path (e.g., "address.city")
 */
export function getProfileValue(profile: ProfileData, path: string): unknown {
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

/**
 * Format value for form input
 */
export function formatValueForInput(value: unknown, fieldType: string): string {
  if (value === undefined || value === null) return ""
  
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  
  if (value instanceof Date) {
    return value.toISOString().split("T")[0] // YYYY-MM-DD
  }
  
  if (Array.isArray(value)) {
    return value.join(", ")
  }
  
  return String(value)
}
