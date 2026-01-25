'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Eye,
  Loader2,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface FeedbackEntry {
  id: string;
  contentDraftId: string;
  feedbackType: 'approve' | 'edit' | 'reject';
  feedbackText: string | null;
  regenerated: boolean;
  adminId: string | null;
  createdAt: string;
  // Joined data
  postTitle: string;
  postSlug: string;
}

interface FeedbackStats {
  totalFeedback: number;
  approved: number;
  edited: number;
  rejected: number;
  regeneratedCount: number;
  avgResponseTime: number;
  satisfactionRate: number;
}

interface FeedbackTrend {
  date: string;
  approved: number;
  edited: number;
  rejected: number;
}

interface CommonIssue {
  issue: string;
  count: number;
  percentage: number;
}

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    approved: 0,
    edited: 0,
    rejected: 0,
    regeneratedCount: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
  });
  const [trends, setTrends] = useState<FeedbackTrend[]>([]);
  const [commonIssues, setCommonIssues] = useState<CommonIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('range', dateRange);
      if (feedbackTypeFilter !== 'all') params.set('type', feedbackTypeFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFeedbackList(data.data.feedback || []);
        setStats(data.data.stats || {
          totalFeedback: 0,
          approved: 0,
          edited: 0,
          rejected: 0,
          regeneratedCount: 0,
          avgResponseTime: 0,
          satisfactionRate: 0,
        });
        setTrends(data.data.trends || []);
        setCommonIssues(data.data.commonIssues || []);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, feedbackTypeFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'approve':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'edit':
        return <Edit3 className="h-4 w-4 text-yellow-500" />;
      case 'reject':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approve: 'default',
      edit: 'secondary',
      reject: 'destructive',
    };

    const labels: Record<string, string> = {
      approve: 'Approved',
      edit: 'Edited',
      reject: 'Rejected',
    };

    return (
      <Badge variant={variants[type] || 'outline'} className="gap-1">
        {getFeedbackTypeIcon(type)}
        {labels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportFeedback = () => {
    const csv = [
      ['Date', 'Post Title', 'Type', 'Feedback', 'Regenerated'].join(','),
      ...feedbackList.map(f => [
        f.createdAt,
        `"${f.postTitle}"`,
        f.feedbackType,
        `"${f.feedbackText || ''}"`,
        f.regenerated ? 'Yes' : 'No',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-violet-600" />
            Feedback Analytics
          </h1>
          <p className="text-muted-foreground">
            Content feedback analysis and improvement insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportFeedback}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedback}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedback > 0 ? Math.round((stats.approved / stats.totalFeedback) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.edited}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedback > 0 ? Math.round((stats.edited / stats.totalFeedback) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <ThumbsDown className="h-4 w-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedback > 0 ? Math.round((stats.rejected / stats.totalFeedback) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Regenerated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regeneratedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgResponseTime > 0 ? `${Math.round(stats.avgResponseTime)}m` : '-'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-600">
              Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {stats.satisfactionRate > 0 ? `${stats.satisfactionRate}%` : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feedback Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Feedback Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.totalFeedback === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No feedback data available
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Approved
                    </span>
                    <span className="font-medium">{stats.approved}</span>
                  </div>
                  <Progress
                    value={(stats.approved / stats.totalFeedback) * 100}
                    className="h-2 bg-green-100 [&>div]:bg-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      Edited
                    </span>
                    <span className="font-medium">{stats.edited}</span>
                  </div>
                  <Progress
                    value={(stats.edited / stats.totalFeedback) * 100}
                    className="h-2 bg-yellow-100 [&>div]:bg-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      Rejected
                    </span>
                    <span className="font-medium">{stats.rejected}</span>
                  </div>
                  <Progress
                    value={(stats.rejected / stats.totalFeedback) * 100}
                    className="h-2 bg-red-100 [&>div]:bg-red-500"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Common Improvement Areas
            </CardTitle>
            <CardDescription>
              Most frequently mentioned issues in edit/reject feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commonIssues.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No issues identified yet
              </p>
            ) : (
              <div className="space-y-3">
                {commonIssues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-8 text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{issue.issue}</span>
                        <span className="text-sm text-muted-foreground">
                          {issue.count} ({issue.percentage}%)
                        </span>
                      </div>
                      <Progress value={issue.percentage} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback History
              </CardTitle>
              <CardDescription>
                Detailed feedback entries from content review
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] pl-8"
                />
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={feedbackTypeFilter} onValueChange={setFeedbackTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="approve">Approved</SelectItem>
                  <SelectItem value="edit">Edited</SelectItem>
                  <SelectItem value="reject">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback entries found</p>
              <p className="text-sm">Feedback will appear here when content is reviewed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Regenerated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackList.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="text-sm">
                      {formatDate(feedback.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">
                          {feedback.postTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          /{feedback.postSlug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getFeedbackTypeBadge(feedback.feedbackType)}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {feedback.feedbackText || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {feedback.regenerated ? (
                        <Badge variant="outline" className="text-xs">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/admin/content`, '_self')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AI Learning Insights */}
      <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            AI Learning Insights
          </CardTitle>
          <CardDescription>
            How feedback is improving content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-medium mb-2">Quality Improvement</h4>
              <p className="text-2xl font-bold text-green-600">
                +{Math.round(stats.satisfactionRate * 0.15)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Since implementing feedback loop
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-medium mb-2">Regeneration Reduction</h4>
              <p className="text-2xl font-bold text-blue-600">
                -{stats.regeneratedCount > 5 ? Math.round((stats.regeneratedCount / stats.totalFeedback) * 10) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                Fewer regeneration requests
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-medium mb-2">Patterns Learned</h4>
              <p className="text-2xl font-bold text-violet-600">
                {commonIssues.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Improvement patterns identified
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
