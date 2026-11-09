// Test memakai database terpisah supaya data development tidak terhapus
process.env.TZ = "Asia/Jakarta";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgresql://gelar:gelar@localhost:5440/gelar_test";
process.env.JWT_SECRET = "test-secret";
process.env.WEB_URL = "http://localhost:5173";
