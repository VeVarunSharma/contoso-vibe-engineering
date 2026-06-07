import { render, screen } from "@testing-library/react";

import { Badge } from "../badge";

describe("<Badge />", () => {
  it("renders with its children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("defaults to the default variant data attribute", () => {
    render(<Badge>x</Badge>);
    expect(screen.getByText("x")).toHaveAttribute("data-variant", "default");
  });

  it("applies the secondary variant", () => {
    render(<Badge variant="secondary">y</Badge>);
    expect(screen.getByText("y")).toHaveAttribute("data-variant", "secondary");
  });

  it("renders as the underlying child element when asChild", () => {
    render(
      <Badge asChild>
        <a href="/tag">Tag</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: /tag/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/tag");
  });

  it("forwards arbitrary className", () => {
    render(<Badge className="x-cls">z</Badge>);
    expect(screen.getByText("z")).toHaveClass("x-cls");
  });
});
