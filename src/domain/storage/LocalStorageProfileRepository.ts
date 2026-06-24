import { PROFILE_STORAGE_KEY } from "../config/defaults";
import { CashFlowProfile, CashFlowProfileData } from "../model/CashFlowProfile";
import { ProfileRepository } from "./ProfileRepository";

/**
 * ProfileRepository implementation backed by the browser's localStorage.
 *
 * Never crashes the app on corrupt/missing data — `load()` simply returns
 * `null` so the caller can fall back to `CashFlowProfile.empty()`.
 */
export class LocalStorageProfileRepository implements ProfileRepository {
  load(): CashFlowProfile | null {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const data = JSON.parse(raw) as CashFlowProfileData;
      return CashFlowProfile.fromJSON(data);
    } catch {
      return null;
    }
  }

  save(profile: CashFlowProfile): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));
  }
}
