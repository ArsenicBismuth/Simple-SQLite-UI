"use client";

import { useState, useEffect } from "react";
import { getAllUsersWithTodoCounts } from "@/lib/actions";
import type { UserWithTodoCount } from "@/types";

interface AdminPanelProps {
  currentUserId: string;
}

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [users, setUsers] = useState<UserWithTodoCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const result = await getAllUsersWithTodoCounts(currentUserId);
        
        if (result.success) {
          setUsers(result.users || []);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch users");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-4">Admin Panel</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-red-200 rounded w-1/4 mb-3"></div>
          <div className="h-20 bg-red-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-4">Admin Panel</h2>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-6">
      <h2 className="text-xl font-bold text-red-800 mb-4">Admin Panel</h2>
      <p className="text-red-700 mb-4">Total Users: {users.length}</p>
      
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-red-100">
            <tr>
              <th className="px-4 py-2 text-left text-red-800">User ID</th>
              <th className="px-4 py-2 text-left text-red-800">Created</th>
              <th className="px-4 py-2 text-left text-red-800">Last Updated</th>
              <th className="px-4 py-2 text-left text-red-800">Todo Count</th>
              <th className="px-4 py-2 text-left text-red-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={user.id === currentUserId ? "bg-yellow-100" : "hover:bg-gray-50"}>
                <td className="px-4 py-2 font-mono text-xs border-b">
                  {user.id === currentUserId ? (
                    <span className="font-bold text-yellow-700">{user.id} (YOU)</span>
                  ) : (
                    user.id
                  )}
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-center border-b">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.todoCount === 0 
                      ? 'bg-gray-100 text-gray-600' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.todoCount}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm border-b">
                  {user.id === currentUserId ? (
                    <span className="text-yellow-700 font-semibold">Admin</span>
                  ) : (
                    <span className="text-gray-600">User</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <p className="text-red-600 text-center py-4">No users found</p>
      )}
    </div>
  );
}
