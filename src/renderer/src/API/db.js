import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

// Use app.getPath('userData') for a writable directory
const dbPath = app.isPackaged
  ? path.join(process.resourcesPath, 'data.db')
  : path.join(process.cwd(), 'data.db')

// Initialize database
const db = new Database(dbPath)

// Enable foreign key constraints
db.pragma('foreign_keys = ON')

// db.prepare('DROP TABLE products;').run()
// db.prepare('DROP TABLE clients;').run()
// db.prepare('DROP TABLE transactions;').run()
// db.prepare('DROP TABLE bankReceipts;').run()
// db.prepare('DROP TABLE cashReceipts;').run()
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
    taxAmount REAL,
    assetsType TEXT DEFAULT 'Raw Material' CHECK (assetsType IN ('Raw Material', 'Finished Goods', 'Assets')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT NOT NULL,
    phoneNo TEXT,
    gstNo TEXT,
    address TEXT,
    pendingAmount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    pendingFromOurs REAL DEFAULT 0,
    accountType TEXT CHECK (accountType IN ('Creditors', 'Debtors')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sellAmount REAL NOT NULL,
    purchaseAmount REAL NOT NULL,
    totalAmount REAL,
    paymentMethod TEXT NOT NULL DEFAULT 'bank' CHECK (paymentMethod IN ('cash', 'bank')),
    statusOfTransaction TEXT NOT NULL DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    paymentType TEXT NOT NULL DEFAULT 'full' CHECK (paymentType IN ('full', 'partial')),
    pendingAmount REAL NOT NULL DEFAULT 0,
    paidAmount REAL NOT NULL DEFAULT 0,
    taxAmount TEXT,
    dueDate DATETIME,
    transactionType TEXT CHECK (transactionType IN ('purchase', 'sales')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS bankReceipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transactionId INTEGER, 
    type TEXT NOT NULL CHECK (type IN ('Receipt', 'Payment')),
    bank TEXT NOT NULL,
    date DATETIME NOT NULL,
    party TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    taxAmount TEXT,
    statusOfTransaction TEXT NOT NULL DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    dueDate DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE
  )
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cashReceipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transactionId INTEGER, 
    srNo TEXT,
    type TEXT NOT NULL CHECK (type IN ('Receipt', 'Payment')),
    cash TEXT NOT NULL,
    date DATETIME NOT NULL,
    party TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    taxAmount TEXT,
    statusOfTransaction TEXT NOT NULL DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    dueDate DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE
  )
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxName TEXT NOT NULL,
    taxValue TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`
).run()

db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_productId ON transactions(productId)`).run()
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_transactions_transactionType ON transactions(transactionType)`
).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bankReceipts_bank ON bankReceipts(bank)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_cashReceipts_cash ON cashReceipts(cash)`).run()

export default db
