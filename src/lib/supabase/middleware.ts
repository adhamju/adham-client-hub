import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function setupPage(title: string, lines: string[]) {
  const body = [title, "", ...lines].join("\n");
  return new NextResponse(body, {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Friendly setup check instead of a blank 500 when variables are missing.
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length) {
    return setupPage("SETUP: missing environment variables", [
      "These variables are empty in the deployed site:",
      ...missing.map((m) => " - " + m),
      "",
      "Add them in Cloudflare (Settings > Variables and Secrets), then press Retry deployment.",
      "They must exist BEFORE the build starts, because Next.js bakes NEXT_PUBLIC_ values in at build time.",
    ]);
  }

  try {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(url!, anon!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isProtectedRoute = path.startsWith("/admin") || path.startsWith("/client");

    if (!user && isProtectedRoute) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      return NextResponse.redirect(to);
    }

    if (user && path === "/login") {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const to = request.nextUrl.clone();
      to.pathname = profile?.role === "admin" ? "/admin" : "/client";
      return NextResponse.redirect(to);
    }

    return response;
  } catch (e) {
    return setupPage("SETUP: the site could not reach Supabase", [
      "Error: " + (e instanceof Error ? e.message : String(e)),
      "",
      "Check that NEXT_PUBLIC_SUPABASE_URL starts with https:// and ends with .supabase.co (no slash at the end),",
      "and that the anon key was copied completely.",
    ]);
  }
}
