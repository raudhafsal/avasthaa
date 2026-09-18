"use client";

import { useRef, useState } from "react";

const LENGTH = 6;

export function OtpInput({ name, error }: { name: string; error?: string }) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-2" dir="ltr">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            aria-invalid={!!error}
            className="h-14 w-11 flex-1 rounded-2xl border border-sand-200 bg-white text-center text-2xl font-semibold text-ink-900 outline-none focus:border-ocean-500"
          />
        ))}
      </div>
      <input type="hidden" name={name} value={digits.join("")} />
      {error && (
        <p role="alert" className="text-sm text-coral-600">
          {error}
        </p>
      )}
    </div>
  );
}
