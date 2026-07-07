import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Reports (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Reports" title="Staff reports" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Reports coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
