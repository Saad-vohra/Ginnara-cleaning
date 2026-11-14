import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Official Ginnara Cleaning Service London logo (transparent PNG/WebP, 2000×1455) */
export const LOGO_SRC = "/ginnara-logo.webp";

export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src={LOGO_SRC} alt="Ginnara Cleaning Service London" width={2000} height={1455} priority={priority} className={cn("h-12 w-auto", className)} />;
}

export function Logo({ className, imgClassName, href = "/" }: { className?: string; imgClassName?: string; light?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label="Ginnara Cleaning Service — home" className={cn("inline-flex shrink-0 items-center", className)}>
      <LogoMark priority className={cn("h-14 w-auto lg:h-[68px]", imgClassName)} />
    </Link>
  );
}
