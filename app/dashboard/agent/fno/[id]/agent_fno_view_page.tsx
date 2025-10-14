import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { getFnoWithSteps } from "@/lib/database/fnos";
import { FnoDetails } from "@/components/dashboard/fno-details";

interface AgentFnoDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function AgentFnoDetailsPage({ params }: AgentFnoDetailsPageProps) {
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

  // Get FNO with installation steps (agents can view all active FNOs)
  const fnoResult = await getFnoWithSteps(params.id);
  if (fnoResult.error || !fnoResult.data) {
    notFound();
  }

  // Agents can only view active FNOs
  if (fnoResult.data.status !== "active") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <FnoDetails fno={fnoResult.data} userRole="agent" />
    </div>
  );
}