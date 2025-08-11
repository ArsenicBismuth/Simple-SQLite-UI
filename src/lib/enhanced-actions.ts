"use server";

import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Enhanced error types
export type ActionResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Validation schemas
const TodoSchema = z.object({
  text: z.string().min(1, "Todo text is required").max(500, "Todo text too long"),
  resetType: z.enum(["DAILY", "WEEKLY"]).optional(),
  resetHour: z.number().min(0).max(23).optional(),
  resetDow: z.number().min(0).max(6).optional(),
});

const UpdateTodoSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  done: z.boolean().optional(),
  resetType: z.enum(["DAILY", "WEEKLY"]).optional(),
  resetHour: z.number().min(0).max(23).nullable().optional(),
  resetDow: z.number().min(0).max(6).nullable().optional(),
});

// Enhanced server action with validation and better error handling
export async function createTodoWithValidation(
  userId: string, 
  rawData: unknown
): Promise<ActionResult> {
  try {
    // Validate input data
    const validatedData = TodoSchema.parse(rawData);
    
    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    }

    // Get max order for proper ordering
    const maxOrder = await db.todo.aggregate({ 
      where: { userId }, 
      _max: { order: true } 
    });
    const order = (maxOrder._max.order ?? 0) + 1;

    // Create todo with validated data
    const todo = await db.todo.create({
      data: {
        userId,
        text: validatedData.text,
        order,
        resetType: validatedData.resetType || "DAILY",
        resetHour: validatedData.resetHour ?? 9,
        resetDow: validatedData.resetDow,
      },
    });

    // Revalidate with tags for better cache control
    revalidateTag(`user-todos-${userId}`);
    revalidatePath("/");

    return { 
      success: true, 
      data: { 
        ...todo, 
        statusChangedAt: todo.statusChangedAt ?? todo.updatedAt 
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR"
      };
    }
    
    console.error("Create todo error:", error);
    return { 
      success: false, 
      error: "Failed to create todo",
      code: "CREATE_ERROR"
    };
  }
}

// Enhanced update action with optimistic locking
export async function updateTodoWithValidation(
  userId: string,
  todoId: string,
  rawData: unknown,
  expectedVersion?: string
): Promise<ActionResult> {
  try {
    const validatedData = UpdateTodoSchema.parse(rawData);
    
    // Find existing todo with user validation
    const existingTodo = await db.todo.findFirst({
      where: { id: todoId, userId }
    });
    
    if (!existingTodo) {
      return { 
        success: false, 
        error: "Todo not found or access denied",
        code: "TODO_NOT_FOUND"
      };
    }

    // Optimistic locking check (if version is provided)
    if (expectedVersion && existingTodo.updatedAt.toISOString() !== expectedVersion) {
      return {
        success: false,
        error: "Todo was modified by another process",
        code: "CONFLICT"
      };
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // If updating done status, set status change timestamp
    if (typeof validatedData.done === "boolean") {
      updateData.statusChangedAt = new Date();
    }

    // Update todo
    const updatedTodo = await db.todo.update({
      where: { id: todoId },
      data: updateData,
    });

    revalidateTag(`user-todos-${userId}`);
    revalidatePath("/");

    return {
      success: true,
      data: {
        ...updatedTodo,
        statusChangedAt: updatedTodo.statusChangedAt ?? updatedTodo.updatedAt
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR"
      };
    }

    console.error("Update todo error:", error);
    return {
      success: false,
      error: "Failed to update todo",
      code: "UPDATE_ERROR"
    };
  }
}

// Batch operations with transaction support
export async function batchUpdateTodos(
  userId: string,
  operations: Array<{
    id: string;
    operation: "complete" | "delete" | "reorder";
    data?: any;
  }>
): Promise<ActionResult> {
  try {
    await db.$transaction(async (tx) => {
      for (const op of operations) {
        const todo = await tx.todo.findFirst({
          where: { id: op.id, userId }
        });
        
        if (!todo) {
          throw new Error(`Todo ${op.id} not found or access denied`);
        }

        switch (op.operation) {
          case "complete":
            await tx.todo.update({
              where: { id: op.id },
              data: { done: true, statusChangedAt: new Date() }
            });
            break;
          case "delete":
            await tx.todo.delete({ where: { id: op.id } });
            break;
          case "reorder":
            await tx.todo.update({
              where: { id: op.id },
              data: { order: op.data.order }
            });
            break;
        }
      }
    });

    revalidateTag(`user-todos-${userId}`);
    revalidatePath("/");

    return { success: true, data: { operationsCompleted: operations.length } };
  } catch (error) {
    console.error("Batch update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Batch operation failed",
      code: "BATCH_ERROR"
    };
  }
}

// Analytics action (demonstrates data collection)
export async function trackUserAction(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    // In a real app, you might send this to an analytics service
    console.log("User action tracked:", {
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, data: { tracked: true } };
  } catch (error) {
    console.error("Analytics error:", error);
    return { success: false, error: "Failed to track action" };
  }
}
