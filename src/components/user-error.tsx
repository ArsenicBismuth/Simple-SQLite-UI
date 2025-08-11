"use client";

import SignOutButton from "./sign-out-button";

interface UserErrorProps {
  error: string;
}

export default function UserError({ error }: UserErrorProps) {
  return (
    <div className="p-4 border rounded border-red-200 bg-red-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-red-800 font-medium mb-2">User Not Found</div>
          <div className="text-red-700 text-sm mb-3">{error}</div>
          <div className="text-red-600 text-sm">
            The UUID you entered doesn&apos;t exist or is invalid. Please try again with a different UUID or create a new account.
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
