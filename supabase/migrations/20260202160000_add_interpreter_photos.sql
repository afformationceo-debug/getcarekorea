-- Migration: Add interpreter_photos table
-- Description: Store working photos for interpreters with display order support

-- 통역사 사진 테이블 생성 (author_personas 테이블 참조)
CREATE TABLE IF NOT EXISTS interpreter_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES author_personas(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_interpreter_photos_persona_id
ON interpreter_photos(persona_id);

-- 정렬을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_interpreter_photos_order
ON interpreter_photos(persona_id, display_order);

-- RLS 활성화
ALTER TABLE interpreter_photos ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모두 가능)
CREATE POLICY "Anyone can view interpreter photos"
ON interpreter_photos FOR SELECT
USING (true);

-- 삽입 정책 (인증된 사용자)
CREATE POLICY "Authenticated users can insert interpreter photos"
ON interpreter_photos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 수정 정책 (인증된 사용자)
CREATE POLICY "Authenticated users can update interpreter photos"
ON interpreter_photos FOR UPDATE
USING (auth.role() = 'authenticated');

-- 삭제 정책 (인증된 사용자)
CREATE POLICY "Authenticated users can delete interpreter photos"
ON interpreter_photos FOR DELETE
USING (auth.role() = 'authenticated');

-- Storage 버킷 생성 (interpreter-photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('interpreter-photos', 'interpreter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 누구나 읽기 가능
CREATE POLICY "Public read interpreter photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'interpreter-photos');

-- Storage 정책: 인증된 사용자만 업로드
CREATE POLICY "Authenticated upload interpreter photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'interpreter-photos' AND auth.role() = 'authenticated');

-- Storage 정책: 인증된 사용자만 수정
CREATE POLICY "Authenticated update interpreter photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'interpreter-photos' AND auth.role() = 'authenticated');

-- Storage 정책: 인증된 사용자만 삭제
CREATE POLICY "Authenticated delete interpreter photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'interpreter-photos' AND auth.role() = 'authenticated');
