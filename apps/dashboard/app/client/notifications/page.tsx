import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Notifications (client)" };
export default function Page() {
  return (
    <>
      <PageHeader
        kicker="Notifications"
        title="Client notifications"
        subtitle="Your studio at a glance."
      />
      <EmptyStatePlaceholder
        title="Notifications coming soon"
        body="This module lands in sub-project 4. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
