"use client";

import { useState } from "react";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { Plus, X, RefreshCw } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  hosting: "text-emerald-400",
  domain: "text-blue-400",
  streaming: "text-rose-400",
  saas: "text-violet-400",
  other: "text-zinc-500",
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
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-zinc-200">Add Subscription</p>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-400"
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
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
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
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
            <select
              value={cycle}
              onChange={(e) =>
                setCycle(e.target.value as "monthly" | "yearly")
              }
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            >
              <option value="monthly">/mo</option>
              <option value="yearly">/yr</option>
            </select>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
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
          className="mt-4 w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
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
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Budget
        </p>
        <div className="space-y-2">
          <div className="h-6 animate-pulse rounded bg-zinc-800" />
          <div className="h-6 animate-pulse rounded bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Budget
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
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
              className="group flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-2 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw
                  size={12}
                  className={`shrink-0 ${
                    CATEGORY_COLORS[sub.category ?? "other"] ?? "text-zinc-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {sub.name}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Renews {sub.renewalDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-zinc-300 tabular-nums">
                  {formatCurrency(sub.cost, sub.currency)}
                  {CYCLE_LABELS[sub.cycle]}
                </span>
                <button
                  onClick={() => remove(sub.id)}
                  className="text-zinc-700 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-zinc-600">
          No subscriptions yet.
        </p>
      )}

      {/* Monthly total */}
      {subscriptions.length > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Monthly total
          </p>
          <p className="text-sm font-semibold text-zinc-200 tabular-nums">
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
