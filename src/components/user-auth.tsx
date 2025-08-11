"use client";

import { useState, useTransition } from "react";
import { createUser } from "@/lib/actions";

interface UserAuthProps {
  onUserSelected: (userId: string) => void;
  error: string | null;
}

export default function UserAuth({ onUserSelected, error }: UserAuthProps) {
  const [inputUuid, setInputUuid] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateOrRestore = async () => {
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
      <input
        className="border rounded px-3 py-2 w-full mb-3 disabled:opacity-50"
        placeholder="UUID"
        value={inputUuid}
        onChange={(e) => setInputUuid(e.target.value)}
        disabled={isPending}
      />
      <button
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleCreateOrRestore}
        disabled={isPending}
      >
        {isPending ? "Loading..." : "Continue"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
