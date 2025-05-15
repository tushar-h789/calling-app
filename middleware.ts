import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // const token = request.cookies.get("token")?.value;
  // const token = localStorage.getItem("token");
  // console.log("token", token);

  // Protected routes that require authentication
  // const protectedRoutes = ["/dashboard", "/call"];

  // Check if the current path is a protected route
  // const isProtectedRoute = protectedRoutes.some((route) =>
  //   request.nextUrl.pathname.startsWith(route)
  // );

  // Redirect to login if accessing protected route without token
  // if (isProtectedRoute && !token) {
  //   console.log("isProtectedRoute", isProtectedRoute);
  //   console.log("token", token);

  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  // Redirect to dashboard if already logged in and trying to access login page
  // if (request.nextUrl.pathname === "/" && token) {
  //   return NextResponse.redirect(new URL("/dashboard", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
