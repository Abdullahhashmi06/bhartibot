import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/internships", "/applicant"];
const AUTH_PAGES = ["/login", "/signup", "/applicant-auth"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  
  const isApplicantPath = pathname.startsWith("/applicant") && pathname !== "/applicant-auth";
  const isDashboardPath = pathname.startsWith("/dashboard") || pathname.startsWith("/internships") || pathname.startsWith("/talent-pool");
  
  const isProtected = isApplicantPath || isDashboardPath;
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !user) {
    const redirectUrl = new URL(isApplicantPath ? "/applicant-auth" : "/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtected && user) {
    // Check if user has an applicant role
    const { data: profile } = await supabase
      .from("applicant_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    
    const hasProfile = !!profile;
    const isApplicant = profile?.role === "applicant";

    // If on recruiter pages but user is an applicant → redirect to applicant portal
    if (isApplicant && isDashboardPath) {
      return NextResponse.redirect(new URL("/applicant", request.url));
    }
    
    // If on applicant pages
    if (isApplicantPath) {
      // User has a profile with non-applicant role → redirect to dashboard
      if (hasProfile && !isApplicant) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // If no profile exists yet (just signed up), let them through
      // The layout will auto-create the profile
      // This prevents a redirect loop during signup
      if (!hasProfile) {
        // Allow through - layout will create profile
        return response;
      }
    }
  }

  if (isAuthPage && user) {
    const { data: profile } = await supabase
      .from("applicant_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    
    if (profile?.role === "applicant") {
      return NextResponse.redirect(new URL("/applicant", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude static assets, PWA files, and public images from middleware
    "/((?!_next/static|_next/image|favicon.ico|favicon-.*|apple-touch-icon.*|manifest.webmanifest|sw.js|offline|icons/|splash/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
