"use client";

import { useContext } from "react";

import { ProfileContext, ProfileContextValue } from "./ProfileProvider";

/** Reads the CashFlowProfile context. Must be used within a <ProfileProvider>. */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a <ProfileProvider>.");
  }
  return context;
}
