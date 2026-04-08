export type TravelersStatus = "In Progress" | "Denied" | "New";
export type TravelersPosition =
  | "Investigation Required by Builder"
  | "Not Warrantable - see comments"
  | "Not Warrantable - no defect noted"
  | "Outside Scope of Warranty Policy"
  | "Outside Scope - Concern related to Common Property"
  | "";

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
  travelersItemNumber: number | null;
  travelersStatus: TravelersStatus | null;
  travelersPosition: TravelersPosition | null;
  travelersComments: string;
  disputed: boolean;
}

export type ClaimStatus = "open" | "in-progress" | "resolved";

export interface ClaimMeta {
  status: ClaimStatus;
  comment: string;
}

export type ClaimMetaMap = Record<string, ClaimMeta>;
