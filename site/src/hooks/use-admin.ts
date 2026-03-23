"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "warranty-admin";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem(STORAGE_KEY) === "true");
    setLoaded(true);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAdmin(false);
  }, []);

  return { isAdmin, login, logout, loaded };
}
