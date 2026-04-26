import { db } from '../src/lib/db';

async function main() {
  const userId = 'cmo54xbyc0001pwm0iyanjkuo';

  const merchant = await db.merchant.findUnique({ where: { userId } });
  if (!merchant) { console.error('No merchant found'); process.exit(1); }

  const wallet = await db.goldWallet.findUnique({ where: { userId } });
  const latestPrice = await db.goldPrice.findFirst({ orderBy: { createdAt: 'desc' } });
  const goldPrice = latestPrice?.marketPrice || 35000000;

  const amountGrams = 0.05;
  const amountFiat = amountGrams * goldPrice;
  const feeGrams = amountGrams * (merchant.feePercent / 100);

  const payment = await db.externalPayment.create({
    data: {
      merchantId: merchant.id,
      userId,
      amountGrams,
      amountFiat,
      feeGrams,
      goldPrice,
      description: 'خرید تستی - بررسی روال درگاه پرداخت زرین گلد',
      merchantOrderId: 'TEST-' + Date.now().toString(36).toUpperCase(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'ZarrinGold Internal Test',
    },
  });

  console.log('✅ سفارش تستی با موفقیت ایجاد شد!');
  console.log('════════════════════════════════════════════');
  console.log('📋 شناسه پرداخت:', payment.id);
  console.log('🛒 شماره سفارش:', payment.merchantOrderId);
  console.log('⚖️  مقدار طلا:', payment.amountGrams, 'گرم');
  console.log('💵 معادل ریالی:', Math.round(payment.amountFiat).toLocaleString('fa-IR'), 'تومان');
  console.log('💼 کارمزد:', payment.feeGrams, 'گرم');
  console.log('📈 قیمت طلا:', Math.round(payment.goldPrice).toLocaleString('fa-IR'), 'تومان/گرم');
  console.log('💰 موجودی فعلی:', wallet?.goldGrams || 0, 'گرم');
  console.log('⏰ مهلت:', payment.expiresAt.toLocaleString('fa-IR'));
  console.log('📌 وضعیت:', payment.status);
  console.log('🔗 لینک پرداخت:', `/pay/${payment.id}`);
  console.log('════════════════════════════════════════════');
  console.log('\n👨‍💼 پذیرنده:', merchant.businessName);
  console.log('🔑 API Key:', merchant.apiKey);
  console.log('🔐 API Secret:', merchant.apiSecret);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
