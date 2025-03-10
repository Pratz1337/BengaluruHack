// InternalEventsSaved.tsx
"use client"

import React, { useEffect, useState } from 'react'
import { Moon, Sun, Loader2 } from 'lucide-react'
import { Button } from "@nextui-org/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import withAuth from "../withAuth";

interface Event {
  _id: string
  name: string
  description: string
}

interface EntranceExam {
  _id: string
  name: string
  description: string
}

const InternalEventsSaved: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [exams, setExams] = useState<EntranceExam[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const fetchInternalEvents = async () => {
      try {
        const response = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/api/internal-events`) // Adjust the URL if necessary
        const data = await response.json()

        if (response.ok) {
          setEvents(data.events)
          setExams(data.entranceExams)
        } else {
          setError(data.message || 'Failed to fetch internal events and entrance exams.')
        }
      } catch (err) {
        console.error(err)
        setError('Network error occurred while fetching data.')
      } finally {
        setLoading(false)
      }
    }

    fetchInternalEvents()
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      <div className="max-w-6xl mx-auto p-6">
        <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl overflow-hidden`}>
          <CardHeader className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                EduMitra Internal Events & Entrance Exams
              </CardTitle>
              <Button
                variant="ghost"
                size="md"
                onClick={toggleTheme}
                className="text-white rounded-full hover:text-white hover:bg-white/20"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <>
                {/* Events Section */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Internal Events</h2>
                  {events.length === 0 ? (
                    <p className="text-center">No internal events found.</p>
                  ) : (
                    <div className="grid gap-6">
                      {events.map((event) => (
                        <Card key={event._id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2 text-purple-600">
                              {event.name}
                            </h3>
                            <p className="text-sm">{event.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* Entrance Exams Section */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Entrance Exams</h2>
                  {exams.length === 0 ? (
                    <p className="text-center">No entrance exams found.</p>
                  ) : (
                    <div className="grid gap-6">
                      {exams.map((exam) => (
                        <Card key={exam._id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold mb-2 text-purple-600">
                              {exam.name}
                            </h3>
                            <p className="text-sm">{exam.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(InternalEventsSaved);