import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "soft" | "ghost" | "danger" | "line";
};

const tones: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary: "bg-teal text-card",
  soft: "bg-teal-soft text-teal",
  ghost: "bg-transparent text-ink",
  danger: "bg-transparent text-danger",
  line: "border border-line bg-card text-ink",
};

export function Button({ tone = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition-opacity disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-semibold text-ink">{children}</span>;
}

export function Chip({
  active,
  children,
  onClick,
  className = "",
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full px-3.5 text-sm font-semibold ${
        active ? "bg-teal text-card" : "border border-line bg-card text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-line bg-card text-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}
