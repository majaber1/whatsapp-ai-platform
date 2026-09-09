-- ============================================================
-- 041_ai_provider_groq.sql — extend AI provider constraint for Groq
--
-- Broadens the existing provider allow-list without changing any row.
-- Existing OpenAI / Anthropic configurations remain valid.
-- Idempotent for migration replay.
-- ============================================================

ALTER TABLE public.ai_configs
  DROP CONSTRAINT IF EXISTS ai_configs_provider_check;

ALTER TABLE public.ai_configs
  ADD CONSTRAINT ai_configs_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'groq')) NOT VALID;

ALTER TABLE public.ai_configs
  VALIDATE CONSTRAINT ai_configs_provider_check;
