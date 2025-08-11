"use client";

import { useState, useTransition } from "react";
import { addTodo } from "@/lib/actions";



interface TodoFormProps {
  userId: string;
  onError: (error: string) => void;
}

export default function TodoForm({ userId, onError }: TodoFormProps) {
  const [newText, setNewText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addTodo(userId, text);
      if (result.success) {
        setNewText("");
      } else {
        onError(result.error || "Failed to add todo");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        className="border rounded px-3 py-2 flex-1"
        placeholder="Add a todo"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        disabled={isPending}
      />
      <button 
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50" 
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
