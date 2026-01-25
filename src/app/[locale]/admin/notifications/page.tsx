import { setRequestLocale } from 'next-intl/server';
import {
  Bell,
  Check,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Settings,
  MessageSquare,
  Slack,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// Get notifications from database
async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('admin_notifications') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

// Get notification settings
async function getNotificationSettings() {
  const settings = {
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhookUrl: process.env.SLACK_WEBHOOK_URL ? '설정됨' : '미설정',
    },
    discord: {
      enabled: !!process.env.DISCORD_WEBHOOK_URL,
      webhookUrl: process.env.DISCORD_WEBHOOK_URL ? '설정됨' : '미설정',
    },
    email: {
      enabled: !!process.env.NOTIFICATION_EMAIL,
      email: process.env.NOTIFICATION_EMAIL || '미설정',
    },
    browser: {
      enabled: true,
    },
  };

  return settings;
}

// Get API usage stats
async function getApiUsageStats() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usageData } = await (supabase
    .from('api_usage_logs') as any)
    .select('provider, tokens_used, cost_usd, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Aggregate by provider
  const byProvider: Record<string, { tokens: number; cost: number; calls: number }> = {};

  (usageData || []).forEach((log: { provider: string; tokens_used: number; cost_usd: number }) => {
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { tokens: 0, cost: 0, calls: 0 };
    }
    byProvider[log.provider].tokens += log.tokens_used || 0;
    byProvider[log.provider].cost += log.cost_usd || 0;
    byProvider[log.provider].calls += 1;
  });

  const totalCost = Object.values(byProvider).reduce((sum, p) => sum + p.cost, 0);
  const totalCalls = Object.values(byProvider).reduce((sum, p) => sum + p.calls, 0);

  return {
    byProvider,
    totalCost,
    totalCalls,
    period: '30일',
  };
}

export default async function NotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [notifications, settings, apiUsage] = await Promise.all([
    getNotifications(),
    getNotificationSettings(),
    getApiUsageStats(),
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            시스템 알림 및 API 사용량 모니터링
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} 새 알림
          </Badge>
        )}
      </div>

      {/* API Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            API 비용 모니터링 ({apiUsage.period})
          </CardTitle>
          <CardDescription>
            AI 서비스 API 사용량 및 비용 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">총 비용</p>
              <p className="text-2xl font-bold text-primary">
                ${apiUsage.totalCost.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">총 API 호출</p>
              <p className="text-2xl font-bold">{apiUsage.totalCalls.toLocaleString()}</p>
            </div>

            {Object.entries(apiUsage.byProvider).map(([provider, stats]) => (
              <div key={provider} className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">{provider}</p>
                <p className="text-lg font-bold">${stats.cost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.calls.toLocaleString()} calls • {stats.tokens.toLocaleString()} tokens
                </p>
              </div>
            ))}
          </div>

          {apiUsage.totalCost > 50 && (
            <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  비용 경고
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  이번 달 API 비용이 $50를 초과했습니다. 사용량을 확인해주세요.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Slack className="h-8 w-8 text-[#4A154B]" />
              <div>
                <p className="font-medium">Slack</p>
                <p className="text-sm text-muted-foreground">
                  {settings.slack.enabled ? (
                    <span className="text-green-600">✓ 연동됨</span>
                  ) : (
                    <span className="text-red-500">미설정</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-[#5865F2]" />
              <div>
                <p className="font-medium">Discord</p>
                <p className="text-sm text-muted-foreground">
                  {settings.discord.enabled ? (
                    <span className="text-green-600">✓ 연동됨</span>
                  ) : (
                    <span className="text-red-500">미설정</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">이메일</p>
                <p className="text-sm text-muted-foreground">
                  {settings.email.enabled ? (
                    <span className="text-green-600">✓ {settings.email.email}</span>
                  ) : (
                    <span className="text-red-500">미설정</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Bell className="h-8 w-8 text-orange-500" />
              <div>
                <p className="font-medium">브라우저</p>
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-600">✓ 활성화됨</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>알림 채널 설정:</strong> .env.local에 아래 환경 변수를 추가하세요.
            </p>
            <pre className="mt-2 text-xs bg-background p-2 rounded">
{`SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
NOTIFICATION_EMAIL=admin@example.com`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              최근 알림
            </CardTitle>
            <CardDescription>시스템 이벤트 및 알림 목록</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            모두 읽음 처리
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>새로운 알림이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  };

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg ${
        notification.read ? 'bg-muted/50' : bgColors[notification.type]
      }`}
    >
      <div className="flex-shrink-0">{icons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{notification.title}</p>
          {!notification.read && (
            <Badge variant="secondary" className="text-xs">NEW</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {notification.source} • {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Check className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
