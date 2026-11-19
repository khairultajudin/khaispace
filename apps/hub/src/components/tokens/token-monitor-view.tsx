"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Cpu,
  DollarSign,
  Gauge,
  RefreshCw,
  Sparkles,
  Terminal,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchTokenUsage,
  mapTokenUsageRow,
} from "@/lib/supabase/token-usage-service";
import type { TokenUsageRecord, TokenUsageSource } from "@/types/dashboard";
import type { Database } from "@/types/database.types";

type TokenUsageRow = Database["public"]["Tables"]["token_usage"]["Row"];
type SourceFilter = "all" | TokenUsageSource;

const MAX_RECORDS = 200;
const MAX_CHART_ITEMS = 12;

function formatTokens(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCompactTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return formatTokens(value);
}

function formatCostUsd(cost: number | null): string {
  if (cost === null || !Number.isFinite(cost)) return "—";
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getSourceMeta(source: TokenUsageSource): {
  label: string;
  provider: string;
  badgeClass: string;
  barClass: string;
  dotClass: string;
} {
  if (source === "hermes") {
    return {
      label: "Hermes",
      provider: "DeepSeek",
      badgeClass: "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]",
      barClass: "bg-[#347A63]",
      dotClass: "bg-[#347A63]",
    };
  }
  return {
    label: "Antigravity",
    provider: "Gemini",
    badgeClass: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    barClass: "bg-[#1D4ED8]",
    dotClass: "bg-[#1D4ED8]",
  };
}

export function TokenMonitorView() {
  const [records, setRecords] = useState<TokenUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const rows = await fetchTokenUsage(MAX_RECORDS);
      setRecords(rows);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load token usage data."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const rows = await fetchTokenUsage(MAX_RECORDS);
        if (!active) return;
        setRecords(rows);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load token usage data."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("token-usage-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "token_usage",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const incoming = mapTokenUsageRow(payload.new as TokenUsageRow);
            setRecords((prev) => {
              const filtered = prev.filter((item) => item.id !== incoming.id);
              return [incoming, ...filtered].slice(0, MAX_RECORDS);
            });
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updated = mapTokenUsageRow(payload.new as TokenUsageRow);
            setRecords((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            const deletedId = (payload.old as Partial<TokenUsageRow>).id;
            if (deletedId) {
              setRecords((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("offline");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const totals = useMemo(() => {
    let hermesTokens = 0;
    let hermesCount = 0;
    let hermesCost = 0;
    let antigravityTokens = 0;
    let antigravityCount = 0;
    let antigravityCost = 0;

    for (const row of records) {
      if (row.source === "hermes") {
        hermesTokens += row.total_tokens;
        hermesCount += 1;
        hermesCost += row.cost_usd ?? 0;
      } else {
        antigravityTokens += row.total_tokens;
        antigravityCount += 1;
        antigravityCost += row.cost_usd ?? 0;
      }
    }

    const combinedTokens = hermesTokens + antigravityTokens;
    const totalCostUsd = hermesCost + antigravityCost;
    const hermesShare =
      combinedTokens > 0 ? Math.round((hermesTokens / combinedTokens) * 100) : 0;
    const antigravityShare =
      combinedTokens > 0 ? 100 - hermesShare : 0;

    return {
      hermesTokens,
      hermesCount,
      hermesCost,
      antigravityTokens,
      antigravityCount,
      antigravityCost,
      combinedTokens,
      totalCostUsd,
      hermesShare,
      antigravityShare,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (sourceFilter === "all") return records;
    return records.filter((row) => row.source === sourceFilter);
  }, [records, sourceFilter]);

  const chartItems = useMemo(
    () => filteredRecords.slice(0, MAX_CHART_ITEMS),
    [filteredRecords]
  );

  const maxChartTokens = useMemo(
    () => Math.max(...chartItems.map((item) => item.total_tokens), 1),
    [chartItems]
  );

  return (
    <div className="space-y-8">
      {/* Editorial Header + Cumulative Totals */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <Gauge className="w-4 h-4" />
              <span>AI Telemetry &bull; Real-Time Token Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Token Usage &amp; Cost Monitor
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Live per-command token consumption and USD spend across Hermes
              (DeepSeek) and Antigravity (Gemini) workflows.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono ${
                realtimeStatus === "live"
                  ? "border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]"
                  : realtimeStatus === "connecting"
                    ? "border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]"
                    : "border-[#E8C2BA] bg-[#FBEAE8] text-[#8C3B2B]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === "live"
                    ? "bg-[#347A63] animate-pulse"
                    : realtimeStatus === "connecting"
                      ? "bg-[#536B85]"
                      : "bg-[#8C3B2B]"
                }`}
              />
              <span>
                {realtimeStatus === "live"
                  ? "Realtime Live"
                  : realtimeStatus === "connecting"
                    ? "Connecting..."
                    : "Manual Sync"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* (a) Cumulative Totals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hermes (DeepSeek) */}
          <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#536B85]">
                Hermes (DeepSeek)
              </span>
              <span className="w-7 h-7 rounded bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0C2340]">
              {formatTokens(totals.hermesTokens)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#536B85] font-mono">
              <span>{totals.hermesCount} commands</span>
              <span className="text-[#347A63] font-semibold">
                {formatCostUsd(totals.hermesCost)}
              </span>
            </div>
          </div>

          {/* Antigravity (Gemini) */}
          <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#536B85]">
                Antigravity (Gemini)
              </span>
              <span className="w-7 h-7 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0C2340]">
              {formatTokens(totals.antigravityTokens)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#536B85] font-mono">
              <span>{totals.antigravityCount} commands</span>
              <span className="text-[#1D4ED8] font-semibold">
                {formatCostUsd(totals.antigravityCost)}
              </span>
            </div>
          </div>

          {/* Combined Total */}
          <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#536B85]">
                Combined Total
              </span>
              <span className="w-7 h-7 rounded bg-[#E9E5DC] border border-[#DCD7CC] text-[#0C2340] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0C2340]">
              {formatTokens(totals.combinedTokens)}
            </div>
            <div className="text-[11px] text-[#536B85] font-mono">
              {totals.combinedTokens > 0
                ? `${totals.hermesShare}% Hermes · ${totals.antigravityShare}% Antigravity`
                : `${records.length} logged commands`}
            </div>
          </div>

          {/* Total Cost USD */}
          <div className="p-4 rounded-lg border border-[#DCD7CC] bg-[#FAF8F4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#536B85]">
                Total Cost (USD)
              </span>
              <span className="w-7 h-7 rounded bg-[#EDF5F2] border border-[#A8CFC2] text-[#347A63] flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0C2340]">
              {formatCostUsd(totals.totalCostUsd)}
            </div>
            <div className="text-[11px] text-[#536B85] font-mono">
              Across {records.length} recorded run{records.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF]">
          {(
            [
              { id: "all", label: `All (${records.length})` },
              { id: "hermes", label: `Hermes (${totals.hermesCount})` },
              {
                id: "antigravity",
                label: `Antigravity (${totals.antigravityCount})`,
              },
            ] as const
          ).map((tab) => {
            const active = sourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-[#0C2340] text-white"
                    : "text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#536B85]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#347A63]" />
            Hermes (DeepSeek)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8]" />
            Antigravity (Gemini)
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between gap-3">
          <span>Unable to load token usage: {error}</span>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="underline font-semibold shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-10 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center text-sm text-[#536B85]">
          Loading token usage telemetry...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#DCD7CC] text-[#536B85] flex items-center justify-center mx-auto">
            <Terminal className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#0C2340]">
            No Token Usage Recorded Yet
          </h2>
          <p className="text-xs text-[#536B85] max-w-md mx-auto leading-relaxed">
            {sourceFilter === "all"
              ? "Commands posted to the token-usage edge function will appear here automatically in real time."
              : `No ${sourceFilter} commands have been recorded yet.`}
          </p>
        </div>
      ) : (
        <>
          {/* (c) Simple Bar Chart of Tokens per Command */}
          <section className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#536B85]">
                  <BarChart3 className="w-4 h-4 text-[#347A63]" />
                  <span>Tokens per Command</span>
                </div>
                <p className="text-xs text-[#536B85] mt-1">
                  Showing up to the {MAX_CHART_ITEMS} most recent commands scaled
                  against peak usage ({formatCompactTokens(maxChartTokens)}{" "}
                  tokens).
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#536B85]">
                {chartItems.length} of {filteredRecords.length} shown
              </span>
            </div>

            <div className="space-y-3">
              {chartItems.map((row) => {
                const meta = getSourceMeta(row.source);
                const widthPercent =
                  row.total_tokens > 0
                    ? Math.max(
                        2,
                        Math.min(
                          100,
                          Math.round((row.total_tokens / maxChartTokens) * 100)
                        )
                      )
                    : 0;

                return (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`}
                        />
                        <span
                          className="font-medium text-[#0C2340] truncate"
                          title={row.command}
                        >
                          {row.command}
                        </span>
                        {row.model && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[10px] font-mono text-[#536B85] shrink-0">
                            {row.model}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                        <span className="font-semibold text-[#0C2340]">
                          {formatTokens(row.total_tokens)}
                        </span>
                        <span className="text-[#536B85] w-16 text-right">
                          {formatCostUsd(row.cost_usd)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-[#E9E5DC] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* (b) Per-Command Table */}
          <section className="rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DCD7CC] flex items-center justify-between gap-3 bg-[#FAF8F4]/70">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#536B85]">
                <Terminal className="w-4 h-4 text-[#347A63]" />
                <span>Per-Command Usage Log</span>
              </div>
              <span className="text-[11px] font-mono text-[#536B85]">
                Ordered by latest first
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCD7CC] bg-[#FAF8F4] text-[11px] font-bold uppercase tracking-wider text-[#536B85]">
                    <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                    <th className="py-3 px-4">Command</th>
                    <th className="py-3 px-4 whitespace-nowrap">Source</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">
                      Total Tokens
                    </th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">
                      Cost (USD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DC] text-xs">
                  {filteredRecords.map((row) => {
                    const meta = getSourceMeta(row.source);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#FAF8F4]/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-[#536B85] whitespace-nowrap">
                          {formatTimestamp(row.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#0C2340] break-words">
                            {row.command}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-mono text-[#536B85]">
                            {row.model && <span>{row.model}</span>}
                            <span>in: {formatTokens(row.input_tokens)}</span>
                            <span>out: {formatTokens(row.output_tokens)}</span>
                            {row.reasoning_tokens > 0 && (
                              <span>
                                reasoning: {formatTokens(row.reasoning_tokens)}
                              </span>
                            )}
                            {row.cache_read_tokens > 0 && (
                              <span>
                                cache: {formatTokens(row.cache_read_tokens)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium ${meta.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
                            />
                            {meta.label}
                            <span className="opacity-75 font-mono text-[10px]">
                              ({meta.provider})
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#0C2340] whitespace-nowrap">
                          {formatTokens(row.total_tokens)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#0C2340] whitespace-nowrap">
                          {formatCostUsd(row.cost_usd)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
