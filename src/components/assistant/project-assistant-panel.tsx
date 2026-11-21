"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Info,
  Send,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getProjectAssistantProvider } from "@/lib/ai-assistant/client";
import { LOCAL_TRANSPARENCY_NOTE } from "@/lib/ai-assistant/local-guide";
import type { AssistantMessage } from "@/lib/ai-assistant/types";

const STARTER_PROMPTS = [
  "I want a web dashboard to replace Excel fee tracking",
  "How can AI automate our incoming customer inquiries?",
  "Can Khai Space help prototype an ESP32 sensor + dashboard?",
  "I need a modern website with WhatsApp lead capture",
] as const;

let messageSequence = 0;

function createMessageId(prefix: "user" | "assistant"): string {
  messageSequence += 1;
  return `${prefix}-${messageSequence}`;
}

function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

export function ProjectAssistantPanel({
  pageContext = "/lab",
}: {
  pageContext?: string;
}) {
  const provider = useMemo(() => getProjectAssistantProvider(), []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transparencyNote, setTransparencyNote] = useState<string>(
    LOCAL_TRANSPARENCY_NOTE,
  );
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      mode: provider.mode,
      timestampIso: "2026-11-21T00:00:00.000Z",
      content:
        "Tell me briefly what you are hoping to build or solve. I will match it to Khai Space's relevant service track, real studio work, and the fastest next step.",
    },
  ]);

  async function submitPrompt(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    const userMsg: AssistantMessage = {
      id: createMessageId("user"),
      role: "user",
      mode: provider.mode,
      timestampIso: getCurrentIsoTimestamp(),
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await provider.advise({
        prompt: trimmed,
        history: nextHistory.map(({ role, content }) => ({ role, content })),
        pageContext,
      });

      setTransparencyNote(response.transparencyNote);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          mode: response.mode,
          timestampIso: getCurrentIsoTimestamp(),
          content: response.reply,
          recommendations: response.recommendations,
          suggestedServiceSlug: response.suggestedServiceSlug,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPrompt(input);
  }

  return (
    <section
      id="studio-advisor"
      aria-labelledby="studio-advisor-title"
      className="studio-card scroll-mt-24 overflow-hidden rounded-3xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted/60 px-6 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-soft text-violet">
            <Bot className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2
              id="studio-advisor-title"
              className="text-lg font-bold text-navy sm:text-xl"
            >
              Khai Space Project Advisor
            </h2>
            <p className="text-xs text-muted">
              Extensible assistant interface · Active provider:{" "}
              <strong className="text-navy">{provider.providerLabel}</strong>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/25 bg-violet-soft px-3 py-1 text-xs font-semibold text-violet">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {provider.mode === "remote-backend"
            ? "Connected AI Proxy"
            : "Guided Local Mode"}
        </span>
      </div>

      {/* Transparency Notice */}
      <div className="flex items-start gap-2.5 border-b border-border bg-primary-soft/45 px-6 py-3.5 text-xs leading-relaxed text-muted sm:px-7">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-electric" aria-hidden />
        <p>{transparencyNote}</p>
      </div>

      {/* Starter Chips */}
      <div className="border-b border-border px-6 py-4 sm:px-7">
        <p className="text-xs font-semibold text-muted">Try a quick prompt:</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void submitPrompt(prompt)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-electric hover:bg-primary-soft hover:text-electric"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Feed */}
      <div
        aria-live="polite"
        className="max-h-[420px] space-y-4 overflow-y-auto p-6 sm:p-7"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={
                msg.role === "user"
                  ? "max-w-xl rounded-2xl rounded-br-sm bg-navy px-4 py-3 text-sm text-white"
                  : "w-full max-w-2xl rounded-2xl rounded-bl-sm border border-border bg-background p-4 text-sm text-navy"
              }
            >
              <p className="leading-relaxed">
                {msg.content.replaceAll("**", "")}
              </p>

              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {msg.recommendations.map((rec) => (
                    <Link
                      key={`${msg.id}-${rec.href}-${rec.title}`}
                      href={rec.href}
                      className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-electric"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-navy group-hover:text-electric">
                            {rec.title}
                          </span>
                          <ArrowUpRight
                            className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-electric"
                            aria-hidden
                          />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {rec.description}
                        </p>
                      </div>
                      {rec.badge && (
                        <span className="mt-2 inline-block self-start rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-electric">
                          {rec.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col gap-2.5 border-t border-border bg-surface p-4 sm:flex-row sm:px-7"
      >
        <label htmlFor="studio-advisor-input" className="sr-only">
          Describe your project idea for studio guidance
        </label>
        <input
          id="studio-advisor-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe your idea, workflow problem, or goal..."
          className="h-11 flex-1 rounded-xl border border-border-strong bg-background px-4 text-sm text-navy placeholder:text-muted focus:border-electric focus:bg-surface focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-electric px-5 text-sm font-semibold text-white transition-colors hover:bg-electric-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
          <span>{loading ? "Matching..." : "Get Guidance"}</span>
        </button>
      </form>
    </section>
  );
}
