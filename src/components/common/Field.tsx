import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-2xl border-[1.5px] border-line bg-white px-4 text-[15px] text-ink placeholder:text-muted/80 transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:bg-cream-2 disabled:text-muted";

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}

export function FieldWrap({ label, error, hint, htmlFor, children, className, optional }: FieldWrapProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label} {optional && <span className="font-normal text-muted">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { label?: string; error?: string; hint?: string; optional?: boolean; wrapClassName?: string; leading?: ReactNode };

export function Input({ label, error, hint, optional, wrapClassName, className, id, leading, ...rest }: InputProps) {
  const fid = id ?? rest.name;
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={fid} className={wrapClassName} optional={optional}>
      <div className="relative">
        {leading && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">{leading}</span>}
        <input
          id={fid}
          aria-invalid={!!error}
          className={cn(control, "h-12", leading ? "pl-11" : "", error && "border-danger focus:border-danger focus:ring-danger/10", className)}
          {...rest}
        />
      </div>
    </FieldWrap>
  );
}

type TextareaProps = ComponentProps<"textarea"> & { label?: string; error?: string; hint?: string; optional?: boolean; wrapClassName?: string };

export function Textarea({ label, error, hint, optional, wrapClassName, className, id, ...rest }: TextareaProps) {
  const fid = id ?? rest.name;
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={fid} className={wrapClassName} optional={optional}>
      <textarea id={fid} aria-invalid={!!error} className={cn(control, "min-h-28 py-3", error && "border-danger", className)} {...rest} />
    </FieldWrap>
  );
}

type SelectProps = ComponentProps<"select"> & { label?: string; error?: string; hint?: string; wrapClassName?: string; options: { value: string; label: string }[]; placeholder?: string };

export function Select({ label, error, hint, wrapClassName, className, id, options, placeholder, ...rest }: SelectProps) {
  const fid = id ?? rest.name;
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={fid} className={wrapClassName}>
      <select
        id={fid}
        aria-invalid={!!error}
        className={cn(
          control,
          "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%232a2725%22 stroke-width=%223%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10",
          error && "border-danger",
          className,
        )}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; error?: string; description?: string };

export function Checkbox({ label, error, description, className, id, ...rest }: CheckboxProps) {
  const fid = id ?? rest.name;
  return (
    <div className={className}>
      <label htmlFor={fid} className="group flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 inline-flex">
          <input id={fid} type="checkbox" className="peer size-5 cursor-pointer appearance-none rounded-md border-[1.5px] border-line bg-white transition checked:border-ink checked:bg-ink" {...rest} />
          <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
        </span>
        <span className="text-sm leading-snug text-ink-soft">
          {label}
          {description && <span className="block text-[13px] text-muted">{description}</span>}
        </span>
      </label>
      {error && <p className="mt-1 pl-8 text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-2xl py-2 text-left">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-[13px] text-muted">{description}</span>}
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-success" : "bg-line")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}
