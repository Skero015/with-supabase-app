import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";

export default async function HomePage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data, error } = await supabase.auth.getClaims();
  
  if (!error && data?.claims) {
    // User is authenticated, check their role and redirect
    const roleResult = await getUserRole(data.claims.sub);
    if (roleResult.data?.role) {
      const userRole = roleResult.data.role;
      if (userRole === "manager") {
        redirect("/dashboard/manager");
      } else if (userRole === "agent") {
        redirect("/dashboard/agent");
      }
    }
  }

  // User is not authenticated, redirect to login page
  redirect("/auth/login");
}