import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Get user role
  const roleResult = await getUserRole(data.claims.sub);
  if (roleResult.error || !roleResult.data) {
    redirect("/auth/login");
  }

  const userRole = roleResult.data.role;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-6 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/dashboard">Service Delivery Platform</Link>
              <div className="flex items-center gap-4 text-sm font-normal">
                {userRole === "manager" && (
                  <>
                    <Link 
                      href="/dashboard/manager" 
                      className="hover:text-foreground/80 transition-colors"
                    >
                      FNO Management
                    </Link>
                    <Link 
                      href="/dashboard/manager/create" 
                      className="hover:text-foreground/80 transition-colors"
                    >
                      Create FNO
                    </Link>
                  </>
                )}
                {userRole === "agent" && (
                  <Link 
                    href="/dashboard/agent" 
                    className="hover:text-foreground/80 transition-colors"
                  >
                    FNO Directory
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-accent px-2 py-1 rounded-md capitalize">
                {userRole}
              </span>
              <AuthButton />
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
        <div className="flex-1 w-full max-w-7xl p-5">
          {children}
        </div>
      </div>
    </main>
  );
}