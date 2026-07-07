import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Sales (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Sales" title="Staff sales" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Sales coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
