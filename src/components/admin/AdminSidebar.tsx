'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Search,
  BarChart3,
  Settings,
  MessageSquare,
  Activity,
  Bell,
  Gauge,
  MessageCircle,
  LogOut,
  Clock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/hospitals', labelKey: 'hospitals', icon: Building2, disabled: true },
  { href: '/admin/interpreters', labelKey: 'interpreters', icon: Users },
  { href: '/admin/inquiries', labelKey: 'inquiries', icon: MessageSquare, disabled: true },
  { href: '/admin/keywords', labelKey: 'keywords', icon: Search },
  { href: '/admin/content', labelKey: 'content', icon: FileText },
  { href: '/admin/seo', labelKey: 'seo', icon: Globe },
  { href: '/admin/cron', labelKey: 'cron', icon: Clock },
  { href: '/admin/progress', labelKey: 'progress', icon: Gauge, disabled: true },
  { href: '/admin/feedback', labelKey: 'feedback', icon: MessageCircle, disabled: true },
  { href: '/admin/analytics', labelKey: 'analytics', icon: BarChart3, disabled: true },
  { href: '/admin/system', labelKey: 'system', icon: Activity },
  { href: '/admin/system_settings', labelKey: 'settings', icon: Settings },
  { href: '/admin/notifications', labelKey: 'notifications', icon: Bell, disabled: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin.sidebar');

  // Check if current path matches nav item
  const isActive = (href: string, exact?: boolean) => {
    // Remove locale prefix from pathname (e.g., /en/admin/interpreters -> /admin/interpreters)
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');

    if (exact) {
      return pathWithoutLocale === href;
    }
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Admin Header */}
        <div className="border-b px-4 py-4">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const disabled = item.disabled;

              if (disabled) {
                return (
                  <li key={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start opacity-40 cursor-not-allowed"
                      disabled
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {t(`nav.${item.labelKey}`)}
                      <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">{t('soon')}</span>
                    </Button>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      active && 'bg-primary/10 text-primary font-medium'
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className={cn('mr-3 h-4 w-4', active && 'text-primary')} />
                      {t(`nav.${item.labelKey}`)}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            asChild
          >
            <Link href="/auth/logout">
              <LogOut className="mr-3 h-4 w-4" />
              {t('logout')}
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
