import { render, screen } from "@testing-library/react";

import { Input } from "../input";
import { Label } from "../label";

describe("<Label />", () => {
  it("renders the label text", () => {
    render(<Label>My Label</Label>);
    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="x">First name</Label>
        <Input id="x" defaultValue="" />
      </>,
    );
    const input = screen.getByLabelText("First name");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "x");
  });

  it("forwards arbitrary className", () => {
    render(<Label className="text-xl">Z</Label>);
    expect(screen.getByText("Z")).toHaveClass("text-xl");
  });
});
