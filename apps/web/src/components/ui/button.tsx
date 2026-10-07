import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "brand" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-background hover:opacity-90 shadow-xs active:scale-[0.98]",
  brand:
    "bg-brand text-white hover:opacity-90 shadow-sm active:scale-[0.98]",
  secondary:
    "bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-elevated",
  outline:
    "border border-border text-text-primary hover:bg-surface-elevated",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm gap-2",
  md: "h-11 px-5 text-base gap-2",
  lg: "h-12 px-8 text-lg gap-2.5",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
