require("@testing-library/jest-dom");

// Polyfill PointerEvent APIs that jsdom lacks but Radix UI requires.
// Without these, tests that open a Radix Select / Dialog / Dropdown throw
// `TypeError: target.hasPointerCapture is not a function`. See issue #294.
if (typeof window !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

