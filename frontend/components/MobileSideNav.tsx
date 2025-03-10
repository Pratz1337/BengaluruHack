import React from 'react'
import { useRouter } from 'next/router'
import { Sun, Moon, Activity, Award, BadgeDollarSign, BookOpen, Home, Info, Scissors } from 'lucide-react'
import { Button } from "@nextui-org/button"
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

interface MobileSideNavProps {
  isOpen: boolean
  onClose: () => void
  router: AppRouterInstance
  toggleTheme: () => void
  theme: 'light' | 'dark'
}

const MENU_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Info, label: 'Information', path: '/generalinformation' },
  { icon: Scissors, label: 'Cutoffs', path: '/cutoffs' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: Award, label: 'Scholarships', path: '/scholarships' },
  { icon: BadgeDollarSign, label: 'Placements', path: '/placements' },
  { icon: Activity, label: 'Events', path: '/internalEvents'}
]
const MobileSideNav: React.FC<MobileSideNavProps> = ({ isOpen, onClose, router, toggleTheme, theme }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl z-50">
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-4 py-2">
          {MENU_ITEMS.map((item) => (
            <Button
              key={item.label}
              onClick={() => {
                router.push(item.path)
                onClose()
              }}
              className="w-full justify-start mb-2 text-left"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
          <Button onClick={toggleTheme} className="w-full justify-start mb-2 text-left">
            {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </nav>
      </div>
    </div>
  )
}

export default MobileSideNav

