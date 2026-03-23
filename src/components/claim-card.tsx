"use client";

import { useState } from "react";
import Image from "next/image";
import type { Claim, ClaimMeta, ClaimStatus } from "../types";

const STATUS_COLORS: Record<ClaimStatus, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "in-progress":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  resolved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const STATUS_LABELS: Record<ClaimStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

interface ClaimCardProps {
  claim: Claim;
  meta: ClaimMeta;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: ClaimStatus) => void;
  onCommentChange: (comment: string) => void;
}

export function ClaimCard({
  claim,
  meta,
  expanded,
  onToggle,
  onStatusChange,
  onCommentChange,
}: ClaimCardProps) {
  const [editingComment, setEditingComment] = useState(false);
  const [commentDraft, setCommentDraft] = useState(meta.comment);
  const [imageError, setImageError] = useState(false);

  const hasImage = claim.imageFilename && !imageError;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header row - always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 sm:items-center"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              #{claim.id}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[meta.status]}`}
            >
              {STATUS_LABELS[meta.status]}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {claim.location}
            </span>
          </div>
          <p className="text-sm truncate">{claim.description}</p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left column: details + actions */}
            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Discovered</p>
                  <p>{claim.dateDiscovered || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Reported to Builder
                  </p>
                  <p>{claim.dateReported || "—"}</p>
                </div>
              </div>

              {/* Full description */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{claim.description}</p>
              </div>

              {/* Status selector */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <div className="flex gap-2">
                  {(["open", "in-progress", "resolved"] as ClaimStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => onStatusChange(s)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          meta.status === s
                            ? STATUS_COLORS[s]
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Notes</p>
                {editingComment ? (
                  <div className="space-y-2">
                    <textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
                      placeholder="Add a note about this claim..."
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onCommentChange(commentDraft);
                          setEditingComment(false);
                        }}
                        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setCommentDraft(meta.comment);
                          setEditingComment(false);
                        }}
                        className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCommentDraft(meta.comment);
                      setEditingComment(true);
                    }}
                    className="w-full text-left rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-accent/50 hover:text-foreground transition-colors"
                  >
                    {meta.comment || "Click to add a note..."}
                  </button>
                )}
              </div>

              {/* Reference doc link */}
              {claim.referenceDocUrl && (
                <a
                  href={claim.referenceDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                  View Reference Document
                </a>
              )}
            </div>

            {/* Right column: image */}
            <div>
              {claim.imageFilename && (
                <div className="rounded-lg overflow-hidden border border-border bg-muted">
                  {hasImage ? (
                    <Image
                      src={`/images/claims/${claim.imageFilename}`}
                      alt={`Claim ${claim.id} photo`}
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      Image not available
                    </div>
                  )}
                </div>
              )}
              {!claim.imageFilename && (
                <div className="rounded-lg border border-dashed border-border flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No image attached
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
