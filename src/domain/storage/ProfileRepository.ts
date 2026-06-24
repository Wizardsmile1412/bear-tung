import { CashFlowProfile } from "../model/CashFlowProfile";

/**
 * Repository abstraction for persisting the CashFlowProfile (DIP) —
 * lets the UI depend on this interface instead of a concrete storage
 * mechanism, so storage can be swapped (e.g. for an API-backed repo) later.
 */
export interface ProfileRepository {
  load(): CashFlowProfile | null;
  save(profile: CashFlowProfile): void;
}
