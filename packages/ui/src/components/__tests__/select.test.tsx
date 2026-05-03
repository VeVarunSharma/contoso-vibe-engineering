import { render, screen } from "@testing-library/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

describe("<Select />", () => {
  it("renders the trigger with placeholder text", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Pick one">
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
          <SelectItem value="b">B</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: /pick one/i })).toBeInTheDocument();
    expect(screen.getByText("Choose...")).toBeInTheDocument();
  });

  it("respects the disabled attribute on the trigger", () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="Disabled">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: /disabled/i })).toBeDisabled();
  });

  it("renders the trigger with a defaultValue label visible", () => {
    render(
      <Select defaultValue="b">
        <SelectTrigger aria-label="Default">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
          <SelectItem value="b">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });
});
