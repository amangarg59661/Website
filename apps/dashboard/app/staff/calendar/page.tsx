import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Calendar (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Calendar" title="Staff calendar" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Calendar coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
