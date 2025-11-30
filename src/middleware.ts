import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/account(.*)",
    "/transaction(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    if (!userId && isProtectedRoute(req)) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/dashboard(.*)",
        "/account(.*)",
        "/transaction(.*)",
        "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|woff2?|ttf|webp|ico)).*)",
        "/(api|trpc)(.*)",
    ],
};
