import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Bypass middleware for auth routes — getUser() can interfere with cookies:
  // - /auth/callback: PKCE verifier must reach the handler untouched
  // - /auth/signout: server-side signOut must clear cookies without getUser() re-setting them
  if (
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/auth/signout")
  ) {
    return NextResponse.next();
  }

  // Apple OAuth redirects to "/" instead of "/auth/callback" because Apple
  // uses response_mode=form_post, causing Supabase to fall back to the Site URL.
  // Intercept here BEFORE updateSession()/getUser() to preserve the PKCE verifier cookie.
  if (request.nextUrl.pathname === "/") {
    const { searchParams } = request.nextUrl;
    if (searchParams.has("code") || searchParams.has("error")) {
      const callbackUrl = new URL("/auth/callback", request.url);
      callbackUrl.search = request.nextUrl.search;
      return NextResponse.redirect(callbackUrl);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/signout|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
