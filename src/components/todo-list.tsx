import { Suspense } from "react";
import { getUserWithTodos } from "@/lib/actions";
import { UserDataProvider } from "@/contexts/user-data-context";
import UserDataConsumer from "@/components/user-data-consumer";

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

// Main streaming component - Server Component that creates the promise and provides it via context
export default function TodoList({ userId }: { userId: string }) {
  // Create the promise for data fetching in Server Component
  const userDataPromise = getUserWithTodos(userId);
  
  return (
    <UserDataProvider userDataPromise={userDataPromise}>
      <Suspense fallback={<LoadingSkeleton />}>
        <UserDataConsumer />
      </Suspense>
    </UserDataProvider>
  );
}
