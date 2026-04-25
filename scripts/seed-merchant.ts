import { db } from '../src/lib/db';

async function main() {
  // 1. Find super admin user
  const admin = await db.user.findFirst({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true, fullName: true, role: true, isVerified: true },
  });

  if (!admin) {
    console.error('No admin user found!');
    process.exit(1);
  }

  console.log(`Found admin: ${admin.fullName} (${admin.role}) ID: ${admin.id}`);

  // 2. Check if merchant already exists
  const existing = await db.merchant.findUnique({ where: { userId: admin.id } });
  if (existing) {
    console.log(`Merchant already exists. Status: active=${existing.isActive}`);
    if (!existing.isActive) {
      await db.merchant.update({ where: { id: existing.id }, data: { isActive: true } });
      console.log('Merchant has been APPROVED!');
    } else {
      console.log('Merchant is already active.');
    }
    process.exit(0);
  }

  // 3. Generate API credentials
  const apiKey = 'zk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const apiSecret = 'zks_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // 4. Create and APPROVE merchant
  const merchant = await db.merchant.create({
    data: {
      userId: admin.id,
      businessName: 'زرین گلد (ادمین)',
      website: 'https://zarringold.com',
      callbackUrl: 'https://zarringold.com/api/gateway/webhook',
      description: 'حساب پذیرنده رسمی زرین گلد - مدیر سیستم',
      apiKey,
      apiSecret,
      feePercent: 0,
      isActive: true,
    },
  });

  console.log('✅ Merchant created and APPROVED!');
  console.log(`  ID: ${merchant.id}`);
  console.log(`  Business: ${merchant.businessName}`);
  console.log(`  API Key: ${apiKey}`);
  console.log(`  API Secret: ${apiSecret}`);
  console.log(`  Active: ${merchant.isActive}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
