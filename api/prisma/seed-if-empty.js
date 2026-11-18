// Dipakai saat deploy: isi data contoh hanya jika database masih kosong
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

prisma.user.count().then(async (total) => {
  await prisma.$disconnect();
  if (total === 0) require("./seed");
  else console.log("Data sudah ada, seed dilewati");
});
