'use client';

import { usePathname } from 'next/navigation';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { MessengerCTA } from '@/components/cta/MessengerCTA';

export function ClientFloatingWidgets() {
  const pathname = usePathname();

  // Hide floating widgets on admin pages
  const isAdminPage = pathname?.includes('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <>
      <ChatWidget />
      <MessengerCTA variant="floating" size="lg" />
    </>
  );
}
