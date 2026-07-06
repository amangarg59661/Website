export type WebsiteEvent =
  | {
      name: "contact_form_submitted";
      props: { topic: string; source_page: string };
    }
  | { name: "whatsapp_cta_clicked"; props: { source_page: string } }
  | { name: "portfolio_case_opened"; props: { slug: string } }
  | { name: "service_detail_opened"; props: { slug: string } }
  | { name: "journal_post_opened"; props: { slug: string } };

export type EventName = WebsiteEvent["name"];

export type EventPropsFor<N extends EventName> = Extract<
  WebsiteEvent,
  { name: N }
>["props"];
