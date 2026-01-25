import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
    { href: '/admin/interpreters', label: 'Interpreters', icon: Users },
    { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
    { href: '/admin/keywords', label: 'Keywords', icon: Search },
    { href: '/admin/content', label: 'Content', icon: FileText },
    { href: '/admin/progress', label: 'Progress', icon: Gauge },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageCircle },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/system', label: 'System', icon: Activity },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
        <div className="flex h-full flex-col">
          {/* Admin Header */}
          <div className="border-b px-4 py-4">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">Manage your platform</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>
                        <Icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
