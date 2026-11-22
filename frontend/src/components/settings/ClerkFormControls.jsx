import { ChevronDown } from "lucide-react";

/**
 * ClerkSelect - Native Clerk-styled dropdown control
 */
export function ClerkSelect({
  value,
  onChange,
  disabled = false,
  options = [],
  className = "",
  minWidth = "min-w-[140px]",
  ariaLabel,
}) {
  return (
    <div className={`relative inline-flex items-center shrink-0 self-start sm:self-auto ${className}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`appearance-none h-8 pl-3 pr-8 rounded-lg bg-surface-hover hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-border text-[12.5px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors cursor-pointer disabled:opacity-50 text-left ${minWidth}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-foreground py-1">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}

/**
 * ClerkSwitch - Native Clerk-styled toggle switch
 */
export function ClerkSwitch({ checked, onChange, disabled = false, id, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:opacity-50 ${
        checked ? "bg-[var(--accent,#5e6ad2)]" : "bg-black/15 dark:bg-white/15"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs absolute top-0.75 transition-transform ${
          checked ? "translate-x-4.5" : "translate-x-0.75"
        }`}
      />
    </button>
  );
}

/**
 * ClerkRow - Native Clerk-styled divided setting row
 */
export function ClerkRow({
  title,
  description,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div className="space-y-0.5 max-w-sm">
        <span className="text-[13px] font-medium text-foreground block">
          {title} {required && <span className="text-red-500">*</span>}
        </span>
        {description && (
          <span className="text-[11.5px] text-text-muted block leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

/**
 * ClerkSection - Native Clerk-styled subsection with hairline divider
 */
export function ClerkSection({
  title,
  description,
  children,
  className = "",
  headerAction,
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {(title || description || headerAction) && (
        <div className="pt-3 pb-2 flex items-center justify-between">
          <div>
            {title && (
              <h4 className="text-[13px] font-semibold text-foreground">
                {title}
              </h4>
            )}
            {description && (
              <p className="text-[11.5px] text-text-muted mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className="divide-y divide-border-subtle border-t border-b border-border-subtle">
        {children}
      </div>
    </div>
  );
}

/**
 * ClerkCard - Native Clerk-styled content card
 */
export function ClerkCard({
  title,
  description,
  badge,
  children,
  className = "",
}) {
  return (
    <div className={`border border-border bg-surface rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-colors ${className}`}>
      {(title || description || badge) && (
        <div className="pb-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

