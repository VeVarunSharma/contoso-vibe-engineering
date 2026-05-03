import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Input } from "../input";

describe("<Input />", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Type" />);
    expect(screen.getByPlaceholderText("Type")).toBeInTheDocument();
  });

  it("calls onChange with typed value", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Type" />);
    await user.type(screen.getByPlaceholderText("Type"), "hi");
    expect(handleChange).toHaveBeenCalled();
  });

  it("respects the disabled attribute", () => {
    render(<Input disabled placeholder="Off" />);
    expect(screen.getByPlaceholderText("Off")).toBeDisabled();
  });

  it("propagates aria-invalid for error state", () => {
    render(<Input aria-invalid placeholder="Err" />);
    expect(screen.getByPlaceholderText("Err")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("uses the supplied type attribute", () => {
    render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "type",
      "email",
    );
  });
});
