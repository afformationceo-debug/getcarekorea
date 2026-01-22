'use client';

/**
 * Content Management UI
 *
 * Main dashboard for managing generated content across all languages
 */

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  Edit,
  Trash2,
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// =====================================================
// TYPES
// =====================================================

type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW' | 'th' | 'mn' | 'ru';
type Status = 'draft' | 'published' | 'failed' | 'archived';

interface ContentDraft {
  id: string;
  keyword_text: string;
  locale: Locale;
  category: string;
  title: string;
  excerpt: string;
  status: Status;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  hreflang_group: string;
}

const LOCALE_FLAGS: Record<Locale, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  th: '🇹🇭',
  mn: '🇲🇳',
  ru: '🇷🇺',
};

const STATUS_COLORS: Record<Status, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ContentManagement() {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [locale, setLocale] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch drafts
  useEffect(() => {
    fetchDrafts();
  }, [locale, status, search, page]);

  async function fetchDrafts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (locale !== 'all') params.append('locale', locale);
      if (status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const response = await fetch(`/api/content/drafts?${params}`);
      const data = await response.json();

      if (data.success) {
        setDrafts(data.drafts);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  }

  // Select/deselect all
  function toggleSelectAll() {
    if (selectedIds.size === drafts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map((d) => d.id)));
    }
  }

  // Toggle individual selection
  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  // Bulk delete
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    if (!confirm(`${selectedIds.size}개의 콘텐츠를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/content/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedIds(new Set());
        fetchDrafts();
      }
    } catch (error) {
      console.error('Failed to delete drafts:', error);
    }
  }

  // Delete single draft
  async function handleDelete(id: string) {
    if (!confirm('이 콘텐츠를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/content/draft/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchDrafts();
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">콘텐츠 관리</h1>
          <p className="text-gray-600 mt-1">
            총 {total}개의 콘텐츠 ({selectedIds.size}개 선택됨)
          </p>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              선택 항목 삭제
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="키워드 또는 제목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="언어 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 언어</SelectItem>
            <SelectItem value="ko">🇰🇷 한국어</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="ja">🇯🇵 日本語</SelectItem>
            <SelectItem value="zh-CN">🇨🇳 简体中文</SelectItem>
            <SelectItem value="zh-TW">🇹🇼 繁體中文</SelectItem>
            <SelectItem value="th">🇹🇭 ไทย</SelectItem>
            <SelectItem value="mn">🇲🇳 Монгол</SelectItem>
            <SelectItem value="ru">🇷🇺 Русский</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">발행됨</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
            <SelectItem value="archived">보관됨</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === drafts.length && drafts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>키워드</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>언어</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  콘텐츠가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              drafts.map((draft) => (
                <TableRow key={draft.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(draft.id)}
                      onCheckedChange={() => toggleSelect(draft.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {draft.keyword_text}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {draft.title}
                  </TableCell>
                  <TableCell>
                    <span className="text-2xl">
                      {LOCALE_FLAGS[draft.locale]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{draft.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[draft.status]}>
                      {draft.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(draft.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/admin/preview/${draft.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/edit/${draft.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(draft.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            페이지 {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
