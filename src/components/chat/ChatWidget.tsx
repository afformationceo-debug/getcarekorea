'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface ChatWidgetProps {
  defaultOpen?: boolean;
  variant?: 'floating' | 'embedded';
  className?: string;
}

export function ChatWidget({
  defaultOpen = false,
  variant = 'floating',
  className,
}: ChatWidgetProps) {
  const t = useTranslations('chat');
  const locale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(defaultOpen || variant === 'embedded');
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions based on locale
  const suggestions = t.raw('suggestions') as string[];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t('welcomeMessage'),
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, t]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          locale,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('error'),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );

    // Send feedback to API
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback }),
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Embedded variant - always visible, no toggle
  if (variant === 'embedded') {
    return (
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-2xl border bg-background/80 backdrop-blur-lg shadow-2xl',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"
            >
              <Sparkles className="h-6 w-6 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
            </motion.div>
            <div>
              <h3 className="font-semibold text-lg">{t('title')}</h3>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-to-br from-primary/20 to-primary/10'
                  )}
                >
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>
                <div className={cn('max-w-[80%] space-y-2', message.role === 'user' ? 'text-right' : '')}>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-4 py-3 text-sm',
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-muted/60'
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === 'assistant' && message.id !== 'welcome' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-6 w-6', message.feedback === 'positive' && 'text-green-500')}
                        onClick={() => handleFeedback(message.id, 'positive')}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-6 w-6', message.feedback === 'negative' && 'text-red-500')}
                        onClick={() => handleFeedback(message.id, 'negative')}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm">{t('thinking')}</span>
                </div>
              </motion.div>
            )}

            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3 pt-2"
              >
                <p className="text-xs font-medium text-muted-foreground">{t('tryAsking') || 'Try asking:'}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((suggestion, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-full border bg-background/80 px-4 py-2 text-xs font-medium transition-all hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className="flex-1 rounded-full border-muted-foreground/20 bg-muted/30 px-5"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-full shadow-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {t('poweredBy')}
          </p>
        </div>
      </div>
    );
  }

  // Floating variant
  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl shadow-primary/30"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <MessageCircle className="h-7 w-7" />
              </motion.div>
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold shadow-lg">
                AI
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-lg shadow-2xl',
              isExpanded
                ? 'bottom-4 right-4 left-4 top-4 md:bottom-6 md:right-6 md:left-auto md:top-6 md:w-[500px]'
                : 'bottom-6 right-6 h-[600px] w-[400px] max-sm:bottom-0 max-sm:right-0 max-sm:h-full max-sm:w-full max-sm:rounded-none'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary via-primary to-primary/90 px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <Sparkles className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary bg-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('title')}</h3>
                  <p className="text-xs opacity-80">{t('subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] space-y-2',
                        message.role === 'user' ? 'text-right' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'inline-block rounded-2xl px-4 py-2 text-sm',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.content}
                      </div>
                      {/* Feedback buttons for assistant messages */}
                      {message.role === 'assistant' && message.id !== 'welcome' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'positive' && 'text-green-500'
                            )}
                            onClick={() => handleFeedback(message.id, 'positive')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'negative' && 'text-red-500'
                            )}
                            onClick={() => handleFeedback(message.id, 'negative')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t('thinking')}</span>
                    </div>
                  </div>
                )}

                {/* Suggestions (show when no messages or after welcome) */}
                {messages.length <= 1 && (
                  <div className="space-y-2 pt-4">
                    <p className="text-xs text-muted-foreground">{t('tryAsking')}</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 3).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('placeholder')}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Hero embedded chat widget for landing page
export function HeroChatWidget({ className }: { className?: string }) {
  return <ChatWidget variant="embedded" className={cn('h-[520px]', className)} />;
}
