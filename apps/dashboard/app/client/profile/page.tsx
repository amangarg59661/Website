import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Profile (client)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Profile" title="Client profile" subtitle="Your studio at a glance." />
      <EmptyStatePlaceholder
        title="Profile coming soon"
        body="This module lands in sub-project 4. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
