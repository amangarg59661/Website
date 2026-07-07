import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Settings (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Settings" title="Staff settings" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Settings coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
