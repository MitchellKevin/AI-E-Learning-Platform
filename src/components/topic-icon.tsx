import {
  Accessibility,
  Briefcase,
  Bug,
  Code,
  Cpu,
  Database,
  Image,
  Lightbulb,
  LineChart,
  MessageSquare,
  Network,
  PenTool,
  Plug,
  Scale,
  Shield,
  Sparkles,
  Terminal,
  Users,
  type LucideProps,
} from "lucide-react";
import type { TopicIcon as TopicIconName } from "@/lib/types";

const icons = {
  cpu: Cpu,
  sparkles: Sparkles,
  terminal: Terminal,
  briefcase: Briefcase,
  scale: Scale,
  users: Users,
  lightbulb: Lightbulb,
  image: Image,
  "pen-tool": PenTool,
  "message-square": MessageSquare,
  accessibility: Accessibility,
  code: Code,
  bug: Bug,
  plug: Plug,
  database: Database,
  network: Network,
  "line-chart": LineChart,
  shield: Shield,
} satisfies Record<TopicIconName, React.ComponentType<LucideProps>>;

export function TopicIcon({ name, ...props }: { name: TopicIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon {...props} />;
}
