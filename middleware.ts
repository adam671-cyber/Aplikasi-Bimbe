import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSupabaseConfig } from "@/lib/supabase/config";

const COOKIE_NAME = "tka_session";

function secretKey() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-only-secret-change-me-please-32chars-minimum"
  );
}

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/latihan",
  "/tryout",
  "/materi",
  "/riwayat",
  "/ujian",
  "/hasil",
  "/profil",
  "/tutor",
  "/admin",
];

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const supabaseConfig = getSupabaseConfig();

  if (supabaseConfig) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    // Selalu panggil getUser agar cookie sesi di-refresh, termasuk untuk
    // endpoint /api (autosave ujian) yang tidak melakukan redirect.
    const { data } = await supabase.auth.getUser();
    if (isProtected && !data.user) return loginRedirect(request, pathname);
    return response;
  }

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    const role = payload.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    if (
      pathname.startsWith("/tutor") &&
      role !== "TUTOR" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return NextResponse.next();
  } catch {
    return loginRedirect(request, pathname);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
