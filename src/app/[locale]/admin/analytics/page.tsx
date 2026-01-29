'use client';

import { useState } from 'react';
import {
  Eye,
  MousePointer,
  Users,
  Clock,
  Globe,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/stats-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');

  // Mock analytics data
  const metrics = {
    visitors: {
      value: 45234,
      change: 12.5,
      trend: 'up' as const,
    },
    pageViews: {
      value: 128456,
      change: 8.3,
      trend: 'up' as const,
    },
    bounceRate: {
      value: 42.3,
      change: -3.2,
      trend: 'down' as const,
    },
    avgSessionDuration: {
      value: '3m 24s',
      change: 15.7,
      trend: 'up' as const,
    },
    conversions: {
      value: 234,
      change: 23.4,
      trend: 'up' as const,
    },
    inquiries: {
      value: 89,
      change: 18.2,
      trend: 'up' as const,
    },
  };

  const topPages = [
    { path: '/hospitals', views: 15234, percentage: 35 },
    { path: '/blog/best-plastic-surgery-korea', views: 12456, percentage: 28 },
    { path: '/interpreters', views: 8923, percentage: 20 },
    { path: '/inquiry', views: 5234, percentage: 12 },
    { path: '/blog/rhinoplasty-cost-guide', views: 2345, percentage: 5 },
  ];

  const topCountries = [
    { country: 'United States', visitors: 12345, flag: '🇺🇸' },
    { country: 'Japan', visitors: 8934, flag: '🇯🇵' },
    { country: 'Taiwan', visitors: 7823, flag: '🇹🇼' },
    { country: 'China', visitors: 6234, flag: '🇨🇳' },
    { country: 'Thailand', visitors: 4567, flag: '🇹🇭' },
    { country: 'Russia', visitors: 2345, flag: '🇷🇺' },
    { country: 'Mongolia', visitors: 1234, flag: '🇲🇳' },
  ];

  const conversionFunnel = [
    { stage: 'Landing Page Visits', count: 45234, percentage: 100 },
    { stage: 'Hospital/Interpreter View', count: 28456, percentage: 62.9 },
    { stage: 'Chat Interaction', count: 8234, percentage: 18.2 },
    { stage: 'Inquiry Form Start', count: 1234, percentage: 2.7 },
    { stage: 'Inquiry Submitted', count: 234, percentage: 0.5 },
  ];

  const llmMetrics = {
    totalInteractions: 8234,
    avgResponseTime: '1.2s',
    satisfactionRate: 89,
    toolUsage: {
      searchHospitals: 3456,
      getProcedureInfo: 2345,
      createInquiry: 1234,
    },
    costThisMonth: 234.56,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your platform performance and user behavior
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Visitors"
          value={metrics.visitors.value.toLocaleString()}
          change={metrics.visitors.change}
          trend={metrics.visitors.trend}
          icon={Users}
        />
        <MetricCard
          title="Page Views"
          value={metrics.pageViews.value.toLocaleString()}
          change={metrics.pageViews.change}
          trend={metrics.pageViews.trend}
          icon={Eye}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.bounceRate.value}%`}
          change={metrics.bounceRate.change}
          trend={metrics.bounceRate.trend}
          icon={MousePointer}
          invertTrend
        />
        <MetricCard
          title="Avg. Session Duration"
          value={metrics.avgSessionDuration.value}
          change={metrics.avgSessionDuration.change}
          trend={metrics.avgSessionDuration.trend}
          icon={Clock}
        />
        <MetricCard
          title="Conversions"
          value={metrics.conversions.value.toString()}
          change={metrics.conversions.change}
          trend={metrics.conversions.trend}
          icon={TrendingUp}
        />
        <MetricCard
          title="Inquiries"
          value={metrics.inquiries.value.toString()}
          change={metrics.inquiries.change}
          trend={metrics.inquiries.trend}
          icon={ArrowUpRight}
        />
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPages.map((page, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{page.path}</span>
                        <span className="text-muted-foreground">
                          {page.views.toLocaleString()} views
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Visitors by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCountries.map((country, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag}</span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {country.visitors.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">
                        {stage.count.toLocaleString()} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="h-8 overflow-hidden rounded bg-muted">
                      <div
                        className="flex h-full items-center justify-end bg-primary px-3"
                        style={{ width: `${stage.percentage}%` }}
                      >
                        {stage.percentage > 10 && (
                          <span className="text-xs text-primary-foreground">
                            {stage.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate by Source */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Organic Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.8%</div>
                <p className="text-xs text-green-500">+0.4% vs last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Direct Traffic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2%</div>
                <p className="text-xs text-green-500">+0.8% vs last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.5%</div>
                <p className="text-xs text-red-500">-0.2% vs last period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          {/* LLM Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total AI Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {llmMetrics.totalInteractions.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg. Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{llmMetrics.avgResponseTime}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Satisfaction Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{llmMetrics.satisfactionRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cost This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${llmMetrics.costThisMonth}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tool Usage */}
          <Card>
            <CardHeader>
              <CardTitle>AI Tool Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(llmMetrics.toolUsage).map(([tool, count]) => (
                  <div key={tool} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {tool.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-muted-foreground">
                        {count.toLocaleString()} calls
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(count / llmMetrics.totalInteractions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

