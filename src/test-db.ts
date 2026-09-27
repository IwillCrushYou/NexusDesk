import { prisma } from "./lib/prisma";

async function main() {
  const result = await prisma.$queryRaw<
    { current_user: string; current_database: string }[]
  >`
    SELECT current_user, current_database()
  `;

  console.log(result);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });