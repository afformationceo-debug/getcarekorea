'use client';

/**
 * Keyword Bulk Upload Component V2
 *
 * Features:
 * - 드래그 앤 드롭 CSV 업로드
 * - V2 포맷 지원 (경쟁도, 우선순위, 언어 자동 감지)
 * - 언어별 통계 표시
 * - 실시간 미리보기
 * - 에러 표시
 * - 업로드 진행 상태
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  RefreshCw,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  parseCSVV2,
  generateCSVTemplateV2,
  generateLegacyTemplate,
  generateErrorReportV2,
  generateLanguageStats,
  type ParsedKeywordV2,
  type CSVParseResultV2,
  type CSVParseError,
} from '@/lib/content/csv-parser-v2';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

interface UploadResultV2 {
  success: boolean;
  data: {
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
    duplicates: string[];
    error_details: Array<{ keyword: string; error: string }>;
    by_language: Record<string, {
      total: number;
      inserted: number;
      updated: number;
      skipped: number;
      errors: number;
    }>;
  };
  message: string;
}

interface KeywordBulkUploadV2Props {
  onUploadComplete?: (result: UploadResultV2) => void;
  defaultCategory?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const SUPPORTED_LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { value: 'mn', label: 'Монгол', flag: '🇲🇳' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const CATEGORIES = [
  { value: 'plastic-surgery', label: '성형외과' },
  { value: 'dermatology', label: '피부과' },
  { value: 'dental', label: '치과' },
  { value: 'health-checkup', label: '건강검진' },
  { value: 'ophthalmology', label: '안과' },
  { value: 'orthopedics', label: '정형외과' },
  { value: 'fertility', label: '난임치료' },
  { value: 'hair-transplant', label: '모발이식' },
  { value: 'general', label: '일반' },
];

const COMPETITION_LABELS = {
  1: '낮음',
  2: '낮음',
  3: '낮음',
  4: '중간',
  5: '중간',
  6: '중간',
  7: '중간',
  8: '높음',
  9: '높음',
  10: '높음',
};

// =====================================================
// COMPONENT
// =====================================================

export function KeywordBulkUploadV2({
  onUploadComplete,
  defaultCategory = 'general',
}: KeywordBulkUploadV2Props) {
  // State
  const [category, setCategory] = useState(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResultV2 | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResultV2 | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =====================================================
  // FILE HANDLING
  // =====================================================

  const handleFile = useCallback(async (acceptedFile: File) => {
    setFile(acceptedFile);
    setUploadResult(null);
    setUploadProgress(0);

    // Read and parse file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = parseCSVV2(content, {
          defaultCategory: category,
          skipHeader: true,
          autoDetectLanguage,
        });
        setParseResult(result);
        setActiveTab('preview');
      }
    };
    reader.readAsText(acceptedFile, 'UTF-8');
  }, [category, autoDetectLanguage]);

  // =====================================================
  // UPLOAD HANDLER
  // =====================================================

  const handleUpload = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/keywords/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: parseResult.data,
          category,
          skip_duplicates: skipDuplicates,
          update_existing: updateExisting,
          auto_detect_language: autoDetectLanguage,
        }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      // API 응답 형식 정규화
      const normalizedResult: UploadResultV2 = {
        success: result.success !== false,
        data: {
          total: result.data?.total ?? 0,
          inserted: result.data?.inserted ?? 0,
          updated: result.data?.updated ?? 0,
          skipped: result.data?.skipped ?? 0,
          errors: result.data?.errors ?? 0,
          duplicates: result.data?.duplicates ?? [],
          error_details: result.data?.error_details ?? [],
          by_language: result.data?.by_language ?? {},
        },
        message: result.message || (result.success !== false ? '업로드 완료' : '업로드 실패'),
      };

      setUploadResult(normalizedResult);
      setActiveTab('result');

      if (normalizedResult.success || normalizedResult.data.inserted > 0) {
        onUploadComplete?.(normalizedResult);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        data: {
          total: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
          duplicates: [],
          error_details: [{ keyword: '', error: error instanceof Error ? error.message : 'Unknown error' }],
          by_language: {},
        },
        message: '업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // =====================================================
  // TEMPLATE DOWNLOAD
  // =====================================================

  const handleDownloadTemplate = (format: 'v2' | 'legacy' = 'v2') => {
    if (format === 'v2') {
      const template = generateCSVTemplateV2(true);
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'keyword-template-v2.csv';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const template = generateLegacyTemplate('ko');
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'keyword-template-legacy.csv';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getCompetitionBadge = (competition: number | null) => {
    if (!competition) return null;
    const label = COMPETITION_LABELS[competition as keyof typeof COMPETITION_LABELS];
    const variant = competition <= 3 ? 'default' : competition <= 7 ? 'secondary' : 'destructive';
    return <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>{label} ({competition})</Badge>;
  };

  const getPriorityBadge = (priority: number | null) => {
    if (!priority) return null;
    const variant = priority >= 8 ? 'default' : priority >= 5 ? 'secondary' : 'outline';
    return <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>{priority}/10</Badge>;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>키워드 일괄 등록 (V2)</CardTitle>
          <CardDescription>
            CSV 파일로 키워드를 일괄 등록합니다.
            <br />
            <strong>V2 포맷:</strong> keyword,language,search_volume,competition,priority,category
            <br />
            <strong>레거시 포맷:</strong> 키워드(현지어)|키워드(한국어)|검색량
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>기본 카테고리</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={setSkipDuplicates}
              />
              <Label htmlFor="skip-duplicates">중복 키워드 스킵</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="update-existing"
                checked={updateExisting}
                onCheckedChange={setUpdateExisting}
              />
              <Label htmlFor="update-existing">기존 키워드 업데이트</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-detect"
                checked={autoDetectLanguage}
                onCheckedChange={setAutoDetectLanguage}
              />
              <Label htmlFor="auto-detect">언어 자동 감지</Label>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDownloadTemplate('v2')}>
              <Download className="mr-2 h-4 w-4" />
              V2 템플릿 다운로드
            </Button>
            <Button variant="ghost" onClick={() => handleDownloadTemplate('legacy')}>
              <Download className="mr-2 h-4 w-4" />
              레거시 템플릿
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          {!file ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 border-muted-foreground/25 hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleFile(selectedFile);
                    }
                  }}
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  CSV 파일을 클릭하여 선택
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  최대 5MB, .csv 또는 .txt 파일
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                      {parseResult && ` • ${parseResult.format_detected.toUpperCase()} 포맷`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Parse Result Stats */}
              {parseResult && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      총 {parseResult.stats.total_rows}개
                    </Badge>
                    <Badge variant="default" className="bg-green-500">
                      유효 {parseResult.stats.valid_rows}개
                    </Badge>
                    {parseResult.stats.invalid_rows > 0 && (
                      <Badge variant="destructive">
                        오류 {parseResult.stats.invalid_rows}개
                      </Badge>
                    )}
                    {parseResult.stats.duplicates_in_file > 0 && (
                      <Badge variant="outline">
                        중복 {parseResult.stats.duplicates_in_file}개
                      </Badge>
                    )}
                  </div>

                  {/* Language Stats */}
                  {Object.keys(parseResult.stats.by_language).length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">언어별 통계</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(parseResult.stats.by_language).map(([lang, count]) => {
                          const localeInfo = SUPPORTED_LOCALES.find(l => l.value === lang);
                          return (
                            <Badge key={lang} variant="outline">
                              {localeInfo?.flag} {localeInfo?.label || lang}: {count}개
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs for Preview/Errors/Result */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="preview">미리보기</TabsTrigger>
                  {parseResult && parseResult.errors.length > 0 && (
                    <TabsTrigger value="errors">
                      오류 ({parseResult.errors.length})
                    </TabsTrigger>
                  )}
                  {uploadResult && (
                    <TabsTrigger value="result">결과</TabsTrigger>
                  )}
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview">
                  {parseResult && parseResult.data.length > 0 && (
                    <ScrollArea className="h-[400px] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>키워드</TableHead>
                            <TableHead>언어</TableHead>
                            <TableHead className="w-[100px]">검색량</TableHead>
                            <TableHead className="w-[100px]">경쟁도</TableHead>
                            <TableHead className="w-[100px]">우선순위</TableHead>
                            <TableHead>카테고리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parseResult.data.slice(0, 100).map((kw, idx) => {
                            const localeInfo = SUPPORTED_LOCALES.find(l => l.value === kw.language);
                            return (
                              <TableRow key={idx}>
                                <TableCell className="text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {kw.keyword}
                                </TableCell>
                                <TableCell>
                                  <span className="flex items-center gap-1">
                                    {localeInfo?.flag} {localeInfo?.label || kw.language}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {kw.search_volume?.toLocaleString() || '-'}
                                </TableCell>
                                <TableCell>
                                  {getCompetitionBadge(kw.competition)}
                                </TableCell>
                                <TableCell>
                                  {getPriorityBadge(kw.priority)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {kw.category}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {parseResult.data.length > 100 && (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          ... 외 {parseResult.data.length - 100}개
                        </p>
                      )}
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Errors Tab */}
                <TabsContent value="errors">
                  {parseResult && parseResult.errors.length > 0 && (
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                      <div className="space-y-2">
                        {parseResult.errors.map((err, idx) => (
                          <Alert key={idx} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Row {err.row}</AlertTitle>
                            <AlertDescription>
                              {err.message}
                              {err.value && (
                                <span className="block text-xs mt-1 opacity-75">
                                  값: {err.value}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Result Tab */}
                <TabsContent value="result">
                  {uploadResult && (
                    <div className="space-y-4">
                      <Alert variant={uploadResult.success ? 'default' : 'destructive'}>
                        {uploadResult.success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {uploadResult.success ? '업로드 완료' : '업로드 실패'}
                        </AlertTitle>
                        <AlertDescription>{uploadResult.message}</AlertDescription>
                      </Alert>

                      {/* Overall Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-500">
                              {uploadResult.data.inserted}
                            </div>
                            <p className="text-sm text-muted-foreground">등록됨</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-500">
                              {uploadResult.data.updated}
                            </div>
                            <p className="text-sm text-muted-foreground">업데이트됨</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-500">
                              {uploadResult.data.skipped}
                            </div>
                            <p className="text-sm text-muted-foreground">스킵됨</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-500">
                              {uploadResult.data.errors}
                            </div>
                            <p className="text-sm text-muted-foreground">오류</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Language-specific Stats */}
                      {Object.keys(uploadResult.data.by_language).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              언어별 상세 통계
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {Object.entries(uploadResult.data.by_language).map(([lang, stats]) => {
                                const localeInfo = SUPPORTED_LOCALES.find(l => l.value === lang);
                                return (
                                  <div key={lang} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{localeInfo?.flag}</span>
                                      <span className="font-medium">{localeInfo?.label || lang}</span>
                                    </div>
                                    <div className="flex gap-2 text-sm">
                                      <Badge variant="default" className="bg-green-500">+{stats.inserted}</Badge>
                                      {stats.updated > 0 && <Badge variant="secondary">↻{stats.updated}</Badge>}
                                      {stats.skipped > 0 && <Badge variant="outline">-{stats.skipped}</Badge>}
                                      {stats.errors > 0 && <Badge variant="destructive">✕{stats.errors}</Badge>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {uploadResult.data.error_details && uploadResult.data.error_details.length > 0 && (
                        <ScrollArea className="h-[150px] border rounded-md p-4">
                          <div className="space-y-2">
                            {uploadResult.data.error_details.map((err, idx) => (
                              <div key={idx} className="text-sm text-red-500">
                                {err.keyword && <strong>{err.keyword}: </strong>}
                                {err.error}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    업로드 중... {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={
                    isUploading ||
                    !parseResult ||
                    parseResult.data.length === 0
                  }
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {parseResult?.data.length || 0}개 키워드 등록
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  초기화
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KeywordBulkUploadV2;
