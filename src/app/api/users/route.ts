import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Create a new user with defaults
export async function POST() {
  try {
    const user = await db.user.create({
      data: {
        // Defaults are provided by Prisma schema
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
