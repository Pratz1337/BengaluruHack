"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Lightbulb, MessageSquareText, Clock, Calculator } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchInterestRates, fetchRecentQueries, fetchFinancialTips, InterestRate, RecentQuery } from "@/services/data-service"

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const [interestRates, setInterestRates] = useState<InterestRate[]>([])
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([])
  const [financialTips, setFinancialTips] = useState<string[]>([])
  const [isFetchingData, setIsFetchingData] = useState(false)

  const fetchSidebarData = async () => {
    setIsFetchingData(true)
    try {
      // Fetch all data in parallel
      const [rates, queries, tips] = await Promise.all([
        fetchInterestRates(),
        fetchRecentQueries(),
        fetchFinancialTips()
      ])
      
      setInterestRates(rates)
      setRecentQueries(queries)
      setFinancialTips(tips)
    } catch (error) {
      console.error("Error fetching sidebar data:", error)
    } finally {
      setIsFetchingData(false)
    }
  }

  useEffect(() => {
    fetchSidebarData()
    
    // Set up polling to refresh data every 5 minutes
    const intervalId = setInterval(fetchSidebarData, 5 * 60 * 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center">
          Financial Dashboard
        </h2>
        <button 
          onClick={fetchSidebarData} 
          className="p-1 rounded-full hover:bg-muted"
          disabled={isFetchingData}
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingData ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <Tabs defaultValue="info" className="flex-1">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="info">Loan Info</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="p-4 overflow-auto">
          <div className="space-y-4">
            {interestRates.length > 0 ? (
              interestRates.map((rate, index) => (
                <Card key={index}>
                  <CardHeader className="py-3">
                    <CardTitle className="capitalize">{rate.loan_type.replace("_", " ")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                    <div className="relative h-9 w-full bg-muted rounded-lg">
                      <div
                        className="absolute h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-80"
                        style={{ width: "100%" }}
                      ></div>
                      <div className="absolute inset-0 flex justify-between items-center px-3">
                        <Badge variant="secondary">{rate.min_rate}%</Badge>
                        <Badge variant="secondary">{rate.max_rate}%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isFetchingData ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-30" />
                    <p>Fetching interest rates...</p>
                  </div>
                ) : (
                  <>
                    <Calculator className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>Interest rate data unavailable</p>
                  </>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="p-4 overflow-auto">
          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent Queries
                </CardTitle>
                <CardDescription>Recently asked loan questions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentQueries.length > 0 ? (
                  <div className="space-y-3">
                    {recentQueries.map((query) => (
                      <div key={query.id} className="flex items-start space-x-2 pb-3 border-b last:border-0">
                        <MessageSquareText className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm">{query.query}</p>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              {query.loan_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {query.hours_ago < 1 ? "Just now" : `${Math.floor(query.hours_ago)}h ago`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {isFetchingData ? (
                      <div className="flex justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin opacity-30" />
                      </div>
                    ) : (
                      <p className="text-sm">No recent queries</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                  Financial Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialTips.length > 0 ? (
                  <div className="space-y-3">
                    {financialTips.map((tip, index) => (
                      <div key={index} className="flex">
                        <div className="mr-3 mt-0.5">
                          <span className="flex h-2 w-2 bg-indigo-600 rounded-full"></span>
                        </div>
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {isFetchingData ? (
                      <div className="flex justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin opacity-30" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">No tips available</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info" className="p-4 space-y-4 overflow-auto">
          {/* This tab will be populated dynamically based on the selected loan */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle>Loan Information</CardTitle>
              <CardDescription>Select a loan type to see details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask about a specific loan type in the chat to see detailed information here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
