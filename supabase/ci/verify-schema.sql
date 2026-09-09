-- Post-migration assertions for the CI job in
-- `.github/workflows/migrations.yml`.
--
-- `supabase db reset` already fails on any statement Postgres rejects,
-- so this is not about syntax. It's about the quieter failure: a
-- migration that applies cleanly and does nothing.
DO $$
BEGIN
  -- The core tables, from 001.
  IF to_regclass('public.messages') IS NULL THEN
    RAISE EXCEPTION 'public.messages is missing — migrations did not apply';
  END IF;
  IF to_regclass('public.whatsapp_config') IS NULL THEN
    RAISE EXCEPTION 'public.whatsapp_config is missing — migrations did not apply';
  END IF;

  -- Supabase provides the storage schema; migrations 016/020/023 write
  -- to it. If it is absent the bucket migrations silently accomplish
  -- nothing, which is precisely the case a plain "no errors" run hides.
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE EXCEPTION
      'storage.buckets is missing — the storage schema was not available when the bucket migrations ran';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-media') THEN
    RAISE EXCEPTION 'the chat-media bucket row was not created (migration 023)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'flow-media') THEN
    RAISE EXCEPTION 'the flow-media bucket row was not created (migration 016)';
  END IF;

  -- Account scoping (017) is load-bearing for every RLS policy.
  IF to_regclass('public.accounts') IS NULL THEN
    RAISE EXCEPTION 'public.accounts is missing — migration 017 did not apply';
  END IF;

  -- CR-001 / migration 040: provider identity must be scoped to the
  -- owning WhatsApp connection on both normal messages and broadcasts.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'whatsapp_config_id'
  ) THEN
    RAISE EXCEPTION
      'messages.whatsapp_config_id is missing — migration 040 did not apply';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'broadcast_recipients'
      AND column_name = 'whatsapp_config_id'
  ) THEN
    RAISE EXCEPTION
      'broadcast_recipients.whatsapp_config_id is missing — migration 040 did not apply';
  END IF;

  IF to_regclass('public.idx_messages_config_message_id_unique') IS NULL THEN
    RAISE EXCEPTION
      'idx_messages_config_message_id_unique is missing — CR-001 provider identity is not enforced';
  END IF;

  IF to_regclass('public.idx_broadcast_recipients_config_wamid_unique') IS NULL THEN
    RAISE EXCEPTION
      'idx_broadcast_recipients_config_wamid_unique is missing — broadcast provider identity is not enforced';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'messages'
      AND t.tgname = 'trg_stamp_message_whatsapp_config'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'trg_stamp_message_whatsapp_config is missing — legacy writers are not protected';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'broadcast_recipients'
      AND t.tgname = 'trg_stamp_broadcast_recipient_whatsapp_config'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION
      'trg_stamp_broadcast_recipient_whatsapp_config is missing — legacy broadcast writers are not protected';
  END IF;

  -- ADR-012 / migration 041: Groq must be accepted by the persisted
  -- provider allow-list while OpenAI and Anthropic remain valid.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public'
      AND r.relname = 'ai_configs'
      AND c.conname = 'ai_configs_provider_check'
      AND pg_get_constraintdef(c.oid) LIKE '%groq%'
      AND c.convalidated
  ) THEN
    RAISE EXCEPTION
      'ai_configs_provider_check does not allow validated Groq provider — migration 041 did not apply';
  END IF;

  RAISE NOTICE 'schema verification passed';
END
$$;

-- Keep this file to EXACTLY ONE top-level statement. `supabase db query
-- --file` sends the whole file as a prepared statement; add future
-- assertions INSIDE the DO block above.
