import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@nextui-org/button"

interface YearPickerProps {
  minYear: number
  maxYear: number
  selectedYear: number | null
  onYearSelect: (year: number) => void
  theme: 'light' | 'dark'
}

const YearPicker: React.FC<YearPickerProps> = ({ minYear, maxYear, selectedYear, onYearSelect, theme }) => {
  const [decade, setDecade] = useState(Math.floor((selectedYear || new Date().getFullYear()) / 10) * 10)

  const years = Array.from({ length: 10 }, (_, i) => decade + i).filter(year => year >= minYear && year <= maxYear)

  const handlePrevDecade = () => setDecade(prev => Math.max(prev - 10, minYear))
  const handleNextDecade = () => setDecade(prev => Math.min(prev + 10, maxYear - 9))

  return (
    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={handlePrevDecade} disabled={decade <= minYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold">{decade} - {decade + 9}</span>
        <Button variant="ghost" onClick={handleNextDecade} disabled={decade + 10 > maxYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map(year => (
          <Button
            key={year}
            onClick={() => onYearSelect(year)}
            variant={selectedYear === year ? "solid" : "ghost"}
            className={`w-full ${selectedYear === year ? 'bg-purple-600 text-white' : ''}`}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default YearPicker