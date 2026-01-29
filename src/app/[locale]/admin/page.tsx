import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Fetch dashboard statistics from database
async function getDashboardStats() {
  const supabase = await createClient();

  // Parallel queries for performance
  const [
    hospitalsResult,
    interpretersResult,
    inquiriesResult,
    blogPostsResult,
    chatConversationsResult,
  ] = await Promise.all([
    supabase.from('hospitals').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('author_personas').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('chat_conversations').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalHospitals: hospitalsResult.count || 0,
    activeInterpreters: interpretersResult.count || 0,
    newInquiries: inquiriesResult.count || 0,
    publishedArticles: blogPostsResult.count || 0,
    chatSessions: chatConversationsResult.count || 0,
  };
}

// Fetch recent inquiries
async function getRecentInquiries() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('inquiries')
    .select('id, name, procedure_interest, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}

// Fetch top performing blog posts
async function getTopBlogPosts() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title_en, view_count')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(5);

  return data || [];
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch all data in parallel
  const [stats, recentInquiries, topPosts] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(),
    getTopBlogPosts(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Hospitals"
          value={stats.totalHospitals.toString()}
          icon="building2"
        />
        <StatsCard
          title="Active Interpreters"
          value={stats.activeInterpreters.toString()}
          icon="users"
        />
        <StatsCard
          title="New Inquiries"
          value={stats.newInquiries.toString()}
          icon="messageSquare"
          highlight={stats.newInquiries > 0}
        />
        <StatsCard
          title="Published Articles"
          value={stats.publishedArticles.toString()}
          icon="fileText"
        />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chat Sessions"
          value={stats.chatSessions.toString()}
          icon="sparkles"
        />
        <StatsCard
          title="Avg. Rating"
          value="4.8"
          icon="trendingUp"
        />
        <StatsCard
          title="Total Views"
          value="0"
          icon="eye"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInquiries inquiries={recentInquiries} />
        <ContentPerformance posts={topPosts} />
      </div>
    </div>
  );
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

interface Inquiry {
  id: string;
  name: string;
  procedure_interest: string | null;
  status: string;
  created_at: string;
}

function RecentInquiries({ inquiries }: { inquiries: Inquiry[] }) {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Inquiries</CardTitle>
      </CardHeader>
      <CardContent>
        {inquiries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No inquiries yet</p>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{inquiry.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {inquiry.procedure_interest || 'General inquiry'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      statusColors[inquiry.status] || statusColors.new
                    }`}
                  >
                    {inquiry.status.replace('_', ' ')}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(inquiry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  view_count: number;
}

function ContentPerformance({ posts }: { posts: BlogPost[] }) {
  // Format number with K suffix for thousands
  const formatViews = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Content</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No published articles yet</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="truncate font-medium">{post.title_en}</p>
                  </div>
                  <p className="ml-8 text-sm text-muted-foreground">
                    {formatViews(post.view_count)} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
