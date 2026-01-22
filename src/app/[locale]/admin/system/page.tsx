import { setRequestLocale } from 'next-intl/server';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheck: string;
  details?: string;
}

// Check system services status
async function getSystemStatus(): Promise<ServiceStatus[]> {
  const services: ServiceStatus[] = [];
  const now = new Date().toISOString();

  // Check Supabase
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    services.push({
      name: 'Supabase Database',
      status: error ? 'degraded' : 'healthy',
      lastCheck: now,
      details: error ? error.message : 'Connected',
    });
  } catch {
    services.push({
      name: 'Supabase Database',
      status: 'down',
      lastCheck: now,
      details: 'Connection failed',
    });
  }

  // Check Redis (Upstash) - simplified check
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  services.push({
    name: 'Upstash Redis',
    status: redisUrl ? 'healthy' : 'unknown',
    lastCheck: now,
    details: redisUrl ? 'Configured' : 'Not configured',
  });

  // Check Vector DB (Upstash)
  const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
  services.push({
    name: 'Upstash Vector',
    status: vectorUrl ? 'healthy' : 'unknown',
    lastCheck: now,
    details: vectorUrl ? 'Configured' : 'Not configured',
  });

  // Check AI Services
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  services.push({
    name: 'Anthropic Claude',
    status: anthropicKey ? 'healthy' : 'unknown',
    lastCheck: now,
    details: anthropicKey ? 'API key configured' : 'Not configured',
  });

  // Check GSC
  const gscClientId = process.env.GSC_CLIENT_ID;
  services.push({
    name: 'Google Search Console',
    status: gscClientId ? 'healthy' : 'unknown',
    lastCheck: now,
    details: gscClientId ? 'OAuth configured' : 'Not configured',
  });

  // Check Nanobanana
  const nanobananaKey = process.env.NANOBANANA_API_KEY;
  services.push({
    name: 'Nanobanana (Images)',
    status: nanobananaKey ? 'healthy' : 'unknown',
    lastCheck: now,
    details: nanobananaKey ? 'API key configured' : 'Not configured',
  });

  return services;
}

// Get queue statistics
async function getQueueStats() {
  const supabase = await createClient();

  // Get pending content generation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingKeywords } = await (supabase
    .from('content_keywords') as any)
    .select('id', { count: 'exact', head: true })
    .is('generated_at', null);

  // Get recent cron logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cronLogs } = await (supabase
    .from('cron_logs') as any)
    .select('job_name, status, execution_time_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get draft/scheduled posts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: draftPosts } = await (supabase
    .from('blog_posts') as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: scheduledPosts } = await (supabase
    .from('blog_posts') as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'scheduled');

  // Get image generation stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingImages } = await (supabase
    .from('image_generations') as any)
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'generating']);

  return {
    pendingKeywords: pendingKeywords || 0,
    draftPosts: draftPosts || 0,
    scheduledPosts: scheduledPosts || 0,
    pendingImages: pendingImages || 0,
    cronLogs: cronLogs || [],
  };
}

// Get content automation stats
async function getAutomationStats() {
  const supabase = await createClient();

  // Total generated content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalGenerated } = await (supabase
    .from('blog_posts') as any)
    .select('id', { count: 'exact', head: true });

  // Published content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: publishedCount } = await (supabase
    .from('blog_posts') as any)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  // High performers (from learning data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: highPerformers } = await (supabase
    .from('llm_learning_data') as any)
    .select('id', { count: 'exact', head: true })
    .eq('source_type', 'high_performer');

  // Vectorized learning data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: vectorizedCount } = await (supabase
    .from('llm_learning_data') as any)
    .select('id', { count: 'exact', head: true })
    .eq('is_vectorized', true);

  // Total keywords
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalKeywords } = await (supabase
    .from('content_keywords') as any)
    .select('id', { count: 'exact', head: true });

  return {
    totalGenerated: totalGenerated || 0,
    publishedCount: publishedCount || 0,
    highPerformers: highPerformers || 0,
    vectorizedCount: vectorizedCount || 0,
    totalKeywords: totalKeywords || 0,
    publishRate: totalGenerated ? Math.round((publishedCount || 0) / totalGenerated * 100) : 0,
  };
}

export default async function SystemStatusPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [services, queueStats, automationStats] = await Promise.all([
    getSystemStatus(),
    getQueueStats(),
    getAutomationStats(),
  ]);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const overallHealth = healthyCount === services.length ? 'All Systems Operational' :
    healthyCount > services.length / 2 ? 'Partial Degradation' : 'System Issues Detected';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">System Status</h1>
        <p className="text-muted-foreground">Monitor system health and automation status</p>
      </div>

      {/* Overall Health */}
      <Card className={healthyCount === services.length ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}>
        <CardContent className="flex items-center gap-4 py-4">
          {healthyCount === services.length ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          )}
          <div>
            <h2 className="text-xl font-semibold">{overallHealth}</h2>
            <p className="text-sm text-muted-foreground">
              {healthyCount}/{services.length} services healthy
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>External services and API connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <StatusIcon status={service.status} />
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.details}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.totalKeywords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.totalGenerated}</div>
            <p className="text-xs text-muted-foreground">{automationStats.publishRate}% published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.highPerformers}</div>
            <p className="text-xs text-muted-foreground">in learning data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vectorized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationStats.vectorizedCount}</div>
            <p className="text-xs text-muted-foreground">embeddings stored</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <QueueItem label="Pending Keywords" value={queueStats.pendingKeywords} icon={Database} />
              <QueueItem label="Draft Posts" value={queueStats.draftPosts} icon={Clock} />
              <QueueItem label="Scheduled Posts" value={queueStats.scheduledPosts} icon={Clock} />
              <QueueItem label="Pending Images" value={queueStats.pendingImages} icon={Cpu} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recent Cron Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueStats.cronLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No cron jobs executed yet</p>
            ) : (
              <div className="space-y-3">
                {queueStats.cronLogs.map((log: {
                  job_name: string;
                  status: string;
                  execution_time_ms: number;
                  created_at: string;
                }, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                    <div>
                      <p className="font-medium">{log.job_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status}
                      </span>
                      {log.execution_time_ms && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.execution_time_ms}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'degraded':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'down':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function QueueItem({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-medium ${value > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
