-- Create Admins Table
CREATE TABLE IF NOT EXISTS "admins" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "userName" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS "orders" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderId" TEXT NOT NULL UNIQUE,
  "formData" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "currency" TEXT DEFAULT 'EUR',
  "paymentIntentId" TEXT NOT NULL UNIQUE,
  "paymentMethod" TEXT,
  "paypalCaptureId" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending',
  "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create Refunds Table
CREATE TABLE IF NOT EXISTS "refunds" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "order_id" TEXT NOT NULL,
  "refunded_by" INTEGER NOT NULL,
  "refunded_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  "paypal_refund_id" TEXT,
  FOREIGN KEY ("order_id") REFERENCES "orders" ("orderId"),
  FOREIGN KEY ("refunded_by") REFERENCES "admins" ("id")
);

-- Insert default admin (username: admin, password: admin123)
INSERT OR IGNORE INTO "admins" ("userName", "password") VALUES (
  'admin',
  '$2b$10$eWfKEMR1VnLr7i/KoCXD2u2zHLz9n15d90keYfTxDyNUl38eMGSLa'
);
