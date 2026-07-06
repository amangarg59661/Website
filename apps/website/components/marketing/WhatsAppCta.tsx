import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/contact/whatsapp";

export function WhatsAppCta({ label = "Message on WhatsApp" }: { label?: string }) {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="kicker link-underline inline-flex items-center gap-3 text-[var(--color-ink)] uppercase"
    >
      <MessageCircle aria-hidden className="h-4 w-4 text-[var(--color-gold-2)]" />
      {label}
    </a>
  );
}
