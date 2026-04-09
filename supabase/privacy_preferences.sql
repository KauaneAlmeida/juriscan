-- Add privacy preference columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_data_improvements boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS usage_analytics boolean DEFAULT true;
