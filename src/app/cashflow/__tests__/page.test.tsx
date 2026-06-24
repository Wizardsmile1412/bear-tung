import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

import CashFlowPage from "../page";

const START_MONTH = "2026-06";

/**
 * Minimal page-level smoke test (the category-group/savings/empty-state
 * behavior itself is already covered by each component's own test suite in
 * `src/components/cashflow/__tests__/`). This file exists primarily to
 * verify Phase 7's responsive container class change is genuinely applied
 * in the rendered DOM, not silently dropped.
 */
describe("CashFlowPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the empty state and category group headings for a brand-new profile", () => {
    render(
      <ProfileProvider>
        <CashFlowPage />
      </ProfileProvider>,
    );

    expect(screen.getByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cash Flow ของคุณ" })).toBeInTheDocument();
  });

  it("applies the responsive lg: container width class on the page's main element (design.md section 4)", () => {
    const { container } = render(
      <ProfileProvider>
        <CashFlowPage />
      </ProfileProvider>,
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("max-w-[772px]", "lg:max-w-[1080px]");
  });

  it("adds an income item end-to-end through the real ProfileProvider (onAdd wiring), and the empty state disappears", async () => {
    render(
      <ProfileProvider>
        <CashFlowPage />
      </ProfileProvider>,
    );

    expect(screen.getByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "+ เพิ่มรายการ" })[0]);
    await userEvent.type(screen.getByLabelText("รายการ"), "เงินเดือนประจำ");
    await userEvent.clear(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"));
    await userEvent.type(screen.getByLabelText("จำนวนเงิน (บาท/เดือน)"), "35000");
    await userEvent.click(screen.getByRole("button", { name: "เพิ่มรายการ" }));

    expect(screen.getByText("เงินเดือนประจำ")).toBeInTheDocument();
    expect(screen.queryByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).not.toBeInTheDocument();
  });

  it("deletes an existing item end-to-end through the real ProfileProvider (onDelete wiring)", async () => {
    let profile = CashFlowProfile.empty(START_MONTH);
    profile = profile.addItem(
      LineItem.create({
        id: "income-1",
        category: "income",
        subCategory: "salary",
        label: "เงินเดือนประจำ",
        changes: [{ effectiveFrom: START_MONTH, amount: 35000 }],
      }),
    );
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));

    render(
      <ProfileProvider>
        <CashFlowPage />
      </ProfileProvider>,
    );

    expect(screen.getByText("เงินเดือนประจำ")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ลบ เงินเดือนประจำ" }));

    expect(screen.queryByText("เงินเดือนประจำ")).not.toBeInTheDocument();
  });

  it("updates savings end-to-end through the real ProfileProvider (SavingsCard's onChange wiring)", async () => {
    render(
      <ProfileProvider>
        <CashFlowPage />
      </ProfileProvider>,
    );

    const savingsInput = screen.getByLabelText("เงินออม/เงินสดที่มีอยู่ตอนนี้");
    await userEvent.clear(savingsInput);
    await userEvent.type(savingsInput, "90000");

    expect(savingsInput).toHaveValue(90000);
  });
});
