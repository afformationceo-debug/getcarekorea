'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FileText,
  Image,
  Globe,
  AlertTriangle,
  Play,
  Pause,
  BarChart3,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ContentGenerationJob {
  id: string;
  keyword: string;
  locale: string;
  status: 'queued' | 'generating' | 'translating' | 'image_generating' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  blogPostId: string | null;
}

interface QueueStats {
  totalQueued: number;
  currentlyProcessing: number;
  completedToday: number;
  failedToday: number;
  avgProcessingTime: number;
}

interface ImageJob {
  id: string;
  blogPostId: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl: string | null;
  error: string | null;
  createdAt: string;
}

interface CronJob {
  id: string;
  jobName: string;
  status: 'running' | 'success' | 'failed';
  executionTimeMs: number;
  details: string;
  createdAt: string;
}

export default function ProgressPage() {
  const [contentJobs, setContentJobs] = useState<ContentGenerationJob[]>([]);
  const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({
    totalQueued: 0,
    currentlyProcessing: 0,
    completedToday: 0,
    failedToday: 0,
    avgProcessingTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/progress');
      const data = await response.json();

      if (data.success) {
        setContentJobs(data.data.contentJobs || []);
        setImageJobs(data.data.imageJobs || []);
        setCronJobs(data.data.cronJobs || []);
        setQueueStats(data.data.stats || {
          totalQueued: 0,
          currentlyProcessing: 0,
          completedToday: 0,
          failedToday: 0,
          avgProcessingTime: 0,
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'generating':
      case 'translating':
      case 'image_generating':
      case 'running':
        return <LoadingSpinner size="sm" color="secondary" />;
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
      queued: 'secondary',
      generating: 'default',
      translating: 'default',
      image_generating: 'default',
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary',
      running: 'default',
      success: 'default',
    };

    const labels: Record<string, string> = {
      queued: 'Queued',
      generating: 'Generating',
      translating: 'Translating',
      image_generating: 'Image Gen',
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      running: 'Running',
      success: 'Success',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-violet-600" />
            Generation Progress
          </h1>
          <p className="text-muted-foreground">
            Real-time content generation monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString('ko-KR')}
          </div>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? (
              <>
                <Pause className="h-4 w-4" />
                Auto Refresh ON
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Auto Refresh OFF
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Queued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {queueStats.totalQueued}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {queueStats.currentlyProcessing}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {queueStats.completedToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {queueStats.failedToday}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Avg Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(queueStats.avgProcessingTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content Generation
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <Image className="h-4 w-4" />
            Image Generation
          </TabsTrigger>
          <TabsTrigger value="cron" className="gap-2">
            <Clock className="h-4 w-4" />
            Cron Jobs
          </TabsTrigger>
        </TabsList>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Active Content Jobs
              </CardTitle>
              <CardDescription>
                Real-time status of content generation queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" color="muted" />
                </div>
              ) : contentJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active content generation jobs</p>
                  <p className="text-sm">Jobs will appear here when content is being generated</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Locale</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {job.keyword}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.locale.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="w-[150px]">
                          <div className="space-y-1">
                            <Progress value={job.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {job.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.currentStep}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(job.startedAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.startedAt && !job.completedAt
                            ? formatDuration(Date.now() - new Date(job.startedAt).getTime())
                            : job.startedAt && job.completedAt
                            ? formatDuration(
                                new Date(job.completedAt).getTime() -
                                  new Date(job.startedAt).getTime()
                              )
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Active Processing Visualization */}
          {contentJobs.filter(j => ['generating', 'translating', 'image_generating'].includes(j.status)).length > 0 && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Activity className="h-5 w-5" />
                  Currently Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentJobs
                    .filter(j => ['generating', 'translating', 'image_generating'].includes(j.status))
                    .map((job) => (
                      <div key={job.id} className="p-4 rounded-lg bg-background border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <LoadingSpinner size="md" color="secondary" />
                            </div>
                            <div>
                              <p className="font-medium">{job.keyword}</p>
                              <p className="text-sm text-muted-foreground">
                                {job.currentStep}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{job.locale.toUpperCase()}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {job.progress}% complete
                            </p>
                          </div>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Image Generation Tab */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Generation Queue
              </CardTitle>
              <CardDescription>
                AI image generation status for blog posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" color="muted" />
                </div>
              ) : imageJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No image generation jobs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post ID</TableHead>
                      <TableHead>Prompt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imageJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">
                          {job.blogPostId.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm">
                          {job.prompt}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-sm">
                          {formatTime(job.createdAt)}
                        </TableCell>
                        <TableCell>
                          {job.imageUrl ? (
                            <a
                              href={job.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:underline text-sm"
                            >
                              View Image
                            </a>
                          ) : job.error ? (
                            <span className="text-red-500 text-sm" title={job.error}>
                              Error
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="cron" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cron Job History
              </CardTitle>
              <CardDescription>
                Recent automated job executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" color="muted" />
                </div>
              ) : cronJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cron job history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Ran At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          {job.jobName}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{formatDuration(job.executionTimeMs)}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                          {job.details}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(job.createdAt).toLocaleString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Alert */}
      {queueStats.failedToday > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-medium text-red-600">
                {queueStats.failedToday} jobs failed today
              </p>
              <p className="text-sm text-muted-foreground">
                Check the logs for detailed error information
              </p>
            </div>
            <Button variant="outline" className="ml-auto" asChild>
              <a href="/admin/system">View System Logs</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
