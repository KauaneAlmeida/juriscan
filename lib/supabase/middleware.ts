import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make your application
  // vulnerable to security issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/privacy",
    "/api/jurimetrics/health",
    "/api/jurimetrics/tribunais",
    "/api/pagarme/webhook",  // Pagar.me webhooks need to be public
    "/api/payments/webhooks/pagarme",  // Pagar.me webhook (configured URL)
    "/api/payments/health",  // Payment health check
    "/api/admin/setup-plans",  // Admin plan setup (protected by x-admin-key)
    "/api/admin/login",        // Admin login endpoint
    "/admin",                  // Admin panel (auth handled client-side)
    "/completar-perfil",
    "/api/auth/verify-oab",
    "/api/auth/validate-signup",
  ];
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some(route => pathname.startsWith(route));

  // Define auth routes (redirect if already logged in)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Helper: create redirect that preserves supabase session cookies.
  // Without this, any session token refresh done by getUser() is lost
  // when we return a redirect instead of supabaseResponse.
  function redirect(url: URL) {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie);
    });
    return response;
  }

  // Logged-in users visiting "/" go to dashboard
  if (request.nextUrl.pathname === "/" && user) {
    return redirect(new URL("/dashboard", request.url));
  }

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    return redirect(new URL("/dashboard", request.url));
  }

  // Redirect non-logged-in users to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return redirect(redirectUrl);
  }

  // Redirect authenticated users without OAB to complete profile
  // Uses user_metadata from JWT (zero extra latency, no DB query)
  if (
    user &&
    !isPublicRoute &&
    !request.nextUrl.pathname.startsWith("/completar-perfil") &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    !user.user_metadata?.oab &&
    !request.cookies.get("has_oab")?.value
  ) {
    return redirect(new URL("/completar-perfil", request.url));
  }

  return supabaseResponse;
}
