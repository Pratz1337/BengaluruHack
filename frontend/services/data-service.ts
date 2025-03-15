import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export interface InterestRate {
  loan_type: string
  min_rate: number
  max_rate: number
}

export interface RecentQuery {
  id: string
  query: string
  loan_type: string
  hours_ago: number
}

export interface FinancialTip {
  id: string
  tip: string
  category: string
}

export const fetchInterestRates = async (): Promise<InterestRate[]> => {
  try {
    const response = await axios.get(`${API_URL}/interest-rates`)
    return response.data
  } catch (error) {
    console.error("Error fetching interest rates:", error)
    return []
  }
}

export const fetchRecentQueries = async (): Promise<RecentQuery[]> => {
  try {
    const response = await axios.get(`${API_URL}/recent-queries`)
    return response.data
  } catch (error) {
    console.error("Error fetching recent queries:", error)
    return []
  }
}

export const fetchFinancialTips = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_URL}/financial-tips`)
    return response.data
  } catch (error) {
    console.error("Error fetching financial tips:", error)
    return []
  }
}

