"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClaimMeta, ClaimMetaMap, ClaimStatus } from "../types";

const STORAGE_KEY = "warranty-claim-meta";

function load(): ClaimMetaMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data: ClaimMetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const defaultMeta: ClaimMeta = { status: "open", comment: "" };

export function useClaimMeta() {
  const [meta, setMeta] = useState<ClaimMetaMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMeta(load());
    setLoaded(true);
  }, []);

  const getMeta = useCallback(
    (id: string): ClaimMeta => meta[id] ?? defaultMeta,
    [meta]
  );

  const setStatus = useCallback(
    (id: string, status: ClaimStatus) => {
      setMeta((prev) => {
        const next = { ...prev, [id]: { ...defaultMeta, ...prev[id], status } };
        save(next);
        return next;
      });
    },
    []
  );

  const setComment = useCallback(
    (id: string, comment: string) => {
      setMeta((prev) => {
        const next = {
          ...prev,
          [id]: { ...defaultMeta, ...prev[id], comment },
        };
        save(next);
        return next;
      });
    },
    []
  );

  return { getMeta, setStatus, setComment, loaded };
}
