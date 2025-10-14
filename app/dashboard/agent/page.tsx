import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { getFnos } from "@/lib/database/fnos";
import { AgentDashboardClient } from "./agent-dashboard-client";

export default async function AgentDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Verify user is an agent
  const roleResult = await getUserRole(data.claims.sub);
  if (roleResult.error || !roleResult.data || roleResult.data.role !== "agent") {
    redirect("/dashboard");
  }

  // Get all active FNOs (agents can see all FNOs)
  const fnosResult = await getFnos({ status: "active" });
  const fnos = fnosResult.data || [];

  return <AgentDashboardClient fnos={fnos} />;
}