"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/lib/database/user-roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleHint = useMemo(() => searchParams?.get("role") ?? undefined, [searchParams]);
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    let cancelled = false;

    const navigate = async () => {
      let destination = "/dashboard";
      const timeoutAt = Date.now() + 10000;

      const waitForSession = async () => {
        while (Date.now() < timeoutAt) {
          const { data, error } = await supabase.auth.getSession();
          console.info("[SignUpSuccess] Session poll", { error, user: data?.session?.user?.id });
          if (cancelled) return null;
          if (data?.session?.user?.id) return data.session.user.id;
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        return null;
      };

      try {
        let userId: string | null = null;

        if (roleHint === "manager") {
          destination = "/dashboard/manager";
        } else if (roleHint === "agent") {
          destination = "/dashboard/agent";
        }

        userId = await waitForSession();

        if (!cancelled && !userId) {
          setMessage(
            "We created your account but could not automatically sign you in. Please use the credentials you just created."
          );
          router.push("/auth/login?message=" + encodeURIComponent("Please sign in manually."));
          return;
        }

        if (!cancelled) {
          if (roleHint !== "manager" && roleHint !== "agent" && userId) {
            const roleResult = await getUserRole(userId);
            if (roleResult.data?.role === "manager") destination = "/dashboard/manager";
            else if (roleResult.data?.role === "agent") destination = "/dashboard/agent";
          }

          console.info("[SignUpSuccess] Navigating to", destination);
          // Wait a bit to ensure cookies are fully set
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Use hard navigation to ensure fresh server request with cookies
          window.location.href = destination;
        }
      } catch (error) {
        console.error("[SignUpSuccess] error while determining destination", error);
        if (!cancelled) {
          setMessage(
            "Something went wrong while finalising your session. Please sign in manually with the same credentials."
          );
          router.push("/auth/login?message=" + encodeURIComponent("Please sign in manually."));
        }
      }
    };

    navigate();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roleHint, router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome aboard!</CardTitle>
              <CardDescription>
                {message ?? "Setting up your account. This will take just a moment."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Redirecting in {secondsLeft}s
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}