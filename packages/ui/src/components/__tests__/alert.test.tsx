import { render, screen } from "@testing-library/react";

import { Alert, AlertDescription, AlertTitle } from "../alert";

describe("<Alert />", () => {
  it("renders content with the alert role", () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Watch out!</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Heads up");
    expect(alert).toHaveTextContent("Watch out!");
  });

  it("applies the destructive variant class", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Bad</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
  });

  it("forwards arbitrary className to the root", () => {
    render(<Alert className="custom-cls">x</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("custom-cls");
  });

  it("renders title and description with their data-slot attributes", () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    );
    expect(
      container.querySelector('[data-slot="alert-title"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="alert-description"]'),
    ).toBeInTheDocument();
  });
});
