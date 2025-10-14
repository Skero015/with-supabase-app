import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { getFnoWithSteps } from "@/lib/database/fnos";
import { FnoEditForm } from "@/components/dashboard/fno-edit-form";

interface FnoEditPageProps {
  params: {
    id: string;
  };
}

export default async function FnoEditPage({ params }: FnoEditPageProps) {
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
  const fnoResult = await getFnoWithSteps(params.id);
  if (fnoResult.error || !fnoResult.data) {
    notFound();
  }

  // Verify the manager owns this FNO
  if (fnoResult.data.created_by !== data.claims.sub) {
    redirect("/dashboard/manager");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit FNO</h1>
        <p className="text-muted-foreground">
          Update {fnoResult.data.name} details and installation process
        </p>
      </div>

      <FnoEditForm fno={fnoResult.data} />
    </div>
  );
}