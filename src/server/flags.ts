// Vlaggen die ook in tests en scripts te lezen zijn (zonder server-only).

/** Demo-login: alleen met DEMO_LOGIN=true, en in productie alleen als DEMO_LOGIN_IN_PRODUCTION=true er ook staat. */
export function demoLoginEnabled() {
  if (process.env.DEMO_LOGIN !== "true") return false;
  return process.env.NODE_ENV !== "production" || process.env.DEMO_LOGIN_IN_PRODUCTION === "true";
}
