'use client';

/**
 * Cron Settings Form Component
 *
 * 크론 작업 설정 폼 UI
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const INTERVAL_UNIT_OPTIONS: { value: IntervalUnit; label: string; maxValue: number; minValue: number; step: number }[] = [
  { value: 'minutes', label: '분', maxValue: 45, minValue: 15, step: 15 },  // 15분 단위 (15, 30, 45)
  { value: 'hours', label: '시간', maxValue: 23, minValue: 1, step: 1 },
  { value: 'days', label: '일', maxValue: 31, minValue: 1, step: 1 },
  { value: 'months', label: '월', maxValue: 12, minValue: 1, step: 1 },
];

const DAY_OPTIONS = [
  { value: 0, label: '일', short: '일' },
  { value: 1, label: '월', short: '월' },
  { value: 2, label: '화', short: '화' },
  { value: 3, label: '수', short: '수' },
  { value: 4, label: '목', short: '목' },
  { value: 5, label: '금', short: '금' },
  { value: 6, label: '토', short: '토' },
];

const DAY_RESTRICTION_OPTIONS: { value: DayRestriction; label: string; days: number[] }[] = [
  { value: 'all', label: '매일', days: [] },
  { value: 'weekdays', label: '평일만 (월-금)', days: [1, 2, 3, 4, 5] },
  { value: 'weekends', label: '주말만 (토-일)', days: [0, 6] },
  { value: 'custom', label: '특정 요일 선택', days: [] },
];

const MONTH_OPTIONS = [
  { value: 1, label: '1월' }, { value: 2, label: '2월' }, { value: 3, label: '3월' },
  { value: 4, label: '4월' }, { value: 5, label: '5월' }, { value: 6, label: '6월' },
  { value: 7, label: '7월' }, { value: 8, label: '8월' }, { value: 9, label: '9월' },
  { value: 10, label: '10월' }, { value: 11, label: '11월' }, { value: 12, label: '12월' },
];

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

/**
 * Get description of schedule config
 */
function getScheduleDescription(config: ScheduleConfig): string {
  const { intervalValue, intervalUnit, hour, minute, dayRestriction, selectedDays, daysOfMonth, selectedMonths } = config;
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const parts: string[] = [];

  // Interval description
  switch (intervalUnit) {
    case 'minutes':
      parts.push(intervalValue === 1 ? '매분' : `${intervalValue}분마다`);
      break;
    case 'hours':
      parts.push(intervalValue === 1 ? `매시간 ${minute}분` : `${intervalValue}시간마다 ${minute}분`);
      break;
    case 'days':
      if (intervalValue === 1) {
        parts.push(`매일 ${timeStr}`);
      } else {
        parts.push(`${intervalValue}일마다 ${timeStr}`);
      }
      break;
    case 'months':
      const dayStr = daysOfMonth.length > 0 ? daysOfMonth.join(', ') + '일' : '1일';
      if (intervalValue === 1) {
        parts.push(`매월 ${dayStr} ${timeStr}`);
      } else {
        parts.push(`${intervalValue}개월마다 ${dayStr} ${timeStr}`);
      }
      break;
  }

  // Day restriction
  if (dayRestriction === 'weekdays') {
    parts.push('(평일만)');
  } else if (dayRestriction === 'weekends') {
    parts.push('(주말만)');
  } else if (dayRestriction === 'custom' && selectedDays.length > 0 && selectedDays.length < 7) {
    const dayNames = selectedDays.map(d => DAY_OPTIONS.find(opt => opt.value === d)?.short).join(', ');
    parts.push(`(${dayNames}요일만)`);
  }

  // Month restriction
  if (selectedMonths.length > 0 && selectedMonths.length < 12) {
    const monthNames = selectedMonths.map(m => `${m}월`).join(', ');
    parts.push(`[${monthNames}]`);
  }

  return parts.join(' ');
}

/**
 * Day Selector Component (Toggle Buttons)
 */
function DayToggleSelector({
  selectedDays,
  onChange,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
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
      {DAY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggleDay(opt.value)}
          className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
            selectedDays.includes(opt.value)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          {opt.short}
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
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
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
        선택한 날짜: {selectedDays.length > 0 ? selectedDays.join(', ') + '일' : '매일'}
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
}: {
  selectedMonths: number[];
  onChange: (months: number[]) => void;
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
        {MONTH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleMonth(opt.value)}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              selectedMonths.includes(opt.value)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        선택한 월: {selectedMonths.length > 0 && selectedMonths.length < 12 ? selectedMonths.map(m => `${m}월`).join(', ') : '매월'}
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
}: {
  value: string;
  onChange: (cron: string) => void;
}) {
  const [config, setConfig] = useState<ScheduleConfig>(() => parseCronExpression(value));
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    // Show advanced if non-default settings
    if (parsed.selectedMonths.length > 0 || parsed.daysOfMonth.length > 0) {
      setShowAdvanced(true);
    }
  }, [value]);

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const currentUnit = INTERVAL_UNIT_OPTIONS.find(u => u.value === config.intervalUnit);
  const showTimeSelect = ['days', 'months'].includes(config.intervalUnit);
  const showMinuteSelect = config.intervalUnit === 'hours';
  const showDayRestriction = ['hours', 'days'].includes(config.intervalUnit);

  return (
    <div className="space-y-4">
      {/* Interval: Value + Unit */}
      <div className="grid gap-2">
        <Label>실행 주기</Label>
        <div className="flex items-center gap-2">
          {/* 분 단위는 드롭다운, 나머지는 숫자 입력 */}
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
              const unitOpt = INTERVAL_UNIT_OPTIONS.find(o => o.value === unit);
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
              {INTERVAL_UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}마다
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          최소 실행 주기: 15분
        </p>
      </div>

      {/* Day Restriction (for hours/days) */}
      {showDayRestriction && (
        <div className="grid gap-2">
          <Label>실행 요일</Label>
          <Select
            value={config.dayRestriction}
            onValueChange={(val) => {
              const restriction = val as DayRestriction;
              const preset = DAY_RESTRICTION_OPTIONS.find(o => o.value === restriction);
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
              {DAY_RESTRICTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom day selector */}
          {config.dayRestriction === 'custom' && (
            <DayToggleSelector
              selectedDays={config.selectedDays}
              onChange={(days) => updateConfig({ selectedDays: days })}
            />
          )}
        </div>
      )}

      {/* Time (for days/months) */}
      {showTimeSelect && (
        <div className="grid gap-2">
          <Label>실행 시간</Label>
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
                    {i.toString().padStart(2, '0')}시
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
                    {i.toString().padStart(2, '0')}분
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Minute offset (for hours) */}
      {showMinuteSelect && (
        <div className="grid gap-2">
          <Label>실행 시점 (분)</Label>
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
                  매 시 {i.toString().padStart(2, '0')}분
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
        {showAdvanced ? '▼' : '▶'} 고급 설정 (특정 날짜/월 지정)
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {/* Days of Month (for days/months) */}
          {['days', 'months'].includes(config.intervalUnit) && (
            <div className="grid gap-2">
              <Label>특정 날짜만 실행 (선택 안하면 매일)</Label>
              <DaysOfMonthSelector
                selectedDays={config.daysOfMonth}
                onChange={(days) => updateConfig({ daysOfMonth: days })}
              />
            </div>
          )}

          {/* Month Selector */}
          <div className="grid gap-2">
            <Label>특정 월만 실행 (선택 안하면 매월)</Label>
            <MonthSelector
              selectedMonths={config.selectedMonths}
              onChange={(months) => updateConfig({ selectedMonths: months })}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="text-sm font-medium text-primary bg-primary/5 p-2 rounded">
        → {getScheduleDescription(config)}
      </div>
    </div>
  );
}

/**
 * Cron Schedule Preview Component
 */
function CronSchedulePreview({ schedule, enabled, batchSize }: { schedule: string; enabled: boolean; batchSize: number }) {
  const nextRuns = useMemo(() => getNextCronRuns(schedule, 5), [schedule]);
  const config = useMemo(() => parseCronExpression(schedule), [schedule]);
  const description = useMemo(() => getScheduleDescription(config), [config]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate runs frequency info
  const getRunsInfo = () => {
    const { intervalValue, intervalUnit, dayRestriction, selectedDays } = config;
    let base = '';

    switch (intervalUnit) {
      case 'minutes':
        base = `하루 약 ${Math.floor(1440 / intervalValue)}회`;
        break;
      case 'hours':
        base = `하루 약 ${Math.floor(24 / intervalValue)}회`;
        break;
      case 'days':
        base = intervalValue === 1 ? '하루 1회' : `${intervalValue}일마다 1회`;
        break;
      case 'months':
        base = intervalValue === 1 ? '월 1회' : `${intervalValue}개월마다 1회`;
        break;
      default:
        return '';
    }

    // Add day restriction info
    if (dayRestriction === 'weekdays') {
      base += ' (평일)';
    } else if (dayRestriction === 'weekends') {
      base += ' (주말)';
    } else if (dayRestriction === 'custom' && selectedDays.length > 0 && selectedDays.length < 7) {
      base += ` (주 ${selectedDays.length}일)`;
    }

    return base;
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">실행 예정</span>
        <Badge variant={enabled ? 'default' : 'secondary'} className="ml-auto">
          {enabled ? '활성' : '비활성'}
        </Badge>
      </div>

      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium text-foreground">{description}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {getRunsInfo()} • 최대 {batchSize}개 키워드/실행
        </p>
      </div>

      {enabled && nextRuns.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">다음 5회 실행 예정:</p>
          <div className="grid gap-1">
            {nextRuns.map((run, idx) => (
              <div key={idx} className="text-xs font-mono bg-background/50 px-2 py-1 rounded flex justify-between">
                <span>{formatDate(run)}</span>
                <span className="text-muted-foreground">→ 최대 {batchSize}개</span>
              </div>
            ))}
          </div>
        </div>
      ) : !enabled ? (
        <p className="text-xs text-muted-foreground">비활성화 상태입니다. 자동 생성이 실행되지 않습니다.</p>
      ) : (
        <p className="text-xs text-destructive">유효하지 않은 스케줄입니다.</p>
      )}

      {/* Show generated cron for reference */}
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
      router.refresh();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save');
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
            설정이 저장되었습니다.
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
              <CardTitle>자동 콘텐츠 생성</CardTitle>
            </div>
            <Badge variant={settings.cron_auto_generate.enabled ? 'default' : 'secondary'}>
              {settings.cron_auto_generate.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <CardDescription>
            대기 중인 키워드를 자동으로 콘텐츠로 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-generate-enabled">자동 생성 활성화</Label>
              <p className="text-sm text-muted-foreground">
                크론 작업 실행 시 자동으로 콘텐츠를 생성합니다.
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
            <Label htmlFor="batch-size">1회 실행당 생성 수</Label>
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
              <span className="text-sm text-muted-foreground">개의 키워드</span>
            </div>
            <p className="text-sm text-muted-foreground">
              크론 작업 1회 실행 시 처리할 키워드 수 (1-10)
            </p>
          </div>

          {/* Schedule Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label>실행 스케줄</Label>
            </div>
            <ScheduleSelector
              value={settings.cron_auto_generate.schedule}
              onChange={(cron) => updateSetting('cron_auto_generate', 'schedule', cron)}
            />
          </div>

          {/* Schedule Preview */}
          <CronSchedulePreview
            schedule={settings.cron_auto_generate.schedule}
            enabled={settings.cron_auto_generate.enabled}
            batchSize={settings.cron_auto_generate.batch_size}
          />

          <Separator />

          {/* RAG Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include-rag">RAG 검색 포함</Label>
              <p className="text-sm text-muted-foreground">
                벡터 DB에서 관련 컨텍스트를 검색하여 콘텐츠 품질을 높입니다.
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
              <Label htmlFor="include-images">이미지 생성 포함</Label>
              <p className="text-sm text-muted-foreground">
                Google Imagen 4를 사용하여 이미지를 자동 생성합니다.
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
              <Label htmlFor="image-count">이미지 수</Label>
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
                <span className="text-sm text-muted-foreground">개/콘텐츠</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Auto Publish */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish">생성 후 자동 발행</Label>
              <p className="text-sm text-muted-foreground">
                콘텐츠 생성 직후 자동으로 발행합니다 (검토 없이).
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
            <Label htmlFor="priority-threshold">최소 우선순위</Label>
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
              이 값 이상의 priority를 가진 키워드만 처리 (0 = 모두 처리)
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
              <CardTitle>자동 발행</CardTitle>
            </div>
            <Badge variant={settings.cron_auto_publish.enabled ? 'default' : 'secondary'}>
              {settings.cron_auto_publish.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <CardDescription>
            Draft 상태의 콘텐츠를 자동으로 발행합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish-enabled">자동 발행 활성화</Label>
              <p className="text-sm text-muted-foreground">
                크론 작업 실행 시 draft 콘텐츠를 자동 발행합니다.
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
              <Label>실행 스케줄</Label>
            </div>
            <ScheduleSelector
              value={settings.cron_auto_publish.schedule}
              onChange={(cron) => updateSetting('cron_auto_publish', 'schedule', cron)}
            />
          </div>

          {/* Schedule Preview */}
          <CronSchedulePreview
            schedule={settings.cron_auto_publish.schedule}
            enabled={settings.cron_auto_publish.enabled}
            batchSize={settings.cron_auto_publish.max_publish_per_run}
          />

          {/* Max Publish */}
          <div className="grid gap-2">
            <Label htmlFor="max-publish">1회 실행당 최대 발행 수</Label>
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
              <span className="text-sm text-muted-foreground">개의 콘텐츠</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Assignment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>통역사 배정</CardTitle>
          </div>
          <CardDescription>
            콘텐츠 생성 시 통역사(Author) 자동 배정 방식을 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Algorithm */}
          <div className="grid gap-2">
            <Label htmlFor="algorithm">배정 알고리즘</Label>
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
                <SelectItem value="round_robin">Round Robin (균등 배분)</SelectItem>
                <SelectItem value="specialty_first">Specialty First (전문분야 우선)</SelectItem>
                <SelectItem value="random">Random (무작위)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Round Robin: total_posts가 가장 적은 통역사에게 배정
            </p>
          </div>

          <Separator />

          {/* Specialty Match */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="specialty-match">전문분야 우선 매칭</Label>
              <p className="text-sm text-muted-foreground">
                카테고리와 일치하는 전문분야의 통역사를 우선 배정합니다.
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
              <Label htmlFor="fallback">Fallback 허용</Label>
              <p className="text-sm text-muted-foreground">
                전문분야 매칭 실패 시 언어만 맞으면 배정합니다.
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
          초기화
        </Button>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              모든 설정 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
