import { db } from "@/lib/db";

export type ResetType = "DAILY" | "WEEKLY";

type ResetContext = {
  now?: Date;
};

function getStartOfTodayLocal(date: Date): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local;
}

function getStartOfWeekLocal(date: Date): Date {
  const local = getStartOfTodayLocal(date);
  const day = local.getDay(); // 0 (Sun) - 6 (Sat)
  local.setDate(local.getDate() - day);
  return local;
}

export async function ensureResetIfDue(userId: string, ctx: ResetContext = {}): Promise<void> {
  const now = ctx.now ?? new Date();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const resetType = user.resetType as ResetType;
  const lastResetAt = user.lastResetAt ?? new Date(0);

  if (resetType === "DAILY") {
    const resetHour = typeof user.resetHour === "number" ? user.resetHour : 9;
    const todayStart = getStartOfTodayLocal(now);
    const todayReset = new Date(todayStart);
    todayReset.setHours(resetHour, 0, 0, 0);

    if (now.getTime() >= todayReset.getTime() && lastResetAt.getTime() < todayReset.getTime()) {
      await db.$transaction([
        db.todo.updateMany({ where: { userId }, data: { done: false } }),
        db.user.update({ where: { id: userId }, data: { lastResetAt: todayReset } }),
      ]);
    }
  } else if (resetType === "WEEKLY") {
    const resetDow = typeof user.resetDow === "number" ? user.resetDow : 1; // default Monday
    const weekStart = getStartOfWeekLocal(now); // Sunday
    const resetDate = new Date(weekStart);
    resetDate.setDate(resetDate.getDate() + resetDow);
    resetDate.setHours(0, 0, 0, 0); // midnight at that day

    if (now.getTime() >= resetDate.getTime() && lastResetAt.getTime() < resetDate.getTime()) {
      await db.$transaction([
        db.todo.updateMany({ where: { userId }, data: { done: false } }),
        db.user.update({ where: { id: userId }, data: { lastResetAt: resetDate } }),
      ]);
    }
  }
}
