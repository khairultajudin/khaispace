import { WorkspaceNoteItem, NoteMetricsSummary } from "../types/dashboard";

/**
 * Derives dynamic metrics from the notes and decisions dataset.
 */
export function calculateNoteMetrics(records: WorkspaceNoteItem[]): NoteMetricsSummary {
  let totalNotes = 0;
  let totalDecisions = 0;
  let approvedDecisions = 0;
  let proposedDecisions = 0;
  let rejectedDecisions = 0;
  let supersededDecisions = 0;

  for (const r of records) {
    if (r.type === "Note") {
      totalNotes += 1;
    } else if (r.type === "Decision") {
      totalDecisions += 1;
      if (r.status === "Approved") {
        approvedDecisions += 1;
      } else if (r.status === "Proposed") {
        proposedDecisions += 1;
      } else if (r.status === "Rejected") {
        rejectedDecisions += 1;
      } else if (r.status === "Superseded") {
        supersededDecisions += 1;
      }
    }
  }

  return {
    totalNotes,
    totalDecisions,
    approvedDecisions,
    proposedDecisions,
    rejectedDecisions,
    supersededDecisions,
  };
}
