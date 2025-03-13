
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ScrollText, Plus, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CommunityFeed from '@/components/community/CommunityFeed';
import PostForm from '@/components/community/PostForm';
import { ThreadData } from '@/components/community/ThreadCard';
import { initScrollAnimations } from '@/utils/animations';

// Mock data
const MOCK_THREADS: ThreadData[] = [
  {
    id: '1',
    title: 'How should I plan for retirement in my 30s?',
    content: 'I recently turned 30 and I\'m starting to think more seriously about retirement planning. I have a 401k through my employer, but I\'m wondering what else I should be doing. Should I open an IRA? How much should I be saving each month? Any advice would be appreciated!',
    authorName: 'Alex Morgan',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
    createdAt: '2023-09-15T14:30:00Z',
    category: 'Financial Goals',
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: '2',
    title: 'Is a mortgage worth it in this market?',
    content: 'With interest rates and housing prices where they are, I\'m trying to decide if now is a good time to buy a home or if I should continue renting. I have about 20% saved for a down payment on a modest home in my area, but I\'m concerned about potential market corrections. What factors should I be considering?',
    authorName: 'Sam Wilson',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
    createdAt: '2023-09-17T09:15:00Z',
    category: 'Loan Eligibility',
    likes: 18,
    comments: 12,
    isLiked: true
  },
  {
    id: '3',
    title: 'Tips for building an emergency fund from scratch?',
    content: 'I\'ve realized I don\'t have any emergency savings and want to start building a safety net. I currently live paycheck to paycheck but want to change that. How much should I aim to save, and what strategies have worked for others in a similar situation?',
    authorName: 'Jamie Lee',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
    createdAt: '2023-09-18T16:45:00Z',
    category: 'Saving Tips',
    likes: 42,
    comments: 15,
    isLiked: false
  },
  {
    id: '4',
    title: 'How to improve my credit score after bankruptcy?',
    content: 'I had to file for bankruptcy last year due to medical debt. Now I\'m trying to rebuild my financial life and improve my credit score. Where should I start? Are there specific credit cards or loans that are better for rebuilding credit?',
    authorName: 'Taylor Kim',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
    createdAt: '2023-09-20T11:20:00Z',
    category: 'Credit Score',
    likes: 31,
    comments: 19,
    isLiked: false
  },
  {
    id: '5',
    title: 'Best budgeting apps in 2023?',
    content: 'I\'m looking for a good budgeting app that can help me track my expenses and plan my savings. There are so many options out there—YNAB, Mint, EveryDollar, etc. What are you using and why do you like it? Any premium apps that are worth paying for?',
    authorName: 'Jordan Rivera',
    authorAvatar: 'https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
    createdAt: '2023-09-21T14:10:00Z',
    category: 'Budgeting',
    likes: 56,
    comments: 27,
    isLiked: true
  }
];

const Community = () => {
  const [threads, setThreads] = useState<ThreadData[]>(MOCK_THREADS);
  const [isPostFormVisible, setIsPostFormVisible] = useState(false);
  
  // Initialize scroll animations
  initScrollAnimations();
  
  useEffect(() => {
    // Apply animation delay to threads
    const threadElements = document.querySelectorAll('.thread-card');
    threadElements.forEach((el, index) => {
      el.classList.add(`delay-${index * 100}`);
    });
  }, []);
  
  const handleLikeThread = (id: string) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === id) {
        const newIsLiked = !thread.isLiked;
        return {
          ...thread,
          isLiked: newIsLiked,
          likes: newIsLiked ? thread.likes + 1 : thread.likes - 1
        };
      }
      return thread;
    }));
  };
  
  const handleAddPost = (post: { title: string; content: string; category: string }) => {
    const newThread: ThreadData = {
      id: `new-${Date.now()}`,
      title: post.title,
      content: post.content,
      authorName: 'You',
      authorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80',
      createdAt: new Date().toISOString(),
      category: post.category,
      likes: 0,
      comments: 0,
      isLiked: false
    };
    
    setThreads(prev => [newThread, ...prev]);
    setIsPostFormVisible(false);
    
    // Show success notification
    toast.success('Your post has been published!');
  };
  
  const handleSearch = (query: string) => {
    if (!query) {
      setThreads(MOCK_THREADS);
      return;
    }
    
    const filtered = MOCK_THREADS.filter(thread => {
      const searchFields = [thread.title, thread.content, thread.category, thread.authorName].join(' ').toLowerCase();
      return searchFields.includes(query.toLowerCase());
    });
    
    setThreads(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Main content */}
      <main className="pt-24 pb-16 px-4 md:px-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Community</h1>
              <p className="text-sm text-muted-foreground">Join the conversation</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsPostFormVisible(!isPostFormVisible)} 
            className="premium-button gap-2"
          >
            {isPostFormVisible ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>New Post</span>
              </>
            )}
          </button>
        </div>
        
        {/* Post form */}
        {isPostFormVisible && (
          <div className="mb-8 animate-fade-in">
            <PostForm onSubmit={handleAddPost} />
          </div>
        )}
        
        {/* Feed */}
        <CommunityFeed 
          threads={threads} 
          onLikeThread={handleLikeThread}
          onSearch={handleSearch}
        />
      </main>
    </div>
  );
};

export default Community;