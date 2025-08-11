"use client";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  return (
    <button
      className="font-mono break-all text-left hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer w-fit group flex items-center"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          // In a real app, you might want to show a toast notification
        } catch {
          // Handle error silently or show error state
        }
      }}
    >
      {text}
      <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-gray-500 transition-opacity">
        Copy
      </span>
    </button>
  );
}
