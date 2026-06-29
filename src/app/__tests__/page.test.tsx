import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Home calls `useRouter()` to navigate after an Excel import — stub it so the
// component renders outside a real Next.js app-router context.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

import Home from "../page";

const START_MONTH = "2026-06";

describe("Home (onboarding)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the 'เริ่มต้นใช้งาน' CTA linking to /cashflow when there is no data yet", () => {
    render(
      <ProfileProvider>
        <Home />
      </ProfileProvider>,
    );

    const cta = screen.getByRole("link", { name: "เริ่มต้นใช้งาน" });
    expect(cta).toHaveAttribute("href", "/cashflow");

    // The returning-user CTA must not also be present.
    expect(screen.queryByRole("link", { name: "ดูสุขภาพการเงินของคุณ" })).not.toBeInTheDocument();
  });

  it("shows the 'ดูสุขภาพการเงินของคุณ' primary CTA + 'แก้ไข Cash Flow' secondary link when the profile already has data", () => {
    let profile = CashFlowProfile.empty(START_MONTH);
    profile = profile.addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "Salary",
        changes: [{ effectiveFrom: START_MONTH, amount: 40000 }],
      }),
    );
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));

    render(
      <ProfileProvider>
        <Home />
      </ProfileProvider>,
    );

    const primaryCta = screen.getByRole("link", { name: "ดูสุขภาพการเงินของคุณ" });
    expect(primaryCta).toHaveAttribute("href", "/dashboard");

    const secondaryCta = screen.getByRole("link", { name: "แก้ไข Cash Flow" });
    expect(secondaryCta).toHaveAttribute("href", "/cashflow");

    // The first-time CTA must not also be present.
    expect(screen.queryByRole("link", { name: "เริ่มต้นใช้งาน" })).not.toBeInTheDocument();
  });

  it("renders a short Thai explanation of what the app does", () => {
    render(
      <ProfileProvider>
        <Home />
      </ProfileProvider>,
    );

    expect(screen.getByRole("heading", { name: "เช็กสุขภาพการเงินของคุณ ใน Bear-tung" })).toBeInTheDocument();
    expect(screen.getByText(/คะแนนสุขภาพการเงิน/)).toBeInTheDocument();
  });

  it("applies the responsive lg: container width class on the page's main element (design.md section 4)", () => {
    const { container } = render(
      <ProfileProvider>
        <Home />
      </ProfileProvider>,
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("max-w-193", "lg:max-w-270");
  });
});
