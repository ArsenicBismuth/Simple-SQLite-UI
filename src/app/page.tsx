"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ResetType = "DAILY" | "WEEKLY";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  order: number;
};

type User = {
  id: string;
  resetType: ResetType;
  resetHour: number | null;
  resetDow: number | null; // 0 Sunday - 6 Saturday
};

type UserBundle = { user: User; todos: Todo[] };

function useLocalUuid() {
  const [uuid, setUuid] = useState<string | null>(null);
  useEffect(() => {
    const v = localStorage.getItem("user_uuid");
    if (v) setUuid(v);
  }, []);
  const save = (v: string) => {
    localStorage.setItem("user_uuid", v);
    setUuid(v);
  };
  const clear = () => {
    localStorage.removeItem("user_uuid");
    setUuid(null);
  };
  return { uuid, save, clear };
}

async function createUser(): Promise<string> {
  const res = await fetch("/api/users", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create user");
  const data = await res.json();
  return data.user.id as string;
}

async function fetchUserBundle(id: string): Promise<UserBundle> {
  const res = await fetch(`/api/users/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("User not found");
  return res.json();
}

export default function Home() {
  const { uuid, save, clear } = useLocalUuid();
  const [inputUuid, setInputUuid] = useState("");
  const [bundle, setBundle] = useState<UserBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    fetchUserBundle(uuid)
      .then(setBundle)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleCreateOrRestore = async () => {
    setError(null);
    setLoading(true);
    try {
      const id = inputUuid.trim() || (await createUser());
      save(id);
      const b = await fetchUserBundle(id);
      setBundle(b);
      setInputUuid("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const syncUpdateUser = async (u: Partial<User>) => {
    if (!uuid) return;
    const res = await fetch(`/api/users/${uuid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u),
    });
    if (!res.ok) throw new Error("Failed to update user");
    const data = await res.json();
    setBundle((prev) => (prev ? { ...prev, user: data.user } : prev));
  };

  const addTodo = async (text: string) => {
    if (!uuid) return;
    const res = await fetch(`/api/todos/${uuid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to add todo");
    const data = await res.json();
    setBundle((prev) => (prev ? { ...prev, todos: [...prev.todos, data.todo] } : prev));
  };

  const updateTodo = async (id: string, changes: Partial<Todo>) => {
    if (!uuid) return;
    const res = await fetch(`/api/todos/${uuid}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error("Failed to update todo");
    const data = await res.json();
    setBundle((prev) =>
      prev ? { ...prev, todos: prev.todos.map((t) => (t.id === id ? data.todo : t)) } : prev
    );
  };

  const deleteTodo = async (id: string) => {
    if (!uuid) return;
    const res = await fetch(`/api/todos/${uuid}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete todo");
    setBundle((prev) => (prev ? { ...prev, todos: prev.todos.filter((t) => t.id !== id) } : prev));
  };

  const [newText, setNewText] = useState("");

  const scheduleSummary = useMemo(() => {
    if (!bundle) return "";
    if (bundle.user.resetType === "DAILY") {
      const hh = bundle.user.resetHour ?? 9;
      return `Daily reset at ${hh.toString().padStart(2, "0")}:00`;
    }
    const d = bundle.user.resetDow ?? 1;
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly reset on ${names[d]}`;
  }, [bundle]);

  return (
    <div className="font-sans min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple SQLite Todo</h1>

      {!uuid && (
        <div className="mb-6 p-4 border rounded">
          <p className="mb-2">Enter your UUID to restore, or leave blank to create a new one.</p>
          <input
            className="border rounded px-3 py-2 w-full mb-3"
            placeholder="UUID"
            value={inputUuid}
            onChange={(e) => setInputUuid(e.target.value)}
          />
          <button
            className="bg-black text-white px-4 py-2 rounded"
            onClick={handleCreateOrRestore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Continue"}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {uuid && bundle && (
        <div className="space-y-6">
          <div className="p-4 border rounded">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-sm text-gray-500">Your UUID</div>
                <div className="font-mono break-all">{bundle.user.id}</div>
              </div>
              <button className="text-sm underline" onClick={clear}>Sign out</button>
            </div>
            <div className="text-sm text-gray-600">{scheduleSummary}</div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <label className="flex flex-col gap-1">
                <span className="text-sm">Reset type</span>
                <select
                  className="border rounded px-2 py-2"
                  value={bundle.user.resetType}
                  onChange={(e) => syncUpdateUser({ resetType: e.target.value as ResetType })}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </label>

              {bundle.user.resetType === "DAILY" && (
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Hour (0-23)</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="border rounded px-2 py-2"
                    value={bundle.user.resetHour ?? 9}
                    onChange={(e) => syncUpdateUser({ resetHour: Number(e.target.value) })}
                  />
                </label>
              )}

              {bundle.user.resetType === "WEEKLY" && (
                <label className="flex flex-col gap-1">
                  <span className="text-sm">Day of week</span>
                  <select
                    className="border rounded px-2 py-2"
                    value={bundle.user.resetDow ?? 1}
                    onChange={(e) => syncUpdateUser({ resetDow: Number(e.target.value) })}
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </label>
              )}
            </div>
          </div>

          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-3">Todos</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const t = newText.trim();
                if (!t) return;
                addTodo(t).catch((e) => setError(String(e)));
                setNewText("");
              }}
              className="flex gap-2 mb-4"
            >
              <input
                className="border rounded px-3 py-2 flex-1"
                placeholder="Add a todo"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <button className="bg-black text-white px-4 py-2 rounded" type="submit">
                Add
              </button>
            </form>

            <ul className="space-y-2">
              {bundle.todos.map((t) => (
                <li key={t.id} className={cn("p-2 border rounded flex items-center gap-2", t.done && "opacity-60")}
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={(e) => updateTodo(t.id, { done: e.target.checked }).catch((err) => setError(String(err)))}
                  />
                  <input
                    className="flex-1 outline-none"
                    value={t.text}
                    onChange={(e) => updateTodo(t.id, { text: e.target.value }).catch((err) => setError(String(err)))}
                  />
                  <button className="text-sm underline" onClick={() => deleteTodo(t.id).catch((e) => setError(String(e)))}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
