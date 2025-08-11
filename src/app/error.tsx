"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="font-sans min-h-screen p-6 max-w-3xl mx-auto">
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong!</h2>
        <p className="text-red-600 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
