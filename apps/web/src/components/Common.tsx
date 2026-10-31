import React from "react";

export function StatusDot({ active = true, label }: { active?: boolean; label?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-text-dim">
      <span
        className={`w-2 h-2 rounded-full ${
          active
            ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            : "bg-text-faint"
        }`}
      />
      {label && <span>{label}</span>}
    </div>
  );
}

export function Pill({
  children,
  variant = "default",
  icon,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "outline" | "active";
  icon?: React.ReactNode;
}) {
  const styles = {
    default: "bg-panel-2 border border-border text-text-dim",
    primary: "bg-primary-bg border border-primary text-primary-soft",
    success: "bg-success-bg border border-success/30 text-success",
    outline: "bg-transparent border border-primary/50 text-primary-soft",
    active: "bg-primary text-white",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${styles}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizes = {
    sm: "h-[32px] px-3 text-xs rounded-sm",
    md: "h-[40px] px-4 text-sm rounded-[10px]",
    lg: "h-[46px] px-6 text-md rounded-[10px]",
  }[size];

  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-white shadow-sm",
    secondary: "bg-panel-2 hover:bg-hover border border-border text-text",
    ghost: "bg-transparent hover:bg-hover text-text-dim hover:text-text",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
  title,
  subtitle,
  headerRight,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-panel border border-border rounded-lg p-4 flex flex-col ${className}`}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-3.5">
          <div>
            {title && (
              <h3 className="text-md font-semibold text-text tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-text-dim mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center justify-between cursor-pointer py-1.5 w-full">
      {label && <span className="text-sm text-text-dim">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-panel-2 border border-border"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="text-xs text-text-dim font-medium">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-panel-2 border border-border text-text rounded-[8px] h-[36px] px-3 text-xs focus:outline-none focus:border-primary cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-panel text-text">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
