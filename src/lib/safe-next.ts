// Alleen interne paden als doel na het inloggen: geen open redirect via ?next=.
export function safeNext(next: unknown, fallback = "/dashboard") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  try {
    // Wat als pad begint maar toch naar een ander domein wijst (bv. "/%2F%2Fevil.com" na decodering), weigeren.
    const url = new URL(next, "https://intern.invalid");
    if (url.origin !== "https://intern.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
