import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  console.info("[DashboardLayout] Starting layout render");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.info("[DashboardLayout] Auth check", { 
    hasUser: !!userData?.user, 
    userId: userData?.user?.id,
    error: userError?.message 
  });

  if (userError || !userData?.user) {
    console.info("[DashboardLayout] No user, redirecting to login");
    redirect("/auth/login");
  }

  // Query role directly with server client
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  console.info("[DashboardLayout] Role check", { 
    userId: userData.user.id, 
    role: roleData?.role 
  });

  // Default to agent if no role found (prevents redirect loops)
  const userRole = roleData?.role || "agent";

  console.info("[DashboardLayout] Layout render complete", { userRole });

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