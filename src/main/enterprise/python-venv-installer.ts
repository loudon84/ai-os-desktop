import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { homedir } from "node:os";

import type {
  DeploymentConfig,
} from "../../shared/enterprise/enterprise-schema";

import { getDesktopAgentDir } from "./windows/path-resolver";
import { resolveInstallLocation } from "./windows/install-location-resolver";

export interface VenvResult {
  ok: boolean;
  venvPath?: string;
  pythonPath?: string;
  pipPath?: string;
  isNewVenv?: boolean;
  errorCode?: string;
  message?: string;
}

export function createOrReuseSharedVenv(
  config: DeploymentConfig,
): VenvResult {
  const agentDir = getDesktopAgentDir();
  const venvPath = join(agentDir, "venv");
  const runtimeRoot = resolveInstallLocation().runtimeRoot;

  const isWindows = process.platform === "win32";
  const pythonExe = isWindows ? join(venvPath, "Scripts", "python.exe") : join(venvPath, "bin", "python");
  const pipExe = isWindows ? join(venvPath, "Scripts", "pip.exe") : join(venvPath, "bin", "pip");

  if (existsSync(pythonExe) && existsSync(pipExe)) {
    try {
      execSync(`"${pythonExe}" -c "import sys; print(sys.version)"`, { encoding: "utf-8", timeout: 5000 });
      return { ok: true, venvPath, pythonPath: pythonExe, pipPath: pipExe, isNewVenv: false };
    } catch {
    }
  }

  let pythonCmd = "python";
  if (config.runtime.useBundledPython) {
    const bundledPython = join(runtimeRoot, "python", isWindows ? "python.exe" : "bin/python3");
    if (existsSync(bundledPython)) {
      pythonCmd = bundledPython;
    }
  }

  mkdirSync(venvPath, { recursive: true });

  try {
    execSync(`"${pythonCmd}" -m venv "${venvPath}"`, { encoding: "utf-8", timeout: 30000 });
  } catch (err) {
    return {
      ok: false,
      errorCode: "E_VENV_CREATE_FAILED",
      message: `venv 创建失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!existsSync(pythonExe)) {
    return { ok: false, errorCode: "E_VENV_CREATE_FAILED", message: "venv 创建后 python 可执行文件不存在" };
  }

  return { ok: true, venvPath, pythonPath: pythonExe, pipPath: pipExe, isNewVenv: true };
}

export interface PipInstallProgress {
  message: string;
}

export type PipProgressCallback = (progress: PipInstallProgress) => void;

export function installPythonDependencies(
  config: DeploymentConfig,
  venvPath: string,
  agentPath: string,
  onProgress?: PipProgressCallback,
): { ok: boolean; errorCode?: string; message?: string } {
  const isWindows = process.platform === "win32";
  const pipExe = isWindows ? join(venvPath, "Scripts", "pip.exe") : join(venvPath, "bin", "pip");
  const uvExe = isWindows ? join(venvPath, "Scripts", "uv.exe") : join(venvPath, "bin", "uv");

  const useUv = config.runtime.useBundledUv && existsSync(uvExe);

  const requirementsFile = join(agentPath, "requirements.txt");
  const setupPy = join(agentPath, "setup.py");
  const pyprojectToml = join(agentPath, "pyproject.toml");

  let cmd = "";

  if (useUv) {
    onProgress?.({ message: "使用 uv 安装依赖..." });
    const indexArgs = config.runtime.pipIndexUrl ? `--index-url ${config.runtime.pipIndexUrl}` : "";
    const findLinksArgs = config.runtime.preferWheelhouse && config.runtime.wheelhousePath
      ? `--find-links ${config.runtime.wheelhousePath}`
      : "";

    if (existsSync(requirementsFile)) {
      cmd = `"${uvExe}" pip install ${indexArgs} ${findLinksArgs} -r "${requirementsFile}"`.trim();
    } else if (existsSync(pyprojectToml) || existsSync(setupPy)) {
      cmd = `"${uvExe}" pip install ${indexArgs} ${findLinksArgs} -e "${agentPath}"`.trim();
    }
  } else {
    onProgress?.({ message: "使用 pip 安装依赖..." });
    const indexArgs = config.runtime.pipIndexUrl ? `-i ${config.runtime.pipIndexUrl}` : "";
    const trustedHostArgs = config.runtime.trustedHost ? `--trusted-host ${config.runtime.trustedHost}` : "";
    const findLinksArgs = config.runtime.preferWheelhouse && config.runtime.wheelhousePath
      ? `--find-links ${config.runtime.wheelhousePath}`
      : "";

    if (existsSync(requirementsFile)) {
      cmd = `"${pipExe}" install ${indexArgs} ${trustedHostArgs} ${findLinksArgs} -r "${requirementsFile}"`.trim();
    } else if (existsSync(pyprojectToml) || existsSync(setupPy)) {
      cmd = `"${pipExe}" install ${indexArgs} ${trustedHostArgs} ${findLinksArgs} -e "${agentPath}"`.trim();
    }
  }

  if (!cmd) {
    return { ok: true, message: "无可安装的依赖文件" };
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      onProgress?.({ message: `安装依赖 (尝试 ${attempt}/2)...` });
      execSync(cmd, { encoding: "utf-8", timeout: 300000, env: { ...process.env as Record<string, string> } });
      return { ok: true };
    } catch (err) {
      if (attempt === 2) {
        return {
          ok: false,
          errorCode: "E_PIP_INSTALL_FAILED",
          message: `pip 依赖安装失败: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }
  }

  return { ok: true };
}
