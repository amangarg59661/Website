import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyStatePlaceholder } from "@/components/shell/EmptyStatePlaceholder";
export const metadata = { title: "Audit logs (staff)" };
export default function Page() {
  return (
    <>
      <PageHeader kicker="Audit logs" title="Staff audit-logs" subtitle="Operate the studio." />
      <EmptyStatePlaceholder
        title="Audit logs coming soon"
        body="This module lands in sub-project 5. Right now you are looking at a shell that proves the plumbing works."
      />
    </>
  );
}
