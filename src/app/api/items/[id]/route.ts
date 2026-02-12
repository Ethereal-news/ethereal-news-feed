import { NextRequest, NextResponse } from "next/server";
import { updateItem, getItemById } from "@/lib/db";
import { Status, Category, CATEGORIES } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = getItemById(itemId);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      status?: Status;
      category?: Category;
      issue_url?: string | null;
    };
    const updates: { status?: Status; category?: Category; issue_url?: string | null } = {};

    if (body.status) {
      const validStatuses: Status[] = ["pending", "included", "excluded"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.category) {
      if (!CATEGORIES.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
      updates.category = body.category;
    }

    if (body.issue_url !== undefined) {
      updates.issue_url = body.issue_url || null;
    }

    const success = updateItem(itemId, updates);
    if (!success) {
      return NextResponse.json(
        { error: "No changes made" },
        { status: 400 }
      );
    }

    const updated = getItemById(itemId);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
