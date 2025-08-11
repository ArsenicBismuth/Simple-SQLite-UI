"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  return (
    <button
      className="font-mono break-all text-left hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer w-fit group flex items-center"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopyFeedback("Copied!");
          setTimeout(() => setCopyFeedback(null), 2000);
        } catch {
          setCopyFeedback("Failed to copy");
          setTimeout(() => setCopyFeedback(null), 2000);
        }
      }}
    >
      {text}
      <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-gray-500 transition-opacity">
        {copyFeedback || "Copy"}
      </span>
    </button>
  );
}
