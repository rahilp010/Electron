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
db.prepare('DROP TABLE transactions;').run()
db.prepare('DROP TABLE bankReceipts;').run()
db.prepare('DROP TABLE cashReceipts;').run()
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
    pageName TEXT DEFAULT 'Product',
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
    pageName TEXT DEFAULT 'Client',
    isEmployee INTEGER DEFAULT 0 CHECK (isEmployee IN (0,1)),
    salary REAL DEFAULT 0,
    salaryHistory TEXT DEFAULT '[]',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER NOT NULL,
    productId INTEGER NULL,
    quantity INTEGER NOT NULL,
    sellAmount REAL NOT NULL,
    purchaseAmount REAL NOT NULL,
    totalAmount REAL,
    paymentMethod TEXT NOT NULL DEFAULT 'bank' CHECK (paymentMethod IN ('cash', 'bank')),
    statusOfTransaction TEXT NOT NULL DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    paymentType TEXT DEFAULT 'full' CHECK (paymentType IN ('full', 'partial')),
    pendingAmount REAL NOT NULL DEFAULT 0,
    paidAmount REAL NOT NULL DEFAULT 0,
    taxAmount TEXT,
    dueDate DATETIME,
    transactionType TEXT CHECK (transactionType IN ('purchase', 'sales')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    pageName TEXT DEFAULT 'Transaction',
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  )`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS bankReceipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId INTEGER,
  productId INTEGER NULL,
  transactionId INTEGER, 
  srNo TEXT,
  type TEXT NOT NULL CHECK (type IN ('Receipt', 'Payment', 'Salary')),
  bank TEXT NOT NULL,
  date DATETIME NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  taxAmount TEXT,
  statusOfTransaction TEXT DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
  dueDate DATETIME,
  paymentType TEXT DEFAULT 'full' CHECK (paymentType IN ('full', 'partial')),
  pendingAmount REAL DEFAULT 0,
  pendingFromOurs REAL DEFAULT 0,
  paidAmount REAL DEFAULT 0,
  quantity REAL,
  pageName TEXT DEFAULT 'Bank Receipt',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE
)
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cashReceipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    productId INTEGER NULL,
    transactionId INTEGER, 
    srNo TEXT,
    type TEXT NOT NULL CHECK (type IN ('Receipt', 'Payment', 'Salary')),
    cash TEXT NOT NULL,
    date DATETIME NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    taxAmount TEXT,
    statusOfTransaction TEXT DEFAULT 'pending' CHECK (statusOfTransaction IN ('completed', 'pending')),
    dueDate DATETIME,
    paymentType TEXT DEFAULT 'full' CHECK (paymentType IN ('full', 'partial')),
    pendingAmount REAL DEFAULT 0,
    pendingFromOurs REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    quantity REAL,
    pageName TEXT DEFAULT 'Cash Receipt',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
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

// Transaction indexes
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_clientId ON transactions(clientId)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_productId ON transactions(productId)`).run()
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_transactions_transactionType ON transactions(transactionType)`
).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_createdAt ON transactions(createdAt)`).run()

// // Bank Receipts
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_bankReceipts_transactionId ON bankReceipts(transactionId)`
).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bankReceipts_clientId ON bankReceipts(clientId)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bankReceipts_productId ON bankReceipts(productId)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_bankReceipts_date ON bankReceipts(date)`).run()

// // Cash Receipts
// db.prepare(
//   `CREATE INDEX IF NOT EXISTS idx_cashReceipts_transactionId ON cashReceipts(transactionId)`
// ).run()
// db.prepare(`CREATE INDEX IF NOT EXISTS idx_cashReceipts_clientId ON cashReceipts(clientId)`).run()
// db.prepare(`CREATE INDEX IF NOT EXISTS idx_cashReceipts_productId ON cashReceipts(productId)`).run()
// db.prepare(`CREATE INDEX IF NOT EXISTS idx_cashReceipts_date ON cashReceipts(date)`).run()

// Products
db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_clientId ON products(clientId)`).run()
db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`).run()

// Clients
db.prepare(`CREATE INDEX IF NOT EXISTS idx_clients_clientName ON clients(clientName)`).run()

export default db
