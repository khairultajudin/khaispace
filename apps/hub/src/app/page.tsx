import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardView } from "../components/dashboard/dashboard-view";

export default function HubHome() {
  return (
    <AuthGuard>
      <DashboardView />
    </AuthGuard>
  );
}
