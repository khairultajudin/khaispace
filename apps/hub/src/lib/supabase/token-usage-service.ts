import { getSupabaseBrowserClient } from "./client";
import type { TokenUsageRecord, TokenUsageSource } from "@/types/dashboard";
import type { Database } from "@/types/database.types";

type TokenUsageRow = Database["public"]["Tables"]["token_usage"]["Row"];

export function mapTokenUsageRow(row: TokenUsageRow): TokenUsageRecord {
  const source: TokenUsageSource =
    row.source === "antigravity" ? "antigravity" : "hermes";

  return {
    id: row.id,
    created_at: row.created_at,
    command: row.command,
    source,
    model: row.model ?? null,
    input_tokens: Number(row.input_tokens ?? 0),
    output_tokens: Number(row.output_tokens ?? 0),
    reasoning_tokens: Number(row.reasoning_tokens ?? 0),
    cache_read_tokens: Number(row.cache_read_tokens ?? 0),
    total_tokens: Number(row.total_tokens ?? 0),
    cost_usd:
      row.cost_usd === null || row.cost_usd === undefined
        ? null
        : Number(row.cost_usd),
    workspace_id: row.workspace_id ?? null,
  };
}

export async function fetchTokenUsage(limit = 200): Promise<TokenUsageRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("token_usage")
    .select(
      "id, created_at, command, source, model, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, total_tokens, cost_usd, workspace_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTokenUsageRow);
}
