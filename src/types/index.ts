// Centralized type definitions

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  statusChangedAt: Date | null;
  resetType: "DAILY" | "WEEKLY";
  resetHour: number | null;
  resetDow: number | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetUserWithTodosResult = {
  success: true;
  user: User;
  todos: Todo[];
} | {
  success: false;
  error: string;
};

export type ActionResult<T = unknown> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

export type UserWithTodoCount = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  todoCount: number;
};

export type GetAllUsersResult = {
  success: true;
  users: UserWithTodoCount[];
} | {
  success: false;
  error: string;
};