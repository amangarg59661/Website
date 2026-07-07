"use client";
import { Checkbox } from "@edss/ui/checkbox";

export function RememberMeCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      Remember me on this device
    </label>
  );
}
