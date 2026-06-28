import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NumericField } from "../NumericField";

describe("NumericField", () => {
  it("displays the plain number with no formatting by default", () => {
    render(<NumericField id="plain" value={3000000} onChange={vi.fn()} className="" />);
    expect(document.getElementById("plain")).toHaveValue("3000000");
  });

  it("groups the initial value with thousands separators when thousandsSeparator is set", () => {
    render(
      <NumericField id="money" value={3000000} onChange={vi.fn()} thousandsSeparator className="" />,
    );
    expect(document.getElementById("money")).toHaveValue("3,000,000");
  });

  it("reports the plain numeric value via onChange while displaying the grouped text", () => {
    const onChange = vi.fn();
    render(<NumericField id="money" value={0} onChange={onChange} thousandsSeparator className="" />);

    const input = document.getElementById("money") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1234567" } });

    expect(onChange).toHaveBeenLastCalledWith(1234567);
    expect(input).toHaveValue("1,234,567");
  });

  it("strips embedded commas (e.g. from a paste) before validating and parsing", () => {
    const onChange = vi.fn();
    render(<NumericField id="money" value={0} onChange={onChange} thousandsSeparator className="" />);

    const input = document.getElementById("money") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12,345" } });

    expect(onChange).toHaveBeenLastCalledWith(12345);
    expect(input).toHaveValue("12,345");
  });

  it("groups correctly as the user types digit by digit", async () => {
    function Controlled() {
      const [value, setValue] = useState(0);
      return <NumericField id="money" value={value} onChange={setValue} thousandsSeparator className="" />;
    }
    render(<Controlled />);

    const input = document.getElementById("money") as HTMLInputElement;
    await userEvent.type(input, "1234567");

    expect(input).toHaveValue("1,234,567");
  });

  it("ignores a non-digit keystroke and leaves the grouped display unchanged", () => {
    const onChange = vi.fn();
    render(<NumericField id="money" value={1000} onChange={onChange} thousandsSeparator className="" />);

    const input = document.getElementById("money") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1,000a" } });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("1,000");
  });

  it("clears to 0 by default, and to undefined when optional", () => {
    const onChange = vi.fn();
    render(
      <NumericField id="money" value={1000} onChange={onChange} optional thousandsSeparator className="" />,
    );

    const input = document.getElementById("money") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(input).toHaveValue("");
  });

  it("groups only the integer part when allowDecimal is combined with thousandsSeparator", () => {
    const onChange = vi.fn();
    render(
      <NumericField id="money" value={0} onChange={onChange} allowDecimal thousandsSeparator className="" />,
    );

    const input = document.getElementById("money") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1234567.89" } });

    expect(onChange).toHaveBeenLastCalledWith(1234567.89);
    expect(input).toHaveValue("1,234,567.89");
  });
});
