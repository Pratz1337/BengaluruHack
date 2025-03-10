// page.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Plus, Trash, Edit, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@nextui-org/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@nextui-org/input"// Corrected import path
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import withAuth from "../withAuth";

interface Event {
  id: number
  name: string
  description: string
}

interface EntranceExam {
  id: number
  name: string
  description: string
}

const InternalEventsPage: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Events State
  const [events, setEvents] = useState<Event[]>([
    { id: Date.now(), name: '', description: '' }
  ])
  const [isEditingEvent, setIsEditingEvent] = useState<boolean>(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)

  // Entrance Exams State
  const [exams, setExams] = useState<EntranceExam[]>([
    { id: Date.now(), name: '', description: '' }
  ])
  const [isEditingExam, setIsEditingExam] = useState<boolean>(false)
  const [currentExam, setCurrentExam] = useState<EntranceExam | null>(null)

  // Messages and Loading State
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Load from Local Storage on Mount
  useEffect(() => {
    const storedEvents = localStorage.getItem('internalEvents')
    const storedExams = localStorage.getItem('entranceExams')
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents))
    }
    if (storedExams) {
      setExams(JSON.parse(storedExams))
    }
  }, [])

  // Save to Local Storage on State Change
  useEffect(() => {
    localStorage.setItem('internalEvents', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('entranceExams', JSON.stringify(exams))
  }, [exams])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  // Event Handlers
  const handleEventChange = (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updatedEvents = events.map(event =>
      event.id === id ? { ...event, [e.target.name]: e.target.value } : event
    )
    setEvents(updatedEvents)
  }

  const addEvent = () => {
    setEvents([...events, { id: Date.now(), name: '', description: '' }])
  }

  const removeEvent = (id: number) => {
    const updatedEvents = events.filter(event => event.id !== id)
    setEvents(updatedEvents)
    if (currentEvent && currentEvent.id === id) {
      setIsEditingEvent(false)
      setCurrentEvent(null)
    }
  }

  const startEditingEvent = (event: Event) => {
    setIsEditingEvent(true)
    setCurrentEvent(event)
  }

  const cancelEditingEvent = () => {
    setIsEditingEvent(false)
    setCurrentEvent(null)
  }

  const saveEditingEvent = () => {
    if (currentEvent) {
      const updatedEvents = events.map(event =>
        event.id === currentEvent.id ? currentEvent : event
      )
      setEvents(updatedEvents)
      setCurrentEvent(null)
      setIsEditingEvent(false)
      setMessage({ type: 'success', text: 'Event updated successfully! 🎉' })
    }
  }

  // Entrance Exam Handlers
  const handleExamChange = (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updatedExams = exams.map(exam =>
      exam.id === id ? { ...exam, [e.target.name]: e.target.value } : exam
    )
    setExams(updatedExams)
  }

  const addExam = () => {
    setExams([...exams, { id: Date.now(), name: '', description: '' }])
  }

  const removeExam = (id: number) => {
    const updatedExams = exams.filter(exam => exam.id !== id)
    setExams(updatedExams)
    if (currentExam && currentExam.id === id) {
      setIsEditingExam(false)
      setCurrentExam(null)
    }
  }

  const startEditingExam = (exam: EntranceExam) => {
    setIsEditingExam(true)
    setCurrentExam(exam)
  }

  const cancelEditingExam = () => {
    setIsEditingExam(false)
    setCurrentExam(null)
  }

  const saveEditingExam = () => {
    if (currentExam) {
      const updatedExams = exams.map(exam =>
        exam.id === currentExam.id ? currentExam : exam
      )
      setExams(updatedExams)
      setCurrentExam(null)
      setIsEditingExam(false)
      setMessage({ type: 'success', text: 'Entrance Exam updated successfully! 🎉' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/api/internal-events`, { // Adjusted to relative path
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events, entranceExams: exams }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Internal Events saved successfully! 🎉' })
        setEvents([{ id: Date.now(), name: '', description: '' }])
        setExams([{ id: Date.now(), name: '', description: '' }])
        localStorage.removeItem('internalEvents')
        localStorage.removeItem('entranceExams')
      } else {
        setMessage({ type: 'error', text: data.message || 'An error occurred. Please try again.' })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'Network error occurred while saving data.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      <div className="container mx-auto px-4 py-8">
        <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl overflow-hidden w-full`}>
          <CardHeader className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Edumitra Add Your Internal Events & Entrance Exams
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-white hover:text-white rounded-full hover:bg-white/20"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Events Section */}
              <h3 className="text-xl font-semibold">Events</h3>
              {events.map(event => (
                <Card key={event.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} overflow-hidden`}>
                  <CardContent className="p-4">
                    {isEditingEvent && currentEvent?.id === event.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`event-name-${event.id}`}>Event Name *</Label>
                          <Input
                            id={`event-name-${event.id}`}
                            name="name"
                            value={currentEvent.name}
                            onChange={e => setCurrentEvent({ ...currentEvent, name: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`event-description-${event.id}`}>Description *</Label>
                          <Textarea
                            id={`event-description-${event.id}`}
                            name="description"
                            value={currentEvent.description}
                            onChange={e => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" onClick={saveEditingEvent} className="bg-green-500 rounded-lg hover:bg-green-600">
                            <Check className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button type="button" onClick={cancelEditingEvent} variant="faded">
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{event.name || 'New Event'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{event.description || 'No description'}</p>
                        </div>
                        <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditingEvent(event)} className='text-gry-700 hover:text-blue-600'>
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeEvent(event.id)} className="text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button type="button" onClick={addEvent} className="text-white w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" /> Add Another Event
              </Button>

              {/* Entrance Exams Section */}
              <h3 className="text-xl font-semibold mt-8">Entrance Exams</h3>
              {exams.map(exam => (
                <Card key={exam.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} overflow-hidden`}>
                  <CardContent className="p-4">
                    {isEditingExam && currentExam?.id === exam.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`exam-name-${exam.id}`}>Exam Name *</Label>
                          <Input
                            id={`exam-name-${exam.id}`}
                            name="name"
                            value={currentExam.name}
                            onChange={e => setCurrentExam({ ...currentExam, name: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`exam-description-${exam.id}`}>Description *</Label>
                          <Textarea
                            id={`exam-description-${exam.id}`}
                            name="description"
                            value={currentExam.description}
                            onChange={e => setCurrentExam({ ...currentExam, description: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" onClick={saveEditingExam} className="bg-green-500 rounded-lg hover:bg-green-600">
                            <Check className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button type="button" onClick={cancelEditingExam} variant="faded">
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{exam.name || 'New Entrance Exam'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{exam.description || 'No description'}</p>
                        </div>
                        <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => startEditingExam(exam)} className='text-gray-700 hover:text-blue-600'>
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeExam(exam.id)} className="text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button type="button" onClick={addExam} className="text-white w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" /> Add Another Entrance Exam
              </Button>

              <Button type="submit" disabled={loading} className="text-white w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {loading ? 'Saving...' : 'Save Internal Events'}
              </Button>

              {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message.text}
                </div>
              )}

              <div className="text-center">
                <Link href="/savedEvents">
                  <Button className="text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    View Saved Internal Events
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(InternalEventsPage);
