import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // CRITICAL: We must call getUser() to validate the session with the auth server
  // This ensures the session is authentic and not just from cookies
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  const pathname = request.nextUrl.pathname;
  
  console.info("[Middleware] Auth check", { 
    pathname,
    hasUser: !!user,
    userId: user?.id,
    error: userError?.message 
  });

  // Allow public routes
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/sign-up',
    '/auth/sign-up-success',
    '/auth/forgot-password',
    '/auth/update-password',
    '/auth/error',
    '/auth/confirm'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users to login
  // BUT: If there's a userError, it might be a network issue, so let the page handle it
  if (!user && !isPublicRoute && !userError) {
    console.info("[Middleware] No user and not public route, redirecting to login");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  
  // If there's a userError but we're trying to access a protected route,
  // let the request through - the page component will handle auth
  if (userError && !isPublicRoute) {
    console.info("[Middleware] User error on protected route, allowing through to page");
    return supabaseResponse;
  }

  // Role-based access control for authenticated users
  if (user && !isPublicRoute) {
    try {
      // Get user role from database
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If we can't get the role, allow access and let /dashboard decide with a safe default
        console.info("[Middleware] Role fetch error", error);
        return supabaseResponse;
      }

      const role = userRole?.role;
      console.info("[Middleware] User role", { userId: user.id, role });

      // Role-based route protection
      if (pathname.startsWith('/dashboard/manager') && role !== undefined && role !== 'manager') {
        // Non-managers trying to access manager routes
        const url = request.nextUrl.clone();
        url.pathname = role === 'agent' ? '/dashboard/agent' : '/dashboard';
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith('/dashboard/agent') && role !== undefined && role !== 'agent') {
        // Non-agents trying to access agent routes
        const url = request.nextUrl.clone();
        url.pathname = role === 'manager' ? '/dashboard/manager' : '/dashboard';
        return NextResponse.redirect(url);
      }

      // Let /dashboard server page decide; avoid forcing redirect here
      // to prevent mismatches if role isn't yet available.

      // Redirect authenticated users away from auth pages (but skip if confirming)
      if (isPublicRoute && pathname.startsWith('/auth') && pathname !== '/auth/confirm') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }

    } catch (error) {
      console.error('Middleware error:', error);
      // On error, allow the request to continue but log the issue
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
