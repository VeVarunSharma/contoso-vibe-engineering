import { render } from "@testing-library/react";

import { Separator } from "../separator";

describe("<Separator />", () => {
  it("renders a horizontal separator by default", () => {
    const { container } = render(<Separator />);
    const sep = container.querySelector('[data-slot="separator"]');
    expect(sep).toBeInTheDocument();
    expect(sep).toHaveAttribute("data-orientation", "horizontal");
  });

  it("supports vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("is decorative by default and omitted from the a11y tree", () => {
    const { container } = render(<Separator />);
    const sep = container.querySelector('[data-slot="separator"]');
    expect(sep).toHaveAttribute("role", "none");
  });

  it("supports a non-decorative semantic separator", () => {
    const { container } = render(<Separator decorative={false} />);
    const sep = container.querySelector('[data-slot="separator"]');
    expect(sep).toHaveAttribute("role", "separator");
  });

  it("forwards className", () => {
    const { container } = render(<Separator className="my-2" />);
    expect(container.querySelector('[data-slot="separator"]')).toHaveClass(
      "my-2",
    );
  });
});
