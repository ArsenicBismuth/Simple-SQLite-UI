import Link from "next/link";

export default function NotFound() {
  return (
    <div className="font-sans min-h-screen p-6 max-w-3xl mx-auto flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-4">Sorry, the page you are looking for does not exist.</p>
        <Link 
          href="/" 
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
