import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Cookie writes (session refresh) are captured here first, then replayed
  // onto the final response once — see below.
  let cookiesToForward: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
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
          cookiesToForward = cookiesToSet;
        },
      },
    }
  );

  // Refresh session — this is the one network round-trip to Supabase's auth
  // server for the whole request/response cycle.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Forward the already-verified identity to Server Components via a
  // trusted request header, so pages/layouts downstream (e.g. the admin
  // layout) don't have to make a second, redundant getUser() round-trip
  // just to re-derive who's logged in — that was doubling auth latency on
  // every single admin request. Client-supplied headers with these names
  // are irrelevant: middleware always runs first, and NextResponse.next's
  // `request.headers` fully replaces what downstream code sees.
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set("x-nl-user-id", user.id);
    requestHeaders.set("x-nl-user-email", user.email ?? "");
  } else {
    requestHeaders.delete("x-nl-user-id");
    requestHeaders.delete("x-nl-user-email");
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesToForward.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );

  const { pathname } = request.nextUrl;

  // Protect /admin — must be the admin email
  if (pathname.startsWith("/admin")) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /profile and /checkout — must be logged in
  const authRequired = ["/profile", "/checkout"];
  if (authRequired.some((p) => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from /login
  if (pathname.startsWith("/login") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
