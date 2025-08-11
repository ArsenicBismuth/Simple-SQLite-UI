import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const maxOrder = await db.todo.aggregate({ where: { userId }, _max: { order: true } });
    const order = (maxOrder._max.order ?? 0) + 1;

    // Allow optional per-item reset params, default to daily 9:00
    const rt = typeof body.resetType === "string" ? body.resetType.toUpperCase() : null;
    const resetType = (rt === "DAILY" || rt === "WEEKLY") ? rt : "DAILY";
    const resetHour = typeof body.resetHour === "number" ? body.resetHour : 9;
    const resetDow = typeof body.resetDow === "number" ? body.resetDow : null;

    const todo = await db.todo.create({ 
      data: {
        userId,
        text,
        order,
        resetType,
        resetHour,
        resetDow,
      }
    });
    return NextResponse.json({ todo: { ...todo, statusChangedAt: todo.statusChangedAt ?? todo.updatedAt } });
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
    await db.todo.updateMany({
      where: { id: { in: ids }, userId },
      data: { done: true, statusChangedAt: new Date() },
    });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
