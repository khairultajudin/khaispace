-- ==============================================================================
-- KHAI SPACE HUB — TOKEN USAGE MONITORING TABLE & RLS
-- ==============================================================================
-- Migration: 20261119164000_create_token_usage.sql
-- Target: khai-space-hub (dpicdhjaabfjbvppmsxk)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  command text NOT NULL,
  source text NOT NULL CHECK (source IN ('hermes', 'antigravity')),
  model text,
  input_tokens bigint NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens bigint NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  reasoning_tokens bigint NOT NULL DEFAULT 0 CHECK (reasoning_tokens >= 0),
  cache_read_tokens bigint NOT NULL DEFAULT 0 CHECK (cache_read_tokens >= 0),
  total_tokens bigint NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  cost_usd numeric,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token_usage_created_at_desc
  ON public.token_usage (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_usage_source
  ON public.token_usage (source);

CREATE INDEX IF NOT EXISTS idx_token_usage_workspace_id
  ON public.token_usage (workspace_id)
  WHERE workspace_id IS NOT NULL;

ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.token_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.token_usage TO authenticated;
GRANT ALL ON public.token_usage TO service_role;

CREATE POLICY "Authenticated users can read token usage"
  ON public.token_usage
  FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'token_usage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.token_usage;
  END IF;
END $$;
