/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { vi, describe, it, expect, beforeEach } from "vitest";
import * as main from "../src/main.js";

vi.mock("../src/main", () => ({
  analyzeCode: vi.fn(),
  setup: vi.fn()
}));

describe("index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls run when imported", async () => {
    await import("../src/index");
    expect(main.analyzeCode).toHaveBeenCalled();
  });
});
