import React from "react";
import { Info, Calendar } from "lucide-react";

export function WelcomeBanner() {
  const currentDate = "Thursday, November 5, 2026";

  return (
    <div className="space-y-4">
      {/* Editorial Welcome Card */}
      <div className="p-6 sm:p-7 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#536B85] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#347A63]" />
              <span>{currentDate}</span>
              <span className="text-[#DCD7CC]">&bull;</span>
              <span>Khai Space Central</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Welcome to Khai Space Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Personal business and project command center for monitoring development pipelines,
              organizing documentation, and directing operational initiatives across Khai Space.
            </p>
          </div>

          <div className="shrink-0 flex md:flex-col items-start md:items-end gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340]">
              Workspace: <strong className="font-semibold">apps/hub/</strong>
            </span>
            <span className="px-3 py-1 rounded border border-[#A8CFC2] bg-[#EDF5F2] text-[#347A63]">
              Monorepo: <strong className="font-semibold">Isolated Build</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Explicit Disclosure Banner for Sample Data */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Dashboard Foundation:</strong> Metrics, tasks,
          and activities presented on this overview use clearly labelled sample data for interface modeling.
          No live banking or automated issue tracking integrations are active in this phase.
        </div>
      </div>
    </div>
  );
}
