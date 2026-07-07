import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Tickets (client)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Tickets" title="Client tickets" subtitle="Your studio at a glance." />
      <EmptyStatePlaceholder
        title="Tickets coming soon"
        body="This module lands in sub-project 4. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
