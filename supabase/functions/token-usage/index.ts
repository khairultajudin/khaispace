import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OWNER_USER_ID = "eff55cc9-b4d1-47a4-98b3-dcdb587f4d95";
const MAX_BODY_BYTES = 32 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_SOURCES = new Set(["hermes", "antigravity"]);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i];
  }
  return diff === 0;
}

async function authenticateRequest(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
  allowAnyAuthenticatedUser: boolean,
): Promise<{ ok: true; actor: string } | { ok: false; status: number; error: string }> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing Bearer authorization" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Empty Bearer token" };
  }

  // 1. Dedicated scoped machine token (stored in Supabase Edge Function secrets)
  const expectedToken = Deno.env.get("KAI_HUB_TOKEN")?.trim();
  if (expectedToken && timingSafeEqual(token, expectedToken)) {
    return { ok: true, actor: "kai-machine-token" };
  }

  // 2. Supabase Auth JWT (owner for writes; any authenticated Hub user for reads)
  if (anonKey) {
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) {
      if (allowAnyAuthenticatedUser || data.user.id === OWNER_USER_ID) {
        return {
          ok: true,
          actor: data.user.id === OWNER_USER_ID ? "owner-jwt" : "authenticated-user",
        };
      }
    }
  }

  return { ok: false, status: 401, error: "Unauthorized" };
}

function parseNonNegativeInt(
  value: unknown,
  fieldName: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: 0 };
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    return { ok: false, error: `${fieldName} must be a non-negative integer` };
  }
  return { ok: true, value: num };
}

function parseOptionalCost(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: "cost_usd must be a non-negative number" };
  }
  return { ok: true, value: num };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET" && req.method !== "POST" && req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed. Use GET, POST, or DELETE." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration unavailable" }, 500);
  }

  const auth = await authenticateRequest(
    req,
    supabaseUrl,
    anonKey,
    req.method === "GET",
  );
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, auth.status);
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const sourceParam = url.searchParams.get("source")?.trim().toLowerCase();
    const limitParam = url.searchParams.get("limit");

    let limit = 200;
    if (limitParam !== null && limitParam !== "") {
      const parsedLimit = Number(limitParam);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return jsonResponse({ error: "limit must be an integer between 1 and 1000" }, 400);
      }
      limit = parsedLimit;
    }

    if (sourceParam && !VALID_SOURCES.has(sourceParam)) {
      return jsonResponse({ error: "source must be 'hermes' or 'antigravity'" }, 400);
    }

    let query = db
      .from("token_usage")
      .select(
        "id, created_at, command, source, model, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, total_tokens, cost_usd, workspace_id",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (sourceParam) {
      query = query.eq("source", sourceParam);
    }

    const { data, error } = await query;
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ data: data ?? [] });
  }

  // DELETE: remove token_usage rows (KAI_HUB_TOKEN or owner JWT only)
  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids")?.trim();
    if (!idsParam) {
      return jsonResponse({ error: "ids query param required (comma-separated UUIDs)" }, 400);
    }
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0 || ids.length > 200) {
      return jsonResponse({ error: "ids must be 1-200 UUIDs" }, 400);
    }
    for (const id of ids) {
      if (!UUID_RE.test(id)) {
        return jsonResponse({ error: `invalid id: ${id}` }, 400);
      }
    }
    const { error, count } = await db.from("token_usage").delete({ count: "exact" }).in("id", ids);
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
    return jsonResponse({ deleted: count ?? 0 });
  }

  // POST: insert a new token_usage record
  const rawBody = await req.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Payload too large" }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return jsonResponse({ error: "Payload must be a JSON object" }, 400);
  }

  const command = typeof payload.command === "string" ? payload.command.trim() : "";
  if (!command || command.length > 500) {
    return jsonResponse({ error: "command must be a non-empty string (<= 500 chars)" }, 400);
  }

  const source = typeof payload.source === "string" ? payload.source.trim().toLowerCase() : "";
  if (!VALID_SOURCES.has(source)) {
    return jsonResponse({ error: "source must be 'hermes' or 'antigravity'" }, 400);
  }

  let model: string | null = null;
  if (payload.model !== undefined && payload.model !== null) {
    if (typeof payload.model !== "string") {
      return jsonResponse({ error: "model must be a string or null" }, 400);
    }
    const trimmedModel = payload.model.trim();
    if (trimmedModel.length > 200) {
      return jsonResponse({ error: "model must be <= 200 chars" }, 400);
    }
    model = trimmedModel || null;
  }

  const inputTokens = parseNonNegativeInt(payload.input_tokens, "input_tokens");
  if (!inputTokens.ok) return jsonResponse({ error: inputTokens.error }, 400);

  const outputTokens = parseNonNegativeInt(payload.output_tokens, "output_tokens");
  if (!outputTokens.ok) return jsonResponse({ error: outputTokens.error }, 400);

  const reasoningTokens = parseNonNegativeInt(payload.reasoning_tokens, "reasoning_tokens");
  if (!reasoningTokens.ok) return jsonResponse({ error: reasoningTokens.error }, 400);

  const cacheReadTokens = parseNonNegativeInt(payload.cache_read_tokens, "cache_read_tokens");
  if (!cacheReadTokens.ok) return jsonResponse({ error: cacheReadTokens.error }, 400);

  let totalTokensValue: number;
  if (payload.total_tokens === undefined || payload.total_tokens === null || payload.total_tokens === "") {
    totalTokensValue = inputTokens.value + outputTokens.value + reasoningTokens.value;
  } else {
    const parsedTotal = parseNonNegativeInt(payload.total_tokens, "total_tokens");
    if (!parsedTotal.ok) return jsonResponse({ error: parsedTotal.error }, 400);
    totalTokensValue = parsedTotal.value;
  }

  const costUsd = parseOptionalCost(payload.cost_usd);
  if (!costUsd.ok) return jsonResponse({ error: costUsd.error }, 400);

  let workspaceId: string | null = null;
  if (payload.workspace_id !== undefined && payload.workspace_id !== null && payload.workspace_id !== "") {
    if (typeof payload.workspace_id !== "string" || !UUID_RE.test(payload.workspace_id)) {
      return jsonResponse({ error: "workspace_id must be a valid UUID" }, 400);
    }
    workspaceId = payload.workspace_id;
  }

  const { data, error } = await db
    .from("token_usage")
    .insert({
      command,
      source,
      model,
      input_tokens: inputTokens.value,
      output_tokens: outputTokens.value,
      reasoning_tokens: reasoningTokens.value,
      cache_read_tokens: cacheReadTokens.value,
      total_tokens: totalTokensValue,
      cost_usd: costUsd.value,
      workspace_id: workspaceId,
    })
    .select(
      "id, created_at, command, source, model, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, total_tokens, cost_usd, workspace_id",
    )
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(data, 201);
});
