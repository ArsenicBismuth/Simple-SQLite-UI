export default function Loading() {
  return (
    <div className="font-sans min-h-screen p-6 max-w-3xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        
        <div className="mb-6 p-4 border rounded">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}
