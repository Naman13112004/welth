import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:VERCEL",
        "CATEGORY:AI",
        "GO_HTTP",
      ],
    }),
  ],
});

export default createMiddleware(aj);

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|woff2?|ttf|webp|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
