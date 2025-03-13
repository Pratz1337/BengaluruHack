import { NextResponse } from "next/server"

export async function GET() {
  const tips = [
    "Maintain a credit score above 750 for the best loan interest rates.",
    "Compare offers from multiple lenders before finalizing your loan.",
    "Pay more than the minimum EMI when possible to reduce your loan tenure.",
    "Check for hidden charges and processing fees when evaluating loan offers.",
    "Consider a loan with no prepayment penalties if you plan to close early.",
    "Set up automatic payments to avoid missing EMI due dates.",
    "Consolidate multiple high-interest loans into a single lower-interest loan.",
    "Maintain a debt-to-income ratio below 40% for better loan approval chances.",
    "Review your loan statements regularly to track your progress.",
    "Refinance your loan when interest rates drop significantly.",
  ]

  // Return 3 random tips
  const selectedTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3)
  return NextResponse.json(selectedTips)
}

