import { NextRequest, NextResponse } from "next/server";
import { getItems, bulkUpdateStatus } from "@/lib/db";
import { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as Status | null;

  const validStatuses: Status[] = ["pending", "approved", "rejected"];
  const filterStatus =
    status && validStatuses.includes(status) ? status : undefined;

  const items = getItems(filterStatus);
  return NextResponse.json(items);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      ids: number[];
      status: Status;
    };
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json(
        { error: "ids (array) and status are required" },
        { status: 400 }
      );
    }

    const validStatuses: Status[] = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = bulkUpdateStatus(ids, status);
    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
