import { app, safeStorage } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import type { InternalAuthSession } from "../../shared/auth/auth-contract";

const AUTH_DIR = join(app.getPath("userData"), "auth");
const SESSION_FILE = join(AUTH_DIR, "session.enc");
const SESSION_PLAIN_FILE = join(AUTH_DIR, "session.json");

function usePlaintextFallback(): boolean {
  return !app.isPackaged && !safeStorage.isEncryptionAvailable();
}

export function saveEncryptedSession(session: InternalAuthSession): void {
  mkdirSync(AUTH_DIR, { recursive: true });
  const payload = JSON.stringify(session);

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(payload);
    writeFileSync(SESSION_FILE, encrypted);
    if (existsSync(SESSION_PLAIN_FILE)) {
      rmSync(SESSION_PLAIN_FILE, { force: true });
    }
    return;
  }

  if (usePlaintextFallback()) {
    console.warn(
      "[auth] safeStorage unavailable in dev — storing session in plaintext session.json",
    );
    writeFileSync(SESSION_PLAIN_FILE, payload, "utf-8");
    return;
  }

  throw new Error(
    "safeStorage encryption is not available. Cannot persist auth session in production.",
  );
}

export function readEncryptedSession(): InternalAuthSession | null {
  if (safeStorage.isEncryptionAvailable() && existsSync(SESSION_FILE)) {
    const encrypted = readFileSync(SESSION_FILE);
    const plain = safeStorage.decryptString(encrypted);
    return JSON.parse(plain) as InternalAuthSession;
  }

  if (usePlaintextFallback() && existsSync(SESSION_PLAIN_FILE)) {
    return JSON.parse(readFileSync(SESSION_PLAIN_FILE, "utf-8")) as InternalAuthSession;
  }

  return null;
}

export function clearEncryptedSession(): void {
  if (existsSync(SESSION_FILE)) {
    rmSync(SESSION_FILE, { force: true });
  }
  if (existsSync(SESSION_PLAIN_FILE)) {
    rmSync(SESSION_PLAIN_FILE, { force: true });
  }
}
