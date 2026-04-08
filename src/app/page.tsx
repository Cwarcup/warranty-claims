import claimsData from "../data/claims.json";
import type { Claim } from "../types";
import { ClaimsDashboard } from "../components/claims-dashboard";

export default function Home() {
  return (
    <main className="flex-1">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Warranty Claims
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>{claimsData.owner.name}</span>
            <span>{claimsData.owner.address}</span>
            <span>Warranty #{claimsData.owner.warrantyNumber}</span>
            <span>Builder: {claimsData.owner.builder}</span>
          </div>
        </div>
      </header>
      <ClaimsDashboard claims={claimsData.claims as Claim[]} />
    </main>
  );
}
