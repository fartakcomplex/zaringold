import { db } from '../src/lib/db';

async function main() {
  // Get ALL sessions
  const allSessions = await db.userSession.findMany({
    select: { id: true, token: true, userId: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log('Recent sessions:');
  for (const s of allSessions) {
    // Check if user has merchant
    const merchant = await db.merchant.findUnique({ where: { userId: s.userId } });
    console.log(`  token=${s.token?.substring(0, 20)}... userId=${s.userId} merchant=${merchant ? 'YES (active=' + merchant.isActive + ')' : 'NO'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
