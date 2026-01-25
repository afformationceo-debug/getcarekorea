/**
 * API Usage Monitoring & Logging
 *
 * AI API 사용량 추적 및 비용 모니터링
 */

import { createAdminClient } from '@/lib/supabase/server';

// =====================================================
// TYPES
// =====================================================

export interface APIUsageLog {
  provider: 'anthropic' | 'openai' | 'replicate' | 'google';
  endpoint?: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  latencyMs?: number;
  status?: 'success' | 'error';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface CostEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

// =====================================================
// PRICING (as of Jan 2026)
// =====================================================

const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  anthropic: {
    'claude-sonnet-4': { input: 0.003, output: 0.015 }, // per 1K tokens
    'claude-opus-4': { input: 0.015, output: 0.075 },
    'claude-haiku-3.5': { input: 0.0008, output: 0.004 },
  },
  openai: {
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
    'text-embedding-3-large': { input: 0.00013, output: 0 },
    'dall-e-3-standard': { input: 0.04, output: 0 }, // per image
    'dall-e-3-hd': { input: 0.08, output: 0 }, // per image
  },
  replicate: {
    'imagen-4': { input: 0.02, output: 0 }, // per image estimate
  },
  google: {
    'gemini-pro': { input: 0.00025, output: 0.0005 },
  },
};

// =====================================================
// FUNCTIONS
// =====================================================

/**
 * Calculate cost for API usage
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const providerPricing = PRICING[provider];
  if (!providerPricing) return 0;

  const modelPricing = providerPricing[model];
  if (!modelPricing) return 0;

  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Log API usage to database
 */
export async function logAPIUsage(log: APIUsageLog): Promise<void> {
  try {
    const supabase = await createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('api_usage_logs') as any).insert({
      provider: log.provider,
      endpoint: log.endpoint || null,
      tokens_input: log.tokensInput,
      tokens_output: log.tokensOutput,
      cost_usd: log.costUsd,
      latency_ms: log.latencyMs || null,
      status: log.status || 'success',
      error_message: log.errorMessage || null,
      metadata: log.metadata || {},
    });

    // Check cost alerts
    await checkCostAlerts(log.provider);
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Check if monthly cost exceeds alert thresholds
 */
async function checkCostAlerts(provider: string): Promise<void> {
  try {
    const supabase = await createAdminClient();

    // Get current month's cost for provider
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: usageData } = await (supabase.from('api_usage_logs') as any)
      .select('cost_usd')
      .eq('provider', provider)
      .gte('created_at', startOfMonth.toISOString());

    const totalCost = (usageData || []).reduce(
      (sum: number, log: { cost_usd?: number }) => sum + (log.cost_usd || 0),
      0
    );

    // Check alerts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alerts } = await (supabase.from('api_cost_alerts') as any)
      .select('*')
      .eq('enabled', true)
      .or(`provider.eq.${provider},provider.is.null`);

    interface CostAlert {
      id: string;
      provider?: string;
      threshold_usd: number;
      period: string;
      last_triggered_at?: string;
    }

    for (const alert of (alerts || []) as CostAlert[]) {
      if (totalCost > alert.threshold_usd) {
        // Check if already triggered this month
        if (
          alert.last_triggered_at &&
          new Date(alert.last_triggered_at) >= startOfMonth
        ) {
          continue;
        }

        // Create notification
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('admin_notifications') as any).insert({
          type: 'warning',
          title: `API 비용 경고: ${alert.provider || '전체'}`,
          message: `${alert.period} 비용이 $${alert.threshold_usd}를 초과했습니다. 현재: $${totalCost.toFixed(2)}`,
          source: 'api_monitoring',
          metadata: {
            provider: alert.provider,
            threshold: alert.threshold_usd,
            current_cost: totalCost,
          },
        });

        // Update last triggered
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('api_cost_alerts') as any)
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        // Send external notification (Slack/Discord)
        await sendCostAlert(
          alert.provider || 'Total',
          totalCost,
          alert.threshold_usd
        );
      }
    }
  } catch (error) {
    console.error('Failed to check cost alerts:', error);
  }
}

/**
 * Send cost alert to Slack/Discord
 */
async function sendCostAlert(
  provider: string,
  currentCost: number,
  threshold: number
): Promise<void> {
  const message = {
    text: `⚠️ API 비용 경고`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*API 비용 경고* - ${provider}\n현재 비용: $${currentCost.toFixed(2)} / 임계값: $${threshold}`,
        },
      },
    ],
  };

  // Slack
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    }).catch(console.error);
  }

  // Discord
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    await fetch(discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⚠️ **API 비용 경고** - ${provider}\n현재 비용: $${currentCost.toFixed(2)} / 임계값: $${threshold}`,
      }),
    }).catch(console.error);
  }
}

/**
 * Get usage summary for a period
 */
export async function getUsageSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  byProvider: Record<string, { tokens: number; cost: number; calls: number }>;
  total: { tokens: number; cost: number; calls: number };
}> {
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('api_usage_logs') as any)
    .select('provider, tokens_used, cost_usd')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  interface UsageLog {
    provider: string;
    tokens_used?: number;
    cost_usd?: number;
  }

  const byProvider: Record<
    string,
    { tokens: number; cost: number; calls: number }
  > = {};
  let totalTokens = 0;
  let totalCost = 0;
  let totalCalls = 0;

  for (const log of (data || []) as UsageLog[]) {
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { tokens: 0, cost: 0, calls: 0 };
    }
    byProvider[log.provider].tokens += log.tokens_used || 0;
    byProvider[log.provider].cost += log.cost_usd || 0;
    byProvider[log.provider].calls += 1;

    totalTokens += log.tokens_used || 0;
    totalCost += log.cost_usd || 0;
    totalCalls += 1;
  }

  return {
    byProvider,
    total: { tokens: totalTokens, cost: totalCost, calls: totalCalls },
  };
}

/**
 * Estimate cost before making API call
 */
export function estimateCost(
  provider: string,
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): CostEstimate {
  return {
    provider,
    model,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
    estimatedCost: calculateCost(
      provider,
      model,
      estimatedInputTokens,
      estimatedOutputTokens
    ),
  };
}

// =====================================================
// HELPER: Wrapper for API calls with automatic logging
// =====================================================

export interface APICallOptions {
  provider: 'anthropic' | 'openai' | 'replicate' | 'google';
  model: string;
  logUsage?: boolean;
}

/**
 * Wrap an API call with automatic usage logging
 */
export async function withUsageLogging<T>(
  apiCall: () => Promise<T>,
  options: APICallOptions,
  getTokens: (result: T) => { input: number; output: number }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await apiCall();
    const latencyMs = Date.now() - startTime;
    const tokens = getTokens(result);

    if (options.logUsage !== false) {
      await logAPIUsage({
        provider: options.provider,
        endpoint: options.model,
        tokensInput: tokens.input,
        tokensOutput: tokens.output,
        costUsd: calculateCost(
          options.provider,
          options.model,
          tokens.input,
          tokens.output
        ),
        latencyMs,
        status: 'success',
      });
    }

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (options.logUsage !== false) {
      await logAPIUsage({
        provider: options.provider,
        endpoint: options.model,
        tokensInput: 0,
        tokensOutput: 0,
        costUsd: 0,
        latencyMs,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    throw error;
  }
}
