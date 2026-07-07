import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Users (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Users" title="Staff users" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Users coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
