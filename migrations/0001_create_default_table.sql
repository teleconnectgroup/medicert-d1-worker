CREATE TABLE "admins" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "userName" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

CREATE TABLE "orders" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderId" TEXT NOT NULL UNIQUE,
  "formData" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "currency" TEXT DEFAULT 'EUR',
  "paymentIntentId" TEXT NOT NULL UNIQUE,
  "paymentMethod" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending',
  "createdAt" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT DEFAULT CURRENT_TIMESTAMP
);
