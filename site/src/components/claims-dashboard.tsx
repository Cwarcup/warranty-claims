"use client";

import { useState, useMemo } from "react";
import type { Claim, ClaimStatus, TravelersStatus } from "../types";
import { useClaimMeta } from "../hooks/use-claim-meta";
import { useAdmin } from "../hooks/use-admin";
import { ClaimCard } from "./claim-card";
import { LoginButton } from "./login-button";

const STATUS_OPTIONS: { value: ClaimStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

type TravelersFilter = "all" | "investigating" | "denied" | "disputed" | "new";

const TRAVELERS_OPTIONS: { value: TravelersFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "investigating", label: "Investigating" },
  { value: "denied", label: "Denied" },
  { value: "disputed", label: "Disputed" },
  { value: "new", label: "New" },
];

const LOCATIONS = (claims: Claim[]) => {
  const set = new Set(claims.map((c) => c.location));
  return ["All Locations", ...Array.from(set).sort()];
};

export function ClaimsDashboard({ claims }: { claims: Claim[] }) {
  const { getMeta, setStatus, setComment, loaded } = useClaimMeta();
  const { isAdmin, login, logout, loaded: adminLoaded } = useAdmin();
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [search, setSearch] = useState("");
  const [travelersFilter, setTravelersFilter] =
    useState<TravelersFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const locations = useMemo(() => LOCATIONS(claims), [claims]);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const meta = getMeta(c.id);
      if (statusFilter !== "all" && meta.status !== statusFilter) return false;
      if (locationFilter !== "All Locations" && c.location !== locationFilter)
        return false;
      if (travelersFilter !== "all") {
        if (travelersFilter === "investigating" && c.travelersStatus !== "In Progress") return false;
        if (travelersFilter === "denied" && c.travelersStatus !== "Denied") return false;
        if (travelersFilter === "new" && c.travelersStatus !== "New") return false;
        if (travelersFilter === "disputed" && !c.disputed) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matches =
          c.description.toLowerCase().includes(q) ||
          c.id.includes(q) ||
          c.location.toLowerCase().includes(q) ||
          meta.comment.toLowerCase().includes(q) ||
          (c.travelersComments || "").toLowerCase().includes(q) ||
          (c.travelersPosition || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [claims, statusFilter, locationFilter, travelersFilter, search, getMeta]);

  const stats = useMemo(() => {
    let open = 0,
      inProgress = 0,
      resolved = 0;
    let tInvestigating = 0,
      tDenied = 0,
      tDisputed = 0;
    for (const c of claims) {
      const s = getMeta(c.id).status;
      if (s === "open") open++;
      else if (s === "in-progress") inProgress++;
      else resolved++;
      if (c.travelersStatus === "In Progress") tInvestigating++;
      if (c.travelersStatus === "Denied") tDenied++;
      if (c.disputed) tDisputed++;
    }
    return {
      open,
      inProgress,
      resolved,
      total: claims.length,
      tInvestigating,
      tDenied,
      tDisputed,
    };
  }, [claims, getMeta]);

  if (!loaded || !adminLoaded) {
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
      {/* Admin bar */}
      <div className="mb-6 flex items-center justify-end">
        <LoginButton isAdmin={isAdmin} onLogin={login} onLogout={logout} />
      </div>

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

      {/* Travelers Stats */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
          Travelers Canada Response
        </p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Investigating"
            value={stats.tInvestigating}
            color="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Denied"
            value={stats.tDenied}
            color="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Disputed"
            value={stats.tDisputed}
            color="text-purple-600 dark:text-purple-400"
          />
        </div>
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
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            Travelers:
          </span>
          {TRAVELERS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTravelersFilter(opt.value)}
              className={`h-7 rounded-full px-2.5 text-xs font-medium transition-colors ${
                travelersFilter === opt.value
                  ? opt.value === "denied"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : opt.value === "disputed"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : opt.value === "investigating"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
            isAdmin={isAdmin}
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
