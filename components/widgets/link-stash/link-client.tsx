"use client";

import { useState, useRef, useCallback } from "react";
import { useLinks } from "@/hooks/use-links";
import { ExternalLink, X } from "lucide-react";

// Deterministic color from a string — always the same color for the same domain
const COLORS = [
  "bg-[var(--color-accent)]",
  "bg-[var(--color-accent-hover)]",
  "bg-[var(--color-success)]",
  "bg-[var(--color-warning)]",
  "bg-[var(--color-danger)]",
  "bg-[var(--color-text-secondary)]",
  "bg-[var(--color-text-muted)]",
  "bg-[var(--color-surface-hover)]",
];

const TAG_COLORS: Record<string, string> = {
  react: "bg-[var(--color-accent)]/20 text-[var(--color-accent)]",
  tutorial: "bg-[var(--color-accent-hover)]/20 text-[var(--color-accent-hover)]",
  news: "bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
  github: "bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]",
  docs: "bg-[var(--color-accent)]/20 text-[var(--color-accent)]",
  design: "bg-[var(--color-danger)]/20 text-[var(--color-danger)]",
  college: "bg-[var(--color-success)]/20 text-[var(--color-success)]",
  ai: "bg-[var(--color-accent-hover)]/20 text-[var(--color-accent-hover)]",
  video: "bg-[var(--color-danger)]/20 text-[var(--color-danger)]",
  social: "bg-[var(--color-text-secondary)]/20 text-[var(--color-text-secondary)]",
};

function domainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function domainInitial(url: string): string {
  const domain = extractDomain(url);
  return domain.charAt(0).toUpperCase();
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    const domain = parsed.hostname.replace(/^www\./, "");
    if (path.length <= 1) return domain;
    const truncated = path.length > 30 ? path.slice(0, 27) + "…" : path;
    return domain + truncated;
  } catch {
    return url;
  }
}

function tagStyle(tag: string): string {
  return TAG_COLORS[tag] ?? "bg-[var(--color-text-muted)]/40 text-[var(--color-text-muted)]";
}

export function LinkClient() {
  const { links, loading, add, remove, updateTags } = useLinks();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const taggingRef = useRef<Set<string>>(new Set());

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed) return;

      // Add the link
      add(trimmed);

      setDraft("");
      inputRef.current?.focus();
    },
    [draft, add],
  );

  // Auto-tag: watch for new links with no tags and empty tagging set
  const linksWithoutTags = links.filter(
    (l) => l.tags.length === 0 && !taggingRef.current.has(l.id),
  );

  if (linksWithoutTags.length > 0) {
    const link = linksWithoutTags[0];
    taggingRef.current.add(link.id);

    // Fire-and-forget tag fetch
    fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link.url, title: link.title }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          updateTags(link.id, data.tags);
        }
      })
      .catch(() => {
        // Silently fail — tags are cosmetic
      })
      .finally(() => {
        taggingRef.current.delete(link.id);
      });
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Link Stash
        </p>
        <div className="space-y-2">
          <div className="h-8 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
          <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
        Link Stash
      </p>

      {/* Add input */}
      <form onSubmit={handleSubmit} className="mt-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste a URL…"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)]/80"
        />
      </form>

      {/* Link cards */}
      {links.length > 0 ? (
        <div className="mt-1 max-h-[240px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {links.map((link) => (
            <div
              key={link.id}
              className="group flex items-center gap-2.5 rounded-lg border border-[var(--color-border)]/50 px-3 py-2 transition-colors hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]/30"
            >
              {/* Domain initial badge */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white ${domainColor(link.url)}`}
              >
                {domainInitial(link.url)}
              </div>

              {/* Link content */}
              <div className="min-w-0 flex-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  <span className="truncate">{link.title}</span>
                  <ExternalLink
                    size={10}
                    className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </a>
                <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                  {formatUrl(link.url)}
                </p>
                {/* Tags */}
                {link.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {link.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded px-1.5 py-[1px] text-[10px] font-medium leading-normal ${tagStyle(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => remove(link.id)}
                className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-all hover:text-[var(--color-text-secondary)] group-hover:opacity-100"
                aria-label="Delete link"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
          No links yet. Paste a URL to get started.
        </p>
      )}
    </div>
  );
}
