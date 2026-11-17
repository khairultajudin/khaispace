"use client";

import React from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Info,
} from "lucide-react";
import { WorkspaceMember } from "../../types/dashboard";
import { calculateMemberMetrics } from "../../utils/members-utils";

interface MembersMetricsProps {
  members: WorkspaceMember[];
}

export function MembersMetrics({ members }: MembersMetricsProps) {
  const metrics = calculateMemberMetrics(members);

  return (
    <div className="space-y-4">
      {/* 4-Card Summary Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Members */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Total Roster</span>
              <Users className="w-4 h-4 text-[#0C2340]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#0C2340] font-mono">
              {metrics.totalMembers}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Collaborators, owners &amp; advisors
          </span>
        </div>

        {/* 2. Active Members */}
        <div className="p-5 rounded-lg border border-[#A8CFC2] bg-[#EDF5F2]/40 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#347A63]">
              <span className="font-medium">Active Collaborators</span>
              <UserCheck className="w-4 h-4 text-[#347A63]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#347A63] font-mono">
              {metrics.activeMembers}
            </div>
          </div>
          <span className="text-[11px] text-[#347A63]/80 pt-2 border-t border-[#A8CFC2]/60 mt-2 block font-medium">
            Active workspace access credentials
          </span>
        </div>

        {/* 3. Pending Invitations */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#8C6D2B]">
              <span className="font-medium">Pending Invitations</span>
              <UserPlus className="w-4 h-4 text-[#8C6D2B]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#8C6D2B] font-mono">
              {metrics.pendingInvitations}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Awaiting member onboarding acceptance
          </span>
        </div>

        {/* 4. Suspended Accounts */}
        <div className="p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-[#536B85]">
              <span className="font-medium">Suspended Access</span>
              <UserX className="w-4 h-4 text-[#8C3B2B]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#8C3B2B] font-mono">
              {metrics.suspendedMembers}
            </div>
          </div>
          <span className="text-[11px] text-[#536B85] pt-2 border-t border-[#E9E5DC] mt-2 block">
            Former contractors or paused accounts
          </span>
        </div>
      </div>

      {/* Illustrative Simulation Disclaimer */}
      <div className="px-4 py-3 rounded-lg border border-[#DCD7CC] bg-[#E9E5DC]/50 flex items-start gap-2.5 text-xs text-[#536B85]">
        <Info className="w-4 h-4 text-[#347A63] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#0C2340] font-semibold">Demonstration Mode:</strong>{" "}
          Member management, role assignments, and invitations are simulated in React session state for command center UI evaluation.
          No actual outbound emails or external user authentication services are connected.
        </div>
      </div>
    </div>
  );
}
