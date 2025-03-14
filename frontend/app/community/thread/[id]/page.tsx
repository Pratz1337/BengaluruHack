import PostTranslation from "@/components/community/posttranslation"

// Sample data for demonstration
const posts = [
  {
    id: "1",
    title: "Understanding Personal Loans",
    content:
      "Personal loans are unsecured loans that can be used for various purposes like home renovation, debt consolidation, or emergency expenses. They typically have fixed interest rates and repayment terms.",
    author: {
      name: "Financial Advisor",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "2 hours ago",
    category: "Loans",
  },
  {
    id: "2",
    title: "How to Improve Your Credit Score",
    content:
      "Your credit score plays a crucial role in loan approvals. Pay bills on time, reduce debt, and regularly check your credit report for errors to improve your score over time.",
    author: {
      name: "Credit Expert",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "1 day ago",
    category: "Credit",
  },
  {
    id: "3",
    title: "Comparing Home Loan Options",
    content:
      "When looking for a home loan, compare interest rates, processing fees, loan tenure, and prepayment options. Fixed-rate loans offer stability, while floating-rate loans may provide lower initial rates.",
    author: {
      name: "Mortgage Specialist",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "3 days ago",
    category: "Home Loans",
  },
]

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Financial Community Posts</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <PostTranslation key={post.id} post={post} />
        ))}
      </div>
    </main>
  )
}

