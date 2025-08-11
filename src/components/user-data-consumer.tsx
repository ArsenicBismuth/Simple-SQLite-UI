"use client";

import { useUserDataContext } from "@/contexts/user-data-context";
import UserDisplay from "./user-display";
import TodoDisplay from "./todo-display";
import UserError from "./user-error";

export default function UserDataConsumer() {
  const result = useUserDataContext();
  
  if (!result.success) {
    return <UserError error={result.error || "Failed to fetch user data"} />;
  }

  return (
    <div className="space-y-6">
      <UserDisplay userId={result.user.id} />
      <TodoDisplay userId={result.user.id} todos={result.todos} />
    </div>
  );
}
