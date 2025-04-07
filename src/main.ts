// Node.js core
import { URL } from "url";

// External
import { error, addPath, debug, toPlatformPath, getInput } from "@actions/core";
import { downloadTool, extractTar } from "@actions/tool-cache";
import { mv } from "@actions/io";

import { exec } from "@actions/exec";

const getRedirectURL = async (url: string): Promise<string> => {
  const host = new URL(url).host;
  const response = await fetch(url, { redirect: "manual" });
  if (response.status === 301) {
    const location = response.headers.get("location");
    if (location) {
      return `https://${host}${location}`;
    }
  }
  return url;
};

type Architecture = "32" | "64" | "arm64";

const mapArch = (arch: NodeJS.Architecture): Architecture | undefined => {
  const mappings: Record<
    Partial<NodeJS.Architecture | "x86" | string>,
    Architecture
  > = {
    x86: "32",
    x64: "64",
    arm: "arm64"
  };
  return mappings[arch];
};

type Platform = "windows" | "macos" | "linux";

const mapOS = (platform: NodeJS.Platform): Platform | undefined => {
  const mappings: Record<Partial<NodeJS.Platform> | string, Platform> = {
    win32: "windows",
    darwin: "macos",
    linux: "linux"
  };
  return mappings[platform];
};

const downloadCLI = async (arch: Architecture, platform: Platform) => {
  const url = await getRedirectURL(
    `https://get.tidal.sh/tidal-${platform}-${arch}-latest`
  );
  debug(`Downloading Tidal Tools CLI from ${url}`);

  const pathToCLITar = await downloadTool(url);

  // Extract the version from the URL
  // Example URL: https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz
  // https://get.tidal.sh/packages/v3.7.11/tidal-linux-amd64-v3.7.11.tar.gz
  const version = /https:\/\/.*(v[0-9]+\.[0-9]+\.[0-9]+)\.tar\.gz/.exec(
    url
  )?.[1];

  const folderName = `tidal-${version}`;
  debug("Extracting Tidal Tools CLI tar file");
  const pathToCLI = await extractTar(pathToCLITar);
  const fileName = `${pathToCLI}/${folderName}/tidal`;
  debug(`Moving ${fileName} to ${pathToCLI}`);
  await mv(fileName, pathToCLI);
  debug(`Tidal Tools CLI path is ${pathToCLI}.`);

  if (!pathToCLITar || !pathToCLI) {
    throw new Error(`Unable to download Tidal Tools from ${url}`);
  }

  return pathToCLI;
};

export const setup = async () => {
  try {
    const osPlatform = process.platform;
    const osArch = process.arch;

    debug("Finding latest release for Tidal Tools");

    const platform = mapOS(osPlatform);
    const arch = mapArch(osArch);

    if (arch === undefined || platform === undefined) {
      throw new Error(
        `Unsupported platform or architecture: ${osPlatform} ${osArch}`
      );
    }
    // Download requested version
    const pathToCLI = await downloadCLI(arch, platform);

    // Add to path
    addPath(pathToCLI);

    return pathToCLI;
  } catch (err) {
    error(err as Error);
    throw err;
  }
};

// May throw an error if the CLI fails to download or run
export const analyzeCode = async () => {
  const tidalEmail = getInput("tidal-email");
  const tidalPassword = getInput("tidal-password");
  const tidalUrl = getInput("tidal-url");
  const directory = toPlatformPath(getInput("directory"));
  const appId = getInput("app-id");
  const pathToCli = await setup();

  await exec(`${pathToCli}/tidal`, ["--version"]);
  debug("Running `tidal analyze code` command.`");

  await exec(`${pathToCli}/tidal`, [
    "--tidal-email",
    tidalEmail,
    "--tidal-password",
    tidalPassword,
    "--tidal-url",
    tidalUrl,
    "analyze",
    "code",
    "--app-id",
    appId,
    directory
  ]);
};
