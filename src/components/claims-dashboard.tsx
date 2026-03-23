"use client";

import { useState, useMemo } from "react";
import type { Claim, ClaimStatus } from "../types";
import { useClaimMeta } from "../hooks/use-claim-meta";
import { ClaimCard } from "./claim-card";

const STATUS_OPTIONS: { value: ClaimStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const LOCATIONS = (claims: Claim[]) => {
  const set = new Set(claims.map((c) => c.location));
  return ["All Locations", ...Array.from(set).sort()];
};

export function ClaimsDashboard({ claims }: { claims: Claim[] }) {
  const { getMeta, setStatus, setComment, loaded } = useClaimMeta();
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const locations = useMemo(() => LOCATIONS(claims), [claims]);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const meta = getMeta(c.id);
      if (statusFilter !== "all" && meta.status !== statusFilter) return false;
      if (locationFilter !== "All Locations" && c.location !== locationFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          c.description.toLowerCase().includes(q) ||
          c.id.includes(q) ||
          c.location.toLowerCase().includes(q) ||
          meta.comment.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [claims, statusFilter, locationFilter, search, getMeta]);

  const stats = useMemo(() => {
    let open = 0,
      inProgress = 0,
      resolved = 0;
    for (const c of claims) {
      const s = getMeta(c.id).status;
      if (s === "open") open++;
      else if (s === "in-progress") inProgress++;
      else resolved++;
    }
    return { open, inProgress, resolved, total: claims.length };
  }, [claims, getMeta]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} color="text-foreground" />
        <StatCard label="Open" value={stats.open} color="text-accent" />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          color="text-warning"
        />
        <StatCard label="Resolved" value={stats.resolved} color="text-success" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
          <span>Overall Progress</span>
          <span>
            {stats.resolved} of {stats.total} resolved (
            {stats.total > 0
              ? Math.round((stats.resolved / stats.total) * 100)
              : 0}
            %)
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="flex h-full">
            <div
              className="bg-success transition-all duration-500"
              style={{
                width: `${(stats.resolved / stats.total) * 100}%`,
              }}
            />
            <div
              className="bg-warning transition-all duration-500"
              style={{
                width: `${(stats.inProgress / stats.total) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search claims..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`h-8 rounded-full px-3 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        Showing {filtered.length} of {claims.length} claims
      </p>

      {/* Claims list */}
      <div className="space-y-3">
        {filtered.map((claim) => (
          <ClaimCard
            key={claim.id}
            claim={claim}
            meta={getMeta(claim.id)}
            expanded={expandedId === claim.id}
            onToggle={() =>
              setExpandedId(expandedId === claim.id ? null : claim.id)
            }
            onStatusChange={(s) => setStatus(claim.id, s)}
            onCommentChange={(c) => setComment(claim.id, c)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
            No claims match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
