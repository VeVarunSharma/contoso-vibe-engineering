import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Textarea } from "../textarea";

describe("<Textarea />", () => {
  it("renders a textarea", () => {
    render(<Textarea placeholder="Comment" />);
    expect(screen.getByPlaceholderText("Comment")).toBeInTheDocument();
  });

  it("calls onChange when typed", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} placeholder="Comment" />);
    await user.type(screen.getByPlaceholderText("Comment"), "hello");
    expect(handleChange).toHaveBeenCalled();
  });

  it("respects the disabled attribute", () => {
    render(<Textarea disabled placeholder="Off" />);
    expect(screen.getByPlaceholderText("Off")).toBeDisabled();
  });

  it("propagates aria-invalid for error state", () => {
    render(<Textarea aria-invalid placeholder="Err" />);
    expect(screen.getByPlaceholderText("Err")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
