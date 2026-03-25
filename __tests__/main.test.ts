/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import { vi, describe, it, expect, beforeEach } from "vitest";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as main from "../src/main.js";

vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  error: vi.fn(),
  getInput: vi.fn(),
  addPath: vi.fn(),
  toPlatformPath: (p: string) => p
}));

vi.mock("@actions/tool-cache", () => ({
  downloadTool: vi.fn(),
  extractTar: vi.fn()
}));

vi.mock("@actions/exec", () => ({
  exec: vi.fn()
}));

vi.mock("@actions/io", () => ({
  mv: vi.fn()
}));

const mockedCore = vi.mocked(core);
const mockedTc = vi.mocked(tc);
const mockedExec = vi.mocked(exec);
const mockedIo = vi.mocked(io);

const testInputs: Record<string, string> = {
  "tidal-email": "test@tidalmigrations.com",
  "tidal-password": "password",
  "tidal-url": "https://dev.tidal.cloud",
  "app-id": "1",
  directory: "."
};

describe("action", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedCore.getInput.mockImplementation(
      (name: string) => testInputs[name] || ""
    );
    mockedTc.downloadTool.mockImplementation(async () =>
      Promise.resolve("tidal-tools.tar.gz")
    );
    mockedTc.extractTar.mockImplementation(async () =>
      Promise.resolve("./tidal-tools")
    );
    mockedIo.mv.mockImplementation(async () => Promise.resolve());

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
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
      })
    );
  });

  it("adds tidal tools to the path", async () => {
    await main.setup();

    // Verify that all of the core library functions were called correctly
    expect(mockedCore.debug).toHaveBeenNthCalledWith(
      1,
      "Finding latest release for Tidal Tools"
    );

    expect(mockedCore.debug).toHaveBeenNthCalledWith(
      2,
      "Downloading Tidal Tools CLI from https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(mockedCore.debug).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching("Extracting Tidal Tools CLI tar file")
    );

    expect(mockedCore.debug).toHaveBeenNthCalledWith(
      4,
      expect.stringMatching(
        "Moving ./tidal-tools/tidal-v3.7.11/tidal to ./tidal-tools"
      )
    );
    expect(mockedCore.debug).toHaveBeenNthCalledWith(
      5,
      expect.stringMatching("Tidal Tools CLI path is ./tidal-tools")
    );

    expect(mockedCore.addPath).toHaveBeenCalledWith("./tidal-tools");

    expect(mockedCore.error).not.toHaveBeenCalled();
  });

  it("tries to download tidal tools using the redirect url", async () => {
    await main.setup();

    expect(global.fetch).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://get.tidal.sh/tidal-linux-64-latest",
      { redirect: "manual" }
    );

    expect(mockedTc.downloadTool).toHaveBeenCalledWith(
      "https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(mockedTc.extractTar).toHaveBeenCalledWith("tidal-tools.tar.gz");

    expect(mockedIo.mv).toHaveBeenCalledWith(
      "./tidal-tools/tidal-v3.7.11/tidal",
      "./tidal-tools"
    );
  });

  it("attempts to run tidal", async () => {
    mockedExec.exec.mockImplementation(async () => Promise.resolve(0));
    await main.analyzeCode();
    expect(mockedExec.exec).toHaveBeenCalled();
    expect(mockedExec.exec).toHaveBeenNthCalledWith(1, "./tidal-tools/tidal", [
      "--version"
    ]);
    expect(mockedExec.exec).toHaveBeenNthCalledWith(2, "./tidal-tools/tidal", [
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
