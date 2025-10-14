import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[Dashboard] getUser", { userError, userId: userData?.user?.id });
  
  if (userError || !userData?.user) {
    redirect("/auth/login");
  }

  // Query role from database
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[Dashboard] Role query", { roleData, roleError, userId: userData.user.id });

  // If role exists, redirect to appropriate dashboard
  if (roleData?.role === "manager") {
    redirect("/dashboard/manager");
  } else if (roleData?.role === "agent") {
    redirect("/dashboard/agent");
  }

  // If no role found, default to agent dashboard
  // This prevents redirect loops for new users whose roles haven't been created yet
  console.info("[Dashboard] No role found, defaulting to agent");
  redirect("/dashboard/agent");
}