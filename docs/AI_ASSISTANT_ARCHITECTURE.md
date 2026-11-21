# Khai Space 2.0 — AI Project Assistant Architecture (Phase 4)

**Status:** Extensible Architecture Implemented (`LocalGuidedAssistantProvider` active; live LLM backend intentionally **DEFERRED**)  
**Scope:** Public website `https://khaispace.com` (`E:\KhaiSpace`, static export on Cloudflare Pages)

---

## 1. Why Live LLM Inference Is Intentionally Deferred

The public Khai Space website builds as a static export (`output: "export"`) deployed to Cloudflare Pages with **no public server-side AI proxy currently provisioned**:

1. **Zero secrets in client bundles:** Calling any LLM provider directly from browser JavaScript would expose API keys and violate strict security governance.
2. **No non-functional fake chatbot:** Shipping a mocked "AI" box that pretends to run live inference misleads visitors.
3. **Abuse & cost protection required first:** Any public AI endpoint needs rate limiting, bot verification (e.g., Cloudflare Turnstile), payload validation, and spend caps before going live.

---

## 2. What Is Implemented Today (Ready for Drop-In Upgrade)

All frontend code talks strictly to an extensible TypeScript provider interface rather than hardcoding vendor SDKs:

| File | Responsibility |
| :--- | :--- |
| `src/lib/ai-assistant/types.ts` | Strongly typed `ProjectAssistantProvider`, `AssistantRequest`, `AssistantResponse`, `AssistantRecommendation`, and `AssistantProviderMode` (`"local-guided" \| "remote-backend"`). |
| `src/lib/ai-assistant/local-guide.ts` | `LocalGuidedAssistantProvider` — honest, deterministic local studio advisor matching visitor project descriptions against Khai Space's 6 verified services, 8 public projects, and Interactive Lab modules. Explicitly discloses `Guided Local Mode`. |
| `src/lib/ai-assistant/client.ts` | `getProjectAssistantProvider()` factory + `RemoteBackendAssistantProvider` adapter (`POST <endpoint>/v1/assistant/advise`) with automatic graceful fallback to local guided mode if the remote proxy is unreachable. |
| `src/components/assistant/project-assistant-panel.tsx` | Accessible UI component rendered on `/lab` and `/start-a-project`, showing live provider mode badge, quick starter prompts, structured recommendation cards, and clear handoff to the Brief Builder / WhatsApp. |

---

## 3. Target Production Backend Architecture (When Approved)

When Khai Space approves a live AI backend, zero frontend redesign is needed:

```text
Browser (khaispace.com static bundle)
  │  POST https://assistant.khaispace.com/v1/assistant/advise
  │  + Turnstile token (optional / recommended)
  ▼
Cloudflare Worker (khaispace-assistant-proxy)
  ├─ 1. Origin allowlist (https://khaispace.com only)
  ├─ 2. Cloudflare Turnstile verification + IP rate limit (e.g. 15 req / 10 min)
  ├─ 3. Input validation (max prompt length, max history turns, strict schema)
  ├─ 4. Server-side LLM call using Wrangler secret (never exposed to browser)
  │     • System prompt grounded ONLY in Khai Space public catalog JSON
  │     • Strict JSON schema output matching AssistantResponse
  │     • Guardrail: never invent prices, client names, or private Hub data
  └─ 5. Return validated AssistantResponse JSON
```

### Required HTTP Contract (`POST /v1/assistant/advise`)

**Request JSON (`AssistantRequest`):**
```json
{
  "prompt": "I need a tuition fee dashboard with WhatsApp reminders",
  "history": [
    { "role": "user", "content": "..." }
  ],
  "pageContext": "/start-a-project"
}
```

**Response JSON (`AssistantResponse`):**
```json
{
  "reply": "A Web Applications build is the closest fit...",
  "mode": "remote-backend",
  "suggestedServiceSlug": "web-applications",
  "recommendations": [
    {
      "kind": "service",
      "title": "Web Applications",
      "description": "...",
      "href": "/services#web-applications",
      "badge": "Matching Service"
    }
  ],
  "transparencyNote": "Served via approved server-side AI proxy."
}
```

### Zero-Rewrite Activation Steps
1. Deploy the isolated Cloudflare Worker proxy with `wrangler secret put <PROVIDER_API_KEY>` and rate limiting / Turnstile enabled.
2. Set `NEXT_PUBLIC_ASSISTANT_API_URL=https://assistant.khaispace.com` in the public Cloudflare Pages build environment variables (note: public URL only — **never** an API key).
3. Rebuild and deploy `khaispace.com`. `getProjectAssistantProvider()` automatically switches from `LocalGuidedAssistantProvider` to `RemoteBackendAssistantProvider` while retaining local fallback resilience.
