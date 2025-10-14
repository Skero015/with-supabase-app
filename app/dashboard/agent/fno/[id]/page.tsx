import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FnoDetails } from "@/components/dashboard/fno-details";

interface AgentFnoDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentFnoDetailsPage({ params }: AgentFnoDetailsPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  console.info("[AgentFnoView] Starting page render", { fnoId: resolvedParams.id });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[AgentFnoView] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });

  if (userError || !userData?.user) {
    console.info("[AgentFnoView] No user found, redirecting to login");
    redirect("/auth/login");
  }

  // Check user role - if they're a manager, redirect to manager view
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[AgentFnoView] Role check", { userId: userData.user.id, role: roleData?.role });

  if (roleData?.role === "manager") {
    console.warn("[AgentFnoView] Manager attempted to access agent view, redirecting to manager dashboard");
    redirect("/dashboard/manager");
  }

  // Get FNO with installation steps (agents can view all active FNOs)
  const { data: fnoData, error: fnoError } = await supabase
    .from('fnos')
    .select(`
      *,
      installation_steps (*)
    `)
    .eq('id', resolvedParams.id)
    .maybeSingle();

  console.info("[AgentFnoView] FNO fetch", { 
    fnoId: resolvedParams.id, 
    found: !!fnoData,
    error: fnoError?.message,
    hasSteps: !!fnoData?.installation_steps,
    stepsCount: fnoData?.installation_steps?.length || 0
  });

  if (fnoError || !fnoData) {
    notFound();
  }

  // Agents can only view active FNOs
  if (fnoData.status !== "active") {
    console.warn("[AgentFnoView] Agent attempted to view inactive FNO", {
      fnoId: resolvedParams.id,
      status: fnoData.status
    });
    notFound();
  }

  return (
    <div className="space-y-6">
      <FnoDetails fno={fnoData} userRole="agent" />
    </div>
  );
}