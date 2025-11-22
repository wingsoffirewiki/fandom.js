import { describe, it, expect } from "vitest";
import { APIError } from "../src/errors/api-error";

describe("APIError", () => {
  it("constructs correctly", () => {
    const error = new APIError("code", "info");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("APIError");
    expect(error.code).toBe("code");
    expect(error.info).toBe("info");
    expect(error.message).toBe("code: info");
  });
});
