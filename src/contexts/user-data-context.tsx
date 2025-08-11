"use client";

import { createContext, useContext } from "react";
import type { GetUserWithTodosResult } from "@/types";

export const UserDataContext = createContext<Promise<GetUserWithTodosResult> | null>(null);

export function UserDataProvider({
  children,
  userDataPromise,
}: {
  children: React.ReactNode;
  userDataPromise: Promise<GetUserWithTodosResult>;
}) {
  return (
    <UserDataContext.Provider value={userDataPromise}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserDataContext must be used within a UserDataProvider");
  }
  return context;
}
