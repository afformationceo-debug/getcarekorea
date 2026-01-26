'use client';

import { Link } from '@/lib/i18n/navigation';
import { ExternalLink, Hospital, Stethoscope, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendedLink {
  label: string;
  href: string;
  type: 'hospital' | 'procedure' | 'interpreter' | 'inquiry' | 'default';
}

interface MessageContentProps {
  content: string;
}

// Parse [LINK: Label | /path | type] format from AI response
function parseLinks(content: string): { text: string; links: RecommendedLink[] } {
  const linkRegex = /\[LINK:\s*([^\|]+)\s*\|\s*([^\|]+)\s*\|\s*([^\]]+)\]/g;
  const links: RecommendedLink[] = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      label: match[1].trim(),
      href: match[2].trim(),
      type: match[3].trim() as RecommendedLink['type'],
    });
  }

  // Remove link tags from text
  const cleanText = content.replace(linkRegex, '').trim();

  return { text: cleanText, links };
}

// Get icon for link type
function getLinkIcon(type: string) {
  switch (type) {
    case 'hospital':
      return <Hospital className="h-3.5 w-3.5" />;
    case 'procedure':
      return <Stethoscope className="h-3.5 w-3.5" />;
    case 'interpreter':
      return <Users className="h-3.5 w-3.5" />;
    case 'inquiry':
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <ExternalLink className="h-3.5 w-3.5" />;
  }
}

// Get button variant for link type
function getLinkVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'inquiry':
      return 'default';
    case 'hospital':
    case 'procedure':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function MessageContent({ content }: MessageContentProps) {
  const { text, links } = parseLinks(content);

  return (
    <div className="space-y-3">
      {/* Main text content */}
      <div className="whitespace-pre-wrap">{text}</div>

      {/* Recommended links as buttons */}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {links.map((link, index) => (
            <Button
              key={index}
              asChild
              variant={getLinkVariant(link.type)}
              size="sm"
              className="h-auto py-2 px-3 text-xs"
            >
              <Link href={link.href} className="gap-1.5">
                {getLinkIcon(link.type)}
                <span>{link.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
