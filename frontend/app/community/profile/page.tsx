import ProfileSidebar from "@/components/community/profile-sidebar"
import Timeline from "@/components/community/timeline"

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Community Platform</h1>
        <div className="text-gray-500">Menu would go here</div>
      </header>

      <div className="flex flex-col md:flex-row">
        <ProfileSidebar />

        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
            <Timeline />

            <h2 className="text-2xl font-bold mt-8 mb-6">Your Threads</h2>
            <div className="space-y-4">
              {/* This would be a list of the user's threads */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold">How to create a budget that actually works?</h3>
                <p className="text-sm text-gray-600 mt-1">Posted on October 5, 2022 • 24 comments</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold">Best credit cards for travel rewards in 2023</h3>
                <p className="text-sm text-gray-600 mt-1">Posted on January 12, 2023 • 18 comments</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold">How to negotiate a higher salary?</h3>
                <p className="text-sm text-gray-600 mt-1">Posted on March 8, 2023 • 32 comments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

