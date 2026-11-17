"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Scale,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { WorkspaceNoteItem, NoteRecordType } from "../../types/dashboard";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import {
  createNoteOrDecision,
  deleteNoteOrDecision,
  fetchNotesAndDecisions,
  updateNoteOrDecision,
} from "@/lib/supabase/notes-service";
import { NotesMetrics } from "./notes-metrics";
import { NotesList } from "./notes-list";
import { DecisionsList } from "./decisions-list";
import { NoteDetail } from "./note-detail";
import { NoteForm } from "./note-form";

type NotesTab = "notes" | "decisions";

export function NotesView() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [records, setRecords] = useState<WorkspaceNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotesTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        hash === "decisions" ||
        hash.startsWith("decision-") ||
        hash.startsWith("dec-")
      ) {
        return "decisions";
      }
    }
    return "notes";
  });

  const loadRecords = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const rows = await fetchNotesAndDecisions(activeWorkspace.id);
      setRecords(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes and decisions.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRecords();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  // Form modal state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: "add" | "edit";
    initialType: NoteRecordType;
    data?: WorkspaceNoteItem;
  }>({
    isOpen: false,
    mode: "add",
    initialType: "Note",
  });

  // Selected record for detail modal / deep linking
  const [selectedRecord, setSelectedRecord] = useState<WorkspaceNoteItem | null>(null);

  // Delete confirmation modal state
  const [deleteCandidate, setDeleteCandidate] = useState<WorkspaceNoteItem | null>(null);

  // Synchronize URL hash with active tabs and deep links
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");

      if (hash === "notes") {
        setActiveTab("notes");
        setSelectedRecord(null);
      } else if (hash === "decisions") {
        setActiveTab("decisions");
        setSelectedRecord(null);
      } else if (hash.startsWith("note-")) {
        setActiveTab("notes");
        const id = hash.replace("note-", "");
        const matched = records.find((r) => r.id === hash || r.id === id);
        setSelectedRecord(matched || null);
      } else if (hash.startsWith("decision-") || hash.startsWith("dec-")) {
        setActiveTab("decisions");
        const id = hash.startsWith("decision-")
          ? hash.replace("decision-", "")
          : hash;
        const matched = records.find((r) => r.id === id || r.id === hash);
        setSelectedRecord(matched || null);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);
    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, [records]);

  const setTabAndHash = (tab: NotesTab) => {
    setActiveTab(tab);
    setSelectedRecord(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${tab}`);
    }
  };

  const openDetail = useCallback((record: WorkspaceNoteItem) => {
    setSelectedRecord(record);
    if (typeof window !== "undefined") {
      const hash = record.type === "Decision" ? `#decision-${record.id}` : `#note-${record.id}`;
      window.history.pushState(null, "", hash);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedRecord(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  const handleAddNewNote = () => {
    setFormModal({
      isOpen: true,
      mode: "add",
      initialType: "Note",
    });
  };

  const handleAddNewDecision = () => {
    setFormModal({
      isOpen: true,
      mode: "add",
      initialType: "Decision",
    });
  };

  const handleEdit = (record: WorkspaceNoteItem) => {
    setFormModal({
      isOpen: true,
      mode: "edit",
      initialType: record.type,
      data: record,
    });
  };

  const handleSave = async (savedRecord: WorkspaceNoteItem) => {
    if (!activeWorkspace || !user?.id) return;
    try {
      if (formModal.mode === "add") {
        await createNoteOrDecision(activeWorkspace.id, user.id, savedRecord);
      } else {
        const updated = await updateNoteOrDecision(activeWorkspace.id, savedRecord.id, savedRecord);
        if (selectedRecord?.id === savedRecord.id) {
          setSelectedRecord(updated);
        }
      }
      setFormModal({ isOpen: false, mode: "add", initialType: "Note" });
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record.");
    }
  };

  const handleDeletePrompt = (record: WorkspaceNoteItem) => {
    setDeleteCandidate(record);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate || !activeWorkspace) return;
    try {
      await deleteNoteOrDecision(activeWorkspace.id, deleteCandidate.id, deleteCandidate.title);
      if (selectedRecord?.id === deleteCandidate.id) {
        closeDetail();
      }
      setDeleteCandidate(null);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record.");
    }
  };

  const notesCount = records.filter((r) => r.type === "Note").length;
  const decisionsCount = records.filter((r) => r.type === "Decision").length;

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="p-6 sm:p-8 rounded-lg border border-[#DCD7CC] bg-[#FFFFFF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347A63]">
              <FileText className="w-4 h-4" />
              <span>Knowledge Base &bull; Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0C2340]">
              Notes &amp; Decisions
            </h1>
            <p className="text-xs sm:text-sm text-[#536B85] max-w-2xl leading-relaxed">
              Centralized workspace repository for project technical notes, working references, and formally documented architectural decisions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-mono text-[#536B85]">
              {isLoading ? "Syncing..." : `${records.length} entries`}
            </span>

            <button
              type="button"
              onClick={activeTab === "notes" ? handleAddNewNote : handleAddNewDecision}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#347A63]"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === "notes" ? "Create Note" : "Record Decision"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <NotesMetrics records={records} />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#DCD7CC] gap-2 overflow-x-auto pb-px">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTabAndHash("notes")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "notes"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Workspace Notes ({notesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAndHash("decisions")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "decisions"
                ? "border-[#347A63] text-[#347A63]"
                : "border-transparent text-[#536B85] hover:text-[#0C2340]"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Decision Register ({decisionsCount})</span>
          </button>
        </div>

      </div>
      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadRecords()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "notes" && (
        <NotesList
          records={records}
          onSelect={openDetail}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAddNew={handleAddNewNote}
        />
      )}

      {activeTab === "decisions" && (
        <DecisionsList
          records={records}
          onSelect={openDetail}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onAddNew={handleAddNewDecision}
        />
      )}

      {/* Detail Modal (Deep-linkable via #note-* or #decision-*) */}
      <NoteDetail
        record={selectedRecord}
        isOpen={selectedRecord !== null}
        onClose={closeDetail}
        onEdit={(rec) => {
          closeDetail();
          handleEdit(rec);
        }}
        onDelete={(rec) => {
          closeDetail();
          handleDeletePrompt(rec);
        }}
      />

      {/* Add / Edit Form Modal (Keyed for fresh mount without cascading re-renders) */}
      {formModal.isOpen && (
        <NoteForm
          key={`${formModal.mode}-${formModal.initialType}-${formModal.data?.id || "new"}`}
          isOpen={formModal.isOpen}
          mode={formModal.mode}
          initialType={formModal.initialType}
          initialData={formModal.data}
          onSave={handleSave}
          onClose={() =>
            setFormModal({ isOpen: false, mode: "add", initialType: "Note" })
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 bg-[#0C2340]/40 backdrop-blur-2xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-lg border border-[#DCD7CC] shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8C3B2B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-[#0C2340]">
                Delete {deleteCandidate.type}?
              </h3>
            </div>
            <p className="text-xs text-[#536B85] leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-[#0C2340]">&ldquo;{deleteCandidate.title}&rdquo;</strong>{" "}
              from this session? All metrics will update immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 rounded-md border border-[#DCD7CC] bg-[#FAF8F4] text-xs font-medium text-[#536B85] hover:text-[#0C2340] hover:bg-[#E9E5DC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-[#8C3B2B] hover:bg-[#8C3B2B]/90 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
