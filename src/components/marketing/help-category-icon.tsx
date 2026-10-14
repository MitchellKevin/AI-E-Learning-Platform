import { Receipt, Rocket, Route, ShieldCheck, Users, type LucideProps } from "lucide-react";
import type { HelpIconName } from "@/lib/data/help";

const icons = { rocket: Rocket, route: Route, users: Users, shield: ShieldCheck, receipt: Receipt };

export function HelpCategoryIcon({ name, ...props }: { name: HelpIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon aria-hidden {...props} />;
}
