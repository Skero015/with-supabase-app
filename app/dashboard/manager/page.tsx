import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FnoList } from "@/components/dashboard/fno-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function ManagerDashboardPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login");
  }

  // Check user role - must be a manager to access this page
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[ManagerDashboard] Role check", { userId: userData.user.id, role: roleData?.role });

  // If not a manager, redirect to agent dashboard (or main dashboard which will redirect to agent)
  if (roleData?.role !== "manager") {
    redirect("/dashboard/agent");
  }

  // Get FNOs created by this manager
  console.info("[ManagerDashboard] Fetching FNOs");
  const { data: fnos, error: fnosError } = await supabase
    .from('fnos')
    .select('*')
    .eq('created_by', userData.user.id);
  
  console.info("[ManagerDashboard] FNOs fetched", { 
    count: fnos?.length || 0, 
    error: fnosError?.message 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FNO Management</h1>
          <p className="text-muted-foreground">
            Manage your Fibre Network Operators and their installation processes
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/manager/create">
            <Plus className="mr-2 h-4 w-4" />
            Create FNO
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your FNOs</h2>
            <div className="text-sm text-muted-foreground">
              {fnos.length} FNO{fnos.length !== 1 ? 's' : ''} total
            </div>
          </div>
          
          {fnos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No FNOs yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first Fibre Network Operator profile
              </p>
              <Button asChild>
                <Link href="/dashboard/manager/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First FNO
                </Link>
              </Button>
            </div>
          ) : (
            <FnoList fnos={fnos || []} userRole="manager" />
          )}
        </div>
      </div>
    </div>
  );
}