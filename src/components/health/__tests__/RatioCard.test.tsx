import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RatioResult } from "@/domain/ratios/Ratio";

import { RatioCard } from "../RatioCard";

const dsrResult: RatioResult = {
  key: "dsr",
  label: "DSR (สัดส่วนภาระหนี้ต่อรายได้)",
  value: 0.45,
  score: 50,
  status: "warning",
};

const savingsGoodResult: RatioResult = {
  key: "savingsRate",
  label: "อัตราการออม",
  value: 0.25,
  score: 100,
  status: "good",
};

const emergencyDangerResult: RatioResult = {
  key: "emergencyFund",
  label: "เงินสำรองฉุกเฉิน",
  value: 0.5,
  score: 10,
  status: "danger",
};

describe("RatioCard", () => {
  it("renders the label, formatted value, and status badge", () => {
    render(<RatioCard result={dsrResult} />);

    expect(screen.getByText("DSR (สัดส่วนภาระหนี้ต่อรายได้)")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("พอใช้")).toBeInTheDocument();
  });

  it("renders the 'ดี' badge text for status=good", () => {
    render(<RatioCard result={savingsGoodResult} />);

    expect(screen.getByText("ดี")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders the 'ต้องระวัง' badge text for status=danger", () => {
    render(<RatioCard result={emergencyDangerResult} />);

    expect(screen.getByText("ต้องระวัง")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("hides the explanation by default and reveals it after clicking the toggle", async () => {
    render(<RatioCard result={dsrResult} />);

    const toggle = screen.getByRole("button", { name: "ดูวิธีคิด" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/ธนาคารทั่วไปแนะนำ/)).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/ธนาคารทั่วไปแนะนำ/)).toBeInTheDocument();
  });

  it("shows the exact savingsRate explanation text after expanding", async () => {
    render(<RatioCard result={savingsGoodResult} />);

    await userEvent.click(screen.getByRole("button", { name: "ดูวิธีคิด" }));

    expect(
      screen.getByText(
        "อัตราการออม คือ เงินที่เหลือจากรายรับ หลังหักรายจ่ายและหนี้ทั้งหมด หารด้วยรายรับทั้งหมด ยิ่งสูงยิ่งดี ควรมากกว่า 20% ของรายรับ",
      ),
    ).toBeInTheDocument();
  });

  it("shows the exact dsr explanation text after expanding", async () => {
    render(<RatioCard result={dsrResult} />);

    await userEvent.click(screen.getByRole("button", { name: "ดูวิธีคิด" }));

    expect(
      screen.getByText(
        "DSR (สัดส่วนภาระหนี้ต่อรายได้) คือ เงินที่ต้องผ่อนหนี้ทุกเดือน หารด้วยรายรับทั้งหมด ธนาคารทั่วไปแนะนำว่าไม่ควรเกิน 40% ของรายรับ",
      ),
    ).toBeInTheDocument();
  });

  it("shows the exact emergencyFund explanation text after expanding", async () => {
    render(<RatioCard result={emergencyDangerResult} />);

    await userEvent.click(screen.getByRole("button", { name: "ดูวิธีคิด" }));

    expect(
      screen.getByText(
        "เงินสำรองฉุกเฉิน คือ เงินออมที่มีอยู่ หารด้วยค่าใช้จ่ายและหนี้ต่อเดือน บอกว่าถ้าไม่มีรายได้เข้ามาเลย เงินสำรองจะพอใช้ได้กี่เดือน ควรมีอย่างน้อย 3-6 เดือน",
      ),
    ).toBeInTheDocument();
  });
});
