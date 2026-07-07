import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Invoices (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Invoices" title="Staff invoices" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Invoices coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
