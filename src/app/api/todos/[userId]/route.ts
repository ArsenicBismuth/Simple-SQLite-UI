import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureResetIfDue } from "@/lib/reset";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

    await ensureResetIfDue(userId);

    const maxOrder = await db.todo.aggregate({ where: { userId }, _max: { order: true } });
    const order = (maxOrder._max.order ?? 0) + 1;

    const todo = await db.todo.create({ data: { userId, text, order } });
    return NextResponse.json({ todo });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const body = await req.json();

    if (Array.isArray(body.reorder)) {
      const updates = body.reorder as Array<{ id: string; order: number }>;
      await db.$transaction(
        updates.map((u) => db.todo.update({ where: { id: u.id }, data: { order: u.order } }))
      );
      return NextResponse.json({ ok: true });
    }

    if (Array.isArray(body.bulkDone)) {
      const ids = body.bulkDone as string[];
      await db.todo.updateMany({ where: { id: { in: ids }, userId }, data: { done: true } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
