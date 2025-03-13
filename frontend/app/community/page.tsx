import CommunityFeed from "@/components/community/community-feed"
import ProfileSidebar from "@/components/community/profile-sidebar"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Community Platform</h1>
        <div className="text-gray-500">Menu would go here</div>
      </header>

      <div className="flex flex-col md:flex-row">
        <ProfileSidebar />
        <CommunityFeed />
      </div>
    </main>
  )
}

