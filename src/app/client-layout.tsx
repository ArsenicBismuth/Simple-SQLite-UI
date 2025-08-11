"use client";

import { useCallback, useEffect, useState } from "react";
import UserAuth from "@/components/user-auth";
import TodoList from "@/components/todo-list";

function useLocalUuid() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const v = localStorage.getItem("user_uuid");
    setUuid(v);
    setIsLoading(false);
  }, []);

  const save = useCallback((v: string) => {
    localStorage.setItem("user_uuid", v);
    setUuid(v);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("user_uuid");
    setUuid(null);
  }, []);

  return { uuid, save, clear, isLoading };
}

export default function ClientLayout() {
  const { uuid, save, isLoading } = useLocalUuid();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!uuid) {
    return <UserAuth onUserSelected={save} />;
  }

  return <TodoList userId={uuid} />;
}
