import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { getFnos } from "@/lib/database/fnos";
import { FnoList } from "@/components/dashboard/fno-list";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AgentDashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Verify user is an agent
  const roleResult = await getUserRole(data.claims.sub);
  if (roleResult.error || !roleResult.data || roleResult.data.role !== "agent") {
    redirect("/dashboard");
  }

  // Get all active FNOs (agents can see all FNOs)
  const fnosResult = await getFnos({ status: "active" });
  const fnos = fnosResult.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FNO Directory</h1>
          <p className="text-muted-foreground">
            Browse Fibre Network Operators and their installation processes
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search FNOs by name or coverage area..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available FNOs</h2>
            <div className="text-sm text-muted-foreground">
              {fnos.length} active FNO{fnos.length !== 1 ? 's' : ''} available
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
              <h3 className="text-lg font-medium mb-2">No FNOs available</h3>
              <p className="text-muted-foreground">
                There are currently no active FNOs in the system. Please check back later.
              </p>
            </div>
          ) : (
            <FnoList fnos={fnos} userRole="agent" />
          )}
        </div>
      </div>
    </div>
  );
}