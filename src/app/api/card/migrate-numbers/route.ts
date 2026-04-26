import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

/**
 * POST /api/card/migrate-numbers
 * مهاجرت شماره کارت‌های قدیمی (حاوی حروف hex) به شماره‌های کاملاً عددی
 * فقط یکبار اجرا می‌شود
 */
export async function POST() {
  try {
    // پیدا کردن کارت‌هایی که شماره غیرعددی دارند
    const allCards = await db.goldCard.findMany({
      select: { id: true, userId: true, cardNumber: true },
    })

    if (allCards.length === 0) {
      return NextResponse.json({ success: true, message: 'هیچ کارتی برای مهاجرت وجود ندارد' })
    }

    const needsMigration = allCards.filter(c => !/^\d{16}$/.test(c.cardNumber))

    if (needsMigration.length === 0) {
      return NextResponse.json({ success: true, message: 'همه کارت‌ها قبلاً مهاجرت شده‌اند', total: allCards.length, migrated: 0 })
    }

    // تولید شماره جدید عددی برای هر کارت
    const updates: Array<{ id: string; oldNumber: string; newNumber: string }> = []

    for (const card of needsMigration) {
      const newNumber = generateNumericCardNumber(card.userId)

      // بررسی یکتا بودن
      const existing = await db.goldCard.findFirst({ where: { cardNumber: newNumber } })
      if (existing && existing.id !== card.id) {
        // اگر تکراری بود، یک عدد تصادفی اضافه کن
        const randSuffix = String(crypto.randomInt(100, 999))
        const altNumber = '6277' + newNumber.slice(4, 13) + randSuffix
        const existingAlt = await db.goldCard.findFirst({ where: { cardNumber: altNumber } })
        if (!existingAlt) {
          await db.goldCard.update({ where: { id: card.id }, data: { cardNumber: altNumber } })
          updates.push({ id: card.id, oldNumber: card.cardNumber, newNumber: altNumber })
        }
        continue
      }

      await db.goldCard.update({ where: { id: card.id }, data: { cardNumber: newNumber } })
      updates.push({ id: card.id, oldNumber: card.cardNumber, newNumber })
    }

    return NextResponse.json({
      success: true,
      message: `${updates.length} کارت با موفقیت مهاجرت شد`,
      total: allCards.length,
      migrated: updates.length,
      details: updates,
    })
  } catch (error) {
    console.error('Card number migration error:', error)
    return NextResponse.json({ success: false, message: 'خطا در مهاجرت شماره کارت‌ها' }, { status: 500 })
  }
}

function generateNumericCardNumber(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex')
  let numeric = ''
  for (let i = 0; i < hash.length - 1; i += 2) {
    const byte = parseInt(hash.substring(i, i + 2), 16) // 0-255
    numeric += byte.toString().padStart(3, '0')
  }
  return '6277' + numeric.slice(0, 12)
}
