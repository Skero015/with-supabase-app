import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/database/user-roles";
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

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

  // User is not authenticated or has no role, show landing page
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Service Delivery Platform</Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          <main className="flex-1 flex flex-col gap-6 px-4">
            <h2 className="font-medium text-xl mb-4">Get Started</h2>
            {hasEnvVars ? (
              <div className="flex flex-col gap-4">
                <p className="text-foreground/80">
                  Welcome to the Service Delivery Platform. Sign up or log in to get started.
                </p>
                <div className="flex gap-4">
                  <Link 
                    href="/auth/sign-up"
                    className="bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/80 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link 
                    href="/auth/login"
                    className="border border-foreground/20 px-4 py-2 rounded-md hover:bg-foreground/5 transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            ) : (
              <ConnectSupabaseSteps />
            )}
          </main>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}