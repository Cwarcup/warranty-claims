export interface Claim {
  id: string;
  dateSubmitted: string;
  dateDiscovered: string;
  dateReported: string;
  repairsDone: boolean;
  location: string;
  description: string;
  referenceDocUrl: string;
  imageFilename: string;
}

export type ClaimStatus = "open" | "in-progress" | "resolved";

export interface ClaimMeta {
  status: ClaimStatus;
  comment: string;
}

export type ClaimMetaMap = Record<string, ClaimMeta>;
