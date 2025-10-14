import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { FnoCreateForm } from "@/components/dashboard/fno-create-form";

export default async function CreateFnoPage() {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New FNO</h1>
        <p className="text-muted-foreground">
          Add a new Fibre Network Operator and define their installation process
        </p>
      </div>

      <FnoCreateForm userId={data.claims.sub} />
    </div>
  );
}