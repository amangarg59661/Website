"use client";
import { useRef, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react";

export function TotpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6).slice(0, 6).split("");

  function setDigit(i: number, d: string) {
    const arr = digits.slice();
    arr[i] = d;
    onChange(arr.join("").trim());
    if (d && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    };
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D+/gu, "").slice(0, 6);
    onChange(text);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  function onCellChange(i: number) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D+/gu, "").slice(0, 1);
      setDigit(i, v);
    };
  }

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={(digits[i] ?? "").trim()}
          onChange={onCellChange(i)}
          onKeyDown={onKey(i)}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-10 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-transparent text-center text-lg font-medium focus:border-[var(--color-ink)] focus:outline-none"
        />
      ))}
    </div>
  );
}
