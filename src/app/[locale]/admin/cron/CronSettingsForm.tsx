'use client';

/**
 * Cron Settings Form Component
 *
 * 크론 작업 설정 폼 UI
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, Clock, Zap, Users, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { SystemSettings } from './page';

// =====================================================
// SCHEDULE TYPES & HELPERS
// =====================================================

type IntervalUnit = 'minutes' | 'hours' | 'days' | 'months';
type DayRestriction = 'all' | 'weekdays' | 'weekends' | 'custom';

interface ScheduleConfig {
  intervalValue: number;       // 실행 간격 값
  intervalUnit: IntervalUnit;  // 실행 간격 단위
  hour: number;                // 0-23, 실행 시간
  minute: number;              // 0-59, 실행 분
  dayRestriction: DayRestriction;  // 요일 제한
  selectedDays: number[];      // 선택된 요일 (0-6, 일-토)
  daysOfMonth: number[];       // 선택된 날짜 (1-31)
  selectedMonths: number[];    // 선택된 월 (1-12)
}

// These will be populated with translations in the component
const INTERVAL_UNIT_CONFIG: { value: IntervalUnit; maxValue: number; minValue: number; step: number }[] = [
  { value: 'minutes', maxValue: 45, minValue: 15, step: 15 },
  { value: 'hours', maxValue: 23, minValue: 1, step: 1 },
  { value: 'days', maxValue: 31, minValue: 1, step: 1 },
  { value: 'months', maxValue: 12, minValue: 1, step: 1 },
];

const DAY_VALUES = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat

const DAY_RESTRICTION_VALUES: { value: DayRestriction; days: number[] }[] = [
  { value: 'all', days: [] },
  { value: 'weekdays', days: [1, 2, 3, 4, 5] },
  { value: 'weekends', days: [0, 6] },
  { value: 'custom', days: [] },
];

const MONTH_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Generate cron expression from schedule config
 */
function generateCronExpression(config: ScheduleConfig): string {
  const { intervalValue, intervalUnit, hour, minute, dayRestriction, selectedDays, daysOfMonth, selectedMonths } = config;

  // Day of week part
  let dowPart = '*';
  if (dayRestriction === 'weekdays') {
    dowPart = '1-5';
  } else if (dayRestriction === 'weekends') {
    dowPart = '0,6';
  } else if (dayRestriction === 'custom' && selectedDays.length > 0 && selectedDays.length < 7) {
    dowPart = selectedDays.sort((a, b) => a - b).join(',');
  }

  // Month part
  let monthPart = '*';
  if (selectedMonths.length > 0 && selectedMonths.length < 12) {
    monthPart = selectedMonths.sort((a, b) => a - b).join(',');
  }

  // Day of month part
  let dayPart = '*';
  if (daysOfMonth.length > 0 && daysOfMonth.length < 31) {
    dayPart = daysOfMonth.sort((a, b) => a - b).join(',');
  }

  switch (intervalUnit) {
    case 'minutes':
      if (intervalValue === 1) return `* * * ${monthPart} ${dowPart}`;
      return `*/${intervalValue} * * ${monthPart} ${dowPart}`;

    case 'hours':
      if (intervalValue === 1) return `${minute} * * ${monthPart} ${dowPart}`;
      return `${minute} */${intervalValue} * ${monthPart} ${dowPart}`;

    case 'days':
      if (intervalValue === 1) {
        return `${minute} ${hour} ${dayPart} ${monthPart} ${dowPart}`;
      }
      // N일마다는 day of month에서 step 사용
      return `${minute} ${hour} */${intervalValue} ${monthPart} ${dowPart}`;

    case 'months':
      const domPart = daysOfMonth.length > 0 ? daysOfMonth.sort((a, b) => a - b).join(',') : '1';
      if (intervalValue === 1) return `${minute} ${hour} ${domPart} * ${dowPart}`;
      return `${minute} ${hour} ${domPart} */${intervalValue} ${dowPart}`;

    default:
      return '0 9 * * *';
  }
}

/**
 * Parse cron expression to schedule config
 */
function parseCronExpression(cron: string): ScheduleConfig {
  const defaultConfig: ScheduleConfig = {
    intervalValue: 1,
    intervalUnit: 'days',
    hour: 9,
    minute: 0,
    dayRestriction: 'all',
    selectedDays: [],
    daysOfMonth: [],
    selectedMonths: [],
  };

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaultConfig;

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;

  // Parse day of week restriction
  let dayRestriction: DayRestriction = 'all';
  let selectedDays: number[] = [];
  if (dowPart === '1-5') {
    dayRestriction = 'weekdays';
    selectedDays = [1, 2, 3, 4, 5];
  } else if (dowPart === '0,6' || dowPart === '6,0') {
    dayRestriction = 'weekends';
    selectedDays = [0, 6];
  } else if (dowPart !== '*') {
    dayRestriction = 'custom';
    selectedDays = dowPart.split(',').map(d => parseInt(d));
  }

  // Parse months
  let selectedMonths: number[] = [];
  if (monthPart !== '*' && !monthPart.includes('/')) {
    selectedMonths = monthPart.split(',').map(m => parseInt(m));
  }

  // Parse days of month
  let daysOfMonth: number[] = [];
  if (dayPart !== '*' && !dayPart.includes('/')) {
    daysOfMonth = dayPart.split(',').map(d => parseInt(d));
  }

  // Parse minute
  let minute = 0;
  let intervalValue = 1;
  let intervalUnit: IntervalUnit = 'days';

  if (minutePart.includes('/')) {
    intervalUnit = 'minutes';
    intervalValue = parseInt(minutePart.split('/')[1]);
  } else if (minutePart === '*') {
    if (hourPart === '*') {
      intervalUnit = 'minutes';
      intervalValue = 1;
    }
  } else {
    minute = parseInt(minutePart);
  }

  // Parse hour
  let hour = 9;
  if (hourPart.includes('/')) {
    intervalUnit = 'hours';
    intervalValue = parseInt(hourPart.split('/')[1]);
  } else if (hourPart !== '*') {
    hour = parseInt(hourPart);
  } else if (intervalUnit !== 'minutes') {
    intervalUnit = 'hours';
  }

  // Parse day interval
  if (dayPart.includes('/')) {
    intervalUnit = 'days';
    intervalValue = parseInt(dayPart.split('/')[1]);
  }

  // Parse month interval
  if (monthPart.includes('/')) {
    intervalUnit = 'months';
    intervalValue = parseInt(monthPart.split('/')[1]);
  }

  // Detect monthly pattern (specific day, no day interval)
  if (intervalUnit === 'days' && daysOfMonth.length > 0 && !dayPart.includes('/')) {
    intervalUnit = 'months';
    intervalValue = 1;
  }

  return {
    intervalValue,
    intervalUnit,
    hour,
    minute,
    dayRestriction,
    selectedDays,
    daysOfMonth,
    selectedMonths,
  };
}

/**
 * Get next N scheduled runs from cron expression
 */
function getNextCronRuns(cronExpression: string, count: number = 5): Date[] {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;
  const runs: Date[] = [];
  const now = new Date();
  let current = new Date(now);
  current.setSeconds(0);
  current.setMilliseconds(0);

  const parseField = (field: string, max: number, min: number = 0): number[] => {
    if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step);
      const start = base === '*' ? min : parseInt(base);
      const result: number[] = [];
      for (let i = start; i <= max; i += stepNum) {
        result.push(i);
      }
      return result;
    }
    if (field.includes(',')) {
      return field.split(',').map(n => parseInt(n));
    }
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(n => parseInt(n));
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    return [parseInt(field)];
  };

  const minutes = parseField(minutePart, 59, 0);
  const hours = parseField(hourPart, 23, 0);
  const days = parseField(dayPart, 31, 1);
  const months = parseField(monthPart, 12, 1);
  const daysOfWeek = dowPart === '*' ? null : parseField(dowPart, 6, 0);

  let attempts = 0;
  const maxAttempts = 525600; // 1 year of minutes

  while (runs.length < count && attempts < maxAttempts) {
    attempts++;
    current = new Date(current.getTime() + 60000);

    const m = current.getMinutes();
    const h = current.getHours();
    const d = current.getDate();
    const mo = current.getMonth() + 1;
    const dow = current.getDay();

    if (!minutes.includes(m)) continue;
    if (!hours.includes(h)) continue;
    if (!months.includes(mo)) continue;
    if (dayPart !== '*' && !dayPart.includes('/') && !days.includes(d)) continue;
    if (dayPart.includes('/')) {
      const step = parseInt(dayPart.split('/')[1]);
      if ((d - 1) % step !== 0) continue;
    }
    if (daysOfWeek !== null && !daysOfWeek.includes(dow)) continue;

    runs.push(new Date(current));
  }

  return runs;
}

// Schedule description is now handled inside the component with translations

/**
 * Day Selector Component (Toggle Buttons)
 */
function DayToggleSelector({
  selectedDays,
  onChange,
  dayLabels,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  dayLabels: string[];
}) {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex gap-1">
      {DAY_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => toggleDay(value)}
          className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
            selectedDays.includes(value)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          {dayLabels[value]}
        </button>
      ))}
    </div>
  );
}

/**
 * Multi-select for days of month
 */
function DaysOfMonthSelector({
  selectedDays,
  onChange,
  selectedDaysLabel,
  everyDayLabel,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  selectedDaysLabel: string;
  everyDayLabel: string;
}) {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(d)}
            className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
              selectedDays.includes(d)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedDaysLabel}: {selectedDays.length > 0 ? selectedDays.join(', ') : everyDayLabel}
      </p>
    </div>
  );
}

/**
 * Multi-select for months
 */
function MonthSelector({
  selectedMonths,
  onChange,
  monthLabels,
  selectedMonthsLabel,
  everyMonthLabel,
}: {
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  monthLabels: string[];
  selectedMonthsLabel: string;
  everyMonthLabel: string;
}) {
  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      onChange(selectedMonths.filter(m => m !== month));
    } else {
      onChange([...selectedMonths, month].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1">
        {MONTH_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => toggleMonth(value)}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              selectedMonths.includes(value)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {monthLabels[value - 1]}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedMonthsLabel}: {selectedMonths.length > 0 && selectedMonths.length < 12 ? selectedMonths.map(m => monthLabels[m - 1]).join(', ') : everyMonthLabel}
      </p>
    </div>
  );
}

/**
 * Schedule Selector Component
 */
function ScheduleSelector({
  value,
  onChange,
  t,
}: {
  value: string;
  onChange: (cron: string) => void;
  t: (key: string) => string;
}) {
  const [config, setConfig] = useState<ScheduleConfig>(() => parseCronExpression(value));
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Translation helpers
  const intervalLabels: Record<IntervalUnit, string> = {
    minutes: t('schedule.minutes'),
    hours: t('schedule.hours'),
    days: t('schedule.days'),
    months: t('schedule.months'),
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Short day names
  const monthLabels = Array.from({ length: 12 }, (_, i) => `${i + 1}`);

  const dayRestrictionLabels: Record<DayRestriction, string> = {
    all: t('schedule.everyday'),
    weekdays: t('schedule.weekdaysOnly'),
    weekends: t('schedule.weekendsOnly'),
    custom: t('schedule.customDays'),
  };

  // Update parent when config changes
  useEffect(() => {
    const newCron = generateCronExpression(config);
    if (newCron !== value) {
      onChange(newCron);
    }
  }, [config, onChange, value]);

  // Update config when value changes externally
  useEffect(() => {
    const parsed = parseCronExpression(value);
    setConfig(parsed);
    if (parsed.selectedMonths.length > 0 || parsed.daysOfMonth.length > 0) {
      setShowAdvanced(true);
    }
  }, [value]);

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const currentUnit = INTERVAL_UNIT_CONFIG.find(u => u.value === config.intervalUnit);
  const showTimeSelect = ['days', 'months'].includes(config.intervalUnit);
  const showMinuteSelect = config.intervalUnit === 'hours';
  const showDayRestriction = ['hours', 'days'].includes(config.intervalUnit);

  // Generate description
  const getDescription = (): string => {
    const { intervalValue, intervalUnit, hour, minute, dayRestriction, selectedDays, daysOfMonth, selectedMonths } = config;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const parts: string[] = [];

    parts.push(`${t('schedule.every')} ${intervalValue} ${intervalLabels[intervalUnit]}`);

    if (showTimeSelect) {
      parts.push(`@ ${timeStr}`);
    } else if (showMinuteSelect) {
      parts.push(`${minute.toString().padStart(2, '0')}${t('schedule.minuteUnit')}`);
    }

    if (dayRestriction !== 'all') {
      parts.push(`(${dayRestrictionLabels[dayRestriction]})`);
    }

    return parts.join(' ');
  };

  return (
    <div className="space-y-4">
      {/* Interval: Value + Unit */}
      <div className="grid gap-2">
        <Label>{t('schedule.interval')}</Label>
        <div className="flex items-center gap-2">
          {config.intervalUnit === 'minutes' ? (
            <Select
              value={config.intervalValue.toString()}
              onValueChange={(val) => updateConfig({ intervalValue: parseInt(val) })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="45">45</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              min={currentUnit?.minValue || 1}
              max={currentUnit?.maxValue || 59}
              step={currentUnit?.step || 1}
              value={config.intervalValue}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                const min = currentUnit?.minValue || 1;
                const max = currentUnit?.maxValue || 59;
                updateConfig({ intervalValue: Math.min(Math.max(min, val), max) });
              }}
              className="w-20"
            />
          )}
          <Select
            value={config.intervalUnit}
            onValueChange={(val) => {
              const unit = val as IntervalUnit;
              const unitOpt = INTERVAL_UNIT_CONFIG.find(o => o.value === unit);
              updateConfig({
                intervalUnit: unit,
                intervalValue: unitOpt?.minValue || 1,
                dayRestriction: 'all',
                selectedDays: [],
              });
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_UNIT_CONFIG.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {intervalLabels[opt.value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('schedule.minInterval')}
        </p>
      </div>

      {/* Day Restriction */}
      {showDayRestriction && (
        <div className="grid gap-2">
          <Label>{t('schedule.executionDays')}</Label>
          <Select
            value={config.dayRestriction}
            onValueChange={(val) => {
              const restriction = val as DayRestriction;
              const preset = DAY_RESTRICTION_VALUES.find(o => o.value === restriction);
              updateConfig({
                dayRestriction: restriction,
                selectedDays: preset?.days || [],
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_RESTRICTION_VALUES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {dayRestrictionLabels[opt.value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {config.dayRestriction === 'custom' && (
            <DayToggleSelector
              selectedDays={config.selectedDays}
              onChange={(days) => updateConfig({ selectedDays: days })}
              dayLabels={dayLabels}
            />
          )}
        </div>
      )}

      {/* Time */}
      {showTimeSelect && (
        <div className="grid gap-2">
          <Label>{t('schedule.executionTime')}</Label>
          <div className="flex items-center gap-2">
            <Select
              value={config.hour.toString()}
              onValueChange={(val) => updateConfig({ hour: parseInt(val) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
              value={config.minute.toString()}
              onValueChange={(val) => updateConfig({ minute: parseInt(val) })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 15, 30, 45].map((i) => (
                  <SelectItem key={i} value={i.toString()}>
                    :{i.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Minute offset */}
      {showMinuteSelect && (
        <div className="grid gap-2">
          <Label>{t('schedule.executionMinute')}</Label>
          <Select
            value={config.minute.toString()}
            onValueChange={(val) => updateConfig({ minute: parseInt(val) })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 15, 30, 45].map((i) => (
                <SelectItem key={i} value={i.toString()}>
                  {t('schedule.everyHourAt')} :{i.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        {showAdvanced ? '▼' : '▶'} {t('schedule.advanced')}
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {['days', 'months'].includes(config.intervalUnit) && (
            <div className="grid gap-2">
              <Label>{t('schedule.specificDays')}</Label>
              <DaysOfMonthSelector
                selectedDays={config.daysOfMonth}
                onChange={(days) => updateConfig({ daysOfMonth: days })}
                selectedDaysLabel={t('schedule.selectedDays')}
                everyDayLabel={t('schedule.everyDay')}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>{t('schedule.specificMonths')}</Label>
            <MonthSelector
              selectedMonths={config.selectedMonths}
              onChange={(months) => updateConfig({ selectedMonths: months })}
              monthLabels={monthLabels}
              selectedMonthsLabel={t('schedule.selectedMonths')}
              everyMonthLabel={t('schedule.everyMonth')}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="text-sm font-medium text-primary bg-primary/5 p-2 rounded">
        → {getDescription()}
      </div>
    </div>
  );
}

/**
 * Cron Schedule Preview Component
 */
function CronSchedulePreview({
  schedule,
  enabled,
  batchSize,
  t,
  locale,
}: {
  schedule: string;
  enabled: boolean;
  batchSize: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string;
  locale: string;
}) {
  const nextRuns = useMemo(() => getNextCronRuns(schedule, 5), [schedule]);

  const formatDate = (date: Date) => {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('schedule.preview')}</span>
        <Badge variant={enabled ? 'default' : 'secondary'} className="ml-auto">
          {enabled ? t('schedule.active') : t('schedule.disabled')}
        </Badge>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          {t('schedule.maxItems', { count: batchSize })}
        </p>
      </div>

      {enabled && nextRuns.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{t('schedule.nextRuns')}</p>
          <div className="grid gap-1">
            {nextRuns.map((run, idx) => (
              <div key={idx} className="text-xs font-mono bg-background/50 px-2 py-1 rounded flex justify-between">
                <span>{formatDate(run)}</span>
                <span className="text-muted-foreground">→ {t('schedule.maxItems', { count: batchSize })}</span>
              </div>
            ))}
          </div>
        </div>
      ) : !enabled ? (
        <p className="text-xs text-muted-foreground">{t('schedule.disabledMessage')}</p>
      ) : (
        <p className="text-xs text-destructive">{t('schedule.invalidSchedule')}</p>
      )}

      <p className="text-[10px] text-muted-foreground/60 font-mono">
        cron: {schedule}
      </p>
    </div>
  );
}

// =====================================================
// MAIN FORM COMPONENT
// =====================================================

interface Props {
  initialSettings: SystemSettings;
}

export default function CronSettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'en';
  const t = useTranslations('admin.cron');
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Update nested setting
  const updateSetting = <K extends keyof SystemSettings>(
    category: K,
    key: keyof SystemSettings[K],
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setSaveStatus('idle');
  };

  // Save all settings
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    const toastId = toast.loading(t('saving'));

    try {
      for (const category of Object.keys(settings) as (keyof SystemSettings)[]) {
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: category,
            value: settings[category],
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || `Failed to save ${category}`);
        }
      }

      setSaveStatus('success');
      toast.success(t('saveSuccess'), {
        id: toastId,
      });
      router.refresh();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to save';
      setErrorMessage(errorMsg);
      toast.error(t('saveFailed'), {
        id: toastId,
        description: errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {t('saveSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Auto Generate Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle>{t('autoGenerate.title')}</CardTitle>
            </div>
            <Badge variant={settings.cron_auto_generate.enabled ? 'default' : 'secondary'}>
              {settings.cron_auto_generate.enabled ? t('schedule.active') : t('schedule.disabled')}
            </Badge>
          </div>
          <CardDescription>
            {t('autoGenerate.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-generate-enabled">{t('autoGenerate.enabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('autoGenerate.enabledDescription')}
              </p>
            </div>
            <Switch
              id="auto-generate-enabled"
              checked={settings.cron_auto_generate.enabled}
              onCheckedChange={(checked) =>
                updateSetting('cron_auto_generate', 'enabled', checked)
              }
            />
          </div>

          <Separator />

          {/* Batch Size */}
          <div className="grid gap-2">
            <Label htmlFor="batch-size">{t('autoGenerate.batchSize')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="batch-size"
                type="number"
                min={1}
                max={10}
                value={settings.cron_auto_generate.batch_size}
                onChange={(e) =>
                  updateSetting('cron_auto_generate', 'batch_size', parseInt(e.target.value) || 1)
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{t('autoGenerate.keywords')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('autoGenerate.batchSizeHint')}
            </p>
          </div>

          {/* Schedule Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label>{t('schedule.title')}</Label>
            </div>
            <ScheduleSelector
              value={settings.cron_auto_generate.schedule}
              onChange={(cron) => updateSetting('cron_auto_generate', 'schedule', cron)}
              t={t}
            />
          </div>

          {/* Schedule Preview */}
          <CronSchedulePreview
            schedule={settings.cron_auto_generate.schedule}
            enabled={settings.cron_auto_generate.enabled}
            batchSize={settings.cron_auto_generate.batch_size}
            t={t}
            locale={currentLocale}
          />

          <Separator />

          {/* RAG Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include-rag">{t('options.includeRag')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('options.includeRagDescription')}
              </p>
            </div>
            <Switch
              id="include-rag"
              checked={settings.cron_auto_generate.include_rag}
              onCheckedChange={(checked) =>
                updateSetting('cron_auto_generate', 'include_rag', checked)
              }
            />
          </div>

          {/* Image Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include-images">{t('options.includeImages')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('options.includeImagesDescription')}
              </p>
            </div>
            <Switch
              id="include-images"
              checked={settings.cron_auto_generate.include_images}
              onCheckedChange={(checked) =>
                updateSetting('cron_auto_generate', 'include_images', checked)
              }
            />
          </div>

          {/* Image Count */}
          {settings.cron_auto_generate.include_images && (
            <div className="grid gap-2 ml-4">
              <Label htmlFor="image-count">{t('options.imageCount')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-count"
                  type="number"
                  min={1}
                  max={5}
                  value={settings.cron_auto_generate.image_count}
                  onChange={(e) =>
                    updateSetting('cron_auto_generate', 'image_count', parseInt(e.target.value) || 1)
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('options.imagesPerContent')}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Auto Publish */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish">{t('options.autoPublish')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('options.autoPublishDescription')}
              </p>
            </div>
            <Switch
              id="auto-publish"
              checked={settings.cron_auto_generate.auto_publish}
              onCheckedChange={(checked) =>
                updateSetting('cron_auto_generate', 'auto_publish', checked)
              }
            />
          </div>

          {/* Priority Threshold */}
          <div className="grid gap-2">
            <Label htmlFor="priority-threshold">{t('options.priorityThreshold')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="priority-threshold"
                type="number"
                min={0}
                max={10}
                value={settings.cron_auto_generate.priority_threshold}
                onChange={(e) =>
                  updateSetting('cron_auto_generate', 'priority_threshold', parseInt(e.target.value) || 0)
                }
                className="w-24"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('options.priorityThresholdHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto Publish Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <CardTitle>{t('autoPublish.title')}</CardTitle>
            </div>
            <Badge variant={settings.cron_auto_publish.enabled ? 'default' : 'secondary'}>
              {settings.cron_auto_publish.enabled ? t('schedule.active') : t('schedule.disabled')}
            </Badge>
          </div>
          <CardDescription>
            {t('autoPublish.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish-enabled">{t('autoPublish.enabled')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('autoPublish.enabledDescription')}
              </p>
            </div>
            <Switch
              id="auto-publish-enabled"
              checked={settings.cron_auto_publish.enabled}
              onCheckedChange={(checked) =>
                updateSetting('cron_auto_publish', 'enabled', checked)
              }
            />
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label>{t('schedule.title')}</Label>
            </div>
            <ScheduleSelector
              value={settings.cron_auto_publish.schedule}
              onChange={(cron) => updateSetting('cron_auto_publish', 'schedule', cron)}
              t={t}
            />
          </div>

          {/* Schedule Preview */}
          <CronSchedulePreview
            schedule={settings.cron_auto_publish.schedule}
            enabled={settings.cron_auto_publish.enabled}
            batchSize={settings.cron_auto_publish.max_publish_per_run}
            t={t}
            locale={currentLocale}
          />

          {/* Max Publish */}
          <div className="grid gap-2">
            <Label htmlFor="max-publish">{t('autoPublish.maxPublish')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="max-publish"
                type="number"
                min={1}
                max={50}
                value={settings.cron_auto_publish.max_publish_per_run}
                onChange={(e) =>
                  updateSetting('cron_auto_publish', 'max_publish_per_run', parseInt(e.target.value) || 1)
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{t('autoPublish.contents')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Assignment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>{t('authorAssignment.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('authorAssignment.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Algorithm */}
          <div className="grid gap-2">
            <Label htmlFor="algorithm">{t('authorAssignment.algorithm')}</Label>
            <Select
              value={settings.author_assignment.algorithm}
              onValueChange={(value) =>
                updateSetting('author_assignment', 'algorithm', value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">{t('authorAssignment.roundRobin')}</SelectItem>
                <SelectItem value="specialty_first">{t('authorAssignment.specialtyFirst')}</SelectItem>
                <SelectItem value="random">{t('authorAssignment.random')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('authorAssignment.algorithmHint')}
            </p>
          </div>

          <Separator />

          {/* Specialty Match */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="specialty-match">{t('authorAssignment.specialtyMatch')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('authorAssignment.specialtyMatchDescription')}
              </p>
            </div>
            <Switch
              id="specialty-match"
              checked={settings.author_assignment.prefer_specialty_match}
              onCheckedChange={(checked) =>
                updateSetting('author_assignment', 'prefer_specialty_match', checked)
              }
            />
          </div>

          {/* Fallback */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="fallback">{t('authorAssignment.fallback')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('authorAssignment.fallbackDescription')}
              </p>
            </div>
            <Switch
              id="fallback"
              checked={settings.author_assignment.fallback_to_any}
              onCheckedChange={(checked) =>
                updateSetting('author_assignment', 'fallback_to_any', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.refresh()}
          disabled={saving}
        >
          {t('reset')}
        </Button>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('saveAll')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
