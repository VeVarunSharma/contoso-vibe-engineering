describe("Dummy Tests", () => {
  it("should pass a basic truthy test", () => {
    expect(true).toBe(true);
  });

  it("should perform basic arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string concatenation", () => {
    const hello = "Hello";
    const world = "World";
    expect(`${hello} ${world}`).toBe("Hello World");
  });
});
