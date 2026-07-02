/**
 * config/app.ts
 * Global, non-visual app configuration. Anything that's a "fact about
 * the product" rather than a design token (theme.ts) or a nav structure
 * (navigation.ts) belongs here.
 */

export const appConfig = {
  name: "RedRank AI",
  tagline: "Explainable AI Hiring Intelligence",
  company: "RedRank AI",
  /** Default route after a successful login. */
  defaultAuthenticatedRoute: "/dashboard",
  /** Route shown when no session exists. */
  loginRoute: "/",
  supportEmail: "support@redrank.ai",
} as const;
