import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { LoginGate } from "@/components/auth/login-gate";

export default function Home() {
  return (
    <LoginGate>
      <DashboardGrid />
    </LoginGate>
  );
}
