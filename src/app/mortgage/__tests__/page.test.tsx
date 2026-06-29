import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { CashFlowProfile } from "@/domain/model/CashFlowProfile";
import { LineItem } from "@/domain/model/LineItem";
import { ProfileProvider } from "@/components/profile/ProfileProvider";

import MortgagePage from "../page";

// Deterministic fixture: startMonth '2027-05' means index 0 = 2027-05 (on/before
// the 2027-06-30 LTV relaxation boundary -> 'temporary' policy) and index 2 =
// 2027-07 (after the boundary -> 'normal' policy). This intentionally does
// NOT rely on the real system clock/"today" — the 60-month window straddles
// the boundary at these known indices regardless of when the test runs.
const START_MONTH = "2027-05";

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

  it("shows the LTV badge as 'temporary' wording at the early assessment-month index (0 = 2027-05, on/before the relaxation boundary)", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    expect(screen.getByText("เกณฑ์ LTV ผ่อนปรน — กู้ได้สูงสุด 100% ถึง 30 มิ.ย. 2027")).toBeInTheDocument();
  });

  it("shows the LTV badge as 'normal' wording at a later assessment-month index (2 = 2027-07, after the relaxation boundary)", async () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();

    const slider = screen.getByLabelText("เลือกเดือนที่ใช้ประเมินสินเชื่อ");
    fireEvent.change(slider, { target: { value: "2" } });

    expect(screen.getAllByText("ก.ค. 2027").length).toBeGreaterThan(0);
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

  it("caps loanTermYears down to (70 - borrowerAge) and shows the remark when age pushes the total over 70", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields(); // borrowerAge 30, loanTermYears defaults to 30 (30 + 30 = 60, under the cap)
    expect(screen.getByLabelText("ระยะเวลากู้")).toHaveValue("30");
    expect(screen.queryByText("อายุผู้กู้ (หลัก) รวม ระยะเวลากู้ ต้องไม่เกิน 70 ปี")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "50" } });

    expect(screen.getByLabelText("ระยะเวลากู้")).toHaveValue("20");
    expect(screen.getByText("อายุผู้กู้ (หลัก) รวม ระยะเวลากู้ ต้องไม่เกิน 70 ปี")).toBeInTheDocument();
  });

  it("does not spring loanTermYears back up when borrowerAge drops again after being capped", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "50" } }); // caps loanTermYears to 20
    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "40" } }); // 40 + 20 = 60, under the cap again

    expect(screen.getByLabelText("ระยะเวลากู้")).toHaveValue("20");
    expect(screen.queryByText("อายุผู้กู้ (หลัก) รวม ระยะเวลากู้ ต้องไม่เกิน 70 ปี")).not.toBeInTheDocument();
  });

  it("derives monthlyIncome/existingDebt from the selected assessment month's cash flow (read-only display)", () => {
    seedProfile();
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(
      screen.getByText(
        (_content, element) =>
          Boolean(element?.textContent?.includes("รายได้ต่อเดือน")) &&
          Boolean(element?.textContent?.includes("50,000")),
        { selector: "p" },
      ),
    ).toBeInTheDocument();
  });

  it("defaults the down payment to 5% of the home price under the temporary 100% LTV policy (no down required)", () => {
    seedProfile(); // savings 500,000; index 0 = 2027-05 -> temporary 100% LTV -> required 0
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "3000000" } });

    // No down required, but we suggest 5% (150,000), well under the 500,000 savings.
    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue("150,000");
  });

  it("defaults the down payment to the LTV-required amount when it is below savings", () => {
    seedProfileWith(100000, 0, 2000000); // savings 2,000,000
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    // Move to a normal-policy month (index 2 = 2027-07) and pick a first home
    // >= 10M -> 90% LTV -> required down = 1,200,000 (< 2,000,000 savings).
    fireEvent.change(screen.getByLabelText("เลือกเดือนที่ใช้ประเมินสินเชื่อ"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "12000000" } });

    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue("1,200,000");
  });

  it("shows the full LTV-required amount even when it exceeds savings", () => {
    seedProfile(); // savings 500,000
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    // Normal policy + first home >= 10M -> required 1,200,000 (> 500,000 savings),
    // shown in full (no longer capped at savings).
    fireEvent.change(screen.getByLabelText("เลือกเดือนที่ใช้ประเมินสินเชื่อ"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "12000000" } });

    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue("1,200,000");
  });

  it("stops auto-filling the down payment once the user edits it", () => {
    seedProfile(); // savings 500,000
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fireEvent.change(screen.getByLabelText("เลือกเดือนที่ใช้ประเมินสินเชื่อ"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "12000000" } });
    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue("1,200,000"); // auto (LTV-required)

    fireEvent.change(screen.getByLabelText("เงินดาวน์ที่มี"), { target: { value: "100000" } });

    // Changing the home price no longer moves the down payment — the user owns it now.
    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "8000000" } });
    expect(screen.getByLabelText("เงินดาวน์ที่มี")).toHaveValue("100,000");
  });

  it("end-to-end: a 3,000,000 home with 0 down renders the spec's ~18,962 monthly payment in the actual DOM", () => {
    seedProfileWith(100000, 0, 0);
    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fillRequiredFields();
    // Force 0 down (the suggested default would otherwise auto-fill 5%) to match
    // the spec's 3,000,000-loan worked example.
    fireEvent.change(screen.getByLabelText("เงินดาวน์ที่มี"), { target: { value: "0" } });

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
      screen.getByText("ผู้กู้ร่วมควรมีรายได้อย่างน้อย 32,405 บาท/เดือน เพื่อให้กู้ผ่าน (DSR 40%)", { exact: false }),
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

  it("persists the form across unmount/remount (survives navigating away and back)", () => {
    seedProfile();
    const { unmount } = render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    fireEvent.change(screen.getByLabelText("ราคาบ้านที่ต้องการ"), { target: { value: "3500000" } });
    fireEvent.change(screen.getByLabelText("อายุผู้กู้"), { target: { value: "45" } });

    unmount(); // simulate navigating away

    render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    expect(screen.getByLabelText("ราคาบ้านที่ต้องการ")).toHaveValue("3,500,000");
    expect(screen.getByLabelText("อายุผู้กู้")).toHaveValue("45");
  });

  it("applies the responsive lg: container width class on the page's main element (design.md section 4)", () => {
    seedProfile();

    const { container } = render(
      <ProfileProvider>
        <MortgagePage />
      </ProfileProvider>,
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("max-w-193", "lg:max-w-270");
  });
});
