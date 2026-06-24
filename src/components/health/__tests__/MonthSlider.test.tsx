import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MonthSlider } from "../MonthSlider";

const MONTHS = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

describe("MonthSlider", () => {
  it("renders a range input with min 0 and max months.length - 1", () => {
    render(<MonthSlider months={MONTHS} selectedIndex={0} onChange={vi.fn()} />);

    const slider = screen.getByLabelText("เลือกเดือนที่ต้องการดู") as HTMLInputElement;
    expect(slider.min).toBe("0");
    expect(slider.max).toBe(String(MONTHS.length - 1));
    expect(slider.value).toBe("0");
  });

  it("fires onChange with the numeric index when the range input changes", async () => {
    const onChange = vi.fn();
    render(<MonthSlider months={MONTHS} selectedIndex={0} onChange={onChange} />);

    const slider = screen.getByLabelText("เลือกเดือนที่ต้องการดู");
    fireRangeChange(slider, 3);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("the next button steps by 1 and is disabled at the upper boundary", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <MonthSlider months={MONTHS} selectedIndex={MONTHS.length - 1} onChange={onChange} />,
    );

    const nextButton = screen.getByRole("button", { name: "เดือนถัดไป" });
    expect(nextButton).toBeDisabled();

    rerender(<MonthSlider months={MONTHS} selectedIndex={1} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "เดือนถัดไป" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("the previous button steps by -1 and is disabled at the lower boundary (index 0)", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<MonthSlider months={MONTHS} selectedIndex={0} onChange={onChange} />);

    const prevButton = screen.getByRole("button", { name: "เดือนก่อนหน้า" });
    expect(prevButton).toBeDisabled();

    rerender(<MonthSlider months={MONTHS} selectedIndex={2} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "เดือนก่อนหน้า" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('shows the "เดือนปัจจุบัน" badge only at index 0', () => {
    const { rerender } = render(<MonthSlider months={MONTHS} selectedIndex={0} onChange={vi.fn()} />);
    expect(screen.getByText("เดือนปัจจุบัน")).toBeInTheDocument();

    rerender(<MonthSlider months={MONTHS} selectedIndex={1} onChange={vi.fn()} />);
    expect(screen.queryByText("เดือนปัจจุบัน")).not.toBeInTheDocument();
  });

  it('shows the "กลับไปเดือนปัจจุบัน" reset link only when not at index 0, and it calls onChange(0)', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<MonthSlider months={MONTHS} selectedIndex={0} onChange={onChange} />);
    expect(screen.queryByText("กลับไปเดือนปัจจุบัน")).not.toBeInTheDocument();

    rerender(<MonthSlider months={MONTHS} selectedIndex={3} onChange={onChange} />);
    const resetButton = screen.getByText("กลับไปเดือนปัจจุบัน");
    expect(resetButton).toBeInTheDocument();

    await userEvent.click(resetButton);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("displays the formatted month label for the selected index", () => {
    render(<MonthSlider months={MONTHS} selectedIndex={2} onChange={vi.fn()} />);
    // MONTHS[2] = '2026-08' -> 'ส.ค. 2026'
    expect(screen.getByText("ส.ค. 2026")).toBeInTheDocument();
  });

  it("does not block native arrow-key stepping on the range input", async () => {
    // jsdom has no real layout/widget engine, so it never natively steps a
    // <input type="range">'s value on ArrowRight/ArrowLeft — even a bare
    // <input type="range" /> with zero handlers stays put under
    // userEvent.keyboard in jsdom (verified directly against a control
    // input outside this component). So this test cannot prove "arrow keys
    // step the value" end-to-end; that behavior is the browser's native
    // contract for <input type="range">, exercised in real browsers/e2e,
    // not jsdom. What CAN be verified here, and is the actual regression
    // risk for this component, is that MonthSlider doesn't add anything
    // that would block the native behavior: no onKeyDown handler, no
    // tabIndex={-1}, not disabled, and the element really is a native
    // range input (not a styled div/custom widget intercepting keys).
    const onChange = vi.fn();
    render(<MonthSlider months={MONTHS} selectedIndex={2} onChange={onChange} />);

    const slider = screen.getByLabelText("เลือกเดือนที่ต้องการดู") as HTMLInputElement;
    expect(slider.tagName).toBe("INPUT");
    expect(slider.type).toBe("range");
    expect(slider).not.toHaveAttribute("onkeydown");
    expect(slider).not.toHaveAttribute("readonly");
    expect(slider.disabled).toBe(false);
    expect(slider.tabIndex).not.toBe(-1);

    slider.focus();
    expect(slider).toHaveFocus();

    // Keyboard events dispatch without throwing and without the input
    // losing focus/being removed — i.e. no handler is swallowing/redirecting
    // the interaction (focus loss would be the typical symptom of a buggy
    // keydown handler stealing the event).
    await userEvent.keyboard("{ArrowRight}");
    expect(slider).toHaveFocus();
  });

  it("gives the step buttons and reset link real accessible names, not just visual symbols", () => {
    const { rerender } = render(<MonthSlider months={MONTHS} selectedIndex={2} onChange={vi.fn()} />);

    // The ◀/▶ glyphs are not themselves accessible names — both buttons
    // must expose a real Thai aria-label so screen-reader users get the
    // same meaning sighted users get from the visible arrow symbols.
    const prevButton = screen.getByRole("button", { name: "เดือนก่อนหน้า" });
    const nextButton = screen.getByRole("button", { name: "เดือนถัดไป" });
    expect(prevButton).toHaveAccessibleName("เดือนก่อนหน้า");
    expect(nextButton).toHaveAccessibleName("เดือนถัดไป");

    // The reset link's accessible name comes from its own visible text
    // content (not an icon/badge), which already satisfies the same bar.
    rerender(<MonthSlider months={MONTHS} selectedIndex={3} onChange={vi.fn()} />);
    const resetButton = screen.getByRole("button", { name: "กลับไปเดือนปัจจุบัน" });
    expect(resetButton).toHaveAccessibleName("กลับไปเดือนปัจจุบัน");

    // The range input itself also needs a real label, distinct from the
    // visually-adjacent badge/buttons.
    expect(screen.getByRole("slider", { name: "เลือกเดือนที่ต้องการดู" })).toBeInTheDocument();
  });
});

/** Fires a native 'change' event on a range input with the given numeric value. */
function fireRangeChange(input: HTMLElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, String(value));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
