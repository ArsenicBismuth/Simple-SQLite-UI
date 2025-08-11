"use client";

import TodoItem from "./todo-item";
import TodoForm from "./todo-form";
import type { Todo } from "@/types";

interface TodoDisplayProps {
  userId: string;
  todos: Todo[];
}

export default function TodoDisplay({ userId, todos }: TodoDisplayProps) {
  return (
    <div className="p-4 border rounded">
      <h2 className="font-semibold mb-3">Todos ({todos.length})</h2>
      <TodoForm userId={userId} onError={(error) => console.error(error)} />
      <ul className="space-y-2">
        {todos.map((todo) => (
          <TodoItem 
            key={todo.id} 
            todo={todo} 
            userId={userId}
            onError={(error) => console.error(error)}
          />
        ))}
        {todos.length === 0 && (
          <li className="py-8 text-center text-gray-500">
            No todos yet. Add one above to get started!
          </li>
        )}
      </ul>
    </div>
  );
}
