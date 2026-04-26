import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    select: { id: true, fullName: true, role: true, isVerified: true, phone: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('All users:');
  for (const u of users) {
    console.log(`  ${u.id} | ${u.fullName} | role=${u.role} | verified=${u.isVerified} | phone=${u.phone}`);
  }
  
  const merchants = await db.merchant.findMany({
    select: { id: true, userId: true, businessName: true, isActive: true },
  });
  console.log('\nMerchants:');
  for (const m of merchants) {
    console.log(`  ${m.id} | userId=${m.userId} | ${m.businessName} | active=${m.isActive}`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
