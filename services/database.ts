import { createClient } from '@libsql/client';

const TURSO_URL = "https://crosssearch-lessxi.aws-ap-northeast-1.turso.io";
const TURSO_AUTH_TOKEN = ""; // 如果需要的话，在Turso后台生成

let db: ReturnType<typeof createClient> | null = null;
let initPromise: Promise<void> | null = null;

export function getDb() {
  if (!db) {
    db = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN || undefined,
    });
  }
  return db;
}

// Simple password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "cross-search-salt");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Initialize database schema with timeout
export async function initDb(): Promise<{ success: boolean; error?: string }> {
  if (initPromise) {
    try {
      await initPromise;
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  initPromise = (async () => {
    const client = getDb();

    // Create tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        result_id TEXT NOT NULL,
        result_data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  })();

  try {
    await Promise.race([
      initPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('连接超时，请检查网络')), 10000))
    ]);
    return { success: true };
  } catch (e) {
    initPromise = null;
    return { success: false, error: String(e) };
  }
}

// User registration
export async function registerUser(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const client = getDb();
    const passwordHash = await hashPassword(password);

    const existing = await client.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email]
    });

    if (existing.rows.length > 0) {
      return { success: false, error: '该邮箱已被注册' };
    }

    const userId = crypto.randomUUID();

    await client.execute({
      sql: "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
      args: [userId, email, passwordHash]
    });

    return { success: true, userId };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// User login
export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const client = getDb();

    const result = await client.execute({
      sql: "SELECT id, password_hash FROM users WHERE email = ?",
      args: [email]
    });

    if (result.rows.length === 0) {
      return { success: false, error: '用户不存在' };
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash as string);

    if (!isValid) {
      return { success: false, error: '密码错误' };
    }

    return { success: true, userId: user.id as string };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Get bookmarks for user
export async function getBookmarks(userId: string): Promise<string[]> {
  try {
    const client = getDb();
    const result = await client.execute({
      sql: "SELECT result_id FROM bookmarks WHERE user_id = ?",
      args: [userId]
    });
    return result.rows.map(row => row.result_id as string);
  } catch (err) {
    return [];
  }
}

// Add bookmark
export async function addBookmark(userId: string, resultId: string, resultData: string): Promise<boolean> {
  try {
    const client = getDb();
    await client.execute({
      sql: "INSERT OR IGNORE INTO bookmarks (user_id, result_id, result_data) VALUES (?, ?, ?)",
      args: [userId, resultId, resultData]
    });
    return true;
  } catch (err) {
    return false;
  }
}

// Remove bookmark
export async function removeBookmark(userId: string, resultId: string): Promise<boolean> {
  try {
    const client = getDb();
    await client.execute({
      sql: "DELETE FROM bookmarks WHERE user_id = ? AND result_id = ?",
      args: [userId, resultId]
    });
    return true;
  } catch (err) {
    return false;
  }
}
