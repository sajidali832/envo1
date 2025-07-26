-- ### Profiles Table ###
-- Stores user information.

CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  username text UNIQUE,
  email text UNIQUE,
  investment numeric DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  referred_by text,
  can_withdraw_override boolean DEFAULT false,
  registration_date timestamptz DEFAULT now(),
  last_earning_date timestamptz DEFAULT now(),
  withdrawal_info jsonb,
  withdrawal_history jsonb[],
  referrals jsonb[],
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);


-- ### Payments Table ###
-- Stores investment payment submissions.

CREATE TABLE public.payments (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_holder_name text,
  account_number text,
  payment_platform text,
  screenshot text,
  status text DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now()
);

-- Policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own payment
CREATE POLICY "Users can insert their own payment"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own payments
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

-- NOTE: For the admin panel, you will need to use the `service_role` key
-- to bypass these RLS policies to view/update all payments.
-- This is typically done in a secure server environment or Supabase Edge Function.
-- For client-side admin panels, you can create specific policies that check for an admin role.


-- ### Withdrawals Table ###
-- Stores withdrawal requests.

CREATE TABLE public.withdrawals (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  username text,
  amount numeric,
  date timestamptz DEFAULT now(),
  status text DEFAULT 'processing',
  account_info jsonb
);

-- Policies for withdrawals table
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own withdrawal requests
CREATE POLICY "Users can create their own withdrawal requests"
ON public.withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own withdrawal history
CREATE POLICY "Users can read their own withdrawal history"
ON public.withdrawals FOR SELECT
USING (auth.uid() = user_id);


-- ### Supabase Storage Bucket ###
-- Creates a bucket for app files, like payment screenshots.

-- Bucket creation must be done through the Supabase UI.
-- 1. Go to Storage in the dashboard.
-- 2. Click "New Bucket".
-- 3. Name the bucket `app-files`.
-- 4. Make the bucket **public**.

-- Policies for the storage bucket:
-- Allow users to upload to a folder named after their user ID.
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-files' AND
  (storage.foldername(name))[1] = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to view their own files.
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-files' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
