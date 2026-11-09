"use client";

import React from "react";
import {
  FileText,
  Scale,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { WorkspaceNoteItem } from "../../types/dashboard";
import { calculateNoteMetrics } from "../../utils/notes-utils";

interface NotesMetricsProps {
  records: WorkspaceNoteItem[];
}

export function NotesMetrics({ records }: NotesMetricsProps) {
  const metrics = calculateNoteMetrics(records);

  return (
    <div className="space-y-4">
      {/* 4-Card Summary Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Notes */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Total Notes</span>
              <FileText className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {metrics.totalNotes}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Workspace references &amp; technical guides
          </span>
        </div>

        {/* 2. Total Decisions */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Total Decisions</span>
              <Scale className="w-4 h-4 text-[#0C2340]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {metrics.totalDecisions}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Architectural, financial &amp; design records
          </span>
        </div>

        {/* 3. Approved Decisions */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#347A63]">
              <span className="font-medium">Approved Decisions</span>
              <CheckCircle2 className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#347A63] font-mono">
              {metrics.approvedDecisions}
            </div>
          </div>
          <span className="text-[11px] text-[#347A63]/80 pt-2 border-t border-[#A8CFC2]/60 mt-2 block font-medium">
            Active guidelines &amp; standards
          </span>
        </div>

        {/* 4. Proposed Decisions */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Proposed / Under Review</span>
              <Clock className="w-4 h-4 text-[#8C6D2B]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#8C6D2B] font-mono">
              {metrics.proposedDecisions}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Pending evaluation &amp; consensus
          </span>
        </div>
      </div>

      {/* Illustrative Disclaimer */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Illustrative Records Disclaimer:</strong>{" "}
          All notes and decision records presented are fictional/illustrative examples for command center architectural modeling.
          They do not represent binding real-world decisions made by Khai.
        </div>
      </div>
    </div>
  );
}
