import type { HTMLAttributes } from "react";
import { cn } from "@edss/utils/cn";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article" | "footer" | "header";
  size?: "sm" | "md" | "lg";
  ink?: boolean;
  labelledBy?: string;
};

export function Section({
  as: Tag = "section",
  size = "md",
  ink,
  labelledBy,
  className,
  ...props
}: Props) {
  const pad = size === "sm" ? "py-16 md:py-20" : size === "lg" ? "stack-lg" : "stack";
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(pad, ink && "on-ink", "relative", className)}
      {...props}
    />
  );
}
