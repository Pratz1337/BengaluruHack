"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface LoanInfo {
  loan_type: string
  interest_rate: string
  eligibility: string
  repayment_options: string
  additional_info: string
  result?: string
}

interface LoanInfoContextType {
  loanInfo: LoanInfo
  updateLoanInfo: (info: Partial<LoanInfo>) => void
  resetLoanInfo: () => void
}

const defaultLoanInfo: LoanInfo = {
  loan_type: "",
  interest_rate: "",
  eligibility: "",
  repayment_options: "",
  additional_info: "",
}

const LoanInfoContext = createContext<LoanInfoContextType | undefined>(undefined)

export function LoanInfoProvider({ children }: { children: ReactNode }) {
  const [loanInfo, setLoanInfo] = useState<LoanInfo>(defaultLoanInfo)

  const updateLoanInfo = (info: Partial<LoanInfo>) => {
    setLoanInfo((prev) => ({ ...prev, ...info }))
  }

  const resetLoanInfo = () => {
    setLoanInfo(defaultLoanInfo)
  }

  return (
    <LoanInfoContext.Provider value={{ loanInfo, updateLoanInfo, resetLoanInfo }}>
      {children}
    </LoanInfoContext.Provider>
  )
}

export function useLoanInfo() {
  const context = useContext(LoanInfoContext)
  if (context === undefined) {
    throw new Error("useLoanInfo must be used within a LoanInfoProvider")
  }
  return context
}
