import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
(async () => {
  try {
    const count = await db.video.count();
    console.log('video.count', count);
  } catch (e:any) {
    console.error('query_failed', e.message);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
})();
