import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FnoCreateForm } from "@/components/dashboard/fno-create-form";

export default async function CreateFnoPage() {
  const supabase = await createClient();

  console.info("[CreateFNO] Starting page render");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[CreateFNO] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });

  if (userError || !userData?.user) {
    console.info("[CreateFNO] No user found, redirecting to login");
    redirect("/auth/login");
  }

  // Verify user is a manager
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[CreateFNO] Role check", { userId: userData.user.id, role: roleData?.role });

  if (roleData?.role !== "manager") {
    console.warn("[CreateFNO] Non-manager attempted access, redirecting to agent dashboard");
    redirect("/dashboard/agent");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New FNO</h1>
        <p className="text-muted-foreground">
          Add a new Fibre Network Operator and define their installation process
        </p>
      </div>

      <FnoCreateForm userId={userData.user.id} />
    </div>
  );
}