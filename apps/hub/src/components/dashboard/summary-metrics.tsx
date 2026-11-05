import React from "react";
import { FolderKanban, Activity, CheckSquare, CreditCard } from "lucide-react";
import { SAMPLE_SUMMARY_METRICS } from "../../data/sample-dashboard-data";

const ICONS = [FolderKanban, Activity, CheckSquare, CreditCard];

export function SummaryMetrics() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#536B85]">
          Executive Summary
        </h2>
        <span className="text-[11px] text-[#536B85] font-mono">
          Illustrative Sample Values
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SAMPLE_SUMMARY_METRICS.map((metric, idx) => {
          const Icon = ICONS[idx % ICONS.length];

          return (
            <div
              key={metric.id}
              className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between hover:border-[#347A63] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-md bg-[#FAF8F4] border border-[#DCD7CC] flex items-center justify-center text-[#347A63]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      metric.badgeText === "Cataloged"
                        ? "bg-[#FAF8F4] text-[#0C2340] border-[#DCD7CC]"
                        : metric.badgeText === "In Progress"
                        ? "bg-[#EDF5F2] text-[#347A63] border-[#A8CFC2]"
                        : "bg-[#FAF8F4] text-[#536B85] border-[#DCD7CC]"
                    }`}
                  >
                    {metric.badgeText}
                  </span>
                </div>

                <div className="text-2xl font-bold tracking-tight text-[#0C2340]">
                  {metric.value}
                </div>
                <div className="text-xs font-medium text-[#0C2340] mt-0.5">
                  {metric.label}
                </div>
                <div className="text-[11px] text-[#536B85] mt-1">
                  {metric.sublabel}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9E5DC] text-[10px] text-[#536B85] leading-normal">
                {metric.note}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
