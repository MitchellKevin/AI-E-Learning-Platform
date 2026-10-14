import { BookOpen, LayoutDashboard, Sparkles, Trophy } from "lucide-react";

// Hoofdnavigatie; gedeeld door de desktopnav en het mobiele menu.
export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/leerpaden", label: "Leerpaden", icon: <BookOpen /> },
  { href: "/oefenen", label: "Oefenen", icon: <Sparkles /> },
  { href: "/leaderboard", label: "Leaderboard", icon: <Trophy /> },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
