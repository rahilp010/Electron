/* eslint-disable prettier/prettier */
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
// db.pragma('foreign_keys = ON')

// const columns = [`accounterType TEXT CHECK (accounterType IN ('Main', 'GPay', 'Client'))`]

// columns.forEach((col) => {
//   db.prepare(`ALTER TABLE accounts ADD COLUMN ${col}`).run()
// })

// db.prepare('DROP TABLE products;').run()
// db.prepare('DROP TABLE clients;').run()
// db.prepare('DROP TABLE accounts;').run()
// db.prepare('DROP TABLE ledger;').run()
// db.prepare('DROP TABLE purchases;').run()
// db.prepare('DROP TABLE sales;').run()
// Execute SQL statements one by one

db.prepare(
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER DEFAULT NULL,
    productName TEXT NOT NULL,
    productPrice REAL NOT NULL,
    productQuantity INTEGER DEFAULT 0,
    addParts INTEGER DEFAULT 0 CHECK (addParts IN (0,1)),
    parts TEXT DEFAULT '[]',
    assetsType TEXT DEFAULT 'Raw Material' CHECK (assetsType IN ('Raw Material', 'Finished Goods', 'Assets')),
    saleHSN TEXT,
    purchaseHSN TEXT,
    taxRate REAL DEFAULT 0,
    taxAmount REAL DEFAULT 0,
    totalAmountWithTax REAL DEFAULT 0,
    totalAmountWithoutTax REAL DEFAULT 0,
    pageName TEXT DEFAULT 'Product',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER DEFAULT NULL,
    accountName TEXT NOT NULL,
    accountType TEXT NOT NULL 
      CHECK (accountType IN ('Creditor', 'Debtor', 'Bank', 'Cash', 'Employee')),
    accounterType TEXT CHECK (accounterType IN ('Main', 'GPay', 'Client')),
    openingBalance REAL DEFAULT 0,
    closingBalance REAL DEFAULT 0,
    accountNumber TEXT,
    status TEXT DEFAULT 'active' 
      CHECK (status IN ('active', 'inactive')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
  )
`
).run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountId INTEGER,
    clientName TEXT NOT NULL,
    phoneNo TEXT,
    gstNo TEXT,
    address TEXT,
    accountType TEXT CHECK (accountType IN ('Creditor', 'Debtor')),
    accountNumber TEXT,
    pendingAmount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    pendingFromOurs REAL DEFAULT 0,
    pageName TEXT DEFAULT 'Client',
    isEmployee INTEGER DEFAULT 0 CHECK (isEmployee IN (0,1)),
    salary REAL DEFAULT 0,
    salaryHistory TEXT DEFAULT '[]',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS purchase_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaseId INTEGER NOT NULL,
    method TEXT,
    amount REAL,
    chequeNo TEXT,
    clientId INTEGER,
    accountId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE
  )
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    clientId INTEGER,
    productId INTEGER,
    date DATETIME,
    quantity INTEGER CHECK (quantity >= 1),
    saleAmount REAL CHECK (saleAmount >= 0),
    multipleProducts TEXT DEFAULT '[]',
    isMultiProduct INTEGER DEFAULT 0 CHECK (isMultiProduct IN (0,1)),
    paymentMethod TEXT DEFAULT 'bank'
      CHECK (paymentMethod IN ('cash','bank')),
    statusOfTransaction TEXT DEFAULT 'pending'
      CHECK (statusOfTransaction IN ('completed','pending','partial')),
    paymentType TEXT DEFAULT 'full'
      CHECK (paymentType IN ('full','partial')),

    pendingAmount REAL DEFAULT 0 CHECK (pendingAmount >= 0),
    paidAmount REAL DEFAULT 0 CHECK (paidAmount >= 0),
    pendingFromOurs REAL DEFAULT 0 CHECK (pendingFromOurs >= 0),

    taxRate REAL DEFAULT 0,
    taxAmount REAL,
    freightCharges REAL,
    freightTaxAmount REAL,

    totalAmountWithTax REAL,
    totalAmountWithoutTax REAL,

    billNo TEXT,

    methodType TEXT DEFAULT 'Receipt'
      CHECK (methodType IN ('Receipt','Payment','Salary')),

    dueDate DATETIME,
    description TEXT,
    payments TEXT DEFAULT '[]',

    pageName TEXT DEFAULT 'Sales',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
  )
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    clientId INTEGER,
    productId INTEGER,
    date DATETIME,
    quantity INTEGER CHECK (quantity >= 1),
    purchaseAmount REAL CHECK (purchaseAmount >= 0),
    multipleProducts TEXT DEFAULT '[]',
    isMultiProduct INTEGER DEFAULT 0 CHECK (isMultiProduct IN (0,1)),
    paymentMethod TEXT DEFAULT 'bank'
      CHECK (paymentMethod IN ('cash','bank')),
    statusOfTransaction TEXT DEFAULT 'pending'
      CHECK (statusOfTransaction IN ('completed','pending','partial')),
    paymentType TEXT DEFAULT 'full'
      CHECK (paymentType IN ('full','partial')),

    pendingAmount REAL DEFAULT 0 CHECK (pendingAmount >= 0),
    paidAmount REAL DEFAULT 0 CHECK (paidAmount >= 0),
    pendingFromOurs REAL DEFAULT 0 CHECK (pendingFromOurs >= 0),

    taxRate REAL DEFAULT 0,
    taxAmount REAL,
    freightCharges REAL,
    freightTaxAmount REAL,

    totalAmountWithTax REAL,
    totalAmountWithoutTax REAL,

    billNo TEXT,

    methodType TEXT DEFAULT 'Payment'
      CHECK (methodType IN ('Receipt','Payment','Salary')),

    dueDate DATETIME,
    description TEXT,
    payments TEXT DEFAULT '[]',

    pageName TEXT DEFAULT 'Purchase',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
  )
`
).run()

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountId INTEGER NOT NULL,
    clientId INTEGER,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    entryType TEXT CHECK (entryType IN ('debit', 'credit')),
    amount REAL,
    balanceAfter REAL,
    referenceType TEXT CHECK (referenceType IN ('Opening', 'Purchase', 'Sales', 'Payment', 'Adjustment', 'Transfer', 'Salary')),
    referenceId INTEGER,
    narration TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
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

export default db
