import "@testing-library/jest-dom";
import fetch from "cross-fetch";

// Ensure a global fetch is available for tests
if (typeof globalThis.fetch === "undefined") {
  // @ts-ignore
  globalThis.fetch = fetch;
}
