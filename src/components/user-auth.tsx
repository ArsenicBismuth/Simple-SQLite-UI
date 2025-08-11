"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createUser } from "@/lib/actions";

interface UserAuthProps {
  onUserSelected: (userId: string) => void;
  error: string | null;
}

export default function UserAuth({ onUserSelected, error }: UserAuthProps) {
  const [inputUuid, setInputUuid] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreateOrRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const trimmedInput = inputUuid.trim();
        
        if (trimmedInput) {
          // Try to restore existing user
          onUserSelected(trimmedInput);
        } else {
          // Create new user
          const result = await createUser();
          if (result.success) {
            onUserSelected(result.userId!);
          }
        }
        
        setInputUuid("");
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <div className="mb-6 p-4 border rounded">
      <p className="mb-2">Enter your UUID to restore, or leave blank to create a new one.</p>
      <form onSubmit={handleCreateOrRestore} className="space-y-3">
        <input
          ref={inputRef}
          className="border rounded px-3 py-2 w-full disabled:opacity-50"
          placeholder="UUID"
          value={inputUuid}
          onChange={(e) => setInputUuid(e.target.value)}
          disabled={isPending}
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? "Loading..." : "Continue"}
        </button>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
