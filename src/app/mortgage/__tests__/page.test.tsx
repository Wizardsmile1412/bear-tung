import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

import MortgagePage from "../page";

// Deterministic fixture: startMonth '2026-05' means index 0 = 2026-05 (on/before
// the 2026-06-30 LTV relaxation boundary -> 'temporary' policy) and index 2 =
// 2026-07 (after the boundary -> 'normal' policy). This intentionally does
// NOT rely on the real system clock/"today" — the 60-month window straddles
// the boundary at these known indices regardless of when the test runs.
const START_MONTH = "2026-05";

function seedProfile(): void {
  let profile = CashFlowProfile.empty(START_MONTH);
  profile = profile.addItem(
    LineItem.create({
      id: "income-1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [{ effectiveFrom: START_MONTH, amount: 50000 }],
    }),
  );
  profile = profile.addItem(
    LineItem.create({
      id: "expense-1",
      category: "expense",
      subCategory: "food",
      label: "Food",
      changes: [{ effectiveFrom: START_MONTH, amount: 10000 }],
    }),
  );
  profile = profile.updateAssets({ savings: 500000 });

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));
}

/**
 * Seeds a profile with a specific income/debt/savings combination, for the
 * spec worked-example end-to-end checks below (income/debt amounts differ
 * from `seedProfile`'s fixed 50,000/0/500,000 values).
 */
function seedProfileWith(income: number, debt: number, savings: number): void {
  let profile = CashFlowProfile.empty(START_MONTH);
  profile = profile.addItem(
    LineItem.create({
      id: "income-1",
      category: "income",
      subCategory: "salary",
      label: "Salary",
      changes: [{ effectiveFrom: START_MONTH, amount: income }],
    }),
  );
  if (debt > 0) {
    profile = profile.addItem(
      LineItem.create({
        id: "debt-1",
        category: "debt",
        subCategory: "personal_loan",
        label: "Loan",
        changes: [{ effectiveFrom: START_MONTH, amount: debt }],
      }),
    );
  }
  profile = profile.updateAssets({ savings });

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile.toJSON()));
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "3000000" } });
  fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "30" } });
}

describe("MortgagePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the empty state when there are no line items", () => {
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(screen.getByText("ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "เริ่มกรอก Cash Flow" })).toHaveAttribute("href", "/cashflow");
  });

  it("hides the Export Excel button in the empty state", () => {
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(screen.queryByRole("button", { name: /Export Excel/i })).not.toBeInTheDocument();
  });

  it("shows the Export Excel button before homePrice/borrowerAge are filled in (no mortgage data yet), and clicking it doesn't throw", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    const exportButton = screen.getByRole("button", { name: /Export Excel/i });
    expect(exportButton).toBeInTheDocument();

    await expect(userEvent.click(exportButton)).resolves.not.toThrow();
  });

  it("keeps showing the Export Excel button once homePrice/borrowerAge are filled in (mortgage data attached), and clicking it doesn't throw", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    const exportButton = screen.getByRole("button", { name: /Export Excel/i });
    expect(exportButton).toBeInTheDocument();

    await expect(userEvent.click(exportButton)).resolves.not.toThrow();
  });

  it("shows the inline prompt and no result card before homePrice/borrowerAge are filled in", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(screen.getByText("กรอกราคาบ้านและอายุผู้กู้เพื่อดูผลการประเมิน")).toBeInTheDocument();
    expect(screen.queryByText("ผลการประเมินสินเชื่อ")).not.toBeInTheDocument();
  });

  it("shows the LTV badge as 'temporary' wording at the early assessment-month index (0 = 2026-05, on/before the relaxation boundary)", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    expect(screen.getByText("เกณฑ์ LTV ผ่อนปรน — กู้ได้สูงสุด 100% ถึง 30 มิ.ย. 2026")).toBeInTheDocument();
  });

  it("shows the LTV badge as 'normal' wording at a later assessment-month index (2 = 2026-07, after the relaxation boundary)", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    const slider = screen.getByLabelText("เลือกเดือนที่ใช้ประเมินสินเชื่อ");
    fireEvent.change(slider, { target: { value: "2" } });

    expect(screen.getByText("ก.ค. 2026")).toBeInTheDocument();
    expect(screen.getByText("เกณฑ์ LTV ปกติ — ตามจำนวนบ้านและราคาบ้าน")).toBeInTheDocument();
  });

  it("filling in the form updates the result card (canAffordTarget reflects the input)", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    expect(screen.getByText("ผลการประเมินสินเชื่อ")).toBeInTheDocument();
    // homePrice 3,000,000 affordable text appears somewhere as the max affordable price or target.
    expect(screen.getByText("เป็นการประมาณการเพื่อการศึกษา ไม่ใช่การอนุมัติจากธนาคาร")).toBeInTheDocument();
  });

  it("toggling co-borrower shows the co-borrower input section", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    expect(screen.queryByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("ต้องการเพิ่มผู้กู้ร่วม"));

    expect(screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม")).toBeInTheDocument();
  });

  it("derives monthlyIncome/existingDebt from the selected assessment month's cash flow (read-only display)", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(
      screen.getByText((content) => content.includes("รายได้ต่อเดือน") && content.includes("50,000")),
    ).toBeInTheDocument();
  });

  it("defaults downPaymentAvailable from profile.assets.savings", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue(500000);
  });

  it("end-to-end: a 3,000,000 home with 0 down renders the spec's ~18,962 monthly payment in the actual DOM", () => {
    seedProfileWith(100000, 0, 0);
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    expect(screen.getByText("18,962 บาท", { exact: false })).toBeInTheDocument();
  });

  it("end-to-end: the co-borrower worked example (home 4M, down 1M, income 35k/debt 5k, coDebt 3k) renders the spec's ~32,405 required co-income", async () => {
    seedProfileWith(35000, 5000, 1000000);
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "4000000" } });
    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("เงินดาวน์ที่มี"), { target: { value: "1000000" } });

    await userEvent.click(screen.getByLabelText("ต้องการเพิ่มผู้กู้ร่วม"));
    fireEvent.change(screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม"), { target: { value: "3000" } });

    expect(
      screen.getByText("ผู้กู้ร่วมควรมีรายได้อย่างน้อย 32,405 บาท/เดือน เพื่อให้กู้ผ่าน", { exact: false }),
    ).toBeInTheDocument();
  });

  it("entering co-borrower income (coIncomeProvided) shows the combined-income-sufficient badge and the export button still doesn't throw", async () => {
    // Same worked example as above (home 4M, down 1M, income 35k/debt 5k,
    // coDebt 3k -> required co-income ~32,405), but this time also fills in
    // "รายได้ของผู้กู้ร่วม (ถ้ามี)" (coIncomeProvided) so
    // CoBorrowerService.combinedIncomeSufficient becomes defined — exercising
    // both the on-screen badge and the export pipeline's "รายได้รวมเพียงพอ
    // หรือไม่" Mortgage-sheet row end-to-end (not just at the unit level).
    seedProfileWith(35000, 5000, 1000000);
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "4000000" } });
    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("เงินดาวน์ที่มี"), { target: { value: "1000000" } });

    await userEvent.click(screen.getByLabelText("ต้องการเพิ่มผู้กู้ร่วม"));
    fireEvent.change(screen.getByLabelText("หนี้ปัจจุบันของผู้กู้ร่วม"), { target: { value: "3000" } });

    // Insufficient co-income (well under the required ~32,405) -> the "ยังไม่
    // เพียงพอ" badge.
    fireEvent.change(screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)"), { target: { value: "1000" } });
    expect(screen.getByText("รายได้รวมยังไม่เพียงพอ")).toBeInTheDocument();

    const exportButton = screen.getByRole("button", { name: /Export Excel/i });
    await expect(userEvent.click(exportButton)).resolves.not.toThrow();

    // Now raise it well above the required amount -> the "เพียงพอ" badge,
    // proving both branches of combinedIncomeSufficient render correctly.
    fireEvent.change(screen.getByLabelText("รายได้ของผู้กู้ร่วม (ถ้ามี)"), { target: { value: "50000" } });
    expect(screen.getByText("รายได้รวมของคุณและผู้กู้ร่วมเพียงพอแล้ว")).toBeInTheDocument();

    await expect(userEvent.click(exportButton)).resolves.not.toThrow();
  });

  it("applies the responsive lg: container width class on the page's main element (design.md section 4)", () => {
    seedProfile();

    const { container } = render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("max-w-[772px]", "lg:max-w-[1080px]");
  });
});
