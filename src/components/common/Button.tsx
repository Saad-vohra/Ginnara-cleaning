import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "outline" | "ghost" | "light" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-gradient text-white shadow-[0_8px_20px_-8px_rgb(242_96_43/0.7)] hover:brightness-105 hover:shadow-[0_12px_26px_-8px_rgb(242_96_43/0.75)]",
  dark: "bg-ink text-white hover:bg-black",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "text-ink hover:bg-cream",
  light: "bg-white text-ink shadow-soft hover:shadow-lift",
  danger: "bg-danger text-white hover:brightness-95",
  soft: "bg-cream text-ink hover:bg-[#f2e2cf]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none";

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

type ButtonProps = Common & ComponentProps<"button"> & { loading?: boolean };

export function Button({ variant = "primary", size = "md", className, children, loading, icon, iconRight, disabled, ...rest }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

type LinkButtonProps = Common & Omit<ComponentProps<typeof Link>, "className" | "children">;

export function LinkButton({ variant = "primary", size = "md", className, children, icon, iconRight, ...rest }: LinkButtonProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
