import { MapPin, ExternalLink, Mail, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function ProfileSidebar() {
  return (
    <aside className="w-full md:w-80 p-6 border-r border-gray-200">
      <div className="flex flex-col items-center md:items-start">
        <div className="relative mb-4">
          <Image
            src="/placeholder.svg?height=120&width=120"
            alt="Alex Morgan"
            width={120}
            height={120}
            className="rounded-full border-4 border-white"
          />
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>

        <h2 className="text-2xl font-bold">Alex Morgan</h2>
        <p className="text-gray-600 mb-2">@alexmorgan</p>

        <p className="text-gray-700 mb-4">
          Finance enthusiast and budget planner. I help people navigate their personal finance journey and achieve their
          financial goals.
        </p>

        <div className="flex flex-col space-y-2 w-full mb-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>San Francisco, CA</span>
          </div>

          <div className="flex items-center text-blue-600">
            <ExternalLink className="w-4 h-4 mr-2" />
            <a href="#" className="hover:underline">
              Website ↗
            </a>
          </div>

          <div className="flex items-center text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            <span>alex@example.com</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Joined 6/15/2022</span>
          </div>
        </div>

        <div className="grid grid-cols-3 w-full mb-6 text-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">47</span>
            <span className="text-gray-600 text-sm">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">156</span>
            <span className="text-gray-600 text-sm">Comments</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">382</span>
            <span className="text-gray-600 text-sm">Likes</span>
          </div>
        </div>

        <div className="w-full mb-6">
          <h3 className="font-semibold mb-2">Badges</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <span className="text-orange-500">🔥</span> Top Contributor
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <span className="text-blue-500">🔵</span> Verified Expert
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <span className="text-blue-500">🔵</span> Helpful Member
            </Badge>
          </div>
        </div>

        <div className="flex w-full gap-2">
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700">Follow</Button>
          <Button variant="outline" className="flex-1">
            Message
          </Button>
        </div>
      </div>
    </aside>
  )
}

