import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { NewsItem, NewNewsItem, Status, Category } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "feed.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DB_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL,
      source_name TEXT NOT NULL,
      category TEXT NOT NULL,
      published_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      version TEXT,
      prerelease INTEGER NOT NULL DEFAULT 0,
      issue_url TEXT
    )
  `);

  // Migration: add issue_url if missing (existing DBs)
  const columns = db
    .prepare("PRAGMA table_info(items)")
    .all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === "issue_url")) {
    db.exec("ALTER TABLE items ADD COLUMN issue_url TEXT");
  }

  // Migration: rename approved/rejected to included/excluded
  db.exec("UPDATE items SET status = 'included' WHERE status = 'approved'");
  db.exec("UPDATE items SET status = 'excluded' WHERE status = 'rejected'");

  return db;
}

export function insertItem(item: NewNewsItem): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items (title, url, description, source_type, source_name, category, published_at, fetched_at, status, version, prerelease)
    VALUES (@title, @url, @description, @source_type, @source_name, @category, @published_at, @fetched_at, 'pending', @version, @prerelease)
  `);
  stmt.run({
    title: item.title,
    url: item.url,
    description: item.description,
    source_type: item.source_type,
    source_name: item.source_name,
    category: item.category,
    published_at: item.published_at,
    fetched_at: new Date().toISOString(),
    version: item.version ?? null,
    prerelease: item.prerelease ? 1 : 0,
  });
}

export function insertItems(items: NewNewsItem[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO items (title, url, description, source_type, source_name, category, published_at, fetched_at, status, version, prerelease)
    VALUES (@title, @url, @description, @source_type, @source_name, @category, @published_at, @fetched_at, 'pending', @version, @prerelease)
  `);

  const now = new Date().toISOString();
  let inserted = 0;

  const tx = db.transaction(() => {
    for (const item of items) {
      const result = insert.run({
        title: item.title,
        url: item.url,
        description: item.description,
        source_type: item.source_type,
        source_name: item.source_name,
        category: item.category,
        published_at: item.published_at,
        fetched_at: now,
        version: item.version ?? null,
        prerelease: item.prerelease ? 1 : 0,
      });
      if (result.changes > 0) inserted++;
    }
  });
  tx();

  return inserted;
}

export function getItems(status?: Status, includeInIssue = false): NewsItem[] {
  const db = getDb();
  const issueFilter = includeInIssue ? "" : " AND issue_url IS NULL";
  const orderBy = "ORDER BY category, CASE WHEN source_type IN ('eip') THEN 1 ELSE 0 END, source_name, title";
  let rows;
  if (status) {
    rows = db
      .prepare(
        `SELECT * FROM items WHERE status = ?${issueFilter} ${orderBy}`
      )
      .all(status);
  } else {
    const where = includeInIssue ? "" : " WHERE issue_url IS NULL";
    rows = db.prepare(`SELECT * FROM items${where} ${orderBy}`).all();
  }
  return (rows as Array<Record<string, unknown>>).map(rowToItem);
}

export function getItemById(id: number): NewsItem | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToItem(row) : null;
}

export function updateItemStatus(id: number, status: Status): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE items SET status = ? WHERE id = ?")
    .run(status, id);
  return result.changes > 0;
}

export function updateItemCategory(id: number, category: Category): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE items SET category = ? WHERE id = ?")
    .run(category, id);
  return result.changes > 0;
}

export function updateItem(
  id: number,
  updates: { status?: Status; category?: Category; issue_url?: string | null }
): boolean {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.status) {
    sets.push("status = ?");
    values.push(updates.status);
  }
  if (updates.category) {
    sets.push("category = ?");
    values.push(updates.category);
  }
  if (updates.issue_url !== undefined) {
    sets.push("issue_url = ?");
    values.push(updates.issue_url);
  }

  if (sets.length === 0) return false;

  values.push(id);
  const result = db
    .prepare(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function bulkUpdateStatus(ids: number[], status: Status): number {
  const db = getDb();
  const placeholders = ids.map(() => "?").join(", ");
  const result = db
    .prepare(
      `UPDATE items SET status = ? WHERE id IN (${placeholders})`
    )
    .run(status, ...ids);
  return result.changes;
}

export function markItemsInIssue(issueUrl: string, itemUrls: string[]): number {
  if (itemUrls.length === 0) return 0;
  const db = getDb();
  const stmt = db.prepare(
    "UPDATE items SET issue_url = ? WHERE url = ? AND issue_url IS NULL"
  );
  let updated = 0;
  const tx = db.transaction(() => {
    for (const url of itemUrls) {
      const result = stmt.run(issueUrl, url);
      if (result.changes > 0) updated++;
    }
  });
  tx();
  return updated;
}

export function getAllItemUrls(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT url FROM items").all() as Array<{ url: string }>;
  return rows.map((r) => r.url);
}

function rowToItem(row: Record<string, unknown>): NewsItem {
  return {
    id: row.id as number,
    title: row.title as string,
    url: row.url as string,
    description: row.description as string,
    source_type: row.source_type as NewsItem["source_type"],
    source_name: row.source_name as string,
    category: row.category as NewsItem["category"],
    published_at: row.published_at as string,
    fetched_at: row.fetched_at as string,
    status: row.status as NewsItem["status"],
    version: (row.version as string) || null,
    prerelease: Boolean(row.prerelease),
    issue_url: (row.issue_url as string) || null,
  };
}
