import type { ReactNode } from "react";

// Tekst alleen voor screenreaders (gebruikt de globale .visually-hidden class).
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="visually-hidden">{children}</span>;
}
