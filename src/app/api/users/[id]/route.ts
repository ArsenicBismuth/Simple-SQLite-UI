import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const todos = await db.todo.findMany({ where: { userId }, orderBy: { order: "asc" } });
    const normalized = todos.map((t) => ({ ...t, statusChangedAt: t.statusChangedAt ?? t.updatedAt }));
    return NextResponse.json({ user, todos: normalized });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// No user-level settings left to update; keep a minimal handler if needed in future
