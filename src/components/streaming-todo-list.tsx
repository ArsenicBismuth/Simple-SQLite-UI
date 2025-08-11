import { Suspense } from "react";
import { getUserWithTodos } from "@/lib/actions";
import TodoItem from "./todo-item";
import TodoForm from "./todo-form";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  statusChangedAt?: string;
  resetType?: "DAILY" | "WEEKLY";
  resetHour?: number | null;
  resetDow?: number | null;
};

interface StreamingTodoListProps {
  userId: string;
}

// Component that fetches and renders user info with streaming
async function UserSection({ userId }: { userId: string }) {
  const result = await getUserWithTodos(userId);
  
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch user");
  }

  return (
    <div className="p-4 py-3 border rounded">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm text-gray-500">User UUID</div>
          <div className="relative">
            <CopyButton text={result.user!.id} />
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}

// Component that fetches and renders todos with streaming
async function TodoSection({ userId }: { userId: string }) {
  const result = await getUserWithTodos(userId);
  
  if (!result.success) {
    throw new Error(result.error || "Failed to fetch todos");
  }

  const todos = result.todos!;

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

function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="font-mono break-all text-left hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer w-fit group flex items-center"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          // In a real app, you might want to show a toast notification
        } catch {
          // Handle error silently or show error state
        }
      }}
    >
      {text}
      <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-gray-500 transition-opacity">
        Copy
      </span>
    </button>
  );
}

function SignOutButton() {
  return (
    <button 
      className="text-sm underline hover:text-red-600 transition-colors" 
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_uuid');
          window.location.reload();
        }
      }}
    >
      Sign out
    </button>
  );
}

// Loading skeletons for streaming UI
function UserSkeleton() {
  return (
    <div className="p-4 border rounded animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

function TodoSkeleton() {
  return (
    <div className="p-4 border rounded animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

// Main streaming component that demonstrates progressive loading
export default function StreamingTodoList({ userId }: StreamingTodoListProps) {
  return (
    <div className="space-y-6">
      {/* User section loads independently */}
      <Suspense fallback={<UserSkeleton />}>
        <UserSection userId={userId} />
      </Suspense>
      
      {/* Todo section loads independently and can start before user section completes */}
      <Suspense fallback={<TodoSkeleton />}>
        <TodoSection userId={userId} />
      </Suspense>
    </div>
  );
}
