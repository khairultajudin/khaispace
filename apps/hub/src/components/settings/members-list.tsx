"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Mail,
  Shield,
  UserCheck,
  UserX,
  ArrowUpDown,
  AlertCircle,
  Clock,
} from "lucide-react";
import { WorkspaceMember } from "../../types/dashboard";
import {
  getMemberInitials,
  getRoleBadgeStyle,
  getStatusBadgeStyle,
} from "../../utils/members-utils";

interface MembersListProps {
  members: WorkspaceMember[];
  onSelect: (member: WorkspaceMember) => void;
  onEdit: (member: WorkspaceMember) => void;
  onDelete: (member: WorkspaceMember) => void;
  onToggleStatus: (member: WorkspaceMember) => void;
  onAddNew: () => void;
}

export function MembersList({
  members,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddNew,
}: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("joined-desc");

  // Filter & sort members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchEmail = m.email.toLowerCase().includes(q);
          const matchBio = m.bio?.toLowerCase().includes(q) ?? false;
          if (!matchName && !matchEmail && !matchBio) {
            return false;
          }
        }

        // Role filter
        if (selectedRole !== "all" && m.role !== selectedRole) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "all" && m.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "joined-desc") {
          return b.joinedAtIso.localeCompare(a.joinedAtIso);
        }
        if (sortBy === "joined-asc") {
          return a.joinedAtIso.localeCompare(b.joinedAtIso);
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "name-desc") {
          return b.name.localeCompare(a.name);
        }
        return 0;
      });
  }, [members, searchTerm, selectedRole, selectedStatus, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedRole !== "all" ||
    selectedStatus !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSortBy("joined-desc");
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Actions Toolbar */}
      <div className="p-4 sm:p-5 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#536B85] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name, email, or biography..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] placeholder-[#536B85] focus:outline-none focus:border-[#347A63] focus:bg-white transition-colors"
            />
          </div>

          {/* Invite Member Button */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Administrator">Administrator</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending Invite</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#536B85] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-[#0C2340] focus:outline-none focus:border-[#347A63] cursor-pointer font-medium"
            >
              <option value="joined-desc">Recently Joined / Invited</option>
              <option value="joined-asc">Earliest Joined</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#E9E5DC] flex items-center justify-between text-xs text-[#536B85]">
            <span>
              Showing <strong>{filteredMembers.length}</strong> of {members.length} members
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[#347A63] hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="p-10 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#536B85] mx-auto opacity-60" />
          <h3 className="font-semibold text-sm text-[#0C2340]">No Members Match Your Criteria</h3>
          <p className="text-xs text-[#536B85] max-w-sm mx-auto">
            Try adjusting your search terms or clearing active role and status filters to view all workspace collaborators.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-1.5 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Members Cards Grid */}
      {filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member) => {
            const roleBadge = getRoleBadgeStyle(member.role);
            const statusBadge = getStatusBadgeStyle(member.status);
            const initials = getMemberInitials(member.name);
            const isOwner = member.role === "Owner";

            return (
              <article
                key={member.id}
                className={`rounded-lg border bg-[#FFFFFF] shadow-xs p-5 space-y-4 hover:border-[#347A63] transition-all group flex flex-col justify-between ${
                  member.status === "Suspended"
                    ? "border-[#E8C2BA] opacity-80"
                    : "border-[#DCD7CC]"
                }`}
              >
                <div className="space-y-3">
                  {/* Header: Avatar, Name, Email & Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Initials Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#0C2340] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 border border-[#DCD7CC]">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold leading-snug truncate">
                          <button
                            type="button"
                            onClick={() => onSelect(member)}
                            className="text-left text-[#0C2340] group-hover:text-[#347A63] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] rounded-xs cursor-pointer transition-colors"
                          >
                            {member.name}
                          </button>
                        </h3>
                        <p className="text-xs text-[#536B85] flex items-center gap-1 truncate font-mono">
                          <Mail className="w-3 h-3 shrink-0 text-[#347A63]" />
                          <span>{member.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${roleBadge.cls}`}
                      >
                        {member.role}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border ${statusBadge.cls}`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>

                  {/* Biography / Description */}
                  {member.bio ? (
                    <p className="text-xs text-[#536B85] line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-[#536B85] italic">
                      No biography provided.
                    </p>
                  )}

                  {/* Personal Invitation Message if Pending */}
                  {member.status === "Pending" && member.personalMessage && (
                    <div className="p-2.5 rounded bg-[#FAF8F4] border border-[#DCD7CC] text-[11px] text-[#8C6D2B] flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="italic line-clamp-1">
                        &ldquo;{member.personalMessage}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer with Date & Actions */}
                <div className="space-y-3 pt-3 border-t border-[#E9E5DC]">
                  <div className="flex items-center justify-between text-[11px] text-[#536B85]">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#347A63]" />
                      {member.status === "Pending" ? "Invited: " : "Joined: "}
                      {member.joinedAt}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* View Action */}
                      <button
                        type="button"
                        onClick={() => onSelect(member)}
                        className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer"
                        title={`View details for ${member.name}`}
                        aria-label={`View details for ${member.name}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Action */}
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        className="p-1 rounded text-[#536B85] hover:text-[#0C2340] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63] cursor-pointer"
                        title={`Edit profile for ${member.name}`}
                        aria-label={`Edit profile for ${member.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Suspend / Reactivate Action (Disabled for Owner) */}
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(member)}
                          className={`p-1 rounded hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
                            member.status === "Suspended"
                              ? "text-[#347A63] hover:text-[#235847] focus-visible:ring-[#347A63]"
                              : "text-[#8C6D2B] hover:text-[#6E5522] focus-visible:ring-[#8C6D2B]"
                          }`}
                          title={
                            member.status === "Suspended"
                              ? `Reactivate ${member.name}`
                              : `Suspend ${member.name}`
                          }
                          aria-label={
                            member.status === "Suspended"
                              ? `Reactivate ${member.name}`
                              : `Suspend ${member.name}`
                          }
                        >
                          {member.status === "Suspended" ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Remove Action (Disabled for Owner) */}
                      {!isOwner ? (
                        <button
                          type="button"
                          onClick={() => onDelete(member)}
                          className="p-1 rounded text-[#536B85] hover:text-[#8C3B2B] hover:bg-[#FAF8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C3B2B] cursor-pointer"
                          title={`Remove ${member.name} from workspace`}
                          aria-label={`Remove ${member.name} from workspace`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span
                          className="text-[10px] font-mono text-[#536B85] px-1 py-0.5 bg-[#FAF8F4] rounded border border-[#DCD7CC]"
                          title="Workspace Owner cannot be removed or suspended"
                        >
                          Protected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
