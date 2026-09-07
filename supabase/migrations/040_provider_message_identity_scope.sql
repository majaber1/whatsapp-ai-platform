-- ============================================================
-- 040_provider_message_identity_scope
-- CR-001 — tenant-safe provider message identity / status routing
--
-- Meta message identifiers (WAMIDs) are not a safe global key across
-- every WhatsApp phone-number namespace. Persist the owning
-- whatsapp_config and make (connection, provider-id) the canonical
-- provider identity before CR-002 introduces multiple numbers/tenant.
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID
  REFERENCES whatsapp_config(id) ON DELETE SET NULL;

ALTER TABLE broadcast_recipients
  ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID
  REFERENCES whatsapp_config(id) ON DELETE SET NULL;

COMMENT ON COLUMN messages.whatsapp_config_id IS
  'WhatsApp connection that owns message_id/WAMID. Canonical identity: (whatsapp_config_id, message_id).';

COMMENT ON COLUMN broadcast_recipients.whatsapp_config_id IS
  'WhatsApp connection that owns whatsapp_message_id/WAMID. Canonical identity: (whatsapp_config_id, whatsapp_message_id).';

-- ------------------------------------------------------------
-- Historical backfill while the inherited WACRM model still guarantees
-- exactly one WhatsApp configuration per account. Messages inherit tenant
-- ownership from conversations; they do not carry account_id directly.
-- ------------------------------------------------------------
UPDATE messages AS m
SET whatsapp_config_id = wc.id
FROM conversations AS c
JOIN whatsapp_config AS wc ON wc.account_id = c.account_id
WHERE m.conversation_id = c.id
  AND m.whatsapp_config_id IS NULL
  AND m.message_id IS NOT NULL;

UPDATE broadcast_recipients AS br
SET whatsapp_config_id = wc.id
FROM broadcasts AS b
JOIN whatsapp_config AS wc ON wc.account_id = b.account_id
WHERE br.broadcast_id = b.id
  AND br.whatsapp_config_id IS NULL
  AND br.whatsapp_message_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM messages
    WHERE message_id IS NOT NULL AND whatsapp_config_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: provider-linked messages remain without whatsapp_config_id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM broadcast_recipients
    WHERE whatsapp_message_id IS NOT NULL AND whatsapp_config_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'CR-001 migration blocked: provider-linked broadcast recipients remain without whatsapp_config_id';
  END IF;
END
$$;

-- Never silently deduplicate business records in a governance migration.
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

-- ------------------------------------------------------------
-- Write-boundary defense in depth.
--
-- Existing WACRM has several message writers. During the staged CR-001
-- rollout, a writer that has not yet been upgraded to pass the connection
-- explicitly is allowed only while its account owns exactly one config.
-- As soon as CR-002 permits multiple numbers, omission becomes an explicit
-- DB error instead of an unsafe guess. Writers that pass a connection are
-- always validated against the row's owning account.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_message_whatsapp_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_config_ids UUID[];
BEGIN
  IF NEW.message_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.account_id
    INTO v_account_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve account for provider-linked message conversation %', NEW.conversation_id;
  END IF;

  IF NEW.whatsapp_config_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM whatsapp_config wc
      WHERE wc.id = NEW.whatsapp_config_id
        AND wc.account_id = v_account_id
    ) THEN
      RAISE EXCEPTION
        'whatsapp_config_id % does not belong to message account %',
        NEW.whatsapp_config_id, v_account_id;
    END IF;
    RETURN NEW;
  END IF;

  SELECT array_agg(wc.id ORDER BY wc.id)
    INTO v_config_ids
  FROM whatsapp_config wc
  WHERE wc.account_id = v_account_id;

  IF COALESCE(array_length(v_config_ids, 1), 0) = 1 THEN
    NEW.whatsapp_config_id := v_config_ids[1];
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Provider-linked message requires explicit whatsapp_config_id for account % (config count=%)',
    v_account_id, COALESCE(array_length(v_config_ids, 1), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.stamp_broadcast_recipient_whatsapp_config()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_config_ids UUID[];
BEGIN
  IF NEW.whatsapp_message_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT b.account_id
    INTO v_account_id
  FROM broadcasts b
  WHERE b.id = NEW.broadcast_id;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Cannot resolve account for broadcast recipient %', NEW.id;
  END IF;

  IF NEW.whatsapp_config_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM whatsapp_config wc
      WHERE wc.id = NEW.whatsapp_config_id
        AND wc.account_id = v_account_id
    ) THEN
      RAISE EXCEPTION
        'whatsapp_config_id % does not belong to broadcast account %',
        NEW.whatsapp_config_id, v_account_id;
    END IF;
    RETURN NEW;
  END IF;

  SELECT array_agg(wc.id ORDER BY wc.id)
    INTO v_config_ids
  FROM whatsapp_config wc
  WHERE wc.account_id = v_account_id;

  IF COALESCE(array_length(v_config_ids, 1), 0) = 1 THEN
    NEW.whatsapp_config_id := v_config_ids[1];
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Broadcast recipient requires explicit whatsapp_config_id for account % (config count=%)',
    v_account_id, COALESCE(array_length(v_config_ids, 1), 0);
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_message_whatsapp_config ON messages;
CREATE TRIGGER trg_stamp_message_whatsapp_config
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION public.stamp_message_whatsapp_config();

DROP TRIGGER IF EXISTS trg_stamp_broadcast_recipient_whatsapp_config
  ON broadcast_recipients;
CREATE TRIGGER trg_stamp_broadcast_recipient_whatsapp_config
BEFORE INSERT OR UPDATE ON broadcast_recipients
FOR EACH ROW
EXECUTE FUNCTION public.stamp_broadcast_recipient_whatsapp_config();

REVOKE ALL ON FUNCTION public.stamp_message_whatsapp_config() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_broadcast_recipient_whatsapp_config() FROM PUBLIC;

-- Migration 037's (conversation_id, message_id) unique index remains the
-- inbound replay/idempotency arbiter used by PostgREST ON CONFLICT. The
-- new composite indexes are the cross-connection provider identity.
