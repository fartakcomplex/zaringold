import { db } from '../src/lib/db';

async function main() {
  const sessions = await db.userSession.findMany({
    where: { userId: 'cmo54xbyc0001pwm0iyanjkuo' },
    select: { id: true, token: true, userId: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  console.log('Sessions for logged-in user:');
  for (const s of sessions) {
    console.log(`  token=${s.token?.substring(0, 20)}... expires=${s.expiresAt}`);
  }
  
  // Also check what the /api/gateway/merchant/my endpoint would find
  // by checking if the token matches a session
  if (sessions.length > 0) {
    const session = await db.userSession.findUnique({
      where: { token: sessions[0].token },
    });
    console.log('\nToken lookup result:', session ? 'Found' : 'NOT FOUND');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
