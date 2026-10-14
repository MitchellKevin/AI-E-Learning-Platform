"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/kit";
import { YEARLY_DISCOUNT, type BillingPeriod } from "@/lib/data/marketing";

type BillingPeriodContextValue = {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
};

const BillingPeriodContext = createContext<BillingPeriodContextValue | null>(null);

// Gedeelde betaalperiode voor de prijskaarten en de rekenhulp op /prijzen.
export function BillingPeriodProvider({
  defaultPeriod = "jaar",
  children,
}: {
  defaultPeriod?: BillingPeriod;
  children: ReactNode;
}) {
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);
  return <BillingPeriodContext.Provider value={{ period, setPeriod }}>{children}</BillingPeriodContext.Provider>;
}

export function useBillingPeriod() {
  const ctx = useContext(BillingPeriodContext);
  if (!ctx) throw new Error("useBillingPeriod hoort binnen een BillingPeriodProvider.");
  return ctx;
}

const options = [
  { value: "maand" as const, label: "Maandelijks" },
  { value: "jaar" as const, label: "Jaarlijks", badge: `−${Math.round(YEARLY_DISCOUNT * 100)}%` },
];

export function BillingPeriodToggle({
  size = "md",
  fullWidth,
  className,
}: {
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}) {
  const { period, setPeriod } = useBillingPeriod();
  return (
    <SegmentedControl<BillingPeriod>
      label="Betaalperiode"
      options={options}
      value={period}
      onValueChange={setPeriod}
      size={size}
      fullWidth={fullWidth}
      className={className}
    />
  );
}
