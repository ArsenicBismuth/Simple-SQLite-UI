import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ResetType } from "generated";
import { ensureResetIfDue } from "@/lib/reset";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    await ensureResetIfDue(userId);
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const todos = await db.todo.findMany({ where: { userId }, orderBy: { order: "asc" } });
    return NextResponse.json({ user, todos });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const body = await req.json();
    const data: Partial<{ resetType: ResetType; resetHour: number; resetDow: number }> = {};
    if (typeof body.resetType === "string") {
      const upper = body.resetType.toUpperCase();
      if (upper === "DAILY" || upper === "WEEKLY") data.resetType = upper as ResetType;
    }
    if (typeof body.resetHour === "number") data.resetHour = body.resetHour;
    if (typeof body.resetDow === "number") data.resetDow = body.resetDow;

    const user = await db.user.update({ where: { id: userId }, data });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
