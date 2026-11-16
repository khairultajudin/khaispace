"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { fetchRecentActivity } from "@/lib/supabase/workspace-service";
import type { ActivityEntry } from "../../types/dashboard";

export function RecentActivity() {
  const { activeWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    fetchRecentActivity(activeWorkspace.id, 6)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  return (
    <div className="p-6 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#347A63]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0C2340]">
              Recent Activity Feed
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#536B85]">
            Audit Log
          </span>
        </div>
        <p className="text-xs text-[#536B85] mb-4">
          Verified workspace actions recorded in <code className="font-mono">public.activity_logs</code>.
        </p>

        {isLoading ? (
          <p className="text-xs text-[#536B85]">Loading activity...</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-[#536B85] py-4">
            No workspace activity logged yet. Actions across Projects, Tasks, Finance, and Settings will appear here.
          </p>
        ) : (
          <div className="space-y-3.5">
            {entries.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 text-xs ${
                  idx !== entries.length - 1 ? "pb-3.5 border-b border-[#E9E5DC]" : ""
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-[#347A63] mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="text-[#0C2340] font-medium leading-snug">
                    {item.action}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#536B85] font-mono">
                    <span className="font-semibold text-[#0C2340]">{item.project}</span>
                    <span>&bull;</span>
                    <span>{item.date}</span>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F4] text-[#536B85] border border-[#DCD7CC] shrink-0">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E9E5DC] text-[10px] text-[#536B85] italic">
        * Append-only audit entries generated via trusted SECURITY DEFINER logging.
      </div>
    </div>
  );
}
