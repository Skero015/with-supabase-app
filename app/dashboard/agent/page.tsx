import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgentDashboardClient } from "./agent-dashboard-client";

export default async function AgentDashboardPage() {
  const supabase = await createClient();

  console.info("[AgentDashboard] Starting page render");
  
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[AgentDashboard] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });
  
  if (userError || !userData?.user) {
    console.info("[AgentDashboard] No user found, redirecting to login");
    redirect("/auth/login");
  }

  // Check user role - if they have a manager role, redirect to manager dashboard
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[AgentDashboard] Role check", { userId: userData.user.id, role: roleData?.role });

  // If user is a manager, redirect to manager dashboard
  if (roleData?.role === "manager") {
    redirect("/dashboard/manager");
  }

  // If no role or role is agent, allow access (default to agent)
  // This allows new users without roles to access the agent dashboard

  // Get all active FNOs (agents can see all FNOs)
  console.info("[AgentDashboard] Fetching FNOs");
  const { data: fnos, error: fnosError } = await supabase
    .from('fnos')
    .select('*')
    .eq('status', 'active');
  
  console.info("[AgentDashboard] FNOs fetched", { 
    count: fnos?.length || 0, 
    error: fnosError?.message 
  });

  console.info("[AgentDashboard] Rendering component");
  return <AgentDashboardClient fnos={fnos || []} />;
}