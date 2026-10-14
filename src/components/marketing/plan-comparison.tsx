import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import { Badge, TBody, THead, Table, Td, Th, Tr, VisuallyHidden } from "@/components/kit";
import type { ComparisonGroup, ComparisonValue, Plan } from "@/lib/data/marketing";
import styles from "./plan-comparison.module.scss";

function Value({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className={styles.yes}>
        <Check aria-hidden />
        <VisuallyHidden>Inbegrepen</VisuallyHidden>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className={styles.no}>
        <Minus aria-hidden />
        <VisuallyHidden>Niet inbegrepen</VisuallyHidden>
      </span>
    );
  }
  return <span className={styles.text}>{value}</span>;
}

// Volledige vergelijking per onderdeel; de functiekolom blijft staan als de tabel op mobiel scrollt.
export function PlanComparison({ plans, groups }: { plans: Plan[]; groups: ComparisonGroup[] }) {
  return (
    <Table label="Vergelijking van de abonnementen" minWidth={600} className={styles.table}>
      <THead>
        <Tr>
          <Th className={styles.sticky}>Functie</Th>
          {plans.map((plan) => (
            <Th key={plan.id} align="center" className={clsx(plan.highlighted && styles.highlight)}>
              <span className={styles.planHead}>
                {plan.name}
                {plan.highlighted && (
                  <Badge variant="brand" size="sm">
                    Populair
                  </Badge>
                )}
              </span>
            </Th>
          ))}
        </Tr>
      </THead>
      {groups.map((group) => (
        <TBody key={group.title}>
          <tr className={styles.groupRow}>
            <th scope="colgroup" colSpan={plans.length + 1} className={styles.groupHead}>
              <span className={styles.groupTitle}>{group.title}</span>
            </th>
          </tr>
          {group.rows.map((row) => (
            <Tr key={row.label}>
              <th scope="row" className={clsx(styles.rowHead, styles.sticky)}>
                {row.label}
              </th>
              {plans.map((plan) => (
                <Td key={plan.id} align="center" className={clsx(plan.highlighted && styles.highlight)}>
                  <Value value={row.values[plan.id]} />
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      ))}
    </Table>
  );
}
