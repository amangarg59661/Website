import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Rule({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("rule", className)} {...props} />;
}

export function RuleStrong({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("rule-strong", className)} {...props} />;
}
