"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/client/auth-context";
import {
  fetchClassroomAssignments,
  type ClassroomAssignment,
} from "@/lib/client/classroom";
import {
  getStoredClassroomToken,
  clearStoredClassroomToken,
  connectClassroom,
} from "@/lib/client/classroom-auth";
import { ExternalLink, CheckCircle2, Circle, AlertCircle, BookOpen } from "lucide-react";

function formatDate(iso: string | null): string {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil(
    (d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays}d`;
}

function dateColor(iso: string | null): string {
  if (!iso) return "text-[var(--color-text-muted)]";
  const diff =
    (new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (diff < 0) return "text-[var(--color-danger)]";
  if (diff < 2) return "text-[var(--color-warning)]";
  return "text-[var(--color-text-muted)]";
}

export function ClassroomClient() {
  const { googleToken } = useAuth();
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Try loading with stored Classroom token first, fall back to Firebase token
  const loadAssignments = useCallback(async (token: string | null, storedToken: string | null) => {
    setLoading(true);
    setError(null);

    const effectiveToken = storedToken ?? token;

    try {
      const result = await fetchClassroomAssignments(effectiveToken);
      setAssignments(result.assignments);
      setConfigured(result.configured);
      setError(result.error);
    } catch {
      setError("Failed to load assignments");
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const storedToken = getStoredClassroomToken();
    loadAssignments(googleToken, storedToken);
  }, [googleToken, loadAssignments]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);

    try {
      const token = await connectClassroom();
      if (token === "use-firebase") {
        setConnectError(
          "To use a different Google account for Classroom: sign in below " +
          "with that account, or set NEXT_PUBLIC_FIREBASE_CLIENT_ID in .env.local"
        );
      } else {
        await loadAssignments(googleToken, token);
      }
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Connection failed"
      );
    } finally {
      setConnecting(false);
    }
  }, [googleToken, loadAssignments]);

  const handleDisconnect = useCallback(() => {
    clearStoredClassroomToken();
    setAssignments([]);
    setConfigured(null);
    setError(null);
    fetchedRef.current = false;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Classroom
        </p>
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
        </div>
      </div>
    );
  }

  const hasStoredToken = !!getStoredClassroomToken();

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Classroom
        </p>
        {configured === false && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-warning)]">
            <AlertCircle size={10} />
            Not connected
          </span>
        )}
        {configured === true && (
          <span className="text-[10px] text-[var(--color-success)]">
            {hasStoredToken ? "School account" : "Connected"}
          </span>
        )}
      </div>

      {/* Connect/Disconnect buttons */}
      <div className="flex items-center gap-2">
        {!hasStoredToken ? (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            <BookOpen size={12} />
            {connecting ? "Connecting…" : "Connect Classroom"}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            Disconnect
          </button>
        )}
        {connectError && (
          <p className="text-[10px] text-[var(--color-warning)]">{connectError}</p>
        )}
      </div>

      {/* Assignment list */}
      {assignments.length > 0 ? (
        <div className="mt-1 max-h-[240px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="group flex items-start gap-2.5 rounded-lg border border-[var(--color-border)]/50 px-3 py-2 transition-colors hover:border-[var(--color-text-muted)]"
            >
              {/* Submitted status */}
              {assignment.submitted ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm font-medium ${
                      assignment.submitted
                        ? "text-[var(--color-text-muted)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {assignment.title}
                  </p>
                  {assignment.url && (
                    <a
                      href={assignment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity hover:text-[var(--color-text-secondary)] group-hover:opacity-100"
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                  {assignment.courseName}
                </p>
              </div>

              {/* Due date */}
              <span
                className={`shrink-0 text-[11px] font-medium tabular-nums ${dateColor(assignment.dueDate)}`}
              >
                {assignment.submitted
                  ? "Submitted"
                  : formatDate(assignment.dueDate)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
          {configured ? "No assignments found." : "Connect to see your assignments."}
        </p>
      )}

      {/* Api not enabled banner */}
      {configured === false && error && !hasStoredToken && (
        <p className="mt-1 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-[var(--color-warning)]">
          {error}
        </p>
      )}
    </div>
  );
}
