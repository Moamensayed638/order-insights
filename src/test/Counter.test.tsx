import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter } from "@/components/products/Counter";

function renderCounter(value: string, props: Partial<{ min: number; max: number }> = {}) {
  const onChange = vi.fn();
  render(<Counter value={value} onChange={onChange} label="max selections" {...props} />);
  return {
    onChange,
    minus: screen.getByRole("button", { name: "Decrease max selections" }),
    plus: screen.getByRole("button", { name: "Increase max selections" }),
    input: screen.getByRole("spinbutton", { name: "max selections" }),
  };
}

describe("Counter", () => {
  it("steps up and down by one", () => {
    const up = renderCounter("2");
    fireEvent.click(up.plus);
    expect(up.onChange).toHaveBeenCalledWith("3");

    fireEvent.click(up.minus);
    expect(up.onChange).toHaveBeenCalledWith("1");
  });

  it("passes typed input straight through", () => {
    const { onChange, input } = renderCounter("1");
    fireEvent.change(input, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("12");
  });

  it("disables the minus button at the floor", () => {
    const { minus, plus } = renderCounter("1");
    expect(minus).toBeDisabled();
    expect(plus).not.toBeDisabled();
  });

  it("disables the plus button at the ceiling", () => {
    const { minus, plus } = renderCounter("5", { max: 5 });
    expect(plus).toBeDisabled();
    expect(minus).not.toBeDisabled();
  });

  it("clamps a value already past the ceiling back into range", () => {
    const { onChange, minus } = renderCounter("9", { max: 5 });
    fireEvent.click(minus);
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("snaps a blank field up to the floor", () => {
    const { onChange, plus } = renderCounter("");
    fireEvent.click(plus);
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("snaps a blank field down to the floor", () => {
    const { onChange, minus } = renderCounter("", { min: 2 });
    fireEvent.click(minus);
    expect(onChange).toHaveBeenCalledWith("2");
  });

  it("truncates a fractional value when stepping", () => {
    const { onChange, plus } = renderCounter("2.7");
    fireEvent.click(plus);
    expect(onChange).toHaveBeenCalledWith("3");
  });

  it("disables every control when disabled", () => {
    const onChange = vi.fn();
    render(<Counter value="3" onChange={onChange} label="max selections" disabled />);
    expect(screen.getByRole("button", { name: "Decrease max selections" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase max selections" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "max selections" })).toBeDisabled();
  });
});
