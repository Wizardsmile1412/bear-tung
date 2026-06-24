"use client";

import { createContext, useCallback, useEffect, useState } from "react";

import { Assets, CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { LocalStorageProfileRepository } from "@/domain/storage/LocalStorageProfileRepository";

export interface ProfileContextValue {
  profile: CashFlowProfile;
  isLoaded: boolean;
  addItem(item: LineItem): void;
  removeItem(id: string): void;
  updateItem(id: string, item: LineItem): void;
  updateAssets(assets: Partial<Assets>): void;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Provides the CashFlowProfile + mutation functions to the component tree.
 *
 * Owns the only `ProfileRepository` instance in the app — components must
 * never construct a repository or touch localStorage directly (DIP); they
 * go through `useProfile()` instead.
 */
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [repository] = useState(() => new LocalStorageProfileRepository());
  // Lazy initializers run once on mount. During SSR `window` is undefined,
  // so `repository.load()` safely returns null and `isLoaded` starts false;
  // during the real client mount (including hydration) `window` is defined,
  // so the actual stored profile (if any) is read synchronously — no effect
  // needed to "detect mount", which keeps state derivation out of effects.
  const [profile, setProfile] = useState<CashFlowProfile>(
    () => repository.load() ?? CashFlowProfile.empty(),
  );
  const [isLoaded] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    repository.save(profile);
  }, [profile, isLoaded, repository]);

  const addItem = useCallback((item: LineItem) => {
    setProfile((current) => current.addItem(item));
  }, []);

  const removeItem = useCallback((id: string) => {
    setProfile((current) => current.removeItem(id));
  }, []);

  const updateItem = useCallback((id: string, item: LineItem) => {
    setProfile((current) => current.updateItem(id, item));
  }, []);

  const updateAssets = useCallback((assets: Partial<Assets>) => {
    setProfile((current) => current.updateAssets(assets));
  }, []);

  const value: ProfileContextValue = {
    profile,
    isLoaded,
    addItem,
    removeItem,
    updateItem,
    updateAssets,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
