
-- 1. Theme preference on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system'
  CHECK (theme_preference IN ('light','dark','system'));

-- 2. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('general','direct')),
  title text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_general
  ON public.conversations ((type)) WHERE type = 'general';

-- 3. Participants (only for direct chats; general is implicit for all staff)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_cp_user ON public.conversation_participants(user_id);

-- 4. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);

-- 5. Read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

-- Helper: is user member of conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conv
      AND (
        (c.type = 'general' AND public.is_staff(_user))
        OR EXISTS (
          SELECT 1 FROM public.conversation_participants p
          WHERE p.conversation_id = _conv AND p.user_id = _user
        )
      )
  )
$$;

-- Touch updated_at on new message
CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_touch_conv ON public.messages;
CREATE TRIGGER trg_touch_conv AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Members view conversations" ON public.conversations;
CREATE POLICY "Members view conversations" ON public.conversations
FOR SELECT TO authenticated
USING (
  (type = 'general' AND public.is_staff(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff create conversations" ON public.conversations;
CREATE POLICY "Staff create conversations" ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

-- Participants policies
DROP POLICY IF EXISTS "Members view participants" ON public.conversation_participants;
CREATE POLICY "Members view participants" ON public.conversation_participants
FOR SELECT TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Staff add participants" ON public.conversation_participants;
CREATE POLICY "Staff add participants" ON public.conversation_participants
FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

-- Messages policies
DROP POLICY IF EXISTS "Members view messages" ON public.messages;
CREATE POLICY "Members view messages" ON public.messages
FOR SELECT TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members send messages" ON public.messages;
CREATE POLICY "Members send messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_member(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS "Sender deletes own messages" ON public.messages;
CREATE POLICY "Sender deletes own messages" ON public.messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Read receipts: user manages own
DROP POLICY IF EXISTS "Users manage own reads" ON public.message_reads;
CREATE POLICY "Users manage own reads" ON public.message_reads
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='conversations';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
  END IF;
END $$;

-- Seed General channel
INSERT INTO public.conversations (type, title)
SELECT 'general', 'General'
WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE type='general');
