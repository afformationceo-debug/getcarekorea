'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { X, Plus, Upload, Camera, ChevronDown, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

type LocalizedField = Record<string, string>;

// Extended language type with localized content
interface LanguageEntry {
  code: string;
  proficiency: string;
  name: string;
  bioShort: string;
  bioFull: string;
  certifications: string[];
}

type LocalizedCertifications = Record<string, string[]>;

interface AuthorPersona {
  id: string;
  slug: string;
  name: LocalizedField;
  bio_short: LocalizedField;
  bio_full: LocalizedField;
  photo_url: string | null;
  years_of_experience: number;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: Array<{ code: string; proficiency: string }>;
  certifications: string[] | LocalizedCertifications;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  location: string;
  preferred_messenger: string | null;
  display_order: number;
  avg_rating: number;
  review_count: number;
}

interface InterpreterFormPageProps {
  interpreter?: AuthorPersona;
}

const LOCALE_CODES = ['en', 'ko', 'ja', 'zh-TW', 'zh-CN', 'th', 'mn', 'ru'] as const;
const SPECIALTY_VALUES = ['plastic-surgery', 'dermatology', 'dental', 'health-checkup', 'fertility', 'hair-transplant', 'ophthalmology', 'orthopedics', 'general-medical'] as const;
const MESSENGER_VALUES = ['whatsapp', 'line', 'wechat', 'kakao'] as const;
const PROFICIENCY_VALUES = ['native', 'fluent', 'conversational'] as const;

// Convert old data format to new LanguageEntry format
function convertToLanguageEntries(
  languages: Array<{ code: string; proficiency: string }>,
  name: LocalizedField,
  bioShort: LocalizedField,
  bioFull: LocalizedField,
  certifications: string[] | LocalizedCertifications
): LanguageEntry[] {
  // Handle both old format (string[]) and new format (Record<string, string[]>)
  const getCertifications = (code: string): string[] => {
    if (Array.isArray(certifications)) {
      // Old format: show all certifications for first language only
      return languages[0]?.code === code ? certifications : [];
    }
    return certifications[code] || [];
  };

  return languages.map((lang) => ({
    code: lang.code,
    proficiency: lang.proficiency,
    name: name[lang.code] || '',
    bioShort: bioShort[lang.code] || '',
    bioFull: bioFull[lang.code] || '',
    certifications: getCertifications(lang.code),
  }));
}

// Convert LanguageEntry format back to database format
function convertFromLanguageEntries(entries: LanguageEntry[]) {
  const languages: Array<{ code: string; proficiency: string }> = [];
  const name: LocalizedField = {};
  const bioShort: LocalizedField = {};
  const bioFull: LocalizedField = {};
  // For now, flatten all certifications into a single array (DB expects array, not object)
  // TODO: After running migration to JSONB, change back to LocalizedCertifications
  const allCertifications: string[] = [];

  entries.forEach((entry) => {
    if (entry.code) {
      languages.push({ code: entry.code, proficiency: entry.proficiency });
      if (entry.name) name[entry.code] = entry.name;
      if (entry.bioShort) bioShort[entry.code] = entry.bioShort;
      if (entry.bioFull) bioFull[entry.code] = entry.bioFull;
      // Collect all certifications from all languages
      if (entry.certifications.length > 0) {
        allCertifications.push(...entry.certifications);
      }
    }
  });

  return { languages, name, bioShort, bioFull, certifications: allCertifications };
}

export function InterpreterFormPage({ interpreter }: InterpreterFormPageProps) {
  const t = useTranslations('admin.interpreters');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize language entries from existing data (without forcing English)
  const initialLanguageEntries = interpreter
    ? convertToLanguageEntries(
        interpreter.languages || [],
        interpreter.name || {},
        interpreter.bio_short || {},
        interpreter.bio_full || {},
        interpreter.certifications || []
      )
    : [];

  // Form state
  const [slug, setSlug] = useState(interpreter?.slug || '');
  const [englishName, setEnglishName] = useState(interpreter?.name?.en || ''); // English name is required separately
  const [languageEntries, setLanguageEntries] = useState<LanguageEntry[]>(initialLanguageEntries);
  const [photoUrl, setPhotoUrl] = useState(interpreter?.photo_url || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(String(interpreter?.years_of_experience ?? 5));
  const [primarySpecialty, setPrimarySpecialty] = useState(interpreter?.primary_specialty || 'plastic-surgery');
  const [secondarySpecialties, setSecondarySpecialties] = useState<string[]>(interpreter?.secondary_specialties || []);
  const [location, setLocation] = useState(interpreter?.location || 'Seoul, Gangnam');
  const [preferredMessenger, setPreferredMessenger] = useState(interpreter?.preferred_messenger || 'whatsapp');
  const [displayOrder, setDisplayOrder] = useState(String(interpreter?.display_order ?? 0));
  const [avgRating, setAvgRating] = useState(String(interpreter?.avg_rating ?? 4.8));
  const [reviewCount, setReviewCount] = useState(String(interpreter?.review_count ?? 0));
  const [isActive, setIsActive] = useState(interpreter?.is_active ?? true);
  const [isVerified, setIsVerified] = useState(interpreter?.is_verified ?? false);
  const [isFeatured, setIsFeatured] = useState(interpreter?.is_featured ?? false);

  const [openLanguages, setOpenLanguages] = useState<string[]>(
    initialLanguageEntries.map((_, i) => `lang-${i}`)
  );
  const [newCertInputs, setNewCertInputs] = useState<Record<number, string>>({});

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'interpreters');
      formData.append('folder', 'photos');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setPhotoUrl(data.url);
        toast.success(t('messages.imageUploaded'));
      } else {
        toast.error(data.error || t('messages.uploadFailed'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('messages.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate English name is required (as default fallback)
    if (!englishName.trim()) {
      toast.warning(t('messages.englishNameRequired'));
      return;
    }

    // Validate at least one language
    if (languageEntries.length === 0) {
      toast.warning(t('messages.atLeastOneLanguage'));
      return;
    }

    setIsLoading(true);

    const { languages, name, bioShort, bioFull, certifications } = convertFromLanguageEntries(languageEntries);

    // Always include English name in the name JSONB
    const nameWithEnglish = { ...name, en: englishName };

    const data = {
      slug,
      name: nameWithEnglish,
      bio_short: bioShort,
      bio_full: bioFull,
      photo_url: photoUrl || null,
      years_of_experience: parseInt(yearsOfExperience) || 0,
      primary_specialty: primarySpecialty,
      secondary_specialties: secondarySpecialties,
      languages,
      certifications,
      location,
      preferred_messenger: preferredMessenger,
      display_order: parseInt(displayOrder) || 0,
      avg_rating: parseFloat(avgRating) || 0,
      review_count: parseInt(reviewCount) || 0,
      is_active: isActive,
      is_verified: isVerified,
      is_featured: isFeatured,
    };

    try {
      const url = interpreter
        ? `/api/admin/interpreters/${interpreter.id}`
        : '/api/admin/interpreters';

      const response = await fetch(url, {
        method: interpreter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(interpreter ? t('messages.updated') : t('messages.created'));
        router.push(`/${locale}/admin/interpreters`);
        router.refresh();
      } else {
        const error = await response.json();
        const errorMessage = error.details || error.hint || error.error || error.message || 'Unknown error';
        toast.error(`${t('messages.saveFailed')}: ${errorMessage}`, {
          description: error.code ? `Error code: ${error.code}` : undefined,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving interpreter:', error);
      toast.error(t('messages.saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const addLanguageEntry = (code: string) => {
    if (!code) return;

    // Check if language already exists
    const usedCodes = languageEntries.map((e) => e.code);
    if (usedCodes.includes(code)) {
      toast.warning(t('messages.languageAlreadyAdded'));
      return;
    }

    const newEntry: LanguageEntry = {
      code,
      proficiency: 'fluent',
      name: '',
      bioShort: '',
      bioFull: '',
      certifications: [],
    };

    setLanguageEntries([...languageEntries, newEntry]);
    setOpenLanguages([...openLanguages, `lang-${languageEntries.length}`]);
  };

  // Get available languages that haven't been added yet
  const availableLanguagesToAdd = LOCALE_CODES.filter(
    (code) => !languageEntries.some((e) => e.code === code)
  );

  const removeLanguageEntry = (index: number) => {
    setLanguageEntries(languageEntries.filter((_, i) => i !== index));
    setOpenLanguages(openLanguages.filter((id) => id !== `lang-${index}`));
  };

  const updateLanguageEntry = (index: number, field: keyof LanguageEntry, value: string) => {
    const updated = [...languageEntries];
    updated[index] = { ...updated[index], [field]: value };
    setLanguageEntries(updated);
  };

  const toggleLanguageOpen = (id: string) => {
    setOpenLanguages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addCertificationToLanguage = (langIndex: number, cert: string) => {
    if (cert.trim()) {
      const updated = [...languageEntries];
      updated[langIndex] = {
        ...updated[langIndex],
        certifications: [...updated[langIndex].certifications, cert.trim()],
      };
      setLanguageEntries(updated);
    }
  };

  const removeCertificationFromLanguage = (langIndex: number, certIndex: number) => {
    const updated = [...languageEntries];
    updated[langIndex] = {
      ...updated[langIndex],
      certifications: updated[langIndex].certifications.filter((_, i) => i !== certIndex),
    };
    setLanguageEntries(updated);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.basic')}</CardTitle>
              <CardDescription>{t('descriptions.basicInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* English Name - Required */}
              <div>
                <Label className="flex items-center gap-2">
                  {t('fields.name')} (English) *
                  <Badge variant="default" className="text-xs">{t('fields.required')}</Badge>
                </Label>
                <Input
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{t('messages.englishNameRequired')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug (URL) *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="john-doe"
                    className="mt-1.5 font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">/interpreters/{slug || 'slug'}</p>
                </div>
                <div>
                  <Label>{t('fields.location')}</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Seoul, Gangnam"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('fields.yearsOfExperience')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{t('fields.preferredMessenger')}</Label>
                  <Select value={preferredMessenger} onValueChange={setPreferredMessenger}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                      {MESSENGER_VALUES.map((m) => (
                        <SelectItem key={m} value={m}>{t(`messengers.${m}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('fields.displayOrder')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('fields.avgRating')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={avgRating}
                    onChange={(e) => setAvgRating(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">0.0 ~ 5.0</p>
                </div>
                <div>
                  <Label>{t('fields.reviewCount')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={reviewCount}
                    onChange={(e) => setReviewCount(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages & Localization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    {t('fields.languagesSpoken')}
                  </CardTitle>
                  <CardDescription>{t('descriptions.languages')}</CardDescription>
                </div>
                {availableLanguagesToAdd.length > 0 && (
                  <Select onValueChange={addLanguageEntry}>
                    <SelectTrigger className="w-[180px]">
                      <Plus className="w-4 h-4 mr-2" />
                      <span>{t('fields.addLanguage')}</span>
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="end" sideOffset={4}>
                      {availableLanguagesToAdd.map((code) => (
                        <SelectItem key={code} value={code}>
                          {t(`locales.${code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {languageEntries.map((entry, index) => (
                <Collapsible
                  key={index}
                  open={openLanguages.includes(`lang-${index}`)}
                  onOpenChange={() => toggleLanguageOpen(`lang-${index}`)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              openLanguages.includes(`lang-${index}`) && "rotate-180"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {entry.code ? t(`locales.${entry.code}`) : t('placeholders.selectLanguage')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {entry.proficiency ? t(`proficiency.${entry.proficiency}`) : ''}
                            </Badge>
                          </div>
                          {entry.name && (
                            <span className="text-sm text-muted-foreground">
                              — {entry.name}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLanguageEntry(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{t('fields.language')}</Label>
                            <Input
                              value={entry.code ? t(`locales.${entry.code}`) : ''}
                              className="mt-1.5 bg-muted"
                              disabled
                            />
                          </div>
                          <div>
                            <Label>{t('fields.proficiency')} *</Label>
                            <Select
                              value={entry.proficiency}
                              onValueChange={(value) => updateLanguageEntry(index, 'proficiency', value)}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                                {PROFICIENCY_VALUES.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {t(`proficiency.${p}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>
                            {entry.code ? t(`locales.${entry.code}`) : ''} {t('fields.name')} *
                          </Label>
                          <Input
                            value={entry.name}
                            onChange={(e) => updateLanguageEntry(index, 'name', e.target.value)}
                            placeholder={t('placeholders.name', { language: entry.code ? t(`locales.${entry.code}`) : '' })}
                            className="mt-1.5"
                            required
                          />
                        </div>

                        <div>
                          <Label>
                            {t('fields.bioShort')} ({entry.code ? t(`locales.${entry.code}`) : ''})
                          </Label>
                          <Textarea
                            value={entry.bioShort}
                            onChange={(e) => updateLanguageEntry(index, 'bioShort', e.target.value)}
                            placeholder={t('placeholders.bioShort')}
                            rows={2}
                            className="mt-1.5 resize-none"
                          />
                        </div>

                        <div>
                          <Label>
                            {t('fields.bioFull')} ({entry.code ? t(`locales.${entry.code}`) : ''})
                          </Label>
                          <Textarea
                            value={entry.bioFull}
                            onChange={(e) => updateLanguageEntry(index, 'bioFull', e.target.value)}
                            placeholder={t('placeholders.bioFull')}
                            rows={4}
                            className="mt-1.5 resize-none"
                          />
                        </div>

                        <div>
                          <Label>
                            {t('fields.certifications')} ({entry.code ? t(`locales.${entry.code}`) : ''})
                          </Label>
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              value={newCertInputs[index] || ''}
                              onChange={(e) => setNewCertInputs({ ...newCertInputs, [index]: e.target.value })}
                              placeholder={t('placeholders.certification')}
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCertificationToLanguage(index, newCertInputs[index] || '');
                                  setNewCertInputs({ ...newCertInputs, [index]: '' });
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                addCertificationToLanguage(index, newCertInputs[index] || '');
                                setNewCertInputs({ ...newCertInputs, [index]: '' });
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {entry.certifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entry.certifications.map((cert, certIndex) => (
                                <Badge key={certIndex} variant="secondary" className="gap-1 pr-1 py-1">
                                  {cert}
                                  <button
                                    type="button"
                                    onClick={() => removeCertificationFromLanguage(index, certIndex)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}

              {languageEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Languages className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('messages.addLanguagePrompt')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.skills')}</CardTitle>
              <CardDescription>{t('descriptions.specialties')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t('fields.primarySpecialty')}</Label>
                <Select value={primarySpecialty} onValueChange={setPrimarySpecialty}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                    {SPECIALTY_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>{t(`specialties.${s}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">{t('fields.secondarySpecialties')}</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTY_VALUES.filter((s) => s !== primarySpecialty).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (secondarySpecialties.includes(s)) {
                          setSecondarySpecialties(secondarySpecialties.filter((x) => x !== s));
                        } else {
                          setSecondarySpecialties([...secondarySpecialties, s]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                        secondarySpecialties.includes(s)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {t(`specialties.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle>{t('fields.profilePhoto')}</CardTitle>
              <CardDescription>{t('descriptions.photoRatio')}</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block cursor-pointer group">
                <div className={cn(
                  "relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/25 transition-all",
                  "hover:border-primary/50",
                  isUploading && "opacity-50"
                )}>
                  {photoUrl ? (
                    <>
                      <Image
                        src={photoUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                        unoptimized={photoUrl.includes('.svg') || photoUrl.includes('dicebear')}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      {isUploading ? (
                        <LoadingSpinner size="lg" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <span className="text-sm">{t('upload.click')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {photoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setPhotoUrl('')}
                >
                  {t('actions.removePhoto')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'isActive' as const, state: isActive, setter: setIsActive },
                { key: 'isVerified' as const, state: isVerified, setter: setIsVerified },
                { key: 'isFeatured' as const, state: isFeatured, setter: setIsFeatured },
              ].map(({ key, state, setter }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t(`fields.${key}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`fields.${key}Desc`)}</p>
                  </div>
                  <Switch checked={state} onCheckedChange={setter} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                  {interpreter ? t('actions.save') : t('actions.create')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/admin/interpreters`)}
                >
                  {t('actions.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
