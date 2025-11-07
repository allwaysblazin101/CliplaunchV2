import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
(async () => {
  const rows = await db.video.findMany({ orderBy: { createdAt: 'desc' }});
  console.log(JSON.stringify(rows, null, 2));
  await db.$disconnect();
})();
