import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 shadow-[var(--shadow-xs)] disabled:bg-accent-600/40",
  secondary:
    "bg-surface-raised text-text-primary border border-border-strong hover:bg-surface-hover hover:border-border-strong disabled:opacity-40",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-40",
  danger:
    "bg-error-500 text-white hover:bg-error-500/90 active:bg-error-500/80 disabled:bg-error-500/40",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconPosition = "left",
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-(--radius-md) font-medium",
          "transition-colors duration-(--duration-base) ease-(--ease-out-smooth)",
          "disabled:cursor-not-allowed select-none whitespace-nowrap",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          icon && iconPosition === "left" && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children}
        {!isLoading && icon && iconPosition === "right" && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
