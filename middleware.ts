import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/api/webhook/register(.*)",
  "/sign-up(.*)",
  "/sign-in(.*)",
];

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth(); // ✅ `await` is needed

  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    if (userId) {
      // ✅ Fetch user data correctly from Clerk
      const client = await clerkClient()
      const user = await client.users.getUser(userId);
      console.log(user);
      
      const role = user.publicMetadata?.role as string | undefined;

      if (role === "admin" && request.nextUrl.pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      if (role !== "admin" && request.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
