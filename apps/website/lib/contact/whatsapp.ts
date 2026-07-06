import { site } from "@/config/site";

export function whatsappUrl(message?: string) {
  const number = site.contact.whatsapp.replace(/[^\d]/g, "");
  const text = encodeURIComponent(message ?? site.contact.whatsappMessage);
  return `https://wa.me/${number}?text=${text}`;
}
