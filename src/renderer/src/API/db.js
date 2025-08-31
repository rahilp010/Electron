/* eslint-disable prettier/prettier */
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Use app.getPath('userData') for a writable directory
const dbPath = path.join(app.getPath('userData'), 'data.db');

// Initialize database
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// db.prepare('DROP TABLE products;').run();
// Execute SQL statements one by one
db.prepare(
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER DEFAULT 0,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER DEFAULT 0,
    addParts INTEGER DEFAULT 0 CHECK (addParts IN (0,1)),
    parts TEXT DEFAULT '[]',
    assetsType TEXT NOT NULL CHECK (assetsType IN ('Raw Material', 'Finished Goods', 'Assets')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
).run();


db.prepare(
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT NOT NULL,
    phoneNo TEXT,
    pendingAmount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    pendingFromOurs REAL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
).run()


db.prepare(
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sellAmount REAL NOT NULL,
    statusOfTransaction TEXT NOT NULL DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    paymentType TEXT NOT NULL DEFAULT 'full' CHECK (paymentType IN ('full', 'partial')),
    pendingAmount REAL NOT NULL DEFAULT 0,
    paidAmount REAL NOT NULL DEFAULT 0,
    transactionType TEXT CHECK (transactionType IN ('purchase', 'sale')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )`,
).run()

db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_productId ON transactions(productId)`).run();


export default db;
