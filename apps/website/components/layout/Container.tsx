import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = HTMLAttributes<HTMLDivElement> & { wide?: boolean; reading?: boolean };

export function Container({ wide, reading, className, ...props }: Props) {
  return (
    <div
      className={cn(
        wide ? "container-wide" : reading ? "container-reading" : "container-edss",
        className,
      )}
      {...props}
    />
  );
}
