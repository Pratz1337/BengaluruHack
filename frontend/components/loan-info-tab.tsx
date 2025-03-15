"use client"

import { useLoanInfo } from "@/hooks/use-loan-info"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard } from 'lucide-react'
import ReactMarkdown from "react-markdown"

export function LoanInfoTab() {
  const { loanInfo } = useLoanInfo()

  if (!loanInfo.loan_type) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <LayoutDashboard className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No loan information available yet</p>
        <p className="text-sm">Ask about specific loans to see details here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle>Loan Type</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{loanInfo.loan_type}</p>
        </CardContent>
      </Card>

      {loanInfo.interest_rate && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle>Interest Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{loanInfo.interest_rate}</p>
          </CardContent>
        </Card>
      )}

      {loanInfo.eligibility && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle>Eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown>{loanInfo.eligibility}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {loanInfo.repayment_options && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle>Repayment Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown>{loanInfo.repayment_options}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {loanInfo.additional_info && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown>{loanInfo.additional_info}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
