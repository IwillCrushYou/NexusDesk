"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./lib/prisma");
async function main() {
    const result = await prisma_1.prisma.$queryRaw `
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
    await prisma_1.prisma.$disconnect();
});
