import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import styles from "./table.module.scss";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Toegankelijke naam van de scrollregio en tabel, bv. "Teamleden". */
  label: string;
  /** Zichtbaar bijschrift boven de tabel; anders alleen voor screenreaders. */
  caption?: ReactNode;
  /** Minimale breedte; daaronder scrollt de tabel horizontaal (standaard 640). */
  minWidth?: number;
  /** Zonder kaartrand, bv. als de tabel al in een Card staat. */
  bare?: boolean;
  /** Class op de scrollcontainer; `className` gaat naar de tabel. */
  containerClassName?: string;
};

export function Table({
  label,
  caption,
  minWidth = 640,
  bare,
  className,
  containerClassName,
  children,
  style,
  ...props
}: TableProps) {
  return (
    // Focusbaar zodat de tabel ook met het toetsenbord horizontaal te scrollen is.
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={clsx(styles.container, bare && styles.bare, containerClassName)}
    >
      <table {...props} style={{ minWidth, ...style }} className={clsx(styles.table, className)}>
        <caption className={clsx(styles.caption, !caption && "visually-hidden")}>{caption ?? label}</caption>
        {children}
      </table>
    </div>
  );
}

export function THead({ className, ...props }: ComponentPropsWithRef<"thead">) {
  return <thead {...props} className={clsx(styles.thead, className)} />;
}

export function TBody({ className, ...props }: ComponentPropsWithRef<"tbody">) {
  return <tbody {...props} className={clsx(styles.tbody, className)} />;
}

export function TFoot({ className, ...props }: ComponentPropsWithRef<"tfoot">) {
  return <tfoot {...props} className={clsx(styles.tfoot, className)} />;
}

export type TrProps = ComponentPropsWithRef<"tr"> & {
  /** Licht gemarkeerd, bv. geselecteerde rij of "jij" in een ranglijst. */
  selected?: boolean;
};

export function Tr({ selected, className, ...props }: TrProps) {
  return <tr {...props} className={clsx(styles.tr, selected && styles.selected, className)} />;
}

type Align = "start" | "center" | "end";
export type SortDirection = "asc" | "desc" | false;

export type ThProps = Omit<ComponentPropsWithRef<"th">, "align"> & {
  align?: Align;
  /** Maakt de kop sorteerbaar: false = sorteerbaar maar nu niet gesorteerd. */
  sort?: SortDirection;
  /** Klik op een sorteerbare kop (alleen in client components). */
  onSort?: () => void;
  /** Smalle kolom die niet meegroeit, bv. voor een checkbox of menu. */
  shrink?: boolean;
};

export function Th({ align = "start", sort, onSort, shrink, scope = "col", className, children, ...props }: ThProps) {
  const sortable = sort !== undefined;
  const ariaSort = sort === "asc" ? "ascending" : sort === "desc" ? "descending" : sortable ? "none" : undefined;
  const SortIcon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <th
      {...props}
      scope={scope}
      aria-sort={ariaSort}
      className={clsx(styles.th, styles[align], shrink && styles.shrink, className)}
    >
      {sortable ? (
        <button type="button" onClick={onSort} className={clsx(styles.sortButton, sort && styles.sorted)}>
          {children}
          <SortIcon aria-hidden className={styles.sortIcon} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type TdProps = Omit<ComponentPropsWithRef<"td">, "align"> & {
  align?: Align;
  /** Tabulaire cijfers, rechts uitgelijnd. */
  numeric?: boolean;
  /** Rustigere tekstkleur voor bijzaken (datum, e-mail). */
  muted?: boolean;
  shrink?: boolean;
};

export function Td({ align, numeric, muted, shrink, className, ...props }: TdProps) {
  return (
    <td
      {...props}
      className={clsx(
        styles.td,
        styles[align ?? (numeric ? "end" : "start")],
        numeric && styles.numeric,
        muted && styles.muted,
        shrink && styles.shrink,
        className,
      )}
    />
  );
}
