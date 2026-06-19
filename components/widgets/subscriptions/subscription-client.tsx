"use client";

import { useState } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { Plus, X, RefreshCw } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  hosting: "text-[var(--color-success)]",
  domain: "text-[var(--color-accent)]",
  streaming: "text-[var(--color-danger)]",
  saas: "text-[var(--color-accent-hover)]",
  other: "text-[var(--color-text-muted)]",
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "/mo",
  yearly: "/yr",
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : currency;
  return `${symbol}${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AddSubModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    cost: number;
    currency: string;
    renewalDate: string;
    cycle: "monthly" | "yearly";
    category: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [renewalDate, setRenewalDate] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [category, setCategory] = useState("other");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !cost || !renewalDate) return;

    onAdd({
      name: name.trim(),
      cost: parseFloat(cost),
      currency,
      renewalDate,
      cycle,
      category,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Add Subscription</p>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Vercel Pro)"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"
          />

          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-2 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-muted)]"
            >
              <option value="PHP">₱</option>
              <option value="USD">$</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-muted)]"
            />
            <select
              value={cycle}
              onChange={(e) =>
                setCycle(e.target.value as "monthly" | "yearly")
              }
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-2 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-muted)]"
            >
              <option value="monthly">/mo</option>
              <option value="yearly">/yr</option>
            </select>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-text-muted)]"
          >
            <option value="other">Category</option>
            <option value="hosting">Hosting</option>
            <option value="domain">Domain</option>
            <option value="streaming">Streaming</option>
            <option value="saas">SaaS</option>
          </select>
        </div>

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-[var(--color-surface-hover)] py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border)]"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export function SubscriptionClient() {
  const { subscriptions, loading, add, update, remove, monthlyTotal } =
    useSubscriptions();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Budget
        </p>
        <div className="space-y-2">
          <div className="h-6 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="h-6 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Budget
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <Plus size={11} />
          Add
        </button>
      </div>

      {/* Sub list */}
      {subscriptions.length > 0 ? (
        <div className="mt-1 max-h-[200px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="group flex items-center justify-between rounded-lg border border-[var(--color-border)]/50 px-3 py-2 transition-colors hover:border-[var(--color-text-muted)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw
                  size={12}
                  className={`shrink-0 ${
                    CATEGORY_COLORS[sub.category ?? "other"] ?? "text-[var(--color-text-muted)]"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {sub.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    Renews {sub.renewalDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-[var(--color-text-primary)] tabular-nums">
                  {formatCurrency(sub.cost, sub.currency)}
                  {CYCLE_LABELS[sub.cycle]}
                </span>
                <button
                  onClick={() => remove(sub.id)}
                  className="text-[var(--color-text-muted)] opacity-0 transition-all hover:text-[var(--color-danger)] group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-[var(--color-text-muted)]">
          No subscriptions yet.
        </p>
      )}

      {/* Monthly total */}
      {subscriptions.length > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface)]/50 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Monthly total
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">
            ₱{monthlyTotal.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <AddSubModal
          onClose={() => setShowModal(false)}
          onAdd={(data) => {
            add(data);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
