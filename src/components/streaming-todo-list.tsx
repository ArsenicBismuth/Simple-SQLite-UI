"use client";

import { Suspense, use } from "react";
import { getUserWithTodos } from "@/lib/actions";
import UserDisplay from "./user-display";
import TodoDisplay from "./todo-display";
import UserError from "./user-error";
import type { GetUserWithTodosResult } from "@/types";

interface StreamingTodoListProps {
  userId: string;
}

// Client Component that handles the data fetching and display
function DataHandler({ userDataPromise }: { userDataPromise: Promise<GetUserWithTodosResult> }) {
  const result = use(userDataPromise);
  
  if (!result.success) {
    return <UserError error={result.error || "Failed to fetch user data"} />;
  }

  return (
    <div className="space-y-6">
      <UserDisplay userId={result.user!.id} />
      <TodoDisplay userId={result.user!.id} todos={result.todos!} />
    </div>
  );
}

// Loading skeleton for the entire data fetch
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* User skeleton */}
      <div className="p-4 border rounded animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      {/* Todo skeleton */}
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
    </div>
  );
}

// Main streaming component - Client Component that creates the promise and handles suspense
export default function StreamingTodoList({ userId }: StreamingTodoListProps) {
  // Create the promise for data fetching
  const userDataPromise = getUserWithTodos(userId);
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DataHandler userDataPromise={userDataPromise} />
    </Suspense>
  );
}
