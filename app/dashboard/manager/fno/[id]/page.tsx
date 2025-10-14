import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FnoDetails } from "@/components/dashboard/fno-details";

interface FnoDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManagerFnoDetailsPage({ params }: FnoDetailsPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  console.info("[ManagerFnoView] Starting page render", { fnoId: resolvedParams.id });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[ManagerFnoView] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });

  if (userError || !userData?.user) {
    console.info("[ManagerFnoView] No user found, redirecting to login");
    redirect("/auth/login");
  }

  // Verify user is a manager
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[ManagerFnoView] Role check", { userId: userData.user.id, role: roleData?.role });

  if (roleData?.role !== "manager") {
    console.warn("[ManagerFnoView] Non-manager attempted access, redirecting to agent dashboard");
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

  console.info("[ManagerFnoView] FNO fetch", { 
    fnoId: resolvedParams.id, 
    found: !!fnoData,
    error: fnoError?.message 
  });

  if (fnoError || !fnoData) {
    notFound();
  }

  // Verify the manager owns this FNO
  if (fnoData.created_by !== userData.user.id) {
    console.warn("[ManagerFnoView] Manager attempted to view FNO they don't own", {
      userId: userData.user.id,
      fnoCreatedBy: fnoData.created_by
    });
    redirect("/dashboard/manager");
  }

  return (
    <div className="space-y-6">
      <FnoDetails fno={fnoData} userRole="manager" />
    </div>
  );
}