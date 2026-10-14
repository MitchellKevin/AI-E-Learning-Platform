import Link from "next/link";
import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Spinner } from "./spinner";
import styles from "./button.module.scss";

export type ButtonVariant = "primary" | "dark" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Ronde knop met alleen een icoon (geef dan een aria-label mee). */
  iconOnly?: boolean;
  className?: string;
};

// Losse classnames, voor als iets anders (label, summary, trigger) eruit moet zien als een knop.
export function buttonClassName({ variant = "primary", size = "md", fullWidth, iconOnly, className }: StyleOptions = {}) {
  return clsx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  );
}

type BaseProps = StyleOptions & {
  /** Toont een spinner over het label, zet aria-busy en schakelt de knop uit. */
  loading?: boolean;
  /** Icoon vóór het label, bv. `<Mail />`. */
  icon?: ReactNode;
  /** Icoon na het label, bv. `<ArrowRight />`. */
  iconRight?: ReactNode;
  children?: ReactNode;
};

type AsButton = BaseProps & Omit<ComponentPropsWithRef<"button">, keyof BaseProps> & { href?: undefined };
type AsLink = BaseProps & Omit<ComponentPropsWithRef<typeof Link>, keyof BaseProps>;

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant, size, fullWidth, iconOnly, className, loading = false, icon, iconRight, children, ...rest } = props;
  const classes = clsx(
    buttonClassName({ variant, size, fullWidth, iconOnly, className }),
    loading && styles.loading,
  );
  const spinnerSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  const content = (
    <>
      <span className={styles.content}>
        {icon && (
          <span className={styles.icon} aria-hidden>
            {icon}
          </span>
        )}
        {children !== undefined && children !== null && children !== false && (
          <span className={styles.label}>{children}</span>
        )}
        {iconRight && (
          <span className={clsx(styles.icon, styles.iconRight)} aria-hidden>
            {iconRight}
          </span>
        )}
      </span>
      {loading && <Spinner decorative size={spinnerSize} className={styles.spinner} />}
    </>
  );

  if (rest.href !== undefined) {
    const linkProps = rest as Omit<AsLink, keyof BaseProps>;
    return (
      <Link {...linkProps} className={classes} aria-busy={loading || undefined}>
        {content}
      </Link>
    );
  }

  const { type = "button", disabled, ...buttonProps } = rest as Omit<AsButton, keyof BaseProps>;
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}

export type IconButtonProps = Omit<AsButton, "children" | "iconOnly" | "iconRight" | "icon"> & {
  /** Toegankelijke naam, ook als tooltip getoond. */
  label: string;
  icon: ReactNode;
};

// Ronde knop met alleen een icoon; standaard de rustige omlijnde variant.
export function IconButton({ label, icon, variant = "secondary", title, ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} iconOnly icon={icon} aria-label={label} title={title ?? label} />;
}
