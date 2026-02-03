// GetCareKorea Database Types
// Generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'patient' | 'interpreter' | 'hospital_admin' | 'admin';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';
export type InquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type KeywordStatus = 'pending' | 'generating' | 'generated' | 'published';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          locale: string;
          phone: string | null;
          preferred_messenger: string | null;
          messenger_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          locale?: string;
          phone?: string | null;
          preferred_messenger?: string | null;
          messenger_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          locale?: string;
          phone?: string | null;
          preferred_messenger?: string | null;
          messenger_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          slug: string;
          // JSONB multilingual columns
          name: Json; // JSONB: { en: "...", ko: "...", "zh-TW": "...", ... }
          description: Json | null; // JSONB: { en: "...", ko: "...", "zh-TW": "...", ... }
          ai_summary: Json | null; // JSONB: { en: "...", ko: "...", ... }
          logo_url: string | null;
          cover_image_url: string | null;
          gallery: string[];
          address: string | null;
          city: string | null;
          district: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          specialties: string[];
          languages: string[];
          certifications: string[];
          has_cctv: boolean;
          has_female_doctor: boolean;
          operating_hours: Json;
          avg_rating: number;
          review_count: number;
          is_featured: boolean;
          is_verified: boolean;
          status: ContentStatus;
          admin_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: Json; // JSONB: { en: "...", ko: "...", ... }
          description?: Json | null;
          ai_summary?: Json | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          gallery?: string[];
          address?: string | null;
          city?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          specialties?: string[];
          languages?: string[];
          certifications?: string[];
          has_cctv?: boolean;
          has_female_doctor?: boolean;
          operating_hours?: Json;
          avg_rating?: number;
          review_count?: number;
          is_featured?: boolean;
          is_verified?: boolean;
          status?: ContentStatus;
          admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>;
      };
      doctors: {
        Row: {
          id: string;
          hospital_id: string;
          name_en: string;
          name_zh_tw: string | null;
          name_zh_cn: string | null;
          name_ja: string | null;
          name_th: string | null;
          name_mn: string | null;
          name_ru: string | null;
          title_en: string | null;
          title_zh_tw: string | null;
          title_zh_cn: string | null;
          title_ja: string | null;
          title_th: string | null;
          title_mn: string | null;
          title_ru: string | null;
          bio_en: string | null;
          bio_zh_tw: string | null;
          bio_zh_cn: string | null;
          bio_ja: string | null;
          bio_th: string | null;
          bio_mn: string | null;
          bio_ru: string | null;
          photo_url: string | null;
          specialties: string[];
          languages: string[];
          years_experience: number;
          education: Json;
          certifications: string[];
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          name_en: string;
          name_zh_tw?: string | null;
          name_zh_cn?: string | null;
          name_ja?: string | null;
          name_th?: string | null;
          name_mn?: string | null;
          name_ru?: string | null;
          title_en?: string | null;
          title_zh_tw?: string | null;
          title_zh_cn?: string | null;
          title_ja?: string | null;
          title_th?: string | null;
          title_mn?: string | null;
          title_ru?: string | null;
          bio_en?: string | null;
          bio_zh_tw?: string | null;
          bio_zh_cn?: string | null;
          bio_ja?: string | null;
          bio_th?: string | null;
          bio_mn?: string | null;
          bio_ru?: string | null;
          photo_url?: string | null;
          specialties?: string[];
          languages?: string[];
          years_experience?: number;
          education?: Json;
          certifications?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['doctors']['Insert']>;
      };
      procedures: {
        Row: {
          id: string;
          hospital_id: string;
          slug: string;
          category: string;
          name_en: string;
          name_zh_tw: string | null;
          name_zh_cn: string | null;
          name_ja: string | null;
          name_th: string | null;
          name_mn: string | null;
          name_ru: string | null;
          description_en: string | null;
          description_zh_tw: string | null;
          description_zh_cn: string | null;
          description_ja: string | null;
          description_th: string | null;
          description_mn: string | null;
          description_ru: string | null;
          price_min: number | null;
          price_max: number | null;
          price_currency: string;
          duration_minutes: number | null;
          recovery_days: number | null;
          includes: string[];
          requirements: string[];
          is_popular: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          slug: string;
          category: string;
          name_en: string;
          name_zh_tw?: string | null;
          name_zh_cn?: string | null;
          name_ja?: string | null;
          name_th?: string | null;
          name_mn?: string | null;
          name_ru?: string | null;
          description_en?: string | null;
          description_zh_tw?: string | null;
          description_zh_cn?: string | null;
          description_ja?: string | null;
          description_th?: string | null;
          description_mn?: string | null;
          description_ru?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          price_currency?: string;
          duration_minutes?: number | null;
          recovery_days?: number | null;
          includes?: string[];
          requirements?: string[];
          is_popular?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['procedures']['Insert']>;
      };
      interpreters: {
        Row: {
          id: string;
          profile_id: string;
          languages: Json;
          specialties: string[];
          bio_en: string | null;
          bio_zh_tw: string | null;
          bio_zh_cn: string | null;
          bio_ja: string | null;
          bio_th: string | null;
          bio_mn: string | null;
          bio_ru: string | null;
          photo_url: string | null;
          video_url: string | null;
          hourly_rate: number | null;
          daily_rate: number | null;
          availability: Json;
          avg_rating: number;
          review_count: number;
          total_bookings: number;
          is_verified: boolean;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          languages?: Json;
          specialties?: string[];
          bio_en?: string | null;
          bio_zh_tw?: string | null;
          bio_zh_cn?: string | null;
          bio_ja?: string | null;
          bio_th?: string | null;
          bio_mn?: string | null;
          bio_ru?: string | null;
          photo_url?: string | null;
          video_url?: string | null;
          hourly_rate?: number | null;
          daily_rate?: number | null;
          availability?: Json;
          avg_rating?: number;
          review_count?: number;
          total_bookings?: number;
          is_verified?: boolean;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['interpreters']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          profile_id: string;
          hospital_id: string | null;
          interpreter_id: string | null;
          procedure_id: string | null;
          doctor_id: string | null;
          booking_date: string;
          booking_time: string | null;
          status: BookingStatus;
          notes: string | null;
          total_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          hospital_id?: string | null;
          interpreter_id?: string | null;
          procedure_id?: string | null;
          doctor_id?: string | null;
          booking_date: string;
          booking_time?: string | null;
          status?: BookingStatus;
          notes?: string | null;
          total_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      inquiries: {
        Row: {
          id: string;
          profile_id: string | null;
          hospital_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          messenger_type: string | null;
          messenger_id: string | null;
          procedure_interest: string | null;
          message: string;
          locale: string;
          status: InquiryStatus;
          assigned_to: string | null;
          communication_log: Json;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          hospital_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          messenger_type?: string | null;
          messenger_id?: string | null;
          procedure_interest?: string | null;
          message: string;
          locale?: string;
          status?: InquiryStatus;
          assigned_to?: string | null;
          communication_log?: Json;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          profile_id: string;
          hospital_id: string | null;
          doctor_id: string | null;
          interpreter_id: string | null;
          booking_id: string | null;
          rating: number;
          title: string | null;
          content: string | null;
          photos: string[];
          procedure_type: string | null;
          visit_date: string | null;
          is_verified: boolean;
          is_featured: boolean;
          status: ReviewStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          hospital_id?: string | null;
          doctor_id?: string | null;
          interpreter_id?: string | null;
          booking_id?: string | null;
          rating: number;
          title?: string | null;
          content?: string | null;
          photos?: string[];
          procedure_type?: string | null;
          visit_date?: string | null;
          is_verified?: boolean;
          is_featured?: boolean;
          status?: ReviewStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_zh_tw: string | null;
          title_zh_cn: string | null;
          title_ja: string | null;
          title_th: string | null;
          title_mn: string | null;
          title_ru: string | null;
          excerpt_en: string | null;
          excerpt_zh_tw: string | null;
          excerpt_zh_cn: string | null;
          excerpt_ja: string | null;
          excerpt_th: string | null;
          excerpt_mn: string | null;
          excerpt_ru: string | null;
          content_en: string | null;
          content_zh_tw: string | null;
          content_zh_cn: string | null;
          content_ja: string | null;
          content_th: string | null;
          content_mn: string | null;
          content_ru: string | null;
          meta_title_en: string | null;
          meta_title_zh_tw: string | null;
          meta_title_zh_cn: string | null;
          meta_title_ja: string | null;
          meta_title_th: string | null;
          meta_title_mn: string | null;
          meta_title_ru: string | null;
          meta_description_en: string | null;
          meta_description_zh_tw: string | null;
          meta_description_zh_cn: string | null;
          meta_description_ja: string | null;
          meta_description_th: string | null;
          meta_description_mn: string | null;
          meta_description_ru: string | null;
          cover_image_url: string | null;
          category: string | null;
          tags: string[];
          author_id: string | null;
          author_persona_id: string | null;
          status: ContentStatus;
          published_at: string | null;
          generation_metadata: Json;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_zh_tw?: string | null;
          title_zh_cn?: string | null;
          title_ja?: string | null;
          title_th?: string | null;
          title_mn?: string | null;
          title_ru?: string | null;
          excerpt_en?: string | null;
          excerpt_zh_tw?: string | null;
          excerpt_zh_cn?: string | null;
          excerpt_ja?: string | null;
          excerpt_th?: string | null;
          excerpt_mn?: string | null;
          excerpt_ru?: string | null;
          content_en?: string | null;
          content_zh_tw?: string | null;
          content_zh_cn?: string | null;
          content_ja?: string | null;
          content_th?: string | null;
          content_mn?: string | null;
          content_ru?: string | null;
          meta_title_en?: string | null;
          meta_title_zh_tw?: string | null;
          meta_title_zh_cn?: string | null;
          meta_title_ja?: string | null;
          meta_title_th?: string | null;
          meta_title_mn?: string | null;
          meta_title_ru?: string | null;
          meta_description_en?: string | null;
          meta_description_zh_tw?: string | null;
          meta_description_zh_cn?: string | null;
          meta_description_ja?: string | null;
          meta_description_th?: string | null;
          meta_description_mn?: string | null;
          meta_description_ru?: string | null;
          cover_image_url?: string | null;
          category?: string | null;
          tags?: string[];
          author_id?: string | null;
          author_persona_id?: string | null;
          status?: ContentStatus;
          published_at?: string | null;
          generation_metadata?: Json;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blog_posts']['Insert']>;
      };
      content_keywords: {
        Row: {
          id: string;
          keyword: string;
          category: string | null;
          locale: string;
          search_volume: number;
          competition: number;
          priority: number;
          status: KeywordStatus;
          blog_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          category?: string | null;
          locale?: string;
          search_volume?: number;
          competition?: number;
          priority?: number;
          status?: KeywordStatus;
          blog_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['content_keywords']['Insert']>;
      };
      chat_conversations: {
        Row: {
          id: string;
          profile_id: string | null;
          session_id: string;
          locale: string;
          messages: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          session_id: string;
          locale?: string;
          messages?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chat_conversations']['Insert']>;
      };
      llm_interactions: {
        Row: {
          id: string;
          conversation_id: string | null;
          model: string;
          prompt_version: string | null;
          input_tokens: number;
          output_tokens: number;
          response_time_ms: number;
          feedback_rating: number | null;
          feedback_text: string | null;
          cost_usd: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          model: string;
          prompt_version?: string | null;
          input_tokens?: number;
          output_tokens?: number;
          response_time_ms?: number;
          feedback_rating?: number | null;
          feedback_text?: string | null;
          cost_usd?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['llm_interactions']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      inquiry_status: InquiryStatus;
      booking_status: BookingStatus;
      review_status: ReviewStatus;
      keyword_status: KeywordStatus;
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Table type aliases
export type Profile = Tables<'profiles'>;
export type Hospital = Tables<'hospitals'>;
export type Doctor = Tables<'doctors'>;
export type Procedure = Tables<'procedures'>;
export type Interpreter = Tables<'interpreters'>;
export type Booking = Tables<'bookings'>;
export type Inquiry = Tables<'inquiries'>;
export type Review = Tables<'reviews'>;
export type BlogPost = Tables<'blog_posts'>;
export type ContentKeyword = Tables<'content_keywords'>;
export type ChatConversation = Tables<'chat_conversations'>;
export type LLMInteraction = Tables<'llm_interactions'>;
