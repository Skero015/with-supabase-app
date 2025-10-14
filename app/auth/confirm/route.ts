import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code"); // Old format support
  const email = searchParams.get("email"); // Some providers include email with code

  const supabase = await createClient();

  // Handle new format (token_hash + type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    const origin = new URL(request.url).origin;
    if (!error) {
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("message", "Email confirmed successfully. Please log in.");
      return NextResponse.redirect(loginUrl);
    }
    const errUrl = new URL("/auth/error", origin);
    errUrl.searchParams.set("error", error?.message || "Email confirmation failed");
    return NextResponse.redirect(errUrl);
  }
  
  // Handle old format (code parameter)
  if (code) {
    try {
      // If the confirmation link includes email, prefer verifyOtp using token + email
      if (email) {
        const { error } = await supabase.auth.verifyOtp({
          type: (type as EmailOtpType) || "email",
          email,
          token: code,
        });
        const origin = new URL(request.url).origin;
        if (!error) {
          const loginUrl = new URL("/auth/login", origin);
          loginUrl.searchParams.set("message", "Email confirmed successfully. Please log in.");
          return NextResponse.redirect(loginUrl);
        }
        const errUrl = new URL("/auth/error", origin);
        errUrl.searchParams.set("error", error?.message || "Email confirmation failed");
        return NextResponse.redirect(errUrl);
      }

      // Fallback for code without email (may require PKCE; try exchange)
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const origin = new URL(request.url).origin;
      if (!error) {
        const loginUrl = new URL("/auth/login", origin);
        loginUrl.searchParams.set("message", "Email confirmed successfully. Please log in.");
        return NextResponse.redirect(loginUrl);
      }
      const errUrl = new URL("/auth/error", origin);
      errUrl.searchParams.set("error", error?.message || "Email confirmation failed");
      return NextResponse.redirect(errUrl);
    } catch (error) {
      const origin = new URL(request.url).origin;
      const errUrl = new URL("/auth/error", origin);
      const errorMessage = error instanceof Error ? error.message : "Email confirmation failed";
      errUrl.searchParams.set("error", errorMessage);
      return NextResponse.redirect(errUrl);
    }
  }

  // redirect the user to an error page with some instructions
  {
    const origin = new URL(request.url).origin;
    const errUrl = new URL("/auth/error", origin);
    errUrl.searchParams.set(
      "error",
      "Invalid confirmation link. Please check your email or request a new confirmation."
    );
    return NextResponse.redirect(errUrl);
  }
}
