"use client";

import { useCallback, useEffect, useState } from "react";
import UserAuth from "@/components/user-auth";
import TodoList from "@/components/todo-list";
import { getUserWithTodos } from "@/lib/actions";

function useLocalUuid() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  useEffect(() => {
    async function verifyStoredUuid() {
      const storedUuid = localStorage.getItem("user_uuid");
      
      if (!storedUuid) {
        setUuid(null);
        setIsLoading(false);
        return;
      }

      // Verify the UUID exists in the database
      setIsVerifying(true);
      try {
        const result = await getUserWithTodos(storedUuid);
        if (result.success) {
          // UUID is valid, use it
          setUuid(storedUuid);
        } else {
          // UUID is invalid, clear it from localStorage
          localStorage.removeItem("user_uuid");
          setUuid(null);
        }
      } catch {
        // On error, clear the invalid UUID
        localStorage.removeItem("user_uuid");
        setUuid(null);
      } finally {
        setIsVerifying(false);
        setIsLoading(false);
      }
    }

    verifyStoredUuid();
  }, []);

  const save = useCallback((v: string) => {
    localStorage.setItem("user_uuid", v);
    setUuid(v);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("user_uuid");
    setUuid(null);
  }, []);

  return { uuid, save, clear, isLoading: isLoading || isVerifying };
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
