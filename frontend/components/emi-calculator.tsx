"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, DollarSign, Calendar, PercentIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EMIResult {
  emi: number
  totalAmount: number
  totalInterest: number
  principal: number
}

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(100000)
  const [interestRate, setInterestRate] = useState<number>(10)
  const [loanTenure, setLoanTenure] = useState<number>(12)
  const [tenureType, setTenureType] = useState<"months" | "years">("months")
  const [result, setResult] = useState<EMIResult>({ emi: 0, totalAmount: 0, totalInterest: 0, principal: loanAmount })
  const [currency, setCurrency] = useState<string>("USD")

  const currencies = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
  }

  useEffect(() => {
    calculateEMI()
  }, [loanAmount, interestRate, loanTenure, tenureType])

  const calculateEMI = () => {
    const principal = loanAmount
    const monthlyInterestRate = interestRate / 12 / 100
    const tenureInMonths = tenureType === "years" ? loanTenure * 12 : loanTenure

    if (principal <= 0 || monthlyInterestRate <= 0 || tenureInMonths <= 0) {
      setResult({ emi: 0, totalAmount: 0, totalInterest: 0, principal })
      return
    }

    // EMI calculation formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const emi =
      (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureInMonths)) /
      (Math.pow(1 + monthlyInterestRate, tenureInMonths) - 1)

    const totalAmount = emi * tenureInMonths
    const totalInterest = totalAmount - principal

    setResult({
      emi: isNaN(emi) ? 0 : emi,
      totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      principal,
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleLoanAmountChange = (value: number[]) => {
    setLoanAmount(value[0])
  }

  const handleInterestRateChange = (value: number[]) => {
    setInterestRate(value[0])
  }

  const handleLoanTenureChange = (value: number[]) => {
    setLoanTenure(value[0])
  }

  const handleLoanAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value)) {
      setLoanAmount(value)
    } else {
      setLoanAmount(0)
    }
  }

  const handleInterestRateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value)) {
      setInterestRate(value)
    } else {
      setInterestRate(0)
    }
  }

  const handleLoanTenureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      setLoanTenure(value)
    } else {
      setLoanTenure(0)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-2xl flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          EMI Calculator
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Calculate your Equated Monthly Installment (EMI) for your loan
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="loan-amount" className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Loan Amount
                  </Label>
                  <div className="flex items-center gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="text-xs p-1 border rounded"
                    >
                      {Object.keys(currencies).map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                    <Input
                      id="loan-amount-input"
                      type="number"
                      value={loanAmount}
                      onChange={handleLoanAmountInput}
                      className="w-24 text-right"
                    />
                  </div>
                </div>
                <Slider
                  id="loan-amount"
                  min={1000}
                  max={1000000}
                  step={1000}
                  value={[loanAmount]}
                  onValueChange={handleLoanAmountChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(1000)}</span>
                  <span>{formatCurrency(1000000)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="interest-rate" className="text-sm font-medium flex items-center gap-1">
                    <PercentIcon className="h-4 w-4" /> Interest Rate (% p.a.)
                  </Label>
                  <Input
                    id="interest-rate-input"
                    type="number"
                    value={interestRate}
                    onChange={handleInterestRateInput}
                    className="w-24 text-right"
                  />
                </div>
                <Slider
                  id="interest-rate"
                  min={1}
                  max={30}
                  step={0.1}
                  value={[interestRate]}
                  onValueChange={handleInterestRateChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>30%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="loan-tenure" className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Loan Tenure
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="loan-tenure-input"
                      type="number"
                      value={loanTenure}
                      onChange={handleLoanTenureInput}
                      className="w-16 text-right"
                    />
                    <select
                      value={tenureType}
                      onChange={(e) => setTenureType(e.target.value as "months" | "years")}
                      className="p-2 border rounded"
                    >
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
                <Slider
                  id="loan-tenure"
                  min={tenureType === "years" ? 1 : 1}
                  max={tenureType === "years" ? 30 : 360}
                  step={tenureType === "years" ? 1 : 1}
                  value={[loanTenure]}
                  onValueChange={handleLoanTenureChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{tenureType === "years" ? "1 Year" : "1 Month"}</span>
                  <span>{tenureType === "years" ? "30 Years" : "360 Months"}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="text-2xl font-bold">{formatCurrency(Math.round(result.emi))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Interest</p>
                  <p className="text-2xl font-bold">{formatCurrency(Math.round(result.totalInterest))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Principal Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(result.principal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(Math.round(result.totalAmount))}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <PieChart className="w-full h-full text-muted-foreground" />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-sm text-muted-foreground">Payment Breakdown</p>
                  <div className="w-24 h-24 rounded-full border-8 border-primary relative flex items-center justify-center">
                    <div
                      className="absolute inset-0 border-8 border-muted-foreground rounded-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos((2 * Math.PI * result.principal) / result.totalAmount)}% ${50 - 50 * Math.sin((2 * Math.PI * result.principal) / result.totalAmount)}%, 50% 50%)`,
                        transform: "rotate(90deg)",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm">Principal</span>
                </div>
                <span className="font-medium">{formatCurrency(result.principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                  <span className="text-sm">Interest</span>
                </div>
                <span className="font-medium">{formatCurrency(Math.round(result.totalInterest))}</span>
              </div>
              <div className="h-px bg-border my-2"></div>
              <div className="flex justify-between items-center font-bold">
                <span>Total Payment</span>
                <span>{formatCurrency(Math.round(result.totalAmount))}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium">Loan Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Monthly EMI</div>
                <div className="font-medium">{formatCurrency(Math.round(result.emi))}</div>

                <div className="text-muted-foreground">Total Payments</div>
                <div className="font-medium">{tenureType === "years" ? loanTenure * 12 : loanTenure} months</div>

                <div className="text-muted-foreground">Interest Rate</div>
                <div className="font-medium">{interestRate}% per annum</div>

                <div className="text-muted-foreground">Interest to Principal Ratio</div>
                <div className="font-medium">
                  {result.principal > 0 ? ((result.totalInterest / result.principal) * 100).toFixed(2) : 0}%
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={() => {
            setLoanAmount(100000)
            setInterestRate(10)
            setLoanTenure(12)
            setTenureType("months")
          }}
        >
          Reset
        </Button>
        <Button>Apply for Loan</Button>
      </CardFooter>
    </Card>
  )
}

