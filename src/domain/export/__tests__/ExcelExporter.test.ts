import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { ExcelExporter } from "../ExcelExporter";
import { ExportData } from "../ExportData";

// `xlsx` is an ESM module — its namespace object is not configurable, so
// `vi.spyOn(XLSX, "writeFile")` throws ("Cannot redefine property"). Mock the
// module instead, keeping every other export (`utils`, etc.) as the real
// implementation via `importActual`, and only stubbing `writeFile` (the
// actual-download side effect, not meaningfully testable in jsdom).
vi.mock("xlsx", async () => {
  const actual = await vi.importActual<typeof XLSX>("xlsx");
  return { ...actual, writeFile: vi.fn() };
});

function buildExportData(overrides: Partial<ExportData> = {}): ExportData {
  const projection = Array.from({ length: 60 }, (_, i) => ({
    month: `2026-${String((i % 12) + 1).padStart(2, "0")}`,
    totalIncome: 50000,
    totalExpense: 20000,
    totalDebt: 5000,
    remainingCashFlow: 25000,
    score: 80,
    light: "green",
  }));

  return {
    month: "2026-06",
    cashFlow: {
      rows: [
        { category: "รายรับ", subCategory: "เงินเดือน", label: "เงินเดือนหลัก", amountPerMonth: 50000 },
        { category: "รายจ่าย", subCategory: "อาหาร", label: "ค่าอาหาร", amountPerMonth: 8000 },
      ],
      savings: 120000,
      totalIncome: 50000,
      totalExpense: 20000,
      totalDebt: 5000,
      remainingCashFlow: 25000,
    },
    health: {
      rows: [
        {
          key: "savingsRate",
          label: "Savings Rate",
          value: 0.25,
          valueDisplay: "25%",
          thresholdDescription: "ควรมากกว่า 20% ของรายรับ",
          score: 100,
          status: "good",
        },
        {
          key: "emergencyFund",
          label: "Emergency Fund",
          value: 0,
          valueDisplay: "ไม่จำกัด",
          thresholdDescription: "ควรมีอย่างน้อย 3-6 เดือน",
          score: 100,
          status: "good",
        },
      ],
      score: 90,
      light: "green",
    },
    projection,
    ...overrides,
  };
}

describe("ExcelExporter.buildWorkbook", () => {
  it("builds exactly 4 sheets, in order, with the expected names", () => {
    const exporter = new ExcelExporter();
    const workbook = exporter.buildWorkbook(buildExportData());

    expect(workbook.SheetNames).toEqual(["Cash Flow", "Health Check", "Mortgage", "Projection 5y"]);
    expect(Object.keys(workbook.Sheets)).toHaveLength(4);
  });

  it("Cash Flow sheet round-trips row content and totals", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData();
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Cash Flow"]);

    expect(rows[0]).toMatchObject({ category: "รายรับ", subCategory: "เงินเดือน", label: "เงินเดือนหลัก", amountPerMonth: 50000 });
    expect(rows[1]).toMatchObject({ category: "รายจ่าย", subCategory: "อาหาร", label: "ค่าอาหาร", amountPerMonth: 8000 });

    const totalRow = rows.find((row) => row.label === "รวมรายรับ");
    expect(totalRow?.amountPerMonth).toBe(50000);
    const savingsRow = rows.find((row) => row.label === "เงินสำรอง/เงินออม");
    expect(savingsRow?.amountPerMonth).toBe(120000);
  });

  it("Cash Flow sheet shows ผ่อนหมดเดือน for a debt row with a payoff month, and blank otherwise", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      cashFlow: {
        rows: [
          { category: "รายรับ", subCategory: "เงินเดือน", label: "เงินเดือนหลัก", amountPerMonth: 50000 },
          {
            category: "หนี้สิน",
            subCategory: "บ้าน",
            label: "ผ่อนบ้าน",
            amountPerMonth: 15000,
            payoffMonth: "มิ.ย. 2026",
          },
        ],
        savings: 120000,
        totalIncome: 50000,
        totalExpense: 0,
        totalDebt: 15000,
        remainingCashFlow: 35000,
      },
    });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Cash Flow"]);
    expect(rows.find((row) => row.label === "เงินเดือนหลัก")?.["ผ่อนหมดเดือน"]).toBe("");
    expect(rows.find((row) => row.label === "ผ่อนบ้าน")?.["ผ่อนหมดเดือน"]).toBe("มิ.ย. 2026");
  });

  it("Health Check sheet contains every ratio row plus the overall score/light", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData();
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Health Check"]);

    expect(rows.some((row) => row["มูลค่า"] === "25%")).toBe(true);
    expect(rows.some((row) => row["มูลค่า"] === "ไม่จำกัด")).toBe(true);

    const overallRow = rows.find((row) => row["รายการ"] === "คะแนนสุขภาพการเงินโดยรวม");
    expect(overallRow?.["คะแนน"]).toBe(90);
    expect(overallRow?.["สถานะ"]).toBe("green");
  });

  it("Health Check sheet formats the คะแนน column with 2 decimal places", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData();
    const workbook = exporter.buildWorkbook(data);
    const sheet = workbook.Sheets["Health Check"];

    // คะแนน is column index 3 (รายการ, มูลค่า, เกณฑ์ที่ควรเป็น, คะแนน, สถานะ); row 0 is the header.
    const firstScoreAddress = XLSX.utils.encode_cell({ r: 1, c: 3 });
    expect(sheet[firstScoreAddress]?.z).toBe("#,##0.00");
  });

  it("Mortgage sheet shows the placeholder row when data.mortgage is undefined", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({ mortgage: undefined });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Mortgage"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]["ข้อมูล"]).toBe(
      "ยังไม่ได้กรอกข้อมูลประเมินสินเชื่อ — ไปที่หน้าประเมินสินเชื่อบ้านเพื่อกรอกข้อมูล",
    );
  });

  it("Mortgage sheet shows inputs + results + co-borrower section when data.mortgage is present", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      mortgage: {
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 300000,
          monthlyIncome: 50000,
          existingDebt: 5000,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 2_700_000,
          maxLoanByLtv: 3_000_000,
          maxLoanByDsr: 2_700_000,
          bindingConstraint: "dsr",
          ltvPercent: 1,
          requiredDownPayment: 0,
          affordableHomePrice: 3_000_000,
          canAffordTarget: true,
          monthlyPayment: 15000,
          dsrAfterLoan: 0.4,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "temporary",
        },
        coBorrower: {
          input: {
            homePrice: 3_000_000,
            downPaymentAvailable: 300000,
            monthlyRate: 0.0054,
            numPayments: 360,
            userIncome: 50000,
            userDebt: 5000,
            coDebt: 0,
            dsrLimit: 0.4,
            maxLoanByLtv: 3_000_000,
          },
          result: {
            isLtvBound: false,
            alreadyQualifies: true,
            requiredCoIncome: 0,
          },
        },
      },
    });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Mortgage"]);
    const byLabel = (label: string) => rows.find((row) => row["รายการ"] === label);

    expect(byLabel("ราคาบ้าน")?.["ค่า"]).toBe(3_000_000);
    expect(byLabel("วงเงินกู้สูงสุด")?.["ค่า"]).toBe(2_700_000);
    expect(byLabel("ซื้อบ้านราคานี้ได้หรือไม่")?.["ค่า"]).toBe("ได้");
    expect(byLabel("มีคุณสมบัติเพียงพอแล้ว (ไม่ต้องมีผู้กู้ร่วม)")?.["ค่า"]).toBe("ใช่");
    // coIncomeProvided was not supplied in this fixture -> combinedIncomeSufficient
    // is undefined -> the "รายได้รวมเพียงพอหรือไม่" row must not appear at all.
    expect(byLabel("รายได้รวมเพียงพอหรือไม่")).toBeUndefined();
  });

  it("Mortgage sheet formats money values with a thousands-separator and percentage values with 2 decimal places", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      mortgage: {
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 300000,
          monthlyIncome: 50000,
          existingDebt: 5000,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 2_700_000,
          maxLoanByLtv: 3_000_000,
          maxLoanByDsr: 2_700_000,
          bindingConstraint: "dsr",
          ltvPercent: 1,
          requiredDownPayment: 0,
          affordableHomePrice: 3_000_000,
          canAffordTarget: true,
          monthlyPayment: 15000,
          dsrAfterLoan: 0.4,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "temporary",
        },
        coBorrower: {
          input: {
            homePrice: 3_000_000,
            downPaymentAvailable: 300000,
            monthlyRate: 0.0054,
            numPayments: 360,
            userIncome: 50000,
            userDebt: 5000,
            coDebt: 0,
            dsrLimit: 0.4,
            maxLoanByLtv: 3_000_000,
          },
          result: {
            isLtvBound: false,
            alreadyQualifies: true,
            requiredCoIncome: 0,
          },
        },
      },
    });
    const workbook = exporter.buildWorkbook(data);
    const sheet = workbook.Sheets["Mortgage"];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    const rowIndex = (label: string) => rows.findIndex((row) => row["รายการ"] === label) + 1; // +1: header is row 0

    const moneyAddress = XLSX.utils.encode_cell({ r: rowIndex("ราคาบ้าน"), c: 1 });
    expect(sheet[moneyAddress]?.z).toBe("#,##0");

    const decimalAddress = XLSX.utils.encode_cell({ r: rowIndex("อัตราดอกเบี้ย (% ต่อปี)"), c: 1 });
    expect(sheet[decimalAddress]?.z).toBe("#,##0.00");

    // Plain counts (homeOrder) get no special number format applied.
    const plainAddress = XLSX.utils.encode_cell({ r: rowIndex("บ้านลำดับที่"), c: 1 });
    expect(sheet[plainAddress]?.z).not.toBe("#,##0");
    expect(sheet[plainAddress]?.z).not.toBe("#,##0.00");
  });

  it("Mortgage sheet shows 'ใช่' for the LTV-bound co-borrower case (isLtvBound: true)", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      mortgage: {
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 0,
          monthlyIncome: 50000,
          existingDebt: 5000,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 2_000_000,
          maxLoanByLtv: 2_000_000,
          maxLoanByDsr: 2_700_000,
          bindingConstraint: "ltv",
          ltvPercent: 0.667,
          requiredDownPayment: 1_000_000,
          affordableHomePrice: 2_000_000,
          canAffordTarget: false,
          monthlyPayment: 18000,
          dsrAfterLoan: 0.46,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "normal",
        },
        coBorrower: {
          input: {
            homePrice: 3_000_000,
            downPaymentAvailable: 0,
            monthlyRate: 0.0054,
            numPayments: 360,
            userIncome: 50000,
            userDebt: 5000,
            coDebt: 0,
            dsrLimit: 0.4,
            maxLoanByLtv: 2_000_000, // loanNeeded (3M) exceeds this -> isLtvBound
          },
          result: {
            isLtvBound: true,
            alreadyQualifies: false,
            requiredCoIncome: 0,
          },
        },
      },
    });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Mortgage"]);
    const byLabel = (label: string) => rows.find((row) => row["รายการ"] === label);

    expect(byLabel("LTV เป็นข้อจำกัด (ผู้กู้ร่วมช่วยไม่ได้)")?.["ค่า"]).toBe("ใช่");
  });

  it("Mortgage sheet shows 'เพียงพอ' when coIncomeProvided makes combinedIncomeSufficient true", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      mortgage: {
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 300000,
          monthlyIncome: 20000,
          existingDebt: 5000,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 1_000_000,
          maxLoanByLtv: 3_000_000,
          maxLoanByDsr: 1_000_000,
          bindingConstraint: "dsr",
          ltvPercent: 1,
          requiredDownPayment: 0,
          affordableHomePrice: 1_300_000,
          canAffordTarget: false,
          monthlyPayment: 15000,
          dsrAfterLoan: 1,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "temporary",
        },
        coBorrower: {
          input: {
            homePrice: 3_000_000,
            downPaymentAvailable: 300000,
            monthlyRate: 0.0054,
            numPayments: 360,
            userIncome: 20000,
            userDebt: 5000,
            coDebt: 0,
            dsrLimit: 0.4,
            maxLoanByLtv: 3_000_000,
            coIncomeProvided: 1_000_000, // far more than required -> combinedIncomeSufficient = true
          },
          result: {
            isLtvBound: false,
            alreadyQualifies: false,
            requiredCoIncome: 17500,
            combinedIncomeSufficient: true,
          },
        },
      },
    });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Mortgage"]);
    const byLabel = (label: string) => rows.find((row) => row["รายการ"] === label);

    expect(byLabel("รายได้รวมเพียงพอหรือไม่")?.["ค่า"]).toBe("เพียงพอ");
  });

  it("Mortgage sheet shows 'ไม่เพียงพอ' when coIncomeProvided makes combinedIncomeSufficient false", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData({
      mortgage: {
        input: {
          homePrice: 3_000_000,
          homeOrder: 1,
          borrowerAge: 30,
          interestRatePercent: 6.5,
          loanTermYears: 30,
          downPaymentAvailable: 300000,
          monthlyIncome: 20000,
          existingDebt: 5000,
          dsrLimit: 0.4,
        },
        result: {
          maxLoan: 1_000_000,
          maxLoanByLtv: 3_000_000,
          maxLoanByDsr: 1_000_000,
          bindingConstraint: "dsr",
          ltvPercent: 1,
          requiredDownPayment: 0,
          affordableHomePrice: 1_300_000,
          canAffordTarget: false,
          monthlyPayment: 15000,
          dsrAfterLoan: 1,
          effectiveTermYears: 30,
          monthlyRate: 0.0054,
          numPayments: 360,
          ltvPolicyName: "temporary",
        },
        coBorrower: {
          input: {
            homePrice: 3_000_000,
            downPaymentAvailable: 300000,
            monthlyRate: 0.0054,
            numPayments: 360,
            userIncome: 20000,
            userDebt: 5000,
            coDebt: 0,
            dsrLimit: 0.4,
            maxLoanByLtv: 3_000_000,
            coIncomeProvided: 1, // far too little -> combinedIncomeSufficient = false
          },
          result: {
            isLtvBound: false,
            alreadyQualifies: false,
            requiredCoIncome: 17500,
            combinedIncomeSufficient: false,
          },
        },
      },
    });
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Mortgage"]);
    const byLabel = (label: string) => rows.find((row) => row["รายการ"] === label);

    expect(byLabel("รายได้รวมเพียงพอหรือไม่")?.["ค่า"]).toBe("ไม่เพียงพอ");
  });

  it("Projection sheet has exactly 60 data rows matching the input series", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData();
    const workbook = exporter.buildWorkbook(data);

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Projection 5y"]);
    expect(rows).toHaveLength(60);
    expect(rows[0]).toMatchObject({
      เดือน: "2026-01",
      รายรับ: 50000,
      รายจ่าย: 20000,
      หนี้สิน: 5000,
      เงินคงเหลือ: 25000,
      คะแนน: 80,
      สถานะ: "green",
    });
  });
});

describe("ExcelExporter.export", () => {
  it("calls XLSX.writeFile once with the workbook from buildWorkbook and the given filename", () => {
    const exporter = new ExcelExporter();
    const data = buildExportData();

    const writeFileMock = XLSX.writeFile as ReturnType<typeof vi.fn>;
    writeFileMock.mockClear();
    const buildWorkbookSpy = vi.spyOn(exporter, "buildWorkbook");

    exporter.export(data, "bear-tung-2026-06.xlsx");

    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(buildWorkbookSpy).toHaveBeenCalledTimes(1);
    const [workbookArg, fileNameArg] = writeFileMock.mock.calls[0];
    expect(workbookArg).toBe(buildWorkbookSpy.mock.results[0].value);
    expect(fileNameArg).toBe("bear-tung-2026-06.xlsx");
  });
});
