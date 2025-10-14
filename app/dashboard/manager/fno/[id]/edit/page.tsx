import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FnoEditForm } from "@/components/dashboard/fno-edit-form";

interface FnoEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManagerFnoEditPage({ params }: FnoEditPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  console.info("[ManagerFnoEdit] Starting page render", { fnoId: resolvedParams.id });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[ManagerFnoEdit] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });

  if (userError || !userData?.user) {
    console.info("[ManagerFnoEdit] No user found, redirecting to login");
    redirect("/auth/login");
  }

  // Verify user is a manager
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[ManagerFnoEdit] Role check", { userId: userData.user.id, role: roleData?.role });

  if (roleData?.role !== "manager") {
    console.warn("[ManagerFnoEdit] Non-manager attempted access, redirecting to agent dashboard");
    redirect("/dashboard/agent");
  }

  // Get FNO with installation steps
  const { data: fnoData, error: fnoError } = await supabase
    .from('fnos')
    .select(`
      *,
      installation_steps (*)
    `)
    .eq('id', resolvedParams.id)
    .maybeSingle();

  console.info("[ManagerFnoEdit] FNO fetch", { 
    fnoId: resolvedParams.id, 
    found: !!fnoData,
    error: fnoError?.message 
  });

  if (fnoError || !fnoData) {
    notFound();
  }

  // Verify the manager owns this FNO
  if (fnoData.created_by !== userData.user.id) {
    console.warn("[ManagerFnoEdit] Manager attempted to edit FNO they don't own", {
      userId: userData.user.id,
      fnoCreatedBy: fnoData.created_by
    });
    redirect("/dashboard/manager");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit FNO</h1>
        <p className="text-muted-foreground">
          Update {fnoData.name} details and installation process
        </p>
      </div>

      <FnoEditForm fno={fnoData} />
    </div>
  );
}