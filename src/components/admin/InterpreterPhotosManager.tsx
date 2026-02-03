'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  X,
  GripVertical,
  Plus,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  persona_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface InterpreterPhotosManagerProps {
  interpreterId: string;
  onPhotosChange?: (photos: Photo[]) => void;
}

export function InterpreterPhotosManager({
  interpreterId,
  onPhotosChange,
}: InterpreterPhotosManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load photos from main interpreter API
  const loadPhotos = useCallback(async () => {
    try {
      const response = await fetch(`/api/interpreters/${interpreterId}?includePhotos=true`);
      const data = await response.json();
      if (response.ok && data.data) {
        const workingPhotos = data.data.working_photos || [];
        setPhotos(workingPhotos);
        onPhotosChange?.(workingPhotos);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [interpreterId, onPhotosChange]);

  useEffect(() => {
    if (interpreterId) {
      loadPhotos();
    } else {
      setIsLoading(false);
    }
  }, [interpreterId, loadPhotos]);

  // Upload photo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // First upload to storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'interpreter-photos');
      formData.append('folder', interpreterId);

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      // Then save to database
      const saveResponse = await fetch(`/api/interpreters/${interpreterId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: uploadData.url,
          caption: '',
        }),
      });

      if (saveResponse.ok) {
        const data = await saveResponse.json();
        const newPhotos = [...photos, data.photo];
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);
        toast.success('사진이 추가되었습니다');
      } else {
        throw new Error('Failed to save photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('사진 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Delete photo
  const handleDelete = async (photoId: string) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(
        `/api/interpreters/${interpreterId}/photos?photoId=${photoId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const newPhotos = photos.filter((p) => p.id !== photoId);
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);
        toast.success('사진이 삭제되었습니다');
      } else {
        throw new Error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('사진 삭제에 실패했습니다');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newPhotos = [...photos];
      const [removed] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dragOverIndex, 0, removed);

      // Update display_order
      const updatedPhotos = newPhotos.map((photo, index) => ({
        ...photo,
        display_order: index,
      }));

      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Save order to database
  const saveOrder = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/interpreters/${interpreterId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map((p, index) => ({
            id: p.id,
            display_order: index,
          })),
        }),
      });

      if (response.ok) {
        toast.success('저장되었습니다');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (!interpreterId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            통역 활동 사진
          </CardTitle>
          <CardDescription>
            통역사를 먼저 저장한 후 사진을 추가할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="h-8 w-8 mr-2 opacity-50" />
            <span>통역사 저장 후 사진 추가 가능</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              통역 활동 사진
            </CardTitle>
            <CardDescription>
              통역 중인 사진을 추가하세요. 드래그하여 순서를 변경할 수 있습니다.
            </CardDescription>
          </div>
          {photos.length > 0 && (
            <Button
              onClick={saveOrder}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              순서 저장
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'relative group rounded-lg border-2 overflow-hidden transition-all cursor-move',
                      draggedIndex === index && 'opacity-50 scale-95',
                      dragOverIndex === index && 'border-primary border-dashed',
                      draggedIndex === null && 'border-transparent hover:border-muted-foreground/20'
                    )}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded p-1">
                        <GripVertical className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>

                    {/* Order Badge */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={photo.image_url}
                        alt={`사진 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="block cursor-pointer">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                  'hover:border-primary hover:bg-primary/5',
                  isUploading && 'opacity-50 pointer-events-none'
                )}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm text-muted-foreground">업로드 중...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">사진 추가</span>
                    <span className="text-xs text-muted-foreground">
                      클릭하여 업로드
                    </span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {photos.length === 0 && !isUploading && (
              <p className="text-center text-sm text-muted-foreground">
                아직 추가된 사진이 없습니다
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
