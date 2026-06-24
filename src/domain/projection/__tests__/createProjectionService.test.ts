import { describe, expect, it } from "vitest";

import { PROJECTION_MONTHS } from "../../config/defaults";
import { CashFlowProfile } from "../../model/CashFlowProfile";
import { createProjectionService } from "../createProjectionService";

describe("createProjectionService", () => {
  it("wires a ProjectionService that builds a PROJECTION_MONTHS-length series", () => {
    const service = createProjectionService();
    const profile = CashFlowProfile.empty("2026-06");

    const series = service.buildSeries(profile);

    expect(series).toHaveLength(PROJECTION_MONTHS);
    expect(series[0].ratioResults.map((r) => r.key)).toEqual(["savingsRate", "dsr", "emergencyFund"]);
  });
});
