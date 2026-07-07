import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Files (client)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Files" title="Client files" subtitle="Your studio at a glance." />
      <EmptyStatePlaceholder
        title="Files coming soon"
        body="This module lands in sub-project 4. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
