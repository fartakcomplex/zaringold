import { db } from '../src/lib/db';

async function main() {
  // The currently logged in super admin
  const TARGET_USER_ID = 'cmo54xbyc0001pwm0iyanjkuo';

  // Check existing merchant
  const existing = await db.merchant.findUnique({ where: { userId: TARGET_USER_ID } });
  if (existing) {
    console.log('Merchant already exists for current user. Active:', existing.isActive);
    if (!existing.isActive) {
      await db.merchant.update({ where: { id: existing.id }, data: { isActive: true } });
      console.log('✅ Merchant approved!');
    }
    return;
  }

  // Generate API credentials
  const apiKey = 'zk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const apiSecret = 'zks_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Create and APPROVE merchant
  const merchant = await db.merchant.create({
    data: {
      userId: TARGET_USER_ID,
      businessName: 'زرین گلد (سوپر ادمین)',
      website: 'https://zarringold.com',
      callbackUrl: 'https://zarringold.com/api/gateway/webhook',
      description: 'حساب پذیرنده رسمی زرین گلد - سوپر ادمین سیستم',
      apiKey,
      apiSecret,
      feePercent: 0,
      isActive: true,
    },
  });

  console.log('✅ Merchant created and APPROVED for current user!');
  console.log(`  ID: ${merchant.id}`);
  console.log(`  Business: ${merchant.businessName}`);
  console.log(`  API Key: ${apiKey}`);
  console.log(`  Active: ${merchant.isActive}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
