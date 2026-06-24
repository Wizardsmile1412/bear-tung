import { describe, expect, it } from "vitest";

import { lightToTone } from "../trafficLight";

describe("lightToTone", () => {
  it("maps green to good", () => {
    expect(lightToTone("green")).toBe("good");
  });

  it("maps yellow to warning", () => {
    expect(lightToTone("yellow")).toBe("warning");
  });

  it("maps red to danger", () => {
    expect(lightToTone("red")).toBe("danger");
  });
});
