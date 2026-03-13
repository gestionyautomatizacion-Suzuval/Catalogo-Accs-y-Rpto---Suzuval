-- Create the site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the initial state for the offers carousel
INSERT INTO public.site_settings (key, value)
VALUES ('offers_carousel_active', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Public read access to site_settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Allow admins and supervisors to update settings
CREATE POLICY "Admins and supervisors can update settings"
    ON public.site_settings FOR UPDATE
    USING (is_admin_or_supervisor());

-- Allow admins and supervisors to insert settings
CREATE POLICY "Admins and supervisors can insert settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (is_admin_or_supervisor());
