import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSessionUser } from "@/server/session";

// Wist een ongeldig of verouderd sessiecookie en stuurt door naar het inlogscherm.
// Wordt gebruikt door requireUser() als het cookie bestaat maar de gebruiker niet (meer).
// Een geldige sessie blijft staan: anders kan elke site je uitloggen met een link (gewoon uitloggen gaat via signOutAction, POST).
export async function GET() {
  if (await getSessionUser()) redirect("/dashboard");
  await signOut({ redirectTo: "/inloggen?fout=sessie" });
}
