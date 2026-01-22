-- GetCareKorea Row Level Security (RLS) Policies
-- Supabase PostgreSQL

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpreters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is hospital admin for specific hospital
CREATE OR REPLACE FUNCTION is_hospital_admin(hospital_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM hospitals
        WHERE id = hospital_uuid
        AND admin_id = auth.uid()
    ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the interpreter
CREATE OR REPLACE FUNCTION is_interpreter_owner(interpreter_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM interpreters
        WHERE id = interpreter_uuid
        AND profile_id = auth.uid()
    ) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (is_admin());

-- New users insert their profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- HOSPITALS POLICIES
-- =====================================================

-- Anyone can read published hospitals
CREATE POLICY "Anyone can read published hospitals"
ON hospitals FOR SELECT
USING (status = 'published');

-- Hospital admins can read their hospitals
CREATE POLICY "Hospital admins can read own hospitals"
ON hospitals FOR SELECT
USING (admin_id = auth.uid());

-- Hospital admins can update their hospitals
CREATE POLICY "Hospital admins can update own hospitals"
ON hospitals FOR UPDATE
USING (admin_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins have full hospital access"
ON hospitals FOR ALL
USING (is_admin());

-- =====================================================
-- DOCTORS POLICIES
-- =====================================================

-- Anyone can read doctors of published hospitals
CREATE POLICY "Anyone can read doctors of published hospitals"
ON doctors FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM hospitals
        WHERE hospitals.id = doctors.hospital_id
        AND hospitals.status = 'published'
    )
);

-- Hospital admins can manage their doctors
CREATE POLICY "Hospital admins can manage doctors"
ON doctors FOR ALL
USING (is_hospital_admin(hospital_id));

-- Admins can do everything
CREATE POLICY "Admins have full doctor access"
ON doctors FOR ALL
USING (is_admin());

-- =====================================================
-- PROCEDURES POLICIES
-- =====================================================

-- Anyone can read procedures of published hospitals
CREATE POLICY "Anyone can read procedures of published hospitals"
ON procedures FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM hospitals
        WHERE hospitals.id = procedures.hospital_id
        AND hospitals.status = 'published'
    )
);

-- Hospital admins can manage their procedures
CREATE POLICY "Hospital admins can manage procedures"
ON procedures FOR ALL
USING (is_hospital_admin(hospital_id));

-- Admins can do everything
CREATE POLICY "Admins have full procedure access"
ON procedures FOR ALL
USING (is_admin());

-- =====================================================
-- INTERPRETERS POLICIES
-- =====================================================

-- Anyone can read available interpreters
CREATE POLICY "Anyone can read available interpreters"
ON interpreters FOR SELECT
USING (is_available = TRUE AND is_verified = TRUE);

-- Interpreters can read their own profile
CREATE POLICY "Interpreters can read own profile"
ON interpreters FOR SELECT
USING (profile_id = auth.uid());

-- Interpreters can update their own profile
CREATE POLICY "Interpreters can update own profile"
ON interpreters FOR UPDATE
USING (profile_id = auth.uid());

-- Interpreters can insert their profile
CREATE POLICY "Interpreters can insert own profile"
ON interpreters FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins have full interpreter access"
ON interpreters FOR ALL
USING (is_admin());

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings"
ON bookings FOR SELECT
USING (profile_id = auth.uid());

-- Users can create bookings
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Users can update their pending bookings
CREATE POLICY "Users can update pending bookings"
ON bookings FOR UPDATE
USING (profile_id = auth.uid() AND status = 'pending');

-- Hospital admins can read/update bookings for their hospital
CREATE POLICY "Hospital admins can manage hospital bookings"
ON bookings FOR ALL
USING (is_hospital_admin(hospital_id));

-- Interpreters can read/update bookings assigned to them
CREATE POLICY "Interpreters can manage assigned bookings"
ON bookings FOR ALL
USING (is_interpreter_owner(interpreter_id));

-- Admins can do everything
CREATE POLICY "Admins have full booking access"
ON bookings FOR ALL
USING (is_admin());

-- =====================================================
-- INQUIRIES POLICIES
-- =====================================================

-- Users can read their own inquiries
CREATE POLICY "Users can read own inquiries"
ON inquiries FOR SELECT
USING (profile_id = auth.uid());

-- Anyone can create inquiries
CREATE POLICY "Anyone can create inquiries"
ON inquiries FOR INSERT
WITH CHECK (TRUE);

-- Hospital admins can read inquiries for their hospital
CREATE POLICY "Hospital admins can read hospital inquiries"
ON inquiries FOR SELECT
USING (is_hospital_admin(hospital_id));

-- Assigned users can read/update their inquiries
CREATE POLICY "Assigned users can manage inquiries"
ON inquiries FOR ALL
USING (assigned_to = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins have full inquiry access"
ON inquiries FOR ALL
USING (is_admin());

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
ON reviews FOR SELECT
USING (status = 'approved');

-- Users can read their own reviews
CREATE POLICY "Users can read own reviews"
ON reviews FOR SELECT
USING (profile_id = auth.uid());

-- Users can create reviews
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Users can update their pending reviews
CREATE POLICY "Users can update pending reviews"
ON reviews FOR UPDATE
USING (profile_id = auth.uid() AND status = 'pending');

-- Admins can do everything
CREATE POLICY "Admins have full review access"
ON reviews FOR ALL
USING (is_admin());

-- =====================================================
-- BLOG POSTS POLICIES
-- =====================================================

-- Anyone can read published blog posts
CREATE POLICY "Anyone can read published blog posts"
ON blog_posts FOR SELECT
USING (status = 'published');

-- Authors can read their own posts
CREATE POLICY "Authors can read own posts"
ON blog_posts FOR SELECT
USING (author_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins have full blog post access"
ON blog_posts FOR ALL
USING (is_admin());

-- =====================================================
-- CONTENT KEYWORDS POLICIES
-- =====================================================

-- Only admins can manage keywords
CREATE POLICY "Admins have full keyword access"
ON content_keywords FOR ALL
USING (is_admin());

-- =====================================================
-- CHAT CONVERSATIONS POLICIES
-- =====================================================

-- Users can read their own conversations
CREATE POLICY "Users can read own conversations"
ON chat_conversations FOR SELECT
USING (profile_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE));

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON chat_conversations FOR INSERT
WITH CHECK (TRUE);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON chat_conversations FOR UPDATE
USING (profile_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE));

-- Admins can read all conversations
CREATE POLICY "Admins can read all conversations"
ON chat_conversations FOR SELECT
USING (is_admin());

-- =====================================================
-- LLM INTERACTIONS POLICIES
-- =====================================================

-- Only admins can access LLM interactions
CREATE POLICY "Admins have full LLM interaction access"
ON llm_interactions FOR ALL
USING (is_admin());
