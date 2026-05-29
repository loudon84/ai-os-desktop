import Database from "better-sqlite3";
import { createHash } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { HERMES_HOME } from "./installer";
import type {
  WebOperatorTaskPageContext,
  WebOperatorTaskSessionLookupResult,
  WebOperatorTaskSessionRecord,
  WebOperatorTaskSessionUpsertInput,
} from "../shared/web-operator/web-operator-task-session-contract";

const DB_DIR = join(HERMES_HOME, "desktop");
const DB_PATH = join(DB_DIR, "web-operator-task-session.db");

let dbInstance: Database.Database | null = null;

function now(): string {
  return new Date().toISOString();
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_session (
      task_id TEXT PRIMARY KEY,
      page_url TEXT NOT NULL UNIQUE,
      session_id TEXT NOT NULL UNIQUE,
      page_context_json TEXT NOT NULL,
      skill TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_task_session_page_url
      ON task_session(page_url);

    CREATE INDEX IF NOT EXISTS idx_task_session_session_id
      ON task_session(session_id);
  `);
}

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
  dbInstance = new Database(DB_PATH);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("busy_timeout = 5000");
  dbInstance.pragma("foreign_keys = ON");
  migrate(dbInstance);
  return dbInstance;
}

export function buildTaskId(pageUrl: string): string {
  return `wot_${createHash("sha256").update(pageUrl.trim()).digest("hex").slice(0, 32)}`;
}

function parsePageContext(json: string): WebOperatorTaskPageContext {
  const parsed = JSON.parse(json) as WebOperatorTaskPageContext;
  if (parsed?.type !== "web-operator" || typeof parsed.scopeKey !== "string") {
    throw new Error("Invalid page_context_json in task_session");
  }
  return parsed;
}

function rowToRecord(row: {
  task_id: string;
  page_url: string;
  session_id: string;
  page_context_json: string;
  skill: string;
  status: string;
  created_at: string;
  updated_at: string;
}): WebOperatorTaskSessionRecord {
  return {
    taskId: row.task_id,
    pageUrl: row.page_url,
    sessionId: row.session_id,
    pageContext: parsePageContext(row.page_context_json),
    skill: row.skill ?? "",
    status: row.status === "archived" ? "archived" : "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resolveTaskSession(pageUrl: string): WebOperatorTaskSessionLookupResult {
  const normalized = pageUrl.trim();
  const taskId = buildTaskId(normalized);
  const db = getDb();
  const row = db
    .prepare(
      `SELECT task_id, page_url, session_id, page_context_json, skill, status, created_at, updated_at
       FROM task_session WHERE page_url = ? OR task_id = ? LIMIT 1`,
    )
    .get(normalized, taskId) as
    | {
        task_id: string;
        page_url: string;
        session_id: string;
        page_context_json: string;
        skill: string;
        status: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  return {
    taskId,
    pageUrl: normalized,
    record: row ? rowToRecord(row) : null,
  };
}

export function upsertTaskSession(
  input: WebOperatorTaskSessionUpsertInput,
): WebOperatorTaskSessionRecord {
  const ts = now();
  const db = getDb();
  const existing = db
    .prepare(`SELECT created_at FROM task_session WHERE task_id = ?`)
    .get(input.taskId) as { created_at: string } | undefined;

  const createdAt = existing?.created_at ?? ts;
  const pageContextJson = JSON.stringify(input.pageContext);
  const skill = input.skill ?? "";

  db.prepare(
    `INSERT INTO task_session (
      task_id, page_url, session_id, page_context_json, skill, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT(task_id) DO UPDATE SET
      page_url = excluded.page_url,
      session_id = excluded.session_id,
      page_context_json = excluded.page_context_json,
      skill = excluded.skill,
      status = 'active',
      updated_at = excluded.updated_at`,
  ).run(
    input.taskId,
    input.pageUrl.trim(),
    input.sessionId,
    pageContextJson,
    skill,
    createdAt,
    ts,
  );

  const row = db
    .prepare(
      `SELECT task_id, page_url, session_id, page_context_json, skill, status, created_at, updated_at
       FROM task_session WHERE task_id = ?`,
    )
    .get(input.taskId) as {
    task_id: string;
    page_url: string;
    session_id: string;
    page_context_json: string;
    skill: string;
    status: string;
    created_at: string;
    updated_at: string;
  };

  return rowToRecord(row);
}

export function removeTaskSession(taskId: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM task_session WHERE task_id = ?`).run(taskId);
}
