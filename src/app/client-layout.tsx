"use client";

import { useCallback, useEffect, useState } from "react";
import UserAuth from "@/components/user-auth";
import TodoList from "@/components/todo-list";
import { getUserWithTodos } from "@/lib/actions";
import type { GetUserWithTodosResult } from "@/types";

function useLocalUuid() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userData, setUserData] = useState<GetUserWithTodosResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUuid = localStorage.getItem("user_uuid");
    if (storedUuid) {
      setUuid(storedUuid);
    }
  }, []);
  
  useEffect(() => {
    async function verifyStoredUuid() {
      if (!uuid) {
        setUuid(null);
        setIsLoading(false);
        return;
      }

      // Verify the UUID exists in the database
      setIsVerifying(true);
      try {
        const result = await getUserWithTodos(uuid);
        if (result.success) {
          // UUID is valid, use it
          setUuid(uuid);
          setUserData(result);
        } else {
          throw new Error(result.error);
        }
      } catch {
        // On error, clear the invalid UUID
        localStorage.removeItem("user_uuid");
        setUuid(null);
        setError("Failed to verify UUID");
      } finally {
        setIsVerifying(false);
        setIsLoading(false);
      }
    }

    if (uuid) {
      verifyStoredUuid();
    }
  }, [uuid]);

  const save = useCallback((v: string) => {
    localStorage.setItem("user_uuid", v);
    setUuid(v);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("user_uuid");
    setUuid(null);
    setUserData(null);
  }, []);

  return { uuid, save, clear, isLoading: isLoading || isVerifying, userData, error };
}

export default function ClientLayout() {
  const { save, isLoading, userData, error } = useLocalUuid();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!userData) {
    return <UserAuth onUserSelected={save} error={error} />;
  }

  return <TodoList userData={userData} isLoading={isLoading} />;
}
