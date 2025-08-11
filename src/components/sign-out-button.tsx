"use client";

export default function SignOutButton() {
  return (
    <button 
      className="text-sm underline hover:text-red-600 transition-colors" 
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user_uuid');
          window.location.reload();
        }
      }}
    >
      Sign out
    </button>
  );
}
