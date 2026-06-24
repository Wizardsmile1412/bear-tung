import { LineItemCategory } from "@/domain/model/LineItem";

export interface SubCategoryOption {
  value: string;
  labelTh: string;
}

// Preset sub-category options per category, shown in the "add line item" form.
// UI-only concern (not a domain rule) — kept here rather than in src/domain.
export const SUB_CATEGORY_PRESETS: Record<LineItemCategory, SubCategoryOption[]> = {
  income: [
    { value: "salary", labelTh: "เงินเดือน" },
    { value: "freelance", labelTh: "อาชีพเสริม" },
    { value: "business", labelTh: "ธุรกิจ" },
    { value: "other", labelTh: "อื่นๆ" },
  ],
  expense: [
    { value: "food", labelTh: "อาหาร" },
    { value: "transport", labelTh: "ค่าเดินทาง" },
    { value: "utilities", labelTh: "ค่าน้ำค่าไฟ" },
    { value: "rent", labelTh: "ค่าเช่า" },
    { value: "shopping", labelTh: "ของใช้" },
    { value: "entertainment", labelTh: "บันเทิง" },
    { value: "other", labelTh: "อื่นๆ" },
  ],
  debt: [
    { value: "carLoan", labelTh: "ผ่อนรถ" },
    { value: "homeLoan", labelTh: "ผ่อนบ้าน" },
    { value: "personalLoan", labelTh: "สินเชื่อส่วนบุคคล" },
    { value: "creditCard", labelTh: "บัตรเครดิต" },
    { value: "other", labelTh: "อื่นๆ" },
  ],
};

/** Looks up the Thai label for a (category, subCategory) pair; falls back to the raw value. */
export function subCategoryLabel(category: LineItemCategory, subCategory: string): string {
  const match = SUB_CATEGORY_PRESETS[category].find((option) => option.value === subCategory);
  return match ? match.labelTh : subCategory;
}

export const CATEGORY_LABELS: Record<LineItemCategory, string> = {
  income: "รายรับ",
  expense: "รายจ่าย",
  debt: "หนี้สิน",
};
