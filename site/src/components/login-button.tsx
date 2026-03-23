"use client";

import { useState } from "react";

interface LoginButtonProps {
  isAdmin: boolean;
  onLogin: (password: string) => Promise<boolean>;
  onLogout: () => void;
}

export function LoginButton({ isAdmin, onLogin, onLogout }: LoginButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAdmin) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-success font-medium flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          Admin
        </span>
        <button
          onClick={onLogout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        Admin Login
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await onLogin(password);
    setLoading(false);
    if (!ok) {
      setError(true);
      setPassword("");
    } else {
      setShowForm(false);
      setPassword("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(false);
        }}
        placeholder="Password"
        autoFocus
        className={`h-8 w-40 rounded-lg border px-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent/50 ${
          error ? "border-red-500" : "border-border"
        }`}
      />
      <button
        type="submit"
        disabled={loading || !password}
        className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "..." : "Login"}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowForm(false);
          setPassword("");
          setError(false);
        }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </form>
  );
}
