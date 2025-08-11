import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string; todoId: string }> }
) {
  try {
    const { userId, todoId } = await context.params;
    const body = await req.json();
    const data: Partial<{ text: string; done: boolean }> = {};
    if (typeof body.text === "string") data.text = body.text;
    if (typeof body.done === "boolean") data.done = body.done;

    const todo = await db.todo.update({ where: { id: todoId }, data });
    if (todo.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ todo });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ userId: string; todoId: string }> }
) {
  try {
    const { userId, todoId } = await context.params;
    const todo = await db.todo.delete({ where: { id: todoId } });
    if (todo.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
