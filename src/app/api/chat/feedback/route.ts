import { NextResponse } from 'next/server';
import { storeChatFeedback } from '@/lib/upstash/redis';

export async function POST(req: Request) {
  try {
    const { messageId, feedback, conversationId, correction } = await req.json();

    if (!messageId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await storeChatFeedback({
      conversationId: conversationId || 'anonymous',
      messageId,
      helpful: feedback === 'positive',
      correction,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to store feedback' },
      { status: 500 }
    );
  }
}
