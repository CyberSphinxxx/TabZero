export type RenewalCycle = "monthly" | "yearly";

export interface Subscription {
  id: string;
  name: string;
  cost: number; // in PHP or USD — display as-is
  currency: string; // "PHP" | "USD" etc.
  renewalDate: string; // ISO date string of next renewal
  cycle: RenewalCycle;
  category?: string; // "hosting", "domain", "streaming", "saas", "other"
  createdAt: number;
}

export interface SubscriptionInput {
  name: string;
  cost: number;
  currency?: string;
  renewalDate: string;
  cycle: RenewalCycle;
  category?: string;
}
