import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route prefixes that require a signed-in session, and (for the two
 * back-office areas) a specific role fetched from `profiles.role`.
 * Client-side hiding of nav items is cosmetic only — this is the actual
 * enforcement point, backed again by RLS at the database layer.
 */
const ROLE_GATED_PREFIXES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["administrator", "super_administrator"] },
  { prefix: "/business", roles: ["staff", "administrator", "super_administrator"] },
  { prefix: "/partner", roles: ["delivery_partner"] },
];

const AUTH_REQUIRED_PREFIXES = [
  "/orders",
  "/wallet",
  "/favorites",
  "/profile",
  "/profile-setup",
  "/checkout",
];

// Exact-segment match so "/profile" doesn't also swallow an unrelated
// future route like "/profile-picker"; "/profile-setup" is listed
// explicitly above since it's a distinct segment, not a sub-path of "/profile".
function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const gated = ROLE_GATED_PREFIXES.find((g) => matchesPrefix(path, g.prefix));
  const needsAuthOnly = AUTH_REQUIRED_PREFIXES.some((p) => matchesPrefix(path, p));

  if ((gated || needsAuthOnly) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  if (gated && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.account_status !== "active" || !gated.roles.includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images, and the manifest/
     * service worker, so session refresh happens on every navigable route.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/).*)",
  ],
};
