"use client"

import React, { useState } from 'react'
import { Moon, Sun, Loader2, CalendarIcon } from 'lucide-react'
import { Button } from "@nextui-org/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@nextui-org/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import YearPicker from '@/components/YearPicker'
import { cn } from "@/lib/utils"
import withAuth from "../withAuth";

const CollegeForm: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [formData, setFormData] = useState({
    collegeName: '',
    address: '',
    email: '',
    website: '',
    foundedYear: '',
    contactNumber: '',
    description: '',
    type: '',
  })
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
    setFormData(prev => ({ ...prev, foundedYear: year.toString() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/api/general-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage('College information saved successfully! 🎉')
        setFormData({
          collegeName: '',
          address: '',
          email: '',
          website: '',
          foundedYear: '',
          contactNumber: '',
          description: '',
          type: '',
        })
        setSelectedYear(null)
      } else {
        setMessage('Failed to save college information ❌')
      }
    } catch (error) {
      setMessage('An error occurred while saving the data ❌')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto p-6">
        <Card className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} shadow-lg rounded-xl overflow-hidden`}>
          <CardHeader className="p-6 bg-gradient-to-r from-purple-600 to-pink-600">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                EduMitra College Dashboard
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
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: 'College Name', name: 'collegeName', type: 'text', required: true },
                  { label: 'College Type', name: 'type', type: 'select', required: true, options: ['Engineering', 'Polytechnic'] },
                  { label: 'Email Address', name: 'email', type: 'email', required: true },
                  { label: 'Website URL', name: 'website', type: 'url' },
                  { label: 'Contact Number', name: 'contactNumber', type: 'tel' }
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label} {field.required && '*'}
                    </Label>
                    {field.type === 'select' ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        required={field.required}
                        className={`w-full p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                      >
                        <option value="">Select college type</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        required={field.required}
                        className={`w-full p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                      />
                    )}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label htmlFor="foundedYear" className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} text-sm font-medium`}>
                    Founded Year
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="foundedYear"
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedYear && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedYear ? selectedYear : <span>Pick a year</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <YearPicker
                        minYear={1800}
                        maxYear={new Date().getFullYear()}
                        selectedYear={selectedYear}
                        onYearSelect={handleYearSelect}
                        theme={theme}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {[
                  { label: 'Address', name: 'address', required: true },
                  { label: 'Description', name: 'description', rows: 4 }
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label} {field.required && '*'}
                    </Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={handleChange}
                      required={field.required}
                      rows={field.rows}
                      className={`w-full p-2 rounded-md ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save College Information'
                )}
              </Button>

              {message && (
                <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(CollegeForm);