import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore: setAll called from a Server Component
          }
        },
      },
    }
  );
}

export async function getServerUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Fast path for pages already covered by the /admin matcher in proxy.ts.
 * The middleware already did a full getUser() round-trip to Supabase's auth
 * server (and already redirected away anyone who isn't the admin) before
 * this ever runs — re-doing that same network call here was pure duplicate
 * latency on every single admin page load and CRUD action. Trust the
 * identity middleware already verified and forwarded via header instead;
 * only fall back to a real check if the header is somehow missing (e.g.
 * this got called from somewhere outside the matcher).
 */
export async function getAdminUser() {
  const headerStore = await headers();
  const id = headerStore.get("x-nl-user-id");
  const email = headerStore.get("x-nl-user-email");
  if (id && email) return { id, email };
  return getServerUser();
}
