import { NextResponse } from "next/server"

export async function GET() {
  // These would ideally come from a database that's regularly updated
  const rates = {
    home_loan: {
      min_rate: 6.5,
      max_rate: 8.5,
      last_updated: new Date().toISOString().split("T")[0],
    },
    personal_loan: {
      min_rate: 10.5,
      max_rate: 15.0,
      last_updated: new Date().toISOString().split("T")[0],
    },
    car_loan: {
      min_rate: 7.0,
      max_rate: 11.0,
      last_updated: new Date().toISOString().split("T")[0],
    },
    education_loan: {
      min_rate: 8.0,
      max_rate: 12.5,
      last_updated: new Date().toISOString().split("T")[0],
    },
    business_loan: {
      min_rate: 11.0,
      max_rate: 16.0,
      last_updated: new Date().toISOString().split("T")[0],
    },
  }

  return NextResponse.json(rates)
}

