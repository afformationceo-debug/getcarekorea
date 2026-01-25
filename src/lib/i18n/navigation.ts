import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Create navigation utilities that automatically handle locale prefixing
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
