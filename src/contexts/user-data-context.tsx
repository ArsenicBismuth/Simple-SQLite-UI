"use client";

import { createContext, useContext } from "react";
import type { GetUserWithTodosResult } from "@/types";

export const UserDataContext = createContext<GetUserWithTodosResult | null>(null);

export function UserDataProvider({
  children,
  userData,
}: {
  children: React.ReactNode;
  userData: GetUserWithTodosResult;
}) {
  return (
    <UserDataContext.Provider value={userData}>
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
