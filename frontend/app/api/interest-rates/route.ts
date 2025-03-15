import { NextResponse } from "next/server"
import { getFinancialData } from "@/services/pinecone-services"

export async function GET() {
  try {
    // Fetch interest rates from Pinecone database
    const rates = await getFinancialData('interest-rates');
    
    if (!rates) {
      // Fallback if data couldn't be retrieved
      return NextResponse.json(
        { error: "Failed to retrieve interest rates" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(rates);
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return NextResponse.json(
      { error: "Failed to retrieve interest rates" },
      { status: 500 }
    );
  }
}