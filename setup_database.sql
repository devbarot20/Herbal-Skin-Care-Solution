-- Run this entire script in the Supabase SQL Editor
-- ============================================================
-- 1. Create the Users table (for storing names and emails)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. Create the Scan History table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    disease_name TEXT,
    confidence_score NUMERIC,
    remedies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. Create the Storage Bucket for images
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scan-images', 'scan-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Setup Storage Policies
-- ============================================================
-- Allow public read access to scan images
CREATE POLICY IF NOT EXISTS "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'scan-images' );

-- Allow authenticated uploads
CREATE POLICY IF NOT EXISTS "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'scan-images' );

-- ============================================================
-- 5. Enable RLS on public.users and add policies
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Allow service role to insert (used by the trigger below)
CREATE POLICY IF NOT EXISTS "Service role can insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- ============================================================
-- 6. Trigger: Auto-insert into public.users on new Supabase signup
--    This replaces the manual upsert from the frontend.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name  = COALESCE(EXCLUDED.name, public.users.name);
    RETURN NEW;
END;
$$;

-- Attach the trigger to auth.users so it fires on every new signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. Setup RLS Policies for scan_history
-- ============================================================
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own history
CREATE POLICY IF NOT EXISTS "Users can view own history" 
ON public.scan_history FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own history
CREATE POLICY IF NOT EXISTS "Users can insert own history" 
ON public.scan_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow service role (backend) to insert scan history for any user
CREATE POLICY IF NOT EXISTS "Service role can insert history"
ON public.scan_history FOR INSERT
WITH CHECK (true);
