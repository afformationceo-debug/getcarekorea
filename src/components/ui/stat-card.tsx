'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: number | string;
  color?: 'default' | 'gray' | 'green' | 'yellow' | 'blue' | 'red';
}

const colorClasses = {
  default: '',
  gray: 'text-gray-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  blue: 'text-blue-500',
  red: 'text-red-500',
};

export function StatCard({ label, value, color = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', colorClasses[color])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}

export interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 3 | 4 | 5 | 6;
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
