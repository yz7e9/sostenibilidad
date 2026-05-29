import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "sostenibilidad.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    inicializarTablas();
    seedUsuarioPorDefecto();
  }
  return db;
}

function inicializarTablas(): void {
  db!.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedUsuarioPorDefecto(): void {
  const count = db!
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };

  if (count.count === 0) {
    const hash = bcrypt.hashSync("sostenibilidad2026", 10);
    db!.prepare(
      "INSERT INTO users (email, nombre, password) VALUES (?, ?, ?)",
    ).run("admin@sostenibilidad.com", "Admin", hash);
    console.log("[DB] Usuario por defecto creado: admin@sostenibilidad.com / sostenibilidad2026");
  }
}

export interface UserRow {
  id: number;
  email: string;
  nombre: string;
  password: string;
  created_at: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
}

export function findUserById(id: number): Omit<UserRow, "password"> | undefined {
  const user = getDb()
    .prepare("SELECT id, email, nombre, created_at FROM users WHERE id = ?")
    .get(id) as Omit<UserRow, "password"> | undefined;
  return user;
}

export function createUser(
  email: string,
  nombre: string,
  password: string,
): Omit<UserRow, "password"> {
  const hash = bcrypt.hashSync(password, 10);
  const result = getDb()
    .prepare("INSERT INTO users (email, nombre, password) VALUES (?, ?, ?)")
    .run(email, nombre, hash);
  return {
    id: result.lastInsertRowid as number,
    email,
    nombre,
    created_at: new Date().toISOString(),
  };
}
