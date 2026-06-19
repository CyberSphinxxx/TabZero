import { SubscriptionWidget } from "@/components/widgets/subscriptions";

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Subscriptions
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Track your recurring expenses and memberships.
        </p>
      </div>
      <div className="flex-1">
        <SubscriptionWidget />
      </div>
    </div>
  );
}
