-- Run this entire script in the Supabase SQL Editor

-- 1. Create the Users table (for storing names and emails)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the Scan History table
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    disease_name TEXT,
    confidence_score NUMERIC,
    remedies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the Storage Bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scan-images', 'scan-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Setup Storage Policies so anyone can upload and read (for simplicity)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'scan-images' );

CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'scan-images' );

-- 5. Setup RLS Policies for scan_history (Optional but good practice)
-- Allow users to see only their own history
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" 
ON public.scan_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" 
ON public.scan_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);
