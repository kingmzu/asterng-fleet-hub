-- Make profile-avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'profile-avatars';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone view avatars" ON storage.objects;