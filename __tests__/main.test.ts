/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from "@actions/core";
import * as main from "../src/main";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as io from "@actions/io";

// Mock the action's main function
const runMock = jest.spyOn(main, "analyzeCode");
const setupMock = jest.spyOn(main, "setup");

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>;
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;

let downloadToolMock: jest.SpiedFunction<typeof tc.downloadTool>;
let extractTarMock: jest.SpiedFunction<typeof tc.extractTar>;
let fetchMock: jest.SpiedFunction<typeof fetch>;
let mvMock: jest.SpiedFunction<typeof io.mv>;

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

    debugMock = jest.spyOn(core, "debug").mockImplementation();
    errorMock = jest.spyOn(core, "error").mockImplementation();
    getInputMock = jest.spyOn(core, "getInput").mockImplementation();
    downloadToolMock = jest
      .spyOn(tc, "downloadTool")
      .mockImplementation(async () => Promise.resolve("tidal-tools.tar.gz"));
    extractTarMock = jest
      .spyOn(tc, "extractTar")
      .mockImplementation(async () => Promise.resolve("./tidal-tools"));
    mvMock = jest
      .spyOn(io, "mv")
      .mockImplementation(async () => Promise.resolve());

    fetchMock = jest.spyOn(global, "fetch").mockImplementation(async () => {
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
    const addToPathMock = jest.spyOn(core, "addPath");

    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name) => testInputs[name] || "");

    await main.setup();
    expect(setupMock).toHaveReturned();

    // Verify that all of the core library functions were called correctly
    expect(debugMock).toHaveBeenNthCalledWith(
      1,
      "Finding latest release for Tidal Tools"
    );

    expect(debugMock).toHaveBeenNthCalledWith(
      2,
      "Downloading Tidal Tools CLI from https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(debugMock).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching("Extracting Tidal Tools CLI tar file")
    );

    expect(debugMock).toHaveBeenNthCalledWith(
      4,
      expect.stringMatching(
        "Moving ./tidal-tools/tidal-v3.7.11/tidal to ./tidal-tools"
      )
    );
    expect(debugMock).toHaveBeenNthCalledWith(
      5,
      expect.stringMatching("Tidal Tools CLI path is ./tidal-tools")
    );

    expect(addToPathMock).toHaveBeenCalledWith("./tidal-tools");

    expect(errorMock).not.toHaveBeenCalled();
  });

  it("tries to download tidal tools using the redirect url", async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name) => testInputs[name] || "");
    await main.setup();

    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://get.tidal.sh/tidal-linux-64-latest",
      { redirect: "manual" }
    );

    expect(downloadToolMock).toHaveBeenCalledWith(
      "https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz"
    );

    expect(extractTarMock).toHaveBeenCalledWith("tidal-tools.tar.gz");

    expect(mvMock).toHaveBeenCalledWith(
      "./tidal-tools/tidal-v3.7.11/tidal",
      "./tidal-tools"
    );
  });

  it("attempts to run tidal", async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name) => testInputs[name] || "");
    const execMock = jest
      .spyOn(exec, "exec")
      .mockImplementation(async () => Promise.resolve(0));
    await main.analyzeCode();
    expect(runMock).toHaveReturned();
    expect(execMock).toHaveBeenCalled();
    expect(execMock).toHaveBeenNthCalledWith(1, "./tidal-tools/tidal", [
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
