import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Get user role and redirect accordingly
  const roleResult = await getUserRole(data.claims.sub);
  if (roleResult.error || !roleResult.data) {
    redirect("/auth/login");
  }

  const userRole = roleResult.data.role;

  if (userRole === "manager") {
    redirect("/dashboard/manager");
  } else if (userRole === "agent") {
    redirect("/dashboard/agent");
  } else {
    redirect("/auth/login");
  }
}