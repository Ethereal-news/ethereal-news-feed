import { Suspense } from "react";
import { getItems } from "@/lib/db";
import { Status } from "@/lib/types";
import Header from "@/components/Header";
import StatusFilter from "@/components/StatusFilter";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusParam = params.status;
  const validStatuses: Status[] = ["pending", "included", "excluded"];
  const filterStatus = statusParam && validStatuses.includes(statusParam as Status)
    ? (statusParam as Status)
    : undefined;

  // Show items in a previous issue only on the All view
  const includeInIssue = !filterStatus;
  const items = getItems(filterStatus, includeInIssue);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Header itemCount={items.length} />
      <Suspense>
        <StatusFilter />
      </Suspense>
      <Dashboard initialItems={items} />
    </div>
  );
}
