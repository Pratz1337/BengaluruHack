/**
 * API service for fetching financial data
 */

// Environment variable with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// Interest rate interface
export interface InterestRate {
  loan_type: string
  min_rate: number
  max_rate: number
}

// Recent query interface
export interface RecentQuery {
  timestamp: string | number | Date
  id: string
  query: string
  loan_type: string
  hours_ago: number
}

/**
 * Fetch current interest rates from the backend
 */
export async function fetchInterestRates(): Promise<InterestRate[]> {
  try {
    const response = await fetch(`${API_URL}/interest-rates`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching interest rates:", error)
    return []
  }
}

/**
 * Fetch recent queries from the backend
 */
export async function fetchRecentQueries(): Promise<RecentQuery[]> {
  try {
    const response = await fetch(`${API_URL}/recent-queries`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching recent queries:", error)
    return []
  }
}

/**
 * Fetch financial tips from the backend
 */
export async function fetchFinancialTips(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/financial-tips`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching financial tips:", error)
    return []
  }
}

/**
 * Fetch loan categories from the backend
 */
export async function fetchLoanCategories(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/api/loan-categories`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching loan categories:", error)
    return []
  }
}

/**
 * Fetch financial tools from the backend
 */
export async function fetchFinancialTools(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/api/financial-tools`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching financial tools:", error)
    return []
  }
}

