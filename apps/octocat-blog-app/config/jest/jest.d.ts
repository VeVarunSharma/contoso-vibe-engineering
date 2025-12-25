import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(style: Record<string, unknown>): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveTextContent(text: string | RegExp): R;
      toContainElement(element: HTMLElement | null): R;
      toHaveValue(value: string | string[] | number): R;
      toBeChecked(): R;
      toBeEmpty(): R;
      toHaveFocus(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveDescription(text: string | RegExp): R;
      toHaveAccessibleName(name: string | RegExp): R;
      toHaveAccessibleDescription(description: string | RegExp): R;
    }
  }
}

export {};
