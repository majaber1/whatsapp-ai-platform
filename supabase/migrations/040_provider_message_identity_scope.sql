-- ============================================================
-- 040_provider_message_identity_scope
-- CR-001 — tenant-safe provider message identity / status routing
--
-- Meta message identifiers (WAMIDs) are not a safe global key across
-- every WhatsApp phone-number namespace. The existing application stores
-- message_id / whatsapp_message_id without the owning whatsapp_config,
-- while status webhooks arrive with metadata.phone_number_id. Before we
-- support multiple WhatsApp numbers per tenant (CR-002), persist that
-- connection identity on every provider-linked row.
--
-- This migration is deliberately rollout-safe:
--   * new connection columns are nullable so schema can deploy before app;
--   * existing rows are backfilled while WACRM still guarantees one
--     whatsapp_config per account;
--   * composite partial unique indexes make the connection + WAMID the
--     canonical provider identity for new code;
--   * we DO NOT make the columns NOT NULL yet. A later enforcement
--     migration may do so after all writers are verified live.
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID
  REFERENCES whatsapp_config(id) ON DELETE SET NULL;

ALTER TABLE broadcast_recipients
  ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID
  REFERENCES whatsapp_config(id) ON DELETE SET NULL;

COMMENT ON COLUMN messages.whatsapp_config_id IS
  'WhatsApp connection that owns message_id/WAMID. CR-001 canonical provider identity is (whatsapp_config_id, message_id).';

COMMENT ON COLUMN broadcast_recipients.whatsapp_config_id IS
  'WhatsApp connection that owns whatsapp_message_id/WAMID. CR-001 canonical provider identity is (whatsapp_config_id, whatsapp_message_id).';

-- ------------------------------------------------------------
-- Backfill existing provider-linked rows.
--
-- At migration 040 the inherited WACRM schema still enforces one
-- whatsapp_config row per account. That makes account -> config mapping
-- deterministic. CR-002 must not remove that invariant until this
-- backfill and application rollout have been verified.
-- ------------------------------------------------------------
UPDATE messages AS m
SET whatsapp_config_id = wc.id
FROM whatsapp_config AS wc
WHERE m.whatsapp_config_id IS NULL
  AND m.message_id IS NOT NULL
  AND m.account_id = wc.account_id;

UPDATE broadcast_recipients AS br
SET whatsapp_config_id = wc.id
FROM broadcasts AS b
JOIN whatsapp_config AS wc
  ON wc.account_id = b.account_id
WHERE br.broadcast_id = b.id
  AND br.whatsapp_config_id IS NULL
  AND br.whatsapp_message_id IS NOT NULL;

-- Fail rather than silently accepting an ambiguous historical provider
-- row. Once CR-002 permits multiple configs per account, these rows can no
-- longer be reconstructed safely from account_id alone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM messages
    WHERE message_id IS NOT NULL
      AND whatsapp_config_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: provider-linked messages remain without whatsapp_config_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM broadcast_recipients
    WHERE whatsapp_message_id IS NOT NULL
      AND whatsapp_config_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: provider-linked broadcast recipients remain without whatsapp_config_id';
  END IF;
END
$$;

-- Detect ambiguous history before adding uniqueness. Do not delete or
-- collapse business data automatically in a governance migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM messages
    WHERE message_id IS NOT NULL
    GROUP BY whatsapp_config_id, message_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: duplicate (whatsapp_config_id, message_id) identities exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM broadcast_recipients
    WHERE whatsapp_message_id IS NOT NULL
    GROUP BY whatsapp_config_id, whatsapp_message_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: duplicate (whatsapp_config_id, whatsapp_message_id) identities exist';
  END IF;
END
$$;

-- Canonical provider identity indexes. Partial indexes preserve the many
-- local/non-provider rows whose provider id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_config_message_id_unique
  ON messages (whatsapp_config_id, message_id)
  WHERE message_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcast_recipients_config_wamid_unique
  ON broadcast_recipients (whatsapp_config_id, whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_config_id
  ON messages (whatsapp_config_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_whatsapp_config_id
  ON broadcast_recipients (whatsapp_config_id);

-- Preserve migration 037's conversation-local inbound replay boundary.
-- The new composite identity is the cross-connection safety boundary;
-- (conversation_id, message_id) remains useful for PostgREST ON CONFLICT
-- replay handling on inbound inserts.
