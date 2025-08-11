"use client";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ResetType = "DAILY" | "WEEKLY";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  statusChangedAt?: string; // ISO from API
  resetType?: ResetType;
  resetHour?: number | null;
  resetDow?: number | null;
};

type User = { id: string };

type UserBundle = { user: User; todos: Todo[] };

function useLocalUuid() {
  const [uuid, setUuid] = useState<string | null>(null);
  useEffect(() => {
    const v = localStorage.getItem("user_uuid");
    if (v) setUuid(v);
  }, []);
  const save = useCallback((v: string) => {
    localStorage.setItem("user_uuid", v);
    setUuid(v);
  }, []);
  const clear = useCallback(() => {
    localStorage.removeItem("user_uuid");
    setUuid(null);
  }, []);
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
      .catch((e) => {
        setError(String(e));
        clear();
      })
      .finally(() => setLoading(false));
  }, [uuid, clear]);

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

  // No per-user updates now

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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

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
          <div className="p-4 py-3 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="text-sm text-gray-500">User UUID</div>
                <div className="relative">
                  <button
                    className="font-mono break-all text-left hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer w-fit group flex items-center"
                    onClick={() => copyToClipboard(bundle.user.id)}
                  >
                    {bundle.user.id}
                    <span className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-gray-500 transition-opacity">
                      Copy
                    </span>
                  </button>
                  {copyFeedback && (
                    <div className="absolute top-full left-0 mt-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {copyFeedback}
                    </div>
                  )}
                </div>
              </div>
              <button className="text-sm underline" onClick={clear}>Sign out</button>
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
              {bundle.todos.map((t) => {
                const now = new Date();
                let resetCutoff: Date | null = null;
                const resetType = t.resetType ?? "DAILY";
                if (resetType === "DAILY") {
                  const hh = t.resetHour ?? 9;
                  const today = new Date(now);
                  today.setHours(0, 0, 0, 0);
                  const todayReset = new Date(today);
                  todayReset.setHours(hh, 0, 0, 0);
                  // if not yet reached today, use yesterday's reset
                  if (now.getTime() >= todayReset.getTime()) {
                    resetCutoff = todayReset;
                  } else {
                    const y = new Date(todayReset);
                    y.setDate(y.getDate() - 1);
                    resetCutoff = y;
                  }
                } else {
                  const dow = t.resetDow ?? 1; // Monday default
                  const weekStart = new Date(now);
                  weekStart.setHours(0, 0, 0, 0);
                  // get to Sunday
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  const target = new Date(weekStart);
                  target.setDate(target.getDate() + dow);
                  // weekly reset is at 00:00 of that day
                  if (now.getTime() >= target.getTime()) {
                    resetCutoff = target;
                  } else {
                    const prev = new Date(target);
                    prev.setDate(prev.getDate() - 7);
                    resetCutoff = prev;
                  }
                }

                const changedAt = t.statusChangedAt ? new Date(t.statusChangedAt) : null;
                const isEffectivelyDone = t.done && (!changedAt || (resetCutoff && changedAt >= resetCutoff));

                return (
                  <li key={t.id} className={cn("py-2 px-3.5 border rounded flex flex-col gap-2", isEffectivelyDone && "opacity-60")}>
                    <div className="flex items-center gap-2">
                      <input
                        name="done"
                        type="checkbox"
                        checked={isEffectivelyDone}
                        onChange={(e) => updateTodo(t.id, { done: e.target.checked }).catch((err) => setError(String(err)))}
                      />
                      <input
                        name="name"
                        className="flex-1 outline-none"
                        value={t.text}
                        onChange={(e) => updateTodo(t.id, { text: e.target.value }).catch((err) => setError(String(err)))}
                      />
                      <button className="text-sm underline" onClick={() => deleteTodo(t.id).catch((e) => setError(String(e)))}>
                        Delete
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Reset:</span>
                      <select
                        className="border rounded px-2 py-1"
                        value={t.resetType ?? "DAILY"}
                        onChange={(e) => updateTodo(t.id, { resetType: e.target.value as ResetType }).catch((err) => setError(String(err)))}
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                      </select>
                      {((t.resetType ?? "DAILY") === "DAILY") && (
                        <>
                          <span className="text-gray-500">Hour</span>
                          <input
                            type="number"
                            min={0}
                            max={23}
                            className="border rounded px-2 py-1 w-20"
                            value={t.resetHour ?? 9}
                            onChange={(e) => updateTodo(t.id, { resetHour: Number(e.target.value) }).catch((err) => setError(String(err)))}
                          />
                        </>
                      )}
                      {((t.resetType ?? "DAILY") === "WEEKLY") && (
                        <>
                          <span className="text-gray-500">Day</span>
                          <select
                            className="border rounded px-2 py-1"
                            value={t.resetDow ?? 1}
                            onChange={(e) => updateTodo(t.id, { resetDow: Number(e.target.value) }).catch((err) => setError(String(err)))}
                          >
                            <option value={0}>Sun</option>
                            <option value={1}>Mon</option>
                            <option value={2}>Tue</option>
                            <option value={3}>Wed</option>
                            <option value={4}>Thu</option>
                            <option value={5}>Fri</option>
                            <option value={6}>Sat</option>
                          </select>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
