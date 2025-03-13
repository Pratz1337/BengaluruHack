import ThreadDetail from "@/components/community/thread-detail"

// This would typically come from a database or API
const mockThread = {
  id: "1",
  title: "Budgeting apps that actually work?",
  content:
    "I've tried several budgeting apps but always end up abandoning them after a few weeks. Which ones have you found actually help you stick to a budget long-term?",
  category: "Budgeting",
  author: {
    name: "David Williams",
    avatar: "/placeholder.svg?height=48&width=48",
  },
  date: "Nov 15, 4:45 PM",
  likes: 45,
  comments: [
    {
      id: "1",
      author: {
        name: "Alex Morgan",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "I've had great success with YNAB (You Need A Budget). It has a bit of a learning curve, but once you get the hang of it, it's incredibly powerful. The key feature for me is the ability to allocate every dollar to a specific purpose.",
      date: "Nov 15, 5:30 PM",
      likes: 12,
    },
    {
      id: "2",
      author: {
        name: "Jessica Miller",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        "I've been using Mint for years and it works well for me. It's free and automatically categorizes most transactions. The reports help me see where my money is going each month.",
      date: "Nov 15, 6:15 PM",
      likes: 8,
    },
    {
      id: "3",
      author: {
        name: "Michael Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content:
        'Have you tried Goodbudget? It uses the envelope system which I find really helps with discipline. You allocate money to different "envelopes" and when an envelope is empty, you stop spending in that category.',
      date: "Nov 16, 9:20 AM",
      likes: 5,
    },
  ],
}

export default function ThreadPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the thread data based on the ID
  // const thread = await getThread(params.id);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Community Platform</h1>
        <div className="text-gray-500">Menu would go here</div>
      </header>

      <ThreadDetail {...mockThread} />
    </main>
  )
}

