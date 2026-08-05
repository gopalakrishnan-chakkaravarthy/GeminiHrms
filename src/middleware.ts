import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_PROVIDER = (
  process.env.NEXT_PUBLIC_AUTH_PROVIDER ||
  process.env.AUTH_PROVIDER ||
  "custom"
).toLowerCase();

const JWT_SECRET_STRING = process.env.JWT_SECRET || "absence-ace-jwt-secret-key-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. If Clerk provider is explicitly configured, delegate to Clerk middleware
  if (AUTH_PROVIDER === "clerk") {
    try {
      const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
      const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
      return clerkMiddleware(async (auth, request) => {
        if (isProtectedRoute(request)) {
          try {
            const authObj = await auth();
            authObj.protect();
          } catch {
            // Allow fallback if Clerk auth fails
          }
        }
      })(req, {} as any);
    } catch {
      // Fallback to custom token check if Clerk dynamic import fails
    }
  }

  // 2. Custom Authentication Middleware
  const authToken = req.cookies.get("auth_token")?.value;
  let isValidToken = false;

  if (authToken) {
    try {
      await jwtVerify(authToken, JWT_SECRET);
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  const isProtectedPath = pathname.startsWith("/dashboard");
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // Redirect unauthenticated user trying to access /dashboard
  if (isProtectedPath && !isValidToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user away from login/sign-in pages
  if (isAuthPath && isValidToken) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
