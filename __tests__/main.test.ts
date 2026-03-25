/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("@actions/core", () => ({
  debug: jest.fn(),
  error: jest.fn(),
  getInput: jest.fn(),
  addPath: jest.fn(),
  toPlatformPath: (p: string) => p
}));

jest.unstable_mockModule("@actions/tool-cache", () => ({
  downloadTool: jest.fn(),
  extractTar: jest.fn()
}));

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn()
}));

jest.unstable_mockModule("@actions/io", () => ({
  mv: jest.fn()
}));

const core = jest.mocked(await import("@actions/core"));
const tc = jest.mocked(await import("@actions/tool-cache"));
const exec = jest.mocked(await import("@actions/exec"));
const io = jest.mocked(await import("@actions/io"));
const main = await import("../src/main");

const testInputs: Record<string, string> = {
  "tidal-email": "test@tidalmigrations.com",
  "tidal-password": "password",
  "tidal-url": "https://dev.tidal.cloud",
  "app-id": "1",
  directory: "."
};

describe("action", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    tc.downloadTool.mockImplementation(async () =>
      Promise.resolve("tidal-tools.tar.gz")
    );
    tc.extractTar.mockImplementation(async () =>
      Promise.resolve("./tidal-tools")
    );
    io.mv.mockImplementation(async () => Promise.resolve());

    jest.spyOn(global, "fetch").mockImplementation(async () => {
      const response = new Response("", {
        status: 301,
        headers: {
          "content-length": "0",
          connection: "keep-alive",
          date: "Wed, 12 Jun 2024 19:26:00 GMT",
          location: "/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz",
          server: "AmazonS3",
          "x-cache": "Miss from cloudfront",
          via: "1.1 39688168a2a3353be1f3c9378d12d89e.cloudfront.net (CloudFront)",
          "x-amz-cf-pop": "SEA19-C2",
          "x-amz-cf-id":
            "gIxTYJX76rPX772Y0uHuOq6Aq8NwXlLKPoPt5KwUVLsdk56RPCPodA=="
        }
      });
      return Promise.resolve(response);
    });
  });

  it("adds tidal tools to the path", async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name: string) => testInputs[name] || "");

    await main.setup();

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(
      1,
      "Finding latest release for Tidal Tools"
    );

    expect(core.debug).toHaveBeenNthCalledWith(
      2,
      "Downloading Tidal Tools CLI from https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(core.debug).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching("Extracting Tidal Tools CLI tar file")
    );

    expect(core.debug).toHaveBeenNthCalledWith(
      4,
      expect.stringMatching(
        "Moving ./tidal-tools/tidal-v3.7.11/tidal to ./tidal-tools"
      )
    );
    expect(core.debug).toHaveBeenNthCalledWith(
      5,
      expect.stringMatching("Tidal Tools CLI path is ./tidal-tools")
    );

    expect(core.addPath).toHaveBeenCalledWith("./tidal-tools");

    expect(core.error).not.toHaveBeenCalled();
  });

  it("tries to download tidal tools using the redirect url", async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name: string) => testInputs[name] || "");
    await main.setup();

    expect(global.fetch).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://get.tidal.sh/tidal-linux-64-latest",
      { redirect: "manual" }
    );

    expect(tc.downloadTool).toHaveBeenCalledWith(
      "https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(tc.extractTar).toHaveBeenCalledWith("tidal-tools.tar.gz");

    expect(io.mv).toHaveBeenCalledWith(
      "./tidal-tools/tidal-v3.7.11/tidal",
      "./tidal-tools"
    );
  });

  it("attempts to run tidal", async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name: string) => testInputs[name] || "");
    exec.exec.mockImplementation(async () => Promise.resolve(0));
    await main.analyzeCode();
    expect(exec.exec).toHaveBeenCalled();
    expect(exec.exec).toHaveBeenNthCalledWith(1, "./tidal-tools/tidal", [
      "--version"
    ]);
    expect(exec.exec).toHaveBeenNthCalledWith(2, "./tidal-tools/tidal", [
      "--tidal-email",
      "test@tidalmigrations.com",
      "--tidal-password",
      "password",
      "--tidal-url",
      "https://dev.tidal.cloud",
      "analyze",
      "code",
      "--app-id",
      "1",
      "."
    ]);
  });
});
