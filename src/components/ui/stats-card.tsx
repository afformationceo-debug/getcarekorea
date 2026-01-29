"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  LucideIcon,
  Building2,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Sparkles,
  Eye,
  DollarSign,
  Activity,
  BarChart3,
  Globe,
  Heart,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

// Icon name to component mapping for Server Component compatibility
const iconMap: Record<string, LucideIcon> = {
  building2: Building2,
  users: Users,
  messageSquare: MessageSquare,
  fileText: FileText,
  calendar: Calendar,
  sparkles: Sparkles,
  eye: Eye,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  dollarSign: DollarSign,
  activity: Activity,
  barChart3: BarChart3,
  globe: Globe,
  heart: Heart,
  star: Star,
  clock: Clock,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
};

export type IconName = keyof typeof iconMap;

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: IconName | LucideIcon;
  highlight?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function StatsCard({
  title,
  value,
  icon,
  highlight = false,
  className,
  children,
}: StatsCardProps) {
  // Resolve icon: either from string name or direct component
  const Icon = typeof icon === "string" ? iconMap[icon] : icon;

  return (
    <Card className={cn(highlight && "border-primary bg-primary/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4",
              highlight ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn("text-2xl font-bold", highlight && "text-primary")}
        >
          {value}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  icon?: IconName | LucideIcon;
  invertTrend?: boolean;
  trendLabel?: string;
  className?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  invertTrend = false,
  trendLabel = "vs last period",
  className,
}: MetricCardProps) {
  const isPositive = invertTrend ? trend === "down" : trend === "up";
  // Resolve icon: either from string name or direct component
  const Icon = typeof icon === "string" ? iconMap[icon] : icon;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={isPositive ? "text-green-500" : "text-red-500"}>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { StatsCard, MetricCard };
