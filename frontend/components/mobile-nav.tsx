'use client'

import { useState } from 'react'
import { Button } from "@nextui-org/button"
import { GraduationCap, CircleDollarSign, Scissors, Heart, Info, Download, School, BookOpen, Wrench } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface CollegeInfo {
  name: string
  course: string
  fees: string | number
  cutoff: string | Record<string, any>
  scholarships: string | number
  details?: string
}

interface MobileNavProps {
  collegeInfo: CollegeInfo
  onOpenCollegeComparison: () => void
  onOpenCourseComparison: () => void
  onOpenQuiz: () => void
  onDownloadSummary: () => void
  isDarkMode: boolean
}

export function MobileNav({
  collegeInfo,
  onOpenCollegeComparison,
  onOpenCourseComparison,
  onOpenQuiz,
  onDownloadSummary,
  isDarkMode
}: MobileNavProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'tools'>('info')

  const renderCutoffInfo = () => {
    if (typeof collegeInfo.cutoff === 'string') {
      return collegeInfo.cutoff
    }
    if (typeof collegeInfo.cutoff === 'object' && collegeInfo.cutoff !== null) {
      return Object.entries(collegeInfo.cutoff).map(([department, years]) => {
        if (typeof years === 'object' && years !== null) {
          return Object.entries(years as Record<string, any>).map(([year, categories]) => {
            if (typeof categories === 'object' && categories !== null && 'General' in categories) {
              return `${department}: ${(categories as any).General[1]}`
            }
            return null
          }).filter(Boolean).join(', ')
        }
        return null
      }).filter(Boolean).join(', ')
    }
    return 'No cutoff information available'
  }

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t bg-white dark:bg-gray-800 z-50">
        <div className="flex justify-around items-center h-14">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex flex-col items-center p-2 ${
                  activeTab === 'info' ? 'text-purple-600 dark:text-purple-400' : ''
                }`}
                onClick={() => setActiveTab('info')}
              >
                
                <span className="text-xs  "> <Info size={20} />Info</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>College Information</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4 overflow-y-auto text-black max-h-[calc(80vh-4rem)]">
                <div className={`p-3 rounded-lg  ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <div className="flex items-center mb-2">
                    <img
                      src="/placeholder.svg?height=40&width=40"
                      alt="College Avatar"
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <span className="font-semibold">
                      {collegeInfo.name || "College Name"}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <GraduationCap className="mr-2 text-green-500" />
                    Course
                  </h4>
                  <p>{collegeInfo.course || "Not selected"}</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <CircleDollarSign className="mr-2 text-yellow-500" />
                    Fees
                  </h4>
                  <p>{collegeInfo.fees || "Not selected"}</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Scissors className="mr-2 text-red-500" />
                    Cutoff
                  </h4>
                  <p>{renderCutoffInfo()}</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Heart className="mr-2 text-pink-500" />
                    Scholarship
                  </h4>
                  <p>{collegeInfo.scholarships || "Not selected"}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className={`flex text-black flex-col items-center p-2 ${
                  activeTab === 'tools' ? 'text-purple-600 dark:text-purple-400' : ''
                }`}
                onClick={() => setActiveTab('tools')}
              >
                
                <span className="text-xs "><Wrench size={20} />Tools</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Tools</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 mt-4">
                <Button
                  onClick={onDownloadSummary}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Summary
                </Button>
                <Button
                  onClick={onOpenCollegeComparison}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <School className="mr-2 h-4 w-4" />
                  College Comparison
                </Button>
                <Button
                  onClick={onOpenCourseComparison}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Course Comparison
                </Button>
                <Button
                  onClick={onOpenQuiz}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Course Selection Quiz
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}

