import React, { type ButtonHTMLAttributes, type FC, type ReactNode } from "react";
import clsx from "clsx";

type Variant = "solid" | "outline" | "ghost";
type Tone = "primary" | "neutral" | "danger";
type Size = "sm" | "md" | "lg";
type Width = "auto" | "full" | "half";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  width?: Width;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
}

/**
 * Color tokens are driven by CSS variables set from your `colors.ts`:
 * --color-primary, --color-primaryHover, --color-primaryActive, --color-onPrimary
 * --color-text, --color-textMuted, --color-surface, --color-surfaceMuted, --color-border
 * --color-success, --color-warning, --color-danger
 */
const toneStyles: Record<
  Variant,
  Record<
    Tone,
    {
      base: string;
      hover?: string;
      active?: string;
      focus?: string;
      outline?: string;
      textOverride?: string;
    }
  >
> = {
  solid: {
    primary: {
      base:
        "bg-[var(--color-primary)] text-[var(--color-onPrimary)]",
      hover: "hover:bg-[var(--color-primaryHover)]",
      active: "active:bg-[var(--color-primaryActive)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
    },
    neutral: {
      base:
        "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
    },
    danger: {
      base:
        "bg-[var(--color-danger)] text-[var(--color-onPrimary)]",
      hover: "hover:brightness-95",
      active: "active:brightness-90",
      focus: "focus-visible:ring-[var(--color-danger)]",
    },
  },
  outline: {
    primary: {
      base:
        "border border-[var(--color-primary)] text-[var(--color-primary)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
      outline: "bg-transparent",
    },
    neutral: {
      base:
        "border border-[var(--color-border)] text-[var(--color-text)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
      outline: "bg-transparent",
    },
    danger: {
      base:
        "border border-[var(--color-danger)] text-[var(--color-danger)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-danger)]",
      outline: "bg-transparent",
    },
  },
  ghost: {
    primary: {
      base: "text-[var(--color-primary)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
      outline: "bg-transparent",
    },
    neutral: {
      base: "text-[var(--color-text)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-primary)]",
      outline: "bg-transparent",
    },
    danger: {
      base: "text-[var(--color-danger)]",
      hover: "hover:bg-[var(--color-surfaceMuted)]",
      active: "active:bg-[var(--color-surface)]",
      focus: "focus-visible:ring-[var(--color-danger)]",
      outline: "bg-transparent",
    },
  },
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const widthStyles: Record<Width, string> = {
  auto: "w-auto",
  full: "w-full",
  half: "w-1/2",
};

const common =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold outline-none " +
  "focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed transition";

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

/**
 * Button – supports solid/outline/ghost, tones, sizes, widths, icons, loading.
 */
const Button: FC<ButtonProps> = ({
  variant = "solid",
  tone = "primary",
  size = "md",
  width = "auto",
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  const palette = toneStyles[variant][tone];

  const classes = clsx(
    common,
    sizeStyles[size],
    widthStyles[width],
    palette.outline,
    palette.base,
    palette.hover,
    palette.active,
    palette.focus,
    className
  );

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      {...rest}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <Spinner />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        <>
          {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
          {children}
          {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
        </>
      )}
    </button>
  );
};

export default Button;
