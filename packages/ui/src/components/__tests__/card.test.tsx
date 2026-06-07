import { render, screen } from "@testing-library/react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

describe("<Card /> family", () => {
  it("renders a card with header, content and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Card</CardTitle>
          <CardDescription>Some description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("My Card")).toBeInTheDocument();
    expect(screen.getByText("Some description")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the data-slot attributes for each subcomponent", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>t</CardTitle>
          <CardDescription>d</CardDescription>
          <CardAction>a</CardAction>
        </CardHeader>
        <CardContent>c</CardContent>
        <CardFooter>f</CardFooter>
      </Card>,
    );

    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-header"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-title"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-description"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-action"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-content"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-footer"]'),
    ).toBeInTheDocument();
  });

  it("forwards className to the card root", () => {
    const { container } = render(<Card className="rounded-2xl">x</Card>);
    expect(container.querySelector('[data-slot="card"]')).toHaveClass(
      "rounded-2xl",
    );
  });
});
