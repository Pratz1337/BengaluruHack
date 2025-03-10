"use client"

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Plus, Trash, Edit, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@nextui-org/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@nextui-org/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import withAuth from "../withAuth";


interface Scholarship {
  id: number
  name: string
  description: string
  elgibility: string
  amount: string
}

const Scholarships: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currentScholarship, setCurrentScholarship] = useState<Scholarship | null>(null)

  useEffect(() => {
    const storedScholarships = localStorage.getItem('scholarships')
    if (storedScholarships) {
      try {
        const parsedScholarships = JSON.parse(storedScholarships)
        if (Array.isArray(parsedScholarships) && parsedScholarships.length > 0) {
          setScholarships(parsedScholarships)
        } else {
          setScholarships([{ id: Date.now(), name: '', description: '', elgibility: '', amount: '' }])
        }
      } catch (error) {
        console.error('Error parsing scholarships from localStorage:', error)
        setScholarships([{ id: Date.now(), name: '', description: '', elgibility: '', amount: '' }])
      }
    } else {
      setScholarships([{ id: Date.now(), name: '', description: '', elgibility: '', amount: '' }])
    }
  }, [])

  
  useEffect(() => {
    try {
      if (scholarships.length > 0) {
        localStorage.setItem('scholarships', JSON.stringify(scholarships))
      }
    } catch (error) {
      console.error('Error saving scholarships to localStorage:', error)
    }scholarships
  }, [scholarships])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  const handleChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const updatedScholarships = scholarships.map(scholarship =>
      scholarship.id === id ? { ...scholarship, [e.target.name]: e.target.value } : scholarship
    )
    setScholarships(updatedScholarships)
  }

  const addScholarship = () => {
    setScholarships([
      ...scholarships,
      { id: Date.now(), name: '', description: '', elgibility: '', amount: '' }
    ])
  }

  const removeScholarship = (id: number) => {
    const updatedScholarships = scholarships.filter(scholarship => scholarship.id !== id)
    

    const finalScholarships = updatedScholarships.length > 0 
      ? updatedScholarships 
      : [{ id: Date.now(), name: '', description: '', elgibility: '', amount: '' }]
    
    setScholarships(finalScholarships)
    
    if (currentScholarship && currentScholarship.id === id) {
      setIsEditing(false)
      setCurrentScholarship(null)
    }
  }

  const startEditing = (scholarship: Scholarship) => {
    setIsEditing(true)
    setCurrentScholarship(scholarship)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setCurrentScholarship(null)
  }

  const saveEditing = () => {
    if (currentScholarship) {
      const updatedScholarships = scholarships.map(scholarship =>
        scholarship.id === currentScholarship.id ? currentScholarship : scholarship
      )
      setScholarships(updatedScholarships)
      setCurrentScholarship(null)
      setIsEditing(false)
      setMessage('Scholarship updated successfully! 🎉')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scholarships }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Scholarships saved successfully! 🎉')
       
        setScholarships([
          { id: Date.now(), name: '', description: '', elgibility: '', amount: '' }
        ])
   
        localStorage.removeItem('scholarships')
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
      <div className="container mx-auto px-4 py-8">
        <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-xl overflow-hidden w-full`}>
          <CardHeader className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                EduMitra Scholarship Information
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
              {scholarships.map(scholarship => (
                <Card key={scholarship.id} className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} overflow-hidden`}>
                  <CardContent className="p-4">
                    {isEditing && currentScholarship?.id === scholarship.id ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`name-${scholarship.id}`}>Scholarship Name *</Label>
                          <Input
                            id={`name-${scholarship.id}`}
                            name="name"
                            value={currentScholarship.name}
                            onChange={e => setCurrentScholarship({ ...currentScholarship, name: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`description-${scholarship.id}`}>Description *</Label>
                          <Textarea
                            id={`description-${scholarship.id}`}
                            name="description"
                            value={currentScholarship.description}
                            onChange={e => setCurrentScholarship({ ...currentScholarship, description: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`elgibility-${scholarship.id}`}>Elgibility (e.g., All, SC etc) *</Label>
                          <Input
                            id={`elgibility-${scholarship.id}`}
                            name="elgibility"
                            value={currentScholarship.elgibility}
                            onChange={e => setCurrentScholarship({ ...currentScholarship, elgibility: e.target.value })}
                            required
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`amount-${scholarship.id}`}>Amount ($) *</Label>
                          <Input
                            id={`amount-${scholarship.id}`}
                            name="amount"
                            type="number"
                            value={currentScholarship.amount}
                            onChange={e => setCurrentScholarship({ ...currentScholarship, amount: e.target.value })}
                            required
                            min="0"
                            className={theme === 'dark' ? 'bg-gray-600 text-white' : ''}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button onClick={saveEditing} className="bg-green-500 rounded-lg hover:bg-green-600">
                            <Check className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button onClick={cancelEditing} variant="faded">
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{scholarship.name || 'New Scholarship'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{scholarship.description || 'No description'}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEditing(scholarship)} className='text-gray-700 hover:text-blue-600'>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeScholarship(scholarship.id)} className="text-red-500 hover:text-red-600">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button onClick={addScholarship} className="text-white w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="mr-2 h-4 w-4" /> Add Another Scholarship
              </Button>

              <Button type="submit" disabled={loading} className="text-white w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {loading ? 'Saving...' : 'Save Scholarships'}
              </Button>

              {message && (
                <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}

              <div className="text-center">
                <Link href="/scholarshipsSaved">
                  <Button className="text-white bg-gradient-to-r rounded-lg from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    View Saved Scholarships
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

export default withAuth(Scholarships);
