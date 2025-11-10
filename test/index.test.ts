import { describe, it, expect } from "vitest";

// Basic smoke tests to make sure public exports remain stable.
describe("public API", () => {
  it("should import library entrypoint without throwing", async () => {
    const mod = await import("../src/index");
    expect(typeof mod).toBe("object");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });

  it("should expose key classes from the entrypoint", async () => {
    const mod = await import("../src/index");
    expect(typeof mod.Client).toBe("function");
    expect(typeof mod.Page).toBe("function");
  });
});
