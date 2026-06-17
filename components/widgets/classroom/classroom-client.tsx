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
  if (!iso) return "text-zinc-500";
  const diff =
    (new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (diff < 0) return "text-red-400";
  if (diff < 2) return "text-amber-400";
  return "text-zinc-500";
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
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Classroom
        </p>
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-10 animate-pulse rounded-lg bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  const hasStoredToken = !!getStoredClassroomToken();

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Classroom
        </p>
        {configured === false && (
          <span className="flex items-center gap-1 text-[10px] text-amber-500">
            <AlertCircle size={10} />
            Not connected
          </span>
        )}
        {configured === true && (
          <span className="text-[10px] text-emerald-500">
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
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            <BookOpen size={12} />
            {connecting ? "Connecting…" : "Connect Classroom"}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-red-800 hover:text-red-400"
          >
            Disconnect
          </button>
        )}
        {connectError && (
          <p className="text-[10px] text-amber-400">{connectError}</p>
        )}
      </div>

      {/* Assignment list */}
      {assignments.length > 0 ? (
        <div className="mt-1 max-h-[240px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="group flex items-start gap-2.5 rounded-lg border border-zinc-800/50 px-3 py-2 transition-colors hover:border-zinc-700"
            >
              {/* Submitted status */}
              {assignment.submitted ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700" />
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`truncate text-sm font-medium ${
                      assignment.submitted
                        ? "text-zinc-600"
                        : "text-zinc-200"
                    }`}
                  >
                    {assignment.title}
                  </p>
                  {assignment.url && (
                    <a
                      href={assignment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-zinc-700 opacity-0 transition-opacity hover:text-zinc-400 group-hover:opacity-100"
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <p className="truncate text-[11px] text-zinc-600">
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
        <p className="mt-3 text-center text-sm text-zinc-600">
          {configured ? "No assignments found." : "Connect to see your assignments."}
        </p>
      )}

      {/* Api not enabled banner */}
      {configured === false && error && !hasStoredToken && (
        <p className="mt-1 rounded-lg border border-amber-900/30 bg-amber-950/20 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}
