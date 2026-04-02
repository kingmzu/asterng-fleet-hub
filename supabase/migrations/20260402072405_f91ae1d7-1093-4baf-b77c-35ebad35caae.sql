-- Add missing policies (skip insert which already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own avatars' AND tablename = 'objects') THEN
    CREATE POLICY "Users view own avatars" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own avatars' AND tablename = 'objects') THEN
    CREATE POLICY "Users update own avatars" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own avatars' AND tablename = 'objects') THEN
    CREATE POLICY "Users delete own avatars" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff view all avatars' AND tablename = 'objects') THEN
    CREATE POLICY "Staff view all avatars" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'profile-avatars' AND public.is_staff(auth.uid()));
  END IF;
END $$;