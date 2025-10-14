import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { getFnoWithSteps } from "@/lib/database/fnos";
import { FnoDetails } from "@/components/dashboard/fno-details";

interface FnoDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManagerFnoDetailsPage({ params }: FnoDetailsPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Verify user is a manager
  const roleResult = await getUserRole(data.claims.sub);
  if (roleResult.error || !roleResult.data || roleResult.data.role !== "manager") {
    redirect("/dashboard");
  }

  // Get FNO with installation steps
  const fnoResult = await getFnoWithSteps(resolvedParams.id);
  if (fnoResult.error || !fnoResult.data) {
    notFound();
  }

  // Verify the manager owns this FNO
  if (fnoResult.data.created_by !== data.claims.sub) {
    redirect("/dashboard/manager");
  }

  return (
    <div className="space-y-6">
      <FnoDetails fno={fnoResult.data} userRole="manager" />
    </div>
  );
}