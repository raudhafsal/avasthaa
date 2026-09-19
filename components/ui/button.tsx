"use client";

import { forwardRef } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-ocean-900 text-white hover:bg-ocean-800 active:bg-ocean-950 disabled:bg-ocean-300",
  secondary: "bg-lagoon-500 text-white hover:bg-lagoon-600 active:bg-lagoon-700 disabled:bg-lagoon-200",
  ghost: "bg-transparent text-ocean-900 hover:bg-sand-200 disabled:text-ink-300",
  danger: "bg-coral-500 text-white hover:bg-coral-600 disabled:bg-coral-200",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", fullWidth = true, loading, className, children, disabled, type = "button", ...props },
  ref,
) {
  const { pending } = useFormStatus();
  // Only the submit button of the form actually in flight should show a
  // spinner; a `loading` prop lets non-form buttons (e.g. an OTP resend
  // with its own async handler) opt in explicitly.
  const isBusy = loading || (type === "submit" && pending);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isBusy}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-pill px-6 py-3 text-base font-semibold transition-colors",
        "min-h-touch disabled:cursor-not-allowed",
        fullWidth && "w-full",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {isBusy && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
