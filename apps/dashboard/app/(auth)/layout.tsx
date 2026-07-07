import type { ReactNode } from "react";
import { Wordmark } from "@edss/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-[6fr_4fr]">
      <section className="flex flex-col justify-between p-8 lg:p-14">
        <Wordmark className="h-6 w-auto text-[var(--color-ink)]" />
        <div className="mx-auto w-full max-w-[420px]">{children}</div>
        <p className="text-xs text-[var(--color-muted)]">
          © {new Date().getFullYear()} Elite Digital Solutions Studio.
        </p>
      </section>
      <aside aria-hidden className="hidden bg-[var(--color-ink)] lg:block">
        <div className="flex h-full items-center justify-center p-14">
          <p className="max-w-[28ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] leading-tight text-[var(--color-paper)]">
            Operate the studio. See the whole of it.
          </p>
        </div>
      </aside>
    </main>
  );
}
