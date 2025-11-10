import { describe, it, expect } from "vitest";

describe("environment sanity", () => {
  it("basic math works", () => {
    expect(1 + 1).toBe(2);
  });

  it("string contains substring", () => {
    expect("fandom.js").toContain("fandom");
  });
});
