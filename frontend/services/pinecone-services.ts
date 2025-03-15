import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const PINECONE_API_KEY = process.env.NEXT_PUBLIC_PINECONE_API_KEY

interface PineconeQueryParams {
  query: string
  topK?: number
  filter?: Record<string, any>
  namespace?: string
}

export const queryPinecone = async (params: PineconeQueryParams) => {
  try {
    // If we have direct access to Pinecone API
    if (PINECONE_API_KEY) {
      // Implement direct Pinecone API call
      // This would require proper CORS setup on Pinecone
      console.log("Direct Pinecone access not implemented yet")
    }

    // Otherwise use our backend as a proxy
    const response = await axios.post(`${API_URL}/query-pinecone`, params)
    return response.data
  } catch (error) {
    console.error("Error querying Pinecone:", error)
    throw error
  }
}

export const getFinancialData = async (category: string, query = "") => {
  try {
    const response = await axios.get(`${API_URL}/financial-data`, {
      params: { category, query },
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching ${category} data:`, error)
    return null
  }
}

