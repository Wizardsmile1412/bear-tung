import { LTV_RELAXATION_END_DATE } from "../config/defaults";
import { LtvPolicy } from "./LtvPolicy";
import { NormalLtvPolicy } from "./NormalLtvPolicy";
import { TemporaryLtvPolicy } from "./TemporaryLtvPolicy";

/**
 * Selects the active `LtvPolicy` by date. The temporary relaxation's start
 * date (1 May 2025) is not checked here: by the time anyone uses this app,
 * that start date has already passed, so only the end boundary matters.
 */
export class LtvPolicyFactory {
  static forDate(date: Date): LtvPolicy {
    const relaxEnd = new Date(LTV_RELAXATION_END_DATE);
    return date <= relaxEnd ? new TemporaryLtvPolicy() : new NormalLtvPolicy();
  }
}
