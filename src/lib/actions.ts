"use server";

import { db } from "@/lib/db";
import type { GetUserWithTodosResult } from "@/types";


// Server action to create a new user
export async function createUser() {
  try {
    const user = await db.user.create({
      data: {
        // Defaults are provided by Prisma schema
      },
    });
    return { success: true, userId: user.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action to fetch user with todos
export async function getUserWithTodos(userId: string): Promise<GetUserWithTodosResult> {
  try {
    const user = await db.user.findUnique({ 
      where: { id: userId }
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    const todos = await db.todo.findMany({ 
      where: { userId }, 
      orderBy: { order: "asc" } 
    });
    
    const normalized = todos.map((t) => ({ 
      ...t, 
      statusChangedAt: t.statusChangedAt ?? t.updatedAt 
    }));
    
    return { success: true, user, todos: normalized };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action to add a new todo
export async function addTodo(userId: string, text: string, resetType?: "DAILY" | "WEEKLY", resetHour?: number, resetDow?: number) {
  try {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return { success: false, error: "Text required" };
    }

    const maxOrder = await db.todo.aggregate({ 
      where: { userId }, 
      _max: { order: true } 
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    const todo = await db.todo.create({ 
      data: {
        userId,
        text: trimmedText,
        order,
        resetType: resetType || "DAILY",
        resetHour: resetHour ?? 9,
        resetDow: resetDow ?? null,
      }
    });
    
    return { 
      success: true, 
      todo: { 
        ...todo, 
        statusChangedAt: todo.statusChangedAt ?? todo.updatedAt 
      } 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action to update a todo
export async function updateTodo(
  userId: string, 
  todoId: string, 
  updates: {
    text?: string;
    done?: boolean;
    resetType?: "DAILY" | "WEEKLY";
    resetHour?: number | null;
    resetDow?: number | null;
  }
) {
  try {
    const updateData: Parameters<typeof db.todo.update>[0]['data'] = {};
    
    if (typeof updates.text === "string") updateData.text = updates.text;
    if (typeof updates.done === "boolean") {
      updateData.done = updates.done;
      updateData.statusChangedAt = new Date();
    }
    if (updates.resetType === "DAILY" || updates.resetType === "WEEKLY") {
      updateData.resetType = updates.resetType;
    }
    if (typeof updates.resetHour === "number") updateData.resetHour = updates.resetHour;
    if (typeof updates.resetDow === "number") updateData.resetDow = updates.resetDow;

    const todo = await db.todo.update({ 
      where: { id: todoId }, 
      data: updateData 
    });
    
    if (todo.userId !== userId) {
      return { success: false, error: "Forbidden" };
    }
    
    return { 
      success: true, 
      todo: { 
        ...todo, 
        statusChangedAt: todo.statusChangedAt ?? todo.updatedAt 
      } 
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action to delete a todo
export async function deleteTodo(userId: string, todoId: string) {
  try {
    const todo = await db.todo.delete({ where: { id: todoId } });
    
    if (todo.userId !== userId) {
      return { success: false, error: "Forbidden" };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action for bulk operations
export async function bulkUpdateTodos(userId: string, operation: "markDone", todoIds: string[]) {
  try {
    if (operation === "markDone") {
      await db.todo.updateMany({
        where: { id: { in: todoIds }, userId },
        data: { done: true, statusChangedAt: new Date() },
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Server action to reorder todos
export async function reorderTodos(userId: string, reorders: Array<{ id: string; order: number }>) {
  try {
    await db.$transaction(
      reorders.map((u) => db.todo.update({ 
        where: { id: u.id }, 
        data: { order: u.order } 
      }))
    );
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
