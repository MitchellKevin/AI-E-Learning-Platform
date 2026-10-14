import {
  Braces,
  Code,
  FileText,
  FlaskConical,
  Lightbulb,
  MessageSquareWarning,
  NotebookPen,
  Palette,
  Sparkles,
  type LucideProps,
} from "lucide-react";
import type { PracticeIcon as PracticeIconName } from "@/lib/data/practice";

const icons = {
  "file-text": FileText,
  notebook: NotebookPen,
  code: Code,
  flask: FlaskConical,
  lightbulb: Lightbulb,
  braces: Braces,
  message: MessageSquareWarning,
  palette: Palette,
  sparkles: Sparkles,
} satisfies Record<PracticeIconName, React.ComponentType<LucideProps>>;

export function PracticeIcon({ name, ...props }: { name: PracticeIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon aria-hidden {...props} />;
}
