'use client';

/**
 * Keyword Bulk Upload Component
 *
 * Features:
 * - 드래그 앤 드롭 CSV 업로드
 * - 파일 선택 업로드
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
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  parseCSV,
  generateCSVTemplate,
  generateErrorReport,
  type ParsedKeyword,
  type CSVParseResult,
  type CSVParseError,
} from '@/lib/content/csv-parser';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

interface UploadResult {
  success: boolean;
  data: {
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
    duplicates: string[];
    error_details: Array<{ keyword: string; error: string }>;
  };
  message: string;
}

interface KeywordBulkUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  defaultLocale?: Locale;
  defaultCategory?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const SUPPORTED_LOCALES: { value: Locale; label: string; flag: string }[] = [
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

// =====================================================
// COMPONENT
// =====================================================

export function KeywordBulkUpload({
  onUploadComplete,
  defaultLocale = 'en',
  defaultCategory = 'general',
}: KeywordBulkUploadProps) {
  // State
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [category, setCategory] = useState(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
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
        const result = parseCSV(content, {
          delimiter: '|',
          locale,
          category,
          skipHeader: true,
        });
        setParseResult(result);
        setActiveTab('preview');
      }
    };
    reader.readAsText(acceptedFile, 'UTF-8');
  }, [locale, category]);

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
          locale,
          category,
          skip_duplicates: skipDuplicates,
          update_existing: updateExisting,
        }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      // API 응답 형식 정규화
      const normalizedResult: UploadResult = {
        success: result.success !== false,
        data: {
          total: result.data?.total ?? 0,
          inserted: result.data?.inserted ?? 0,
          updated: result.data?.updated ?? 0,
          skipped: result.data?.skipped ?? 0,
          errors: result.data?.errors ?? 0,
          duplicates: result.data?.duplicates ?? [],
          error_details: result.data?.error_details ?? [],
        },
        message: result.message || result.data?.message || (result.success !== false ? '업로드 완료' : '업로드 실패'),
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

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate(locale);
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyword-template-${locale}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>키워드 일괄 등록</CardTitle>
          <CardDescription>
            CSV 파일로 키워드를 일괄 등록합니다. 포맷: 키워드(현지어)|키워드(한국어)|검색량
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Locale & Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>타겟 언어</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value}>
                      <span className="flex items-center gap-2">
                        <span>{loc.flag}</span>
                        <span>{loc.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>카테고리</Label>
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
          </div>

          {/* Template Download */}
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            템플릿 다운로드 ({locale})
          </Button>
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
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Parse Result Stats */}
              {parseResult && (
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
                    <ScrollArea className="h-[300px] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>현지어 키워드</TableHead>
                            <TableHead>한국어 키워드</TableHead>
                            <TableHead className="w-[100px]">검색량</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parseResult.data.slice(0, 100).map((kw, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {kw.keyword_native}
                              </TableCell>
                              <TableCell>{kw.keyword_ko}</TableCell>
                              <TableCell>
                                {kw.search_volume?.toLocaleString() || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
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

export default KeywordBulkUpload;
