/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { jest, describe, it, expect } from "@jest/globals";

jest.unstable_mockModule("../src/main", () => ({
  analyzeCode: jest.fn(),
  setup: jest.fn()
}));

const main = await import("../src/main");
const mockedMain = jest.mocked(main);

describe("index", () => {
  it("calls run when imported", async () => {
    await import("../src/index");

    expect(mockedMain.analyzeCode).toHaveBeenCalled();
  });
});
