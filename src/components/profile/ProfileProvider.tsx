"use client";

import { createContext, useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Assets, CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { LocalStorageMortgageFormRepository } from "@/domain/storage/LocalStorageMortgageFormRepository";
import { LocalStorageProfileRepository } from "@/domain/storage/LocalStorageProfileRepository";

export interface ProfileContextValue {
  profile: CashFlowProfile;
  isLoaded: boolean;
  addItem(item: LineItem): void;
  removeItem(id: string): void;
  updateItem(id: string, item: LineItem): void;
  updateAssets(assets: Partial<Assets>): void;
  /** Replaces the entire profile (used when importing an Excel file). */
  replaceProfile(profile: CashFlowProfile): void;
  reset(): void;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

// This value never changes after mount, so no real subscription is needed.
const noopSubscribe = () => () => {};
const getClientIsLoaded = () => true;
const getServerIsLoaded = () => false;

/**
 * Provides the CashFlowProfile + mutation functions to the component tree.
 *
 * Owns the only `ProfileRepository` instance in the app — components must
 * never construct a repository or touch localStorage directly (DIP); they
 * go through `useProfile()` instead.
 */
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [repository] = useState(() => new LocalStorageProfileRepository());
  // The mortgage form is part of the user's data, so a full reset clears it too.
  const [mortgageFormRepository] = useState(() => new LocalStorageMortgageFormRepository());
  // Lazy initializers run once on mount. During SSR `window` is undefined,
  // so `repository.load()` safely returns null and `profile` starts empty;
  // on the client it reads the real stored profile synchronously on the
  // very first render, before paint.
  const [profile, setProfile] = useState<CashFlowProfile>(
    () => repository.load() ?? CashFlowProfile.empty(),
  );
  // `isLoaded` must be `false` during SSR and on the client's matching
  // first hydration pass, then `true` on every render after that —
  // deriving it synchronously from `typeof window !== "undefined"` (the
  // prior approach) made the server's HTML (isLoaded=false) and the
  // client's very first paint (isLoaded=true, since `window` already
  // exists by then) disagree immediately, causing a real, observed Next.js
  // hydration mismatch on every page that branches render output on this
  // flag. `useSyncExternalStore`'s `getServerSnapshot` is the React-native
  // way to express exactly this: React uses it for both SSR and the first
  // client render (matching), then switches to the regular snapshot.
  const isLoaded = useSyncExternalStore(noopSubscribe, getClientIsLoaded, getServerIsLoaded);

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

  const replaceProfile = useCallback((next: CashFlowProfile) => {
    setProfile(next);
  }, []);

  // Clears all items + assets back to empty, keeping the same startMonth, and
  // clears the persisted mortgage form (also part of the user's data).
  const reset = useCallback(() => {
    setProfile((current) => CashFlowProfile.empty(current.startMonth));
    mortgageFormRepository.clear();
  }, [mortgageFormRepository]);

  const value: ProfileContextValue = {
    profile,
    isLoaded,
    addItem,
    removeItem,
    updateItem,
    updateAssets,
    replaceProfile,
    reset,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
