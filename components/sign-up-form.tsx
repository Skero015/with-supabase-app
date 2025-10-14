"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/database/types";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    repeatPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Password strength validation
  const validatePassword = (pwd: string): { isValid: boolean; message?: string } => {
    if (pwd.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(pwd)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(pwd)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    return { isValid: true };
  };

  // Real-time field validation
  const handleEmailBlur = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordBlur = () => {
    if (password) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setFieldErrors(prev => ({ ...prev, password: validation.message }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: undefined }));
      }
    }
  };

  const handleRepeatPasswordBlur = () => {
    if (repeatPassword && password !== repeatPassword) {
      setFieldErrors(prev => ({ ...prev, repeatPassword: "Passwords do not match" }));
    } else {
      setFieldErrors(prev => ({ ...prev, repeatPassword: undefined }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    // Validate all fields before submission
    const errors: typeof fieldErrors = {};
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }

    if (password !== repeatPassword) {
      errors.repeatPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      console.info("[SignUp] Starting signup", { email, role });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: role,
          },
        },
      });
      console.info("[SignUp] signUp response", { data, error });

      if (error) {
        if (error.message.includes("For security purposes")) {
          throw new Error("Please wait before trying again. Too many signup attempts.");
        }
        throw error;
      }

      let destination: "agent" | "manager" = role;

      if (data.user) {
        try {
          console.info("[SignUp] Created user", { userId: data.user.id });

          const confirmSession = async () => {
            const deadline = Date.now() + 10000;
            let lastError: unknown = null;

            while (Date.now() < deadline) {
              const { data: current, error: currentError } = await supabase.auth.getSession();
              if (current?.session?.user) {
                return current.session.user;
              }
              lastError = currentError;
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
            return Promise.reject(lastError ?? new Error("Session not established within timeout"));
          };

          const attemptAutoLogin = async () => {
            if (data.session?.user) return data.session.user;
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({ email, password });
            console.info("[SignUp] Auto sign-in result", { signInData, signInError });
            if (signInError || !signInData.session?.user) {
              return null;
            }
            return signInData.session.user;
          };

          let sessionUser = await attemptAutoLogin();
          if (!sessionUser) {
            setError(
              "Account created, but automatic login failed. Please sign in manually with your new credentials."
            );
            const message = encodeURIComponent(
              "Account created. Please sign in with the credentials you just created."
            );
            router.push(`/auth/login?message=${message}`);
            return;
          }

          sessionUser = await confirmSession();

          // Create role via API route to use server-side client
          try {
            const roleResponse = await fetch('/api/user-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: data.user.id,
                role: role,
              }),
            });

            const roleResult = await roleResponse.json();
            console.info("[SignUp] Role assignment result", roleResult);

            if (!roleResponse.ok || roleResult.error) {
              console.error("[SignUp] Role creation failed", roleResult);
              // Don't throw - allow user to proceed, they can be assigned role later
              destination = "agent"; // Default to agent if role creation fails
            }
          } catch (roleError) {
            console.error("[SignUp] Role creation request failed", roleError);
            destination = "agent"; // Default to agent if role creation fails
          }
        } catch (roleError) {
          console.error("Role creation failed:", roleError);
          setError("Account created but role assignment failed. Please contact support.");
          destination = "agent";
        }
      }

      console.info("[SignUp] Redirecting to success", { destination });
      router.push(`/auth/sign-up-success?role=${destination}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      console.error("[SignUp] Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-xs text-red-500" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error password-requirements" : "password-requirements"}
                  className={fieldErrors.password ? "border-red-500" : ""}
                />
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-red-500" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  onBlur={handleRepeatPasswordBlur}
                  aria-invalid={!!fieldErrors.repeatPassword}
                  aria-describedby={fieldErrors.repeatPassword ? "repeat-password-error" : undefined}
                  className={fieldErrors.repeatPassword ? "border-red-500" : ""}
                />
                {fieldErrors.repeatPassword && (
                  <p id="repeat-password-error" className="text-xs text-red-500" role="alert">
                    {fieldErrors.repeatPassword}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  required
                >
                  <option value="agent">Service Delivery Agent</option>
                  <option value="manager">Service Delivery Manager</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {role === "manager"
                    ? "Managers can create and manage FNO profiles and installation processes"
                    : "Agents can view FNO profiles and access installation processes (read-only)"
                  }
                </p>
              </div>
              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200" role="alert" aria-live="assertive">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
