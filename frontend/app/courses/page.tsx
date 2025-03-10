"use client"

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Plus, Trash, Edit, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@nextui-org/button"
import { Input } from "@nextui-org/input"
import { Textarea } from "@nextui-org/input"
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Label } from "../../components/ui/label"
import withAuth from "../withAuth";

interface Course {
  id: number
  name: string
  description: string
  duration: string
  managementFees: string
  generalFees: string
  syllabusLink: string
}

const CourseInformation: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [courses, setCourses] = useState<Course[]>([])
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null)

  // Initialize courses from localStorage or create a default course
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCourses = localStorage.getItem('courses')
      if (storedCourses) {
        try {
          const parsedCourses = JSON.parse(storedCourses)
          const validatedCourses = parsedCourses.map((course: Course) => ({
            id: course.id || Date.now(),
            name: course.name || '',
            description: course.description || '',
            duration: course.duration || '',
            managementFees: course.managementFees || '',
            generalFees: course.generalFees || '',
            syllabusLink: course.syllabusLink || ''
          }))
          
          setCourses(validatedCourses.length > 0 ? validatedCourses : [
            { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' }
          ])
        } catch (error) {
          console.error('Error parsing stored courses:', error)
          setCourses([
            { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' }
          ])
        }
      } else {
        setCourses([
          { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' }
        ])
      }
    }
  }, [])

  // Update localStorage whenever courses change
  useEffect(() => {
    if (typeof window !== 'undefined' && courses.length > 0) {
      try {
        localStorage.setItem('courses', JSON.stringify(courses))
      } catch (error) {
        console.error('Error saving courses to localStorage:', error)
      }
    }
  }, [courses])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  const addCourse = () => {
    setCourses([
      ...courses,
      { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' },
    ])
  }

  const removeCourse = (id: number) => {
    const updatedCourses = courses.filter(course => course.id !== id)
    
    const finalCourses = updatedCourses.length > 0 ? updatedCourses : [
      { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' }
    ]
    
    setCourses(finalCourses)
    
    if (currentCourse && currentCourse.id === id) {
      setIsEditing(false)
      setCurrentCourse(null)
    }
  }

  const startEditing = (course: Course) => {
    setIsEditing(true)
    setCurrentCourse({ ...course })
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setCurrentCourse(null)
  }

  const saveEditing = () => {
    if (currentCourse) {
      const updatedCourses = courses.map(course =>
        course.id === currentCourse.id ? { ...currentCourse } : course
      )
      setCourses(updatedCourses)
      setIsEditing(false)
      setCurrentCourse(null)
      setMessage('Course updated successfully! 🎉')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courses }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Courses saved successfully! 🎉')
        setCourses([
          { id: Date.now(), name: '', description: '', duration: '', managementFees: '', generalFees: '', syllabusLink: '' }
        ])
        localStorage.removeItem('courses')
      } else {
        setMessage(data.message || 'An error occurred. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Network error occurred while saving data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto p-6">
        <Card className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg rounded-xl overflow-hidden`}>
          <CardHeader className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 flex justify-between items-center">
            <div className="text-2xl font-bold text-white">
              EduMitra Course Information
            </div>
            <Button
              variant="light"
              onClick={toggleTheme}
              className={`text-white hover:bg-white/20 ${theme === 'dark' ? 'bg-white/10' : ''}`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {courses.map(course => (
                <Card key={course.id} className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} overflow-hidden`}>
                  <CardBody className="p-4">
                    {isEditing && currentCourse?.id === course.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`name-${course.id}`}>Course Name *</Label>
                          <Input
                            id={`name-${course.id}`}
                            name="name"
                            value={currentCourse.name}
                            onChange={e => setCurrentCourse({ ...currentCourse, name: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        {/* Rest of the input fields remain the same */}
                        <div>
                          <Label htmlFor={`description-${course.id}`}>Description *</Label>
                          <Textarea
                            id={`description-${course.id}`}
                            name="description"
                            value={currentCourse.description}
                            onChange={e => setCurrentCourse({ ...currentCourse, description: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`duration-${course.id}`}>Duration (in years) *</Label>
                          <Input
                            id={`duration-${course.id}`}
                            name="duration"
                            value={currentCourse.duration}
                            onChange={e => setCurrentCourse({ ...currentCourse, duration: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`management-fee-${course.id}`}>Management Fees (₹) *</Label>
                          <Input
                            id={`management-fee-${course.id}`}
                            name="managementFees"
                            type="number"
                            value={currentCourse.managementFees}
                            onChange={e => setCurrentCourse({ ...currentCourse, managementFees: e.target.value })}
                            required
                            min="0"
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`general-fee-${course.id}`}>General Fees (₹) *</Label>
                          <Input
                            id={`general-fee-${course.id}`}
                            name="generalFees"
                            type="number"
                            value={currentCourse.generalFees}
                            onChange={e => setCurrentCourse({ ...currentCourse, generalFees: e.target.value })}
                            required
                            min="0"
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`syllabusLink-${course.syllabusLink}`}>
                            Syllabus Link: 
                          </Label>
                          <Input
                            id={`syllabusLink-${course.syllabusLink}`}
                            name="syllabusLink"
                            value={currentCourse.syllabusLink}
                            onChange={e => setCurrentCourse({ ...currentCourse, syllabusLink: e.target.value })}
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" onClick={saveEditing} className="bg-green-500 hover:bg-green-600">
                            <Check className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button type="button" onClick={cancelEditing} variant="ghost" className="text-red-500 hover:text-red-600">
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{course.name || 'New Course'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{course.description || 'No description'}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => startEditing(course)} className="text-gray-700 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeCourse(course.id)} className="text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}

              <Button type="button" onClick={addCourse} className="text-white w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" /> Add Another Course
              </Button>

              <Button type="submit" disabled={loading} className="text-white w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {loading ? 'Saving...' : 'Save Courses'}
              </Button>

              {message && (
                <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}

              <div className="text-center">
                <Link href="/courseSaved">
                  <Button className="text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    View Saved Courses
                  </Button>
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(CourseInformation);
