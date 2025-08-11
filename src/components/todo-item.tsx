"use client";

import { useTransition, useOptimistic } from "react";
import { updateTodo, deleteTodo } from "@/lib/actions";
import { cn } from "@/lib/utils";

type ResetType = "DAILY" | "WEEKLY";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  statusChangedAt?: Date | null;
  resetType?: ResetType;
  resetHour?: number | null;
  resetDow?: number | null;
};

interface TodoItemProps {
  todo: Todo;
  userId: string;
  onError: (error: string) => void;
  onSuccess?: () => void;
}

export default function TodoItem({ todo, userId, onError, onSuccess }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodo, addOptimisticTodo] = useOptimistic(
    todo,
    (state, newTodo: Partial<Todo>) => ({ ...state, ...newTodo })
  );

  // Calculate if todo is effectively done based on reset schedule
  const now = new Date();
  let resetCutoff: Date | null = null;
  const resetType = optimisticTodo.resetType ?? "DAILY";
  
  if (resetType === "DAILY") {
    const hh = optimisticTodo.resetHour ?? 9;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayReset = new Date(today);
    todayReset.setHours(hh, 0, 0, 0);
    if (now.getTime() >= todayReset.getTime()) {
      resetCutoff = todayReset;
    } else {
      const y = new Date(todayReset);
      y.setDate(y.getDate() - 1);
      resetCutoff = y;
    }
  } else {
    const dow = optimisticTodo.resetDow ?? 1;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const target = new Date(weekStart);
    target.setDate(target.getDate() + dow);
    if (now.getTime() >= target.getTime()) {
      resetCutoff = target;
    } else {
      const prev = new Date(target);
      prev.setDate(prev.getDate() - 7);
      resetCutoff = prev;
    }
  }

  const changedAt = optimisticTodo.statusChangedAt ? new Date(optimisticTodo.statusChangedAt) : null;
  const isEffectivelyDone = optimisticTodo.done && (!changedAt || (resetCutoff && changedAt >= resetCutoff));

  const handleUpdate = async (updates: Partial<Todo>) => {
    addOptimisticTodo(updates);
    
    startTransition(async () => {
      const result = await updateTodo(userId, optimisticTodo.id, updates);
      if (result.success) {
        onSuccess?.();
      } else {
        onError(result.error || "Failed to update todo");
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteTodo(userId, optimisticTodo.id);
      if (result.success) {
        onSuccess?.();
      } else {
        onError(result.error || "Failed to delete todo");
      }
    });
  };

  return (
    <li className={cn(
      "py-2 px-3.5 border rounded flex flex-col gap-2 transition-opacity",
      isEffectivelyDone && "opacity-60",
      isPending && "opacity-75"
    )}>
      <div className="flex items-center gap-2">
        <input
          name="done"
          type="checkbox"
          checked={isEffectivelyDone}
          onChange={(e) => handleUpdate({ done: e.target.checked })}
          disabled={isPending}
        />
        <input
          name="name"
          className="flex-1 outline-none disabled:opacity-50"
          value={optimisticTodo.text}
          onChange={(e) => handleUpdate({ text: e.target.value })}
          disabled={isPending}
        />
        <button 
          className="text-sm underline hover:text-red-600 disabled:opacity-50" 
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "..." : "Delete"}
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Reset:</span>
        <select
          className="border rounded px-2 py-1 disabled:opacity-50"
          value={optimisticTodo.resetType ?? "DAILY"}
          onChange={(e) => handleUpdate({ resetType: e.target.value as ResetType })}
          disabled={isPending}
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
        </select>
        {((optimisticTodo.resetType ?? "DAILY") === "DAILY") && (
          <>
            <span className="text-gray-500">Hour</span>
            <input
              type="number"
              min={0}
              max={23}
              className="border rounded px-2 py-1 w-20 disabled:opacity-50"
              value={optimisticTodo.resetHour ?? 9}
              onChange={(e) => handleUpdate({ resetHour: Number(e.target.value) })}
              disabled={isPending}
            />
          </>
        )}
        {((optimisticTodo.resetType ?? "DAILY") === "WEEKLY") && (
          <>
            <span className="text-gray-500">Day</span>
            <select
              className="border rounded px-2 py-1 disabled:opacity-50"
              value={optimisticTodo.resetDow ?? 1}
              onChange={(e) => handleUpdate({ resetDow: Number(e.target.value) })}
              disabled={isPending}
            >
              <option value={0}>Sun</option>
              <option value={1}>Mon</option>
              <option value={2}>Tue</option>
              <option value={3}>Wed</option>
              <option value={4}>Thu</option>
              <option value={5}>Fri</option>
              <option value={6}>Sat</option>
            </select>
          </>
        )}
      </div>
    </li>
  );
}
