import { forwardRef, useId } from "react";
import { clsx } from "clsx";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leadingText?: string; // e.g. "+960" for phone fields
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, leadingText, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <div
        className={clsx(
          "flex items-center overflow-hidden rounded-2xl border bg-white transition-colors",
          error ? "border-coral-500" : "border-sand-200 focus-within:border-ocean-500",
        )}
      >
        {leadingText && (
          <span className="ltr-number border-r border-sand-200 px-3 py-3 text-ink-500">
            {leadingText}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={clsx(
            "w-full bg-transparent px-4 py-3 text-base text-ink-900 outline-none placeholder:text-ink-300",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-coral-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
