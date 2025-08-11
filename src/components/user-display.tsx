"use client";

import CopyButton from "./copy-button";
import SignOutButton from "./sign-out-button";

interface UserDisplayProps {
  userId: string;
}

export default function UserDisplay({ userId }: UserDisplayProps) {
  return (
    <div className="p-4 py-3 border rounded">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm text-gray-500">User UUID</div>
          <div className="relative">
            <CopyButton text={userId} />
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
